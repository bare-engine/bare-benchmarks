import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { gzipSync } from 'node:zlib';
import { runBenchmarks, profiles, benches } from './runner.mjs';

const portIndex = process.argv.indexOf('--port');
const port = portIndex < 0 ? 4173 : Number(process.argv[portIndex + 1]);
const root = resolve('dist');
const baseURL = `http://127.0.0.1:${port}`;
let busy = false;
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.webp': 'image/webp', '.png': 'image/png' };
const server = createServer(async (req, res) => {
    const url = new URL(req.url, baseURL);
    // Local runner accepts requests only from its own UI, and never accepts remote URLs to browse.
    if (req.headers.host !== `127.0.0.1:${port}` && req.headers.host !== `localhost:${port}`) { res.writeHead(403).end(); return; }
    if (url.pathname === '/api/run') {
        if (req.method !== 'POST' || (req.headers.origin !== baseURL && req.headers.origin !== `http://localhost:${port}`)) { res.writeHead(403).end(); return; }
        const runs = Number(url.searchParams.get('runs'));
        const profile = url.searchParams.get('profile');
        const bench = url.searchParams.get('bench') || 'startup';
        if (![1, 3, 10, 30].includes(runs) || !Object.hasOwn(profiles, profile) || !Object.hasOwn(benches, bench)) { res.writeHead(400).end('Invalid run settings'); return; }
        if (busy) { res.writeHead(409).end('Another benchmark is running'); return; }
        busy = true;
        res.writeHead(200, { 'Content-Type': 'application/x-ndjson', 'Cache-Control': 'no-store' });
        res.flushHeaders();
        const controller = new AbortController();
        res.on('close', () => controller.abort());
        const emit = event => { if (!res.destroyed) res.write(JSON.stringify(event) + '\n'); };
        try { await runBenchmarks({ baseURL, bench, runs, profile, emit, signal: controller.signal }); }
        catch (error) { emit({ type: 'error', error: String(error) }); }
        finally { busy = false; res.end(); }
        return;
    }
    if (!['GET', 'HEAD'].includes(req.method)) { res.writeHead(405).end(); return; }
    try {
        const path = resolve(root, '.' + decodeURIComponent(url.pathname) + (url.pathname.endsWith('/') ? 'index.html' : ''));
        if (!path.startsWith(root + sep)) { res.writeHead(403).end(); return; }
        let body = await readFile(path);
        const extension = extname(path);
        const headers = { 'Content-Type': types[extension] || 'application/octet-stream', 'Cache-Control': extension === '.html' ? 'no-store' : 'public, max-age=3600', Vary: 'Accept-Encoding' };
        if (/\bgzip\b/.test(req.headers['accept-encoding'] || '') && ['.html', '.js', '.css', '.json'].includes(extension)) {
            body = gzipSync(body); headers['Content-Encoding'] = 'gzip';
        }
        headers['Content-Length'] = body.length;
        res.writeHead(200, headers).end(req.method === 'HEAD' ? undefined : body);
    } catch { res.writeHead(404).end('Not found'); }
});
server.listen(port, '127.0.0.1', () => console.log(`Benchmark runner: ${baseURL}`));
