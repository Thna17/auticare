import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { createApp } from '../../app.js';
import { openApiDocument } from '../../config/openapi.js';

interface RouteDefinition {
  method: string;
  path: string;
}

interface ExpressLayer {
  name?: string;
  route?: {
    path: string;
    methods: Record<string, boolean>;
  };
  handle?: {
    stack?: ExpressLayer[];
  };
  matchers?: Array<(path: string) => { path?: string } | false>;
}

interface ExpressApp {
  router?: {
    stack?: ExpressLayer[];
  };
  _router?: {
    stack?: ExpressLayer[];
  };
}

interface OpenApiOperation {
  summary?: string;
  responses?: Record<string, unknown>;
  tags?: string[];
  [key: string]: unknown;
}

type OpenApiPathItem = Record<string, OpenApiOperation>;

function extractRoutesFromApp(app: ExpressApp): RouteDefinition[] {
  const routes: RouteDefinition[] = [];
  const candidates = [
    '/health',
    '/api/docs',
    '/api/v1/auth',
    '/api/v1/children',
    '/api/v1/hospitals',
    '/api/v1/appointments',
    '/api/v1/hospital-management',
    '/api/v1/schools',
    '/api/v1/screening',
    '/api/v1/parents',
    '/api/v1/activities',
    '/api/v1/dashboard',
    '/api/v1/school-registrations',
    '/api/v1/admin/school-registrations',
  ];

  function traverse(stack: ExpressLayer[], prefix = '') {
    for (const layer of stack) {
      if (layer.route) {
        const route = layer.route;
        const routePath = prefix + (route.path === '/' && prefix ? '' : route.path);
        const methods = Object.keys(route.methods || {}).filter(
          (m) => route.methods?.[m] && m !== '_all',
        );
        for (const method of methods) {
          routes.push({
            method: method.toLowerCase(),
            path: routePath,
          });
        }
      } else if (layer.name === 'router' && layer.handle?.stack) {
        let mountPath = '';
        for (const c of candidates) {
          const m = layer.matchers?.[0]?.(c);
          if (m && m.path) {
            mountPath = m.path;
            break;
          }
        }
        traverse(layer.handle.stack, prefix + mountPath);
      }
    }
  }

  const routerStack = app.router?.stack || app._router?.stack || [];
  traverse(routerStack);
  return routes;
}

// Convert express route param :param to OpenAPI {param}
function expressPathToOpenApiPath(expressPath: string): string {
  return expressPath.replace(/:([a-zA-Z0-9_]+)/g, '{$1}');
}

describe('OpenAPI Drift and Completeness', () => {
  it('serves openapi.json specification through API', async () => {
    const app = createApp();
    const res = await request(app).get('/api/docs/openapi.json');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/application\/json/);
    expect((res.body as Record<string, unknown>).openapi).toBe('3.1.0');
    expect((res.body as { info: { title: string } }).info.title).toContain('AutiCare');
  });

  it('serves openapi.json under /api/v1/docs/openapi.json as well', async () => {
    const app = createApp();
    const res = await request(app).get('/api/v1/docs/openapi.json');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/application\/json/);
    expect((res.body as Record<string, unknown>).openapi).toBe('3.1.0');
  });

  it('documents every registered Express route without drift', () => {
    const app = createApp();
    const routes = extractRoutesFromApp(app as unknown as ExpressApp);

    // Filter out internal docs or health checks
    const apiRoutes = routes.filter(
      (r) =>
        r.path.startsWith('/api/v1/') &&
        !r.path.includes('/docs') &&
        r.method !== 'options' &&
        r.method !== 'head',
    );

    expect(apiRoutes.length).toBeGreaterThan(30);

    const docPaths = (openApiDocument.paths as Record<string, OpenApiPathItem>) || {};
    const missingInDocs: string[] = [];

    for (const route of apiRoutes) {
      const openApiPath = expressPathToOpenApiPath(route.path);
      const docPath = docPaths[openApiPath];

      if (!docPath) {
        missingInDocs.push(
          `Missing path: ${route.method.toUpperCase()} ${openApiPath} (from ${route.path})`,
        );
      } else {
        const methodDoc = docPath[route.method];
        if (!methodDoc) {
          missingInDocs.push(`Missing method: ${route.method.toUpperCase()} ${openApiPath}`);
        }
      }
    }

    if (missingInDocs.length > 0) {
      console.error('OpenAPI drift detected:\n' + missingInDocs.join('\n'));
    }
    expect(missingInDocs).toEqual([]);
  });

  it('has valid metadata, components, and security schemas', () => {
    expect(openApiDocument.openapi).toBe('3.1.0');
    expect((openApiDocument.info as { version: string }).version).toBe('0.1.0');

    const components = openApiDocument.components as {
      securitySchemes?: Record<string, unknown>;
    };
    expect(components?.securitySchemes).toHaveProperty('cookieAuth');
    expect(components?.securitySchemes).toHaveProperty('refreshCookieAuth');
    expect(components?.securitySchemes).toHaveProperty('bearerAuth');

    // Verify all paths have tags, summaries, and responses
    const paths = (openApiDocument.paths as Record<string, OpenApiPathItem>) || {};
    for (const [pathKey, pathItem] of Object.entries(paths)) {
      for (const [method, operation] of Object.entries(pathItem)) {
        if (typeof operation !== 'object' || !operation) continue;
        expect(
          operation.responses,
          `Path ${method.toUpperCase()} ${pathKey} must have responses`,
        ).toBeDefined();
        expect(
          operation.summary,
          `Path ${method.toUpperCase()} ${pathKey} must have summary`,
        ).toBeTruthy();
      }
    }
  });
});
