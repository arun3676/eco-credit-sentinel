import { NextRequest, NextResponse } from 'next/server';
import { ApifyClient } from 'apify-client';
import { calculateCreditAdjustment, generateAuditSummary } from '@/lib/fintech-logic';

export const runtime = 'nodejs';

const token = process.env.APIFY_TOKEN;
const client = new ApifyClient({ token });

type StatusRequest = { runId: string; loanAmount?: number; baseRate?: number; companyName?: string };

export async function POST(req: NextRequest) {
  try {
    if (!token) {
      return NextResponse.json(
        { error: 'Missing APIFY_TOKEN' },
        { status: 500 },
      );
    }

    const body = (await req.json()) as StatusRequest;
    const { runId, loanAmount = 0, baseRate = 0.05, companyName = 'the borrower' } = body || {};

    if (!runId) {
      return NextResponse.json(
        { error: 'runId is required' },
        { status: 400 },
      );
    }

    const run = await client.run(runId).get();
    if (!run) {
      return NextResponse.json({ error: 'Run not found' }, { status: 404 });
    }

    if (run.status !== 'SUCCEEDED') {
      return NextResponse.json({
        runId,
        status: run.status,
        finishedAt: run.finishedAt,
      });
    }

    const datasetId = run.defaultDatasetId;
    const items = datasetId
      ? (await client.dataset(datasetId).listItems()).items
      : [];

    const report = items?.[0] ?? null;

    // Extract risk score safely from possible fields without using `any`.
    const riskScoreSource = report as
      | { risk_score?: number; riskScore?: number; risk?: number }
      | null;
    const riskScore =
      riskScoreSource?.risk_score ??
      riskScoreSource?.riskScore ??
      riskScoreSource?.risk ??
      0;

    const adjustment = calculateCreditAdjustment(riskScore, loanAmount, baseRate);
    const summary = generateAuditSummary(riskScore, companyName);

    return NextResponse.json({
      runId,
      status: run.status,
      datasetId,
      report,
      adjustment: {
        ...adjustment,
        loanAmount,
        baseRate,
        summary,
      },
    });
  } catch (err) {
    console.error('Status check error', err);
    return NextResponse.json(
      { error: 'Failed to fetch status', detail: (err as Error).message },
      { status: 500 },
    );
  }
}

