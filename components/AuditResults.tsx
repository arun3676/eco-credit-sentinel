import { useState } from "react";

type Adjustment = {
  rateAdjustment: number;
  newRate: number;
  annualInterestPayment: number;
  financialImpact: number;
  loanAmount: number;
  baseRate: number;
  summary?: string;
};

type AuditResultsProps = {
  adjustment: Adjustment | null;
  report: Record<string, any> | null;
  status: string;
  datasetId?: string;
  uploadUrl?: string;
};

const formatPct = (val: number | null | undefined, digits = 2) =>
  Number.isFinite(val) ? `${((val as number) * 100).toFixed(digits)}%` : "–";

const badgeStyles = (delta: number) => {
  if (Number.isFinite(delta) && delta > 0) return "bg-warning/10 text-warning-foreground border-warning/30";
  if (Number.isFinite(delta) && delta < 0) return "bg-success/10 text-success border-success/30";
  return "bg-muted/60 text-muted-foreground border-border/80";
};

const sourceKeys = [
  "key_contradiction_source",
  "contradiction_source",
  "contradiction_source_url",
  "source_url",
  "source",
  "source_link",
  "evidence_url",
  "evidence",
  "reference_url",
  "reference",
  "link",
  "url",
];

const redactUrlTokens = (url: string): string => {
  // Remove query tokens or obvious creds to avoid leaking keys in UI.
  return url.replace(/([?&])token=[^&#\s"]+/gi, "$1token=REDACTED").replace(/apikey=[^&#\s"]+/gi, "apikey=REDACTED");
};

const isSearchRedirect = (url: string) =>
  /google\.[^/]+\/search|bing\.com\/search|duckduckgo\.com\/\?q=|search\.yahoo\.com/i.test(url);

const firstValidUrl = (val: unknown, uploadUrl?: string): string | null => {
  const isUploadUrl = (candidate: string) =>
    uploadUrl ? candidate.replace(/[#?].*$/, "") === uploadUrl.replace(/[#?].*$/, "") : false;

  if (
    typeof val === "string" &&
    /^https?:\/\//i.test(val) &&
    !isSearchRedirect(val) &&
    !isUploadUrl(val)
  ) {
    return redactUrlTokens(val);
  }
  if (Array.isArray(val)) {
    for (const item of val) {
      const nested = firstValidUrl(item, uploadUrl);
      if (nested) return nested;
    }
  }
  if (val && typeof val === "object") {
    for (const nestedKey of ["url", "link", "source"]) {
      const nested = firstValidUrl((val as Record<string, any>)[nestedKey], uploadUrl);
      if (nested) return nested;
    }
  }
  return null;
};

const extractSourceUrl = (report: Record<string, any> | null, uploadUrl?: string): string | null => {
  if (!report || typeof report !== "object") return null;
  for (const key of sourceKeys) {
    const candidate = firstValidUrl((report as Record<string, any>)[key], uploadUrl);
    if (candidate) return candidate;
  }
  return null;
};

const sanitizeValue = (val: unknown): any => {
  if (typeof val === "string") return redactUrlTokens(val);
  if (Array.isArray(val)) return val.map(sanitizeValue);
  if (val && typeof val === "object") {
    const next: Record<string, any> = {};
    for (const [k, v] of Object.entries(val)) {
      next[k] = sanitizeValue(v);
    }
    return next;
  }
  return val;
};

const sanitizeReport = (report: Record<string, any> | null): Record<string, any> | null => {
  if (!report || typeof report !== "object") return null;
  return sanitizeValue(report);
};

const AuditResults = ({ adjustment, report, status, datasetId, uploadUrl }: AuditResultsProps) => {
  const [showRaw, setShowRaw] = useState(false);
  const sanitizedReport = sanitizeReport(report);
  const hasData = adjustment || sanitizedReport;

  const claim =
    (sanitizedReport && (sanitizedReport.contradicted_claim || sanitizedReport.claim)) ??
    "No explicit claim extracted. We showed the primary statement found.";
  const reality =
    (sanitizedReport && (sanitizedReport.contradiction_detail || sanitizedReport.contradiction)) ??
    "No contradiction text provided by the extractor.";

  const claimVsReality = `They claimed: ${claim}. Reality: ${reality}`;
  const sourceUrl = extractSourceUrl(sanitizedReport, uploadUrl);
  const rawKeySource =
    sanitizedReport && typeof sanitizedReport.key_contradiction_source === "string"
      ? sanitizedReport.key_contradiction_source
      : null;
  const evidenceUrl = sourceUrl || rawKeySource || null;
  const datasetUrl = datasetId
    ? `https://api.apify.com/v2/datasets/${datasetId}/items?clean=true`
    : null;

  return (
    <div className="space-y-4">
      <div className="eco-card overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 bg-secondary/40 px-6 py-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Results</p>
            <h3 className="text-lg font-semibold text-foreground">Audit output</h3>
          </div>
          <span className="pill bg-primary/10 text-primary border border-primary/20">
            <span className="status-dot" />
            {status || "Idle"}
          </span>
        </div>

        <div className="p-6 space-y-4">
          {!hasData ? (
            <p className="text-sm text-muted-foreground">
              Run an audit to see the AI report and credit adjustment.
            </p>
          ) : null}

          {adjustment ? (
            <div className={`rounded-xl border px-4 py-4 shadow-sm ${badgeStyles(adjustment.rateAdjustment)}`}>
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-foreground">Credit adjustment</p>
                    <p className="text-sm text-muted-foreground">
                      {adjustment.summary || "Rate decision based on ESG risk."}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-foreground">{formatPct(adjustment.rateAdjustment)}</p>
                    <p className="text-xs text-muted-foreground">Rate delta</p>
                  </div>
                </div>
                <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3">
                  <div className="rounded-lg border border-border/70 bg-card/60 p-3">
                    <p className="text-xs text-muted-foreground">Base rate</p>
                    <p className="text-sm font-semibold text-foreground">{formatPct(adjustment.baseRate)}</p>
                  </div>
                  <div className="rounded-lg border border-border/70 bg-card/60 p-3">
                    <p className="text-xs text-muted-foreground">Adjusted rate</p>
                    <p className="text-sm font-semibold text-foreground">{formatPct(adjustment.newRate)}</p>
                  </div>
                  <div className="rounded-lg border border-border/70 bg-card/60 p-3">
                    <p className="text-xs text-muted-foreground">Annual interest</p>
                    <p className="text-sm font-semibold text-foreground">
                      {Number.isFinite(adjustment.annualInterestPayment)
                        ? `$${adjustment.annualInterestPayment.toLocaleString(undefined, {
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 0,
                          })}`
                        : "–"}
                    </p>
                  </div>
                  <div className="rounded-lg border border-border/70 bg-card/60 p-3">
                    <p className="text-xs text-muted-foreground">Financial impact</p>
                    <p className="text-sm font-semibold text-foreground">
                      {Number.isFinite(adjustment.financialImpact)
                        ? `$${adjustment.financialImpact.toLocaleString(undefined, {
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 0,
                          })}`
                        : "–"}
                    </p>
                  </div>
                  <div className="rounded-lg border border-border/70 bg-card/60 p-3">
                    <p className="text-xs text-muted-foreground">Loan amount</p>
                    <p className="text-sm font-semibold text-foreground">
                      {Number.isFinite(adjustment.loanAmount)
                        ? `$${adjustment.loanAmount.toLocaleString()}`
                        : "–"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : null}

          {sanitizedReport ? (
            <div className="rounded-xl border border-border/60 bg-foreground/[0.02]">
              <div className="border-b border-border/60 bg-secondary/40 px-4 py-3 flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Key findings</p>
                  <p className="text-sm text-foreground/90">
                    {claimVsReality}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {sourceUrl ? (
                    <a
                      className="text-primary text-sm underline inline-flex items-center gap-1"
                      href={sourceUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
                      View source
                    </a>
                  ) : null}
                  {!sourceUrl && datasetUrl ? (
                    <a
                      className="text-primary text-sm underline inline-flex items-center gap-1"
                      href={datasetUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
                      View raw dataset
                    </a>
                  ) : null}
                </div>
              </div>
              <div className="grid gap-3 px-4 py-3 text-sm">
                <div className="flex flex-wrap gap-3">
                  <span className="pill bg-muted text-muted-foreground border border-border/60">
                    Risk score: {formatPct(sanitizedReport.risk_score ?? sanitizedReport.riskScore ?? sanitizedReport.risk ?? 0)}
                  </span>
                  {Number.isFinite(sanitizedReport.claims_found) && (
                    <span className="pill bg-muted text-muted-foreground border border-border/60">
                      Claims: {sanitizedReport.claims_found}
                    </span>
                  )}
                  {Number.isFinite(sanitizedReport.contradictions_found) && (
                    <span className="pill bg-muted text-muted-foreground border border-border/60">
                      Contradictions: {sanitizedReport.contradictions_found}
                    </span>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="rounded-lg border border-border/60 bg-card/60 p-3">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Claim (what was said)</p>
                    <p className="text-foreground">{claim}</p>
                  </div>
                  <div className="rounded-lg border border-border/60 bg-card/60 p-3">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Reality (what we found)</p>
                    <p className="text-foreground">{reality}</p>
                    {evidenceUrl ? (
                      <div className="mt-2">
                        <a
                          className="inline-flex items-center gap-1 text-sm text-primary underline"
                          href={evidenceUrl}
                          target="_blank"
                          rel="noreferrer"
                        >
                          🔗 View source evidence
                        </a>
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>

              <button
                className="flex w-full items-center justify-between border-t border-border/60 bg-secondary/40 px-4 py-3 text-sm font-semibold text-foreground hover:bg-secondary/60 transition"
                onClick={() => setShowRaw((v) => !v)}
              >
                <span>Raw analysis data</span>
                <span className="text-xs text-muted-foreground">{showRaw ? "Hide" : "Show"}</span>
              </button>
              {showRaw ? (
                <pre className="max-h-[380px] overflow-auto px-4 py-3 text-xs text-foreground/90">
                  {JSON.stringify(sanitizedReport, null, 2)}
                </pre>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default AuditResults;

