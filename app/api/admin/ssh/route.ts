import { auth } from "@/src/lib/auth";
import { db } from "@/src/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();

  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const credentials = await db.sSHCredential.findMany({
      select: {
        id: true,
        name: true,
        host: true,
        port: true,
        username: true,
        // Do not select password or privateKey for security
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ credentials }, { status: 200 });
  } catch (error) {
    console.error("Error fetching SSH credentials:", error);
    return NextResponse.json({ error: "Failed to fetch SSH credentials" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { name, host, port, username, password, privateKey } = await request.json();

  if (!name || !host || !port || !username) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  if (!password && !privateKey) {
    return NextResponse.json(
      { error: "Either password or private key must be provided" },
      { status: 400 }
    );
  }

  try {
    const credential = await db.sSHCredential.create({
      data: {
        name,
        host,
        port: parseInt(port) || 22,
        username,
        password: password || null,
        privateKey: privateKey || null,
      },
    });
    return NextResponse.json({ credential }, { status: 201 });
  } catch (error) {
    console.error("Error creating SSH credential:", error);
    return NextResponse.json({ error: "Failed to create SSH credential" }, { status: 500 });
  }
}
