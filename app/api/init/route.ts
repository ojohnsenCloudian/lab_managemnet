import { NextResponse } from "next/server";
import { db } from "@/src/lib/db";
import bcrypt from "bcryptjs";

export async function POST(request: Request) {
  try {
    // Check if admin already exists
    const existingAdmin = await db.user.findFirst({
      where: { isAdmin: true },
    });

    if (existingAdmin) {
      return NextResponse.json({ message: "Admin user already exists" });
    }

    // Create admin user
    const hashedPassword = await bcrypt.hash("Password123", 10);

    const admin = await db.user.create({
      data: {
        email: "admin@lab.local",
        name: "Admin",
        password: hashedPassword,
        isAdmin: true,
        passwordChangeRequired: true,
      },
    });

    return NextResponse.json({
      message: "Admin user created successfully",
      email: admin.email,
    });
  } catch (error) {
    console.error("Error initializing admin:", error);
    return NextResponse.json(
      { error: "Failed to initialize admin" },
      { status: 500 }
    );
  }
}

