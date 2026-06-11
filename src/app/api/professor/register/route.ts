import { NextRequest, NextResponse } from "next/server";
import { getProfessorContext, enrollStudent } from "@/server/api/professor-service";

export async function POST(req: NextRequest) {
  const ctx = await getProfessorContext();
  if (!ctx.ok) {
    return NextResponse.json({ error: ctx.message }, { status: ctx.status });
  }

  const body = (await req.json()) as {
    alunoEmail?: string;
    disciplinaId?: string;
  };

  const resultado = await enrollStudent(ctx.professorId, {
    alunoEmail: body.alunoEmail ?? "",
    disciplinaId: body.disciplinaId ?? "",
  });

  if (!resultado.ok) {
    return NextResponse.json({ error: resultado.message }, { status: resultado.status });
  }

  return NextResponse.json({ matriculaId: resultado.matriculaId }, { status: 201 });
}
