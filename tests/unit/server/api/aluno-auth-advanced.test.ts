import { beforeEach, describe, expect, it, vi } from "vitest";

import { getStudentContext } from "@/server/api/aluno-auth";
import { db } from "@/server/db";
import { getSession } from "@/server/better-auth/server";

vi.mock("@/server/db", () => ({
  db: {
    user: {
      findUnique: vi.fn(),
    },
  },
}));

vi.mock("@/server/better-auth/server", () => ({
  getSession: vi.fn(),
}));

describe("getStudentContext - Validação de Dados e Autorização", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("retorna 403 quando usuario tem role ADMIN mesmo com dados validos", async () => {
    (getSession as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      user: { id: "admin-tries-student" },
    });

    (db.user.findUnique as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      id: "admin-tries-student",
      name: "Admin Tentando Acessar",
      email: "admin@example.com",
      role: "ADMIN",
      curso: "Engenharia",
      periodo: 1,
    });

    const resultado = await getStudentContext();

    expect(resultado.ok).toBe(false);
    if (resultado.ok) {
      throw new Error("Expected student context access to be denied");
    }
    expect(resultado.status).toBe(403);
    expect(resultado.message).toContain("Acesso permitido somente para alunos");
  });

  it("valida que a consulta ao banco busca exatamente os campos necessarios", async () => {
    (getSession as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      user: { id: "aluno-select-test" },
    });

    (db.user.findUnique as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      id: "aluno-select-test",
      name: "Aluno Test Select",
      email: "aluno@test.com",
      role: "ALUNO",
      curso: "Computação",
      periodo: 3,
    });

    await getStudentContext();

    expect(db.user.findUnique).toHaveBeenCalledWith({
      where: { id: "aluno-select-test" },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        curso: true,
        periodo: true,
      },
    });
  });

  it("preserva valores null para curso e periodo quando nao estao definidos", async () => {
    (getSession as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      user: { id: "aluno-null-values" },
    });

    (db.user.findUnique as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      id: "aluno-null-values",
      name: "Aluno Sem Curso",
      email: "novo@aluno.com",
      role: "ALUNO",
      curso: null,
      periodo: null,
    });

    const resultado = await getStudentContext();

    expect(resultado.ok).toBe(true);
    if (resultado.ok) {
      expect(resultado.user.curso).toBeNull();
      expect(resultado.user.periodo).toBeNull();
    }
  });

  it("valida tipos de dados corretos no retorno de sucesso", async () => {
    (getSession as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      user: { id: "aluno-types-test" },
    });

    (db.user.findUnique as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      id: "aluno-types-test",
      name: "Aluno Tipos",
      email: "tipos@aluno.com",
      role: "ALUNO",
      curso: "Engenharia de Software",
      periodo: 5,
    });

    const resultado = await getStudentContext();

    expect(resultado.ok).toBe(true);
    if (resultado.ok) {
      expect(typeof resultado.userId).toBe("string");
      expect(typeof resultado.user.id).toBe("string");
      expect(typeof resultado.user.name).toBe("string");
      expect(typeof resultado.user.email).toBe("string");
      expect(typeof resultado.user.role).toBe("string");
      expect(typeof resultado.user.curso).toMatch(/string|object/); // string ou null
      expect(typeof resultado.user.periodo).toMatch(/number|object/); // number ou null
    }
  });

  it("recupera dados completos do aluno com todos os campos preenchidos", async () => {
    const studentData = {
      id: "aluno-completo-1",
      name: "João Completo",
      email: "joao.completo@inatel.br",
      role: "ALUNO" as const,
      curso: "Engenharia Elétrica",
      periodo: 7,
    };

    (getSession as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      user: { id: studentData.id },
    });

    (db.user.findUnique as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      studentData,
    );

    const resultado = await getStudentContext();

    expect(resultado.ok).toBe(true);
    if (resultado.ok) {
      expect(resultado).toEqual({
        ok: true,
        userId: studentData.id,
        user: studentData,
      });
    }
  });

  it("verifica que o findUnique eh chamado exatamente uma vez por requisicao", async () => {
    (getSession as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      user: { id: "aluno-once-test" },
    });

    (db.user.findUnique as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      id: "aluno-once-test",
      name: "Test Once",
      email: "once@test.com",
      role: "ALUNO",
      curso: null,
      periodo: null,
    });

    await getStudentContext();

    expect(db.user.findUnique).toHaveBeenCalledTimes(1);
    expect(db.user.findUnique).toHaveBeenCalledOnce();
  });

  it("trata professor como usuario nao-aluno e nega acesso", async () => {
    (getSession as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      user: { id: "prof-tries-student-access" },
    });

    (db.user.findUnique as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      id: "prof-tries-student-access",
      name: "Professor Tentando",
      email: "prof@inatel.br",
      role: "PROFESSOR",
      curso: null,
      periodo: null,
    });

    const resultado = await getStudentContext();

    expect(resultado.ok).toBe(false);
    if (resultado.ok) {
      throw new Error("Expected student context access to be denied");
    }
    expect(resultado.status).toBe(403);
    expect(resultado.message).toContain("Acesso permitido somente para alunos");
  });

  it("mantem consistencia entre userId e user.id no retorno bem-sucedido", async () => {
    const userId = "aluno-consistent-123";

    (getSession as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      user: { id: userId },
    });

    (db.user.findUnique as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      id: userId,
      name: "Consistent Aluno",
      email: "consistent@aluno.com",
      role: "ALUNO",
      curso: "Sistema de Informação",
      periodo: 2,
    });

    const resultado = await getStudentContext();

    expect(resultado.ok).toBe(true);
    if (resultado.ok) {
      expect(resultado.userId).toBe(resultado.user.id);
      expect(resultado.userId).toBe(userId);
    }
  });
});
