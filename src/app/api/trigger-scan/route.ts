import { NextRequest, NextResponse } from "next/server";

const TRIGGER_URL = "https://des-bottle-package-classifieds.trycloudflare.com";
const STATUS_URL = `${TRIGGER_URL}/status`;
const SCAN_URL = `${TRIGGER_URL}/trigger-scan`;

export async function POST(request: NextRequest) {
  try {
    let body: any = {};
    try { body = await request.json(); } catch { body = {}; }

    const endpoint = body.reset ? STATUS_URL : SCAN_URL;
    const method = body.reset ? "POST" : "POST";
    const payload = body.reset ? JSON.stringify({ reset: true }) : JSON.stringify({});

    const res = await fetch(endpoint, {
      method,
      headers: { "Content-Type": "application/json" },
      body: method === "POST" ? payload : undefined,
      signal: AbortSignal.timeout(15000),
    });

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({
      ok: false,
      error: error?.message || "Failed to reach trigger server",
    }, { status: 502 });
  }
}

export async function GET() {
  try {
    const res = await fetch(STATUS_URL, { signal: AbortSignal.timeout(5000) });
    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({
      requested: false,
      error: "trigger_server_unreachable",
    });
  }
}
