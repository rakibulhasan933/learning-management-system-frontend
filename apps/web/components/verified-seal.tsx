export function VerifiedSeal({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 120 120"
      className={className}
      aria-hidden="true"
    >
      <circle
        cx="60"
        cy="60"
        r="56"
        fill="none"
        stroke="var(--primary)"
        strokeWidth="1.5"
      />
      <circle
        cx="60"
        cy="60"
        r="47"
        fill="none"
        stroke="var(--primary)"
        strokeWidth="1"
        strokeDasharray="2 4"
      />
      <path
        d="M45 61 L55 71 L77 47"
        fill="none"
        stroke="var(--primary)"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <text
        x="60"
        y="24"
        textAnchor="middle"
        fill="var(--primary)"
        fontSize="8.5"
        letterSpacing="3"
        fontFamily="var(--font-mono)"
      >
        VERIFIED
      </text>
      <text
        x="60"
        y="102"
        textAnchor="middle"
        fill="var(--primary)"
        fontSize="8.5"
        letterSpacing="3"
        fontFamily="var(--font-mono)"
      >
        FOLIO
      </text>
    </svg>
  )
}