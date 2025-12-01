import { NextResponse } from "next/server";
import { auth } from "@/src/lib/auth";

const inputStreams = new Map<string, WritableStream>();

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const { data } = await request.json();
    const stream = inputStreams.get(id);

    if (stream) {
      const writer = stream.getWriter();
      await writer.write(new TextEncoder().encode(data));
      writer.releaseLock();
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

