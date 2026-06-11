"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  Users,
  FileText,
  Calendar,
  ClipboardList,
  Plus,
  X,
  UserPlus,
  Loader2,
  CheckCircle,
  AlertCircle,
} from "lucide-react";

type Student = { id: string; name: string; email: string };
type Exam = { id: string; titulo: string; data: string; sala: string | null };
type Course = {
  id: string;
  nome: string;
  codigo: string | null;
  semestre: string | null;
  cargaHoraria: number | null;
  encontrosSemanais: number | null;
  alunos: { aluno: Student }[];
  provas: Exam[];
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function CreateCourseModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: () => void;
}) {
  const [form, setForm] = useState({
    name: "",
    code: "",
    semester: "",
    workload: "",
    weeklyMeetings: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    if (!form.name.trim()) {
      setError("O nome da disciplina é obrigatório.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/professor/disciplines", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome: form.name,
          codigo: form.code || undefined,
          semestre: form.semester || undefined,
          cargaHoraria: form.workload ? Number(form.workload) : undefined,
          encontrosSemanais: form.weeklyMeetings
            ? Number(form.weeklyMeetings)
            : undefined,
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Erro ao criar disciplina.");
      } else {
        onCreated();
        onClose();
      }
    } catch {
      setError("Erro de rede. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-blue-500" />
            Nova Disciplina
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {error && (
            <div className="flex items-center gap-2 bg-red-50 text-red-700 border border-red-200 rounded-lg px-4 py-3 text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nome <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Ex: Engenharia de Software"
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Código</label>
              <input
                type="text"
                value={form.code}
                onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
                placeholder="Ex: ES401"
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Semestre</label>
              <input
                type="text"
                value={form.semester}
                onChange={(e) => setForm((f) => ({ ...f, semester: e.target.value }))}
                placeholder="Ex: 2025.1"
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Carga Horária (h)
              </label>
              <input
                type="number"
                min={1}
                value={form.workload}
                onChange={(e) => setForm((f) => ({ ...f, workload: e.target.value }))}
                placeholder="Ex: 80"
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Encontros/semana
              </label>
              <input
                type="number"
                min={1}
                value={form.weeklyMeetings}
                onChange={(e) =>
                  setForm((f) => ({ ...f, weeklyMeetings: e.target.value }))
                }
                placeholder="Ex: 2"
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 px-6 pb-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-200 rounded-xl transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2 rounded-xl text-sm font-medium hover:bg-blue-700 disabled:opacity-60 transition-colors"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Plus className="w-4 h-4" />
            )}
            Criar Disciplina
          </button>
        </div>
      </div>
    </div>
  );
}

function AddStudentModal({
  course,
  onClose,
  onAdded,
}: {
  course: Course;
  onClose: () => void;
  onAdded: () => void;
}) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    if (!email.trim()) {
      setError("Informe o e-mail do aluno.");
      return;
    }
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch("/api/professor/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ alunoEmail: email.trim(), disciplinaId: course.id }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Erro ao matricular aluno.");
      } else {
        setSuccess("Aluno matriculado com sucesso!");
        setEmail("");
        onAdded();
      }
    } catch {
      setError("Erro de rede. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-green-500" />
            Adicionar Aluno
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <p className="text-sm text-gray-500">
            Adicionando aluno à:{" "}
            <span className="font-semibold text-gray-800">{course.nome}</span>
          </p>

          {error && (
            <div className="flex items-center gap-2 bg-red-50 text-red-700 border border-red-200 rounded-lg px-4 py-3 text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}
          {success && (
            <div className="flex items-center gap-2 bg-green-50 text-green-700 border border-green-200 rounded-lg px-4 py-3 text-sm">
              <CheckCircle className="w-4 h-4 shrink-0" />
              {success}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              E-mail do aluno
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              placeholder="aluno@inatel.br"
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          {course.alunos.length > 0 && (
            <div>
              <p className="text-xs font-medium text-gray-500 mb-2">
                Alunos já matriculados ({course.alunos.length})
              </p>
              <div className="max-h-36 overflow-y-auto space-y-1">
                {course.alunos.map(({ aluno }) => (
                  <div
                    key={aluno.id}
                    className="flex items-center gap-2 text-sm text-gray-600 px-2 py-1 rounded-lg bg-gray-50"
                  >
                    <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-xs font-bold shrink-0">
                      {aluno.name.charAt(0)}
                    </div>
                    <span className="truncate">
                      {aluno.name}{" "}
                      <span className="text-gray-400">({aluno.email})</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 px-6 pb-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-200 rounded-xl transition-colors"
          >
            Fechar
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex items-center gap-2 bg-green-600 text-white px-5 py-2 rounded-xl text-sm font-medium hover:bg-green-700 disabled:opacity-60 transition-colors"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <UserPlus className="w-4 h-4" />
            )}
            Matricular Aluno
          </button>
        </div>
      </div>
    </div>
  );
}

function CourseCard({
  course,
  onUpdate,
}: {
  course: Course;
  onUpdate: () => void;
}) {
  const router = useRouter();
  const [showStudentsModal, setShowStudentsModal] = useState(false);
  const [studentsExpanded, setStudentsExpanded] = useState(false);
  const [examsExpanded, setExamsExpanded] = useState(false);

  return (
    <>
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3 flex-wrap">
              <BookOpen className="w-5 h-5 text-blue-500 shrink-0" />
              {course.codigo && (
                <span className="bg-blue-100 text-blue-700 text-xs font-semibold px-2.5 py-1 rounded-lg">
                  {course.codigo}
                </span>
              )}
              {course.semestre && (
                <span className="text-gray-400 text-sm">{course.semestre}</span>
              )}
            </div>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mt-2">{course.nome}</h2>
          {(course.cargaHoraria ?? course.encontrosSemanais) && (
            <p className="text-sm text-gray-400 mt-1">
              {course.cargaHoraria && `${course.cargaHoraria}h`}
              {course.cargaHoraria && course.encontrosSemanais && " • "}
              {course.encontrosSemanais &&
                `${course.encontrosSemanais} encontros semanais`}
            </p>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-gray-100">
          <button
            onClick={() => setStudentsExpanded((v) => !v)}
            className="bg-white p-5 flex flex-col items-center gap-2 hover:bg-blue-50 transition-colors group"
          >
            <div className="bg-blue-100 p-2.5 rounded-xl group-hover:bg-blue-200 transition-colors">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <span className="text-sm font-medium text-gray-700">Ver Alunos</span>
            <span className="text-xs text-gray-400">
              {course.alunos.length} matriculados
            </span>
          </button>

          <button
            onClick={() => setShowStudentsModal(true)}
            className="bg-white p-5 flex flex-col items-center gap-2 hover:bg-green-50 transition-colors group"
          >
            <div className="bg-green-100 p-2.5 rounded-xl group-hover:bg-green-200 transition-colors">
              <UserPlus className="w-5 h-5 text-green-600" />
            </div>
            <span className="text-sm font-medium text-gray-700">Adicionar Aluno</span>
            <span className="text-xs text-gray-400">Matricular</span>
          </button>

          <button
            onClick={() => setExamsExpanded((v) => !v)}
            className="bg-white p-5 flex flex-col items-center gap-2 hover:bg-purple-50 transition-colors group"
          >
            <div className="bg-purple-100 p-2.5 rounded-xl group-hover:bg-purple-200 transition-colors">
              <Calendar className="w-5 h-5 text-purple-600" />
            </div>
            <span className="text-sm font-medium text-gray-700">Ver Provas</span>
            <span className="text-xs text-gray-400">
              {course.provas.length} agendadas
            </span>
          </button>

          <button
            onClick={() => router.push("/professor/notes")}
            className="bg-white p-5 flex flex-col items-center gap-2 hover:bg-orange-50 transition-colors group"
          >
            <div className="bg-orange-100 p-2.5 rounded-xl group-hover:bg-orange-200 transition-colors">
              <ClipboardList className="w-5 h-5 text-orange-600" />
            </div>
            <span className="text-sm font-medium text-gray-700">Lançar Notas</span>
            <span className="text-xs text-gray-400">
              {course.alunos.length} alunos
            </span>
          </button>
        </div>

        {studentsExpanded && (
          <div className="border-t border-gray-100 p-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-500" />
              Alunos Matriculados
            </h3>
            {course.alunos.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">
                Nenhum aluno matriculado ainda.{" "}
                <button
                  onClick={() => setShowStudentsModal(true)}
                  className="text-blue-500 hover:underline"
                >
                  Adicionar aluno
                </button>
              </p>
            ) : (
              <div className="space-y-2">
                {course.alunos.map(({ aluno }) => (
                  <div
                    key={aluno.id}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-sm font-bold shrink-0">
                      {aluno.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-800">{aluno.name}</p>
                      <p className="text-xs text-gray-400">{aluno.email}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {examsExpanded && (
          <div className="border-t border-gray-100 p-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <FileText className="w-4 h-4 text-purple-500" />
              Provas Agendadas
            </h3>
            {course.provas.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">
                Nenhuma prova agendada.
              </p>
            ) : (
              <div className="space-y-2">
                {course.provas.map((exam) => (
                  <div
                    key={exam.id}
                    className="flex items-center justify-between p-3 rounded-xl border border-gray-100 hover:border-purple-200 transition-colors"
                  >
                    <div>
                      <p className="text-sm font-semibold text-gray-800">{exam.titulo}</p>
                      {exam.sala && (
                        <p className="text-xs text-gray-400">Sala: {exam.sala}</p>
                      )}
                    </div>
                    <span className="text-xs text-gray-500 shrink-0 ml-4">
                      {formatDate(exam.data)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {showStudentsModal && (
        <AddStudentModal
          course={course}
          onClose={() => setShowStudentsModal(false)}
          onAdded={onUpdate}
        />
      )}
    </>
  );
}

export default function ManageCoursesClient({
  initialCourses,
}: {
  initialCourses: Course[];
}) {
  const [courses, setCourses] = useState<Course[]>(initialCourses);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [loading, setLoading] = useState(false);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/professor/disciplines");
      if (res.ok) {
        const data = (await res.json()) as Course[];
        setCourses(data);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gerenciar Disciplinas</h1>
          <p className="text-gray-500 mt-1">
            Gerencie suas disciplinas, provas, notas e alunos
          </p>
        </div>
        <div className="flex items-center gap-3">
          {loading && <Loader2 className="w-4 h-4 animate-spin text-gray-400" />}
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Nova Disciplina
          </button>
        </div>
      </div>

      {courses.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-12 text-center">
          <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 font-medium mb-2">Nenhuma disciplina criada ainda.</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="text-blue-500 hover:underline text-sm"
          >
            Criar primeira disciplina
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {courses.map((course) => (
            <CourseCard key={course.id} course={course} onUpdate={reload} />
          ))}
        </div>
      )}

      {showCreateModal && (
        <CreateCourseModal
          onClose={() => setShowCreateModal(false)}
          onCreated={reload}
        />
      )}
    </div>
  );
}
