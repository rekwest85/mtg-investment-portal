import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/trigger-scan
 * 
 * With {reset: true} — clears the trigger (marks as completed)
 * Without reset — sets the trigger (requests a scan)
 * 
 * GET /api/trigger-scan — returns current trigger status
 */
export async function POST(request: NextRequest) {
  try {
    const fs = require("fs");
    const triggerPath = process.cwd() + "/public/scan_trigger.json";
    let body: any = {};
    try { body = await request.json(); } catch { body = {}; }
    const now = new Date().toISOString();

    if (body.reset) {
      // Reset trigger
      fs.writeFileSync(triggerPath, JSON.stringify({
        requested: false,
        completed_at: now,
        status: "completed",
      }, null, 2));
      return NextResponse.json({ ok: true, message: "Trigger reset.", completed_at: now });
    }

    // Set trigger
    fs.writeFileSync(triggerPath, JSON.stringify({
      requested: true,
      requested_at: now,
      status: "pending",
    }, null, 2));

    return NextResponse.json({
      ok: true,
      message: "Scan requested! Hermes will start within ~2 minutes.",
      requested_at: now,
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
    const fs = require("fs");
    const triggerPath = process.cwd() + "/public/scan_trigger.json";
    if (fs.existsSync(triggerPath)) {
      const data = JSON.parse(fs.readFileSync(triggerPath, "utf-8"));
      return NextResponse.json(data);
    }
    return NextResponse.json({ requested: false });
  } catch {
    return NextResponse.json({ requested: false });
  }
}
