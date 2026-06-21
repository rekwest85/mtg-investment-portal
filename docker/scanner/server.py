"""
MTG Scanner Service — HTTP Trigger Server + Scheduler

Runs the full pipeline on a 6-hour schedule.
Also exposes HTTP endpoints for manual trigger from the portal.
"""
import json, os, subprocess, sys, threading, time, json
from http.server import HTTPServer, BaseHTTPRequestHandler
from datetime import datetime, timezone

DATA_DIR = os.environ.get("DATA_DIR", "/data")
SCRIPTS_DIR = os.environ.get("SCRIPTS_DIR", "/app/scripts")
PORT = int(os.environ.get("PORT", 8899))

# State
scan_running = False
last_scan_time = None
last_status = "never"
pending_trigger = False

def run_pipeline():
    """Run the full scanner pipeline."""
    global scan_running, last_scan_time, last_status
    if scan_running:
        print(f"[{datetime.now(timezone.utc).isoformat()}] Scan already running, skipping")
        return

    scan_running = True
    try:
        print(f"[{datetime.now(timezone.utc).isoformat()}] === Starting pipeline ===")
        os.environ["DATA_DIR"] = DATA_DIR  # ensure child processes see it

        steps = [
            ("📡 Collect", "collect.py", 600),
            ("🧠 Analyze", "analyze.py", 60),
            ("📊 Price History", "history.py", 30),
            ("📈 Meta", "meta.py", 15),
            ("🔍 Scan Stores", "scanner.py", 180),
            ("📬 Deliver to Discord", "deliver.py", 30),
        ]

        for name, script, timeout in steps:
            script_path = os.path.join(SCRIPTS_DIR, script)
            if not os.path.exists(script_path):
                print(f"  ⚠️  {script} not found at {script_path}, skipping")
                continue
            print(f"  {name} ({script})...")
            result = subprocess.run(
                [sys.executable, script_path],
                capture_output=True, text=True, timeout=timeout,
                env={**os.environ}
            )
            if result.returncode != 0:
                print(f"  ❌ {script} FAILED: {result.stderr[-300:] if result.stderr.strip() else result.stdout[-300:]}")
            else:
                last_lines = [l for l in result.stdout.strip().split('\n') if l.strip()][-3:]
                for l in last_lines:
                    print(f"    {l[:200]}")

        last_scan_time = datetime.now(timezone.utc).isoformat()
        last_status = "success"
        print(f"[{datetime.now(timezone.utc).isoformat()}] === Pipeline complete ===")

    except Exception as e:
        last_status = f"error: {str(e)}"
        print(f"[{datetime.now(timezone.utc).isoformat()}] === Pipeline FAILED: {e} ===")
    finally:
        scan_running = False


class Handler(BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path == "/status":
            self.send_json({
                "running": scan_running,
                "last_scan": last_scan_time,
                "last_status": last_status,
                "pending_trigger": pending_trigger,
                "pipeline": "integrated",
            })
        elif self.path == "/health":
            self.send_text("ok")
        else:
            self.send_error(404)

    def do_POST(self):
        global pending_trigger
        if self.path == "/trigger-scan":
            content_len = int(self.headers.get("Content-Length", 0))
            body = self.rfile.read(content_len) if content_len > 0 else b"{}"
            try:
                data = json.loads(body)
            except:
                data = {}

            if data.get("reset"):
                pending_trigger = False
                self.send_json({"ok": True, "message": "Trigger reset"})
                return

            if scan_running:
                self.send_json({"ok": False, "message": "Scan already running"})
                return

            # Run immediately
            thread = threading.Thread(target=run_pipeline, daemon=True)
            thread.start()
            self.send_json({"ok": True, "message": "Scan started"})
        else:
            self.send_error(404)

    def send_json(self, data):
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(json.dumps(data).encode())

    def send_text(self, text):
        self.send_response(200)
        self.send_header("Content-Type", "text/plain")
        self.end_headers()
        self.wfile.write(text.encode())

    def log_message(self, format, *args):
        pass  # quiet

def scheduled_loop():
    """Check time and run pipeline on the 6-hour schedule."""
    while True:
        now = datetime.now(timezone.utc)
        # Run at 00:00, 06:00, 12:00, 18:00 UTC
        run_hours = [0, 6, 12, 18]
        current_hour = now.hour
        current_min = now.minute

        if current_hour in run_hours and current_min == 0:
            print(f"[{now.isoformat()}] Scheduled run triggered")
            run_pipeline()
            time.sleep(120)  # avoid double-triggering

        time.sleep(30)  # check every 30 seconds


if __name__ == "__main__":
    print(f"MTG Scanner Service starting...")
    print(f"  DATA_DIR={DATA_DIR}")
    print(f"  SCRIPTS_DIR={SCRIPTS_DIR}")

    # Verify scripts exist
    script_dir_list = os.listdir(SCRIPTS_DIR) if os.path.exists(SCRIPTS_DIR) else []
    print(f"  Scripts found: {len(script_dir_list)} files")

    # Start scheduler thread
    scheduler = threading.Thread(target=scheduled_loop, daemon=True)
    scheduler.start()

    # Start HTTP server
    server = HTTPServer(("0.0.0.0", PORT), Handler)
    print(f"  HTTP server on port {PORT}")
    print(f"  Endpoints: GET /status, GET /health, POST /trigger-scan")
    print(f"  Ready.")
    server.serve_forever()
