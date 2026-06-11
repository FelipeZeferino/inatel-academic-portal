import Link from "next/link";
import {
  BookOpen,
  Calendar,
  FileText,
  TrendingUp,
  AlertCircle,
  Award,
  Clock,
} from "lucide-react";
import { db } from "../../../server/db";
import { getSession } from "@/server/better-auth/server";
import { redirect } from "next/navigation";

export default async function DashboardAluno() {
  const session = await getSession();

  // Ainda mantemos a verificação aqui para garantir a segurança da página
  if (!session) {
    redirect("/login");
  }

  const user = session.user;

  const aluno = await db.user.findUnique({
    where: { id: user.id },
  });

  const matriculas = await db.alunoDisciplina.findMany({
    where: { alunoId: user.id },
    include: { disciplina: true },
  });

  const disciplinasIds = matriculas.map((m) => m.disciplinaId);
  const proximasProvas = await db.prova.findMany({
    where: {
      disciplinaId: { in: disciplinasIds },
      data: { gte: new Date() },
    },
    orderBy: { data: "asc" },
    take: 3,
    include: {
      disciplina: true,
    },
  });

  const totalDisciplinas = matriculas.length;
  const somaMedias = matriculas.reduce((acc, m) => acc + (m.media ?? 0), 0);
  const mediaGeral = totalDisciplinas > 0 ? somaMedias / totalDisciplinas : 0;
  const disciplinasComFaltas = matriculas.filter((m) => m.faltas > 0).length;

  return (
    // A tag <header> que estava aqui foi removida! O layout.tsx vai cuidar disso.
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Bem-vindo, {aluno?.name ?? "Aluno"}!
        </h1>
        <p className="mt-1 text-gray-600">
          {aluno?.curso ?? "Curso não definido"} - {aluno?.periodo ?? 1}o
          Periodo
        </p>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg bg-white p-6 shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Disciplinas</p>
              <p className="mt-1 text-3xl font-bold text-gray-900">
                {totalDisciplinas}
              </p>
            </div>
            <div className="rounded-lg bg-blue-100 p-3">
              <BookOpen className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="rounded-lg bg-white p-6 shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Media Geral</p>
              <p className="mt-1 text-3xl font-bold text-gray-900">
                {mediaGeral.toFixed(1)}
              </p>
            </div>
            <div className="rounded-lg bg-green-100 p-3">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="rounded-lg bg-white p-6 shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Proximas Provas</p>
              <p className="mt-1 text-3xl font-bold text-gray-900">
                {proximasProvas.length}
              </p>
            </div>
            <div className="rounded-lg bg-yellow-100 p-3">
              <Calendar className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="rounded-lg bg-white p-6 shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Com Faltas</p>
              <p className="mt-1 text-3xl font-bold text-gray-900">
                {disciplinasComFaltas}
              </p>
            </div>
            <div className="rounded-lg bg-red-100 p-3">
              <AlertCircle className="h-6 w-6 text-red-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="rounded-lg bg-white shadow lg:col-span-2">
          <div className="border-b border-gray-200 p-6">
            <h2 className="flex items-center gap-2 text-xl font-bold text-gray-900">
              <Calendar className="h-5 w-5 text-blue-600" />
              Proximas Provas
            </h2>
          </div>
          <div className="p-6">
            {proximasProvas.length === 0 ? (
              <p className="py-8 text-center text-gray-500">
                Nenhuma prova agendada no momento. Aproveite para estudar!
              </p>
            ) : (
              <div className="space-y-4">
                {proximasProvas.map((prova) => (
                  <div
                    key={prova.id}
                    className="rounded-lg border border-gray-200 p-4 transition-colors hover:border-blue-300"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">
                          {prova.titulo}
                        </h3>
                        <p className="mt-1 text-sm text-gray-600">
                          {prova.disciplina.nome}
                        </p>
                        <div className="mt-2 flex items-center gap-4 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {prova.data.toLocaleDateString("pt-BR")}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {prova.data.toLocaleTimeString("pt-BR", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="rounded-lg bg-white shadow">
          <div className="border-b border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900">Acesso Rapido</h2>
          </div>
          <div className="space-y-3 p-6">
            <Link
              href="/aluno/disciplinas"
              className="group flex items-center gap-3 rounded-lg p-3 transition-colors hover:bg-blue-50"
            >
              <div className="rounded-lg bg-blue-100 p-2 transition-colors group-hover:bg-blue-200">
                <BookOpen className="h-5 w-5 text-blue-600" />
              </div>
              <span className="font-medium text-gray-900">
                Minhas Disciplinas
              </span>
            </Link>

            <Link
              href="/aluno/informacoes"
              className="group flex items-center gap-3 rounded-lg p-3 transition-colors hover:bg-green-50"
            >
              <div className="rounded-lg bg-green-100 p-2 transition-colors group-hover:bg-green-200">
                <FileText className="h-5 w-5 text-green-600" />
              </div>
              <span className="font-medium text-gray-900">
                Editais e Eventos
              </span>
            </Link>

            <button className="group flex w-full items-center gap-3 rounded-lg p-3 transition-colors hover:bg-purple-50">
              <div className="rounded-lg bg-purple-100 p-2 transition-colors group-hover:bg-purple-200">
                <Award className="h-5 w-5 text-purple-600" />
              </div>
              <span className="font-medium text-gray-900">
                Historico Academico
              </span>
            </button>

            <button className="group flex w-full items-center gap-3 rounded-lg p-3 transition-colors hover:bg-orange-50">
              <div className="rounded-lg bg-orange-100 p-2 transition-colors group-hover:bg-orange-200">
                <Calendar className="h-5 w-5 text-orange-600" />
              </div>
              <span className="font-medium text-gray-900">
                Calendario Academico
              </span>
            </button>
          </div>
        </div>
      </div>

      <div className="mt-6 rounded-lg border border-yellow-200 bg-yellow-50 p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="mt-0.5 h-5 w-5 text-yellow-600" />
          <div>
            <h3 className="font-semibold text-yellow-900">Atencao!</h3>
            <p className="mt-1 text-sm text-yellow-800">
              As inscricoes para o programa de Iniciacao Cientifica encerram em
              15/04/2026. Nao perca o prazo!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
