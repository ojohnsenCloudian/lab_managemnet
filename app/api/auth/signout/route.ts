import { signOut } from "@/src/lib/auth";
import { NextResponse } from "next/server";

export async function POST() {
  await signOut();
  return NextResponse.redirect(new URL("/login", process.env.NEXTAUTH_URL || "http://localhost:8950"));
}

