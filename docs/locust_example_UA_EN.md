# Locust example (UA + EN) — selections-based validation + custom report

## Українська версія

### Що робить приклад
Цей приклад для **Locust (Python)** робить GET-запит і для кожної відповіді перевіряє:
- відповідь — JSON
- `selections` — масив
- `selections.length > 0`

Далі він:
- рахує **% запитів з selections>0** (selection rate)
- рахує **середній час відповіді** (avg response time)
- рахує кількість помилок JSON-парсингу
- генерує **кастомний JSON-репорт** наприкінці тесту

Файли:
- `load-testing/examples/locust/locustfile_selections.py`
- `load-testing/examples/locust/RUN.md`

### Важливе обмеження Locust
Locust керує **кількістю користувачів (concurrency)**, а не “ідеально точним RPS”.
Фактичний RPS залежить від latency сервера і від того, чи є пауза між запитами (`WAIT_S`).

Якщо потрібен максимально точний RPS (58–60 або 580–600), то **k6 (arrival-rate)** простіше.

### Як запустити (headless)
Приклад команди дивись у `RUN.md`.

### Репорт
За замовчуванням створюється файл `locust-custom-report.json` з полями:
- `selection_rate_percent`
- `avg_response_time_ms`
- `total_requests`
- `json_parse_failures`

> Примітка: цей простий репорт коректний для **локального single-process** запуску.
> Для distributed (master/worker) краще виводити метрики в Prometheus/Influx і робити агрегацію там.

---

## English version

### What the example does
This **Locust (Python)** example sends a GET request and validates each response:
- response is JSON
- `selections` is an array
- `selections.length > 0`

Then it:
- calculates **% of requests with selections>0**
- calculates **average response time**
- counts JSON parse failures
- writes a **custom JSON report** at the end

Files:
- `load-testing/examples/locust/locustfile_selections.py`
- `load-testing/examples/locust/RUN.md`

### Important Locust limitation
Locust controls concurrency (users), not an exact target RPS.
Actual RPS depends on latency and pacing.

If you must hit an exact RPS (58–60 or 580–600), k6 arrival-rate executor is usually easier.
