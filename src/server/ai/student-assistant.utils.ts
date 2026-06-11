export const MAX_HISTORY_MESSAGES = 10;

export type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

export function normalizeChatHistory(messages: unknown): ChatMessage[] {
  if (!Array.isArray(messages)) {
    return [];
  }

  return messages
    .filter((message): message is Record<string, unknown> => {
      return typeof message === "object" && message !== null;
    })
    .map((message): ChatMessage => ({
      role: message.role === "assistant" ? "assistant" : "user",
      content: typeof message.content === "string" ? message.content.trim() : "",
    }))
    .filter((message) => message.content.length > 0)
    .slice(-MAX_HISTORY_MESSAGES);
}
