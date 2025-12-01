import { auth } from "@/src/lib/auth";
import { db } from "@/src/lib/db";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();

  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const guide = await db.labGuide.findUnique({
      where: { id },
    });

    if (!guide) {
      return NextResponse.json({ error: "Lab guide not found" }, { status: 404 });
    }

    return NextResponse.json({ guide }, { status: 200 });
  } catch (error) {
    console.error("Error fetching lab guide:", error);
    return NextResponse.json({ error: "Failed to fetch lab guide" }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();

  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const { title, description, content, steps, isPublished } = await request.json();

  if (!title || !content || !steps) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  try {
    const updatedGuide = await db.labGuide.update({
      where: { id },
      data: {
        title,
        description,
        content,
        steps,
        isPublished,
      },
    });
    return NextResponse.json({ guide: updatedGuide }, { status: 200 });
  } catch (error) {
    console.error("Error updating lab guide:", error);
    return NextResponse.json({ error: "Failed to update lab guide" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();

  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    await db.labGuide.delete({
      where: { id },
    });
    return NextResponse.json({ message: "Lab guide deleted successfully" }, { status: 200 });
  } catch (error) {
    console.error("Error deleting lab guide:", error);
    return NextResponse.json({ error: "Failed to delete lab guide" }, { status: 500 });
  }
}
