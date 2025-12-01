import { db } from "@/src/lib/db";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
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
      console.error("NEXTAUTH_SECRET is not set!");
      throw new Error("NEXTAUTH_SECRET is not set");
    }

    console.log("Creating session token for user:", user.id, user.email);

    // Create session by calling NextAuth's signIn function
    // We'll use a workaround: create a temporary password for OAuth users
    // or use NextAuth's internal session creation
    
    // Actually, let's use a simpler approach: create the session cookie
    // using the same method NextAuth uses internally
    let sessionToken: string;
    try {
      // Import jwt from @auth/core
      const { encode } = await import("@auth/core/jwt");
      
      // Create token payload
      const now = Math.floor(Date.now() / 1000);
      const token = {
        sub: user.id,
        email: user.email,
        name: user.name,
        id: user.id,
        isAdmin: user.isAdmin ?? false,
        passwordChangeRequired: user.passwordChangeRequired ?? false,
        iat: now,
        exp: now + (60 * 60 * 24 * 30), // 30 days
      };

      // Encode with salt (NextAuth v5 uses salt for session tokens)
      sessionToken = await encode({
        token,
        secret,
        salt: "authjs.session-token",
      });
      
      console.log("Session token created, length:", sessionToken.length);
    } catch (encodeError: any) {
      console.error("JWT encoding failed:", {
        error: encodeError?.message || String(encodeError),
        stack: encodeError?.stack,
        secretExists: !!secret,
        secretLength: secret?.length,
      });
      
      // Fallback: try without salt
      try {
        const { encode } = await import("@auth/core/jwt");
        const now = Math.floor(Date.now() / 1000);
        sessionToken = await encode({
          token: {
            sub: user.id,
            email: user.email,
            name: user.name,
            id: user.id,
            isAdmin: user.isAdmin ?? false,
            passwordChangeRequired: user.passwordChangeRequired ?? false,
            iat: now,
            exp: now + (60 * 60 * 24 * 30),
          },
          secret,
        });
        console.log("Session token created (fallback), length:", sessionToken.length);
      } catch (fallbackError) {
        console.error("Fallback JWT encoding also failed:", fallbackError);
        throw new Error(`JWT encoding failed: ${encodeError?.message || String(encodeError)}`);
      }
    }
    
    if (!sessionToken) {
      throw new Error("Session token is empty after encoding");
    }

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
    console.error("Error details:", {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    const baseUrl = getBaseUrl(request);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.redirect(
      new URL(`/login?error=oauth_completion_failed&details=${encodeURIComponent(errorMessage)}`, baseUrl)
    );
  }
}

