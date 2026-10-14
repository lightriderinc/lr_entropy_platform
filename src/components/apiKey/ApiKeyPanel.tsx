"use client";

import SetKeyTabs from "@/components/developers/SetKeyTabs";
import CopyButton from "@/components/ui/CopyButton";
import LRButton from "@/components/ui/LRButton";
import { useCallback, useEffect, useState } from "react";
import { MdAutorenew, MdDeleteOutline, MdVisibility, MdVisibilityOff } from "react-icons/md";

type KeyInfo = { keyPrefix: string; createdAt: string; lastUsedAt: string | null; rotatedAt: string | null };

async function send(method: "POST" | "DELETE", url: string): Promise<{ key?: string; keyPrefix?: string }> {
  const res = await fetch(url, { method });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message ?? data.error ?? `HTTP ${res.status}`);
  return data;
}

/**
 * The account's ONE Light Rider API key, managed here through cloud: the same
 * key and the same rules as Light Rider Cloud's API Keys page (generate if
 * none, rotate, revoke; the full key shown once). A new key stays only in this
 * component's memory and is passed to `onNewKey` (e.g. to pre-fill the
 * set-key commands); it is never stored.
 */
export default function ApiKeyPanel({
  onNewKey,
  showSetKey = true,
}: {
  onNewKey?: (key: string | null) => void;
  /** Show the pre-filled set-key commands under a newly revealed key. */
  showSetKey?: boolean;
}) {
  const [info, setInfo] = useState<KeyInfo | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [error, setError] = useState<string | null>(null);
  const [revealedKey, setRevealedKey] = useState<string | null>(null);
  const [visible, setVisible] = useState(false);
  const [confirming, setConfirming] = useState<"rotate" | "revoke" | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    fetch("/api/api-key", { cache: "no-store" })
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.message ?? `HTTP ${res.status}`);
        return data as { apiKey: KeyInfo | null };
      })
      .then((data) => {
        setInfo(data.apiKey);
        setState("ready");
      })
      .catch((err: Error) => {
        setError(err.message);
        setState("error");
      });
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function reveal(key: string | null) {
    setRevealedKey(key);
    setVisible(false);
    onNewKey?.(key);
  }

  async function act(kind: "generate" | "rotate" | "revoke") {
    setBusy(true);
    setError(null);
    try {
      if (kind === "revoke") {
        await send("DELETE", "/api/api-key");
        reveal(null);
      } else {
        const r = await send("POST", kind === "rotate" ? "/api/api-key/rotate" : "/api/api-key");
        if (r.key) reveal(r.key);
      }
      setConfirming(null);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  if (state === "loading") {
    return (
      <div className="animate-pulse default-radius border border-gray-50 bg-gray-50 p-4">
        <div className="h-4 w-48 rounded bg-gray-200" />
        <div className="mt-3 h-3 w-32 rounded bg-gray-200" />
        <div className="mt-4 h-8 w-40 rounded bg-gray-200" />
      </div>
    );
  }
  if (state === "error") {
    return <p className="text-sm text-[var(--brand-primary)]">Your API key couldn&apos;t be loaded: {error}</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      {revealedKey && (
        <div className="default-radius border border-red-100 bg-red-50 p-4">
          <p className="text-sm font-medium text-red-700">Copy your key now: it won&apos;t be shown again.</p>
          <div className="mt-3 flex items-center gap-2 default-radius border border-gray-100 bg-white p-2">
            <code className="min-w-0 flex-1 truncate px-2 py-1 font-mono text-sm text-gray-800">
              {visible ? revealedKey : `lr_${"•".repeat(revealedKey.length - 3)}`}
            </code>
            <LRButton
              type="button"
              variant="secondary-outline"
              onClick={() => setVisible((v) => !v)}
              icon={visible ? <MdVisibilityOff size={16} /> : <MdVisibility size={16} />}
            >
              {visible ? "Hide" : "Reveal"}
            </LRButton>
            <CopyButton value={revealedKey} />
          </div>
          {showSetKey && (
            <div className="mt-4">
              <p className="mb-2 text-sm font-medium text-gray-700">Set it once, then every example just works:</p>
              <SetKeyTabs apiKey={revealedKey} />
            </div>
          )}
        </div>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}

      {!info && (
        <div className="default-radius border border-dashed border-gray-200 bg-gray-50 p-4">
          <p className="mb-3 text-sm text-gray-600">No API key yet. Generate one to call the API from your code.</p>
          <LRButton variant="primary" onClick={() => act("generate")} disabled={busy}>
            {busy ? "Generating…" : "Generate API key"}
          </LRButton>
        </div>
      )}

      {info && (
        <div className="default-radius border border-gray-50 bg-gray-50 p-4">
          <p className="font-mono text-sm text-gray-800">
            {info.keyPrefix}
            {"•".repeat(16)}
          </p>
          <p className="mt-2 text-xs text-gray-500">Created: {new Date(info.createdAt).toLocaleString()}</p>
          <p className="text-xs text-gray-500">
            Last used: {info.lastUsedAt ? new Date(info.lastUsedAt).toLocaleString() : "never"}
          </p>
          {info.rotatedAt && (
            <p className="text-xs text-gray-500">Rotated: {new Date(info.rotatedAt).toLocaleString()}</p>
          )}

          <div className="mt-4 flex flex-wrap items-center gap-2">
            {confirming ? (
              <>
                <span className="text-sm text-gray-600">
                  {confirming === "rotate"
                    ? "This immediately invalidates the current key, here and on Light Rider Cloud."
                    : "This deletes the key entirely, here and on Light Rider Cloud."}
                </span>
                <LRButton type="button" variant="danger-outline" onClick={() => act(confirming)} disabled={busy}>
                  {busy
                    ? confirming === "rotate"
                      ? "Rotating…"
                      : "Revoking…"
                    : confirming === "rotate"
                      ? "Confirm rotate"
                      : "Confirm revoke"}
                </LRButton>
                <LRButton variant="secondary-outline" onClick={() => setConfirming(null)} disabled={busy}>
                  Cancel
                </LRButton>
              </>
            ) : (
              <>
                <LRButton variant="secondary-outline" icon={<MdAutorenew />} onClick={() => setConfirming("rotate")}>
                  Rotate key
                </LRButton>
                <LRButton variant="secondary-outline" icon={<MdDeleteOutline />} onClick={() => setConfirming("revoke")}>
                  Revoke
                </LRButton>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
