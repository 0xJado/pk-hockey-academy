import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { interviewDefinitions } from "../src/data/interviews.ts";

async function capture(page, path) {
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
  await page.waitForFunction(() => scrollY === 0);
  await page.screenshot({ path, fullPage: true });
}
export async function runInterviewJourneys(page, context, origin, output) {
  await context.addInitScript(() => {
    window.__speechInstances = [];
    window.__printCalls = 0;
    window.__readCalls = 0;
    window.print = () => {
      window.__printCalls++;
    };
    class FakeSpeech {
      start() {
        window.__speechInstances.push(this);
        this.savedResult = Reflect.get(this, "onresult");
        this.savedError = Reflect.get(this, "onerror");
        Reflect.get(this, "onstart")?.();
      }
      stop() {
        Reflect.get(this, "onend")?.();
      }
      abort() {
        this.aborted = true;
      }
    }
    Object.defineProperty(window, "SpeechRecognition", {
      value: FakeSpeech,
      configurable: true,
    });
    window.speechSynthesis.cancel = () => {};
    window.speechSynthesis.speak = () => {
      window.__readCalls++;
    };
  });
  for (const kind of ["player", "trainer"]) {
    await page.goto(
      origin +
        (kind === "player" ? "/spieler-interview" : "/trainer-interview"),
    );
    const root = page.locator("[data-interview]"),
      answer = root.locator("[data-answer]"),
      next = root.locator("[data-action=next]");
    assert.equal(await page.evaluate(() => window.__speechInstances.length), 0);
    await root.locator("[data-action=start]").click();
    assert.ok(await root.locator("[data-stage=welcome]").isVisible());
    assert.ok(await root.locator("[data-start-error]").isVisible());
    await root.locator("[data-test-confirmation]").check();
    await root.locator("[data-action=start]").click();
    if (kind === "trainer") {
      await next.click();
      assert.ok(await root.locator("[data-question-error]").isVisible());
      assert.ok(await root.locator("[data-action=skip]").isDisabled());
    }
    await answer.fill("Erfundener Testname");
    await next.click();
    await root.locator("[data-action=back]").click();
    assert.equal(await answer.inputValue(), "Erfundener Testname");
    await next.click();
    // Capture callbacks before disposal, then deliberately deliver them late.
    await root.locator(".interview-voice-settings summary").click();
    await root.locator("[data-voice-consent]").check();
    await root.locator("[data-action=read]").click();
    assert.equal(await page.evaluate(() => window.__readCalls), 1);
    assert.equal(await page.evaluate(() => window.__speechInstances.length), 0);
    await root.locator("[data-action=listen]").click();
    await page.waitForFunction(() => window.__speechInstances.length === 1);
    await next.click();
    await page.evaluate(() => {
      const r = window.__speechInstances[0];
      r.savedResult?.({
        results: [[{ transcript: "LATE_TRANSCRIPT_MUST_NOT_APPEAR" }]],
      });
      r.savedError?.({ error: "not-allowed" });
    });
    assert.equal(await answer.inputValue(), "");
    assert.ok(await page.evaluate(() => window.__speechInstances[0].aborted));
    // Traverse every base question and every generated fixed follow-up. Skip one base.
    let turns = 0,
      skipped = false,
      skippedFollow = false;
    while (await root.locator("[data-stage=question]").isVisible()) {
      assert.ok(++turns < 65, "Interview did not terminate");
      const progress = await root.locator("[data-progress-text]").textContent();
      const follow = progress.includes("Rückfrage");
      if (follow && !skippedFollow) {
        await root.locator("[data-action=skip]").click();
        skippedFollow = true;
      } else if (
        !follow &&
        !skipped &&
        !(await root.locator("[data-action=skip]").isDisabled())
      ) {
        await root.locator("[data-action=skip]").click();
        skipped = true;
      } else {
        await answer.fill(
          follow
            ? "Erfundene Antwort auf eine Rückfrage."
            : "Erfundene Antwort zum Hockeytraining mit meiner Familie.",
        );
        await next.click();
      }
    }
    assert.ok(await root.locator("[data-stage=review]").isVisible());
    assert.equal(
      await root.locator("[data-review-item]").count(),
      interviewDefinitions[kind].questions.length,
    );
    const first = interviewDefinitions[kind].questions[0].id;
    const field = root.locator(`[data-review-id="${first}"][data-part=answer]`);
    const literal =
      "<script>window.__interviewInjection=true</script> " +
      "Erfundene lange Antwort. ".repeat(70) +
      "ENDE_DER_TESTANTWORT";
    await field.fill(literal);
    await capture(page, resolve(output, `${kind}-review-mobile.png`));
    if (kind === "trainer") {
      await field.fill("");
      await root.locator("[data-action=download]").click();
      assert.ok(await root.locator("[data-review-error]").isVisible());
      await field.fill(literal);
    }
    await root.locator('[data-edit-index="0"]').click();
    assert.equal(await answer.inputValue(), literal);
    // Revisit all questions while retaining their previous values.
    turns = 0;
    while (await root.locator("[data-stage=question]").isVisible()) {
      assert.ok(++turns < 65);
      await next.click();
    }
    assert.equal(await field.inputValue(), literal);
    const download = page.waitForEvent("download");
    await root.locator("[data-action=download]").click();
    const file = await download;
    await file.saveAs(resolve(output, `${kind}-answers.json`));
    const exported = JSON.parse(await readFile(await file.path(), "utf8"));
    assert.equal(exported.kind, kind);
    assert.equal(exported.testOnly, true);
    assert.equal(exported.reviewedForPublication, false);
    assert.equal(
      exported.answers.length,
      interviewDefinitions[kind].questions.length,
    );
    assert.equal(exported.answers[0].answer, literal);
    assert.equal(
      await page.evaluate(() => window.__interviewInjection),
      undefined,
    );
    assert.ok(!JSON.stringify(exported).includes("LATE_TRANSCRIPT"));
    assert.ok(
      exported.answers.some(
        (item) => item.followUpQuestion && !item.followUpAnswer,
      ),
    );
    await root.locator("[data-action=print]").click();
    assert.equal(await page.evaluate(() => window.__printCalls), 1);
    await page.emulateMedia({ media: "print" });
    assert.ok(await root.locator("[data-print-profile]").isVisible());
    assert.match(
      await root.locator("[data-print-profile]").textContent(),
      /ENDE_DER_TESTANTWORT/,
    );
    await page.pdf({
      path: resolve(output, `${kind}-profile.pdf`),
      format: "A4",
    });
    assert.ok(
      (await readFile(resolve(output, `${kind}-profile.pdf`))).length > 1000,
    );
    await page.emulateMedia({ media: "screen" });
    assert.equal(await root.locator("[data-print-profile]").isVisible(), false);
    await root.locator("[data-stage=review] [data-action=reset]").click();
    await root.locator("[data-action=cancel-reset]").click();
    assert.equal(await field.inputValue(), literal);
    await root.locator("[data-stage=review] [data-action=reset]").click();
    await root.locator("[data-action=confirm-reset]").click();
    assert.ok(await root.locator("[data-stage=welcome]").isVisible());
    assert.equal(
      await root.locator("[data-test-confirmation]").isChecked(),
      false,
    );
    await root.locator("[data-test-confirmation]").check();
    await root.locator("[data-action=start]").click();
    assert.equal(await answer.inputValue(), "");
    await answer.fill("Erfundene flüchtige Antwort");
    await page.goto(origin + "/interviews");
    await page.goBack();
    await page.waitForFunction(
      () => document.querySelector("[data-stage=welcome]")?.hidden === false,
    );
    assert.equal(await root.locator("[data-answer]").inputValue(), "");
    console.log(
      `${kind}: completed answers, skips, corrections, JSON download, print/PDF, reset, navigation clearing and late-speech rejection.`,
    );
  }
}
