# Інтеграція з Grafana — варіанти

## Варіант A (рекомендований з k6): k6 → InfluxDB → Grafana
**Як працює**
- k6 стрімить метрики в InfluxDB.
- Grafana підключається до InfluxDB як datasource.
- Можна імпортувати готові dashboards і додати свої метрики.

**Чому це зручно**
- Найпростіший і найпоширеніший шлях для k6.

---

## Варіант B: k6 → Prometheus Remote Write → Grafana
**Як працює**
- k6 відправляє метрики по протоколу Prometheus remote write (зазвичай через output extension).
- Grafana читає з Prometheus або сумісного бекенду (Mimir/VictoriaMetrics).

**Коли варто**
- Якщо у вас інфраструктура “Prometheus-first”.

---

## Варіант C: Gatling/JMeter → InfluxDB/Graphite → Grafana
- Стандартний шлях для багатьох enterprise-стеків.
- Працює добре для тайм-серій метрик (latency, throughput, errors).

---

## Важливе про "репорти на основі response body"
Grafana ідеальна для **time-series метрик**:
- latency (p95/p99)
- error rate
- RPS/throughput
- VUs/iterations
- кастомні counters/trends

Але твоя вимога включає: **формування додаткового звіту залежно від вмісту body**.

Найкраща практика:
1) Під час тесту витягувати з body тільки потрібні доменні поля.
2) Перетворити їх у **custom metrics** (для Grafana).
3) Паралельно згенерувати **окремий артефакт** (JSON/HTML/MD) після тесту (або при помилках).

Тобто: Grafana = дашборди, а “body-driven report” = окремий файл(и).
