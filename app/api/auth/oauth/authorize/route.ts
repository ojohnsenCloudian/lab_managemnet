import { db } from "@/src/lib/db";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const callbackUrl = searchParams.get("callbackUrl") || "/guides";

    // Get OAuth config from database
    const oauthConfig = await db.oAuthProvider.findFirst({
      where: { name: "Authentik", isEnabled: true },
    });

    if (!oauthConfig) {
      return NextResponse.redirect(
        new URL(`/login?error=oauth_not_configured`, request.url)
      );
    }

    // Generate state for CSRF protection
    const state = crypto.randomUUID();
    
    // Store state in session/cookie (simplified - in production use proper session storage)
    const response = NextResponse.next();
    response.cookies.set("oauth_state", state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 600, // 10 minutes
    });
    response.cookies.set("oauth_callback", callbackUrl, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 600,
    });

    // Build authorization URL
    const scope = oauthConfig.scope || "openid profile email";
    const baseUrl = process.env.NEXTAUTH_URL || new URL(request.url).origin;
    const redirectUri = `${baseUrl}/api/auth/oauth/callback`;
    
    const authUrl = new URL(oauthConfig.authorizationUrl);
    authUrl.searchParams.set("client_id", oauthConfig.clientId);
    authUrl.searchParams.set("redirect_uri", redirectUri);
    authUrl.searchParams.set("response_type", "code");
    authUrl.searchParams.set("scope", scope);
    authUrl.searchParams.set("state", state);

    return NextResponse.redirect(authUrl.toString());
  } catch (error) {
    console.error("OAuth authorization error:", error);
    return NextResponse.redirect(
      new URL(`/login?error=oauth_failed`, request.url)
    );
  }
}

