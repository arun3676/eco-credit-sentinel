import LeafIcon from "./LeafIcon";

type LeafSpinnerProps = {
  size?: "sm" | "md" | "lg";
  message?: string;
};

const LeafSpinner = ({ size = "md", message }: LeafSpinnerProps) => {
  const dim = size === "lg" ? "w-12 h-12" : size === "sm" ? "w-7 h-7" : "w-9 h-9";
  return (
    <div className="flex items-center gap-3 text-muted-foreground">
      <div className={`relative ${dim}`}>
        <div className="absolute inset-0 rounded-full border-2 border-primary/25 animate-pulse" />
        <LeafIcon className="text-primary animate-spin-slow absolute inset-1" size={28} />
      </div>
      {message ? <p className="text-sm font-medium">{message}</p> : null}
    </div>
  );
};

export default LeafSpinner;

