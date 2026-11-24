import assert from "node:assert/strict";
import { spawn, spawnSync } from "node:child_process";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { createServer } from "node:net";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import { trainerProductionQuestions } from "../src/lib/interview/trainer-profile.ts";

const php = process.env.PK_INTERVIEW_PHP || "php";
const extensions = process.env.PK_INTERVIEW_PHP_EXT;
const phpOptions = extensions
  ? ["-d", "extension_dir=" + extensions, "-d", "extension=pdo_sqlite", "-d", "extension=sodium"]
  : [];
const output = fileURLToPath(new URL("../../output/", import.meta.url));
await mkdir(output, { recursive: true });
const root = await mkdtemp(join(output, "trainer-interview-audit-"));
const router = fileURLToPath(new URL("../../hosting/strato/tests/trainer-interview-router.php", import.meta.url));
const socket = createServer();
await new Promise((resolve) => socket.listen(0, "127.0.0.1", resolve));
const port = socket.address().port;
await new Promise((resolve) => socket.close(resolve));
const origin = "http://127.0.0.1:" + port;
const env = { ...process.env, PK_INTERVIEW_FIXTURE: root, PK_INTERVIEW_ORIGIN: origin };
let server;
let browser;
try {
  await writeFile(join(root, "questions.json"), JSON.stringify(trainerProductionQuestions));
  const init = spawnSync(php, [...phpOptions, router], { env, encoding: "utf8" });
  assert.equal(init.status, 0, init.stderr || init.error?.message);
  server = spawn(php, [...phpOptions, "-S", "127.0.0.1:" + port, router], {
    env, cwd: dirname(router), stdio: ["ignore", "ignore", "pipe"],
  });
  let stderr = "";
  server.stderr.on("data", (chunk) => { stderr += chunk; });
  for (let attempt = 0; attempt < 60; attempt++) {
    try {
      await fetch(origin + "/coach/interview");
      break;
    } catch {
      if (attempt === 59) throw new Error(stderr);
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }

  browser = await chromium.launch();
  const staff = await browser.newPage();
  const anonymous = await staff.goto(origin + "/intern/trainerinterviews");
  assert.equal(anonymous.status(), 403);
  await staff.goto(origin + "/intern/anmeldungen");
  await staff.getByLabel("Kennung").fill("fixture-owner");
  await staff.getByLabel("Passwort").fill("SYNTHETIC-staff-password-only");
  await staff.getByRole("button", { name: "Anmelden", exact: true }).click();
  await staff.goto(origin + "/intern/trainerinterviews");
  await staff.getByRole("button", { name: "Persönlichen Link erstellen" }).click();
  const link = await staff.getByLabel("Persönlicher Link für WhatsApp").inputValue();
  await staff.getByRole("button", { name: "Persönlichen Link erstellen" }).click();
  const secondLink = await staff.getByLabel("Persönlicher Link für WhatsApp").inputValue();
  const cleanUrl = link.split("#")[0];
  const preview = await fetch(cleanUrl);
  assert.equal(preview.status, 200);
  assert.equal(preview.headers.get("set-cookie"), null);
  assert.doesNotMatch(await preview.text(), /name="answers/);

  const coachContext = await browser.newContext({ viewport: { width: 375, height: 812 } });
  const coach = await coachContext.newPage();
  await coach.addInitScript(() => {
    window.SpeechRecognition = class {
      start() {
        window.lastRecognition = this;
      }
      abort() {}
    };
    Object.defineProperty(window, "speechSynthesis", {
      value: { speak: (utterance) => { window.spokenQuestion = utterance.text; }, cancel() {} },
    });
  });
  const errors = [];
  coach.on("pageerror", (error) => errors.push(error.message));
  await coach.goto(link);
  await coach.locator("#interview-form").waitFor();
  assert.equal(new URL(coach.url()).hash, "");
  assert.equal(await coach.locator("textarea[required]").count(), 1);
  assert.equal(await coach.locator("[data-answer]").count(), 13);
  assert.equal(await coach.locator("details").count(), 9);
  assert.equal(await coach.evaluate(() => document.documentElement.scrollWidth), 375);
  await coach.getByRole("button", { name: "Frage vorlesen" }).first().click();
  assert.match(await coach.evaluate(() => window.spokenQuestion), /Vor- und Nachnamen/);
  assert.equal(await coach.getByRole("button", { name: "Antwort sprechen" }).first().isDisabled(), true);
  await coach.getByLabel("Optionale Spracheingabe aktivieren.", { exact: false }).check();
  await coach.getByRole("button", { name: "Antwort sprechen" }).first().click();
  await coach.evaluate(() => window.lastRecognition.onresult({ results: [[{ transcript: "Fictional dictation" }]] }));
  assert.equal(await coach.locator('[name="answers[name][answer]"]').inputValue(), "Fictional dictation");
  await coach.locator('[name="answers[name][answer]"]').fill("Fictional <script>Coach</script>");
  await coach.locator('[name="answers[role][answer]"]').fill("Skating");
  await coach.locator('[name="answers[intro][answer]"]').fill("Fictional biography.");
  await coach.locator('[name="answers[contact][answer]"]').fill("internal@example.invalid");
  const sameBrowser = await coachContext.newPage();
  await sameBrowser.setViewportSize({ width: 768, height: 900 });
  await sameBrowser.goto(secondLink);
  await sameBrowser.locator("#interview-form").waitFor();
  assert.equal(await sameBrowser.locator('[name="answers[name][answer]"]').inputValue(), "");
  assert.equal(await sameBrowser.evaluate(() => document.documentElement.scrollWidth), 768);
  await coach.getByRole("button", { name: "Entwurf speichern" }).click();
  await coach.getByText("Der Entwurf wurde inzwischen geändert.", { exact: false }).waitFor();
  await sameBrowser.goto(link);
  await sameBrowser.waitForURL(cleanUrl);
  await sameBrowser.locator("#interview-form").waitFor();
  await sameBrowser.close();
  await coach.getByRole("button", { name: "Entwurf speichern" }).click();
  await coach.getByText("Antworten gespeichert um", { exact: false }).waitFor();

  const resumed = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await resumed.goto(link);
  await resumed.locator("#interview-form").waitFor();
  assert.equal(await resumed.locator('[name="answers[role][answer]"]').inputValue(), "Skating");
  await resumed.locator('[name="publishProfile"]').check();
  await resumed.locator('[name="photo"]').setInputFiles({
    name: "bad.png", mimeType: "image/png", buffer: Buffer.from("<script>bad</script>"),
  });
  await resumed.getByRole("button", { name: "Interview absenden" }).click();
  await resumed.getByText("Bitte prüfe deine Angaben", { exact: false }).waitFor();
  await resumed.locator('[name="photo"]').setInputFiles({
    name: "fixture.png", mimeType: "image/png",
    buffer: Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wl6T0UAAAAASUVORK5CYII=", "base64"),
  });
  await resumed.locator('[name="publishPhoto"]').check();
  await resumed.getByRole("button", { name: "Interview absenden" }).click();
  await resumed.getByText("Dein Trainerinterview ist eingegangen.", { exact: false }).waitFor();
  await resumed.reload();
  await resumed.getByText("Dein Trainerinterview ist eingegangen.", { exact: false }).waitFor();
  await coach.getByRole("button", { name: "Entwurf speichern" }).click();
  await coach.getByText("Der Entwurf wurde inzwischen geändert.", { exact: false }).waitFor();
  assert.deepEqual(errors, []);

  const crossOrigin = await fetch(cleanUrl, {
    method: "POST", headers: { Origin: "http://unrelated.invalid" },
    body: new URLSearchParams({ action: "open", invitation: link.split("=")[1] }),
  });
  assert.equal(crossOrigin.status, 422);
  assert.equal(crossOrigin.headers.get("set-cookie"), null);

  await staff.goto(origin + "/intern/trainerinterviews");
  await staff.getByText("E-Mail noch nicht bestätigt").waitFor();
  await staff.getByRole("link", { name: "Abgeschlossenes Interview" }).click();
  assert.equal(await staff.getByLabel("Name", { exact: true }).inputValue(), "Fictional <script>Coach</script>");
  await staff.getByLabel("Biografie", { exact: true }).fill("Edited public draft.");
  assert.doesNotMatch(await staff.locator("section").first().innerText(), /internal@example/);
  const detail = staff.url();
  const denied = await fetch(detail + "&download=json");
  assert.equal(denied.status, 403);
  const json = await staff.request.get(detail + "&download=json");
  assert.match(json.headers()["content-disposition"], /attachment/);
  assert.equal((await json.json()).answers.contact.answer, "internal@example.invalid");
  const photo = await staff.request.get(detail + "&download=photo");
  assert.equal(photo.headers()["content-type"], "image/png");
  const pdf = await staff.pdf({ format: "A4" });
  assert.match(pdf.subarray(0, 5).toString(), /%PDF/);
  await writeFile(join(root, "mail-ready"), "");
  for (let attempt = 0; attempt < 2; attempt++) {
    await staff.goto(detail);
    await staff.getByRole("button", { name: "Benachrichtigung erneut prüfen" }).click();
  }
  assert.equal(await readFile(join(root, "mail.log"), "utf8"), "generic alert\n");
  await staff.goto(detail);
  await staff.getByText("Interviewbearbeitung abschließen", { exact: true }).click();
  await staff.getByRole("button", { name: "Rohdaten löschen und abschließen" }).click();
  const closed = await staff.request.get(detail + "&download=json");
  const evidence = await closed.json();
  assert.equal(evidence.closed, true);
  assert.equal(evidence.publishPhoto, true);
  assert.equal(evidence.answers, undefined);
  assert.equal((await staff.request.get(detail + "&download=photo")).status(), 403);
  console.log("Trainer interview browser audit passed: invitation, isolation, resume, upload, receipt, inbox, exports, mail retry and cleanup.");
} finally {
  await browser?.close();
  if (server && server.exitCode === null) {
    const closed = new Promise((resolve) => server.once("close", resolve));
    server.kill();
    await closed;
  }
  await rm(root, { recursive: true, force: true });
}
