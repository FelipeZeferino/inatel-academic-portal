import Link from "next/link";
import {
  BookOpen,
  Calendar,
  FileText,
  Users,
  BarChart3,
  Clock,
  ClipboardList,
  AlertCircle,
} from "lucide-react";
import { db } from "../../../server/db";
import { getSession } from "@/server/better-auth/server";
import { redirect } from "next/navigation";
import {
  contarTotalAlunos,
  filtrarProximasProvas,
  contarProvasParaCorrigir,
} from "@/server/professor/dashboard.utils";

export default async function DashboardProfessor() {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  const user = session.user;

  const disciplinas = await db.disciplina.findMany({
    where: { professorId: user.id },
    include: {
      alunos: true,
      provas: true,
    },
  });

  const totalDisciplinas = disciplinas.length;
  const agora = new Date();

  const totalAlunos = contarTotalAlunos(disciplinas);
  const proximasProvas = filtrarProximasProvas(disciplinas, agora);
  const provasParaCorrigir = contarProvasParaCorrigir(disciplinas, agora);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Bem-vindo, {user.name || "Professor"}!
        </h1>
        <p className="mt-1 text-gray-500">Painel de Gestão Acadêmica</p>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Disciplinas</p>
              <p className="mt-1 text-3xl font-bold text-gray-900">
                {totalDisciplinas}
              </p>
            </div>
            <div className="rounded-xl bg-blue-50 p-3">
              <BookOpen className="h-6 w-6 text-blue-500" />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">
                Total de Alunos
              </p>
              <p className="mt-1 text-3xl font-bold text-gray-900">
                {totalAlunos}
              </p>
            </div>
            <div className="rounded-xl bg-green-50 p-3">
              <Users className="h-6 w-6 text-green-500" />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">
                Provas para Corrigir
              </p>
              <p className="mt-1 text-3xl font-bold text-gray-900">
                {provasParaCorrigir}
              </p>
            </div>
            <div className="rounded-xl bg-amber-50 p-3">
              <AlertCircle className="h-6 w-6 text-amber-500" />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">
                Próximas Provas
              </p>
              <p className="mt-1 text-3xl font-bold text-gray-900">
                {proximasProvas.length}
              </p>
            </div>
            <div className="rounded-xl bg-purple-50 p-3">
              <Calendar className="h-6 w-6 text-purple-500" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div className="rounded-xl border border-gray-100 bg-white shadow-sm">
            <div className="border-b border-gray-100 p-6">
              <h2 className="flex items-center gap-2 text-lg font-bold text-gray-900">
                <BookOpen className="h-5 w-5 text-blue-500" />
                Minhas Disciplinas
              </h2>
            </div>
            <div className="p-6">
              {disciplinas.length === 0 ? (
                <p className="py-8 text-center text-sm text-gray-400">
                  Nenhuma disciplina atribuída no momento.
                </p>
              ) : (
                <div className="space-y-4">
                  {disciplinas.map((d) => (
                    <div
                      key={d.id}
                      className="rounded-xl border border-gray-100 p-5 transition-colors hover:border-blue-200 hover:bg-blue-50/30"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex flex-wrap items-center gap-3">
                          {d.codigo && (
                            <span className="rounded-lg bg-blue-100 px-2.5 py-1 text-xs font-semibold text-blue-700">
                              {d.codigo}
                            </span>
                          )}
                          {d.semestre && (
                            <span className="text-sm text-gray-400">
                              {d.semestre}
                            </span>
                          )}
                        </div>
                        <span className="text-sm font-medium text-gray-500">
                          Alunos{" "}
                          <span className="text-xl font-bold text-gray-900">
                            {d.alunos.length}
                          </span>
                        </span>
                      </div>
                      <h3 className="mt-2 text-lg font-bold text-gray-900">
                        {d.nome}
                      </h3>
                      {(d.cargaHoraria !== null ||
                        d.encontrosSemanais !== null) && (
                        <p className="mt-1 text-sm text-gray-400">
                          {d.cargaHoraria !== null && `${d.cargaHoraria}h`}
                          {d.cargaHoraria !== null &&
                            d.encontrosSemanais !== null &&
                            " • "}
                          {d.encontrosSemanais !== null &&
                            `${d.encontrosSemanais} encontros semanais`}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-gray-100 bg-white shadow-sm">
            <div className="border-b border-gray-100 p-6">
              <h2 className="flex items-center gap-2 text-lg font-bold text-gray-900">
                <Calendar className="h-5 w-5 text-blue-500" />
                Próximas Provas Agendadas
              </h2>
            </div>
            <div className="p-6">
              {proximasProvas.length === 0 ? (
                <p className="py-8 text-center text-sm text-gray-400">
                  Nenhuma prova agendada no momento.
                </p>
              ) : (
                <div className="space-y-4">
                  {proximasProvas.map((prova) => (
                    <div
                      key={prova.id}
                      className="rounded-xl border border-gray-100 p-4 transition-colors hover:border-blue-200"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold text-gray-900">
                            {prova.titulo}
                          </h3>
                          <p className="mt-0.5 text-sm text-gray-500">
                            {prova.disciplinaNome}
                            {prova.disciplinaCodigo &&
                              ` (${prova.disciplinaCodigo})`}
                          </p>
                        </div>
                        <div className="text-right text-sm text-gray-400">
                          <p>
                            {prova.data.toLocaleDateString("pt-BR", {
                              day: "2-digit",
                              month: "2-digit",
                              year: "numeric",
                            })}
                          </p>
                          <p>
                            {prova.data.toLocaleTimeString("pt-BR", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                            {prova.sala && ` - ${prova.sala}`}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="h-fit rounded-xl border border-gray-100 bg-white shadow-sm">
          <div className="border-b border-gray-100 p-6">
            <h2 className="text-lg font-bold text-gray-900">Acesso Rápido</h2>
          </div>
          <div className="space-y-1 p-4">
            <Link
              href="/professor/manage"
              className="group flex items-center gap-3 rounded-lg p-3 transition-colors hover:bg-blue-50"
            >
              <div className="rounded-lg bg-blue-100 p-2.5 transition-colors group-hover:bg-blue-200">
                <BookOpen className="h-5 w-5 text-blue-600" />
              </div>
              <span className="font-medium text-gray-800">
                Gerenciar Disciplinas
              </span>
            </Link>

            <Link
              href="/professor/notes"
              className="group flex items-center gap-3 rounded-lg p-3 transition-colors hover:bg-green-50"
            >
              <div className="rounded-lg bg-green-100 p-2.5 transition-colors group-hover:bg-green-200">
                <ClipboardList className="h-5 w-5 text-green-600" />
              </div>
              <span className="font-medium text-gray-800">Lançar Notas</span>
            </Link>

            <Link
              href="/professor/tests"
              className="group flex items-center gap-3 rounded-lg p-3 transition-colors hover:bg-purple-50"
            >
              <div className="rounded-lg bg-purple-100 p-2.5 transition-colors group-hover:bg-purple-200">
                <FileText className="h-5 w-5 text-purple-600" />
              </div>
              <span className="font-medium text-gray-800">Agendar Provas</span>
            </Link>

            <Link
              href="/professor/reports"
              className="group flex items-center gap-3 rounded-lg p-3 transition-colors hover:bg-orange-50"
            >
              <div className="rounded-lg bg-orange-100 p-2.5 transition-colors group-hover:bg-orange-200">
                <BarChart3 className="h-5 w-5 text-orange-600" />
              </div>
              <span className="font-medium text-gray-800">Relatórios</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
