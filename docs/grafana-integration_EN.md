# Grafana integration — options

## Option A (recommended with k6): k6 → InfluxDB → Grafana
**How it works**
- k6 streams metrics to InfluxDB.
- Grafana connects to InfluxDB as a datasource.
- You can import ready dashboards and extend them with custom metrics.

**Why it fits**
- The simplest and most common k6 + Grafana workflow.

---

## Option B: k6 → Prometheus Remote Write → Grafana
**How it works**
- k6 sends metrics via Prometheus remote write (typically via an output extension).
- Grafana queries Prometheus or a compatible backend (Mimir/VictoriaMetrics).

**When it fits**
- If your infrastructure is Prometheus-first.

---

## Option C: Gatling/JMeter → InfluxDB/Graphite → Grafana
- Common in enterprise stacks.
- Great for time-series metrics (latency, throughput, errors).

---

## Important note about “response body driven reports”
Grafana is great for **time-series metrics**:
- latency percentiles (p95/p99)
- error rates
- throughput/RPS
- VUs/iterations
- custom counters/trends

But your requirement also includes a **domain-specific report** based on response body content.

Best practice:
1) Extract only required fields from the response body during the test.
2) Convert them into **custom metrics** for Grafana.
3) Additionally generate a **separate report artifact** (JSON/HTML/MD) at the end of the test (or on failures).

So: Grafana for dashboards + separate artifacts for deep domain insights.
