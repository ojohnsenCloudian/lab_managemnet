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
  const guide = await db.labGuide.findUnique({
    where: { id },
    include: { createdBy: { select: { name: true, email: true } } },
  });

  if (!guide) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ guide });
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
  const data = await request.json();

  const guide = await db.labGuide.update({
    where: { id },
    data: {
      title: data.title,
      description: data.description,
      content: data.content,
      steps: data.steps,
      isPublished: data.isPublished,
    },
  });

  return NextResponse.json({ guide });
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
  await db.labGuide.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
