export function SkebIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <rect width="24" height="24" rx="6" fill="#00BFA5" />
      {/* スケッチブック本体 */}
      <rect
        x="5"
        y="5"
        width="14"
        height="16"
        rx="1"
        stroke="white"
        strokeWidth="1.5"
      />
      {/* スパイラル綴じ（上部） */}
      <line x1="5" y1="8" x2="19" y2="8" stroke="white" strokeWidth="1.5" />
      {/* スパイラルリング */}
      <circle
        cx="8"
        cy="8"
        r="1"
        fill="#00BFA5"
        stroke="white"
        strokeWidth="1"
      />
      <circle
        cx="12"
        cy="8"
        r="1"
        fill="#00BFA5"
        stroke="white"
        strokeWidth="1"
      />
      <circle
        cx="16"
        cy="8"
        r="1"
        fill="#00BFA5"
        stroke="white"
        strokeWidth="1"
      />
      {/* ページの罫線 */}
      <line
        x1="8"
        y1="12"
        x2="16"
        y2="12"
        stroke="white"
        strokeWidth="1"
        strokeLinecap="round"
      />
      <line
        x1="8"
        y1="15"
        x2="16"
        y2="15"
        stroke="white"
        strokeWidth="1"
        strokeLinecap="round"
      />
      <line
        x1="8"
        y1="18"
        x2="13"
        y2="18"
        stroke="white"
        strokeWidth="1"
        strokeLinecap="round"
      />
    </svg>
  );
}
