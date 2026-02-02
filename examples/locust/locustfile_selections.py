import json
import os
import time
from statistics import mean

from locust import HttpUser, task, events, constant

# --- Config via env vars ---
TARGET_PATH = os.getenv("TARGET_PATH", "/")
REQUEST_TIMEOUT_S = float(os.getenv("REQUEST_TIMEOUT_S", "30"))

# Optional: headers (e.g., Authorization)
AUTH_HEADER = os.getenv("AUTH_HEADER")

# --- In-memory aggregation (simple, single-process) ---
# Note: if you run distributed locust (master/worker), you should aggregate via Prometheus/Influx/StatsD
# or push a custom report from master by collecting worker stats.

_total_requests = 0
_success_with_selections = 0
_json_parse_failures = 0
_response_times_ms = []


def _headers():
    h = {"Accept": "application/json"}
    if AUTH_HEADER:
        h["Authorization"] = AUTH_HEADER
    return h


class SelectionsUser(HttpUser):
    # constant pacing (optional). For pure throughput, you can set wait_time = constant(0)
    wait_time = constant(float(os.getenv("WAIT_S", "0")))

    @task
    def get_and_check_selections(self):
        global _total_requests, _success_with_selections, _json_parse_failures, _response_times_ms

        start = time.perf_counter()
        # catch_response=True lets us mark failures based on body content
        with self.client.get(
            TARGET_PATH,
            headers=_headers(),
            timeout=REQUEST_TIMEOUT_S,
            catch_response=True,
            name="GET " + TARGET_PATH,
        ) as resp:
            duration_ms = (time.perf_counter() - start) * 1000
            _response_times_ms.append(duration_ms)
            _total_requests += 1

            # Status check
            if resp.status_code < 200 or resp.status_code >= 300:
                resp.failure(f"Non-2xx status: {resp.status_code}")
                return

            # JSON parse + selections check
            try:
                data = resp.json()
            except Exception:
                _json_parse_failures += 1
                sample = (resp.text or "")[:300]
                resp.failure(f"JSON parse failed. Body sample: {sample}")
                return

            selections = data.get("selections")
            ok = isinstance(selections, list) and len(selections) > 0

            if ok:
                _success_with_selections += 1
                resp.success()
            else:
                sample = (resp.text or "")[:300]
                resp.failure(f"No selections (or empty). Body sample: {sample}")


@events.test_stop.add_listener
def on_test_stop(environment, **kwargs):
    """Write a small custom report at the end of the run.

    Notes:
    - Works best for single-process (local) runs.
    - For distributed runs, prefer exporting metrics to Prometheus/Influx and build the report there.
    """
    total = _total_requests
    ok = _success_with_selections

    selection_rate = (ok / total) if total else 0.0
    avg_rt = mean(_response_times_ms) if _response_times_ms else 0.0

    report = {
        "target_path": TARGET_PATH,
        "total_requests": total,
        "ok_with_selections": ok,
        "selection_rate": selection_rate,
        "selection_rate_percent": round(selection_rate * 100, 2),
        "avg_response_time_ms": round(avg_rt, 2),
        "json_parse_failures": _json_parse_failures,
        "note": "For distributed Locust runs, aggregate via time-series backend (Prometheus/Influx) or custom master aggregation.",
    }

    out_path = os.getenv("REPORT_PATH", "locust-custom-report.json")
    try:
        with open(out_path, "w", encoding="utf-8") as f:
            json.dump(report, f, indent=2)
        print(f"Wrote custom report: {out_path}")
    except Exception as e:
        print(f"Failed to write report to {out_path}: {e}")
