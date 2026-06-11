import { NextResponse } from "next/server";
import { db } from "@/server/db";
import { getStudentContext } from "@/server/api/aluno-auth";

export async function GET() {
  const context = await getStudentContext();

  if (!context.ok) {
    return NextResponse.json({ error: context.message }, { status: context.status });
  }

  const matriculas = await db.alunoDisciplina.findMany({
    where: { alunoId: context.userId },
    include: {
      disciplina: true,
    },
  });

  const disciplinaIds = matriculas.map((m) => m.disciplinaId);

  const proximasProvas = await db.prova.findMany({
    where: {
      disciplinaId: { in: disciplinaIds.length ? disciplinaIds : ["__none__"] },
      data: { gte: new Date() },
    },
    include: {
      disciplina: {
        select: {
          id: true,
          nome: true,
        },
      },
    },
    orderBy: { data: "asc" },
    take: 5,
  });

  const totalDisciplinas = matriculas.length;
  const disciplinasComFalta = matriculas.filter((m) => m.faltas > 0).length;
  const somaMedias = matriculas.reduce((acc, m) => acc + (m.media ?? 0), 0);
  const mediaGeral = totalDisciplinas > 0 ? Number((somaMedias / totalDisciplinas).toFixed(2)) : null;

  return NextResponse.json({
    aluno: {
      id: context.user.id,
      name: context.user.name,
      curso: context.user.curso,
      periodo: context.user.periodo,
    },
    resumo: {
      totalDisciplinas,
      disciplinasComFalta,
      mediaGeral,
    },
    proximasProvas,
  });
}
