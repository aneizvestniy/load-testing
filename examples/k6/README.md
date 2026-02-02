# k6 examples (plan)

Planned files:
- `script.js` — base scenario + stages
- `custom-metrics.js` — metrics based on response body
- `summary.js` — handleSummary() to produce custom JSON/HTML

Key ideas:
- log only errors or sampled responses (to avoid huge output)
- parse JSON response and build domain metrics
- generate a separate report file for “body-driven insights”
