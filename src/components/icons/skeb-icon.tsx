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
      <path
        d="M8 9.5C8 8.12 9.12 7 10.5 7H14C15.38 7 16.5 8.12 16.5 9.5C16.5 10.88 15.38 12 14 12H10C8.62 12 7.5 13.12 7.5 14.5C7.5 15.88 8.62 17 10 17H13.5C14.88 17 16 15.88 16 14.5"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}
