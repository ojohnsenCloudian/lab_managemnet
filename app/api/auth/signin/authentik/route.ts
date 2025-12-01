import { signIn } from "@/src/lib/auth";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const formData = await request.formData();
  const callbackUrl = (formData.get("callbackUrl") as string) || "/guides";

  try {
    await signIn("authentik", {
      redirectTo: callbackUrl,
    });
    return NextResponse.redirect(new URL(callbackUrl, request.url));
  } catch (error: any) {
    console.error("OAuth signin error:", error);
    return NextResponse.redirect(
      new URL(`/login?error=oauth_failed&callbackUrl=${callbackUrl}`, request.url)
    );
  }
}

