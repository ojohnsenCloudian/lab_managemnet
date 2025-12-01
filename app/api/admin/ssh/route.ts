import { auth } from "@/src/lib/auth";
import { db } from "@/src/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const credentials = await db.sSHCredential.findMany({
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ credentials });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const data = await request.json();

  const credential = await db.sSHCredential.create({
    data: {
      name: data.name,
      host: data.host,
      port: data.port || 22,
      username: data.username,
      password: data.password || null,
      privateKey: data.privateKey || null,
      labGuideId: data.labGuideId || null,
    },
  });

  return NextResponse.json({ credential });
}
