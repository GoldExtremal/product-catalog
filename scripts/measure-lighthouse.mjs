import { spawnSync } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import * as chromeLauncher from 'chrome-launcher';
import lighthouse from 'lighthouse';

const APP_URL = process.env.MEASURE_URL ?? 'http://localhost:8080/';
const MOCK_API_URL = process.env.MEASURE_MOCK_API_URL ?? 'http://localhost:4000';
const RUNS = Number(process.env.MEASURE_RUNS ?? 3);
const OUT_DIR = new URL('../lighthouse/', import.meta.url);
const SUMMARY_FILE = new URL('../docs/lighthouse-summary.json', import.meta.url);

const METRICS = [
  ['first-contentful-paint', 'FCP', 'ms'],
  ['largest-contentful-paint', 'LCP', 'ms'],
  ['total-blocking-time', 'TBT', 'ms'],
  ['cumulative-layout-shift', 'CLS', ''],
  ['speed-index', 'Speed Index', 'ms'],
];
const CATEGORIES = ['performance', 'accessibility', 'best-practices', 'seo'];

/** @param {number[]} values */
const median = (values) => [...values].sort((a, b) => a - b)[Math.floor(values.length / 2)];

/** @param {number} value @param {string} unit */
const format = (value, unit) => (unit === 'ms' ? `${Math.round(value)} мс` : value.toFixed(3));

function startApp() {
  if (process.env.MEASURE_SKIP_DOCKER === '1') return;
  console.log('▶ docker compose up --build -d --wait');
  const result = spawnSync('docker', ['compose', 'up', '--build', '-d', '--wait'], { stdio: 'inherit' });
  if (result.status !== 0) throw new Error('docker compose up завершился с ошибкой');
}

async function prepareMockApi() {
  const reset = await fetch(`${MOCK_API_URL}/__reset`, { method: 'POST' });
  if (!reset.ok) throw new Error(`/__reset ответил ${reset.status}`);
  return /** @type {{ latency_ms: unknown, error_rate: number }} */ (
    await (await fetch(`${MOCK_API_URL}/__chaos`)).json()
  );
}

/** @param {number} index */
async function measureOnce(index) {
  const chrome = await chromeLauncher.launch({ chromeFlags: ['--headless=new'] });
  try {
    const result = await lighthouse(APP_URL, {
      port: chrome.port,
      output: ['json', 'html'],
      logLevel: 'error',
      onlyCategories: CATEGORIES,
    });
    if (!result) throw new Error('Lighthouse не вернул результат');
    const [json, html] = /** @type {string[]} */ (result.report);
    await writeFile(new URL(`run-${index}.json`, OUT_DIR), json);
    await writeFile(new URL(`run-${index}.html`, OUT_DIR), html);
    return result.lhr;
  } finally {
    chrome.kill();
  }
}

/**
 * @param {import('lighthouse').Result} lhr
 * @param {string} id
 * @returns {Record<string, any>[]}
 */
function auditItems(lhr, id) {
  const details = /** @type {any} */ (lhr.audits[id]?.details);
  return Array.isArray(details?.items) ? details.items : [];
}

/** @param {import('lighthouse').Result} lhr */
function describeBottleneck(lhr) {
  const lines = [];

  for (const item of auditItems(lhr, 'lcp-breakdown-insight')) {
    if (item.type === 'node') lines.push(`LCP-элемент: ${item.snippet}`);
    if (item.type === 'table') {
      lines.push('Разбивка LCP:');
      for (const row of item.items) lines.push(`  ${row.label}: ${Math.round(row.duration)} мс`);
    }
  }

  for (const item of auditItems(lhr, 'lcp-discovery-insight')) {
    if (item.type !== 'checklist') continue;
    lines.push('Обнаружение LCP-ресурса:');
    for (const check of Object.values(item.items)) lines.push(`  ${check.value ? '✓' : '✗'} ${check.label}`);
  }

  const requests = auditItems(lhr, 'network-requests').filter((row) =>
    /\/(assets\/|api\/|img\/p_10[0-3])|:\d+\/$/.test(String(row.url)),
  );
  if (requests.length > 0) {
    lines.push('Ключевые запросы (начало–конец, реальное время без троттлинга):');
    for (const row of requests) {
      const url = new URL(String(row.url));
      lines.push(
        `  ${Math.round(row.networkRequestTime)}–${Math.round(row.networkEndTime)} мс  ${url.pathname}${url.search}`,
      );
    }
  }
  return lines;
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  startApp();
  const chaos = await prepareMockApi();

  /** @type {import('lighthouse').Result[]} */
  const runs = [];
  for (let index = 1; index <= RUNS; index += 1) {
    console.log(`▶ прогон ${index}/${RUNS}`);
    runs.push(await measureOnce(index));
  }

  const lcpValues = runs.map((lhr) => lhr.audits['largest-contentful-paint'].numericValue ?? 0);
  const medianLcp = median(lcpValues);
  const medianRun = runs[lcpValues.indexOf(medianLcp)];
  const settings = medianRun.configSettings;
  const throttling = settings.throttling;

  const summary = {
    url: APP_URL,
    date: new Date().toISOString(),
    lighthouse: medianRun.lighthouseVersion,
    chrome: medianRun.environment.hostUserAgent.match(/Chrome\/[\d.]+/)?.[0] ?? 'unknown',
    formFactor: settings.formFactor,
    throttling: {
      method: settings.throttlingMethod,
      rttMs: throttling.rttMs,
      throughputKbps: throttling.throughputKbps,
      cpuSlowdownMultiplier: throttling.cpuSlowdownMultiplier,
    },
    mockApi: { seed: 42, ...chaos },
    runs: RUNS,
    medianRun: runs.indexOf(medianRun) + 1,
    categories: Object.fromEntries(
      CATEGORIES.map((id) => [id, median(runs.map((lhr) => Math.round((lhr.categories[id].score ?? 0) * 100)))]),
    ),
    metrics: Object.fromEntries(
      METRICS.map(([id]) => [id, median(runs.map((lhr) => lhr.audits[id].numericValue ?? 0))]),
    ),
  };
  await mkdir(new URL('.', SUMMARY_FILE), { recursive: true });
  await writeFile(SUMMARY_FILE, `${JSON.stringify(summary, null, 2)}\n`);

  console.log('\n## Lighthouse — медиана из', RUNS, 'прогонов\n');
  console.log(`URL: ${summary.url}`);
  console.log(`Lighthouse ${summary.lighthouse}, ${summary.chrome}, ${summary.formFactor}`);
  console.log(
    `Троттлинг: ${summary.throttling.method}, RTT ${summary.throttling.rttMs} мс, ` +
      `${Math.round(summary.throttling.throughputKbps)} Кбит/с, CPU ×${summary.throttling.cpuSlowdownMultiplier}`,
  );
  console.log(`Mock API: seed 42, latency ${JSON.stringify(chaos.latency_ms)}, error_rate ${chaos.error_rate}\n`);
  console.log('| Метрика | Медиана | Прогоны |');
  console.log('| --- | --- | --- |');
  for (const id of CATEGORIES) {
    const values = runs.map((lhr) => Math.round((lhr.categories[id].score ?? 0) * 100));
    console.log(`| ${categoryTitle(medianRun, id)} | ${summary.categories[id]} | ${values.join(' · ')} |`);
  }
  for (const [id, label, unit] of METRICS) {
    const values = runs.map((lhr) => lhr.audits[id].numericValue ?? 0);
    console.log(`| ${label} | ${format(median(values), unit)} | ${values.map((v) => format(v, unit)).join(' · ')} |`);
  }
  console.log(`\nМедианный прогон: ${summary.medianRun} (lighthouse/run-${summary.medianRun}.html)`);
  for (const line of describeBottleneck(medianRun)) console.log(line);
  if (process.env.MEASURE_SKIP_DOCKER !== '1') {
    console.log('\nКонтейнеры остались запущенными, остановить: docker compose down');
  }
}

/** @param {import('lighthouse').Result} lhr @param {string} id */
function categoryTitle(lhr, id) {
  return lhr.categories[id].title;
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
