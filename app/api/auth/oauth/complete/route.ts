import { db } from "@/src/lib/db";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { encode } from "@auth/core/jwt";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");
    const callbackUrl = searchParams.get("callbackUrl") || "/guides";

    const cookieStore = await cookies();
    const tokenData = cookieStore.get("oauth_token")?.value;

    if (!tokenData || !token) {
      return NextResponse.redirect(
        new URL(`/login?error=oauth_invalid_token`, request.url)
      );
    }

    const parsed = JSON.parse(tokenData);
    
    // Verify token matches and hasn't expired
    if (parsed.token !== token || Date.now() > parsed.expiry) {
      return NextResponse.redirect(
        new URL(`/login?error=oauth_token_expired`, request.url)
      );
    }

    // Get user
    const user = await db.user.findUnique({
      where: { id: parsed.userId },
    });

    if (!user) {
      return NextResponse.redirect(
        new URL(`/login?error=oauth_user_not_found`, request.url)
      );
    }

    // Create NextAuth session by calling the internal session API
    // We'll create a session by making a request to NextAuth's session endpoint
    const baseUrl = process.env.NEXTAUTH_URL || new URL(request.url).origin;
    
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

    const response = NextResponse.redirect(new URL(callbackUrl, request.url));
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
    return NextResponse.redirect(
      new URL(`/login?error=oauth_completion_failed`, request.url)
    );
  }
}

