"use client";

import { useMemo, useState } from "react";
import {
  Bot,
  Loader2,
  MessageSquareText,
  SendHorizonal,
  Sparkles,
  User,
} from "lucide-react";

type ChatMessage = {
  id: string;
  role: "assistant" | "user";
  content: string;
};

const suggestionPrompts = [
  "Como está meu desempenho geral?",
  "Quais matérias exigem mais atenção?",
  "Tenho provas próximas?",
  "Quais editais e eventos estão abertos?",
];

const initialMessage: ChatMessage = {
  id: "initial-assistant-message",
  role: "assistant",
  content:
    "Posso responder sobre seu desempenho no portal e sobre as informações institucionais disponíveis aqui. Se eu não encontrar dado suficiente, vou te avisar claramente.",
};

function createMessage(role: ChatMessage["role"], content: string): ChatMessage {
  return {
    id: `${role}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    role,
    content,
  };
}

export function StudentAiChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([initialMessage]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = input.trim().length > 0 && !loading;

  const messagePayload = useMemo(
    () =>
      messages.map((message) => ({
        role: message.role,
        content: message.content,
      })),
    [messages],
  );

  async function sendMessage(prompt: string) {
    const trimmed = prompt.trim();

    if (!trimmed || loading) {
      return;
    }

    const nextUserMessage = createMessage("user", trimmed);
    const nextMessages = [...messages, nextUserMessage];

    setMessages(nextMessages);
    setInput("");
    setError(null);
    setLoading(true);

    try {
      const response = await fetch("/api/aluno/ia", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [
            ...messagePayload,
            {
              role: nextUserMessage.role,
              content: nextUserMessage.content,
            },
          ],
        }),
      });

      const data = (await response.json()) as { message?: string; error?: string };

      if (!response.ok || !data.message) {
        throw new Error(
          data.error ??
            "Nao foi possivel conversar com o assistente agora. Tente novamente.",
        );
      }

      setMessages((currentMessages) => [
        ...currentMessages,
        createMessage("assistant", data.message ?? ""),
      ]);
    } catch (requestError) {
      const message =
        requestError instanceof Error
          ? requestError.message
          : "Falha inesperada ao consultar o assistente.";

      setError(message);
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void sendMessage(input);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
      <section className="min-h-[72vh] rounded-[28px] bg-[#eff4fd] p-3 shadow-[0_24px_80px_rgba(28,55,102,0.12)]">
        <div className="flex h-full flex-col rounded-[24px] bg-white">
          <div className="border-b border-slate-200/60 bg-[linear-gradient(135deg,#2959ac_0%,#4673c7_100%)] px-6 py-6 text-white">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-blue-100">
                  Assistente academico
                </p>
                <h1 className="mt-2 text-3xl font-bold tracking-tight">
                  Converse com a IA do portal
                </h1>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-blue-50">
                  Pergunte sobre seu desempenho, faltas, provas e também sobre
                  editais e eventos cadastrados no portal.
                </p>
              </div>

              <div className="hidden rounded-full bg-white/12 px-4 py-2 text-xs font-semibold text-white/90 md:block">
                Respostas baseadas apenas nos dados do portal
              </div>
            </div>
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto bg-[radial-gradient(circle_at_top,_rgba(70,115,199,0.08),_transparent_38%)] px-4 py-5 sm:px-6">
            {messages.map((message) => {
              const isAssistant = message.role === "assistant";

              return (
                <div
                  key={message.id}
                  className={`flex ${isAssistant ? "justify-start" : "justify-end"}`}
                >
                  <div
                    className={`max-w-3xl rounded-[24px] px-5 py-4 ${
                      isAssistant
                        ? "bg-[#eff4fd] text-slate-800"
                        : "bg-[linear-gradient(135deg,#2959ac_0%,#4673c7_100%)] text-white"
                    }`}
                  >
                    <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em]">
                      {isAssistant ? (
                        <>
                          <Bot className="h-4 w-4" />
                          Assistente
                        </>
                      ) : (
                        <>
                          <User className="h-4 w-4" />
                          Voce
                        </>
                      )}
                    </div>
                    <p className="whitespace-pre-wrap text-sm leading-7">
                      {message.content}
                    </p>
                  </div>
                </div>
              );
            })}

            {loading ? (
              <div className="flex justify-start">
                <div className="inline-flex items-center gap-3 rounded-full bg-[#eff4fd] px-4 py-3 text-sm text-slate-700">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Pensando na melhor resposta com base nos seus dados...
                </div>
              </div>
            ) : null}
          </div>

          <div className="border-t border-slate-200/70 bg-white px-4 py-4 sm:px-6">
            {error ? (
              <div className="mb-4 rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-900">
                {error}
              </div>
            ) : null}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {suggestionPrompts.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() => void sendMessage(prompt)}
                    disabled={loading}
                    className="rounded-full bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {prompt}
                  </button>
                ))}
              </div>

              <div className="rounded-[24px] bg-[#eff4fd] p-2">
                <div className="flex flex-col gap-3 rounded-[20px] bg-white px-4 py-4 sm:flex-row sm:items-end">
                  <div className="flex-1">
                    <label htmlFor="student-ai-input" className="sr-only">
                      Pergunta para o assistente
                    </label>
                    <textarea
                      id="student-ai-input"
                      value={input}
                      onChange={(event) => setInput(event.target.value)}
                      placeholder="Pergunte sobre suas medias, faltas, provas ou informacoes institucionais..."
                      rows={3}
                      disabled={loading}
                      className="min-h-[88px] w-full resize-none bg-transparent text-sm leading-6 text-slate-900 outline-none placeholder:text-slate-400"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={!canSubmit}
                    className="inline-flex items-center justify-center gap-2 rounded-[18px] bg-[linear-gradient(135deg,#2959ac_0%,#4673c7_100%)] px-5 py-3 text-sm font-semibold text-white transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <SendHorizonal className="h-4 w-4" />
                    Enviar
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </section>

      <aside className="space-y-5">
        <section className="rounded-[28px] bg-[#eff4fd] p-5">
          <div className="rounded-[24px] bg-white p-6">
            <div className="flex items-center gap-3 text-slate-900">
              <div className="rounded-2xl bg-blue-100 p-3 text-blue-700">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold">Como essa IA responde</h2>
                <p className="text-sm text-slate-600">
                  Usa apenas seus dados do portal e as informacoes cadastradas no
                  sistema.
                </p>
              </div>
            </div>

            <ul className="mt-5 space-y-3 text-sm leading-6 text-slate-700">
              <li>Analisa medias, faltas, disciplinas e proximas provas.</li>
              <li>Consulta editais, monitorias, intercambio e eventos locais.</li>
              <li>Se faltar contexto confiavel, ela informa a limitacao.</li>
            </ul>
          </div>
        </section>

        <section className="rounded-[28px] bg-[#eff4fd] p-5">
          <div className="rounded-[24px] bg-white p-6">
            <div className="flex items-center gap-3 text-slate-900">
              <div className="rounded-2xl bg-emerald-100 p-3 text-emerald-700">
                <MessageSquareText className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold">Boas perguntas</h2>
                <p className="text-sm text-slate-600">
                  Exemplos que funcionam bem com os dados atuais do portal.
                </p>
              </div>
            </div>

            <div className="mt-5 space-y-3">
              {suggestionPrompts.map((prompt) => (
                <div
                  key={prompt}
                  className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-700"
                >
                  {prompt}
                </div>
              ))}
            </div>
          </div>
        </section>
      </aside>
    </div>
  );
}
