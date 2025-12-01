import { NextResponse } from "next/server";
import { auth } from "@/src/lib/auth";
import { db } from "@/src/lib/db";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const guides = await db.labGuide.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        createdBy: {
          select: { name: true, email: true },
        },
      },
    });

    return NextResponse.json(guides);
  } catch (error) {
    console.error("Error fetching guides:", error);
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
    const { title, description, content, steps, isPublished } = body;

    if (!title || !content) {
      return NextResponse.json(
        { error: "Title and content are required" },
        { status: 400 }
      );
    }

    const guide = await db.labGuide.create({
      data: {
        title,
        description: description || null,
        content,
        steps: JSON.stringify(steps || []),
        isPublished: isPublished || false,
        createdById: session.user.id!,
      },
    });

    return NextResponse.json(guide);
  } catch (error) {
    console.error("Error creating guide:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

