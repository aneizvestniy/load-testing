# k6 examples (plan)

Files:
- `script_selections_report.js` — base scenario + stages + body parsing (`selections.length>0`) + custom reports
- `RUN.md` — how to run

Key ideas:
- log only errors / no-selections, plus body sample (to avoid huge output)
- parse JSON response and build domain metrics
- generate separate report artifacts (`custom-report.json`, `custom-report.md`)
