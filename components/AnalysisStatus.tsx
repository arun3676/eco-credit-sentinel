type AnalysisStatusProps = {
  status: string;
  runId: string;
  uploadUrl: string;
};

const stepCopy = [
  { key: "upload", label: "Upload PDF" },
  { key: "start", label: "Start Audit" },
  { key: "analyze", label: "Analyzing & Polling" },
  { key: "complete", label: "Completed" },
];

const AnalysisStatus = ({ status, runId, uploadUrl }: AnalysisStatusProps) => {
  const normalized = status.toLowerCase();

  // Track milestones by explicit signals instead of substring noise.
  const runStarted = !!runId;
  const completed = normalized.includes("completed") || normalized.includes("succeeded");
  const analyzing =
    normalized.includes("analyz") ||
    normalized.includes("poll") ||
    normalized.includes("starting") ||
    normalized.includes("uploading");

  const doneUpload = !!uploadUrl;

  const stateFor = (key: string) => {
    if (key === "upload") return doneUpload ? "done" : "pending";
    if (key === "start") return completed ? "done" : runStarted ? "done" : doneUpload ? "active" : "pending";
    if (key === "analyze") return completed ? "done" : analyzing ? "active" : runStarted ? "active" : "pending";
    if (key === "complete") return completed ? "done" : runStarted ? "active" : "pending";
    return "pending";
  };

  const stateClass = (state: string) => {
    if (state === "done") return "bg-primary/10 border-primary/30 text-primary";
    if (state === "active") return "bg-accent/10 border-accent/30 text-accent";
    return "bg-muted/60 border-border text-muted-foreground";
  };

  return (
    <div className="eco-card p-5 md:p-6 space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <p className="text-sm font-semibold text-primary">Audit progress</p>
          <h3 className="text-lg font-semibold text-foreground">Pipeline status</h3>
          <p className="text-sm text-muted-foreground">{status || "Idle"}</p>
        </div>
        {runId ? (
          <div className="glass rounded-lg px-4 py-3 text-sm">
            <p className="text-xs uppercase text-muted-foreground tracking-wide">Run ID</p>
            <p className="font-mono text-xs text-foreground break-all">{runId}</p>
          </div>
        ) : null}
      </div>

      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {stepCopy.map((step) => {
          const state = stateFor(step.key);
          return (
            <div
              key={step.key}
              className={`flex items-center gap-3 rounded-lg border px-3 py-3 text-sm ${stateClass(
                state,
              )}`}
            >
              <span
                className={`status-dot ${state === "pending" ? "bg-muted-foreground/40 shadow-none" : ""}`}
              />
              <div className="flex flex-col">
                <span className="font-semibold">{step.label}</span>
                <span className="text-[12px] opacity-80">
                  {state === "done" ? "Done" : state === "active" ? "In progress" : "Waiting"}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AnalysisStatus;

