"use client";

import { setKeySnippets } from "@/lib/developers/snippets";
import { usePlatform } from "@/lib/developers/usePlatform";
import PlatformTabs from "./PlatformTabs";
import Snippets from "./Snippets";

/**
 * "Set your API key", per platform. `apiKey`, when given, is a key the user
 * just generated or rotated: held in memory only (never stored), shown once.
 * `tabs={false}` when the page already shows the shared platform tabs.
 */
export default function SetKeyTabs({ apiKey, tabs = true }: { apiKey?: string | null; tabs?: boolean }) {
  const [platform] = usePlatform();
  return (
    <div className="flex flex-col gap-3">
      {tabs && <PlatformTabs />}
      <Snippets items={setKeySnippets(platform, apiKey || undefined)} />
      {apiKey && (
        <p className="text-xs text-amber-700">
          These commands contain your real key. It is shown only now and isn&apos;t stored on this site.
        </p>
      )}
    </div>
  );
}
