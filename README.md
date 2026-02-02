# Load testing — workflow

Ціль: підібрати/описати підхід і фреймворк(и) для лоад-тестінгу з такими вимогами:
- можна **варіювати навантаження** (stages/ramps/arrival rate)
- є **детальні логи** (включно з response після запиту; за потреби — частина body)
- є можливість робити **кастомні звіти** (репорти) на базі **вмісту response body**
- бажано (але не критично): **інтеграція з Grafana**

Документація:
- `docs/frameworks_UA.md` / `docs/frameworks_EN.md` — порівняння фреймворків + рекомендація
- `docs/grafana-integration_UA.md` / `docs/grafana-integration_EN.md` — варіанти інтеграції в Grafana
- `examples/k6/` — приклади під k6 (план)
