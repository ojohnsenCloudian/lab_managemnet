import { NextResponse } from "next/server";
import { auth } from "@/src/lib/auth";
import { db } from "@/src/lib/db";
import { addAuthentikProvider } from "@/src/lib/auth";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const provider = await db.oAuthProvider.findUnique({
      where: { name: "authentik" },
    });

    return NextResponse.json(provider);
  } catch (error) {
    console.error("Error fetching OAuth config:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { issuer, clientId, clientSecret, authorizationUrl, tokenUrl, userInfoUrl } = body;

    if (!issuer || !clientId || !clientSecret || !authorizationUrl || !tokenUrl || !userInfoUrl) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    await addAuthentikProvider({
      issuer,
      clientId,
      clientSecret,
      authorizationUrl,
      tokenUrl,
      userInfoUrl,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error saving OAuth config:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

