import { informacoesMock } from "@/data/informacoesMock";
import { env } from "@/env";
import { db } from "@/server/db";
import { getStudentContext } from "@/server/api/aluno-auth";
import { rateLimit } from "@/server/rate-limit";
import {
  normalizeChatHistory,
  type ChatMessage,
} from "@/server/ai/student-assistant.utils";

const OPENAI_MODEL = "gpt-4.1-mini";

type InstitutionStatus = "aberto" | "urgente" | "encerrado";

type InstitutionContextItem = {
  id: string;
  tipo: string;
  titulo: string;
  descricao: string;
  dataPublicacao: string;
  dataLimite: string;
  link: string;
  status: InstitutionStatus;
};

function getInstitutionStatus(dataLimite: string): InstitutionStatus {
  const hoje = new Date();
  const limite = new Date(dataLimite);

  hoje.setHours(0, 0, 0, 0);
  limite.setHours(0, 0, 0, 0);

  const diasRestantes = Math.ceil(
    (limite.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24),
  );

  if (diasRestantes < 0) {
    return "encerrado";
  }

  if (diasRestantes <= 7) {
    return "urgente";
  }

  return "aberto";
}

function buildInstitutionContext(): InstitutionContextItem[] {
  return informacoesMock.map((item) => ({
    id: item.id,
    tipo: item.tipo,
    titulo: item.titulo,
    descricao: item.descricao,
    dataPublicacao: item.dataPublicacao,
    dataLimite: item.dataLimite,
    link: item.link,
    status: getInstitutionStatus(item.dataLimite),
  }));
}

async function buildAcademicContext(userId: string) {
  const aluno = await db.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      curso: true,
      periodo: true,
    },
  });

  const matriculas = await db.alunoDisciplina.findMany({
    where: { alunoId: userId },
    include: {
      disciplina: {
        select: {
          id: true,
          nome: true,
          professor: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      },
    },
    orderBy: {
      disciplina: {
        nome: "asc",
      },
    },
  });

  const disciplinaIds = matriculas.map((matricula) => matricula.disciplinaId);
  const proximasProvas = await db.prova.findMany({
    where: {
      disciplinaId: { in: disciplinaIds.length ? disciplinaIds : ["__none__"] },
      data: { gte: new Date() },
    },
    include: {
      disciplina: {
        select: {
          id: true,
          nome: true,
        },
      },
    },
    orderBy: { data: "asc" },
    take: 5,
  });

  const totalDisciplinas = matriculas.length;
  const somaMedias = matriculas.reduce(
    (acc, matricula) => acc + (matricula.media ?? 0),
    0,
  );
  const mediaGeral =
    totalDisciplinas > 0 ? Number((somaMedias / totalDisciplinas).toFixed(2)) : null;
  const disciplinasComFaltas = matriculas.filter(
    (matricula) => matricula.faltas > 0,
  ).length;
  const disciplinasEmAtencao = matriculas
    .filter((matricula) => (matricula.media ?? 10) < 7 || matricula.faltas >= 3)
    .map((matricula) => ({
      disciplina: matricula.disciplina.nome,
      media: matricula.media,
      faltas: matricula.faltas,
    }));

  return {
    aluno,
    resumo: {
      totalDisciplinas,
      mediaGeral,
      disciplinasComFaltas,
      disciplinasEmAtencao,
    },
    disciplinas: matriculas.map((matricula) => ({
      id: matricula.disciplina.id,
      nome: matricula.disciplina.nome,
      media: matricula.media,
      faltas: matricula.faltas,
      professor: matricula.disciplina.professor?.name ?? null,
      professorEmail: matricula.disciplina.professor?.email ?? null,
    })),
    proximasProvas: proximasProvas.map((prova) => ({
      id: prova.id,
      titulo: prova.titulo,
      data: prova.data.toISOString(),
      disciplina: prova.disciplina.nome,
    })),
  };
}

function buildSystemPrompt() {
  return [
    "Voce e o Assistente Academico do Portal do Inatel para alunos.",
    "Responda apenas com base no contexto recebido nesta requisicao.",
    "Nao invente regras, datas, politicas, disciplinas ou informacoes institucionais.",
    "Quando a pergunta nao puder ser respondida com seguranca usando o contexto, diga explicitamente que nao encontrou essa informacao no portal e oriente o aluno a consultar a area responsavel.",
    "Separe claramente fatos sobre desempenho academico do aluno e informacoes institucionais.",
    "Se falar de desempenho, cite disciplinas, medias, faltas e provas proximas somente se estiverem no contexto.",
    "Se falar de informacoes institucionais, use apenas os itens fornecidos e mencione links quando existirem.",
    "Responda em portugues do Brasil.",
    "Prefira respostas objetivas, com linguagem clara e tom prestativo, sem parecer definitivo quando houver incerteza.",
  ].join(" ");
}

async function callOpenAI(input: ChatMessage[], context: object) {
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      store: false,
      temperature: 0.2,
      instructions: buildSystemPrompt(),
      input: [
        ...input.map((message) => ({
          role: message.role,
          content: [
            {
              type: message.role === "assistant" ? "output_text" : "input_text",
              text: message.content,
            },
          ],
        })),
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: `Contexto do portal em JSON:\n${JSON.stringify(context, null, 2)}`,
            },
          ],
        },
      ],
      text: {
        format: {
          type: "text",
        },
      },
      max_output_tokens: 500,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI request failed: ${response.status} ${errorText}`);
  }

  const data = (await response.json()) as {
    output_text?: string;
    output?: Array<{
      type?: string;
      content?: Array<{
        type?: string;
        text?: string;
      }>;
    }>;
  };

  if (typeof data.output_text === "string" && data.output_text.trim().length > 0) {
    return data.output_text.trim();
  }

  const fallbackText = data.output
    ?.flatMap((item) => item.content ?? [])
    .filter((item) => item.type === "output_text" && typeof item.text === "string")
    .map((item) => item.text?.trim() ?? "")
    .filter(Boolean)
    .join("\n\n");

  if (fallbackText && fallbackText.length > 0) {
    return fallbackText;
  }

  throw new Error("OpenAI response did not include output text");
}

export async function generateStudentAssistantReply(rawMessages: unknown) {
  const context = await getStudentContext();

  if (!context.ok) {
    return context;
  }

  // Limita o uso por aluno para proteger o orcamento da OpenAI contra abuso.
  const limit = rateLimit(`ia:${context.userId}`, 10, 60_000);

  if (!limit.ok) {
    return {
      ok: false as const,
      status: 429 as const,
      retryAfterMs: limit.retryAfterMs,
      message:
        "Voce atingiu o limite de mensagens. Aguarde um instante e tente novamente.",
    };
  }

  if (!env.OPENAI_API_KEY) {
    return {
      ok: false as const,
      status: 503 as const,
      message:
        "A integracao com IA nao esta configurada. Defina OPENAI_API_KEY no ambiente para habilitar esta funcionalidade.",
    };
  }

  const messages = normalizeChatHistory(rawMessages);

  if (messages.length === 0) {
    return {
      ok: false as const,
      status: 400 as const,
      message: "Envie ao menos uma mensagem valida para o assistente.",
    };
  }

  const academicContext = await buildAcademicContext(context.userId);
  const institutionContext = buildInstitutionContext();

  const responseText = await callOpenAI(messages, {
    aluno: academicContext.aluno,
    desempenho: academicContext.resumo,
    disciplinas: academicContext.disciplinas,
    proximasProvas: academicContext.proximasProvas,
    informacoesInstitucionais: institutionContext,
  });

  return {
    ok: true as const,
    answer: responseText,
  };
}
