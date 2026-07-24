import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { env } from "../config/env.js";
import { requireAdmin } from "../lib/auth.js";
import { parseOrThrow } from "../lib/http.js";

const inputSchema = z.object({
  text: z.string().trim().min(2).max(12_000),
  action: z.enum(["polish", "shorten", "list", "lead", "format"]),
});

const instructions = {
  polish:
    "Исправь стиль, грамматику и пунктуацию. Сделай текст ясным и естественным, сохрани смысл и факты.",
  shorten: "Сократи примерно на 35%, убери повторы и воду, сохрани все важные факты.",
  list: "Преобразуй в удобный маркированный список. Каждый пункт с новой строки и начинается с '- '.",
  lead: "Сделай сильный короткий лид для статьи: 1–2 предложения, без кликбейта и выдуманных фактов.",
  format:
    "Красиво оформи фрагмент статьи. Разбей длинный текст на абзацы, выдели только действительно ключевые фразы тегом <strong>, подходящую яркую мысль можешь оформить как <blockquote><p>...</p></blockquote>, перечисления — через <ul><li>...</li></ul>, смысловые части — заголовками <h2> или <h3>. Не меняй факты, не добавляй новые мысли и не переусердствуй с выделениями. Верни валидный HTML, разрешены только теги p, strong, em, blockquote, ul, ol, li, h2, h3.",
} as const;

export const assistantRoutes: FastifyPluginAsync = async (app) => {
  app.addHook("preHandler", requireAdmin);
  app.post("/rewrite", async (request, reply) => {
    const data = parseOrThrow(inputSchema, request.body);
    try {
      const response = await fetch(`${env.OLLAMA_URL.replace(/\/$/, "")}/api/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: env.OLLAMA_MODEL,
          stream: false,
          prompt: `Ты профессиональный русскоязычный редактор. ${instructions[data.action]} Верни только готовый результат без пояснений и внешних кавычек.\n\nТекст:\n${data.text}`,
          options: { temperature: 0.25, num_predict: 1200 },
        }),
        signal: AbortSignal.timeout(60_000),
      });
      if (!response.ok) throw new Error(`Ollama ${response.status}`);
      const result = (await response.json()) as { response?: string };
      const text = result.response?.trim();
      if (!text) throw new Error("Empty response");
      return { text, model: env.OLLAMA_MODEL };
    } catch (error) {
      request.log.warn(error);
      return reply
        .code(503)
        .send({ message: `Локальная модель ${env.OLLAMA_MODEL} недоступна. Запустите Ollama.` });
    }
  });
};
