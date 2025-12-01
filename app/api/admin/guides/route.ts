import { auth } from "@/src/lib/auth";
import { db } from "@/src/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const guides = await db.labGuide.findMany({
    include: { createdBy: { select: { name: true, email: true } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ guides });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const data = await request.json();
  const guide = await db.labGuide.create({
    data: {
      title: data.title,
      description: data.description,
      content: data.content || "",
      steps: data.steps || "",
      isPublished: data.isPublished || false,
      createdById: session.user.id!,
    },
  });

  return NextResponse.json({ guide });
}
