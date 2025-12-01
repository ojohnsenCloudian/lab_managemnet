import { signOut } from "@/src/lib/auth";
import { NextResponse } from "next/server";

export async function POST() {
  try {
    await signOut({ redirect: false });
    return NextResponse.json({ success: true });
  } catch (error) {
    // Even if signout fails, return success (session might already be cleared)
    return NextResponse.json({ success: true });
  }
}
