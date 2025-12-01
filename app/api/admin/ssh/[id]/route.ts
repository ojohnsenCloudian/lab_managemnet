import { auth } from '@/src/lib/auth';
import { db } from '@/src/lib/db';
import { encrypt } from '@/src/lib/encryption';
import { NextResponse } from 'next/server';

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    await db.sSHCredential.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete SSH credential error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const data = await request.json();
    const { name, host, port, username, password, privateKey, labGuideId } = data;

    const updateData: any = {};
    if (name) updateData.name = name;
    if (host) updateData.host = host;
    if (port) updateData.port = port;
    if (username) updateData.username = username;
    if (password) updateData.password = encrypt(password);
    if (privateKey !== undefined) {
      updateData.privateKey = privateKey ? encrypt(privateKey) : null;
    }
    if (labGuideId !== undefined) updateData.labGuideId = labGuideId;

    const credential = await db.sSHCredential.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ credential });
  } catch (error) {
    console.error('Update SSH credential error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
