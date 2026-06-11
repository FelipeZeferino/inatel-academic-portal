import { describe, expect, it, vi } from "vitest";

import {
  MAX_HISTORY_MESSAGES,
  normalizeChatHistory,
} from "@/server/ai/student-assistant.utils";

describe("normalizeChatHistory", () => {
  it("retorna array vazio quando a entrada nao e uma lista", () => {
    expect(normalizeChatHistory(null)).toEqual([]);
    expect(normalizeChatHistory({})).toEqual([]);
    expect(normalizeChatHistory("texto")).toEqual([]);
  });

  it("remove mensagens invalidas e faz trim do content", () => {
    expect(
      normalizeChatHistory([
        null,
        {},
        { role: "user", content: "   " },
        { role: "assistant", content: "  resposta valida  " },
        { role: "user", content: 123 },
      ]),
    ).toEqual([{ role: "assistant", content: "resposta valida" }]);
  });

  it("normaliza role desconhecida para user e preserva assistant", () => {
    expect(
      normalizeChatHistory([
        { role: "assistant", content: "oi" },
        { role: "system", content: "interno" },
        { role: "user", content: "pergunta" },
      ]),
    ).toEqual([
      { role: "assistant", content: "oi" },
      { role: "user", content: "interno" },
      { role: "user", content: "pergunta" },
    ]);
  });

  it("mantem apenas as ultimas MAX_HISTORY_MESSAGES", () => {
    const input = Array.from(
      { length: MAX_HISTORY_MESSAGES + 3 },
      (_, index) => ({
        role: "user" as const,
        content: `mensagem-${index}`,
      }),
    );

    const result = normalizeChatHistory(input);

    expect(result).toHaveLength(MAX_HISTORY_MESSAGES);
    expect(result[0]?.content).toBe("mensagem-3");
    expect(result.at(-1)?.content).toBe(
      `mensagem-${MAX_HISTORY_MESSAGES + 2}`,
    );
  });

  it("preserva historico valido quando esta abaixo do limite", () => {
    const input = [
      { role: "user" as const, content: "mensagem-1" },
      { role: "user" as const, content: "mensagem-2" },
      { role: "user" as const, content: "mensagem-3" },
      { role: "user" as const, content: "mensagem-4" },
      { role: "user" as const, content: "mensagem-5" },
    ];

    const result = normalizeChatHistory(input);

    expect(input.length).toBeLessThan(MAX_HISTORY_MESSAGES);
    expect(result).toEqual(input);
  });

  it("usa spy mock para validar se normalizeChatHistory foi chamada com o historico correto", () => {
    const utils = {
      normalize: vi.fn(normalizeChatHistory),
    };

    const historico = [
      { role: "assistant" as const, content: " resposta anterior " },
      { role: "user" as const, content: " nova pergunta " },
    ];

    const result = utils.normalize(historico);

    expect(utils.normalize).toHaveBeenCalledTimes(1);
    expect(utils.normalize).toHaveBeenCalledWith(historico);
    expect(result).toEqual([
      { role: "assistant", content: "resposta anterior" },
      { role: "user", content: "nova pergunta" },
    ]);
  });
});
