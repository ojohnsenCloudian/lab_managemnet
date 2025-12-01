import { NextResponse } from "next/server";
import { auth } from "@/src/lib/auth";
import { db } from "@/src/lib/db";
import { encrypt } from "@/src/lib/encryption";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const credentials = await db.sSHCredential.findMany({
      select: {
        id: true,
        name: true,
        host: true,
        port: true,
        username: true,
      },
    });

    return NextResponse.json(credentials);
  } catch (error) {
    console.error("Error fetching SSH credentials:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, host, port, username, password, privateKey, labGuideId } = body;

    if (!name || !host || !username) {
      return NextResponse.json(
        { error: "Name, host, and username are required" },
        { status: 400 }
      );
    }

    if (!password && !privateKey) {
      return NextResponse.json(
        { error: "Either password or private key is required" },
        { status: 400 }
      );
    }

    const credential = await db.sSHCredential.create({
      data: {
        name,
        host,
        port: port || 22,
        username,
        password: password ? encrypt(password) : null,
        privateKey: privateKey ? encrypt(privateKey) : null,
        labGuideId: labGuideId || null,
      },
    });

    return NextResponse.json({
      id: credential.id,
      name: credential.name,
      host: credential.host,
      port: credential.port,
      username: credential.username,
    });
  } catch (error) {
    console.error("Error creating SSH credential:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

