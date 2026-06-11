import Link from "next/link";
import { getSession } from "@/server/better-auth/server";
import { db } from "@/server/db";

export default async function HomePage() {
  const session = await getSession();
  let dashboardHref = "/aluno/dashboard";

  if (session) {
    const user = await db.user.findUnique({
      where: { id: session.user.id },
    });

    if (user?.role === "PROFESSOR" || user?.role === "ADMIN") {
      dashboardHref = "/professor/dashboard";
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-50 text-gray-900">
      <div className="container flex flex-col items-center justify-center gap-8 px-4 py-16 text-center">
        <h1 className="text-5xl font-extrabold tracking-tight">
          Portal <span className="text-blue-600">Academico</span>
        </h1>

        <p className="max-w-2xl text-xl text-gray-600">
          Sistema academico para alunos e professores do Inatel.
        </p>

        <div className="mt-4 flex flex-wrap items-center justify-center gap-4">
          {session ? (
            <Link
              href={dashboardHref}
              className="rounded-lg bg-blue-600 px-8 py-3 font-semibold text-white transition hover:bg-blue-700 shadow-sm"
            >
              Ir para Dashboard
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="rounded-lg bg-blue-600 px-8 py-3 font-semibold text-white transition hover:bg-blue-700 shadow-sm"
              >
                Entrar
              </Link>
              <Link
                href="/signup"
                className="rounded-lg border border-blue-600 px-8 py-3 font-semibold text-blue-700 transition hover:bg-blue-50"
              >
                Criar conta
              </Link>
            </>
          )}
        </div>
      </div>
    </main>
  );
}