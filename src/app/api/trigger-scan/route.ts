import { NextRequest, NextResponse } from "next/server";

const OWNER = "rekwest85";
const REPO = "mtg-investment-portal";
const PATH = "scan_trigger.json";
const BRANCH = "main";
const API = `https://api.github.com/repos/${OWNER}/${REPO}/contents/${PATH}`;

async function getCurrentSha(): Promise<string | null> {
  try {
    const res = await fetch(`${API}?ref=${BRANCH}`, {
      headers: { "User-Agent": "MTG-Portal/1.0", "Accept": "application/vnd.github.v3+json" },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.sha || null;
  } catch { return null; }
}

async function updateTriggerFile(requested: boolean): Promise<boolean> {
  const sha = await getCurrentSha();
  const content = JSON.stringify({
    requested,
    requested_at: requested ? new Date().toISOString() : null,
    completed_at: requested ? null : new Date().toISOString(),
  });
  const body: any = {
    message: requested ? "🔍 Scan requested via portal" : "✅ Scan completed (reset trigger)",
    content: Buffer.from(content).toString("base64"),
    branch: BRANCH,
  };
  if (sha) body.sha = sha;

  try {
    const res = await fetch(API, {
      method: "PUT",
      headers: {
        "User-Agent": "MTG-Portal/1.0",
        "Accept": "application/vnd.github.v3+json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
    return res.ok;
  } catch { return false; }
}

export async function POST(request: NextRequest) {
  try {
    let body: any = {};
    try { body = await request.json(); } catch { body = {}; }

    if (body.reset) {
      const ok = await updateTriggerFile(false);
      return NextResponse.json({
        ok,
        message: ok ? "Trigger reset." : "Failed to reset trigger (rate limit?)",
      });
    }

    const ok = await updateTriggerFile(true);
    return NextResponse.json({
      ok,
      message: ok
        ? "✅ Scan queued! Hermes will pick it up within ~2 minutes."
        : "❌ Failed to trigger scan (GitHub rate limit?). Try again in a minute.",
      requested_at: new Date().toISOString(),
    });
  } catch (error: any) {
    return NextResponse.json({
      ok: false,
      error: error?.message || "Unknown error",
    }, { status: 500 });
  }
}

export async function GET() {
  try {
    const sha = await getCurrentSha();
    const res = await fetch(`${API}?ref=${BRANCH}`, {
      headers: {
        "User-Agent": "MTG-Portal/1.0",
        "Accept": "application/vnd.github.v3+json",
      },
    });
    if (!res.ok) return NextResponse.json({ requested: false, error: "not_found" });

    const data = await res.json();
    const decoded = JSON.parse(Buffer.from(data.content, "base64").toString());
    return NextResponse.json(decoded);
  } catch {
    return NextResponse.json({ requested: false, error: "fetch_failed" });
  }
}
