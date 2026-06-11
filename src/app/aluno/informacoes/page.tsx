import Link from "next/link";
import { Award, Calendar, FileText, Globe } from "lucide-react";
import { informacoesMock } from "@/data/informacoesMock";

function getIconePorTipo(tipo: string) {
  switch (tipo) {
    case "iniciacao-cientifica":
      return <Award className="w-5 h-5 text-purple-600" />;
    case "intercambio":
      return <Globe className="w-5 h-5 text-blue-600" />;
    case "monitoria":
      return <FileText className="w-5 h-5 text-green-600" />;
    case "evento":
      return <Calendar className="w-5 h-5 text-orange-600" />;
    default:
      return <FileText className="w-5 h-5 text-gray-600" />;
  }
}

function getCorPorTipo(tipo: string) {
  switch (tipo) {
    case "iniciacao-cientifica":
      return "bg-purple-100 text-purple-800 border-purple-200";
    case "intercambio":
      return "bg-blue-100 text-blue-800 border-blue-200";
    case "monitoria":
      return "bg-green-100 text-green-800 border-green-200";
    case "evento":
      return "bg-orange-100 text-orange-800 border-orange-200";
    default:
      return "bg-gray-100 text-gray-800 border-gray-200";
  }
}

function getNomeTipo(tipo: string) {
  switch (tipo) {
    case "iniciacao-cientifica":
      return "Iniciação Científica";
    case "intercambio":
      return "Intercâmbio";
    case "monitoria":
      return "Monitoria";
    case "evento":
      return "Evento";
    default:
      return tipo;
  }
}

function diasRestantes(dataLimite: string) {
  const hoje = new Date();
  const limite = new Date(dataLimite);

  hoje.setHours(0, 0, 0, 0);
  limite.setHours(0, 0, 0, 0);

  return Math.ceil(
    (limite.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24)
  );
}

export default function InformacoesPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Informações Institucionais
        </h1>
        <p className="text-gray-600 mt-1">
          Editais, programas de intercâmbio, monitorias e eventos
        </p>
      </div>

      <div className="space-y-5">
        {informacoesMock.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center border border-gray-200">
            <p className="text-gray-500">Nenhuma informação encontrada.</p>
          </div>
        ) : (
          informacoesMock.map((item) => {
            const dias = diasRestantes(item.dataLimite);
            const isUrgente = dias <= 7 && dias >= 0;
            const isEncerrado = dias < 0;

            return (
              <div
                key={item.id}
                className={`bg-white rounded-xl shadow-sm border border-gray-200 p-6 border-l-4 ${
                  isEncerrado
                    ? "border-l-gray-400 opacity-70"
                    : isUrgente
                    ? "border-l-red-500"
                    : "border-l-blue-500"
                }`}
              >
                <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-3 mb-4">
                      {getIconePorTipo(item.tipo)}

                      <span
                        className={`text-xs font-medium px-3 py-1 rounded-full border ${getCorPorTipo(
                          item.tipo
                        )}`}
                      >
                        {getNomeTipo(item.tipo)}
                      </span>

                      {isEncerrado && (
                        <span className="bg-gray-100 text-gray-800 text-xs font-medium px-3 py-1 rounded-full border border-gray-200">
                          Encerrado
                        </span>
                      )}

                      {isUrgente && !isEncerrado && (
                        <span className="bg-red-100 text-red-800 text-xs font-medium px-3 py-1 rounded-full border border-red-200">
                          Últimos dias!
                        </span>
                      )}
                    </div>

                    <h2 className="text-2xl font-bold text-gray-900 mb-3">
                      {item.titulo}
                    </h2>

                    <p className="text-gray-700 mb-5">{item.descricao}</p>

                    <div className="flex flex-wrap items-center gap-6 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        <span>
                          Publicado em:{" "}
                          {new Date(item.dataPublicacao).toLocaleDateString(
                            "pt-BR"
                          )}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        <span
                          className={
                            isUrgente && !isEncerrado
                              ? "text-red-600 font-semibold"
                              : ""
                          }
                        >
                          Encerra em:{" "}
                          {new Date(item.dataLimite).toLocaleDateString("pt-BR")}
                          {!isEncerrado &&
                            ` (${dias} ${dias === 1 ? "dia" : "dias"})`}
                        </span>
                      </div>
                    </div>
                  </div>

                  {!isEncerrado && (
                    <div className="lg:ml-6">
                      <Link
                        href={item.link}
                        className="inline-flex items-center justify-center bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition-colors font-semibold whitespace-nowrap"
                      >
                        Acessar Edital
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}