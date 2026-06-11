import { GraduationCap, LogOut } from 'lucide-react';
import { getSession } from "@/server/better-auth/server";
import { redirect } from "next/navigation";
import { db } from "@/server/db";
import { ProfessorNavLinks } from "./../../components/ProfessorNavLinks";

export default async function ProfessorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  const dbUser = await db.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  if (!dbUser || (dbUser.role !== "PROFESSOR" && dbUser.role !== "ADMIN")) {
    redirect("/aluno/dashboard");
  }

  const user = session.user;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-blue-600 text-white shadow-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">

            <div className="flex items-center gap-3">
              <div className="bg-white/10 p-2 rounded-lg">
                <GraduationCap className="h-6 w-6 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-lg leading-tight tracking-tight">Portal Acadêmico Inatel</span>
                <span className="text-[10px] text-blue-200 uppercase tracking-wider font-semibold">Sistema Integrado de Gestão</span>
              </div>
            </div>

            <ProfessorNavLinks />

            <div className="flex items-center gap-4">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold leading-none text-white">{user.name}</p>
                <p className="text-xs text-blue-200 mt-1">{user.email}</p>
              </div>

              <form action="/api/auth/logout" method="POST">
                <button
                  type="submit"
                  className="p-2 hover:bg-blue-700 rounded-lg transition-colors group flex items-center gap-2"
                  title="Sair"
                >
                  <LogOut className="h-5 w-5 text-blue-100 group-hover:text-white" />
                  <span className="text-sm font-medium text-blue-100 group-hover:text-white sm:hidden">Sair</span>
                </button>
              </form>
            </div>

          </div>
        </div>
      </header>

      <main className="flex-1">
        {children}
      </main>
    </div>
  );
}
