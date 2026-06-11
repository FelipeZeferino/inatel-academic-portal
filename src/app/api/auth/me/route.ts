import { NextResponse } from "next/server";
import { getSession } from "@/server/better-auth/server";
import { db } from "@/server/db";

export async function GET() {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const dbUser = await db.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  return NextResponse.json({ role: dbUser?.role ?? "ALUNO" });
}