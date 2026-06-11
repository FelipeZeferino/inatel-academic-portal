import { db } from "@/server/db";
import { getSession } from "@/server/better-auth/server";
import { redirect } from "next/navigation";
import ManageCoursesClient from "./ManageClient";

export default async function GerenciarDisciplinas() {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  const courses = await db.disciplina.findMany({
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

  const serializedCourses = courses.map((course) => ({
    ...course,
    provas: course.provas.map((exam) => ({ ...exam, data: exam.data.toISOString() })),
  }));

  return <ManageCoursesClient initialCourses={serializedCourses} />;
}
