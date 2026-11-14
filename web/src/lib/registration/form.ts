import { createIntakeClient, type IntakeResult } from "./intake-client";

export function mountTrainingRequests(scope: ParentNode): () => void {
  const cleanups = [...scope.querySelectorAll<HTMLElement>("[data-training-request]")].map(root => {
    if (root.dataset.enabled !== "true") return () => {};
    const form = root.querySelector<HTMLFormElement>("form")!;
    const controls = form.querySelector<HTMLFieldSetElement>("[data-controls]")!;
    const feedback = root.querySelector<HTMLElement>("[data-feedback]")!;
    const errors = root.querySelector<HTMLElement>("[data-errors]")!;
    const retry = root.querySelector<HTMLButtonElement>("[data-retry]")!;
    const help = root.querySelector<HTMLElement>("[data-help]")!;
    const session = form.querySelector<HTMLSelectElement>("[name=sessionId]")!;
    const health = form.querySelector<HTMLTextAreaElement>("[name=healthNotes]")!;
    const client = createIntakeClient();
    let unresolved = false, disposed = false, inFlight = false;
    controls.disabled = false;
    const selected = (name: string) => (form.elements.namedItem(name) as RadioNodeList | HTMLInputElement)?.value ?? "";
    const checked = (name: string) => (form.elements.namedItem(name) as HTMLInputElement).checked;
    const update = () => {
      const single = selected("bookingType") === "single";
      root.querySelector<HTMLElement>("[data-session]")!.hidden = !single;
      root.querySelector<HTMLElement>("[data-package]")!.hidden = selected("bookingType") !== "five";
      session.disabled = !single; session.required = single;
      if (!single) session.value = "";
      health.disabled = !checked("consent-health");
      if (health.disabled) health.value = "";
    };
    function clearErrors() {
      errors.hidden = true; errors.replaceChildren();
      for (const element of form.querySelectorAll("[aria-invalid]")) element.removeAttribute("aria-invalid");
      for (const element of form.querySelectorAll<HTMLElement>(".request-error")) { element.hidden = true; element.textContent = ""; }
    }
    function showErrors(fields: string[]) {
      clearErrors();
      const heading = document.createElement("p"); heading.textContent = "Bitte prüfe die markierten Angaben.";
      const list = document.createElement("ul"); errors.append(heading, list);
      for (const name of new Set(fields)) {
        // Field names from the server are untrusted; no HTML or selector interpolation.
        const input = [...form.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>("input,select,textarea")].find(element => element.name === name);
        const target = input ?? (name === "consents" ? form.querySelector<HTMLInputElement>("[name=consent-website]") : null);
        if (!target) continue;
        target.setAttribute("aria-invalid", "true");
        const inline = document.getElementById(`request-${name}-error`);
        if (inline && root.contains(inline)) { inline.hidden = false; inline.textContent = "Bitte Angabe prüfen und gegebenenfalls ergänzen."; }
        if (!target.id) target.id = `request-error-target-${list.childElementCount}`;
        const label = target.labels?.[0]?.textContent?.trim() ?? "Angabe";
        const item = document.createElement("li"), link = document.createElement("a");
        link.href = `#${target.id}`; link.textContent = label;
        link.addEventListener("click", event => { event.preventDefault(); target.focus(); });
        item.append(link); list.append(item);
      }
      errors.hidden = false; errors.focus();
    }
    async function settle(result: IntakeResult) {
      if (disposed) return;
      inFlight = false;
      retry.hidden = true;
      form.removeAttribute("aria-busy");
      if (result.state === "received") {
        unresolved = false;
        form.reset(); controls.disabled = true; help.hidden = true;
        feedback.textContent = "Deine Trainingsanfrage wurde entgegengenommen. Die Academy prüft die Anfrage. Ein Trainingsplatz ist damit noch nicht bestätigt.";
      } else if (result.state === "invalid") {
        unresolved = false; controls.disabled = false; update(); feedback.textContent = "";
        showErrors(result.fields); return;
      } else if (result.state === "unavailable") {
        unresolved = false; controls.disabled = false; update();
        feedback.textContent = "Der Versand ist derzeit nicht verfügbar. Es wurden noch keine Formulardaten gesendet. Bitte versuche es später erneut.";
      } else {
        unresolved = true; controls.disabled = true; help.hidden = false;
        retry.hidden = result.state !== "uncertain";
        feedback.textContent = result.state === "review-required"
          ? "Der Status deiner Anfrage muss mit der Academy geklärt werden. Bitte sende keine neue Anfrage."
          : "Der Empfang konnte nicht bestätigt werden. Du kannst ausschließlich dieselbe Anfrage erneut prüfen. Ein Erfolg wurde nicht bestätigt.";
      }
      feedback.focus();
    }
    const submit = async (event: SubmitEvent) => {
      event.preventDefault();
      if (inFlight || unresolved) return;
      clearErrors(); update();
      const invalid = [...form.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>("input,select,textarea")].filter(input => !input.disabled && !input.validity.valid).map(input => input.name);
      if (Boolean(selected("emergencyName").trim()) !== Boolean(selected("emergencyPhone").trim())) invalid.push("emergencyPhone");
      if (invalid.length) { showErrors(invalid); return; }
      const data: Record<string, unknown> = { policyVersion: root.dataset.policy };
      for (const element of form.querySelectorAll<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>("input,textarea,select")) {
        if (element.disabled || element.name.startsWith("consent-")) continue;
        if (element instanceof HTMLInputElement && element.type === "radio" && !element.checked) continue;
        data[element.name] = element instanceof HTMLInputElement && element.type === "checkbox" ? element.checked : element.value.trim();
      }
      data.consents = Object.fromEntries(["health", "website", "print", "analysis"].map(purpose => [purpose, checked(`consent-${purpose}`)]));
      inFlight = true; unresolved = true; controls.disabled = true; form.setAttribute("aria-busy", "true");
      feedback.textContent = "Deine Anfrage wird übermittelt. Bitte lasse diese Seite geöffnet.";
      await settle(await client.submit(data));
    };
    const onRetry = async () => {
      if (inFlight) return;
      inFlight = true; retry.hidden = true; form.setAttribute("aria-busy", "true");
      feedback.textContent = "Der Empfang derselben Anfrage wird erneut geprüft.";
      await settle(await client.retry());
    };
    const beforeUnload = (event: BeforeUnloadEvent) => { if (unresolved) event.preventDefault(); };
    const beforeNavigation = (event: Event) => { if (unresolved) event.preventDefault(); };
    // Guard same-document links too; an unresolved private request must not be
    // silently discarded by Astro's client router or an ordinary navigation.
    const click = (event: MouseEvent) => {
      if (!unresolved) return;
      const anchor = (event.target as Element).closest?.("a");
      if (anchor && !anchor.href.startsWith("mailto:") && !anchor.hash.startsWith("#request-")) event.preventDefault();
    };
    form.addEventListener("change", update); form.addEventListener("submit", submit);
    retry.addEventListener("click", onRetry); window.addEventListener("beforeunload", beforeUnload);
    document.addEventListener("astro:before-preparation", beforeNavigation); document.addEventListener("click", click, true);
    update();
    return () => {
      disposed = true; controls.disabled = true;
      form.removeEventListener("change", update); form.removeEventListener("submit", submit);
      retry.removeEventListener("click", onRetry); window.removeEventListener("beforeunload", beforeUnload);
      document.removeEventListener("astro:before-preparation", beforeNavigation); document.removeEventListener("click", click, true);
    };
  });
  return () => cleanups.forEach(cleanup => cleanup());
}
