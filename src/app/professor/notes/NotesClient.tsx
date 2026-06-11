"use client";

import { useState } from "react";
import {
  ClipboardList,
  BookOpen,
  CheckCircle,
  Loader2,
  AlertCircle,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

type Aluno = { id: string; name: string; email: string };
type MatriculaAluno = {
  id: string;
  alunoId: string;
  disciplinaId: string;
  media: number | null;
  faltas: number;
  aluno: Aluno;
};
type Disciplina = {
  id: string;
  nome: string;
  codigo: string | null;
  alunos: MatriculaAluno[];
};

function situacao(media: number | null, faltas: number, cargaHoraria = 80) {
  const maxFaltas = cargaHoraria * 0.25;
  if (faltas > maxFaltas) return { label: "Reprovado (faltas)", cor: "text-red-600 bg-red-50" };
  if (media === null) return { label: "Sem nota", cor: "text-gray-500 bg-gray-100" };
  if (media >= 6) return { label: "Aprovado", cor: "text-green-700 bg-green-50" };
  return { label: "Reprovado", cor: "text-red-600 bg-red-50" };
}

function LinhaAluno({ matricula, disciplinaId }: { matricula: MatriculaAluno; disciplinaId: string }) {
  const [media, setMedia] = useState<string>(matricula.media?.toString() ?? "");
  const [faltas, setFaltas] = useState<string>(matricula.faltas.toString());
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "erro">("idle");
  const [erro, setErro] = useState("");

  async function salvar() {
    const mediaNum = media === "" ? null : Number(media);
    const faltasNum = Number(faltas);

    if (mediaNum !== null && (mediaNum < 0 || mediaNum > 10)) {
      setErro("Nota deve estar entre 0 e 10.");
      setStatus("erro");
      return;
    }
    if (faltasNum < 0) {
      setErro("Faltas não pode ser negativo.");
      setStatus("erro");
      return;
    }

    setStatus("loading");
    setErro("");
    try {
      const res = await fetch("/api/professor/notes", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matriculaId: matricula.id, media: mediaNum, faltas: faltasNum }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setErro(data.error ?? "Erro ao salvar.");
        setStatus("erro");
      } else {
        setStatus("ok");
        setTimeout(() => setStatus("idle"), 2000);
      }
    } catch {
      setErro("Erro de rede.");
      setStatus("erro");
    }
  }

  const sit = situacao(media === "" ? null : Number(media), Number(faltas));

  return (
    <div className="grid grid-cols-[1fr_auto_auto_auto_auto] items-center gap-3 px-4 py-3 border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors">
      <div className="min-w-0">
        <p className="font-medium text-gray-800 truncate text-sm">{matricula.aluno.name}</p>
        <p className="text-xs text-gray-400 truncate">{matricula.aluno.email}</p>
      </div>

      <div className="flex flex-col items-center gap-0.5">
        <label className="text-xs text-gray-400">Nota</label>
        <input
          type="number"
          min={0}
          max={10}
          step={0.1}
          value={media}
          onChange={(e) => { setMedia(e.target.value); setStatus("idle"); }}
          placeholder="—"
          className="w-16 text-center border border-gray-200 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
        />
      </div>

      <div className="flex flex-col items-center gap-0.5">
        <label className="text-xs text-gray-400">Faltas</label>
        <input
          type="number"
          min={0}
          value={faltas}
          onChange={(e) => { setFaltas(e.target.value); setStatus("idle"); }}
          className="w-16 text-center border border-gray-200 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
        />
      </div>

      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full whitespace-nowrap ${sit.cor}`}>
        {sit.label}
      </span>

      <button
        onClick={salvar}
        disabled={status === "loading"}
        title={erro || "Salvar"}
        className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
          status === "ok"
            ? "bg-green-100 text-green-700"
            : status === "erro"
            ? "bg-red-100 text-red-600"
            : "bg-blue-600 text-white hover:bg-blue-700"
        } disabled:opacity-60`}
      >
        {status === "loading" ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : status === "ok" ? (
          <><CheckCircle className="w-3.5 h-3.5" /> Salvo</>
        ) : status === "erro" ? (
          <><AlertCircle className="w-3.5 h-3.5" /> Erro</>
        ) : (
          "Salvar"
        )}
      </button>
    </div>
  );
}

function CardDisciplinaNotas({ disciplina }: { disciplina: Disciplina }) {
  const [aberto, setAberto] = useState(true);
  const comNota = disciplina.alunos.filter((a) => a.media !== null).length;

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      <button
        onClick={() => setAberto((v) => !v)}
        className="w-full flex items-center justify-between p-5 hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <BookOpen className="w-5 h-5 text-green-500" />
          <div className="text-left">
            <div className="flex items-center gap-2">
              {disciplina.codigo && (
                <span className="bg-green-100 text-green-700 text-xs font-semibold px-2 py-0.5 rounded-md">
                  {disciplina.codigo}
                </span>
              )}
              <span className="font-bold text-gray-900">{disciplina.nome}</span>
            </div>
            <p className="text-xs text-gray-400 mt-0.5">
              {comNota}/{disciplina.alunos.length} notas lançadas
            </p>
          </div>
        </div>
        {aberto ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
      </button>

      {aberto && (
        <>
          {disciplina.alunos.length === 0 ? (
            <div className="px-6 py-8 text-center text-sm text-gray-400 border-t border-gray-50">
              Nenhum aluno matriculado nesta disciplina.
            </div>
          ) : (
            <div className="border-t border-gray-100">
              <div className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-3 px-4 py-2 bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                <span>Aluno</span>
                <span className="text-center w-16">Nota</span>
                <span className="text-center w-16">Faltas</span>
                <span>Situação</span>
                <span></span>
              </div>
              {disciplina.alunos.map((m) => (
                <LinhaAluno key={m.id} matricula={m} disciplinaId={disciplina.id} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function NotasClient({ disciplinas }: { disciplinas: Disciplina[] }) {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Lançar Notas</h1>
        <p className="text-gray-500 mt-1">
          Registre notas e faltas dos alunos em cada disciplina
        </p>
      </div>

      {disciplinas.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-12 text-center">
          <ClipboardList className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 font-medium">Nenhuma disciplina encontrada.</p>
        </div>
      ) : (
        <div className="space-y-5">
          {disciplinas.map((d) => (
            <CardDisciplinaNotas key={d.id} disciplina={d} />
          ))}
        </div>
      )}
    </div>
  );
}
