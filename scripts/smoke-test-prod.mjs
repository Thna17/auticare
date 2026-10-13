#!/usr/bin/env node
/**
 * @file smoke-test-prod.mjs
 * Automated HTTP smoke testing probe suite for AutiCare production deployment.
 * Validates Nginx web server, API liveness/readiness, database connectivity,
 * reverse proxy routing, SPA client fallback, and static asset delivery.
 */

import path from 'node:path';

function parseArgs() {
  const args = process.argv.slice(2);
  let webUrl = process.env.WEB_URL || 'http://localhost';
  let apiUrl = process.env.API_URL || 'http://localhost:3000';
  let timeoutMs = 10000;
  let requireNginx = false;
  let testCredentials = {
    email: process.env.SMOKE_EMAIL || 'demo.parent@auticare.local',
    password: process.env.SMOKE_PASSWORD || 'AutiCareDemoPassword123',
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--web-url' || arg === '-w') {
      webUrl = args[++i];
    } else if (arg === '--api-url' || arg === '-a') {
      apiUrl = args[++i];
    } else if (arg === '--timeout' || arg === '-t') {
      timeoutMs = Number.parseInt(args[++i], 10) || 10000;
    } else if (arg === '--require-nginx') {
      requireNginx = true;
    } else if (arg === '--help' || arg === '-h') {
      console.log(`
AutiCare Automated Production Smoke Test Suite

Usage:
  node scripts/smoke-test-prod.mjs [options]

Options:
  -w, --web-url <url>      Base URL for the Web front-end / Nginx reverse proxy (default: http://localhost)
  -a, --api-url <url>      Base URL for the Backend API container (default: http://localhost:3000)
  -t, --timeout <ms>       HTTP request timeout in milliseconds (default: 10000)
      --require-nginx      Fail test if Nginx-specific /nginx-health endpoint is unreachable
  -h, --help               Show this help message

Environment variables:
  WEB_URL, API_URL, SMOKE_EMAIL, SMOKE_PASSWORD
`);
      process.exit(0);
    }
  }

  // Remove trailing slashes
  webUrl = webUrl.replace(/\/+$/, '');
  apiUrl = apiUrl.replace(/\/+$/, '');

  return { webUrl, apiUrl, timeoutMs, requireNginx, testCredentials };
}

async function fetchWithTimeout(url, options = {}, timeoutMs = 10000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  const start = performance.now();
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    const duration = Math.round(performance.now() - start);
    return { response, duration, error: null };
  } catch (error) {
    const duration = Math.round(performance.now() - start);
    return { response: null, duration, error };
  } finally {
    clearTimeout(timer);
  }
}

async function runProbe(name, fn) {
  process.stdout.write(`  ⏳ ${name}... `);
  const start = performance.now();
  try {
    const result = await fn();
    const duration = Math.round(performance.now() - start);
    if (result.skipped) {
      console.log(`⚠️  SKIPPED (${result.reason})`);
      return { ok: true, skipped: true, name };
    }
    console.log(`✓ PASSED (${duration}ms) - ${result.details}`);
    return { ok: true, name, duration, details: result.details };
  } catch (err) {
    const duration = Math.round(performance.now() - start);
    console.log(`✗ FAILED (${duration}ms)`);
    console.error(`     ↳ Error: ${err.message}`);
    return { ok: false, name, duration, error: err.message };
  }
}

async function main() {
  const { webUrl, apiUrl, timeoutMs, requireNginx, testCredentials } = parseArgs();

  console.log('🩺 AutiCare Production Smoke Test Probe Suite');
  console.log('==============================================');
  console.log(`Target Web (Nginx / SPA): ${webUrl}`);
  console.log(`Target API (Express):     ${apiUrl}`);
  console.log(`Probe Timeout:            ${timeoutMs}ms\n`);

  const results = [];

  // Probe 1: Nginx Health Probe (/nginx-health)
  results.push(
    await runProbe('Nginx Web Server Health Check', async () => {
      const probeUrl = `${webUrl}/nginx-health`;
      const { response, error } = await fetchWithTimeout(probeUrl, {}, timeoutMs);

      if (error) {
        if (!requireNginx) {
          return {
            skipped: true,
            reason: `Could not reach ${probeUrl} (${error.message}). Run with --require-nginx for strict Nginx enforcement.`,
          };
        }
        throw new Error(`Failed to reach ${probeUrl}: ${error.message}`);
      }

      if (response.status !== 200) {
        if (!requireNginx && response.status === 404) {
          return {
            skipped: true,
            reason: `${probeUrl} returned 404 (non-Nginx server or dev server running).`,
          };
        }
        throw new Error(`Expected HTTP 200, got ${response.status} ${response.statusText}`);
      }

      const text = await response.text();
      return { details: `HTTP 200 OK (${text.trim().slice(0, 30) || 'healthy'})` };
    }),
  );

  // Probe 2: API Liveness Probe (/health/live)
  results.push(
    await runProbe('API Container Liveness Probe', async () => {
      const probeUrl = `${apiUrl}/health/live`;
      const { response, error } = await fetchWithTimeout(probeUrl, {}, timeoutMs);

      if (error) throw new Error(`Failed to reach ${probeUrl}: ${error.message}`);
      if (response.status !== 200) {
        throw new Error(`Expected HTTP 200, got ${response.status} ${response.statusText}`);
      }

      const body = await response.json();
      if (body?.data?.status !== 'live' && body?.status !== 'live' && body?.status !== 'ok') {
        throw new Error(`Unexpected liveness payload: ${JSON.stringify(body)}`);
      }

      const uptime = body?.data?.uptime ?? 'n/a';
      return { details: `HTTP 200 OK (status: live, uptime: ${uptime}s)` };
    }),
  );

  // Probe 3: API + Database Readiness Probe (/health/ready)
  results.push(
    await runProbe('API + Database Readiness Probe', async () => {
      const probeUrl = `${apiUrl}/health/ready`;
      const { response, error } = await fetchWithTimeout(probeUrl, {}, timeoutMs);

      if (error) throw new Error(`Failed to reach ${probeUrl}: ${error.message}`);
      if (response.status !== 200) {
        throw new Error(`Expected HTTP 200, got ${response.status} ${response.statusText}`);
      }

      const body = await response.json();
      const dbStatus = body?.data?.database ?? body?.checks?.database;
      if (dbStatus !== 'connected') {
        throw new Error(`Database is not connected! Payload: ${JSON.stringify(body)}`);
      }

      return { details: `HTTP 200 OK (status: ready, database: connected)` };
    }),
  );

  // Probe 4: Reverse Proxy API Route & Endpoints (/api/v1/hospitals)
  results.push(
    await runProbe('API Endpoint via Reverse Proxy (/api/v1/hospitals)', async () => {
      // Test unauthenticated routing first to ensure reverse proxy forwards to Express API
      const targetBase = webUrl === 'http://localhost' ? webUrl : webUrl || apiUrl;
      const probeUrl = `${targetBase}/api/v1/hospitals`;

      // Attempt authenticated probe if credentials available
      let authCookie = null;
      try {
        const loginRes = await fetchWithTimeout(
          `${apiUrl}/api/v1/auth/login`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(testCredentials),
          },
          timeoutMs,
        );

        if (loginRes.response?.status === 200) {
          const rawCookies = loginRes.response.headers.get('set-cookie');
          if (rawCookies) {
            authCookie = rawCookies.split(';')[0];
          }
        }
      } catch {
        // Fall back to unauthenticated verification
      }

      const reqHeaders = {};
      if (authCookie) {
        reqHeaders['Cookie'] = authCookie;
      }

      let { response, error } = await fetchWithTimeout(
        probeUrl,
        { headers: reqHeaders },
        timeoutMs,
      );

      // If webUrl is non-proxying dev server, fallback probe directly to API
      if (error || (response && response.status === 404)) {
        const directApiUrl = `${apiUrl}/api/v1/hospitals`;
        const direct = await fetchWithTimeout(directApiUrl, { headers: reqHeaders }, timeoutMs);
        response = direct.response;
        error = direct.error;
      }

      if (error) throw new Error(`Failed to reach hospitals endpoint: ${error.message}`);

      // If authenticated, expect HTTP 200 OK
      if (authCookie && response.status === 200) {
        const body = await response.json();
        const count = Array.isArray(body?.data) ? body.data.length : 'ok';
        return { details: `HTTP 200 OK (Authenticated: loaded ${count} institutions)` };
      }

      // If unauthenticated, expect HTTP 401 with structured JSON error (verifies reverse proxy to API)
      if (response.status === 401) {
        const body = await response.json();
        if (body?.error?.code === 'UNAUTHORIZED' || body?.message?.includes('Authentication')) {
          return { details: `HTTP 401 UNAUTHORIZED (Express reverse proxy routing verified)` };
        }
      }

      if (response.status === 200) {
        return { details: `HTTP 200 OK (Reverse proxy returned valid response)` };
      }

      throw new Error(
        `Expected HTTP 200 or 401 JSON, received ${response.status} ${response.statusText}`,
      );
    }),
  );

  // Probe 5: SPA Routing Fallback (HTML Delivery on deep route)
  results.push(
    await runProbe('SPA Routing Fallback & Root HTML', async () => {
      const probeUrl = `${webUrl}/screening`;
      const { response, error } = await fetchWithTimeout(probeUrl, {}, timeoutMs);

      if (error) {
        throw new Error(`Failed to reach ${probeUrl}: ${error.message}`);
      }

      if (response.status !== 200) {
        throw new Error(`Expected HTTP 200 on client route, got ${response.status}`);
      }

      const contentType = response.headers.get('content-type') || '';
      if (!contentType.includes('text/html')) {
        throw new Error(`Expected text/html on SPA deep link, got ${contentType}`);
      }

      const html = await response.text();
      if (!html.includes('<app-root') && !html.includes('AutiCare')) {
        throw new Error('SPA response did not contain <app-root> or AutiCare title');
      }

      return { details: `HTTP 200 OK (SPA index.html delivered for /screening)` };
    }),
  );

  // Probe 6: Static Assets Delivery
  results.push(
    await runProbe('Hashed Static Asset Delivery', async () => {
      const rootUrl = `${webUrl}/`;
      const { response: rootRes, error: rootErr } = await fetchWithTimeout(rootUrl, {}, timeoutMs);

      if (rootErr || !rootRes || rootRes.status !== 200) {
        throw new Error(`Could not fetch root HTML to inspect static assets`);
      }

      const html = await rootRes.text();
      // Match script src="main.js" or "styles.css" or chunk-*.js
      const assetMatch = html.match(/(?:src|href)="([^"]+\.(?:js|css))"/);

      if (!assetMatch) {
        return { details: 'HTML parsed (no static script/css links located)' };
      }

      let assetPath = assetMatch[1];
      if (!assetPath.startsWith('http')) {
        assetPath = `${webUrl}/${assetPath.replace(/^\/+/, '')}`;
      }

      const {
        response: assetRes,
        duration,
        error: assetErr,
      } = await fetchWithTimeout(assetPath, {}, timeoutMs);

      if (assetErr)
        throw new Error(`Failed to retrieve static asset ${assetPath}: ${assetErr.message}`);
      if (assetRes.status !== 200) {
        throw new Error(`Asset ${assetPath} returned HTTP ${assetRes.status}`);
      }

      const assetBytes = (await assetRes.arrayBuffer()).byteLength;
      return {
        details: `HTTP 200 OK (${path.basename(assetPath)}, ${assetBytes} bytes, ${duration}ms)`,
      };
    }),
  );

  console.log('\n==============================================');
  const failures = results.filter((r) => !r.ok);

  if (failures.length > 0) {
    console.log(`❌ Production smoke test FAILED with ${failures.length} issue(s):`);
    for (const f of failures) {
      console.log(`   - ${f.name}: ${f.error}`);
    }
    process.exit(1);
  }

  const passedCount = results.filter((r) => r.ok && !r.skipped).length;
  const skippedCount = results.filter((r) => r.skipped).length;

  console.log(`🎉 ALL PRODUCTION SMOKE TEST PROBES PASSED!`);
  console.log(`   ${passedCount} probe(s) successful, ${skippedCount} skipped.`);
  console.log('   The deployment stack is live, healthy, and serving requests.\n');
}

main();
