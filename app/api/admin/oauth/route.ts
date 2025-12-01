import { auth } from '@/src/lib/auth';
import { db } from '@/src/lib/db';
import { encrypt, decrypt } from '@/src/lib/encryption';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const provider = await db.oAuthProvider.findFirst({
      where: { name: 'authentik' },
    });

    if (!provider) {
      return NextResponse.json({ provider: null });
    }

    return NextResponse.json({
      provider: {
        ...provider,
        clientSecret: decrypt(provider.clientSecret),
      },
    });
  } catch (error) {
    console.error('Get OAuth provider error:', error);
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
    const {
      clientId,
      clientSecret,
      authorizationUrl,
      tokenUrl,
      userInfoUrl,
      scope,
      isEnabled,
    } = data;

    if (!clientId || !clientSecret || !authorizationUrl || !tokenUrl || !userInfoUrl) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const encryptedSecret = encrypt(clientSecret);

    const provider = await db.oAuthProvider.upsert({
      where: { name: 'authentik' },
      update: {
        clientId,
        clientSecret: encryptedSecret,
        authorizationUrl,
        tokenUrl,
        userInfoUrl,
        scope: scope || 'openid profile email',
        isEnabled: isEnabled || false,
      },
      create: {
        name: 'authentik',
        clientId,
        clientSecret: encryptedSecret,
        authorizationUrl,
        tokenUrl,
        userInfoUrl,
        scope: scope || 'openid profile email',
        isEnabled: isEnabled || false,
      },
    });

    return NextResponse.json({ success: true, provider });
  } catch (error) {
    console.error('Save OAuth provider error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
