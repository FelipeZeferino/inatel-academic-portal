import { db } from "@/server/db";
import { getSession } from "@/server/better-auth/server";

export type StudentContextResult =
  | {
      ok: true;
      userId: string;
      user: {
        id: string;
        name: string;
        email: string;
        role: "ALUNO" | "PROFESSOR" | "ADMIN";
        curso: string | null;
        periodo: number | null;
      };
    }
  | {
      ok: false;
      status: 401 | 403;
      message: string;
    };

export async function getStudentContext(): Promise<StudentContextResult> {
  const session = await getSession();

  if (!session) {
    return {
      ok: false,
      status: 401,
      message: "Nao autenticado",
    };
  }

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      curso: true,
      periodo: true,
    },
  });

  if (!user) {
    return {
      ok: false,
      status: 401,
      message: "Usuario da sessao nao encontrado",
    };
  }

  if (user.role !== "ALUNO") {
    return {
      ok: false,
      status: 403,
      message: "Acesso permitido somente para alunos",
    };
  }

  return {
    ok: true,
    userId: user.id,
    user,
  };
}
