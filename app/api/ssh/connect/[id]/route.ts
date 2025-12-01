import { NextResponse } from "next/server";
import { auth } from "@/src/lib/auth";
import { db } from "@/src/lib/db";
import { decrypt } from "@/src/lib/encryption";
import { Client } from "ssh2";

const connections = new Map<string, Client>();

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const credential = await db.sSHCredential.findUnique({
      where: { id },
    });

    if (!credential) {
      return NextResponse.json(
        { error: "Credential not found" },
        { status: 404 }
      );
    }

    const conn = new Client();
    connections.set(id, conn);

    return new Promise((resolve, reject) => {
      conn.on("ready", () => {
        conn.shell((err, stream) => {
          if (err) {
            reject(err);
            return;
          }

          const readableStream = new ReadableStream({
            start(controller) {
              stream.on("data", (data: Buffer) => {
                controller.enqueue(new Uint8Array(data));
              });

              stream.on("close", () => {
                controller.close();
              });

              stream.on("error", (err) => {
                controller.error(err);
              });
            },
          });

          resolve(
            new Response(readableStream, {
              headers: {
                "Content-Type": "text/plain",
              },
            })
          );
        });
      });

      conn.on("error", (err) => {
        reject(err);
      });

      const config: any = {
        host: credential.host,
        port: credential.port,
        username: credential.username,
      };

      if (credential.privateKey) {
        config.privateKey = decrypt(credential.privateKey);
      } else if (credential.password) {
        config.password = decrypt(credential.password);
      }

      conn.connect(config);
    });
  } catch (error) {
    console.error("SSH connection error:", error);
    return NextResponse.json(
      { error: "Failed to connect" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const { data } = await request.json();
    const conn = connections.get(id);

    if (conn) {
      // Send data to SSH connection
      // This would need to be implemented with a proper stream management system
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

