import { NextResponse } from "next/server";
import { auth } from "@/src/lib/auth";

const connections = new Map<string, any>();

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const conn = connections.get(params.id);
    if (conn) {
      conn.end();
      connections.delete(params.id);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

