"use client";

import { useEffect, useRef, useState } from "react";

import AnalysisStatus from "@/components/AnalysisStatus";
import AuditResults from "@/components/AuditResults";
import Header from "@/components/Header";
import LeafSpinner from "@/components/LeafSpinner";

type UploadResponse = { key: string; url: string };
type AuditResponse = { runId: string; status: string };
type Adjustment = {
  rateAdjustment: number;
  newRate: number;
  annualInterestPayment: number;
  financialImpact: number;
  loanAmount: number;
  baseRate: number;
  summary?: string;
};

type StatusResponse =
  | {
      runId: string;
      status: string;
      datasetId?: string;
      report?: any;
      adjustment?: Adjustment;
    }
  | {
      error: string;
      detail?: string;
    };

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [companyName, setCompanyName] = useState("");
  const [loanAmount, setLoanAmount] = useState<string>("");
  const [uploadUrl, setUploadUrl] = useState<string>("");
  const [runId, setRunId] = useState<string>("");
  const [status, setStatus] = useState<string>("Idle");
  const [report, setReport] = useState<Record<string, any> | null>(null);
  const [adjustment, setAdjustment] = useState<Adjustment | null>(null);
  const [error, setError] = useState<string>("");
  const [showHow, setShowHow] = useState(false);
  const [showWhyNotGPT, setShowWhyNotGPT] = useState(false);
  const [showWhoIsThisFor, setShowWhoIsThisFor] = useState(false);
  const [datasetId, setDatasetId] = useState<string>("");

  const pollRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  const handleUpload = async () => {
    try {
      setError("");
      setStatus("Uploading PDF...");
      setUploadUrl("");
      if (!file) {
        setError("Select a PDF first.");
        return;
      }
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: form });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Upload failed");
      }
      const body = (await res.json()) as UploadResponse;
      const url = body.url;
      setUploadUrl(url);
      setStatus("Uploaded. Starting audit...");

      // Auto-trigger audit once upload finishes when inputs are present.
      if (companyName && loanAmount) {
        await handleStartAudit(url);
      } else {
        setStatus("Uploaded. Ready to start audit.");
      }
    } catch (err) {
      console.error("Upload error:", err);
      setError((err as Error).message);
      setStatus("Idle");
    }
  };

  const handleStartAudit = async (fileUrlOverride?: string) => {
    try {
      setError("");
      setReport(null);
      setAdjustment(null);
      setDatasetId("");
      const effectiveUrl = fileUrlOverride || uploadUrl;
      if (!effectiveUrl) throw new Error("Upload a PDF first.");
      if (!companyName) throw new Error("Company name is required.");
      if (!loanAmount) throw new Error("Loan amount is required.");

      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }

      setStatus("Starting audit...");
      const res = await fetch("/api/audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileUrl: effectiveUrl,
          companyName,
          loanAmount: Number(loanAmount),
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Audit start failed");
      }
      const body = (await res.json()) as AuditResponse;
      setRunId(body.runId);
      setStatus(`Audit started (runId: ${body.runId}). Polling...`);
      startPolling(body.runId);
    } catch (err) {
      console.error("Audit start error:", err);
      setError((err as Error).message);
      setStatus("Idle");
    }
  };

  const startPolling = (id: string) => {
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch("/api/status", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            runId: id,
            loanAmount: Number(loanAmount) || 0,
            baseRate: 0.05,
            companyName: companyName || "Borrower",
          }),
        });
        const body = (await res.json()) as StatusResponse;
        if ("error" in body) {
          throw new Error(body.error);
        }
        setStatus(body.status === "SUCCEEDED" ? "Completed" : `Status: ${body.status}`);

        if (body.status === "SUCCEEDED") {
          if (pollRef.current) clearInterval(pollRef.current);
          setReport(body.report ?? null);
          setAdjustment(body.adjustment ?? null);
          setDatasetId(body.datasetId || "");
          setStatus("Completed");
        }
      } catch (err) {
        console.error("Status polling error:", err);
        setError((err as Error).message);
        if (pollRef.current) clearInterval(pollRef.current);
        setStatus("Idle");
      }
    }, 2000);
  };

  const isProcessing =
    status !== "Idle" &&
    !status.toLowerCase().includes("completed") &&
    !status.toLowerCase().includes("succeeded");

  const formatPct = (val: number | null | undefined, digits = 2) =>
    Number.isFinite(val) ? `${((val as number) * 100).toFixed(digits)}%` : "–";

  return (
    <div className="relative min-h-screen bg-background">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-primary/10 via-transparent to-transparent" />
      <Header 
        onHowItWorks={() => setShowHow(true)} 
        onWhyNotGPT={() => setShowWhyNotGPT(true)}
        onWhoIsThisFor={() => setShowWhoIsThisFor(true)}
      />

      <main className="relative mx-auto flex max-w-5xl flex-col gap-8 px-5 pb-16 pt-10">
        <section className="space-y-3">
          <span className="pill border border-primary/20 bg-primary/10 text-primary">
            Eco-Sentinel · ESG Risk Demo
          </span>
          <h1 className="text-3xl font-bold text-foreground md:text-4xl">
            Detect greenwashing in corporate reports
          </h1>
          <p className="max-w-3xl text-base text-muted-foreground">
            Upload a sustainability report PDF, trigger the audit workflow, and see the risk-based credit
            adjustment with transparent reasoning.
          </p>
        </section>

        <section className="eco-card p-6 md:p-7">
          <div className="grid gap-5 md:grid-cols-2">
            <div className="space-y-2">
              <label className="eco-label">Company Name</label>
              <input
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="eco-input"
                placeholder="Acme Corp"
              />
            </div>
            <div className="space-y-2">
              <label className="eco-label">Loan Amount (USD)</label>
              <input
                type="number"
                value={loanAmount}
                onChange={(e) => setLoanAmount(e.target.value)}
                className="eco-input"
                placeholder="5000000"
              />
            </div>
          </div>

          <div className="mt-6 space-y-2">
            <label className="eco-label">Upload Sustainability Report (PDF)</label>
            <label
              className={`relative flex flex-col gap-2 rounded-xl border-2 border-dashed p-4 transition-all ${
                file
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/60 hover:bg-muted/40"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary">
                    <span className="text-sm font-semibold text-primary">PDF</span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      {file ? file.name : "Choose file or drag and drop"}
                    </p>
                    <p className="text-xs text-muted-foreground">PDF up to 10MB</p>
                  </div>
                </div>
              </div>
              <input
                type="file"
                accept="application/pdf"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                className="absolute inset-0 cursor-pointer opacity-0"
              />
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="status-dot" />
                <span>{uploadUrl ? "Uploaded. Ready to audit." : "Waiting for upload."}</span>
              </div>
            </label>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              onClick={handleUpload}
              className="rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:translate-y-[-1px] hover:shadow-md disabled:cursor-not-allowed disabled:bg-primary/50"
              disabled={!file}
            >
              1) Upload PDF
            </button>
            <button
              onClick={() => handleStartAudit()}
              className="rounded-lg bg-foreground px-4 py-2.5 text-sm font-semibold text-background shadow-sm transition hover:translate-y-[-1px] hover:shadow-md disabled:cursor-not-allowed disabled:bg-foreground/50"
              disabled={!uploadUrl}
            >
              2) Start Audit
            </button>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="status-dot" />
              <span>{status}</span>
            </div>
          </div>

          {error && (
            <div className="mt-4 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          )}
        </section>

        <AnalysisStatus status={status} runId={runId} uploadUrl={uploadUrl} />

        {isProcessing && (
          <div className="flex justify-center">
            <LeafSpinner size="lg" message="Analyzing sustainability claims..." />
          </div>
        )}

        <AuditResults
          adjustment={adjustment}
          report={report}
          status={status}
          datasetId={datasetId}
          uploadUrl={uploadUrl}
        />
      </main>

      <footer className="border-t border-border/60 bg-card/60">
        <div className="mx-auto max-w-5xl px-5 py-5 text-sm text-muted-foreground">
          Eco-Sentinel — Sustainable finance risk assessment
        </div>
      </footer>

      {/* How it works modal */}
      {showHow && (
        <div className="fixed inset-0 z-40 flex items-start justify-center bg-black/55 backdrop-blur-sm px-4 py-10 overflow-y-auto">
          <div className="w-full max-w-2xl overflow-hidden rounded-2xl border border-border bg-card shadow-2xl my-10">
            <div className="flex items-center justify-between gap-3 border-b border-border/70 bg-secondary/60 px-5 py-4">
              <div className="space-y-1">
                <p className="pill border border-primary/20 bg-primary/10 text-primary">How it works</p>
                <h3 className="text-lg font-semibold text-foreground">From upload to result in 5 steps</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowHow(false)}
                className="text-lg text-muted-foreground hover:text-foreground"
                aria-label="Close"
              >
                ×
              </button>
            </div>
            <div className="px-5 py-6 text-sm text-foreground">
              <div className="rounded-xl border border-border/70 bg-muted/40 px-4 py-4 space-y-4">
                <div className="flex items-start gap-3">
                  <span className="pill bg-primary/10 text-primary border border-primary/20 min-w-[2rem] justify-center">1</span>
                  <div className="flex-1">
                    <p className="font-semibold text-foreground mb-1">Secure Data Ingestion</p>
                    <p className="text-muted-foreground">The user uploads the confidential PDF and specifies the company name and loan amount. The frontend immediately secures the file in Apify cloud storage.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="pill bg-primary/10 text-primary border border-primary/20 min-w-[2rem] justify-center">2</span>
                  <div className="flex-1">
                    <p className="font-semibold text-foreground mb-1">Agent Dispatch</p>
                    <p className="text-muted-foreground">We trigger the Python Actor on the Apify Cloud. The Actor is instantly dispatched with the file's secure link, company name, and your loan data.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="pill bg-primary/10 text-primary border border-primary/20 min-w-[2rem] justify-center">3</span>
                  <div className="flex-1">
                    <p className="font-semibold text-foreground mb-1">Forensic Audit & Score</p>
                    <p className="text-muted-foreground">The Actor uses LlamaParse to read the PDF, runs Adversarial Search for scandals, and uses the GPT-4o-mini Auditor to assign a Greenwashing Risk Score.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="pill bg-primary/10 text-primary border border-primary/20 min-w-[2rem] justify-center">4</span>
                  <div className="flex-1">
                    <p className="font-semibold text-foreground mb-1">Credit Adjustment Logic</p>
                    <p className="text-muted-foreground">The final Risk Score is fed directly into our proprietary financial model (the Loan Covenant Logic). This determines if the borrower has met their ESG terms.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="pill bg-primary/10 text-primary border border-primary/20 min-w-[2rem] justify-center">5</span>
                  <div className="flex-1">
                    <p className="font-semibold text-foreground mb-1">Financial Impact Delivered</p>
                    <p className="text-muted-foreground">The system immediately displays the calculated adjustment: showing the Rate Delta (increase or decrease) and the Dollar Impact (penalty or savings) on the loan.</p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-4 mt-6">
                <button
                  type="button"
                  onClick={() => setShowHow(false)}
                  className="rounded-lg border border-border bg-card px-4 py-2 text-sm font-semibold text-foreground hover:border-primary/50 hover:text-primary transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Who is this for modal */}
      {showWhoIsThisFor && (
        <div className="fixed inset-0 z-40 flex items-start justify-center bg-black/55 backdrop-blur-sm px-4 py-10 overflow-y-auto">
          <div className="w-full max-w-2xl overflow-hidden rounded-2xl border border-border bg-card shadow-2xl my-10">
            <div className="flex items-center justify-between gap-3 border-b border-border/70 bg-secondary/60 px-5 py-4">
              <div className="space-y-1">
                <p className="pill border border-primary/20 bg-primary/10 text-primary">Who is this for?</p>
                <h3 className="text-lg font-semibold text-foreground">Two specific users</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowWhoIsThisFor(false)}
                className="text-lg text-muted-foreground hover:text-foreground"
                aria-label="Close"
              >
                ×
              </button>
            </div>
            <div className="px-5 py-6 text-sm text-foreground">
              <div className="rounded-xl border border-border/70 bg-muted/40 px-4 py-4 space-y-4">
                <div className="flex items-start gap-3">
                  <span className="pill bg-primary/10 text-primary border border-primary/20 min-w-[2rem] justify-center">1</span>
                  <div className="flex-1">
                    <p className="font-semibold text-foreground mb-1">Sustainability-Linked Loan (SLL) Officers</p>
                    <p className="text-muted-foreground">Who need to verify covenant targets quarterly to adjust interest rates.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="pill bg-primary/10 text-primary border border-primary/20 min-w-[2rem] justify-center">2</span>
                  <div className="flex-1">
                    <p className="font-semibold text-foreground mb-1">Private Equity Analysts</p>
                    <p className="text-muted-foreground">Who need to screen 50+ potential targets for reputational risks overnight before making a bid.</p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-4 mt-6">
                <button
                  type="button"
                  onClick={() => setShowWhoIsThisFor(false)}
                  className="rounded-lg border border-border bg-card px-4 py-2 text-sm font-semibold text-foreground hover:border-primary/50 hover:text-primary transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Why Not GPT/Gemini modal */}
      {showWhyNotGPT && (
        <div className="fixed inset-0 z-40 flex items-start justify-center bg-black/55 backdrop-blur-sm px-4 py-10 overflow-y-auto">
          <div className="w-full max-w-4xl overflow-hidden rounded-2xl border border-border bg-card shadow-2xl my-10">
            <div className="flex items-center justify-between gap-3 border-b border-border/70 bg-secondary/60 px-5 py-4">
              <div className="space-y-1">
                <p className="pill border border-primary/20 bg-primary/10 text-primary">II</p>
                <h3 className="text-lg font-semibold text-foreground">Why Not GPT/Gemini? (The Specialist Advantage)</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowWhyNotGPT(false)}
                className="text-lg text-muted-foreground hover:text-foreground"
                aria-label="Close"
              >
                ×
              </button>
            </div>
            <div className="px-5 py-6 text-sm text-foreground">
              <div className="rounded-xl border border-border/70 bg-card/70 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border/70 bg-secondary/40">
                        <th className="px-4 py-3 text-left font-semibold text-foreground">Aspect</th>
                        <th className="px-4 py-3 text-left font-semibold text-foreground">Generalist LLM (ChatGPT/Gemini)</th>
                        <th className="px-4 py-3 text-left font-semibold text-primary">Your Eco-Credit Agent (Specialist)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50">
                      <tr className="hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3 font-medium text-foreground">Integrity & Governance</td>
                        <td className="px-4 py-3 text-muted-foreground">Provides a Non-Auditable Chat Log that cannot be verified.</td>
                        <td className="px-4 py-3 text-foreground">Provides an Audit-Ready Log for regulatory compliance and proof.</td>
                      </tr>
                      <tr className="hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3 font-medium text-foreground">Output Reliability</td>
                        <td className="px-4 py-3 text-muted-foreground">Fails at JSON Consistency (unreliable conversational text).</td>
                        <td className="px-4 py-3 text-foreground">Guarantees Pydantic-enforced JSON for data systems.</td>
                      </tr>
                      <tr className="hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3 font-medium text-foreground">Intelligence</td>
                        <td className="px-4 py-3 text-muted-foreground">Relies on Generic Search (cannot be instructed to hunt for fraud).</td>
                        <td className="px-4 py-3 text-foreground">Executes Forensic, Adversarial Search (hunts for fraud/lawsuits).</td>
                      </tr>
                      <tr className="hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3 font-medium text-foreground">Data Ingestion</td>
                        <td className="px-4 py-3 text-muted-foreground">Is blind to visual data and misreads complex tables.</td>
                        <td className="px-4 py-3 text-foreground">Uses Multimodal Parsing to analyze charts and visual lies.</td>
                      </tr>
                      <tr className="hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3 font-medium text-foreground">Scalability</td>
                        <td className="px-4 py-3 text-muted-foreground">Limited to single, manual file uploads in a chat window.</td>
                        <td className="px-4 py-3 text-foreground">Deploys as a Scalable API for high-volume, batch auditing.</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex justify-end pt-4 mt-6">
                <button
                  type="button"
                  onClick={() => setShowWhyNotGPT(false)}
                  className="rounded-lg border border-border bg-card px-4 py-2 text-sm font-semibold text-foreground hover:border-primary/50 hover:text-primary transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
