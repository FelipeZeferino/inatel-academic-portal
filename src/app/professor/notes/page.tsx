import { getSession } from "@/server/better-auth/server";
import { redirect } from "next/navigation";
import { db } from "@/server/db";
import NotasClient from "./NotesClient";

export default async function LancarNotasPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const disciplinas = await db.disciplina.findMany({
    where: { professorId: session.user.id },
    include: {
      alunos: {
        include: {
          aluno: { select: { id: true, name: true, email: true } },
        },
        orderBy: { aluno: { name: "asc" } },
      },
    },
    orderBy: { nome: "asc" },
  });

  return <NotasClient disciplinas={disciplinas} />;
}
