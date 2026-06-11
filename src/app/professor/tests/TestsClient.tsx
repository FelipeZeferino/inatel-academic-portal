"use client";

import { useState, useCallback } from "react";
import {
  Calendar,
  Plus,
  X,
  Loader2,
  AlertCircle,
  BookOpen,
  Clock,
  MapPin,
  FileText,
  Trash2,
} from "lucide-react";

type Prova = {
  id: string;
  titulo: string;
  data: string;
  sala: string | null;
  conteudo: string | null;
  disciplinaId: string;
};

type Disciplina = {
  id: string;
  nome: string;
  codigo: string | null;
  provas: Prova[];
};

function formatarData(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function isFutura(iso: string) {
  return new Date(iso) >= new Date();
}

function ModalNovaProva({
  disciplinas,
  onClose,
  onCriada,
}: {
  disciplinas: Disciplina[];
  onClose: () => void;
  onCriada: () => void;
}) {
  const [form, setForm] = useState({
    disciplinaId: disciplinas[0]?.id ?? "",
    titulo: "",
    data: "",
    horario: "",
    sala: "",
    conteudo: "",
  });
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    if (
      !form.titulo.trim() ||
      !form.disciplinaId ||
      !form.data ||
      !form.horario
    ) {
      setErro("Preencha título, disciplina, data e horário.");
      return;
    }
    const dataISO = new Date(`${form.data}T${form.horario}:00`).toISOString();
    setLoading(true);
    setErro("");
    try {
      const res = await fetch("/api/professor/tests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          titulo: form.titulo,
          disciplinaId: form.disciplinaId,
          data: dataISO,
          sala: form.sala || undefined,
          conteudo: form.conteudo || undefined,
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setErro(data.error ?? "Erro ao agendar prova.");
      } else {
        onCriada();
        onClose();
      }
    } catch {
      setErro("Erro de rede. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white shadow-xl">
        <div className="sticky top-0 flex items-center justify-between border-b border-gray-100 bg-white p-6">
          <h2 className="flex items-center gap-2 text-xl font-bold text-gray-900">
            <Calendar className="h-5 w-5 text-purple-500" />
            Agendar Nova Prova
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 transition-colors hover:text-gray-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4 p-6">
          {erro && (
            <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {erro}
            </div>
          )}

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Disciplina <span className="text-red-500">*</span>
            </label>
            <select
              value={form.disciplinaId}
              onChange={(e) =>
                setForm((f) => ({ ...f, disciplinaId: e.target.value }))
              }
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm focus:ring-2 focus:ring-purple-500 focus:outline-none"
            >
              {disciplinas.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.codigo ? `[${d.codigo}] ` : ""}
                  {d.nome}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Título da Prova <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.titulo}
              onChange={(e) =>
                setForm((f) => ({ ...f, titulo: e.target.value }))
              }
              placeholder="Ex: P1 - Primeira Prova"
              className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:ring-2 focus:ring-purple-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Data <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={form.data}
                onChange={(e) =>
                  setForm((f) => ({ ...f, data: e.target.value }))
                }
                className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:ring-2 focus:ring-purple-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Horário <span className="text-red-500">*</span>
              </label>
              <input
                type="time"
                value={form.horario}
                onChange={(e) =>
                  setForm((f) => ({ ...f, horario: e.target.value }))
                }
                className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:ring-2 focus:ring-purple-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Sala
            </label>
            <input
              type="text"
              value={form.sala}
              onChange={(e) => setForm((f) => ({ ...f, sala: e.target.value }))}
              placeholder="Ex: Lab 101, Anfiteatro A"
              className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:ring-2 focus:ring-purple-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Conteúdo Programático
            </label>
            <textarea
              value={form.conteudo}
              onChange={(e) =>
                setForm((f) => ({ ...f, conteudo: e.target.value }))
              }
              placeholder="Ex: Capítulos 1 a 5, Listas de exercícios 1 e 2..."
              rows={3}
              className="w-full resize-none rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:ring-2 focus:ring-purple-500 focus:outline-none"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 px-6 pb-6">
          <button
            onClick={onClose}
            className="rounded-xl border border-gray-200 px-4 py-2 text-sm text-gray-600 transition-colors hover:text-gray-900"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex items-center gap-2 rounded-xl bg-purple-600 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-purple-700 disabled:opacity-60"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Calendar className="h-4 w-4" />
            )}
            Agendar Prova
          </button>
        </div>
      </div>
    </div>
  );
}

function CardProva({
  prova,
  disciplinaNome,
}: {
  prova: Prova;
  disciplinaNome: string;
}) {
  const futura = isFutura(prova.data);
  return (
    <div
      className={`rounded-xl border p-4 transition-colors ${futura ? "border-gray-100 bg-white hover:border-purple-200" : "border-gray-100 bg-gray-50"}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-center gap-2">
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-semibold ${futura ? "bg-purple-100 text-purple-700" : "bg-gray-200 text-gray-500"}`}
            >
              {futura ? "Agendada" : "Realizada"}
            </span>
            <span className="truncate text-xs text-gray-400">
              {disciplinaNome}
            </span>
          </div>
          <h3 className="truncate font-semibold text-gray-900">
            {prova.titulo}
          </h3>
          <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {formatarData(prova.data)}
            </span>
            {prova.sala && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" />
                {prova.sala}
              </span>
            )}
          </div>
          {prova.conteudo && (
            <p className="mt-2 flex items-start gap-1 text-xs text-gray-400">
              <FileText className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              {prova.conteudo}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ProvasClient({
  disciplinas,
}: {
  disciplinas: Disciplina[];
}) {
  const [lista, setLista] = useState(disciplinas);
  const [modalAberto, setModalAberto] = useState(false);
  const [loading, setLoading] = useState(false);
  const [filtro, setFiltro] = useState<"todas" | "futuras" | "passadas">(
    "futuras",
  );

  const recarregar = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/professor/disciplines");
      if (res.ok) {
        const data = (await res.json()) as Disciplina[];
        setLista(
          data.map((d) => ({
            ...d,
            provas: (d.provas as unknown as Array<{ data: Date | string }>).map(
              (p) => ({
                ...(p as unknown as Prova),
                data: new Date(
                  (p as { data: Date | string }).data,
                ).toISOString(),
              }),
            ),
          })),
        );
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const todasProvas = lista.flatMap((d) =>
    d.provas.map((p) => ({
      ...p,
      disciplinaNome: d.codigo ? `[${d.codigo}] ${d.nome}` : d.nome,
    })),
  );

  const provasFiltradas = todasProvas
    .filter((p) => {
      if (filtro === "futuras") return isFutura(p.data);
      if (filtro === "passadas") return !isFutura(p.data);
      return true;
    })
    .sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime());

  const totalFuturas = todasProvas.filter((p) => isFutura(p.data)).length;
  const totalPassadas = todasProvas.filter((p) => !isFutura(p.data)).length;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Agendar Provas</h1>
          <p className="mt-1 text-gray-500">
            Gerencie as avaliações das suas disciplinas
          </p>
        </div>
        <div className="flex items-center gap-3">
          {loading && (
            <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
          )}
          <button
            onClick={() => setModalAberto(true)}
            disabled={lista.length === 0}
            className="flex items-center gap-2 rounded-xl bg-purple-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-purple-700 disabled:opacity-40"
          >
            <Plus className="h-4 w-4" />
            Nova Prova
          </button>
        </div>
      </div>

      {lista.length === 0 ? (
        <div className="rounded-xl border border-gray-100 bg-white p-12 text-center shadow-sm">
          <BookOpen className="mx-auto mb-4 h-12 w-12 text-gray-300" />
          <p className="font-medium text-gray-500">
            Nenhuma disciplina encontrada.
          </p>
          <p className="mt-1 text-sm text-gray-400">
            Crie uma disciplina primeiro em &quot;Gerenciar Disciplinas&quot;.
          </p>
        </div>
      ) : (
        <>
          <div className="mb-6 flex items-center gap-2">
            {(["futuras", "passadas", "todas"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFiltro(f)}
                className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                  filtro === f
                    ? "bg-purple-600 text-white"
                    : "border border-gray-200 bg-white text-gray-600 hover:border-purple-300"
                }`}
              >
                {f === "futuras"
                  ? `Agendadas (${totalFuturas})`
                  : f === "passadas"
                    ? `Realizadas (${totalPassadas})`
                    : `Todas (${todasProvas.length})`}
              </button>
            ))}
          </div>

          {provasFiltradas.length === 0 ? (
            <div className="rounded-xl border border-gray-100 bg-white p-10 text-center">
              <Calendar className="mx-auto mb-3 h-10 w-10 text-gray-300" />
              <p className="text-sm text-gray-400">
                {filtro === "futuras"
                  ? "Nenhuma prova agendada."
                  : "Nenhuma prova realizada."}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {provasFiltradas.map((p) => (
                <CardProva
                  key={p.id}
                  prova={p}
                  disciplinaNome={p.disciplinaNome}
                />
              ))}
            </div>
          )}
        </>
      )}

      {modalAberto && (
        <ModalNovaProva
          disciplinas={lista}
          onClose={() => setModalAberto(false)}
          onCriada={recarregar}
        />
      )}
    </div>
  );
}
