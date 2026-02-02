# Grafana integration options

## Option A (recommended with k6): k6 → InfluxDB → Grafana
**How it works**
- k6 streams metrics to InfluxDB.
- Grafana uses InfluxDB datasource.
- You can import ready dashboards and extend them with your own custom metrics.

**Why it fits**
- Easiest setup and most common “k6 + Grafana” workflow.

## Option B: k6 → Prometheus Remote Write → Grafana
**How it works**
- k6 sends metrics via Prometheus remote write (needs k6 output extension).
- Grafana queries Prometheus (or compatible backend: Mimir/VictoriaMetrics).

**Why it fits**
- If your stack is already Prometheus-first.

## Option C: Gatling/JMeter → InfluxDB/Graphite → Grafana
- Works well for time-series metrics and standard dashboards.
- More config-heavy, but common in enterprise stacks.

## Important note about “response body based reports”
Grafana is great for **time-series metrics** (latency, error rates, throughput, custom counters/trends).
But your requirement also includes **domain-specific report content based on response bodies**.

Best practice:
1) Extract fields from response body during test.
2) Convert them into **custom metrics** (counters/trends) for Grafana.
3) Additionally write a **separate artefact report** (JSON/HTML/CSV) at end of test (or on failures).

So: Grafana for dashboards + separate report for deep domain insights.
