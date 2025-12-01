import { db } from "@/src/lib/db";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { encode } from "@auth/core/jwt";
import { getBaseUrl } from "@/src/lib/url-helper";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");
    const callbackUrl = searchParams.get("callbackUrl") || "/guides";

    const cookieStore = await cookies();
    const tokenData = cookieStore.get("oauth_token")?.value;

    const baseUrl = getBaseUrl(request);

    if (!tokenData || !token) {
      return NextResponse.redirect(
        new URL(`/login?error=oauth_invalid_token`, baseUrl)
      );
    }

    const parsed = JSON.parse(tokenData);
    
    // Verify token matches and hasn't expired
    if (parsed.token !== token || Date.now() > parsed.expiry) {
      return NextResponse.redirect(
        new URL(`/login?error=oauth_token_expired`, baseUrl)
      );
    }

    // Get user
    const user = await db.user.findUnique({
      where: { id: parsed.userId },
    });

    if (!user) {
      return NextResponse.redirect(
        new URL(`/login?error=oauth_user_not_found`, baseUrl)
      );
    }
    
    // Create session by calling NextAuth's callback with user data
    // Since we can't use signIn without a provider, we'll create the session cookie directly
    const secret = process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET;
    if (!secret) {
      throw new Error("NEXTAUTH_SECRET is not set");
    }

    // Create JWT token for the session
    const { encode } = await import("@auth/core/jwt");
    const sessionToken = await encode({
      token: {
        sub: user.id,
        email: user.email,
        name: user.name,
        id: user.id,
        isAdmin: user.isAdmin,
        passwordChangeRequired: user.passwordChangeRequired,
      },
      secret,
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });

    const response = NextResponse.redirect(new URL(callbackUrl, baseUrl));
    response.cookies.delete("oauth_token");
    
    // Set NextAuth session cookie (NextAuth v5 uses authjs.session-token)
    const cookieName = process.env.NODE_ENV === "production" 
      ? "__Secure-authjs.session-token"
      : "authjs.session-token";
    
    response.cookies.set(cookieName, sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("OAuth completion error:", error);
    const baseUrl = getBaseUrl(request);
    return NextResponse.redirect(
      new URL(`/login?error=oauth_completion_failed`, baseUrl)
    );
  }
}

