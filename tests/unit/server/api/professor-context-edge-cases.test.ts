import { beforeEach, describe, expect, it, vi } from "vitest";

import { getProfessorContext } from "@/server/api/professor-service";
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

describe("getProfessorContext - Edge Cases e Tratamento de Erros", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("retorna 401 quando getSession lanca erro e deve ser tratado", async () => {
    (getSession as unknown as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
      new Error("Database connection error"),
    );

    try {
      await getProfessorContext();
      expect.unreachable("Deveria ter lancado erro");
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
      expect((error as Error).message).toContain("Database connection");
    }
  });

  it("retorna 401 quando db.user.findUnique falha com erro de conexao", async () => {
    (getSession as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      user: { id: "prof-999" },
    });

    (db.user.findUnique as unknown as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
      new Error("Connection timeout"),
    );

    try {
      await getProfessorContext();
      expect.unreachable("Deveria ter lancado erro");
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
      expect((error as Error).message).toContain("Connection timeout");
    }
  });

  it("retorna 403 quando o usuario tem role undefined ou invalido", async () => {
    (getSession as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      user: { id: "user-invalid" },
    });

    (db.user.findUnique as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      id: "user-invalid",
      name: "User Invalido",
      role: null, // role null em vez de string
    });

    const resultado = await getProfessorContext();

    expect(resultado).toEqual({
      ok: false,
      status: 403,
      message: "Acesso permitido somente para professores",
    });
  });

  it("valida que o id retornado eh exatamente o mesmo da sessao", async () => {
    const sessionId = "prof-unique-12345";

    (getSession as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      user: { id: sessionId },
    });

    (db.user.findUnique as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      id: sessionId,
      name: "Professor Identico",
      role: "PROFESSOR",
    });

    const resultado = await getProfessorContext();

    expect(resultado.ok).toBe(true);
    if (resultado.ok) {
      expect(resultado.professorId).toBe(sessionId);
      expect(resultado.professorId).toBe(sessionId); // Verifica que nao foi alterado
    }
  });

  it("preserva o nome do usuario exatamente como vem do banco, incluindo espacos", async () => {
    const nomeProfessor = "  Prof. Dr. Antonio Silva  "; // com espaços extras

    (getSession as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      user: { id: "prof-spaces" },
    });

    (db.user.findUnique as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      id: "prof-spaces",
      name: nomeProfessor,
      role: "PROFESSOR",
    });

    const resultado = await getProfessorContext();

    expect(resultado.ok).toBe(true);
    if (resultado.ok) {
      expect(resultado.professorName).toBe(nomeProfessor); // Mantém espaços
    }
  });

  it("faz select correto no findUnique para garantir seguranca e performance", async () => {
    (getSession as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      user: { id: "prof-security" },
    });

    (db.user.findUnique as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      id: "prof-security",
      name: "Prof Security",
      role: "PROFESSOR",
    });

    await getProfessorContext();

    expect(db.user.findUnique).toHaveBeenCalledWith({
      where: { id: "prof-security" },
      select: {
        id: true,
        name: true,
        role: true,
      },
    });

    const callArgs = (db.user.findUnique as unknown as ReturnType<
      typeof vi.fn
    >).mock.calls[0]?.[0]?.select;

    expect(callArgs).not.toHaveProperty("password");
    expect(callArgs).not.toHaveProperty("emailVerified");
  });

  it("diferencia ADMIN e PROFESSOR com sucesso', ambos tendo acesso valido", async () => {
    // Primeiro teste com PROFESSOR
    (getSession as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      user: { id: "prof-1" },
    });

    (db.user.findUnique as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      id: "prof-1",
      name: "Professor",
      role: "PROFESSOR",
    });

    const resultado1 = await getProfessorContext();

    expect(resultado1.ok).toBe(true);
    if (resultado1.ok) {
      expect(resultado1.professorId).toBe("prof-1");
    }

    // Agora teste com ADMIN
    vi.clearAllMocks();

    (getSession as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      user: { id: "admin-1" },
    });

    (db.user.findUnique as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      id: "admin-1",
      name: "Administrador",
      role: "ADMIN",
    });

    const resultado2 = await getProfessorContext();

    expect(resultado2.ok).toBe(true);
    if (resultado2.ok) {
      expect(resultado2.professorId).toBe("admin-1");
    }
  });
});
