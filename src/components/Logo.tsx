import Image from "next/image";

/**
 * Light Rider brand lockup — the company mark plus the "LIGHT RIDER" wordmark.
 *
 * Derived from the cloud platform's own lockup (Lightrider-cloud-logo-black.svg)
 * with only the red "CLOUD" product word removed, so the mark and wordmark are
 * byte-for-byte the same artwork at the same proportions as the cloud platform.
 * Rendered at width 191 (= 198.53 viewBox units x 230/239) to match the exact
 * scale the cloud header renders its logo at.
 *
 * When an entropy-specific product word is available, add those paths back in
 * red and widen the viewBox, per the design system's per-product lockup pattern.
 */
export default function Logo({ className = "" }: { className?: string }) {
  return (
    <Image
      src="/lightrider-entropy-logo-black.svg"
      alt="Light Rider"
      width={243}
      height={32}
      priority
      className={className}
    />
  );
}
