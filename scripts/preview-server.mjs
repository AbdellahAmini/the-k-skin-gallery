#!/usr/bin/env node
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadEnv } from 'vite';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const clientDir = path.join(root, 'dist', 'client');
const fileEnv = loadEnv('production', root, '');
const apiOrigin = (process.env.GALLERY_API_ORIGIN || fileEnv.GALLERY_API_ORIGIN || 'http://127.0.0.1:8000').replace(/\/$/, '');
const host = process.env.HOST || '0.0.0.0';
const port = Number(process.env.PORT || 4173);

const contentTypes = {
  '.css': 'text/css; charset=utf-8', '.html': 'text/html; charset=utf-8', '.ico': 'image/x-icon',
  '.jpeg': 'image/jpeg', '.jpg': 'image/jpeg', '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.png': 'image/png', '.svg': 'image/svg+xml',
  '.txt': 'text/plain; charset=utf-8', '.webp': 'image/webp', '.avif': 'image/avif', '.xml': 'application/xml; charset=utf-8',
};

async function resolveStaticFile(pathname) {
  const segments = pathname.split('/').filter(Boolean);
  const candidate = path.resolve(clientDir, ...segments);
  if (candidate !== clientDir && !candidate.startsWith(`${clientDir}${path.sep}`)) return null;
  try {
    const info = await stat(candidate);
    if (info.isDirectory()) return path.join(candidate, 'index.html');
    if (info.isFile()) return candidate;
  } catch {}
  return null;
}

async function serveFile(request, response, filename) {
  const body = await readFile(filename);
  const extension = path.extname(filename).toLowerCase();
  const immutableAsset = filename.includes(`${path.sep}assets${path.sep}`);
  response.writeHead(200, {
    'Content-Type': contentTypes[extension] || 'application/octet-stream',
    'Content-Length': body.length,
    'Cache-Control': immutableAsset ? 'public, max-age=31536000, immutable' : 'no-cache',
    'X-Content-Type-Options': 'nosniff',
  });
  response.end(request.method === 'HEAD' ? undefined : body);
}

async function proxyApi(request, response, url) {
  const headers = new Headers();
  for (const name of ['accept', 'authorization', 'content-type', 'cookie', 'x-request-id']) {
    const value = request.headers[name];
    if (typeof value === 'string') headers.set(name, value);
  }
  let body;
  if (!['GET', 'HEAD'].includes(request.method)) {
    const chunks = [];
    for await (const chunk of request) chunks.push(chunk);
    body = Buffer.concat(chunks);
  }
  const upstream = await fetch(`${apiOrigin}${url.pathname}${url.search}`, {
    method: request.method, headers, body,
  });
  const responseHeaders = { 'X-Content-Type-Options': 'nosniff' };
  const contentType = upstream.headers.get('content-type');
  if (contentType) responseHeaders['Content-Type'] = contentType;
  const cacheControl = upstream.headers.get('cache-control');
  if (cacheControl) responseHeaders['Cache-Control'] = cacheControl;
  const cookies = upstream.headers.getSetCookie?.() || [];
  if (cookies.length) responseHeaders['Set-Cookie'] = cookies;
  const payload = ['HEAD', '204', '304'].includes(request.method) || [204, 304].includes(upstream.status)
    ? undefined : Buffer.from(await upstream.arrayBuffer());
  if (payload) responseHeaders['Content-Length'] = payload.length;
  response.writeHead(upstream.status, responseHeaders);
  response.end(payload);
}

const server = createServer(async (request, response) => {
  try {
    const url = new URL(request.url || '/', `http://${request.headers.host || 'localhost'}`);
    if (url.pathname === '/api' || url.pathname.startsWith('/api/')) {
      await proxyApi(request, response, url);
      return;
    }
    if (!['GET', 'HEAD'].includes(request.method)) {
      response.writeHead(405, { Allow: 'GET, HEAD' });
      response.end('Method not allowed');
      return;
    }
    const pathname = decodeURIComponent(url.pathname);
    const filename = await resolveStaticFile(pathname);
    if (filename) {
      await serveFile(request, response, filename);
      return;
    }
    if (request.headers.accept?.includes('text/html')) {
      await serveFile(request, response, path.join(clientDir, 'index.html'));
      return;
    }
    response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    response.end('Not found');
  } catch (error) {
    response.writeHead(502, { 'Content-Type': 'application/json; charset=utf-8' });
    response.end(JSON.stringify({ detail: error.message || 'Preview request failed' }));
  }
});

server.listen(port, host, () => {
  console.log(`Gallery production preview: http://127.0.0.1:${port}`);
  console.log(`Static routes and /api proxy → ${apiOrigin}`);
});
