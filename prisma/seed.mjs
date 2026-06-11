import { PrismaClient, Role } from "../generated/prisma/index.js";
import { hashPassword } from "better-auth/crypto";

const prisma = new PrismaClient();

const users = {
  admin: {
    id: "seed-admin",
    name: "Administrador do Portal",
    email: "admin@inatel.br",
    role: Role.ADMIN,
    curso: "Administracao Academica",
    periodo: null,
    image: null,
    password: "Admin@123456",
  },
  professor1: {
    id: "seed-prof-carlos",
    name: "Carlos Henrique",
    email: "carlos.henrique@inatel.br",
    role: Role.PROFESSOR,
    curso: "Engenharia de Software",
    periodo: null,
    image: null,
    password: "Professor@123",
  },
  professor2: {
    id: "seed-prof-marina",
    name: "Marina Souza",
    email: "marina.souza@inatel.br",
    role: Role.PROFESSOR,
    curso: "Engenharia de Computacao",
    periodo: null,
    image: null,
    password: "Professor@123",
  },
  aluno1: {
    id: "seed-aluno-ana",
    name: "Ana Beatriz",
    email: "ana.beatriz@inatel.br",
    role: Role.ALUNO,
    curso: "Engenharia de Software",
    periodo: 5,
    image: null,
    password: "Aluno@123",
  },
  aluno2: {
    id: "seed-aluno-lucas",
    name: "Lucas Pereira",
    email: "lucas.pereira@inatel.br",
    role: Role.ALUNO,
    curso: "Engenharia de Computacao",
    periodo: 7,
    image: null,
    password: "Aluno@123",
  },
  aluno3: {
    id: "seed-aluno-julia",
    name: "Julia Martins",
    email: "julia.martins@inatel.br",
    role: Role.ALUNO,
    curso: "Engenharia de Software",
    periodo: 3,
    image: null,
    password: "Aluno@123",
  },
};

const disciplinas = [
  {
    id: "seed-disc-c14",
    nome: "C14 - Engenharia de Software",
    professorId: users.professor1.id,
  },
  {
    id: "seed-disc-bd2",
    nome: "Banco de Dados II",
    professorId: users.professor2.id,
  },
  {
    id: "seed-disc-ia-aplicada",
    nome: "IA Aplicada a Sistemas",
    professorId: users.professor1.id,
  },
];

const matriculas = [
  {
    id: "seed-mat-ana-c14",
    alunoId: users.aluno1.id,
    disciplinaId: "seed-disc-c14",
    faltas: 2,
    media: 8.7,
  },
  {
    id: "seed-mat-ana-ia",
    alunoId: users.aluno1.id,
    disciplinaId: "seed-disc-ia-aplicada",
    faltas: 1,
    media: 9.1,
  },
  {
    id: "seed-mat-lucas-bd2",
    alunoId: users.aluno2.id,
    disciplinaId: "seed-disc-bd2",
    faltas: 0,
    media: 7.8,
  },
  {
    id: "seed-mat-julia-c14",
    alunoId: users.aluno3.id,
    disciplinaId: "seed-disc-c14",
    faltas: 3,
    media: 8.2,
  },
];

const provas = [
  {
    id: "seed-prova-c14-p1",
    titulo: "P1 - Engenharia de Software",
    disciplinaId: "seed-disc-c14",
    data: new Date("2026-04-20T14:00:00.000Z"),
  },
  {
    id: "seed-prova-bd2-trabalho",
    titulo: "Trabalho Pratico - Banco de Dados II",
    disciplinaId: "seed-disc-bd2",
    data: new Date("2026-04-25T18:30:00.000Z"),
  },
  {
    id: "seed-prova-ia-seminario",
    titulo: "Seminario - IA Aplicada",
    disciplinaId: "seed-disc-ia-aplicada",
    data: new Date("2026-05-03T16:00:00.000Z"),
  },
];

async function seedUsers() {
  for (const user of Object.values(users)) {
    await prisma.user.upsert({
      where: { email: user.email },
      update: {
        name: user.name,
        emailVerified: true,
        role: user.role,
        curso: user.curso,
        periodo: user.periodo,
        image: user.image,
      },
      create: {
        id: user.id,
        name: user.name,
        email: user.email,
        emailVerified: true,
        role: user.role,
        curso: user.curso,
        periodo: user.periodo,
        image: user.image,
      },
    });
  }
}

async function seedAccounts() {
  for (const user of Object.values(users)) {
    const passwordHash = await hashPassword(user.password);
    const existingAccount = await prisma.account.findFirst({
      where: {
        userId: user.id,
        providerId: "credential",
      },
    });

    if (existingAccount) {
      await prisma.account.update({
        where: { id: existingAccount.id },
        data: {
          accountId: user.id,
          password: passwordHash,
        },
      });

      continue;
    }

    await prisma.account.create({
      data: {
        id: `seed-account-${user.id}`,
        userId: user.id,
        providerId: "credential",
        accountId: user.id,
        password: passwordHash,
      },
    });
  }
}

async function seedDisciplinas() {
  for (const disciplina of disciplinas) {
    await prisma.disciplina.upsert({
      where: { id: disciplina.id },
      update: {
        nome: disciplina.nome,
        professorId: disciplina.professorId,
      },
      create: disciplina,
    });
  }
}

async function seedMatriculas() {
  for (const matricula of matriculas) {
    await prisma.alunoDisciplina.upsert({
      where: {
        alunoId_disciplinaId: {
          alunoId: matricula.alunoId,
          disciplinaId: matricula.disciplinaId,
        },
      },
      update: {
        faltas: matricula.faltas,
        media: matricula.media,
      },
      create: matricula,
    });
  }
}

async function seedProvas() {
  for (const prova of provas) {
    await prisma.prova.upsert({
      where: { id: prova.id },
      update: {
        titulo: prova.titulo,
        data: prova.data,
        disciplinaId: prova.disciplinaId,
      },
      create: prova,
    });
  }
}

async function main() {
  await seedUsers();
  await seedAccounts();
  await seedDisciplinas();
  await seedMatriculas();
  await seedProvas();

  console.log("Seed concluido.");
  console.log("Usuarios e credenciais seed:");
  console.log("- admin@inatel.br / Admin@123456 (ADMIN)");
  console.log("- carlos.henrique@inatel.br / Professor@123 (PROFESSOR)");
  console.log("- marina.souza@inatel.br / Professor@123 (PROFESSOR)");
  console.log("- ana.beatriz@inatel.br / Aluno@123 (ALUNO)");
  console.log("- lucas.pereira@inatel.br / Aluno@123 (ALUNO)");
  console.log("- julia.martins@inatel.br / Aluno@123 (ALUNO)");
}

main()
  .catch((error) => {
    console.error("Falha ao executar seed.");
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
