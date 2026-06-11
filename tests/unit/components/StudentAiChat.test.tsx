import React from "react";
import "@testing-library/jest-dom/vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { StudentAiChat } from "@/components/StudentAiChat";

function createFetchResponse(body: { message?: string; error?: string }, ok = true) {
  return {
    ok,
    json: async () => body,
  };
}

describe("StudentAiChat", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  it("envia a pergunta, chama a API esperada e renderiza a resposta do assistente", async () => {
    const user = userEvent.setup();
    const assistantReply = "Sua media geral atual e 8.2.";
    const prompt = "Como está meu desempenho geral?";
    let resolveFetch: ((value: ReturnType<typeof createFetchResponse>) => void) | null =
      null;

    (global.fetch as ReturnType<typeof vi.fn>).mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveFetch = resolve;
        }),
    );

    render(<StudentAiChat />);

    await user.type(screen.getByLabelText(/pergunta para o assistente/i), prompt);
    await user.click(screen.getByRole("button", { name: /enviar/i }));

    expect(
      await screen.findByText(/pensando na melhor resposta com base nos seus dados/i),
    ).toBeInTheDocument();

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/aluno/ia",
        expect.objectContaining({
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        }),
      );
    });

    const [, requestInit] = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0] as [
      string,
      RequestInit,
    ];
    const requestBody = JSON.parse(String(requestInit.body)) as {
      messages: Array<{ role: string; content: string }>;
    };

    expect(requestBody).toEqual({
      messages: [
        {
          role: "assistant",
          content:
            "Posso responder sobre seu desempenho no portal e sobre as informações institucionais disponíveis aqui. Se eu não encontrar dado suficiente, vou te avisar claramente.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    resolveFetch?.(createFetchResponse({ message: assistantReply }));

    expect(await screen.findByText(assistantReply)).toBeInTheDocument();
    await waitFor(() => {
      expect(
        screen.queryByText(/pensando na melhor resposta com base nos seus dados/i),
      ).not.toBeInTheDocument();
    });
  });

  it("mostra a mensagem de erro da API e encerra o estado de loading", async () => {
    const user = userEvent.setup();
    const prompt = "Tenho provas próximas?";
    const errorMessage = "A integracao com IA nao esta configurada.";
    let resolveFetch: ((value: ReturnType<typeof createFetchResponse>) => void) | null =
      null;

    (global.fetch as ReturnType<typeof vi.fn>).mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveFetch = resolve;
        }),
    );

    render(<StudentAiChat />);

    await user.type(screen.getByLabelText(/pergunta para o assistente/i), prompt);
    await user.click(screen.getByRole("button", { name: /enviar/i }));

    expect(
      await screen.findByText(/pensando na melhor resposta com base nos seus dados/i),
    ).toBeInTheDocument();

    resolveFetch?.(createFetchResponse({ error: errorMessage }, false));

    expect(await screen.findByText(errorMessage)).toBeInTheDocument();
    expect(screen.queryByText(/^Assistente$/i)).toBeInTheDocument();
    expect(screen.queryByText(errorMessage, { selector: "p" })).not.toBeInTheDocument();

    await waitFor(() => {
      expect(
        screen.queryByText(/pensando na melhor resposta com base nos seus dados/i),
      ).not.toBeInTheDocument();
    });
  });
});
