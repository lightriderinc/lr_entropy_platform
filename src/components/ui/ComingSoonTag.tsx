/** "Coming soon" tag, styled like the cloud platform's backend cards. */
export default function ComingSoonTag({ className = "" }: { className?: string }) {
  return (
    <span
      className={`inline-block w-fit whitespace-nowrap rounded px-2 py-0.5 text-xs font-medium text-white ${className}`}
      style={{ backgroundColor: "var(--brand-tertiary)" }}
    >
      Coming soon
    </span>
  );
}
