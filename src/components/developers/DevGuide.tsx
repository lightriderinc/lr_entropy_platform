"use client";

import { handleSignIn } from "@/app/actions/auth";
import ApiKeyPanel from "@/components/apiKey/ApiKeyPanel";
import { drawSnippets } from "@/lib/developers/snippets";
import { usePlatform } from "@/lib/developers/usePlatform";
import { useState } from "react";
import PlatformTabs from "./PlatformTabs";
import SetKeyTabs from "./SetKeyTabs";
import Snippets from "./Snippets";

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <section className="default-radius border border-gray-50 bg-gray-50 p-5">
      <h2 className="text-lg font-semibold text-gray-800">
        <span className="mr-2 text-[var(--brand-primary)]">{n}.</span>
        {title}
      </h2>
      <div className="mt-3 text-sm text-gray-600">{children}</div>
    </section>
  );
}

const Mono = ({ children }: { children: React.ReactNode }) => <code className="font-mono">{children}</code>;

/** The /developers quickstart: one platform picker drives every step. */
export default function DevGuide({ signedIn, aliases }: { signedIn: boolean; aliases: string[] }) {
  const [platform] = usePlatform();
  const [newKey, setNewKey] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-4">
      <PlatformTabs />

      <Step n={1} title="Get your API key">
        {signedIn ? (
          <ApiKeyPanel onNewKey={setNewKey} showSetKey={false} />
        ) : (
          <p>
            <button type="button" onClick={() => handleSignIn()} className="brand-link cursor-pointer">
              Sign in
            </button>{" "}
            to create your key.
          </p>
        )}
      </Step>

      <Step n={2} title={platform === "python" || platform === "colab" ? "Set up" : "Set your API key"}>
        <SetKeyTabs apiKey={newKey} tabs={false} />
      </Step>

      <Step n={3} title="Draw entropy">
        <Snippets items={drawSnippets(platform)} />
      </Step>

      <section className="default-radius border border-gray-50 bg-gray-50 p-5 text-sm text-gray-600">
        <h2 className="text-lg font-semibold text-gray-800">Good to know</h2>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>
            <span className="font-medium">Price:</span> 1 credit ($0.01) per 256 bytes. A failed draw isn&apos;t charged.
          </li>
          <li>
            <span className="font-medium">Sources:</span>{" "}
            {aliases.map((a, i) => (
              <span key={a}>
                {i > 0 && ", "}
                <Mono>{a}</Mono>
              </span>
            ))}
            , or the full id. Receipts record the full id.
          </li>
          <li>
            <span className="font-medium">Sizes:</span> 1 to 4096 bytes per request. A custom pool blends 2 to 8 sources.
          </li>
          <li>
            <span className="font-medium">No substitutes:</span> if a source can&apos;t serve, you get{" "}
            <Mono>503 source_empty</Mono> and aren&apos;t charged.
          </li>
          <li>
            <span className="font-medium">Safe retries:</span> resending the same <Mono>Idempotency-Key</Mono> never draws or
            charges twice.
          </li>
          <li>
            <span className="font-medium">Limits:</span> 60 requests a minute per key.
          </li>
          <li>
            <span className="font-medium">Your key</span> gives full access to your account. Keep it out of public code.
          </li>
        </ul>
      </section>
    </div>
  );
}
