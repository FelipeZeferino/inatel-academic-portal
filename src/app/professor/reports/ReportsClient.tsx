"use client";

import { useState } from "react";
import {
  BarChart3,
  Users,
  BookOpen,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  CheckCircle,
  XCircle,
} from "lucide-react";

type Aluno = { id: string; name: string; email: string };
type Matricula = { id: string; alunoId: string; media: number | null; faltas: number; aluno: Aluno };
type Prova = { id: string; titulo: string; data: string; sala: string | null; conteudo: string | null; disciplinaId: string };
type Disciplina = {
  id: string;
  nome: string;
  codigo: string | null;
  cargaHoraria: number | null;
  alunos: Matricula[];
  provas: Prova[];
};

function calcularStats(d: Disciplina) {
  const maxFaltas = (d.cargaHoraria ?? 80) * 0.25;
  const comNota = d.alunos.filter((a) => a.media !== null);
  const mediaGeral =
    comNota.length > 0
      ? comNota.reduce((acc, a) => acc + (a.media ?? 0), 0) / comNota.length
      : null;
  const aprovados = d.alunos.filter(
    (a) => a.media !== null && a.media >= 6 && a.faltas <= maxFaltas,
  ).length;
  const reprovadosFaltas = d.alunos.filter((a) => a.faltas > maxFaltas).length;
  const reprovadosNota = d.alunos.filter(
    (a) => a.media !== null && a.media < 6 && a.faltas <= maxFaltas,
  ).length;
  const semNota = d.alunos.filter((a) => a.media === null && a.faltas <= maxFaltas).length;
  const taxaAprovacao =
    d.alunos.length > 0 ? (aprovados / d.alunos.length) * 100 : null;

  return { mediaGeral, aprovados, reprovadosFaltas, reprovadosNota, semNota, taxaAprovacao, maxFaltas };
}

function BarraProgresso({ valor, max, cor }: { valor: number; max: number; cor: string }) {
  const pct = max > 0 ? Math.min((valor / max) * 100, 100) : 0;
  return (
    <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
      <div className={`h-2 rounded-full transition-all ${cor}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

function CardResumoGeral({ disciplinas }: { disciplinas: Disciplina[] }) {
  const totalAlunos = disciplinas.reduce((acc, d) => acc + d.alunos.length, 0);
  const totalProvas = disciplinas.reduce((acc, d) => acc + d.provas.length, 0);
  const provasPassadas = disciplinas
    .flatMap((d) => d.provas)
    .filter((p) => new Date(p.data) < new Date()).length;

  const todasMedias = disciplinas
    .flatMap((d) => d.alunos)
    .filter((a) => a.media !== null)
    .map((a) => a.media!);
  const mediaGeral =
    todasMedias.length > 0
      ? todasMedias.reduce((a, b) => a + b, 0) / todasMedias.length
      : null;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {[
        { label: "Disciplinas", valor: disciplinas.length, icone: <BookOpen className="w-5 h-5 text-blue-500" />, bg: "bg-blue-50" },
        { label: "Total de Alunos", valor: totalAlunos, icone: <Users className="w-5 h-5 text-green-500" />, bg: "bg-green-50" },
        { label: "Provas Realizadas", valor: provasPassadas, icone: <BarChart3 className="w-5 h-5 text-purple-500" />, bg: "bg-purple-50" },
        {
          label: "Média Geral",
          valor: mediaGeral !== null ? mediaGeral.toFixed(1) : "—",
          icone: <TrendingUp className="w-5 h-5 text-orange-500" />,
          bg: "bg-orange-50",
        },
      ].map(({ label, valor, icone, bg }) => (
        <div key={label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm font-medium">{label}</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{valor}</p>
            </div>
            <div className={`${bg} p-3 rounded-xl`}>{icone}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

function CardRelatorioDisciplina({ disciplina }: { disciplina: Disciplina }) {
  const [aba, setAba] = useState<"visao" | "alunos">("visao");
  const stats = calcularStats(disciplina);

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="p-5 border-b border-gray-100">
        <div className="flex items-center gap-3 flex-wrap">
          <BookOpen className="w-5 h-5 text-blue-500 shrink-0" />
          {disciplina.codigo && (
            <span className="bg-blue-100 text-blue-700 text-xs font-semibold px-2.5 py-1 rounded-lg">
              {disciplina.codigo}
            </span>
          )}
          <span className="font-bold text-gray-900 text-lg">{disciplina.nome}</span>
          <span className="text-gray-400 text-sm ml-auto">{disciplina.alunos.length} alunos</span>
        </div>
      </div>

      <div className="flex border-b border-gray-100">
        {(["visao", "alunos"] as const).map((a) => (
          <button
            key={a}
            onClick={() => setAba(a)}
            className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
              aba === a
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {a === "visao" ? "Visão Geral" : "Por Aluno"}
          </button>
        ))}
      </div>

      {aba === "visao" ? (
        <div className="p-5 space-y-5">
          {disciplina.alunos.length === 0 ? (
            <p className="text-center text-gray-400 text-sm py-4">Nenhum aluno matriculado.</p>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 font-medium">Média da turma</span>
                <span className={`text-2xl font-bold ${
                  stats.mediaGeral === null ? "text-gray-400" :
                  stats.mediaGeral >= 6 ? "text-green-600" : "text-red-500"
                }`}>
                  {stats.mediaGeral !== null ? stats.mediaGeral.toFixed(1) : "—"}
                </span>
              </div>

              {stats.taxaAprovacao !== null && (
                <div>
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className="text-gray-600 font-medium">Taxa de aprovação</span>
                    <span className="font-bold text-gray-800">{stats.taxaAprovacao.toFixed(0)}%</span>
                  </div>
                  <BarraProgresso valor={stats.aprovados} max={disciplina.alunos.length} cor="bg-green-400" />
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-2 bg-green-50 rounded-xl p-3">
                  <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
                  <div>
                    <p className="text-xs text-gray-500">Aprovados</p>
                    <p className="font-bold text-green-700">{stats.aprovados}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 bg-red-50 rounded-xl p-3">
                  <XCircle className="w-4 h-4 text-red-400 shrink-0" />
                  <div>
                    <p className="text-xs text-gray-500">Rep. (nota)</p>
                    <p className="font-bold text-red-600">{stats.reprovadosNota}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 bg-orange-50 rounded-xl p-3">
                  <AlertTriangle className="w-4 h-4 text-orange-400 shrink-0" />
                  <div>
                    <p className="text-xs text-gray-500">Rep. (faltas)</p>
                    <p className="font-bold text-orange-600">{stats.reprovadosFaltas}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 bg-gray-50 rounded-xl p-3">
                  <Minus className="w-4 h-4 text-gray-400 shrink-0" />
                  <div>
                    <p className="text-xs text-gray-500">Sem nota</p>
                    <p className="font-bold text-gray-600">{stats.semNota}</p>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      ) : (
        <div className="divide-y divide-gray-50">
          {disciplina.alunos.length === 0 ? (
            <p className="text-center text-gray-400 text-sm py-8">Nenhum aluno matriculado.</p>
          ) : (
            disciplina.alunos
              .slice()
              .sort((a, b) => (b.media ?? -1) - (a.media ?? -1))
              .map((m) => {
                const maxFaltas = (disciplina.cargaHoraria ?? 80) * 0.25;
                const sit =
                  m.faltas > maxFaltas
                    ? { label: "Rep. faltas", cor: "text-orange-600 bg-orange-50" }
                    : m.media === null
                    ? { label: "Sem nota", cor: "text-gray-500 bg-gray-100" }
                    : m.media >= 6
                    ? { label: "Aprovado", cor: "text-green-700 bg-green-50" }
                    : { label: "Reprovado", cor: "text-red-600 bg-red-50" };

                return (
                  <div key={m.id} className="flex items-center justify-between px-5 py-3 hover:bg-gray-50/50 transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-sm font-bold shrink-0">
                        {m.aluno.name.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">{m.aluno.name}</p>
                        <p className="text-xs text-gray-400 truncate">{m.aluno.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 shrink-0 ml-4">
                      <div className="text-right">
                        <p className="text-xs text-gray-400">Nota</p>
                        <p className={`text-sm font-bold ${
                          m.media === null ? "text-gray-400" :
                          m.media >= 6 ? "text-green-600" : "text-red-500"
                        }`}>
                          {m.media !== null ? m.media.toFixed(1) : "—"}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-400">Faltas</p>
                        <p className={`text-sm font-bold ${m.faltas > maxFaltas ? "text-orange-600" : "text-gray-700"}`}>
                          {m.faltas}
                        </p>
                      </div>
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${sit.cor}`}>
                        {sit.label}
                      </span>
                    </div>
                  </div>
                );
              })
          )}
        </div>
      )}
    </div>
  );
}

export default function RelatoriosClient({ disciplinas }: { disciplinas: Disciplina[] }) {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Relatórios</h1>
        <p className="text-gray-500 mt-1">Visão consolidada do desempenho acadêmico</p>
      </div>

      {disciplinas.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-12 text-center">
          <BarChart3 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 font-medium">Nenhuma disciplina encontrada.</p>
        </div>
      ) : (
        <>
          <CardResumoGeral disciplinas={disciplinas} />
          <div className="space-y-5">
            {disciplinas.map((d) => (
              <CardRelatorioDisciplina key={d.id} disciplina={d} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
