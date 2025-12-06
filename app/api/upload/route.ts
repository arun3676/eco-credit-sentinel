import { NextRequest, NextResponse } from 'next/server';
import { ApifyClient } from 'apify-client';
import { v4 as uuidv4 } from 'uuid';
import { Buffer } from 'node:buffer';

export const runtime = 'nodejs';

const token = process.env.APIFY_TOKEN;
const storeId = process.env.APIFY_KEY_VALUE_STORE_ID;

const client = new ApifyClient({ token });

export async function POST(req: NextRequest) {
  try {
    if (!token || !storeId) {
      return NextResponse.json(
        { error: 'Missing APIFY_TOKEN or APIFY_KEY_VALUE_STORE_ID' },
        { status: 500 },
      );
    }

    const formData = await req.formData();
    const file = formData.get('file');

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: 'file is required (PDF in formData)' },
        { status: 400 },
      );
    }

    const key = `${uuidv4()}.pdf`;
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Apify client accepts Buffer for binary files, but TypeScript types don't reflect this
    await client.keyValueStore(storeId).setRecord({
      key,
      value: buffer as any,
      contentType: file.type || 'application/pdf',
    });

    // Tokenized public URL; remove ?token=... if the store is public.
    const url = `https://api.apify.com/v2/key-value-stores/${storeId}/records/${key}?token=${token}`;

    return NextResponse.json({ key, url });
  } catch (err) {
    console.error('Upload error', err);
    return NextResponse.json(
      { error: 'Upload failed', detail: (err as Error).message },
      { status: 500 },
    );
  }
}

