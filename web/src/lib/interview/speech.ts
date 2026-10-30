import { answerLimit } from "../../data/interviews.ts";

export interface RecognitionResultEvent {
  results: ArrayLike<ArrayLike<{ transcript: string }>>;
}
export interface RecognitionLike {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  onstart: (() => void) | null;
  onresult: ((event: RecognitionResultEvent) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}
export type RecognitionConstructor = new () => RecognitionLike;
export type SpeechWindow = Window & {
  SpeechRecognition?: RecognitionConstructor;
  webkitSpeechRecognition?: RecognitionConstructor;
};

export class SpeechCapture {
  private current: RecognitionLike | undefined;
  private generation = 0;
  private stopping = false;
  private readonly Recognition: RecognitionConstructor | undefined;
  private readonly secure: boolean;
  private readonly status: (message: string) => void;
  private readonly listening: (active: boolean) => void;
  constructor(
    Recognition: RecognitionConstructor | undefined,
    secure: boolean,
    status: (message: string) => void,
    listening: (active: boolean) => void,
  ) {
    this.Recognition = Recognition;
    this.secure = secure;
    this.status = status;
    this.listening = listening;
  }
  get supported() {
    return !!this.Recognition && this.secure;
  }
  get active() {
    return !!this.current;
  }
  start(initial: string, receive: (value: string) => void) {
    if (this.current) return;
    if (!this.supported) {
      this.status(
        "Spracheingabe ist hier nicht verfügbar. Du kannst tippen oder die Diktierfunktion deiner Tastatur nutzen.",
      );
      return;
    }
    const recognition = new this.Recognition!();
    const generation = ++this.generation;
    this.current = recognition;
    this.stopping = false;
    const valid = () =>
      this.current === recognition && generation === this.generation;
    recognition.lang = "de-DE";
    recognition.interimResults = true;
    recognition.continuous = false;
    this.listening(true);
    this.status(
      "Mikrofon wird gestartet. Bitte die Browserfreigabe bestätigen, falls sie erscheint.",
    );
    recognition.onstart = () => {
      if (valid())
        this.status("Ich höre zu. Du kannst die Aufnahme jederzeit beenden.");
    };
    recognition.onresult = (event) => {
      if (!valid()) return;
      const transcript = Array.from(
        event.results,
        (result) => result[0]?.transcript ?? "",
      )
        .join(" ")
        .trim();
      receive(
        [initial.trim(), transcript]
          .filter(Boolean)
          .join(" ")
          .slice(0, answerLimit),
      );
    };
    recognition.onerror = (event) => {
      if (!valid()) return;
      const messages: Record<string, string> = {
        "not-allowed":
          "Mikrofonzugriff nicht erlaubt. Du kannst deine Antwort weiterhin tippen.",
        "service-not-allowed":
          "Der Browser erlaubt diesen Erkennungsdienst nicht. Bitte tippen.",
        "audio-capture": "Kein verfügbares Mikrofon gefunden. Bitte tippen.",
        network:
          "Der Spracherkennungsdienst ist nicht erreichbar. Deine bisherige Antwort bleibt erhalten.",
        "no-speech":
          "Keine Sprache erkannt. Bitte erneut versuchen oder tippen.",
        aborted: "Aufnahme beendet.",
      };
      this.cancel();
      this.status(
        messages[event.error] ??
          "Spracheingabe nicht verfügbar. Bitte die Antwort tippen.",
      );
    };
    recognition.onend = () => {
      if (!valid()) return;
      this.current = undefined;
      this.stopping = false;
      this.listening(false);
      this.status(
        "Aufnahme beendet. Bitte prüfe den Text, bevor du weitergehst.",
      );
    };
    try {
      recognition.start();
    } catch {
      this.cancel();
      this.status(
        "Die Aufnahme konnte nicht starten. Bitte erneut versuchen oder tippen.",
      );
    }
  }
  stop() {
    if (!this.current || this.stopping) return;
    this.stopping = true;
    try {
      this.current.stop();
    } catch {
      this.cancel();
    }
  }
  cancel() {
    const recognition = this.current;
    this.current = undefined;
    this.generation++;
    this.stopping = false;
    if (recognition) {
      recognition.onstart =
        recognition.onresult =
        recognition.onerror =
        recognition.onend =
          null;
      try {
        recognition.abort();
      } catch {
        /* A browser can end recognition first. */
      }
    }
    this.listening(false);
  }
}
