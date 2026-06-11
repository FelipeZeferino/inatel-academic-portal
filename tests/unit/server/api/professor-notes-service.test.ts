import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  validateGrade,
  validateAbsences,
  validateGradeInput,
  validateScheduleExam,
  calculateStudentStatus,
  calculateClassAverage,
  submitGrade,
  scheduleExam,
  removeExam,
} from "@/server/api/professor-notes-service";
import { db } from "@/server/db";

vi.mock("@/server/db", () => ({
  db: {
    alunoDisciplina: {
      findFirst: vi.fn(),
      update: vi.fn(),
    },
    disciplina: {
      findFirst: vi.fn(),
    },
    prova: {
      create: vi.fn(),
      findFirst: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

// ─────────────────────────────────────────────────────────────────────────────
// SUITE 1 — validateGrade
// ─────────────────────────────────────────────────────────────────────────────

describe("validateGrade", () => {
  it("aceita null como valor valido (aluno sem nota)", () => {
    expect(validateGrade(null)).toBeNull();
  });

  it("aceita undefined como valor valido", () => {
    expect(validateGrade(undefined)).toBeNull();
  });

  it("aceita nota 0 como valor valido", () => {
    expect(validateGrade(0)).toBeNull();
  });

  it("aceita nota 10 como valor valido", () => {
    expect(validateGrade(10)).toBeNull();
  });

  it("aceita nota fracionaria valida", () => {
    expect(validateGrade(7.5)).toBeNull();
  });

  it("rejeita nota negativa", () => {
    expect(validateGrade(-1)).toBe("A nota deve estar entre 0 e 10.");
  });

  it("rejeita nota acima de 10", () => {
    expect(validateGrade(10.1)).toBe("A nota deve estar entre 0 e 10.");
  });

  it("rejeita NaN", () => {
    expect(validateGrade(NaN)).toBe("A nota deve ser um número.");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// SUITE 2 — validateAbsences
// ─────────────────────────────────────────────────────────────────────────────

describe("validateAbsences", () => {
  it("aceita undefined", () => {
    expect(validateAbsences(undefined)).toBeNull();
  });

  it("aceita zero faltas", () => {
    expect(validateAbsences(0)).toBeNull();
  });

  it("aceita numero positivo de faltas", () => {
    expect(validateAbsences(5)).toBeNull();
  });

  it("rejeita numero negativo de faltas", () => {
    expect(validateAbsences(-1)).toBe("O número de faltas não pode ser negativo.");
  });

  it("rejeita faltas com valor decimal", () => {
    expect(validateAbsences(3.5)).toBe("O número de faltas deve ser um inteiro.");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// SUITE 3 — validateGradeInput
// ─────────────────────────────────────────────────────────────────────────────

describe("validateGradeInput", () => {
  it("retorna null quando todos os campos sao validos", () => {
    expect(
      validateGradeInput({ matriculaId: "mat-1", media: 7.5, faltas: 2 }),
    ).toBeNull();
  });

  it("exige matriculaId preenchido", () => {
    expect(validateGradeInput({ matriculaId: "" })).toBe(
      "O ID da matrícula é obrigatório.",
    );
  });

  it("exige matriculaId sem espacos vazios", () => {
    expect(validateGradeInput({ matriculaId: "   " })).toBe(
      "O ID da matrícula é obrigatório.",
    );
  });

  it("propaga erro de nota invalida", () => {
    expect(
      validateGradeInput({ matriculaId: "mat-1", media: 11 }),
    ).toBe("A nota deve estar entre 0 e 10.");
  });

  it("propaga erro de faltas invalidas", () => {
    expect(
      validateGradeInput({ matriculaId: "mat-1", faltas: -3 }),
    ).toBe("O número de faltas não pode ser negativo.");
  });

  it("aceita media null explicitamente (remover nota)", () => {
    expect(
      validateGradeInput({ matriculaId: "mat-1", media: null }),
    ).toBeNull();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// SUITE 4 — validateScheduleExam
// ─────────────────────────────────────────────────────────────────────────────

describe("validateScheduleExam", () => {
  const NOW = new Date("2025-08-01T12:00:00Z");
  const FUTURE = new Date("2025-09-01T10:00:00Z");
  const PAST = new Date("2025-07-01T10:00:00Z");

  it("retorna null para entrada completamente valida", () => {
    expect(
      validateScheduleExam(
        { titulo: "P1 - Cálculo", disciplinaId: "disc-1", data: FUTURE },
        NOW,
      ),
    ).toBeNull();
  });

  it("exige titulo preenchido", () => {
    expect(
      validateScheduleExam({ titulo: "", disciplinaId: "disc-1", data: FUTURE }, NOW),
    ).toBe("O título da prova é obrigatório.");
  });

  it("exige titulo com pelo menos 3 caracteres", () => {
    expect(
      validateScheduleExam({ titulo: "P1", disciplinaId: "disc-1", data: FUTURE }, NOW),
    ).toBe("O título deve ter pelo menos 3 caracteres.");
  });

  it("exige disciplinaId preenchida", () => {
    expect(
      validateScheduleExam({ titulo: "Prova Final", disciplinaId: "", data: FUTURE }, NOW),
    ).toBe("A disciplina é obrigatória.");
  });

  it("rejeita data no passado", () => {
    expect(
      validateScheduleExam(
        { titulo: "Prova Final", disciplinaId: "disc-1", data: PAST },
        NOW,
      ),
    ).toBe("A prova deve ser agendada para uma data futura.");
  });

  it("rejeita data invalida (NaN)", () => {
    const invalidDate = new Date("nao-e-data");
    expect(
      validateScheduleExam(
        { titulo: "Prova Final", disciplinaId: "disc-1", data: invalidDate },
        NOW,
      ),
    ).toBe("A data da prova é inválida.");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// SUITE 5 — calculateStudentStatus
// ─────────────────────────────────────────────────────────────────────────────

describe("calculateStudentStatus", () => {
  // maxFaltas para cargaHoraria=80 é 20 (25%)
  it("retorna approved quando media >= 6 e faltas dentro do limite", () => {
    expect(calculateStudentStatus(7.0, 10, 80)).toBe("approved");
  });

  it("retorna failed_grade quando media < 6 e faltas dentro do limite", () => {
    expect(calculateStudentStatus(5.9, 10, 80)).toBe("failed_grade");
  });

  it("retorna failed_absences quando faltas excedem 25% da carga horaria", () => {
    expect(calculateStudentStatus(9.0, 21, 80)).toBe("failed_absences");
  });

  it("retorna no_grade quando media e null mas faltas estao ok", () => {
    expect(calculateStudentStatus(null, 5, 80)).toBe("no_grade");
  });

  it("prioriza failed_absences mesmo quando media seria de aprovacao", () => {
    expect(calculateStudentStatus(10.0, 25, 80)).toBe("failed_absences");
  });

  it("usa carga horaria padrao de 80 quando nao informada", () => {
    // maxFaltas = 80 * 0.25 = 20; faltas=21 deve reprovar por faltas
    expect(calculateStudentStatus(8.0, 21)).toBe("failed_absences");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// SUITE 6 — calculateClassAverage
// ─────────────────────────────────────────────────────────────────────────────

describe("calculateClassAverage", () => {
  it("retorna null quando todas as medias sao null", () => {
    expect(calculateClassAverage([null, null])).toBeNull();
  });

  it("retorna null para lista vazia", () => {
    expect(calculateClassAverage([])).toBeNull();
  });

  it("ignora valores null no calculo", () => {
    // Apenas 6 e 8 são válidos → (6+8)/2 = 7
    expect(calculateClassAverage([null, 6, null, 8])).toBeCloseTo(7.0);
  });

  it("calcula media corretamente com todas as notas presentes", () => {
    expect(calculateClassAverage([5, 7, 9])).toBeCloseTo(7.0);
  });

  it("retorna a propria nota quando ha um unico aluno com nota", () => {
    expect(calculateClassAverage([8.5])).toBeCloseTo(8.5);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// SUITE 7 — submitGrade
// ─────────────────────────────────────────────────────────────────────────────

describe("submitGrade", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("retorna 400 e nao acessa o banco quando a validacao falha", async () => {
    const result = await submitGrade("prof-1", { matriculaId: "" });

    expect(result).toEqual({
      ok: false,
      status: 400,
      message: "O ID da matrícula é obrigatório.",
    });
    expect(db.alunoDisciplina.findFirst).not.toHaveBeenCalled();
  });

  it("retorna 404 quando a matricula nao pertence a uma disciplina do professor", async () => {
    (db.alunoDisciplina.findFirst as ReturnType<typeof vi.fn>).mockResolvedValueOnce(null);

    const result = await submitGrade("prof-1", {
      matriculaId: "mat-outra",
      media: 7,
      faltas: 2,
    });

    expect(result).toEqual({
      ok: false,
      status: 404,
      message: "Matrícula não encontrada ou sem permissão.",
    });
    expect(db.alunoDisciplina.update).not.toHaveBeenCalled();
  });

  it("persiste a nota corretamente e retorna ok quando todos os dados sao validos", async () => {
    (db.alunoDisciplina.findFirst as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      id: "mat-1",
      disciplinaId: "disc-1",
    });
    (db.alunoDisciplina.update as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      id: "mat-1",
      media: 8.5,
      faltas: 3,
    });

    const result = await submitGrade("prof-1", {
      matriculaId: "mat-1",
      media: 8.5,
      faltas: 3,
    });

    expect(result).toEqual({ ok: true, matriculaId: "mat-1", media: 8.5, faltas: 3 });
    expect(db.alunoDisciplina.update).toHaveBeenCalledWith({
      where: { id: "mat-1" },
      data: { media: 8.5, faltas: 3 },
    });
  });

  it("salva media como null quando nao informada (remover nota)", async () => {
    (db.alunoDisciplina.findFirst as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      id: "mat-1",
    });
    (db.alunoDisciplina.update as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      id: "mat-1",
      media: null,
      faltas: 0,
    });

    const result = await submitGrade("prof-1", { matriculaId: "mat-1" });

    expect(result).toEqual({ ok: true, matriculaId: "mat-1", media: null, faltas: 0 });
    expect(db.alunoDisciplina.update).toHaveBeenCalledWith({
      where: { id: "mat-1" },
      data: { media: null, faltas: 0 },
    });
  });

  it("verifica que o findFirst usa o professorId para garantir isolamento entre professores", async () => {
    (db.alunoDisciplina.findFirst as ReturnType<typeof vi.fn>).mockResolvedValueOnce(null);

    await submitGrade("prof-2", { matriculaId: "mat-1", media: 5 });

    expect(db.alunoDisciplina.findFirst).toHaveBeenCalledWith({
      where: {
        id: "mat-1",
        disciplina: { professorId: "prof-2" },
      },
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// SUITE 8 — scheduleExam
// ─────────────────────────────────────────────────────────────────────────────

describe("scheduleExam", () => {
  const NOW = new Date("2025-08-01T12:00:00Z");
  const FUTURE = new Date("2025-09-15T14:00:00Z");

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("retorna 400 e nao acessa o banco quando a validacao falha", async () => {
    const result = await scheduleExam(
      "prof-1",
      { titulo: "", disciplinaId: "disc-1", data: FUTURE },
      NOW,
    );

    expect(result).toEqual({
      ok: false,
      status: 400,
      message: "O título da prova é obrigatório.",
    });
    expect(db.disciplina.findFirst).not.toHaveBeenCalled();
  });

  it("retorna 404 quando a disciplina nao pertence ao professor", async () => {
    (db.disciplina.findFirst as ReturnType<typeof vi.fn>).mockResolvedValueOnce(null);

    const result = await scheduleExam(
      "prof-1",
      { titulo: "P1 - Cálculo", disciplinaId: "disc-outro-prof", data: FUTURE },
      NOW,
    );

    expect(result).toEqual({
      ok: false,
      status: 404,
      message: "Disciplina não encontrada ou sem permissão.",
    });
    expect(db.prova.create).not.toHaveBeenCalled();
  });

  it("cria a prova e retorna o id quando todos os dados sao validos", async () => {
    (db.disciplina.findFirst as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      id: "disc-1",
      professorId: "prof-1",
    });
    (db.prova.create as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ id: "prova-nova" });

    const result = await scheduleExam(
      "prof-1",
      {
        titulo: "  Prova Final  ",
        disciplinaId: "disc-1",
        data: FUTURE,
        sala: "Lab 102",
        conteudo: "Capítulos 1-5",
      },
      NOW,
    );

    expect(result).toEqual({ ok: true, provaId: "prova-nova" });
    expect(db.prova.create).toHaveBeenCalledWith({
      data: {
        titulo: "Prova Final",
        disciplinaId: "disc-1",
        data: FUTURE,
        sala: "Lab 102",
        conteudo: "Capítulos 1-5",
      },
    });
  });

  it("persiste sala e conteudo como null quando nao informados", async () => {
    (db.disciplina.findFirst as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ id: "disc-1" });
    (db.prova.create as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ id: "prova-2" });

    await scheduleExam("prof-1", { titulo: "P2 - Física", disciplinaId: "disc-1", data: FUTURE }, NOW);

    expect(db.prova.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ sala: null, conteudo: null }),
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// SUITE 9 — removeExam
// ─────────────────────────────────────────────────────────────────────────────

describe("removeExam", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("retorna 404 quando provaId esta vazio", async () => {
    const result = await removeExam("prof-1", "");
    expect(result).toEqual({
      ok: false,
      status: 404,
      message: "ID da prova é obrigatório.",
    });
    expect(db.prova.findFirst).not.toHaveBeenCalled();
  });

  it("retorna 404 quando a prova nao pertence ao professor", async () => {
    (db.prova.findFirst as ReturnType<typeof vi.fn>).mockResolvedValueOnce(null);

    const result = await removeExam("prof-1", "prova-de-outro");

    expect(result).toEqual({
      ok: false,
      status: 404,
      message: "Prova não encontrada ou sem permissão.",
    });
    expect(db.prova.delete).not.toHaveBeenCalled();
  });

  it("remove a prova e retorna ok quando professor tem permissao", async () => {
    (db.prova.findFirst as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ id: "prova-1" });
    (db.prova.delete as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ id: "prova-1" });

    const result = await removeExam("prof-1", "prova-1");

    expect(result).toEqual({ ok: true });
    expect(db.prova.delete).toHaveBeenCalledWith({ where: { id: "prova-1" } });
  });

  it("verifica isolamento entre professores no findFirst", async () => {
    (db.prova.findFirst as ReturnType<typeof vi.fn>).mockResolvedValueOnce(null);

    await removeExam("prof-2", "prova-1");

    expect(db.prova.findFirst).toHaveBeenCalledWith({
      where: {
        id: "prova-1",
        disciplina: { professorId: "prof-2" },
      },
    });
  });
});
