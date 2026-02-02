# load-testing

Репозиторій з workflow/прикладами для load testing.

Цілі:
- **варіювати навантаження** (RPS / VUs / ramp up-down)
- мати **детальні логи** (але контрольовано: логувати проблемні кейси + body sample)
- будувати **кастомні репорти** на основі response body
- (опційно) інтегрувати метрики в **Grafana**

---

## Швидкий старт

### k6 (рекомендовано для точного RPS)
Дивись приклад:
- `examples/k6/script_selections_report.js`
- `examples/k6/RUN.md`

Запуск (приклад):
```bash
TARGET_URL='http://10.0.0.10/api/search' \
RATE='60' \
DURATION='5m' \
k6 run examples/k6/script_selections_report.js
```

### Locust (Python)
Дивись:
- `examples/locust/locustfile_selections.py`
- `examples/locust/RUN.md`

---

## Документація
- `docs/final_load_testing_plan_UA_EN.md` — фінальний план (UA+EN) + RPS 58–60 та 580–600 + Grafana + приклад k6
- `docs/frameworks_UA.md` / `docs/frameworks_EN.md` — порівняння фреймворків
- `docs/grafana-integration_UA.md` / `docs/grafana-integration_EN.md` — варіанти інтеграції в Grafana
- `docs/locust_example_UA_EN.md` — пояснення по Locust прикладу

---

## Рекомендація по інструменту
- Для **точного RPS** і простого сценарію GET/JSON: **k6**.
- Для складних user flows/станів: **Locust**.

---

## Grafana (коротко)
Найпростіше:
- k6 → InfluxDB → Grafana
- кастомні “body-driven” звіти зберігати як артефакти (JSON/MD) окремо від Grafana.
