import { auth } from "@/src/lib/auth";
import { db } from "@/src/lib/db";
import { NextResponse } from "next/server";

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
    await db.sSHCredential.delete({ where: { id } });
    return NextResponse.json({ message: "SSH credential deleted successfully" }, { status: 200 });
  } catch (error) {
    console.error("Error deleting SSH credential:", error);
    return NextResponse.json({ error: "Failed to delete SSH credential" }, { status: 500 });
  }
}
