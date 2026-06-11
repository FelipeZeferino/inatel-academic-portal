import { getSession } from "@/server/better-auth/server";
import { redirect } from "next/navigation";
import { db } from "@/server/db";
import RelatoriosClient from "./ReportsClient";

export default async function RelatoriosPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const disciplinas = await db.disciplina.findMany({
    where: { professorId: session.user.id },
    include: {
      alunos: {
        include: {
          aluno: { select: { id: true, name: true, email: true } },
        },
      },
      provas: { orderBy: { data: "asc" } },
    },
    orderBy: { nome: "asc" },
  });

  const serialized = disciplinas.map((d) => ({
    ...d,
    provas: d.provas.map((p) => ({ ...p, data: p.data.toISOString() })),
  }));

  return <RelatoriosClient disciplinas={serialized} />;
}
