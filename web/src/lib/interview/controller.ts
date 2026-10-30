import {
  answerLimit,
  interviewDefinitions,
  type InterviewKind,
} from "../../data/interviews.ts";
import { InterviewSession } from "./model.ts";
import { SpeechCapture, type SpeechWindow } from "./speech.ts";

function mountInterview(root: HTMLElement): () => void {
  const kind = root.dataset.interview;
  if (kind !== "player" && kind !== "trainer") return () => {};
  const session = new InterviewSession(kind as InterviewKind);
  const definition = interviewDefinitions[kind];
  const lifecycle = new AbortController();
  const signal = lifecycle.signal;
  const find = <T extends HTMLElement>(selector: string): T => {
    const target = root.querySelector<T>(selector);
    if (!target) throw new Error("Interview-Vorschau unvollständig.");
    return target;
  };
  const stages = [...root.querySelectorAll<HTMLElement>("[data-stage]")];
  const answer = find<HTMLTextAreaElement>("[data-answer]");
  const question = find<HTMLHeadingElement>("[data-question]");
  const counter = find<HTMLElement>("[data-counter]");
  const listen = find<HTMLButtonElement>('[data-action="listen"]');
  const voiceConsent = find<HTMLInputElement>("[data-voice-consent]");
  const autoRead = find<HTMLInputElement>("[data-auto-read]");
  const start = find<HTMLButtonElement>('[data-action="start"]');
  const dialog = find<HTMLDialogElement>("[data-reset-dialog]");
  const printProfile = find<HTMLElement>("[data-print-profile]");
  const speechStatus = find<HTMLElement>("[data-speech-status]");
  const speechWindow = window as SpeechWindow;
  const speech = new SpeechCapture(
    speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition,
    window.isSecureContext,
    (message) => {
      speechStatus.textContent = message;
    },
    (active) => {
      listen.textContent = active ? "Aufnahme beenden" : "Antwort sprechen";
      listen.setAttribute("aria-pressed", String(active));
    },
  );
  const downloads = new Map<string, number>();
  let readGeneration = 0;
  let disposed = false;

  function stopMedia() {
    speech.cancel();
    readGeneration++;
    window.speechSynthesis?.cancel();
  }
  function error(selector: string, message = "") {
    const target = find<HTMLElement>(selector);
    target.textContent = message;
    target.hidden = !message;
  }
  function voiceAvailability() {
    listen.disabled = !speech.supported || !voiceConsent.checked;
    find<HTMLElement>("[data-speech-support]").textContent = speech.supported
      ? "Aufnahme startet erst, wenn du selbst auf „Antwort sprechen“ tippst."
      : "Dieser Browser unterstützt hier keine direkte Spracheingabe. Bitte tippen oder die Diktierfunktion deiner Tastatur verwenden.";
    find<HTMLButtonElement>('[data-action="read"]').disabled = !(
      "speechSynthesis" in window
    );
  }
  function readQuestion() {
    stopMedia();
    if (
      !("speechSynthesis" in window) ||
      typeof SpeechSynthesisUtterance === "undefined"
    ) {
      speechStatus.textContent =
        "Vorlesen ist in diesem Browser nicht verfügbar.";
      return;
    }
    const generation = readGeneration;
    const utterance = new SpeechSynthesisUtterance(session.prompt);
    utterance.lang = "de-DE";
    utterance.rate = 0.94;
    const voice = window.speechSynthesis
      .getVoices()
      .find((item) => item.lang.toLowerCase().startsWith("de"));
    if (voice) utterance.voice = voice;
    utterance.onerror = () => {
      if (!disposed && generation === readGeneration)
        speechStatus.textContent =
          "Vorlesen konnte nicht gestartet werden. Die Frage steht oben als Text.";
    };
    window.speechSynthesis.speak(utterance);
  }
  function showStage() {
    for (const stage of stages)
      stage.hidden = stage.dataset.stage !== session.stage;
  }
  function focusStage(target: HTMLElement) {
    target.focus({ preventScroll: true });
    find<HTMLElement>(`[data-stage="${session.stage}"]`).scrollIntoView({
      block: "start",
      behavior: "instant",
    });
  }
  function renderQuestion() {
    stopMedia();
    showStage();
    error("[data-question-error]");
    speechStatus.textContent = "";
    question.textContent = session.prompt;
    find<HTMLElement>("[data-section]").textContent = session.current.section;
    find<HTMLElement>("[data-progress-text]").textContent =
      `Frage ${session.index + 1} von ${session.questions.length}${session.following ? " · Rückfrage" : ""}`;
    find<HTMLProgressElement>("[data-progress]").value = session.index;
    find<HTMLElement>("[data-question-help]").textContent = session.following
      ? "Freiwillige Rückfrage. Du kannst sie beantworten oder überspringen."
      : session.current.required
        ? "Ein erfundener Name ist für dieses Testprofil erforderlich."
        : "Freiwillige Frage. Du kannst sie auch überspringen.";
    find<HTMLElement>("[data-answer-label]").textContent = session.following
      ? "Deine Antwort auf die Rückfrage"
      : `Deine Antwort: ${session.current.label}`;
    answer.value = session.value;
    answer.required = session.current.required && !session.following;
    answer.removeAttribute("aria-invalid");
    counter.textContent = `${answer.value.length} / ${answerLimit}`;
    find<HTMLButtonElement>('[data-action="skip"]').disabled = answer.required;
    find<HTMLButtonElement>('[data-action="back"]').disabled =
      session.index === 0 && !session.following;
    find<HTMLButtonElement>('[data-action="next"]').textContent =
      session.index === session.questions.length - 1 &&
      (!session.current.followUp || session.following)
        ? "Antworten prüfen →"
        : "Weiter →";
    voiceAvailability();
    focusStage(question);
    if (autoRead.checked) readQuestion();
  }
  function renderReview() {
    stopMedia();
    showStage();
    error("[data-review-error]");
    for (const item of session.questions) {
      const value = session.getAnswer(item.id);
      const fieldset = find<HTMLFieldSetElement>(
        `[data-review-item="${item.id}"]`,
      );
      fieldset.querySelector<HTMLTextAreaElement>(
        '[data-part="answer"]',
      )!.value = value.answer;
      fieldset.querySelector<HTMLTextAreaElement>(
        '[data-part="followUpAnswer"]',
      )!.value = value.followUpAnswer;
      fieldset.querySelector<HTMLElement>("[data-review-follow]")!.hidden =
        !value.followUpQuestion;
      fieldset.querySelector<HTMLElement>("[data-follow-label]")!.textContent =
        `Rückfrage: ${value.followUpQuestion}`;
    }
    focusStage(find<HTMLElement>("[data-review-heading]"));
  }
  function checkedExport() {
    const invalid = session.validate();
    if (invalid) {
      error(
        "[data-review-error]",
        "Bitte ergänze einen erfundenen Namen im Testprofil.",
      );
      find<HTMLTextAreaElement>(
        `[data-review-id="${invalid.id}"][data-part="answer"]`,
      ).focus();
      return;
    }
    error("[data-review-error]");
    return session.export();
  }
  function print() {
    stopMedia();
    const profile = checkedExport();
    if (!profile) return;
    printProfile.replaceChildren();
    const add = (parent: HTMLElement, tag: string, text: string) => {
      const element = document.createElement(tag);
      element.textContent = text;
      parent.append(element);
      return element;
    };
    add(printProfile, "h2", `PK Hockey Academy · ${definition.label}`);
    add(
      printProfile,
      "p",
      `TESTPROFIL · ${new Date().toLocaleDateString("de-DE")} · Ungeprüfte Testantworten, keine Veröffentlichung und keine Trainingsbuchung.`,
    ).className = "interview-print-note";
    let section = "";
    for (const item of profile.answers) {
      if (item.section !== section) {
        section = item.section;
        add(printProfile, "h3", section);
      }
      const block = document.createElement("section");
      printProfile.append(block);
      add(block, "h4", `${item.label}${item.internal ? " (intern)" : ""}`);
      add(block, "p", item.answer.trim() || "Nicht beantwortet");
      if (item.followUpQuestion) {
        add(block, "h4", item.followUpQuestion);
        add(block, "p", item.followUpAnswer.trim() || "Nicht beantwortet");
      }
    }
    printProfile.hidden = false;
    find<HTMLElement>("[data-export-status]").textContent =
      "Der Druckdialog öffnet sich. Wähle dort bei Bedarf „Als PDF speichern“. Es erfolgt kein Versand.";
    window.print();
  }
  function download() {
    stopMedia();
    const profile = checkedExport();
    if (!profile) return;
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(profile, null, 2)], {
        type: "application/json;charset=utf-8",
      }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = `PK-Hockey-Testprofil-${kind === "player" ? "Spieler" : "Trainer"}.json`;
    document.body.append(link);
    link.click();
    link.remove();
    const timer = window.setTimeout(() => {
      URL.revokeObjectURL(url);
      downloads.delete(url);
    }, 5000);
    downloads.set(url, timer);
    find<HTMLElement>("[data-export-status]").textContent =
      "Der Download wurde angefordert. Die Datei enthält deine Testantworten, gegebenenfalls auch interne Angaben. Es erfolgt kein Versand.";
  }

  root.addEventListener(
    "click",
    (event) => {
      const target =
        event.target instanceof Element
          ? event.target.closest<HTMLButtonElement>("button")
          : null;
      if (!target || !root.contains(target) || target.disabled) return;
      if (target.dataset.editIndex !== undefined) {
        session.goTo(Number(target.dataset.editIndex));
        renderQuestion();
        return;
      }
      switch (target.dataset.action) {
        case "start":
          if (!find<HTMLInputElement>("[data-test-confirmation]").checked) {
            error(
              "[data-start-error]",
              "Bitte bestätige zuerst den Test mit erfundenen Angaben.",
            );
            find<HTMLInputElement>("[data-test-confirmation]").focus();
            return;
          }
          error("[data-start-error]");
          session.start();
          renderQuestion();
          break;
        case "next":
        case "skip":
          stopMedia();
          try {
            session.advance(answer.value, target.dataset.action === "skip");
            if (session.stage === "review") renderReview();
            else renderQuestion();
          } catch (failure) {
            error(
              "[data-question-error]",
              failure instanceof Error
                ? failure.message
                : "Bitte die Antwort prüfen.",
            );
            answer.setAttribute("aria-invalid", "true");
            answer.focus();
          }
          break;
        case "back":
          stopMedia();
          session.back(answer.value);
          renderQuestion();
          break;
        case "listen":
          if (speech.active) speech.stop();
          else if (voiceConsent.checked) {
            window.speechSynthesis?.cancel();
            readGeneration++;
            speech.start(answer.value, (value) => {
              answer.value = value;
              counter.textContent = `${value.length} / ${answerLimit}`;
            });
          }
          break;
        case "read":
          readQuestion();
          break;
        case "reset":
          stopMedia();
          dialog.showModal();
          break;
        case "cancel-reset":
          dialog.close();
          break;
        case "confirm-reset":
          stopMedia();
          session.reset();
          for (const field of root.querySelectorAll<
            HTMLInputElement | HTMLTextAreaElement
          >("input,textarea")) {
            if (field instanceof HTMLInputElement) field.checked = false;
            else field.value = "";
          }
          printProfile.replaceChildren();
          printProfile.hidden = true;
          find<HTMLElement>("[data-export-status]").textContent = "";
          dialog.close();
          showStage();
          error("[data-start-error]");
          start.focus();
          break;
        case "print":
          print();
          break;
        case "download":
          download();
          break;
      }
    },
    { signal },
  );
  root.addEventListener(
    "input",
    (event) => {
      const target = event.target;
      if (target === answer) {
        stopMedia();
        counter.textContent = `${answer.value.length} / ${answerLimit}`;
        error("[data-question-error]");
        answer.removeAttribute("aria-invalid");
      }
      if (target instanceof HTMLTextAreaElement && target.dataset.reviewId) {
        try {
          session.edit(
            target.dataset.reviewId,
            target.dataset.part === "followUpAnswer"
              ? "followUpAnswer"
              : "answer",
            target.value,
          );
          error("[data-review-error]");
        } catch (failure) {
          error(
            "[data-review-error]",
            failure instanceof Error
              ? failure.message
              : "Bitte die Antwort prüfen.",
          );
        }
      }
    },
    { signal },
  );
  voiceConsent.addEventListener(
    "change",
    () => {
      stopMedia();
      voiceAvailability();
    },
    { signal },
  );
  autoRead.addEventListener(
    "change",
    () => {
      stopMedia();
      if (autoRead.checked && session.stage === "question") readQuestion();
    },
    { signal },
  );
  document.addEventListener(
    "visibilitychange",
    () => {
      if (document.hidden) stopMedia();
    },
    { signal },
  );
  start.disabled = false;
  root.dataset.interviewReady = "true";
  voiceAvailability();

  return () => {
    if (disposed) return;
    disposed = true;
    stopMedia();
    lifecycle.abort();
    session.reset();
    for (const [url, timer] of downloads) {
      clearTimeout(timer);
      URL.revokeObjectURL(url);
    }
    downloads.clear();
    for (const field of root.querySelectorAll<
      HTMLInputElement | HTMLTextAreaElement
    >("input,textarea")) {
      if (field instanceof HTMLInputElement) field.checked = false;
      else field.value = "";
    }
    printProfile.replaceChildren();
    printProfile.hidden = true;
    start.disabled = true;
    dialog.close();
    showStage();
    delete root.dataset.interviewReady;
  };
}

let installed = false;
let dispose: (() => void) | undefined;
export function installInterviews() {
  if (installed) return;
  installed = true;
  const cleanup = () => {
    dispose?.();
    dispose = undefined;
  };
  const init = () => {
    cleanup();
    const root = document.querySelector<HTMLElement>("[data-interview]");
    if (root) dispose = mountInterview(root);
  };
  document.addEventListener("astro:page-load", init);
  document.addEventListener("astro:before-swap", cleanup);
  window.addEventListener("pagehide", cleanup);
  window.addEventListener("pageshow", (event) => {
    if (event.persisted) init();
  });
  init();
}
