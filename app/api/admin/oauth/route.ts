import { auth } from "@/src/lib/auth";
import { db } from "@/src/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const provider = await db.oAuthProvider.findFirst({
    where: { name: "authentik" },
  });

  return NextResponse.json({ provider });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const data = await request.json();

  const provider = await db.oAuthProvider.upsert({
    where: { name: "authentik" },
    create: {
      name: "authentik",
      clientId: data.clientId,
      clientSecret: data.clientSecret,
      authorizationUrl: data.authorizationUrl,
      tokenUrl: data.tokenUrl,
      userInfoUrl: data.userInfoUrl,
      scope: data.scope || "openid profile email",
      isEnabled: data.isEnabled || false,
    },
    update: {
      clientId: data.clientId,
      clientSecret: data.clientSecret,
      authorizationUrl: data.authorizationUrl,
      tokenUrl: data.tokenUrl,
      userInfoUrl: data.userInfoUrl,
      scope: data.scope || "openid profile email",
      isEnabled: data.isEnabled || false,
    },
  });

  return NextResponse.json({ provider });
}
