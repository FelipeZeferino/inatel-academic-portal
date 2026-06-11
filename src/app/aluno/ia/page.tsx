import { Bot, Sparkles } from "lucide-react";
import { redirect } from "next/navigation";

import { StudentAiChat } from "@/components/StudentAiChat";
import { getStudentContext } from "@/server/api/aluno-auth";

export default async function AlunoIaPage() {
  const context = await getStudentContext();

  if (!context.ok) {
    redirect(context.status === 401 ? "/login" : "/professor/dashboard");
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[linear-gradient(180deg,#f6f9ff_0%,#eef3fb_100%)] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-blue-100 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-blue-800">
              <Sparkles className="h-4 w-4" />
              Nova experiencia com IA
            </div>
            <h1 className="mt-4 text-4xl font-bold tracking-tight text-slate-950">
              Assistente do aluno
            </h1>
            <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">
              Faça perguntas sobre seu desempenho no semestre e sobre as
              informações institucionais disponíveis no portal. As respostas são
              limitadas aos dados cadastrados no sistema.
            </p>
          </div>

          <div className="inline-flex items-center gap-3 self-start rounded-[22px] bg-white px-5 py-4 text-slate-700 shadow-[0_16px_48px_rgba(38,66,120,0.1)]">
            <div className="rounded-2xl bg-[#eff4fd] p-3 text-blue-700">
              <Bot className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">
                Respostas personalizadas para {context.user.name}
              </p>
              <p className="text-sm text-slate-600">
                {context.user.curso ?? "Curso nao definido"} •{" "}
                {context.user.periodo ?? 1}o periodo
              </p>
            </div>
          </div>
        </div>

        <StudentAiChat />
      </div>
    </div>
  );
}
