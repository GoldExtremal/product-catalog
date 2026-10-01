'use strict';
// Общее ядро мок-серверов A2DATA для фронтенд-заданий.
// Без внешних зависимостей: только встроенные модули Node.js 20+.

const http = require('http');
const { URL } = require('url');

// ---------- утилиты ----------

function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hash32(...nums) {
  let h = 2166136261 >>> 0;
  for (const n of nums) {
    h ^= n >>> 0;
    h = Math.imul(h, 16777619) >>> 0;
    h ^= h >>> 13;
  }
  return h >>> 0;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, Math.max(0, ms || 0)));

function pickLatency(v) {
  if (Array.isArray(v)) {
    const [min, max] = v;
    return min + Math.random() * Math.max(0, (max ?? min) - min);
  }
  return Number(v) || 0;
}

class HttpError extends Error {
  constructor(status, body) {
    super(body && body.error ? body.error : String(status));
    this.status = status;
    this.body = body;
  }
}

function send(res, status, body, headers = {}) {
  if (res.headersSent || res.destroyed) return;
  const payload = body === undefined ? '' : JSON.stringify(body);
  res.writeHead(status, {
    ...(payload ? { 'Content-Type': 'application/json; charset=utf-8' } : {}),
    ...headers,
  });
  res.end(payload);
}

function readJson(req, limit = 1_000_000) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on('data', (c) => {
      size += c.length;
      if (size > limit) {
        reject(new HttpError(413, { error: 'payload_too_large' }));
        req.destroy();
        return;
      }
      chunks.push(c);
    });
    req.on('end', () => {
      const raw = Buffer.concat(chunks).toString('utf8').trim();
      if (!raw) return resolve({});
      try {
        resolve(JSON.parse(raw));
      } catch {
        reject(new HttpError(400, { error: 'invalid_json' }));
      }
    });
    req.on('error', reject);
  });
}

function parseCookies(header) {
  const out = {};
  if (!header) return out;
  for (const part of header.split(';')) {
    const i = part.indexOf('=');
    if (i > 0) out[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim());
  }
  return out;
}

function compileRoutes(routes) {
  return routes.map((r) => {
    const parts = r.path.split('/').filter(Boolean);
    return { ...r, parts };
  });
}

function findRoute(routes, method, pathname) {
  const segs = pathname.split('/').filter(Boolean);
  let methodMismatch = false;
  for (const r of routes) {
    if (r.parts.length !== segs.length) continue;
    const params = {};
    let ok = true;
    for (let i = 0; i < segs.length; i++) {
      const p = r.parts[i];
      if (p.startsWith(':')) params[p.slice(1)] = decodeURIComponent(segs[i]);
      else if (p !== segs[i]) { ok = false; break; }
    }
    if (!ok) continue;
    if (r.method !== method) { methodMismatch = true; continue; }
    return { route: r, params };
  }
  return methodMismatch ? { methodNotAllowed: true } : null;
}

// ---------- приложение ----------

/**
 * createApp({ name, defaults, routes, onReset, before })
 *  defaults — начальное состояние /__chaos
 *  routes   — [{ method, path, handler(ctx), chaos: false }]
 *             chaos:false — к маршруту не применяются общие latency_ms / error_rate
 *  before   — хук до latency/ошибок; вернуть true, если запрос уже обработан
 *  keepAlive — false: закрывать соединение после каждого ответа
 */
function createApp({ name, defaults, routes, onReset, before, keepAlive = true }) {
  let chaos = { ...defaults };
  const compiled = compileRoutes(routes);

  const server = http.createServer(async (req, res) => {
    const url = new URL(req.url, 'http://localhost');
    const origin = req.headers.origin;
    res.setHeader('Cache-Control', 'no-store');
    // Без keep-alive браузер не повторяет запрос сам после обрыва соединения
    // (Chrome молча ретраит даже POST на переиспользованном сокете)
    if (!keepAlive) res.setHeader('Connection', 'close');
    if (origin) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Access-Control-Allow-Credentials', 'true');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Idempotency-Key, Accept');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, PUT, DELETE, OPTIONS');
      res.setHeader('Vary', 'Origin');
    }
    if (req.method === 'OPTIONS') { res.writeHead(204); return res.end(); }

    try {
      // --- служебные эндпоинты ---
      if (url.pathname === '/health') return send(res, 200, { ok: true, service: name });
      if (url.pathname === '/__chaos') {
        if (req.method === 'GET') return send(res, 200, chaos);
        if (req.method === 'POST') {
          const body = await readJson(req);
          if (!body || typeof body !== 'object' || Array.isArray(body)) {
            throw new HttpError(400, { error: 'chaos_must_be_object' });
          }
          chaos = { ...chaos, ...body };
          console.log(`[${name}] chaos →`, JSON.stringify(chaos));
          return send(res, 200, chaos);
        }
      }
      if (url.pathname === '/__reset' && req.method === 'POST') {
        chaos = { ...defaults };
        if (onReset) onReset();
        console.log(`[${name}] reset`);
        return send(res, 200, { ok: true });
      }

      const match = findRoute(compiled, req.method, url.pathname);
      if (!match) return send(res, 404, { error: 'not_found' });
      if (match.methodNotAllowed) return send(res, 405, { error: 'method_not_allowed' });

      const ctx = {
        req, res, url,
        params: match.params,
        query: Object.fromEntries(url.searchParams),
        chaos,
        body: undefined,
        cookies: parseCookies(req.headers.cookie),
      };

      const isControl = url.pathname.startsWith('/api/__') || url.pathname.startsWith('/__');
      if (!isControl && before && (await before(ctx))) return;

      if (['POST', 'PUT', 'PATCH'].includes(req.method)) ctx.body = await readJson(req);

      if (!isControl && match.route.chaos !== false) {
        await sleep(pickLatency(chaos.latency_ms));
        if (chaos.error_rate && Math.random() < chaos.error_rate) {
          return send(res, 500, { error: 'internal_error' });
        }
      }
      await match.route.handler(ctx);
    } catch (e) {
      if (e instanceof HttpError) return send(res, e.status, e.body);
      console.error(`[${name}]`, e);
      send(res, 500, { error: 'internal_error' });
    }
  });

  return {
    server,
    getChaos: () => chaos,
    listen(port = Number(process.env.PORT) || 4000) {
      server.listen(port, '0.0.0.0', () => console.log(`[${name}] mock-api on :${port}`));
      return server;
    },
  };
}

module.exports = {
  createApp, HttpError, send, sleep, pickLatency, mulberry32, hash32, parseCookies,
};
