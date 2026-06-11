import { NextRequest, NextResponse } from "next/server";
import { getProfessorContext, createCourse } from "@/server/api/professor-service";

export async function POST(req: NextRequest) {
  const ctx = await getProfessorContext();
  if (!ctx.ok) {
    return NextResponse.json({ error: ctx.message }, { status: ctx.status });
  }

  const body = (await req.json()) as {
    nome?: string;
    codigo?: string;
    semestre?: string;
    cargaHoraria?: number;
    encontrosSemanais?: number;
  };

  const resultado = await createCourse(ctx.professorId, {
    nome: body.nome ?? "",
    codigo: body.codigo,
    semestre: body.semestre,
    cargaHoraria: body.cargaHoraria,
    encontrosSemanais: body.encontrosSemanais,
  });

  if (!resultado.ok) {
    return NextResponse.json({ error: resultado.message }, { status: resultado.status });
  }

  return NextResponse.json({ disciplinaId: resultado.disciplinaId }, { status: 201 });
}

export async function GET() {
  const ctx = await getProfessorContext();
  if (!ctx.ok) {
    return NextResponse.json({ error: ctx.message }, { status: ctx.status });
  }

  const { db } = await import("@/server/db");

  const disciplinas = await db.disciplina.findMany({
    where: { professorId: ctx.professorId },
    include: {
      alunos: {
        include: { aluno: { select: { id: true, name: true, email: true } } },
      },
      provas: { orderBy: { data: "asc" } },
    },
    orderBy: { nome: "asc" },
  });

  return NextResponse.json(disciplinas);
}
