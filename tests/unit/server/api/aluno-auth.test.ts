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

describe("getStudentContext", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("retorna 401 quando nao existe sessao", async () => {
    (getSession as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce(null);

    const resultado = await getStudentContext();

    expect(resultado).toEqual({
      ok: false,
      status: 401,
      message: "Nao autenticado",
    });
    expect(db.user.findUnique).not.toHaveBeenCalled();
  });

  it("retorna 401 quando o usuario da sessao nao existe no banco", async () => {
    (getSession as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      user: { id: "user-1" },
    });
    (db.user.findUnique as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce(null);

    const resultado = await getStudentContext();

    expect(resultado).toEqual({
      ok: false,
      status: 401,
      message: "Usuario da sessao nao encontrado",
    });
    expect(db.user.findUnique).toHaveBeenCalledWith({
      where: { id: "user-1" },
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

  it("retorna 403 quando o usuario nao eh aluno", async () => {
    (getSession as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      user: { id: "user-2" },
    });
    (db.user.findUnique as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      id: "user-2",
      name: "Professor Demo",
      email: "professor@inatel.br",
      role: "PROFESSOR",
      curso: null,
      periodo: null,
    });

    const resultado = await getStudentContext();

    expect(resultado).toEqual({
      ok: false,
      status: 403,
      message: "Acesso permitido somente para alunos",
    });
  });

  it("retorna contexto valido quando o usuario eh aluno", async () => {
    (getSession as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      user: { id: "user-3" },
    });
    (db.user.findUnique as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      id: "user-3",
      name: "Aluno Inatel",
      email: "aluno@inatel.br",
      role: "ALUNO",
      curso: "Engenharia de Software",
      periodo: 6,
    });

    const resultado = await getStudentContext();

    expect(resultado).toEqual({
      ok: true,
      userId: "user-3",
      user: {
        id: "user-3",
        name: "Aluno Inatel",
        email: "aluno@inatel.br",
        role: "ALUNO",
        curso: "Engenharia de Software",
        periodo: 6,
      },
    });
  });
});