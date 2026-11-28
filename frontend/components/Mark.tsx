/** Brand mark: a leaf (سبز) whose midrib is a rising trend line. */
export default function Mark({ size = 34 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
      <rect width="64" height="64" rx="16" fill="var(--brand)" />
      <path d="M16 47C13 28 25 14 49 15c1 22-12 34-33 32Z" fill="var(--brand-ink)" />
      <path d="M20 44 41 22" stroke="var(--accent-bright)" strokeWidth="4.4" strokeLinecap="round" />
      <circle cx="41" cy="22" r="3.4" fill="var(--accent-bright)" />
    </svg>
  );
}
