import { db } from "@/src/lib/db";
import { auth, signIn } from "@/src/lib/auth";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getBaseUrl } from "@/src/lib/url-helper";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const error = searchParams.get("error");

    const baseUrl = getBaseUrl(request);

    if (error) {
      return NextResponse.redirect(
        new URL(`/login?error=oauth_${error}`, baseUrl)
      );
    }

    if (!code || !state) {
      return NextResponse.redirect(
        new URL(`/login?error=oauth_invalid`, baseUrl)
      );
    }

    // Verify state - state is base64url encoded JSON with state, callback, and timestamp
    let stateData: { state: string; callback: string; timestamp: number } | null = null;
    let callbackUrl = "/guides";
    
    try {
      // Decode state from URL parameter (this is what Authentik returns)
      const decoded = Buffer.from(state, "base64url").toString("utf-8");
      stateData = JSON.parse(decoded);
      
      // Verify timestamp (state should be recent, within 10 minutes)
      if (Date.now() - stateData.timestamp > 10 * 60 * 1000) {
        throw new Error("State expired");
      }
      
      callbackUrl = stateData.callback || "/guides";
    } catch (error) {
      // Fallback to cookie-based verification if decoding fails
      const cookieStore = await cookies();
      const storedState = cookieStore.get("oauth_state")?.value;
      callbackUrl = cookieStore.get("oauth_callback")?.value || "/guides";

      // For cookie fallback, we compare the raw state
      if (!storedState) {
        console.error("State verification failed:", { 
          received: state,
          error: error instanceof Error ? error.message : "Unknown error"
        });
        return NextResponse.redirect(
          new URL(`/login?error=oauth_state_mismatch`, baseUrl)
        );
      }
      
      // If we have a stored state, use it (this means state wasn't encoded)
      // This is a fallback for older flows
      callbackUrl = cookieStore.get("oauth_callback")?.value || "/guides";
    }

    // Get OAuth config
    const oauthConfig = await db.oAuthProvider.findFirst({
      where: { name: "Authentik", isEnabled: true },
    });

    if (!oauthConfig) {
      return NextResponse.redirect(
        new URL(`/login?error=oauth_not_configured`, baseUrl)
      );
    }

    // Exchange code for token
    const redirectUri = `${baseUrl}/api/auth/oauth/callback`;
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
        new URL(`/login?error=oauth_token_failed`, baseUrl)
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
        new URL(`/login?error=oauth_userinfo_failed`, baseUrl)
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
      new URL(`/api/auth/oauth/complete?token=${oauthToken}&callbackUrl=${encodeURIComponent(callbackUrl)}`, baseUrl)
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
    const baseUrl = getBaseUrl(request);
    return NextResponse.redirect(
      new URL(`/login?error=oauth_callback_failed`, baseUrl)
    );
  }
}

