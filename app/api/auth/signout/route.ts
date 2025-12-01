import { signOut } from "@/src/lib/auth";
import { NextResponse } from "next/server";

export async function POST() {
  await signOut({ redirectTo: "/login" });
  return NextResponse.json({ success: true });
}
