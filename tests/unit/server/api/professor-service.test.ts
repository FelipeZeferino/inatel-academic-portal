import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  getProfessorContext,
  enrollStudent,
  validateCreateCourse,
  createCourse,
} from "@/server/api/professor-service";
import { db } from "@/server/db";
import { getSession } from "@/server/better-auth/server";

vi.mock("@/server/db", () => ({
  db: {
    user: {
      findUnique: vi.fn(),
    },
    disciplina: {
      findFirst: vi.fn(),
      create: vi.fn(),
    },
    alunoDisciplina: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
  },
}));

vi.mock("@/server/better-auth/server", () => ({
  getSession: vi.fn(),
}));

function mockSession(userId: string) {
  (getSession as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
    user: { id: userId },
  });
}

function mockUser(user: { id: string; name: string; role: string } | null) {
  (db.user.findUnique as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce(user);
}

// ─────────────────────────────────────────────────────────────────────────────
// SUITE 1 — getProfessorContext (com mock de sessão e banco)
// ─────────────────────────────────────────────────────────────────────────────

describe("getProfessorContext", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("retorna 401 quando nao existe sessao ativa", async () => {
    (getSession as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce(null);

    const resultado = await getProfessorContext();

    expect(resultado).toEqual({ ok: false, status: 401, message: "Nao autenticado" });
    expect(db.user.findUnique).not.toHaveBeenCalled();
  });

  it("retorna 401 quando o usuario da sessao nao existe no banco", async () => {
    mockSession("prof-inexistente");
    mockUser(null);

    const resultado = await getProfessorContext();

    expect(resultado).toEqual({
      ok: false,
      status: 401,
      message: "Usuario da sessao nao encontrado",
    });
  });

  it("retorna 403 quando o usuario autenticado eh um aluno", async () => {
    mockSession("aluno-1");
    mockUser({ id: "aluno-1", name: "Aluno Teste", role: "ALUNO" });

    const resultado = await getProfessorContext();

    expect(resultado).toEqual({
      ok: false,
      status: 403,
      message: "Acesso permitido somente para professores",
    });
  });

  it("retorna contexto valido quando o usuario eh professor", async () => {
    mockSession("prof-1");
    mockUser({ id: "prof-1", name: "Dr. Carlos", role: "PROFESSOR" });

    const resultado = await getProfessorContext();

    expect(resultado).toEqual({
      ok: true,
      professorId: "prof-1",
      professorName: "Dr. Carlos",
    });
  });

  it("retorna contexto valido quando o usuario eh admin (papel com acesso igual ao professor)", async () => {
    mockSession("admin-1");
    mockUser({ id: "admin-1", name: "Administrador", role: "ADMIN" });

    const resultado = await getProfessorContext();

    expect(resultado).toEqual({
      ok: true,
      professorId: "admin-1",
      professorName: "Administrador",
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// SUITE 2 — createCourse (com mock do banco de dados)
// ─────────────────────────────────────────────────────────────────────────────

describe("createCourse", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // A função chama `validateCreateCourse` internamente antes de qualquer
  // acesso ao banco. Se a validação falha, o banco nunca deve ser chamado.
  // Este teste garante que o guard de validação é respeitado e que um nome
  // inválido não resulta em uma query desnecessária ao Prisma.
  it("retorna 400 e nao acessa o banco quando a validacao falha", async () => {
    const resultado = await createCourse("prof-1", { nome: "" });

    expect(resultado).toEqual({
      ok: false,
      status: 400,
      message: expect.any(String),
    });
    expect(db.disciplina.create).not.toHaveBeenCalled();
  });

  // Quando os dados são válidos, a função deve persistir a disciplina com os
  // campos corretos — incluindo o trim do nome e a conversão de opcionais para
  // null. Este teste verifica tanto o retorno quanto o payload exato enviado
  // ao Prisma, evitando regressões silenciosas nos campos persistidos.
  it("cria a disciplina no banco e retorna o id quando os dados sao validos", async () => {
    (db.disciplina.create as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      id: "nova-disc-1",
    });

    const resultado = await createCourse("prof-1", {
      nome: "  Engenharia de Software  ",
      codigo: "ES101",
      cargaHoraria: 80,
    });

    expect(resultado).toEqual({ ok: true, disciplinaId: "nova-disc-1" });
    expect(db.disciplina.create).toHaveBeenCalledWith({
      data: {
        nome: "Engenharia de Software",
        codigo: "ES101",
        semestre: null,
        cargaHoraria: 80,
        encontrosSemanais: null,
        professorId: "prof-1",
      },
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// SUITE 3 — enrollStudent (com mock do banco de dados)
// ─────────────────────────────────────────────────────────────────────────────

describe("enrollStudent", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("retorna 400 quando os campos obrigatorios estao ausentes", async () => {
    const resultado = await enrollStudent("prof-1", {
      alunoEmail: "",
      disciplinaId: "",
    });

    expect(resultado).toEqual({
      ok: false,
      status: 400,
      message: "E-mail do aluno e ID da disciplina são obrigatórios.",
    });

    expect(db.disciplina.findFirst).not.toHaveBeenCalled();
  });

  it("retorna 404 quando a disciplina nao pertence ao professor", async () => {
    (db.disciplina.findFirst as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce(null);

    const resultado = await enrollStudent("prof-1", {
      alunoEmail: "aluno@inatel.br",
      disciplinaId: "disc-de-outro-prof",
    });

    expect(resultado).toEqual({
      ok: false,
      status: 404,
      message: "Disciplina não encontrada ou sem permissão.",
    });
    expect(db.user.findUnique).not.toHaveBeenCalled();
  });

  it("retorna 404 quando o aluno nao existe com o e-mail informado", async () => {
    (db.disciplina.findFirst as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      id: "disc-1",
      professorId: "prof-1",
    });
    (db.user.findUnique as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce(null);

    const resultado = await enrollStudent("prof-1", {
      alunoEmail: "naoexiste@inatel.br",
      disciplinaId: "disc-1",
    });

    expect(resultado).toEqual({
      ok: false,
      status: 404,
      message: "Aluno não encontrado com este e-mail.",
    });
  });

  it("retorna 400 quando o usuario encontrado pelo e-mail nao tem papel de aluno", async () => {
    (db.disciplina.findFirst as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      id: "disc-1",
      professorId: "prof-1",
    });
    (db.user.findUnique as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      id: "outro-prof",
      role: "PROFESSOR",
    });

    const resultado = await enrollStudent("prof-1", {
      alunoEmail: "professor2@inatel.br",
      disciplinaId: "disc-1",
    });

    expect(resultado).toEqual({
      ok: false,
      status: 400,
      message: "O usuário encontrado não é um aluno.",
    });
  });

  it("retorna 409 quando o aluno ja esta matriculado na disciplina", async () => {
    (db.disciplina.findFirst as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      id: "disc-1",
      professorId: "prof-1",
    });
    (db.user.findUnique as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      id: "aluno-1",
      role: "ALUNO",
    });
    (db.alunoDisciplina.findUnique as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      id: "mat-existente",
    });

    const resultado = await enrollStudent("prof-1", {
      alunoEmail: "aluno@inatel.br",
      disciplinaId: "disc-1",
    });

    expect(resultado).toEqual({
      ok: false,
      status: 409,
      message: "Aluno já matriculado nesta disciplina.",
    });
    expect(db.alunoDisciplina.create).not.toHaveBeenCalled();
  });

  it("cria a matricula e retorna ok quando todos os dados sao validos", async () => {
    (db.disciplina.findFirst as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      id: "disc-1",
      professorId: "prof-1",
    });
    (db.user.findUnique as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      id: "aluno-1",
      role: "ALUNO",
    });
    (db.alunoDisciplina.findUnique as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      null,
    );
    (db.alunoDisciplina.create as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      id: "nova-matricula",
    });

    const resultado = await enrollStudent("prof-1", {
      alunoEmail: "aluno@inatel.br",
      disciplinaId: "disc-1",
    });

    expect(resultado).toEqual({ ok: true, matriculaId: "nova-matricula" });
    expect(db.alunoDisciplina.create).toHaveBeenCalledWith({
      data: { alunoId: "aluno-1", disciplinaId: "disc-1" },
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// SUITE 4 — validateCreateCourse (pura, sem mock)
// ─────────────────────────────────────────────────────────────────────────────

describe("validateCreateCourse", () => {
  it("retorna null para entrada completamente valida", () => {
    expect(
      validateCreateCourse({
        nome: "Engenharia de Software",
        codigo: "ES101",
        semestre: "2025.1",
        cargaHoraria: 80,
        encontrosSemanais: 4,
      }),
    ).toBeNull();
  });

  it("retorna erro quando o nome esta vazio", () => {
    expect(validateCreateCourse({ nome: "   " })).toBe(
      "O nome da disciplina é obrigatório.",
    );
  });

  it("retorna erro quando o nome tem menos de 3 caracteres", () => {
    expect(validateCreateCourse({ nome: "ES" })).toBe(
      "O nome da disciplina deve ter pelo menos 3 caracteres.",
    );
  });

  it("retorna erro quando a carga horaria e zero ou negativa", () => {
    expect(validateCreateCourse({ nome: "Calculo", cargaHoraria: 0 })).toBe(
      "A carga horária deve ser maior que zero.",
    );
    expect(validateCreateCourse({ nome: "Calculo", cargaHoraria: -10 })).toBe(
      "A carga horária deve ser maior que zero.",
    );
  });

  it("retorna erro quando o numero de encontros semanais e zero ou negativo", () => {
    expect(validateCreateCourse({ nome: "Calculo", encontrosSemanais: -1 })).toBe(
      "O número de encontros semanais deve ser maior que zero.",
    );
  });

  it("aceita disciplina sem campos opcionais", () => {
    expect(validateCreateCourse({ nome: "Algoritmos" })).toBeNull();
  });
});
