"use client";

import {
  createEmptyFilters,
  filterSources,
  type Source,
  type SourceFilterState,
} from "@/lib/sources/filters";
import { useEffect, useState } from "react";
import { MdGridView, MdViewList } from "react-icons/md";
import SourceFilterBar from "./SourceFilterBar";
import SourceGrid from "./SourceGrid";
import SourceList from "./SourceList";

type View = "cards" | "list";

const viewButtonBase =
  "flex h-8 w-8 items-center justify-center default-radius text-lg transition-colors cursor-pointer";
const viewButtonOn = "bg-gray-700 text-white";
const viewButtonOff = "text-gray-500 hover:bg-gray-100";

// sessionStorage-backed so the view choice survives navigating away and back
// within the tab without sticking around forever.
const VIEW_KEY = "lr:sources:view";

function isView(value: string | null): value is View {
  return value === "cards" || value === "list";
}

export default function SourceCatalog({ sources }: { sources: Source[] }) {
  const [view, setView] = useState<View>("cards");
  const [filters, setFilters] = useState<SourceFilterState>(createEmptyFilters);

  // Restore after mount, not in the initializer, so the server-rendered
  // markup and first client render still match.
  useEffect(() => {
    const storedView = sessionStorage.getItem(VIEW_KEY);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (isView(storedView)) setView(storedView);
  }, []);

  function changeView(next: View) {
    setView(next);
    sessionStorage.setItem(VIEW_KEY, next);
  }

  function handleFilterToggle(value: string) {
    setFilters((prev) => {
      const values = new Set(prev.policy);
      if (values.has(value)) {
        values.delete(value);
      } else {
        values.add(value);
      }
      return { policy: values };
    });
  }

  function handleClearFilters() {
    setFilters(createEmptyFilters());
  }

  const filteredSources = filterSources(sources, filters);
  const onlineCount = filteredSources.filter((s) => s.online).length;

  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <p className="text-md text-gray-950">
          {filteredSources.length} Sources, {onlineCount} Online
        </p>

        <div className="flex items-center gap-3">
          <SourceFilterBar
            filters={filters}
            onToggle={handleFilterToggle}
            onClearAll={handleClearFilters}
          />
          <div className="flex items-center gap-1 default-radius border border-gray-100 p-1">
            <button
              type="button"
              aria-label="Card view"
              aria-pressed={view === "cards"}
              onClick={() => changeView("cards")}
              className={[
                viewButtonBase,
                view === "cards" ? viewButtonOn : viewButtonOff,
              ].join(" ")}
            >
              <MdGridView />
            </button>
            <button
              type="button"
              aria-label="List view"
              aria-pressed={view === "list"}
              onClick={() => changeView("list")}
              className={[
                viewButtonBase,
                view === "list" ? viewButtonOn : viewButtonOff,
              ].join(" ")}
            >
              <MdViewList />
            </button>
          </div>
        </div>
      </div>
      
      {filteredSources.length === 0 ? (
        <div className="default-radius border border-dashed border-gray-200 bg-gray-50 p-16 text-center text-sm text-gray-500">
          No sources match the selected filters.
        </div>
      ) : view === "list" ? (
        <SourceList sources={filteredSources} />
      ) : (
        <SourceGrid sources={filteredSources} />
      )}
    </>
  );
}
