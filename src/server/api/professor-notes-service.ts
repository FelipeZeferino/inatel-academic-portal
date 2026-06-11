import { db } from "@/server/db";

export type GradeInput = {
  matriculaId: string;
  media?: number | null;
  faltas?: number;
};

export type GradeResult =
  | { ok: true; matriculaId: string; media: number | null; faltas: number }
  | { ok: false; status: 400 | 403 | 404; message: string };

export type ScheduleExamInput = {
  titulo: string;
  disciplinaId: string;
  data: Date;
  sala?: string;
  conteudo?: string;
};

export type ScheduleExamResult =
  | { ok: true; provaId: string }
  | { ok: false; status: 400 | 403 | 404; message: string };

export type RemoveExamResult =
  | { ok: true }
  | { ok: false; status: 403 | 404; message: string };

export function validateGrade(media: number | null | undefined): string | null {
  if (media === null || media === undefined) return null;
  if (typeof media !== "number" || isNaN(media)) return "A nota deve ser um número.";
  if (media < 0 || media > 10) return "A nota deve estar entre 0 e 10.";
  return null;
}

export function validateAbsences(faltas: number | undefined): string | null {
  if (faltas === undefined) return null;
  if (!Number.isInteger(faltas)) return "O número de faltas deve ser um inteiro.";
  if (faltas < 0) return "O número de faltas não pode ser negativo.";
  return null;
}

export function validateGradeInput(input: GradeInput): string | null {
  if (!input.matriculaId || input.matriculaId.trim() === "") {
    return "O ID da matrícula é obrigatório.";
  }

  const gradeError = validateGrade(input.media);
  if (gradeError) return gradeError;

  const absencesError = validateAbsences(input.faltas);
  if (absencesError) return absencesError;

  return null;
}

export function validateScheduleExam(input: ScheduleExamInput, now: Date = new Date()): string | null {
  if (!input.titulo || input.titulo.trim().length === 0) {
    return "O título da prova é obrigatório.";
  }
  if (input.titulo.trim().length < 3) {
    return "O título deve ter pelo menos 3 caracteres.";
  }
  if (!input.disciplinaId) {
    return "A disciplina é obrigatória.";
  }
  if (!input.data || isNaN(input.data.getTime())) {
    return "A data da prova é inválida.";
  }
  if (input.data <= now) {
    return "A prova deve ser agendada para uma data futura.";
  }
  return null;
}

export function calculateStudentStatus(
  media: number | null,
  faltas: number,
  cargaHoraria = 80,
): "approved" | "failed_grade" | "failed_absences" | "no_grade" {
  const maxAbsences = cargaHoraria * 0.25;
  if (faltas > maxAbsences) return "failed_absences";
  if (media === null) return "no_grade";
  if (media >= 6) return "approved";
  return "failed_grade";
}

export function calculateClassAverage(grades: (number | null)[]): number | null {
  const validGrades = grades.filter((g): g is number => g !== null);
  if (validGrades.length === 0) return null;
  return validGrades.reduce((acc, n) => acc + n, 0) / validGrades.length;
}

export async function submitGrade(
  professorId: string,
  input: GradeInput,
): Promise<GradeResult> {
  const error = validateGradeInput(input);
  if (error) {
    return { ok: false, status: 400, message: error };
  }

  const enrollment = await db.alunoDisciplina.findFirst({
    where: {
      id: input.matriculaId,
      disciplina: { professorId },
    },
  });

  if (!enrollment) {
    return { ok: false, status: 404, message: "Matrícula não encontrada ou sem permissão." };
  }

  const updated = await db.alunoDisciplina.update({
    where: { id: input.matriculaId },
    data: {
      media: input.media ?? null,
      faltas: input.faltas ?? 0,
    },
  });

  return {
    ok: true,
    matriculaId: updated.id,
    media: updated.media,
    faltas: updated.faltas,
  };
}

export async function scheduleExam(
  professorId: string,
  input: ScheduleExamInput,
  now: Date = new Date(),
): Promise<ScheduleExamResult> {
  const error = validateScheduleExam(input, now);
  if (error) {
    return { ok: false, status: 400, message: error };
  }

  const course = await db.disciplina.findFirst({
    where: { id: input.disciplinaId, professorId },
  });

  if (!course) {
    return { ok: false, status: 404, message: "Disciplina não encontrada ou sem permissão." };
  }

  const exam = await db.prova.create({
    data: {
      titulo: input.titulo.trim(),
      disciplinaId: input.disciplinaId,
      data: input.data,
      sala: input.sala?.trim() ?? null,
      conteudo: input.conteudo?.trim() ?? null,
    },
  });

  return { ok: true, provaId: exam.id };
}

export async function removeExam(
  professorId: string,
  examId: string,
): Promise<RemoveExamResult> {
  if (!examId) {
    return { ok: false, status: 404, message: "ID da prova é obrigatório." };
  }

  const exam = await db.prova.findFirst({
    where: {
      id: examId,
      disciplina: { professorId },
    },
  });

  if (!exam) {
    return { ok: false, status: 404, message: "Prova não encontrada ou sem permissão." };
  }

  await db.prova.delete({ where: { id: examId } });

  return { ok: true };
}
