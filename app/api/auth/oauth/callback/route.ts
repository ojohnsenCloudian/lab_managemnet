import { db } from "@/src/lib/db";
import { auth, signIn } from "@/src/lib/auth";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const error = searchParams.get("error");

    if (error) {
      return NextResponse.redirect(
        new URL(`/login?error=oauth_${error}`, request.url)
      );
    }

    if (!code || !state) {
      return NextResponse.redirect(
        new URL(`/login?error=oauth_invalid`, request.url)
      );
    }

    // Verify state
    const cookieStore = await cookies();
    const storedState = cookieStore.get("oauth_state")?.value;
    const callbackUrl = cookieStore.get("oauth_callback")?.value || "/guides";

    if (storedState !== state) {
      return NextResponse.redirect(
        new URL(`/login?error=oauth_state_mismatch`, request.url)
      );
    }

    // Get OAuth config
    const oauthConfig = await db.oAuthProvider.findFirst({
      where: { name: "Authentik", isEnabled: true },
    });

    if (!oauthConfig) {
      return NextResponse.redirect(
        new URL(`/login?error=oauth_not_configured`, request.url)
      );
    }

    // Exchange code for token
    const redirectUri = `${process.env.NEXTAUTH_URL || new URL(request.url).origin}/api/auth/oauth/callback`;
    const tokenResponse = await fetch(oauthConfig.tokenUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code: code,
        redirect_uri: redirectUri,
        client_id: oauthConfig.clientId,
        client_secret: oauthConfig.clientSecret,
      }),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error("Token exchange failed:", errorText);
      return NextResponse.redirect(
        new URL(`/login?error=oauth_token_failed`, request.url)
      );
    }

    const tokens = await tokenResponse.json();

    // Get user info
    const userInfoResponse = await fetch(oauthConfig.userInfoUrl, {
      headers: {
        Authorization: `Bearer ${tokens.access_token}`,
      },
    });

    if (!userInfoResponse.ok) {
      return NextResponse.redirect(
        new URL(`/login?error=oauth_userinfo_failed`, request.url)
      );
    }

    const userInfo = await userInfoResponse.json();

    // Find or create user
    let user = await db.user.findUnique({
      where: { email: userInfo.email },
    });

    if (!user) {
      user = await db.user.create({
        data: {
          email: userInfo.email,
          name: userInfo.name || userInfo.preferred_username || userInfo.email,
          isAdmin: false,
          passwordChangeRequired: false,
          oauthProvider: "Authentik",
        },
      });
    }

    // Create a temporary OAuth token for this user (valid for 5 minutes)
    const oauthToken = crypto.randomUUID();
    const tokenExpiry = Date.now() + 5 * 60 * 1000; // 5 minutes
    
    // Store token in database or cache (simplified - using a cookie for now)
    // In production, use Redis or similar
    
    // Clear OAuth cookies and set OAuth token
    const response = NextResponse.redirect(
      new URL(`/api/auth/oauth/complete?token=${oauthToken}&callbackUrl=${encodeURIComponent(callbackUrl)}`, request.url)
    );
    response.cookies.delete("oauth_state");
    response.cookies.delete("oauth_callback");
    response.cookies.set("oauth_token", JSON.stringify({ userId: user.id, token: oauthToken, expiry: tokenExpiry }), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 300, // 5 minutes
    });

    return response;
  } catch (error) {
    console.error("OAuth callback error:", error);
    return NextResponse.redirect(
      new URL(`/login?error=oauth_callback_failed`, request.url)
    );
  }
}

