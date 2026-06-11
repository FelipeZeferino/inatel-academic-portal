import Link from "next/link";
import { BookOpen, Clock, User, AlertCircle, TrendingUp } from "lucide-react";
import { db } from "../../../server/db";
import { getSession } from "@/server/better-auth/server";
import { redirect } from "next/navigation";

export default async function DisciplinasAluno() {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  const user = session.user;

  const matriculas = await db.alunoDisciplina.findMany({
    where: { alunoId: user.id },
    include: {
      disciplina: {
        include: {
          professor: true,
        },
      },
    },
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Minhas Disciplinas</h1>
        <p className="mt-1 text-gray-600">
          2026/1 - Visualize suas disciplinas e desempenho
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {matriculas.map((matricula) => {
          const disciplina = matricula.disciplina;
          const numeroFaltas = matricula.faltas;
          const media = matricula.media;

          const limiteFaltas = 18;
          const percentualFaltas = (numeroFaltas / limiteFaltas) * 100;

          return (
            <Link
              key={disciplina.id}
              href={`/aluno/disciplina/${disciplina.id}`}
              className="rounded-lg border border-gray-200 bg-white shadow transition-shadow hover:border-blue-300 hover:shadow-lg"
            >
              <div className="p-6">
                <div className="mb-4 flex items-start justify-between">
                  <div className="flex-1">
                    <div className="mb-2 flex items-center gap-2">
                      <BookOpen className="h-5 w-5 text-blue-600" />
                      <span className="text-sm font-medium text-gray-600">
                        CÓDIGO
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-gray-900">
                      {disciplina.nome}
                    </h3>
                  </div>
                  {media !== null && (
                    <div className="rounded-full bg-blue-100 px-3 py-1">
                      <span className="font-bold text-blue-800">
                        {media.toFixed(1)}
                      </span>
                    </div>
                  )}
                </div>

                <div className="mb-4 flex items-center gap-2 text-sm text-gray-600">
                  <User className="h-4 w-4" />
                  <span>
                    {disciplina.professor?.name ?? "Professor não atribuído"}
                  </span>
                </div>

                <div className="mb-4">
                  <div className="flex flex-wrap gap-2">
                    <div className="flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1 text-sm">
                      <Clock className="h-3 w-3 text-gray-600" />
                      <span className="text-gray-700">A Definir</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 border-t border-gray-200 pt-4">
                  <div className="flex items-center gap-2">
                    <TrendingUp
                      className={`h-4 w-4 ${
                        media && media >= 7
                          ? "text-green-600"
                          : "text-yellow-600"
                      }`}
                    />
                    <div>
                      <p className="text-xs text-gray-600">Média</p>
                      <p className="font-semibold text-gray-900">
                        {media !== null ? media.toFixed(1) : "N/A"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <AlertCircle
                      className={`h-4 w-4 ${
                        percentualFaltas > 75 ? "text-red-600" : "text-gray-600"
                      }`}
                    />
                    <div>
                      <p className="text-xs text-gray-600">Faltas</p>
                      <p className="font-semibold text-gray-900">
                        {numeroFaltas}/{limiteFaltas}
                      </p>
                    </div>
                  </div>
                </div>

                {percentualFaltas > 75 && (
                  <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3">
                    <p className="flex items-center gap-2 text-xs text-red-800">
                      <AlertCircle className="h-4 w-4" />
                      Atenção: Você está próximo do limite de faltas!
                    </p>
                  </div>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
