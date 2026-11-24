(async () => {
  const status = document.querySelector("#interview-status");
  const form = document.querySelector("#interview-form");
  const invite = new URLSearchParams(location.hash.slice(1)).get("einladung");
  window.addEventListener("hashchange", () => {
    if (new URLSearchParams(location.hash.slice(1)).has("einladung")) location.reload();
  });
  if (invite) {
    if (form) form.hidden = true;
    status.textContent = "Einladung wird geprüft …";
    try {
      const response = await fetch(location.pathname, {
        method: "POST",
        body: new URLSearchParams({ action: "open", invitation: invite }),
        redirect: "error",
      });
      if (response.status !== 204) throw new Error();
      history.replaceState(null, "", location.pathname);
      location.reload();
    } catch {
      status.textContent = "Die Einladung konnte nicht geöffnet werden. Prüfe den Link oder versuche es erneut.";
    }
    return;
  }
  if (!form) return;

  form.hidden = false;
  const save = document.querySelector("#save-draft");
  const submit = form.querySelector('[type="submit"]');
  const revision = form.elements.namedItem("revision");
  const voice = document.querySelector("#voice-opt-in");
  const voiceStatus = document.querySelector("#voice-status");
  const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  let recognition;
  let busy = false;
  let dirty = false;

  function cancelSpeech() {
    const previous = recognition;
    recognition = undefined;
    try { previous?.abort(); } catch { /* Already stopped. */ }
    window.speechSynthesis?.cancel();
  }

  const speechButtons = form.querySelectorAll("[data-dictate]");
  function updateVoice() {
    for (const button of speechButtons) button.disabled = !Recognition || !voice.checked || !window.isSecureContext;
  }
  voice.disabled = !Recognition || !window.isSecureContext;
  if (voice.disabled) voiceStatus.textContent = "Diktat ist in diesem Browser nicht verfügbar. Öffne den Link bei Bedarf im normalen Browser oder tippe deine Antworten.";
  voice.addEventListener("change", () => {
    cancelSpeech();
    updateVoice();
  });

  for (const button of form.querySelectorAll("[data-read]")) {
    button.disabled = !window.speechSynthesis || !window.SpeechSynthesisUtterance;
    button.addEventListener("click", () => {
      cancelSpeech();
      const utterance = new SpeechSynthesisUtterance(button.closest("fieldset").querySelector("legend").textContent);
      utterance.lang = "de-DE";
      window.speechSynthesis.speak(utterance);
    });
  }
  for (const button of speechButtons) {
    button.addEventListener("click", () => {
      if (recognition) {
        cancelSpeech();
        voiceStatus.textContent = "Diktat beendet.";
        return;
      }
      cancelSpeech();
      let current;
      try {
        current = new Recognition();
      } catch {
        voiceStatus.textContent = "Diktat nicht verfügbar. Du kannst weitertippen.";
        return;
      }
      const answer = button.closest("fieldset").querySelector("[data-answer]");
      const initial = answer.value.trim();
      recognition = current;
      current.lang = "de-DE";
      current.interimResults = false;
      let failed = false;
      current.onresult = (event) => {
        if (recognition !== current) return;
        const text = Array.from(event.results, (item) => item[0].transcript).join(" ");
        answer.value = [initial, text].filter(Boolean).join(" ").slice(0, 3000);
        dirty = true;
      };
      current.onerror = () => {
        if (recognition !== current) return;
        failed = true;
        voiceStatus.textContent = "Diktat nicht verfügbar. Du kannst weitertippen.";
      };
      current.onend = () => {
        if (recognition === current) {
          recognition = undefined;
          if (!failed) voiceStatus.textContent = "Diktat beendet. Bitte prüfe die Antwort.";
        }
      };
      try {
        current.start();
        voiceStatus.textContent = "Diktat läuft. Tippe erneut, um es zu beenden.";
      } catch {
        cancelSpeech();
        voiceStatus.textContent = "Diktat konnte nicht gestartet werden.";
      }
    });
  }
  window.addEventListener("pagehide", cancelSpeech);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) cancelSpeech();
  });
  form.addEventListener("input", (event) => {
    if (event.target !== voice) dirty = true;
    if (event.target.matches("textarea")) cancelSpeech();
  });
  window.addEventListener("beforeunload", (event) => {
    if (dirty || busy) {
      event.preventDefault();
      event.returnValue = "";
    }
  });

  async function send(action) {
    if (busy) return;
    cancelSpeech();
    busy = true;
    const data = new FormData(form);
    if (action === "save") {
      data.delete("photo");
      data.delete("publishPhoto");
      data.delete("publishProfile");
    }
    data.set("action", action);
    const fields = [...form.elements].filter((item) => !item.disabled);
    for (const field of fields) field.disabled = true;
    status.textContent = action === "save" ? "Entwurf wird gespeichert …" : "Interview wird übermittelt …";
    try {
      const response = await fetch(location.pathname, { method: "POST", body: data, redirect: "error" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "");
      if (action === "save") {
        revision.value = result.revision;
        dirty = Boolean(form.elements.namedItem("photo").files.length
          || form.elements.namedItem("publishProfile").checked
          || form.elements.namedItem("publishPhoto").checked);
        status.textContent = "Antworten gespeichert um " + new Date().toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" }) + ". Foto und Freigaben werden beim Absenden gespeichert.";
      } else if (result.submitted === true) {
        dirty = false;
        form.remove();
        status.textContent = "Dein Trainerinterview ist eingegangen. Vielen Dank!";
      } else {
        throw new Error();
      }
    } catch (error) {
      status.textContent = error instanceof Error && error.message && !/JSON|fetch/i.test(error.message)
        ? error.message
        : "Die Speicherung wurde nicht bestätigt. Bitte versuche es erneut.";
    } finally {
      busy = false;
      for (const field of fields) field.disabled = false;
      updateVoice();
    }
  }

  save.addEventListener("click", () => void send("save"));
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    void send("submit");
  });
})();
