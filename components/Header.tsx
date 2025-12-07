import LeafIcon from "./LeafIcon";

type HeaderProps = {
  onHowItWorks?: () => void;
  onWhyNotGPT?: () => void;
  onWhoIsThisFor?: () => void;
};

const Header = ({ onHowItWorks, onWhyNotGPT, onWhoIsThisFor }: HeaderProps) => (
  <header className="w-full border-b border-border/60 bg-card/70 backdrop-blur-md sticky top-0 z-20">
    <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-4">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
          <LeafIcon size={22} />
        </div>
        <div>
          <p className="text-lg font-semibold text-foreground leading-tight">Eco-Sentinel</p>
          <p className="text-xs text-muted-foreground">ESG Risk Detection</p>
        </div>
      </div>

      <nav className="hidden items-center gap-4 text-sm font-medium text-muted-foreground md:flex">
        <button
          type="button"
          onClick={onWhoIsThisFor}
          className="rounded-lg px-3 py-2 transition-colors hover:text-foreground hover:bg-muted"
        >
          Who is this for?
        </button>
        <button
          type="button"
          onClick={onHowItWorks}
          className="rounded-lg px-3 py-2 transition-colors hover:text-foreground hover:bg-muted"
        >
          How it works
        </button>
        <button
          type="button"
          onClick={onWhyNotGPT}
          className="rounded-lg px-3 py-2 transition-colors hover:text-foreground hover:bg-muted"
        >
          Why Not GPT/Gemini?
        </button>
      </nav>
    </div>
  </header>
);

export default Header;

