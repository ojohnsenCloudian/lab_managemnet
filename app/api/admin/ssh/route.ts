import { auth } from '@/src/lib/auth';
import { db } from '@/src/lib/db';
import { encrypt } from '@/src/lib/encryption';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const credentials = await db.sSHCredential.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({ credentials });
  } catch (error) {
    console.error('Get SSH credentials error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();
    const { name, host, port, username, password, privateKey, labGuideId } = data;

    if (!name || !host || !username || (!password && !privateKey)) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const credential = await db.sSHCredential.create({
      data: {
        name,
        host,
        port: port || 22,
        username,
        password: password ? encrypt(password) : null,
        privateKey: privateKey ? encrypt(privateKey) : null,
        labGuideId: labGuideId || null,
      },
    });

    return NextResponse.json({ credential });
  } catch (error) {
    console.error('Create SSH credential error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
