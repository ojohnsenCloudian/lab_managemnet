import { auth } from "@/src/lib/auth";
import { db } from "@/src/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();

  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const guides = await db.labGuide.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ guides }, { status: 200 });
  } catch (error) {
    console.error("Error fetching lab guides:", error);
    return NextResponse.json({ error: "Failed to fetch lab guides" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { title, description, content, steps, isPublished } = await request.json();

  if (!title || !content || !steps) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  try {
    const newGuide = await db.labGuide.create({
      data: {
        title,
        description,
        content,
        steps,
        isPublished,
        createdById: session.user.id,
      },
    });
    return NextResponse.json({ guide: newGuide }, { status: 201 });
  } catch (error) {
    console.error("Error creating lab guide:", error);
    return NextResponse.json({ error: "Failed to create lab guide" }, { status: 500 });
  }
}
