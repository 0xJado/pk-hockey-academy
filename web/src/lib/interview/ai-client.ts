import type { AiTask } from "./ai-policy.ts";

export type AiState =
  "idle" | "loading" | "ready" | "busy" | "error" | "unsupported";
export type AiUpdate = { state: AiState; progress: number };
export interface AiWorker {
  onmessage: ((event: MessageEvent) => void) | null;
  onerror: ((event: ErrorEvent) => void) | null;
  postMessage(message: unknown): void;
  terminate(): void;
}

// No model request or worker is created before both explicit confirmations.
export class BrowserInterviewAi {
  state: AiState = "idle";
  private worker?: AiWorker;
  private epoch = 0;
  private requestId = 0;
  private timer?: ReturnType<typeof setTimeout>;
  private pending?: {
    id: number;
    resolve: (text: string) => void;
    reject: (reason: Error) => void;
  };
  private notify: (update: AiUpdate) => void;
  private createWorker: () => AiWorker;
  private supported: () => boolean;

  constructor(
    notify: (update: AiUpdate) => void,
    createWorker: () => AiWorker = () =>
      new Worker(new URL("./ai.worker.ts", import.meta.url), {
        type: "module",
      }),
    supported = () =>
      globalThis.isSecureContext &&
      typeof navigator !== "undefined" &&
      "gpu" in navigator &&
      Boolean(navigator.gpu),
  ) {
    this.notify = notify;
    this.createWorker = createWorker;
    this.supported = supported;
  }

  private update(state: AiState, progress = 0) {
    this.state = state;
    this.notify({ state, progress });
  }

  start(wifiConfirmed: boolean, testConfirmed: boolean) {
    if (
      !wifiConfirmed ||
      !testConfirmed ||
      this.state === "loading" ||
      this.state === "ready" ||
      this.state === "busy"
    )
      return;
    this.stop();
    if (!this.supported()) {
      this.update("unsupported");
      return;
    }
    const epoch = this.epoch;
    this.update("loading");
    try {
      const worker = this.createWorker();
      this.worker = worker;
      worker.onmessage = (event) => {
        if (epoch !== this.epoch) return;
        const data = event.data;
        if (data?.type === "progress" && this.state === "loading") {
          this.update(
            "loading",
            Math.max(0, Math.min(1, Number(data.progress) || 0)),
          );
        } else if (data?.type === "ready" && this.state === "loading") {
          clearTimeout(this.timer);
          this.update("ready", 1);
        } else if (
          data?.type === "result" &&
          this.pending &&
          this.pending.id === data.id
        ) {
          clearTimeout(this.timer);
          const pending = this.pending;
          this.pending = undefined;
          this.update("ready", 1);
          pending.resolve(typeof data.text === "string" ? data.text : "");
        } else if (data?.type === "error") this.fail();
      };
      worker.onerror = (event) => {
        event.preventDefault?.();
        if (epoch === this.epoch) this.fail();
      };
      this.timer = setTimeout(() => this.fail(), 180_000);
      worker.postMessage({ type: "load" });
    } catch {
      this.fail();
    }
  }

  generate(task: AiTask): Promise<string> {
    if (this.state !== "ready" || !this.worker)
      return Promise.reject(new Error("KI nicht bereit."));
    const id = ++this.requestId;
    this.update("busy", 1);
    return new Promise((resolve, reject) => {
      this.pending = { id, resolve, reject };
      this.timer = setTimeout(
        () => this.fail(),
        task.field === "question" ? 30_000 : 45_000,
      );
      try {
        this.worker!.postMessage({ type: "generate", id, task });
      } catch {
        this.fail();
      }
    });
  }

  cancelRequest() {
    if (this.pending) this.stop();
  }

  stop() {
    this.epoch++;
    clearTimeout(this.timer);
    this.worker?.terminate();
    this.worker = undefined;
    const pending = this.pending;
    this.pending = undefined;
    pending?.reject(new DOMException("KI gestoppt.", "AbortError"));
    this.update("idle");
  }

  private fail() {
    this.stop();
    this.update("error");
  }
}
