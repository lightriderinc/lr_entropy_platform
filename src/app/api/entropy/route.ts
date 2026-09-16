import { NextRequest, NextResponse } from "next/server";

const EMS_EGRESS = process.env.EMS_EGRESS_URL ?? "http://93.127.215.63:7081";

const POOL_TO_POLICY: Record<string, string> = {
  pool_highest_quality: "highest_quality",
  pool_fastest: "fastest_available",
};

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const pool = searchParams.get("pool") ?? "pool_fastest";
  const bytes = parseInt(searchParams.get("bytes") ?? "32", 10);
  const policy = POOL_TO_POLICY[pool] ?? "fastest_available";

  try {
    const res = await fetch(`${EMS_EGRESS}/v1/entropy/request`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bytes, policy }),
      cache: "no-store",
    });

    const text = await res.text();
    console.log("[EMS egress]", res.status, text.slice(0, 120));

    let data: unknown;
    try {
      data = JSON.parse(text);
    } catch {
      data = { message: text };
    }

    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    console.error("[EMS egress error]", err);
    return NextResponse.json(
      { message: "Could not reach EMS", error: String(err) },
      { status: 502 }
    );
  }
}