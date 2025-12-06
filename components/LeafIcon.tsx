type LeafIconProps = {
  size?: number;
  className?: string;
};

const LeafIcon = ({ size = 20, className = "" }: LeafIconProps) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    width={size}
    height={size}
    className={className}
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M4 14c6 0 11-5 11-11 0 0 5 5 5 11 0 4-3 7-7 7s-9-3-9-7z" />
    <path d="M9 15c2-1 5-4 6-8" />
  </svg>
);

export default LeafIcon;

