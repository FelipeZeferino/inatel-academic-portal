import { describe, expect, it } from "vitest";

import {
  contarTotalAlunos,
  filtrarProximasProvas,
  contarProvasParaCorrigir,
  validarFormularioProva,
  combinarDataHorario,
  type Disciplina,
  type FormularioProva,
} from "@/server/professor/dashboard.utils";

function criarDisciplina(overrides: Partial<Disciplina> & { id: string }): Disciplina {
  return {
    nome: "Disciplina Teste",
    codigo: null,
    semestre: null,
    cargaHoraria: null,
    encontrosSemanais: null,
    professorId: "prof-1",
    alunos: [],
    provas: [],
    ...overrides,
  };
}

function criarProva(id: string, data: Date, disciplinaId = "d1") {
  return {
    id,
    titulo: `Prova ${id}`,
    data,
    disciplinaId,
    sala: null,
    conteudo: null,
  };
}

function formValido(overrides: Partial<FormularioProva> = {}): FormularioProva {
  return {
    titulo: "P1 - Limites",
    disciplinaId: "disc-1",
    data: "2099-12-01",
    horario: "08:00",
    sala: "Lab 101",
    conteudo: "Capítulos 1 a 5",
    ...overrides,
  };
}

const AGORA = new Date("2025-06-15T12:00:00Z");
const FUTURO_1 = new Date("2025-06-20T10:00:00Z");
const FUTURO_2 = new Date("2025-06-25T10:00:00Z");
const FUTURO_3 = new Date("2025-06-30T10:00:00Z");
const FUTURO_4 = new Date("2025-07-05T10:00:00Z");
const PASSADO = new Date("2025-06-10T10:00:00Z");

describe("contarTotalAlunos", () => {
  it("retorna 0 quando nao ha disciplinas", () => {
    expect(contarTotalAlunos([])).toBe(0);
  });

  it("soma corretamente os alunos de todas as disciplinas", () => {
    const disciplinas: Disciplina[] = [
      criarDisciplina({ id: "d1", alunos: [{ id: "a1" }, { id: "a2" }] }),
      criarDisciplina({ id: "d2", alunos: [{ id: "a3" }] }),
      criarDisciplina({ id: "d3", alunos: [] }),
    ];

    expect(contarTotalAlunos(disciplinas)).toBe(3);
  });
});

describe("filtrarProximasProvas", () => {
  it("retorna lista vazia quando nao ha provas futuras", () => {
    const disciplinas: Disciplina[] = [
      criarDisciplina({ id: "d1", provas: [criarProva("p1", PASSADO)] }),
    ];

    expect(filtrarProximasProvas(disciplinas, AGORA)).toEqual([]);
  });

  it("retorna provas ordenadas por data crescente e limitadas ao teto padrao de 3", () => {
    const disciplinas: Disciplina[] = [
      criarDisciplina({
        id: "d1",
        nome: "Engenharia de Software",
        provas: [criarProva("p4", FUTURO_4), criarProva("p1", FUTURO_1)],
      }),
      criarDisciplina({
        id: "d2",
        nome: "Calculo",
        provas: [criarProva("p2", FUTURO_2, "d2"), criarProva("p3", FUTURO_3, "d2")],
      }),
    ];

    const resultado = filtrarProximasProvas(disciplinas, AGORA);

    expect(resultado).toHaveLength(3);
    expect(resultado[0]?.id).toBe("p1");
    expect(resultado[1]?.id).toBe("p2");
    expect(resultado[2]?.id).toBe("p3");
  });

  it("respeita o limite personalizado informado", () => {
    const disciplinas: Disciplina[] = [
      criarDisciplina({
        id: "d1",
        provas: [criarProva("p1", FUTURO_1), criarProva("p2", FUTURO_2)],
      }),
      criarDisciplina({
        id: "d2",
        provas: [criarProva("p3", FUTURO_3, "d2")],
      }),
    ];

    const resultado = filtrarProximasProvas(disciplinas, AGORA, 2);

    expect(resultado).toHaveLength(2);
    expect(resultado[0]?.id).toBe("p1");
    expect(resultado[1]?.id).toBe("p2");
  });

  it("inclui prova marcada exatamente no instante atual", () => {
    const disciplinas: Disciplina[] = [
      criarDisciplina({
        id: "d1",
        provas: [criarProva("p1", AGORA)],
      }),
    ];

    const resultado = filtrarProximasProvas(disciplinas, AGORA);

    expect(resultado).toHaveLength(1);
    expect(resultado[0]?.id).toBe("p1");
  });

  it("inclui o nome e codigo da disciplina em cada prova retornada", () => {
    const disciplinas: Disciplina[] = [
      criarDisciplina({
        id: "d1",
        nome: "Cálculo Diferencial e Integral I",
        codigo: "MAT101",
        provas: [criarProva("p1", FUTURO_1)],
      }),
    ];

    const resultado = filtrarProximasProvas(disciplinas, AGORA);

    expect(resultado[0]?.disciplinaNome).toBe("Cálculo Diferencial e Integral I");
    expect(resultado[0]?.disciplinaCodigo).toBe("MAT101");
  });

  it("respeita limite customizado quando informado explicitamente", () => {
    const disciplinas: Disciplina[] = [
      criarDisciplina({
        id: "d1",
        provas: [
          criarProva("p1", FUTURO_1),
          criarProva("p2", FUTURO_2),
          criarProva("p3", FUTURO_3),
        ],
      }),
    ];

    expect(filtrarProximasProvas(disciplinas, AGORA, 2)).toHaveLength(2);
  });
});

describe("contarProvasParaCorrigir", () => {
  it("retorna 0 quando todas as provas sao futuras", () => {
    const disciplinas: Disciplina[] = [
      criarDisciplina({ id: "d1", provas: [criarProva("p1", FUTURO_1)] }),
    ];

    expect(contarProvasParaCorrigir(disciplinas, AGORA)).toBe(0);
  });

  it("conta apenas as provas que ja passaram da data atual", () => {
    const disciplinas: Disciplina[] = [
      criarDisciplina({
        id: "d1",
        provas: [criarProva("p1", PASSADO), criarProva("p2", FUTURO_1)],
      }),
      criarDisciplina({
        id: "d2",
        provas: [criarProva("p3", PASSADO, "d2")],
      }),
    ];

    expect(contarProvasParaCorrigir(disciplinas, AGORA)).toBe(2);
  });

  it("nao conta prova com data exatamente igual ao momento atual", () => {
    const disciplinas: Disciplina[] = [
      criarDisciplina({ id: "d1", provas: [criarProva("p1", AGORA)] }),
    ];

    expect(contarProvasParaCorrigir(disciplinas, AGORA)).toBe(0);
  });
});

describe("validarFormularioProva", () => {
  const AGORA_FIXO = new Date("2025-06-15T12:00:00Z");

  it("nao retorna erros para um formulario completamente valido", () => {
    const erros = validarFormularioProva(formValido(), AGORA_FIXO);
    expect(erros).toEqual({});
  });

  it("exige titulo preenchido", () => {
    const erros = validarFormularioProva(formValido({ titulo: "  " }), AGORA_FIXO);
    expect(erros.titulo).toBeDefined();
  });

  it("exige disciplina selecionada", () => {
    const erros = validarFormularioProva(formValido({ disciplinaId: "" }), AGORA_FIXO);
    expect(erros.disciplinaId).toBeDefined();
  });

  it("rejeita data no passado", () => {
    const erros = validarFormularioProva(
      formValido({ data: "2020-01-01", horario: "08:00" }),
      AGORA_FIXO,
    );

    expect(erros.data).toBeDefined();
  });

  it("exige horario quando a data foi preenchida", () => {
    const erros = validarFormularioProva(formValido({ horario: "" }), AGORA_FIXO);

    expect(erros.horario).toBe("O horário é obrigatório.");
  });

  it("exige horario quando a data esta preenchida mas o horario esta vazio", () => {
    const erros = validarFormularioProva(formValido({ horario: "" }), AGORA_FIXO);

    expect(erros.horario).toBeDefined();
    expect(erros.data).toBeUndefined();
  });

  it("rejeita quando data e horario formam uma string invalida", () => {
    const erros = validarFormularioProva(
      formValido({ data: "nao-e-uma-data", horario: "08:00" }),
      AGORA_FIXO,
    );

    expect(erros.data).toBeDefined();
  });
});

describe("combinarDataHorario", () => {
  it("combina data e horario em um objeto Date corretamente", () => {
    const resultado = combinarDataHorario("2025-06-20", "08:30");

    expect(resultado.getFullYear()).toBe(2025);
    expect(resultado.getMonth()).toBe(5);
    expect(resultado.getDate()).toBe(20);
    expect(resultado.getHours()).toBe(8);
    expect(resultado.getMinutes()).toBe(30);
  });

  it("retorna data invalida quando recebe valores fora do padrao", () => {
    const resultado = combinarDataHorario("data-invalida", "99:99");

    expect(Number.isNaN(resultado.getTime())).toBe(true);
  });
});
