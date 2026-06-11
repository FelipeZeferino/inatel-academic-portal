export type TipoInformacao =
  | "iniciacao-cientifica"
  | "intercambio"
  | "monitoria"
  | "evento";

export interface InformacaoInstitucional {
  id: string;
  tipo: TipoInformacao;
  titulo: string;
  descricao: string;
  dataPublicacao: string;
  dataLimite: string;
  link: string;
}

export const informacoesMock: InformacaoInstitucional[] = [
  {
    id: "1",
    tipo: "iniciacao-cientifica",
    titulo: "Edital de Iniciação Científica 2026/1",
    descricao:
      "Inscrições abertas para bolsas de Iniciação Científica PIBIC/CNPq. Vagas em diversas áreas de pesquisa.",
    dataPublicacao: "2026-02-28",
    dataLimite: "2026-04-14",
    link: "#",
  },
  {
    id: "2",
    tipo: "intercambio",
    titulo: "Programa de Intercâmbio Internacional - Europa",
    descricao:
      "Oportunidades de intercâmbio em universidades parceiras na Europa. Bolsas disponíveis.",
    dataPublicacao: "2026-03-04",
    dataLimite: "2026-04-29",
    link: "#",
  },
  {
    id: "3",
    tipo: "monitoria",
    titulo: "Seleção de Monitores para Disciplinas de Engenharia",
    descricao:
      "Processo seletivo para monitores das disciplinas do curso de Engenharia.",
    dataPublicacao: "2026-03-10",
    dataLimite: "2026-03-30",
    link: "#",
  },
  {
    id: "4",
    tipo: "evento",
    titulo: "Semana de Tecnologia Inatel 2026",
    descricao:
      "Palestras, workshops e hackathon. Inscrições abertas para participantes e projetos.",
    dataPublicacao: "2026-03-15",
    dataLimite: "2026-04-10",
    link: "#",
  },
];