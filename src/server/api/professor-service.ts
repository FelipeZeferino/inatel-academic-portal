import { db } from "@/server/db";
import { getSession } from "@/server/better-auth/server";

export type ProfessorContextResult =
  | {
      ok: true;
      professorId: string;
      professorName: string;
    }
  | {
      ok: false;
      status: 401 | 403;
      message: string;
    };

export type CreateCourseInput = {
  nome: string;
  codigo?: string;
  semestre?: string;
  cargaHoraria?: number;
  encontrosSemanais?: number;
};

export type CreateCourseResult =
  | { ok: true; disciplinaId: string }
  | { ok: false; status: 400 | 401 | 403; message: string };

export type EnrollStudentInput = {
  alunoEmail: string;
  disciplinaId: string;
};

export type EnrollStudentResult =
  | { ok: true; matriculaId: string }
  | { ok: false; status: 400 | 401 | 403 | 404 | 409; message: string };


export async function getProfessorContext(): Promise<ProfessorContextResult> {
  const session = await getSession();

  if (!session) {
    return { ok: false, status: 401, message: "Nao autenticado" };
  }

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, name: true, role: true },
  });

  if (!user) {
    return { ok: false, status: 401, message: "Usuario da sessao nao encontrado" };
  }

  if (user.role !== "PROFESSOR" && user.role !== "ADMIN") {
    return { ok: false, status: 403, message: "Acesso permitido somente para professores" };
  }

  return { ok: true, professorId: user.id, professorName: user.name };
}

export function validateCreateCourse(input: CreateCourseInput): string | null {
  if (!input.nome || input.nome.trim().length === 0) {
    return "O nome da disciplina é obrigatório.";
  }
  if (input.nome.trim().length < 3) {
    return "O nome da disciplina deve ter pelo menos 3 caracteres.";
  }
  if (input.cargaHoraria !== undefined && input.cargaHoraria <= 0) {
    return "A carga horária deve ser maior que zero.";
  }
  if (input.encontrosSemanais !== undefined && input.encontrosSemanais <= 0) {
    return "O número de encontros semanais deve ser maior que zero.";
  }
  return null;
}

export async function createCourse(
  professorId: string,
  input: CreateCourseInput,
): Promise<CreateCourseResult> {
  const erro = validateCreateCourse(input);
  if (erro) {
    return { ok: false, status: 400, message: erro };
  }

  const disciplina = await db.disciplina.create({
    data: {
      nome: input.nome.trim(),
      codigo: input.codigo?.trim() ?? null,
      semestre: input.semestre?.trim() ?? null,
      cargaHoraria: input.cargaHoraria ?? null,
      encontrosSemanais: input.encontrosSemanais ?? null,
      professorId,
    },
  });

  return { ok: true, disciplinaId: disciplina.id };
}

export async function enrollStudent(
  professorId: string,
  input: EnrollStudentInput,
): Promise<EnrollStudentResult> {
  if (!input.alunoEmail || !input.disciplinaId) {
    return { ok: false, status: 400, message: "E-mail do aluno e ID da disciplina são obrigatórios." };
  }

  const disciplina = await db.disciplina.findFirst({
    where: { id: input.disciplinaId, professorId },
  });

  if (!disciplina) {
    return { ok: false, status: 404, message: "Disciplina não encontrada ou sem permissão." };
  }

  const aluno = await db.user.findUnique({
    where: { email: input.alunoEmail },
    select: { id: true, role: true },
  });

  if (!aluno) {
    return { ok: false, status: 404, message: "Aluno não encontrado com este e-mail." };
  }

  if (aluno.role !== "ALUNO") {
    return { ok: false, status: 400, message: "O usuário encontrado não é um aluno." };
  }

  const jaMatriculado = await db.alunoDisciplina.findUnique({
    where: { alunoId_disciplinaId: { alunoId: aluno.id, disciplinaId: input.disciplinaId } },
  });

  if (jaMatriculado) {
    return { ok: false, status: 409, message: "Aluno já matriculado nesta disciplina." };
  }

  const matricula = await db.alunoDisciplina.create({
    data: { alunoId: aluno.id, disciplinaId: input.disciplinaId },
  });

  return { ok: true, matriculaId: matricula.id };
}
