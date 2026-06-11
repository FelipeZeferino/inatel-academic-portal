export type Prova = {
  id: string;
  titulo: string;
  data: Date;
  sala: string | null;
  conteudo: string | null;
  disciplinaId: string;
};

export type ProvaComDisciplina = Prova & {
  disciplinaNome: string;
  disciplinaCodigo: string | null;
};

export type Disciplina = {
  id: string;
  nome: string;
  codigo: string | null;
  semestre: string | null;
  cargaHoraria: number | null;
  encontrosSemanais: number | null;
  professorId: string | null;
  alunos: { id: string }[];
  provas: Prova[];
};

export function contarTotalAlunos(disciplinas: Disciplina[]): number {
  return disciplinas.reduce((acc, d) => acc + d.alunos.length, 0);
}

export function filtrarProximasProvas(
  disciplinas: Disciplina[],
  agora: Date,
  limite = 3,
): ProvaComDisciplina[] {
  return disciplinas
    .flatMap((d) =>
      d.provas.map((p) => ({
        ...p,
        disciplinaNome: d.nome,
        disciplinaCodigo: d.codigo,
      })),
    )
    .filter((p) => p.data >= agora)
    .sort((a, b) => a.data.getTime() - b.data.getTime())
    .slice(0, limite);
}

export function contarProvasParaCorrigir(
  disciplinas: Disciplina[],
  agora: Date,
): number {
  return disciplinas
    .flatMap((d) => d.provas)
    .filter((p) => p.data < agora).length;
}

export type FormularioProva = {
  titulo: string;
  disciplinaId: string;
  data: string;
  horario: string;
  sala: string;
  conteudo: string;
};

export type ErrosFormularioProva = Partial<Record<keyof FormularioProva, string>>;

export function validarFormularioProva(
  form: FormularioProva,
  agora: Date = new Date(),
): ErrosFormularioProva {
  const erros: ErrosFormularioProva = {};

  if (!form.titulo.trim()) {
    erros.titulo = "O título da prova é obrigatório.";
  }

  if (!form.disciplinaId) {
    erros.disciplinaId = "Selecione uma disciplina.";
  }

  if (!form.data) {
    erros.data = "A data é obrigatória.";
  } else if (!form.horario) {
    erros.horario = "O horário é obrigatório.";
  } else {
    const dataProva = new Date(`${form.data}T${form.horario}:00`);
    if (isNaN(dataProva.getTime())) {
      erros.data = "Data ou horário inválido.";
    } else if (dataProva <= agora) {
      erros.data = "A prova deve ser agendada para uma data futura.";
    }
  }

  return erros;
}

export function combinarDataHorario(data: string, horario: string): Date {
  return new Date(`${data}T${horario}:00`);
}
