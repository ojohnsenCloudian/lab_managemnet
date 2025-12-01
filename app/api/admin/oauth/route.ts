import { auth } from "@/src/lib/auth";
import { db } from "@/src/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();

  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const provider = await db.oAuthProvider.findFirst({
      where: { name: "Authentik" },
    });
    return NextResponse.json({ provider }, { status: 200 });
  } catch (error) {
    console.error("Error fetching OAuth provider:", error);
    return NextResponse.json({ error: "Failed to fetch OAuth provider" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { name, clientId, clientSecret, authorizationUrl, tokenUrl, userInfoUrl, scope, isEnabled } =
    await request.json();

  if (!name || !clientId || !clientSecret || !authorizationUrl || !tokenUrl || !userInfoUrl) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  try {
    const provider = await db.oAuthProvider.upsert({
      where: { name: "Authentik" },
      update: {
        clientId,
        clientSecret,
        authorizationUrl,
        tokenUrl,
        userInfoUrl,
        scope: scope || "openid profile email",
        isEnabled: isEnabled || false,
      },
      create: {
        name: "Authentik",
        clientId,
        clientSecret,
        authorizationUrl,
        tokenUrl,
        userInfoUrl,
        scope: scope || "openid profile email",
        isEnabled: isEnabled || false,
      },
    });
    return NextResponse.json({ provider }, { status: 200 });
  } catch (error) {
    console.error("Error saving OAuth provider:", error);
    return NextResponse.json({ error: "Failed to save OAuth provider" }, { status: 500 });
  }
}
