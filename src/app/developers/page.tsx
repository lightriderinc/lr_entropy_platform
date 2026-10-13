import InfoBox from "@/components/InfoBox";
import CopyButton from "@/components/ui/CopyButton";
import Link from "next/link";

export const metadata = { title: "Developers" };

function Code({ code }: { code: string }) {
  return (
    <div className="relative mt-2 default-radius bg-gray-900">
      <div className="absolute right-2 top-2 default-radius bg-white">
        <CopyButton value={code} label={null} />
      </div>
      <pre className="overflow-x-auto p-4 pr-14 font-mono text-xs leading-relaxed text-gray-100">{code}</pre>
    </div>
  );
}

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <section className="default-radius border border-gray-50 bg-gray-50 p-5">
      <h2 className="text-lg font-semibold text-gray-800">
        <span className="mr-2 text-[var(--brand-primary)]">{n}.</span>
        {title}
      </h2>
      <div className="mt-2 text-sm text-gray-600">{children}</div>
    </section>
  );
}

/** Public quickstart for the developer API. */
export default function DevelopersPage() {
  const base = (process.env.NEXT_BASE_URL || "https://<this-site>").replace(/\/$/, "");

  const curlSources = `curl -s ${base}/api/v1/sources \\
  -H "Authorization: Bearer $LR_ENTROPY_KEY"`;

  const curlDraw = `curl -s ${base}/api/v1/entropy \\
  -H "Authorization: Bearer $LR_ENTROPY_KEY" \\
  -H "Content-Type: application/json" \\
  -H "Idempotency-Key: $(uuidgen)" \\
  -d '{"bytes": 32, "mode": "source", "id": "anu_aws_001"}'`;

  const curlCustom = `curl -s ${base}/api/v1/entropy \\
  -H "Authorization: Bearer $LR_ENTROPY_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"bytes": 64, "mode": "custom", "ids": ["anu_aws_001", "cisco_qrng_001"]}'`;

  const python = `import json, os, uuid, requests
from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PublicKey

BASE = "${base}"
KEY = os.environ["LR_ENTROPY_KEY"]

r = requests.post(
    f"{BASE}/api/v1/entropy",
    headers={"Authorization": f"Bearer {KEY}", "Idempotency-Key": str(uuid.uuid4())},
    json={"bytes": 32, "mode": "source", "id": "anu_aws_001"},
    timeout=60,
)
r.raise_for_status()
data = r.json()
random_bytes = bytes.fromhex(data["bytes_hex"])

# Verify the signed receipt: Ed25519 over every field except "signature",
# keys sorted, no spaces.
pub = requests.get(f"{BASE}/api/v1/public-key", timeout=30).json()["public_key_hex"]
receipt = dict(data["receipt"])
signature = bytes.fromhex(receipt.pop("signature"))
canonical = json.dumps(receipt, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode()
Ed25519PublicKey.from_public_bytes(bytes.fromhex(pub)).verify(signature, canonical)  # raises if tampered
print(receipt["contributing_sources"], receipt["request_id"])`;

  return (
    <div className="animate-fade-in-up flex max-w-4xl flex-col gap-4 pb-12">
      <div>
        <h1 className="text-2xl font-semibold text-gray-700">Developers</h1>
        <p className="mt-1 text-sm text-gray-600">
          Draw entropy from quantum sources in your own code, with a signed receipt for every request.
        </p>
      </div>

      <InfoBox>
        An alternative entropy source with verifiable provenance: each response says exactly which source produced the
        bytes, and EMS signs that statement. It is not a claim that quantum randomness is better than a good classical
        generator.
      </InfoBox>

      <Step n={1} title="Get your Light Rider API key">
        Use your account&apos;s Light Rider API key (<code className="font-mono">lr_live_...</code>), the same key as on
        Light Rider Cloud. Create or rotate it under{" "}
        <Link href="/settings/api-keys" className="font-medium text-blue-600 underline hover:text-[var(--brand-primary)]">
          Settings → API key
        </Link>
        . It is shown once; store it as a secret (for example <code className="font-mono">LR_ENTROPY_KEY</code>). Draws
        are paid from your Light Rider credits, the same as on the website:{" "}
        <span className="font-medium">1 token per 256 bytes</span> (minimum 1), charged before the draw and refunded if
        nothing is delivered.
        <p className="mt-2 default-radius border border-amber-200 bg-amber-50 p-2 text-amber-800">
          This is your account&apos;s <span className="font-semibold">full-access</span> key: anyone holding it can also
          spend your credits on Light Rider Cloud (QPU jobs, reservations). Keep it out of public code and Spaces, and
          rotate it if it leaks.
        </p>
      </Step>

      <Step n={2} title="See what you can draw from">
        <Code code={curlSources} />
        <p className="mt-2">
          Each source shows whether it is <code className="font-mono">ready</code> or <code className="font-mono">empty</code>{" "}
          (refill pending) and the largest single draw it can serve right now.
        </p>
      </Step>

      <Step n={3} title="Draw bytes">
        <p>From one source:</p>
        <Code code={curlDraw} />
        <p className="mt-3">Or blend 2 to 8 sources into a custom pool:</p>
        <Code code={curlCustom} />
        <p className="mt-3">
          The answer has <code className="font-mono">bytes_hex</code>, <code className="font-mono">billing</code> and the
          signed <code className="font-mono">receipt</code>. Sizes are 1 to 4096 bytes per request. Pools are not offered
          through the API, because they blend in host randomness.
        </p>
      </Step>

      <Step n={4} title="Python, with receipt verification">
        <Code code={python} />
        <p className="mt-2">
          Needs <code className="font-mono">pip install requests cryptography</code>. Fetch any of your receipts again with{" "}
          <code className="font-mono">GET /api/v1/receipts/&lt;request_id&gt;</code>.
        </p>
      </Step>

      <section className="default-radius border border-gray-50 bg-gray-50 p-5 text-sm text-gray-600">
        <h2 className="text-lg font-semibold text-gray-800">Good to know</h2>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>
            <span className="font-medium">Strict by design.</span> If the source you asked for can&apos;t serve, you get an
            error (<code className="font-mono">503 source_empty</code> or <code className="font-mono">source_unavailable</code>)
            and you are not charged. Nothing is ever substituted.
          </li>
          <li>
            <span className="font-medium">Safe retries.</span> Send an <code className="font-mono">Idempotency-Key</code>{" "}
            header. Repeating it never draws or charges twice; it returns <code className="font-mono">409 already_processed</code>{" "}
            with the original receipt. The bytes are returned once and never stored.
          </li>
          <li>
            <span className="font-medium">Limits.</span> 60 requests a minute per key (<code className="font-mono">429</code>{" "}
            with <code className="font-mono">Retry-After</code>). One key per account.
          </li>
          <li>
            <span className="font-medium">Errors</span> are JSON <code className="font-mono">{"{ error, message }"}</code>:{" "}
            <code className="font-mono">401 invalid_api_key</code>, <code className="font-mono">402 insufficient_credits</code>{" "}
            / <code className="font-mono">credits_locked</code>, <code className="font-mono">429 rate_limited</code>,{" "}
            <code className="font-mono">503 source_empty</code>.
          </li>
        </ul>
      </section>
    </div>
  );
}
