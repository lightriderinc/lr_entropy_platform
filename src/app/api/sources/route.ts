import { NextResponse } from "next/server";
import { getSources } from "@/lib/sources/ems";

export async function GET() {
  return NextResponse.json(await getSources());
}
