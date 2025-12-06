import { NextRequest, NextResponse } from 'next/server';
import { ApifyClient } from 'apify-client';

export const runtime = 'nodejs';

const token = process.env.APIFY_TOKEN;
const actorId = process.env.APIFY_ACTOR_ID || 'momentous_hill/greenwashing-detector-for-esgs';
const client = new ApifyClient({ token });

type AuditRequest = {
  fileUrl: string;
  companyName: string;
  loanAmount: number;
};

export async function POST(req: NextRequest) {
  try {
    if (!token) {
      return NextResponse.json(
        { error: 'Missing APIFY_TOKEN' },
        { status: 500 },
      );
    }

    const body = (await req.json()) as AuditRequest;
    const { fileUrl, companyName, loanAmount } = body || {};

    if (!fileUrl || !fileUrl.trim() || !companyName || loanAmount === undefined) {
      return NextResponse.json(
        { error: 'fileUrl, companyName, and loanAmount are required' },
        { status: 400 },
      );
    }

    // Actor input schema: required target_url and company_name
    const runInput = {
      target_url: fileUrl,
      company_name: companyName,
    };

    console.log('Starting actor with runInput:', runInput);

    // Pass input as the first argument; build tag as second options argument.
    const run = await client.actor(actorId).call(runInput, { build: 'latest' });

    return NextResponse.json({ runId: run.id, status: run.status });
  } catch (err) {
    console.error('Audit start error', err);
    return NextResponse.json(
      { error: 'Failed to start audit', detail: (err as Error).message },
      { status: 500 },
    );
  }
}

