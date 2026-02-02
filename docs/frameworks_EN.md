# Load testing frameworks — comparison (focus: variable load + detailed logs + custom reports from response body)

## Quick recommendation
**Primary pick: Grafana k6**
- Best fit when you need:
  - easy **load variation** (ramp up/down, stages, arrival-rate)
  - detailed metrics plus custom metrics (including metrics extracted from response bodies)
  - the simplest path to **Grafana** (InfluxDB / Prometheus remote write)
  - **custom end-of-test reports** (JSON/HTML)

**Alternative for “backend-like logic”: Locust (Python)**
- Best when you have complex user flows, lots of conditional logic/state, or very custom reporting based on response bodies.

**When you want UI + huge plugin ecosystem: Apache JMeter**
- Good for teams that prefer GUI-driven configuration and already have JMeter experience.

---

## Evaluation criteria
1) **Load model**: VUs/stages/arrival rate, scenarios, durations.
2) **Logs**: detailed logs (status, latency, headers, response), with volume control.
3) **Custom reporting**: parse response body, compute domain metrics, produce extra reports.
4) **CI/CD**: headless runs, exit codes, artifacts.
5) **Grafana**: real-time dashboards + historical metrics.

---

## 1) Grafana k6 (JavaScript)
### Load variation
- Supports **stages** (ramp up/down), fixed VUs, iterations.
- Has multiple scenario executors, including **arrival-rate** models (RPS-focused).

### Detailed logs
- You can log in code (`console.log`), but you should control volume:
  - log failures
  - sample a small % of successful responses
- HTTP debug flags help for targeted troubleshooting.

### Custom reports from response body
- Read `response.body`, parse JSON, then:
  - add **custom metrics** (Counter/Trend/Rate)
  - generate custom artifacts via `handleSummary(data)`:
    - `report.json`
    - `report.html`
    - any additional files for your domain needs

Practical note:
- Storing every response body for every request is usually not viable at load-test scale.
- Better approach: extract only required fields → aggregate → report.

### Grafana integration
- Easiest: **k6 → InfluxDB → Grafana**.
- Alternative: **k6 → Prometheus remote write → Grafana** (via extension).

**Pros:** modern scripting, strong Grafana ecosystem.
**Cons:** full raw body capture requires sampling/limits.

---

## 2) Locust (Python)
### Load variation
- “Users + spawn rate” model.
- Great for realistic user behavior.

### Detailed logs
- Full control in Python: log responses, store samples, implement your own logging pipeline.

### Custom reports
- Maximum flexibility for domain-specific reports based on response bodies.

### Grafana
- Possible via Prometheus/Influx/StatsD, but requires extra plumbing.

**Pros:** flexibility and complex logic.
**Cons:** more setup for dashboards/metrics.

---

## 3) Apache JMeter
### Load variation
- Many controllers/timers/plugins.

### Logs + reporting
- Can store response bodies but it easily explodes disk usage.
- Body-driven custom reporting is possible (extractors + listeners) but often becomes hard to maintain.

### Grafana
- Typical path: Backend Listener → InfluxDB/Graphite → Grafana.

**Pros:** mature, huge ecosystem.
**Cons:** heavier, config complexity.

---

## 4) Gatling (Scala/Java)
### Load variation
- Strong injection models and performance.

### Reporting
- Good built-in stats; body-driven reporting usually requires more work.

### Grafana
- Common: InfluxDB/Graphite or Prometheus.

**Pros:** great performance.
**Cons:** Scala stack and higher complexity than k6.

---

## Practical choice for “body-driven” extra reports
If your additional report depends on parsing response bodies (domain fields):
1) Start with **k6**: parse body → custom metrics + `handleSummary()` → domain report artifacts.
2) Add **Locust** only if you later need very complex user-state flows.
