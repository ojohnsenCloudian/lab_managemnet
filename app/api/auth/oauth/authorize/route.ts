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
    // Encode callback URL in state to avoid cookie issues
    const stateData = {
      state: crypto.randomUUID(),
      callback: callbackUrl,
      timestamp: Date.now(),
    };
    const state = Buffer.from(JSON.stringify(stateData)).toString("base64url");
    
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

    // Create redirect response
    // State is now encoded in the URL, so cookies are just a backup
    const response = NextResponse.redirect(authUrl.toString());
    
    // Also store in cookies as backup (but state is in URL)
    const isSecure = process.env.NODE_ENV === "production" || request.url.startsWith("https://");
    
    response.cookies.set("oauth_state", stateData.state, {
      httpOnly: true,
      secure: isSecure,
      sameSite: "lax",
      maxAge: 600, // 10 minutes
      path: "/",
    });
    response.cookies.set("oauth_callback", callbackUrl, {
      httpOnly: true,
      secure: isSecure,
      sameSite: "lax",
      maxAge: 600,
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("OAuth authorization error:", error);
    return NextResponse.redirect(
      new URL(`/login?error=oauth_failed`, request.url)
    );
  }
}

