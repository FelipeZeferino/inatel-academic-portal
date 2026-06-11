import { NextRequest, NextResponse } from "next/server";
import { getProfessorContext } from "@/server/api/professor-service";
import { submitGrade } from "@/server/api/professor-notes-service";

export async function PUT(req: NextRequest) {
  const ctx = await getProfessorContext();
  if (!ctx.ok) {
    return NextResponse.json({ error: ctx.message }, { status: ctx.status });
  }

  const body = (await req.json()) as {
    matriculaId?: string;
    media?: number | null;
    faltas?: number;
  };

  const result = await submitGrade(ctx.professorId, {
    matriculaId: body.matriculaId ?? "",
    media: body.media,
    faltas: body.faltas,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.message }, { status: result.status });
  }

  return NextResponse.json({
    matriculaId: result.matriculaId,
    media: result.media,
    faltas: result.faltas,
  });
}
