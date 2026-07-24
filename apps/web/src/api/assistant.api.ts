import { request } from "./http";

type AssistantAction = "polish" | "shorten" | "list" | "lead" | "format";

export const assistantApi = {
  rewrite: (text: string, action: AssistantAction) =>
    request<{ text: string; model: string }>("/admin/assistant/rewrite", {
      method: "POST",
      body: JSON.stringify({ text, action }),
    }),
};
