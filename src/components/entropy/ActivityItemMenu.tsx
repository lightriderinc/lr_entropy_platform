"use client";

import { useEffect, useRef, useState } from "react";
import { MdMoreVert, MdOutlineDelete } from "react-icons/md";

export default function ActivityItemMenu({ onDelete }: { onDelete: () => void }) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Item actions"
        onClick={() => setOpen((value) => !value)}
        className="flex h-7 w-7 cursor-pointer items-center justify-center default-radius text-gray-500 transition-colors hover:bg-white hover:text-gray-700"
      >
        <MdMoreVert className="text-lg" />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full z-10 mt-1 w-36 default-radius border border-gray-100 bg-white p-1 shadow-lg"
        >
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              onDelete();
            }}
            className="flex w-full cursor-pointer items-center gap-2 default-radius px-2.5 py-1.5 text-left text-xs font-medium text-red-600 transition-colors hover:bg-red-50"
          >
            <MdOutlineDelete className="text-sm" />
            Delete
          </button>
        </div>
      )}
    </div>
  );
}
