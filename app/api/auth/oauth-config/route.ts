import { db } from "@/src/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const provider = await db.oAuthProvider.findFirst({
      where: { name: "Authentik", isEnabled: true },
    });

    if (!provider) {
      return NextResponse.json({ enabled: false });
    }

    return NextResponse.json({
      enabled: true,
      redirectUrl: `${process.env.NEXTAUTH_URL || "http://localhost:8950"}/api/auth/oauth/callback`,
    });
  } catch (error) {
    console.error("Error fetching OAuth config:", error);
    return NextResponse.json({ enabled: false });
  }
}

