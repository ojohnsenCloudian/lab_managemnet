import { auth } from "@/src/lib/auth";
import { db } from "@/src/lib/db";
import { NextResponse } from "next/server";
import { getClient } from "@/src/lib/ssh2-loader";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const credential = await db.sSHCredential.findUnique({ where: { id } });

  if (!credential) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Return credential info (password/key should be encrypted in real implementation)
  return NextResponse.json({
    host: credential.host,
    port: credential.port,
    username: credential.username,
  });
}
