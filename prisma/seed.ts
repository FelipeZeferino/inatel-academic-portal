import { webcrypto } from "node:crypto";
if (!globalThis.crypto) (globalThis as any).crypto = webcrypto;

import { PrismaClient } from "../generated/prisma";
import { hashPassword } from "better-auth/crypto";
import { generateRandomString } from "better-auth/crypto";

const db = new PrismaClient();

async function main() {
  const users = [
    {
      name: "Aluno Inatel",
      email: "aluno@inatel.br",
      password: "aluno123",
      role: "ALUNO" as const,
    },
    {
      name: "Admin Inatel",
      email: "admin@inatel.br",
      password: "admin123",
      role: "ADMIN" as const,
    },
    {
      name: "Professor Demo",
      email: "professor@inatel.br",
      password: "professor123",
      role: "PROFESSOR" as const,
    },
  ];

  for (const u of users) {
    const existing = await db.user.findUnique({ where: { email: u.email } });
    if (existing) {
      console.log(`Usuário já existe: ${u.email}`);
      continue;
    }

    const id = generateRandomString(32);
    const hashed = await hashPassword(u.password);

    await db.user.create({
      data: {
        id,
        name: u.name,
        email: u.email,
        emailVerified: true,
        role: u.role,
        accounts: {
          create: {
            id: generateRandomString(32),
            accountId: id,
            providerId: "credential",
            password: hashed,
          },
        },
      },
    });

    console.log(`Criado: ${u.email} (${u.role}) — senha: ${u.password}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
