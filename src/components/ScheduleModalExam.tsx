"use client";

import { useState } from "react";
import { X, Plus } from "lucide-react";

type Disciplina = {
  id: string;
  nome: string;
  codigo: string | null;
};

type Props = {
  disciplinas: Disciplina[];
};

export function ScheduleModalExam({ disciplinas }: Props) {
  const [aberto, setAberto] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [form, setForm] = useState({
    disciplinaId: disciplinas[0]?.id ?? "",
    titulo: "",
    data: "",
    horario: "",
    sala: "",
    conteudo: "",
  });

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit() {
    if (!form.titulo.trim() || !form.data || !form.horario || !form.disciplinaId) return;

    setCarregando(true);
    try {
      const dataCompleta = new Date(`${form.data}T${form.horario}:00`);
      await fetch("/api/professor/tests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          titulo: form.titulo,
          disciplinaId: form.disciplinaId,
          data: dataCompleta.toISOString(),
          sala: form.sala,
          conteudo: form.conteudo,
        }),
      });
      setAberto(false);
      setForm({
        disciplinaId: disciplinas[0]?.id ?? "",
        titulo: "",
        data: "",
        horario: "",
        sala: "",
        conteudo: "",
      });
      window.location.reload();
    } finally {
      setCarregando(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setAberto(true)}
        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2.5 rounded-xl transition-colors shadow-sm"
      >
        <Plus className="w-4 h-4" />
        Nova Prova
      </button>

      {aberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setAberto(false)}
          />

          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-900">Agendar Nova Prova</h2>
              <button
                onClick={() => setAberto(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Disciplina
                </label>
                <select
                  name="disciplinaId"
                  value={form.disciplinaId}
                  onChange={handleChange}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {disciplinas.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.codigo ? `${d.codigo} - ${d.nome}` : d.nome}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Título da Prova
                </label>
                <input
                  type="text"
                  name="titulo"
                  value={form.titulo}
                  onChange={handleChange}
                  placeholder="Ex: P2 - Integrais"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Data</label>
                  <input
                    type="date"
                    name="data"
                    value={form.data}
                    onChange={handleChange}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Horário</label>
                  <input
                    type="time"
                    name="horario"
                    value={form.horario}
                    onChange={handleChange}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Sala</label>
                <input
                  type="text"
                  name="sala"
                  value={form.sala}
                  onChange={handleChange}
                  placeholder="Ex: Lab 101"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Conteúdo</label>
                <textarea
                  name="conteudo"
                  value={form.conteudo}
                  onChange={handleChange}
                  rows={3}
                  placeholder="Descreva o conteúdo da prova..."
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-400 resize-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-100">
              <button
                onClick={() => setAberto(false)}
                className="px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-xl transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSubmit}
                disabled={carregando}
                className="px-5 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors disabled:opacity-50"
              >
                {carregando ? "Agendando..." : "Agendar Prova"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
