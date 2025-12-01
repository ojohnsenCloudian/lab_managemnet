import { NextResponse } from 'next/server';
import { auth } from '@/src/lib/auth';
import { getClient } from '@/src/lib/ssh2-loader';

const Client = getClient();
const connections = new Map<string, InstanceType<typeof Client>>();

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const conn = connections.get(id);

    if (conn) {
      conn.end();
      connections.delete(id);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Close SSH connection error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
