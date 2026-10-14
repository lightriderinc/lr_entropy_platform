"use client";

import { useState } from "react";
import CodeBlock from "./CodeBlock";

const PLACEHOLDER = "lr_live_YOUR_KEY";

type Tab = "unix" | "powershell" | "python" | "colab";

const TABS: { id: Tab; label: string }[] = [
  { id: "unix", label: "macOS / Linux" },
  { id: "powershell", label: "Windows PowerShell" },
  { id: "python", label: "Python" },
  { id: "colab", label: "Google Colab" },
];

/**
 * "Set your API key" once, per platform; every later command reads LR_API_KEY.
 * `apiKey`, when given, is a key the user just generated or rotated on this
 * page: it is only ever held in memory here (never stored) and shown once.
 */
export default function SetKeyTabs({ apiKey }: { apiKey?: string | null }) {
  const [tab, setTab] = useState<Tab>("unix");
  const key = apiKey || PLACEHOLDER;

  return (
    <div>
      <div role="tablist" className="flex flex-wrap gap-1 default-radius border border-gray-100 bg-white p-1">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={[
              "flex-1 whitespace-nowrap default-radius px-3 py-1.5 text-xs font-medium cursor-pointer transition-colors",
              tab === t.id ? "bg-brand-primary text-white" : "text-gray-600 hover:bg-gray-100",
            ].join(" ")}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "unix" && (
        <>
          <p className="mt-3 text-sm text-gray-600">For this terminal:</p>
          <CodeBlock code={`export LR_API_KEY="${key}"`} />
          <p className="mt-3 text-sm text-gray-600">
            To keep it in every new terminal (zsh is the macOS default; use <code className="font-mono">~/.bashrc</code>{" "}
            for bash):
          </p>
          <CodeBlock code={`echo 'export LR_API_KEY="${key}"' >> ~/.zshrc`} />
        </>
      )}

      {tab === "powershell" && (
        <>
          <p className="mt-3 text-sm text-gray-600">For this window:</p>
          <CodeBlock code={`$env:LR_API_KEY = "${key}"`} />
          <p className="mt-3 text-sm text-gray-600">To keep it for new windows (takes effect after you reopen PowerShell):</p>
          <CodeBlock code={`setx LR_API_KEY "${key}"`} />
        </>
      )}

      {tab === "python" && (
        <>
          <p className="mt-3 text-sm text-gray-600">
            Put it in a <code className="font-mono">.env</code> file next to your code (and add{" "}
            <code className="font-mono">.env</code> to <code className="font-mono">.gitignore</code>):
          </p>
          <CodeBlock code={`LR_API_KEY=${key}`} />
          <p className="mt-3 text-sm text-gray-600">
            Load it at the top of your script (<code className="font-mono">pip install python-dotenv</code>):
          </p>
          <CodeBlock code={`from dotenv import load_dotenv\nload_dotenv()  # now os.environ["LR_API_KEY"] is set`} />
        </>
      )}

      {tab === "colab" && (
        <>
          <p className="mt-3 text-sm text-gray-600">
            Open the <span className="font-medium">Secrets</span> panel (the key icon in the left sidebar), add a secret
            named <code className="font-mono">LR_API_KEY</code> with this value, and turn on notebook access:
          </p>
          <CodeBlock code={key} />
          <p className="mt-3 text-sm text-gray-600">Then, in your first cell:</p>
          <CodeBlock code={`import os\nfrom google.colab import userdata\nos.environ["LR_API_KEY"] = userdata.get("LR_API_KEY")`} />
        </>
      )}

      {apiKey && (
        <p className="mt-3 text-xs text-amber-700">
          These commands contain your real key. It is shown only now and isn&apos;t stored anywhere on this site; keep
          it out of shared notebooks, repositories and public Spaces.
        </p>
      )}
    </div>
  );
}
