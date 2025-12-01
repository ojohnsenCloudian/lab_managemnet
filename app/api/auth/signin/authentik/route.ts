import { signIn } from "@/src/lib/auth";
import { NextResponse } from "next/server";

function getBaseUrl(request: Request): string {
  // Try to get from NEXTAUTH_URL first
  const nextAuthUrl = process.env.NEXTAUTH_URL;
  if (nextAuthUrl) {
    return nextAuthUrl;
  }

  // Get from request headers
  const host = request.headers.get("host");
  const protocol = request.headers.get("x-forwarded-proto") || 
                   (request.url.startsWith("https") ? "https" : "http");
  
  if (host) {
    return `${protocol}://${host}`;
  }

  // Fallback to request URL
  const url = new URL(request.url);
  return `${url.protocol}//${url.host}`;
}

export async function POST(request: Request) {
  const formData = await request.formData();
  const callbackUrl = (formData.get("callbackUrl") as string) || "/guides";
  const baseUrl = getBaseUrl(request);

  try {
    await signIn("authentik", {
      redirectTo: callbackUrl,
    });
    return NextResponse.redirect(new URL(callbackUrl, baseUrl));
  } catch (error: any) {
    console.error("OAuth signin error:", error);
    const errorUrl = new URL(`/login?error=oauth_failed&callbackUrl=${encodeURIComponent(callbackUrl)}`, baseUrl);
    return NextResponse.redirect(errorUrl);
  }
}

