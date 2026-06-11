import { NextRequest, NextResponse } from "next/server";
import { getProfessorContext } from "@/server/api/professor-service";
import { scheduleExam, removeExam } from "@/server/api/professor-notes-service";

export async function POST(req: NextRequest) {
  const ctx = await getProfessorContext();
  if (!ctx.ok) {
    return NextResponse.json({ error: ctx.message }, { status: ctx.status });
  }

  const body = (await req.json()) as {
    titulo?: string;
    disciplinaId?: string;
    data?: string;
    sala?: string;
    conteudo?: string;
  };

  const examDate = body.data ? new Date(body.data) : new Date("invalid");

  const result = await scheduleExam(ctx.professorId, {
    titulo: body.titulo ?? "",
    disciplinaId: body.disciplinaId ?? "",
    data: examDate,
    sala: body.sala,
    conteudo: body.conteudo,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.message }, { status: result.status });
  }

  return NextResponse.json({ provaId: result.provaId }, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const ctx = await getProfessorContext();
  if (!ctx.ok) {
    return NextResponse.json({ error: ctx.message }, { status: ctx.status });
  }

  const { searchParams } = new URL(req.url);
  const examId = searchParams.get("provaId") ?? "";

  const result = await removeExam(ctx.professorId, examId);

  if (!result.ok) {
    return NextResponse.json({ error: result.message }, { status: result.status });
  }

  return NextResponse.json({ ok: true });
}
