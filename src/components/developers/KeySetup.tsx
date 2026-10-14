"use client";

import { handleSignIn } from "@/app/actions/auth";
import ApiKeyPanel from "@/components/apiKey/ApiKeyPanel";
import { useState } from "react";
import SetKeyTabs from "./SetKeyTabs";

/**
 * Step 1 on /developers. Signed in: manage the key right here; a key just
 * generated or rotated pre-fills the set-key commands (in memory only, shown
 * once). Signed out: the same commands with a placeholder.
 */
export default function KeySetup({ signedIn }: { signedIn: boolean }) {
  const [newKey, setNewKey] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-4">
      {signedIn ? (
        <ApiKeyPanel onNewKey={setNewKey} showSetKey={false} />
      ) : (
        <p>
          <button type="button" onClick={() => handleSignIn()} className="brand-link cursor-pointer">
            Sign in
          </button>{" "}
          to generate your key here (or under Settings → API key).
        </p>
      )}
      <div>
        <p className="mb-2">
          {newKey
            ? "Your new key is filled in below. Run one of these once:"
            : "Then set it once, so every command below works as-is:"}
        </p>
        <SetKeyTabs apiKey={newKey} />
      </div>
    </div>
  );
}
