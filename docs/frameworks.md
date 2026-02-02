# Frameworks for load testing — comparison (focus: variable load + detailed logs + custom reporting from response body)

## Quick recommendation (for this project)
**Primary pick: Grafana k6**
- Best fit for: variable load profiles, simple scripting, easy custom metrics from response body, and easiest Grafana story.

**Alternative (when you need “Python-like business logic” and custom per-request reporting): Locust**
- Best fit for: complex user flows, heavy custom logic, and custom reporting pipelines.

**When you need heavy enterprise-style GUI + wide plugin ecosystem: JMeter**
- Best fit for: teams that prefer UI, lots of protocols, and big existing ecosystem.

---

## Evaluation criteria
1) Load model: ramping VUs, arrival rate, scenarios, durations.
2) Logs: request/response logs (headers, status, timing, body sampling).
3) Custom reporting: ability to parse response body, compute domain metrics, export JSON/HTML.
4) CI/CD friendliness: headless runs, exit codes, artifacts.
5) Grafana integration: time-series output + dashboards.

---

## 1) Grafana k6 (JS)
### Load variation
- Supports **stages** (ramp up/down), fixed VUs, iterations, and scenario executors (incl. arrival-rate models).

### Detailed logs
- Per-request logging via `console.log()` (careful: noisy).
- Deep HTTP debug available (`--http-debug` modes). Practical approach: log only failures + sample bodies.

### Custom reports from response body
- You can read `response.body`, parse JSON, extract fields, and write **custom metrics**.
- At end of test, `handleSummary(data)` can generate **custom JSON/HTML** reports.
- If you need real-time shipping of custom metrics: use output extensions.

### Grafana integration
- Strong: k6 outputs to time-series backends (commonly InfluxDB; also Prometheus remote write via extension) which Grafana reads.

**Pros**: modern DX, easy scripting, great Grafana ecosystem.
**Cons**: don’t store full raw response bodies as “standard metrics”; need selective logging/sampling.

---

## 2) Locust (Python)
### Load variation
- Users + spawn rate; also more advanced patterns.

### Detailed logs
- Full control in Python: you can capture responses, store samples, write custom logs.

### Custom reports from response body
- Very flexible: parse response body and generate any custom reporting format.

### Grafana integration
- Not as “out of the box” as k6, but doable: export metrics to Prometheus/Influx/StatsD; or push custom events.

**Pros**: maximum flexibility for custom logic.
**Cons**: Grafana story requires more plumbing; distributed runs require setup.

---

## 3) Apache JMeter
### Load variation
- Rich load models (threads, timers, throughput controllers). GUI helps.

### Detailed logs
- Can log responses (but storing bodies for many requests can explode disk).

### Custom reports from response body
- Possible via extractors (JSON Extractor, regex) + custom listeners; often ends in plugin/config complexity.

### Grafana integration
- Typical path: backend listener to InfluxDB/Graphite, then Grafana dashboards.

**Pros**: mature, huge ecosystem.
**Cons**: heavier, more manual setup; complex custom reporting gets messy.

---

## 4) Gatling (Scala/Java)
### Load variation
- Great load injection models and performance.

### Detailed logs
- Good built-in stats; can add custom logging.

### Custom reports from response body
- You can parse/check responses and create custom metrics, but custom reporting often requires extra work (plugins/enterprise tooling).

### Grafana integration
- Common: push to InfluxDB/Graphite or Prometheus and visualize in Grafana.

**Pros**: strong for performance tests at scale.
**Cons**: heavier stack (Scala); custom report pipeline is more work than k6.

---

## Practical choice for your requirement (body-driven extra reports)
If the “additional report” depends on parsing response body content (domain fields), then:
- **k6**: parse body → custom metrics + `handleSummary()` → output a domain report (JSON/HTML).
- **Locust**: parse body → write any custom artifacts you want.

My suggestion:
1) Start with **k6** as the main tool.
2) If later you hit limits (complex multi-step flows, heavy custom state per user) add **Locust** for those specific scenarios.
