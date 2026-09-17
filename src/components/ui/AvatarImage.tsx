"use client";

// Square avatar image that degrades instead of breaking.
//
// Tries `src` first (a user's uploaded/social picture), falls back to
// `fallbackSrc` (normally the generated pixelbot avatar), and finally renders
// initials if neither loads.

import { useState } from "react";

type Props = {
  src?: string | null;
  fallbackSrc?: string | null;
  initials: string;
  alt: string;
  size: number;
  className?: string;
};

export default function AvatarImage({
  src,
  fallbackSrc,
  initials,
  alt,
  size,
  className,
}: Props) {
  const candidates = [src, fallbackSrc].filter(
    (candidate): candidate is string =>
      typeof candidate === "string" && candidate.trim().length > 0,
  );

  const [attempt, setAttempt] = useState(0);

  const sourceKey = `${src ?? ""}|${fallbackSrc ?? ""}`;
  const [prevSourceKey, setPrevSourceKey] = useState(sourceKey);
  if (sourceKey !== prevSourceKey) {
    setPrevSourceKey(sourceKey);
    setAttempt(0);
  }

  const current = candidates[attempt];

  return (
    <span
      className={`relative flex items-center justify-center overflow-hidden default-radius border border-gray-200 bg-gray-100 ${
        className ?? ""
      }`}
      style={{ width: size, height: size }}
    >
      {current ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={current}
          src={current}
          alt={alt}
          className="h-full w-full object-cover"
          onError={() => setAttempt((n) => n + 1)}
        />
      ) : (
        <span
          className="font-semibold text-gray-300 select-none"
          style={{ fontSize: Math.max(11, Math.round(size * 0.36)) }}
          aria-label={alt || undefined}
          aria-hidden={alt ? undefined : true}
        >
          {initials}
        </span>
      )}
    </span>
  );
}
