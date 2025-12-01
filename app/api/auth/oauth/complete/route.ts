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
    const encodedData = searchParams.get("data"); // Encoded user data as fallback

    const baseUrl = getBaseUrl(request);

    let userId: string | null = null;

    // Try to get from cookie first
    const cookieStore = await cookies();
    const tokenData = cookieStore.get("oauth_token")?.value;

    if (tokenData && token) {
      try {
        const parsed = JSON.parse(tokenData);
        // Verify token matches and hasn't expired
        if (parsed.token === token && Date.now() <= parsed.expiry) {
          userId = parsed.userId;
        }
      } catch (e) {
        console.error("Error parsing token data from cookie:", e);
      }
    }

    // Fallback: decode from URL parameter if cookie failed
    if (!userId && encodedData && token) {
      try {
        const decoded = Buffer.from(encodedData, "base64url").toString("utf-8");
        const data = JSON.parse(decoded);
        // Verify token matches and timestamp (should be recent, within 5 minutes)
        if (data.token === token && Date.now() - data.timestamp < 5 * 60 * 1000) {
          userId = data.userId;
        } else {
          console.error("Token mismatch or expired in URL data:", {
            tokenMatch: data.token === token,
            expired: Date.now() - data.timestamp >= 5 * 60 * 1000,
          });
        }
      } catch (e) {
        console.error("Error decoding token data from URL:", e);
      }
    }

    if (!userId) {
      console.error("OAuth token verification failed:", {
        hasToken: !!token,
        tokenValue: token?.substring(0, 10) + "...",
        hasCookie: !!tokenData,
        cookieValue: tokenData ? tokenData.substring(0, 50) + "..." : null,
        hasEncoded: !!encodedData,
        encodedValue: encodedData ? encodedData.substring(0, 20) + "..." : null,
      });
      return NextResponse.redirect(
        new URL(`/login?error=oauth_invalid_token`, baseUrl)
      );
    }

    console.log("OAuth token verified successfully, userId:", userId);

    // Get user
    const user = await db.user.findUnique({
      where: { id: userId },
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
    // Clean up OAuth token cookie
    response.cookies.delete("oauth_token");
    
    // Set NextAuth session cookie
    // NextAuth v5 uses different cookie names - try both formats
    const isSecure = process.env.NODE_ENV === "production";
    
    // Try the standard NextAuth v5 cookie name
    const cookieName = isSecure 
      ? "__Secure-authjs.session-token"
      : "authjs.session-token";
    
    response.cookies.set(cookieName, sessionToken, {
      httpOnly: true,
      secure: isSecure,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: "/",
    });
    
    // Also try alternative cookie name (some NextAuth v5 setups use this)
    if (!isSecure) {
      response.cookies.set("next-auth.session-token", sessionToken, {
        httpOnly: true,
        secure: false,
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 30,
        path: "/",
      });
    }
    
    console.log("Session cookie set:", cookieName, "Token length:", sessionToken.length);

    return response;
  } catch (error) {
    console.error("OAuth completion error:", error);
    const baseUrl = getBaseUrl(request);
    return NextResponse.redirect(
      new URL(`/login?error=oauth_completion_failed`, baseUrl)
    );
  }
}

