import { NextRequest, NextResponse } from "next/server";

const EMS_EGRESS = process.env.EMS_EGRESS_URL ?? "http://93.127.215.63:7081";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const bytes = parseInt(searchParams.get("bytes") ?? "32", 10);
  const sourceId = searchParams.get("source") ?? "nist-beacon";

  // Map source IDs to EMS policies. Everything uses fastest_available for now
  // since the platform is free to use — no tier restrictions.
  const POLICY_MAP: Record<string, string> = {
    "nist-beacon": "fastest_available",
    "inmetro-beacon": "fastest_available",
    "cisco-qrng": "fastest_available",
    "anu-qrng": "fastest_available",
    rdseed: "fastest_available",
    default: "fastest_available",
  };

  const policy = POLICY_MAP[sourceId] ?? POLICY_MAP.default;

  try {
    const res = await fetch(`${EMS_EGRESS}/v1/entropy/request`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bytes, policy }),
      cache: "no-store",
    });

    const text = await res.text();
    let data: unknown;
    try {
      data = JSON.parse(text);
    } catch {
      data = { message: text };
    }

    console.log("[EMS egress]", res.status, text.slice(0, 120));
    return NextResponse.json(data, { status: res.ok ? 200 : res.status });
  } catch (err) {
    console.error("[EMS egress error]", err);
    return NextResponse.json(
      { message: "Could not reach EMS", error: String(err) },
      { status: 502 }
    );
  }
}