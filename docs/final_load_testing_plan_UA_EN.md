# Load testing plan (UA + EN) — k6 + Grafana + target RPS calculations

## Українська версія

### 1) Мета тестів
Тестуємо сервіс у внутрішній мережі (LAN) на:
- таймаути / стабільність відповіді
- віддачу даних (чи приходить те, що треба)
- пропускну здатність (чи витримує потрібний обсяг запитів)

Критерій “дані отримані” для кожного запиту:
- відповідь JSON
- у полі `selections` масив має довжину **> 0**

Потрібно:
- порахувати **% запитів**, де `selections.length > 0`
- порахувати **середній час відповіді** (avg response time)
- (опціонально) слідкувати за % таймаутів/помилок

---

### 2) Розрахунок RPS для 5-хвилинного тесту (обраний підхід: середній добовий RPS)
Ми беремо **добовий обсяг** і ділимо на кількість секунд у добі.

Формула:
- **RPS = requests_per_day / 86400**

1) **5 000 000 запитів / день**
- RPS ≈ 5,000,000 / 86,400 ≈ **57.87 RPS** (округлюємо як **58–60 RPS**)
- За 5 хв (300 сек) це буде приблизно **17,400–18,000** запитів

2) **50 000 000 запитів / день**
- RPS ≈ 50,000,000 / 86,400 ≈ **578.70 RPS** (округлюємо як **580–600 RPS**)
- За 5 хв це буде приблизно **174,000–180,000** запитів

Цей підхід підходить, якщо ціль — перевірити стабільність, таймаути й віддачу даних на рівні “середнього навантаження доби”.

---

### 3) Чи підійде k6 для цих RPS?

Для цільових режимів **~58–60 RPS** та **~580–600 RPS**:
- Так, **k6 підходить дуже добре**.
- Це реалістичне навантаження навіть для одного генератора (особливо у внутрішній мережі), якщо:
  - не логувати всі відповіді повністю
  - робити лише потрібний парсинг JSON (`selections.length > 0`)

Висновок:
- **k6 лишаємо як основний інструмент** для цих двох тестів.

---

### 4) Приклад k6 (GET на будь-який URL) + репорт по `selections`

Запускаємо **arrival-rate** сценарій (RPS-орієнтовано), щоб точно тримати заданий RPS.

> Параметри:
> - `TARGET_URL` — куди робимо GET
> - `RATE` — RPS
> - `DURATION` — тривалість тесту

**Скрипт (k6):**
```javascript
import http from 'k6/http';
import { check } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

export const hasSelectionsRate = new Rate('has_selections');
export const responseTimeMs = new Trend('response_time_ms', true);
export const totalRequests = new Counter('requests_total');
export const jsonParseFailures = new Counter('json_parse_failures_total');

export const options = {
  scenarios: {
    constant_rps: {
      executor: 'constant-arrival-rate',
      rate: Number(__ENV.RATE || 100),
      timeUnit: '1s',
      duration: __ENV.DURATION || '5m',
      preAllocatedVUs: Number(__ENV.PRE_VUS || 200),
      maxVUs: Number(__ENV.MAX_VUS || 2000),
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.02'],
    http_req_duration: ['p(95)<1000'],
    has_selections: ['rate>0.90'],
  },
};

function safeJsonParse(body) {
  try { return JSON.parse(body); } catch (e) { jsonParseFailures.add(1); return null; }
}

export default function () {
  const url = __ENV.TARGET_URL;
  if (!url) throw new Error('Set TARGET_URL');

  const res = http.get(url, { timeout: __ENV.TIMEOUT || '30s' });

  totalRequests.add(1);
  responseTimeMs.add(res.timings.duration);

  check(res, { 'status is 2xx': (r) => r.status >= 200 && r.status < 300 });

  const data = safeJsonParse(res.body);
  const okSelections = !!(data && Array.isArray(data.selections) && data.selections.length > 0);
  hasSelectionsRate.add(okSelections);

  // log only problematic cases (and sample body)
  if (!okSelections || res.status < 200 || res.status >= 300) {
    const sample = (res.body || '').slice(0, 300);
    console.warn(`status=${res.status} dur=${res.timings.duration}ms okSelections=${okSelections} bodySample=${JSON.stringify(sample)}`);
  }
}

export function handleSummary(data) {
  const selectionRate = data.metrics.has_selections?.values?.rate ?? null;
  const avg = data.metrics.response_time_ms?.values?.avg ?? null;

  const report = {
    selection_rate: selectionRate,
    selection_rate_percent: selectionRate === null ? null : Number((selectionRate * 100).toFixed(2)),
    avg_response_time_ms: avg === null ? null : Number(avg.toFixed(2)),
    total_requests: data.metrics.requests_total?.values?.count ?? null,
    json_parse_failures: data.metrics.json_parse_failures_total?.values?.count ?? 0,
    thresholds_ok: data.areThresholdsOk,
  };

  const md = [
    '# Load test report (selections)',
    '',
    `- Total requests: **${report.total_requests}**`,
    `- % with selections.length>0: **${report.selection_rate_percent}%**`,
    `- Avg response time: **${report.avg_response_time_ms} ms**`,
    `- JSON parse failures: **${report.json_parse_failures}**`,
    `- Thresholds OK: **${report.thresholds_ok}**`,
    '',
  ].join('\n');

  return {
    stdout: md,
    'custom-report.json': JSON.stringify(report, null, 2),
    'custom-report.md': md,
  };
}
```

**Запуск приклад:**
```bash
TARGET_URL='http://10.0.0.10/api/search' \
RATE='58' \
DURATION='5m' \
PRE_VUS='200' \
MAX_VUS='2000' \
k6 run script.js
```

Для сценарію 50M/day (середній RPS):
```bash
RATE='579' DURATION='5m' k6 run script.js
```

---

### 5) Інтеграція в Grafana (опис імплементації)
Найпростіший варіант:

#### Варіант A: k6 → InfluxDB → Grafana
1) Підняти InfluxDB (v1 або v2) і Grafana (docker-compose або існуюча інфра).
2) Запускати k6 з output у InfluxDB, приклад:
```bash
k6 run --out influxdb=http://influxdb:8086/k6 script.js
```
3) Додати InfluxDB datasource у Grafana.
4) Імпортувати готовий k6 dashboard + додати панелі під кастомні метрики:
- `has_selections` (rate)
- `response_time_ms` (avg/p95)

**Важливо:**
- Grafana/InfluxDB зберігає метрики (тайм-серії).
- А твій “body-driven report” краще зберігати як артефакт (custom-report.json/md) після тесту.

#### Варіант B: k6 → Prometheus remote write → Grafana (не критично)
- Потрібен k6 output extension.
- Далі Grafana читає з Prometheus/Mimir/VictoriaMetrics.

---

### 6) Рекомендація по двом тестам
1) **Тест #1 (5M/day)**
- або 58 RPS протягом 5 хв (реалістичний)
- або 16,667 RPS (stress, “стиснутий”)

2) **Тест #2 (50M/day)**
- або 579 RPS протягом 5 хв (реалістичний)
- або 166,667 RPS (дуже жорсткий, скоріше distributed)

Якщо твоя ціль — перевірити таймаути і “віддачу даних” (а не просто піковий throughput), то я б починав з варіанту **A (середній RPS)** + окремо робив короткий burst/stress.

---

## English version

### 1) Test goals
We test the service inside a private/internal network (LAN) focusing on:
- timeouts / response stability
- data correctness (did we get what we wanted)
- throughput/capacity

“Data received” condition per request:
- JSON response
- `selections` array length is **> 0**

We need:
- % of requests where `selections.length > 0`
- average response time
- (optional) timeout/error rate

---

### 2) RPS calculations for a 5-minute test (chosen approach: average daily RPS)
We take the **daily volume** and divide it by the number of seconds in a day.

Formula:
- **RPS = requests_per_day / 86400**

1) **5,000,000 requests/day**
- RPS ≈ 5,000,000 / 86,400 ≈ **57.87 RPS** (round to **58–60 RPS**)
- In 5 minutes (300s) this is roughly **17,400–18,000** requests

2) **50,000,000 requests/day**
- RPS ≈ 50,000,000 / 86,400 ≈ **578.70 RPS** (round to **580–600 RPS**)
- In 5 minutes this is roughly **174,000–180,000** requests

This approach is suitable when the goal is to validate timeouts, stability, and data delivery at “average daily intensity”.

---

### 3) Is k6 sufficient?
For the target modes **~58–60 RPS** and **~580–600 RPS**:
- Yes, **k6 is an excellent fit**.
- This load is realistic even for a single load-generator host (especially in LAN), as long as you:
  - avoid logging full bodies for every request
  - only parse the minimal JSON fields needed (`selections.length > 0`)

---

### 4) k6 example (GET any URL) + selections-based report
Use an **arrival-rate** executor to target an exact RPS.

(See the script in the UA section; it generates `custom-report.json` and `custom-report.md`.)

---

### 5) Grafana integration (implementation)
#### Option A (recommended): k6 → InfluxDB → Grafana
1) Run InfluxDB + Grafana.
2) Stream k6 metrics to InfluxDB:
```bash
k6 run --out influxdb=http://influxdb:8086/k6 script.js
```
3) Configure Grafana datasource and dashboards.
4) Add panels for custom metrics: `has_selections` and `response_time_ms`.

Note: Grafana is for time-series metrics; the body-driven report is best stored as a separate artifact.

#### Option B: k6 → Prometheus remote write → Grafana
Possible via k6 output extensions; optional.
