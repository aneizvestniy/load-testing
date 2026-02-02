# Run k6 example (selections report)

## Requirements
- k6 installed (Grafana k6)

## Environment variables
- `TARGET_URL` (required)
- `METHOD` (optional: GET/POST/PUT)
- `REQUEST_BODY` (optional: for POST/PUT)
- `AUTH_HEADER` (optional: e.g. `Bearer <token>`)
- `TIMEOUT` (optional, default `30s`)
- `SLEEP_MS` (optional: pacing between iterations)

## Run
```bash
TARGET_URL='https://api.example.com/search' \
METHOD='GET' \
k6 run load-testing/examples/k6/script_selections_report.js
```

If you need POST:
```bash
TARGET_URL='https://api.example.com/search' \
METHOD='POST' \
REQUEST_BODY='{"query":"test"}' \
k6 run load-testing/examples/k6/script_selections_report.js
```

## Outputs
The script writes:
- `custom-report.json`
- `custom-report.md`

And prints a short markdown summary to stdout.

## Notes about logging
- The script prints warning logs only when:
  - status is not 2xx OR
  - `selections.length === 0`
- It logs only a **500-char body sample** to avoid huge logs.
