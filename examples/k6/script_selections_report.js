import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

// --- Custom metrics ---
export const hasSelectionsRate = new Rate('has_selections');
export const responseTimeMs = new Trend('response_time_ms', true); // time trend
export const totalRequests = new Counter('requests_total');
export const jsonParseFailures = new Counter('json_parse_failures_total');

// --- Load profile examples ---
// Choose one: VUs ramp (stages) or arrival-rate.
// You can change without code changes by editing options.
export const options = {
  scenarios: {
    ramping_vus: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '30s', target: 5 },
        { duration: '1m', target: 20 },
        { duration: '30s', target: 0 },
      ],
      gracefulRampDown: '10s',
    },

    // Uncomment for arrival-rate model (RPS-oriented)
    // constant_arrival: {
    //   executor: 'constant-arrival-rate',
    //   rate: 50, // iterations per timeUnit
    //   timeUnit: '1s',
    //   duration: '2m',
    //   preAllocatedVUs: 50,
    //   maxVUs: 200,
    // },
  },

  thresholds: {
    http_req_failed: ['rate<0.02'],
    http_req_duration: ['p(95)<1000'],
    has_selections: ['rate>0.90'], // example: 90% of responses should contain selections
  },
};

function safeJsonParse(body) {
  try {
    return JSON.parse(body);
  } catch (e) {
    jsonParseFailures.add(1);
    return null;
  }
}

export default function () {
  const url = __ENV.TARGET_URL;
  if (!url) {
    throw new Error('Please set TARGET_URL env var');
  }

  const params = {
    headers: {
      'Content-Type': 'application/json',
      ...( __ENV.AUTH_HEADER ? { 'Authorization': __ENV.AUTH_HEADER } : {} ),
    },
    timeout: __ENV.TIMEOUT || '30s',
    tags: {
      endpoint: __ENV.ENDPOINT_TAG || 'target',
    },
  };

  // If you need POST with a body, set REQUEST_BODY
  const method = (__ENV.METHOD || 'GET').toUpperCase();
  const body = __ENV.REQUEST_BODY || null;

  let res;
  if (method === 'POST') {
    res = http.post(url, body, params);
  } else if (method === 'PUT') {
    res = http.put(url, body, params);
  } else {
    res = http.get(url, params);
  }

  totalRequests.add(1);
  responseTimeMs.add(res.timings.duration);

  // Basic checks
  const ok = check(res, {
    'status is 2xx': (r) => r.status >= 200 && r.status < 300,
  });

  // Parse JSON body and check selections
  // NOTE: res.body is string for text responses; if your API returns binary, adjust.
  const data = safeJsonParse(res.body);

  let hasSelections = false;
  if (data && Array.isArray(data.selections)) {
    hasSelections = data.selections.length > 0;
  }

  hasSelectionsRate.add(hasSelections);

  // Optional: log failures with a small sample of body
  if (!ok || !hasSelections) {
    const sample = (res.body || '').slice(0, 500);
    console.warn(`Unexpected response: status=${res.status} duration=${res.timings.duration}ms hasSelections=${hasSelections} bodySample=${JSON.stringify(sample)}`);
  }

  // pacing
  if (__ENV.SLEEP_MS) {
    sleep(Number(__ENV.SLEEP_MS) / 1000);
  }
}

export function handleSummary(data) {
  // data.metrics.has_selections.values.rate is 0..1
  const selectionRate = data.metrics.has_selections?.values?.rate ?? null;
  const avg = data.metrics.response_time_ms?.values?.avg ?? null;

  const report = {
    selection_rate: selectionRate,
    selection_rate_percent: selectionRate === null ? null : Number((selectionRate * 100).toFixed(2)),
    avg_response_time_ms: avg === null ? null : Number(avg.toFixed(2)),
    total_requests: data.metrics.requests_total?.values?.count ?? null,
    json_parse_failures: data.metrics.json_parse_failures_total?.values?.count ?? 0,
    thresholds_ok: data.state?.isStdOutTTY ? data.metrics?.http_req_failed : data?.root_group, // not reliable; keep below
    are_thresholds_ok: data.areThresholdsOk,
  };

  const md = [
    '# Load test report (selections)',
    '',
    `- Total requests: **${report.total_requests}**`,
    `- Has selections (rate): **${report.selection_rate_percent}%**`,
    `- Avg response time: **${report.avg_response_time_ms} ms**`,
    `- JSON parse failures: **${report.json_parse_failures}**`,
    `- Thresholds OK: **${report.are_thresholds_ok}**`,
    '',
  ].join('\n');

  return {
    stdout: md,
    'custom-report.json': JSON.stringify(report, null, 2),
    'custom-report.md': md,
  };
}
