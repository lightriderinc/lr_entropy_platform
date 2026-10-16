"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Horizontally scrollable tab list with an underline on the active tab and
 * edge fades when there is more to scroll.
 */
export default function TabBar<T extends string>({
  tabs,
  activeTab,
  onTabChange,
}: {
  tabs: readonly { id: T; label: string }[];
  activeTab: T;
  onTabChange: (tab: T) => void;
}) {
  const tabListRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateScrollFades = useCallback(() => {
    const el = tabListRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 0);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 1);
  }, []);

  useEffect(() => {
    const el = tabListRef.current;
    if (!el) return;

    updateScrollFades();

    const resizeObserver = new ResizeObserver(updateScrollFades);
    resizeObserver.observe(el);

    return () => resizeObserver.disconnect();
  }, [updateScrollFades]);

  const mask = `linear-gradient(to right, ${
    canScrollLeft ? "transparent, black 24px" : "black"
  }, ${canScrollRight ? "black calc(100% - 24px), transparent" : "black"})`;

  return (
    <div
      ref={tabListRef}
      role="tablist"
      onScroll={updateScrollFades}
      className="mb-6 flex gap-1 overflow-x-auto border-b border-gray-100 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      style={{ maskImage: mask, WebkitMaskImage: mask }}
    >
      {tabs.map((t) => (
        <button
          key={t.id}
          type="button"
          role="tab"
          aria-selected={activeTab === t.id}
          onClick={() => onTabChange(t.id)}
          className={`shrink-0 px-4 py-2 text-sm font-medium transition-colors cursor-pointer ${
            activeTab === t.id
              ? "border-b-2 border-[var(--brand-primary)] text-[var(--brand-primary)]"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
