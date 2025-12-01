import { signIn } from "@/src/lib/auth";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const { email, password, callbackUrl } = await request.json();

  try {
    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    return NextResponse.json({ success: true, callbackUrl: callbackUrl || "/guides" });
  } catch (error) {
    return NextResponse.json({ error: "An error occurred" }, { status: 500 });
  }
}

