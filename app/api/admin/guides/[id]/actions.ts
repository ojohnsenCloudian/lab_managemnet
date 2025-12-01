"use server";

import { auth } from "@/src/lib/auth";
import { db } from "@/src/lib/db";

export async function deleteGuide(id: string) {
  const session = await auth();
  if (!session?.user?.isAdmin) {
    throw new Error("Unauthorized");
  }

  await db.labGuide.delete({
    where: { id },
  });
}

