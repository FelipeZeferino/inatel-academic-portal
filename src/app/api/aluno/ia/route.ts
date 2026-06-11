import { NextResponse } from "next/server";
import { z } from "zod";

import { generateStudentAssistantReply } from "@/server/ai/student-assistant";

const requestSchema = z.object({
  messages: z.array(
    z.object({
      role: z.enum(["user", "assistant"]),
      content: z.string().trim().min(1),
    }),
  ),
});

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json();
    const parsed = requestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Payload invalido para o chat de IA." },
        { status: 400 },
      );
    }

    const result = await generateStudentAssistantReply(parsed.data.messages);

    if (!result.ok) {
      const headers = new Headers();
      if (result.status === 429 && "retryAfterMs" in result) {
        headers.set("Retry-After", String(Math.ceil(result.retryAfterMs / 1000)));
      }

      return NextResponse.json(
        { error: result.message },
        { status: result.status, headers },
      );
    }

    return NextResponse.json({ message: result.answer });
  } catch (error) {
    console.error("Erro ao processar chat de IA do aluno:", error);

    return NextResponse.json(
      {
        error:
          "Nao foi possivel gerar a resposta agora. Tente novamente em instantes.",
      },
      { status: 500 },
    );
  }
}
