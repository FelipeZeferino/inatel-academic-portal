import { auth } from "@/server/better-auth";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  await auth.api.signOut({
    headers: request.headers,
  });

  return NextResponse.redirect(new URL("/login", request.url));
}
