// Every command shown on /developers (and in the API key panel), per platform.
// One source of truth, so the page shows exactly what was tested. No imports:
// the test runner loads this file directly with Node.

export type Platform = "unix" | "powershell" | "python" | "colab";

export const PLATFORMS: { id: Platform; label: string }[] = [
  { id: "unix", label: "macOS / Linux" },
  { id: "powershell", label: "Windows PowerShell" },
  { id: "python", label: "Python" },
  { id: "colab", label: "Google Colab" },
];

export const API_BASE = "https://entropy.lightriderinc.com";
export const KEY_PLACEHOLDER = "lr_live_YOUR_KEY";

/** One copyable block. `runIn` says exactly where it is meant to run. */
export type Snippet = {
  /** Short caption shown above the block. */
  label: string;
  code: string;
  runIn: "bash" | "zsh" | "bash-or-zsh" | "powershell" | "terminal" | "python-file" | "colab-cell";
};

/** Step "Set your API key". */
export function setKeySnippets(platform: Platform, key: string = KEY_PLACEHOLDER): Snippet[] {
  switch (platform) {
    case "unix":
      return [
        { label: "For this terminal", runIn: "bash-or-zsh", code: `export LR_API_KEY="${key}"` },
        { label: "Keep it (zsh, the macOS default)", runIn: "zsh", code: `echo 'export LR_API_KEY="${key}"' >> ~/.zshrc` },
        { label: "Keep it (bash)", runIn: "bash", code: `echo 'export LR_API_KEY="${key}"' >> ~/.bashrc` },
      ];
    case "powershell":
      return [
        { label: "For this window", runIn: "powershell", code: `$env:LR_API_KEY = "${key}"` },
        {
          label: "Keep it (new windows)",
          runIn: "powershell",
          code: `[Environment]::SetEnvironmentVariable("LR_API_KEY", "${key}", "User")`,
        },
      ];
    case "python":
      // The script in the next step asks for the key when LR_API_KEY isn't set.
      return [{ label: "Install (in a terminal)", runIn: "terminal", code: "pip install -U lightrider" }];
    case "colab":
      return [
        { label: "Cell 1: install", runIn: "colab-cell", code: "!pip install -q -U lightrider" },
        {
          label: "Cell 2: your key, from Colab Secrets (key icon, name LR_API_KEY, notebook access on)",
          runIn: "colab-cell",
          code: `import os
from google.colab import userdata

os.environ["LR_API_KEY"] = userdata.get("LR_API_KEY")`,
        },
        {
          label: "Or Cell 2: type it in",
          runIn: "colab-cell",
          code: `import os
from getpass import getpass

os.environ["LR_API_KEY"] = getpass("Light Rider API key: ")`,
        },
      ];
  }
}

const PY_DRAW = `import lightrider as lr

for s in lr.entropy.sources():
    print(s.alias or s.id, s.state, s.bytes_available)

r = lr.entropy.get(32, source="anu")
print(r.hex)
print(r.sources, r.request_id)

pool = lr.entropy.get(64, sources=["anu", "cisco"])
print(pool.sources)

assert lr.entropy.verify(r.receipt)
assert lr.entropy.verify_commitment(r)
print("Receipt verified")`;

const PY_SCRIPT = `import os
from getpass import getpass

if not os.environ.get("LR_API_KEY"):
    os.environ["LR_API_KEY"] = getpass("Light Rider API key: ")

${PY_DRAW}`;

/** Step "Draw entropy". */
export function drawSnippets(platform: Platform): Snippet[] {
  switch (platform) {
    case "unix":
      return [
        {
          label: "List sources",
          runIn: "bash-or-zsh",
          code: `curl -s ${API_BASE}/api/v1/sources -H "Authorization: Bearer $LR_API_KEY"`,
        },
        {
          label: "32 bytes from one source",
          runIn: "bash-or-zsh",
          code: `curl -s ${API_BASE}/api/v1/entropy \\
  -H "Authorization: Bearer $LR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -H "Idempotency-Key: $(uuidgen 2>/dev/null || cat /proc/sys/kernel/random/uuid)" \\
  -d '{"bytes": 32, "mode": "source", "id": "anu"}'`,
        },
        {
          label: "64 bytes blended from several sources",
          runIn: "bash-or-zsh",
          code: `curl -s ${API_BASE}/api/v1/entropy \\
  -H "Authorization: Bearer $LR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -H "Idempotency-Key: $(uuidgen 2>/dev/null || cat /proc/sys/kernel/random/uuid)" \\
  -d '{"bytes": 64, "mode": "custom", "ids": ["anu", "cisco"]}'`,
        },
      ];
    case "powershell":
      return [
        {
          label: "List sources",
          runIn: "powershell",
          code: `(Invoke-RestMethod -Uri ${API_BASE}/api/v1/sources -Headers @{ Authorization = "Bearer $env:LR_API_KEY" }).sources | Format-Table alias, state, bytes_available`,
        },
        {
          label: "32 bytes from one source",
          runIn: "powershell",
          code: `$headers = @{ Authorization = "Bearer $env:LR_API_KEY"; "Idempotency-Key" = [guid]::NewGuid().ToString() }
$body = @{ bytes = 32; mode = "source"; id = "anu" } | ConvertTo-Json
$r = Invoke-RestMethod -Method Post -Uri ${API_BASE}/api/v1/entropy -Headers $headers -ContentType "application/json" -Body $body
$r.bytes_hex
$r.receipt.contributing_sources`,
        },
        {
          label: "64 bytes blended from several sources",
          runIn: "powershell",
          code: `$headers = @{ Authorization = "Bearer $env:LR_API_KEY"; "Idempotency-Key" = [guid]::NewGuid().ToString() }
$body = @{ bytes = 64; mode = "custom"; ids = @("anu", "cisco") } | ConvertTo-Json
$r = Invoke-RestMethod -Method Post -Uri ${API_BASE}/api/v1/entropy -Headers $headers -ContentType "application/json" -Body $body
$r.bytes_hex
$r.receipt.contributing_sources`,
        },
      ];
    case "python":
      return [
        { label: "entropy_demo.py", runIn: "python-file", code: PY_SCRIPT },
        { label: "Run it (in a terminal)", runIn: "terminal", code: "python entropy_demo.py" },
      ];
    case "colab":
      return [
        { label: "Cell 3: draw and verify", runIn: "colab-cell", code: PY_DRAW },
        {
          label: "Optional cell: the same API with curl",
          runIn: "colab-cell",
          code: `%%bash
curl -s ${API_BASE}/api/v1/entropy \\
  -H "Authorization: Bearer $LR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -H "Idempotency-Key: $(python3 -c 'import uuid; print(uuid.uuid4())')" \\
  -d '{"bytes": 32, "mode": "source", "id": "anu"}'`,
        },
      ];
  }
}
