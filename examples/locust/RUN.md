# Run Locust example (selections-based report)

## Install
```bash
pip install locust
```

## Configure
Environment variables:
- `HOST` (required) — base URL, e.g. `http://10.0.0.10`
- `TARGET_PATH` (optional) — path, default `/`
- `AUTH_HEADER` (optional) — e.g. `Bearer <token>`
- `REQUEST_TIMEOUT_S` (optional) — default `30`
- `WAIT_S` (optional) — default `0` (no pacing)
- `REPORT_PATH` (optional) — default `locust-custom-report.json`

## Run (headless)
Example for ~60 RPS:
```bash
HOST='http://10.0.0.10' \
TARGET_PATH='/api/search' \
locust -f load-testing/examples/locust/locustfile_selections.py \
  --headless \
  -u 100 \
  -r 20 \
  --run-time 5m \
  --stop-timeout 30
```

Example for ~600 RPS:
```bash
HOST='http://10.0.0.10' \
TARGET_PATH='/api/search' \
locust -f load-testing/examples/locust/locustfile_selections.py \
  --headless \
  -u 1000 \
  -r 200 \
  --run-time 5m \
  --stop-timeout 30
```

## Notes about “RPS control”
Locust controls concurrency (users) and spawn rate. Actual RPS depends on:
- response latency
- server behavior
- user wait time (`WAIT_S`)

If you must hit an exact RPS, k6 arrival-rate executor is usually easier.

## Output
At the end it writes a small JSON report (single-process run):
- `locust-custom-report.json` (or `REPORT_PATH`)

It contains:
- selection_rate_percent
- avg_response_time_ms
- json_parse_failures
