import { MLCEngine, prebuiltAppConfig } from "@mlc-ai/web-llm";
import { interviewAiModel, type AiTask } from "./ai-policy.ts";

let engine: MLCEngine | undefined;
let busy = false;
const send = (message: unknown) => globalThis.postMessage(message);

globalThis.onmessage = async (event: MessageEvent) => {
  const data = event.data;
  try {
    if (data.type === "load" && !engine) {
      const record = prebuiltAppConfig.model_list.find(
        (item) => item.model_id === interviewAiModel,
      );
      if (!record) throw new Error("Modell fehlt.");
      engine = new MLCEngine({
        appConfig: {
          model_list: [
            { ...record, model: `${record.model}/resolve/0ec1389/` },
          ],
          cacheBackend: "cache",
        },
        initProgressCallback: (report) =>
          send({ type: "progress", progress: report.progress }),
        logLevel: "SILENT",
      });
      await engine.reload(interviewAiModel);
      // Compile the first generation path during background loading, before a
      // participant waits for a follow-up. This uses no interview answers.
      await engine.chat.completions.create({
        messages: [
          { role: "user", content: "Antworte kurz auf Deutsch: Hallo." },
        ],
        max_tokens: 1,
        extra_body: { enable_thinking: false },
      });
      await engine.resetChat();
      send({ type: "ready" });
    } else if (data.type === "generate" && engine && !busy) {
      busy = true;
      const task: AiTask = data.task;
      const schema = JSON.stringify({
        type: "object",
        properties: {
          [task.field]: {
            type: "string",
            ...(task.choices ? { enum: task.choices } : {}),
          },
        },
        required: [task.field],
        additionalProperties: false,
      });
      const response = await engine.chat.completions.create({
        messages: [
          { role: "system", content: task.system },
          { role: "user", content: task.user },
        ],
        temperature: 0.3,
        max_tokens: task.maxTokens,
        extra_body: { enable_thinking: false },
        response_format: { type: "json_object", schema },
      });
      const text =
        response.choices[0]?.finish_reason === "stop"
          ? (response.choices[0]?.message.content ?? "")
          : "";
      await engine.resetChat();
      busy = false;
      send({ type: "result", id: data.id, text });
    }
  } catch {
    busy = false;
    send({ type: "error" });
  }
};
