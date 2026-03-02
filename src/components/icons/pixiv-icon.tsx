export function PixivIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <rect x="0.5" y="0.5" width="23" height="23" rx="5" fill="#0096FA" />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M7.1 4.1C6.21635 4.1 5.5 4.81634 5.5 5.7V19.9H9.4V13.3H11.9C15.4798 13.3 18.4 10.3798 18.4 6.8V5.7C18.4 4.81634 17.6837 4.1 16.8 4.1H7.1ZM11.9 9.7C13.5016 9.7 14.8 8.40163 14.8 6.8C14.8 5.19838 13.5016 3.9 11.9 3.9C10.2984 3.9 9 5.19838 9 6.8C9 8.40163 10.2984 9.7 11.9 9.7Z"
        fill="#FFFFFF"
      />
      <circle cx="11.9" cy="6.8" r="1.65" fill="#0096FA" />
    </svg>
  );
}
