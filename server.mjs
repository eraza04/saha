import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import os from 'node:os';

const projectRoot = path.dirname(fileURLToPath(import.meta.url));
const preview = process.argv.includes('--dist');
const root = preview ? path.join(projectRoot, 'dist') : projectRoot;
const port = Number(process.env.SAHA_PORT || (preview ? 5174 : 5173));
const types = { '.html':'text/html; charset=utf-8', '.md':'text/plain; charset=utf-8', '.csv':'text/csv; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.mjs':'text/javascript; charset=utf-8', '.css':'text/css; charset=utf-8', '.json':'application/json', '.svg':'image/svg+xml', '.png':'image/png', '.jpg':'image/jpeg', '.webp':'image/webp', '.ico':'image/x-icon', '.webmanifest':'application/manifest+json', '.woff2':'font/woff2' };
const server = http.createServer(async (req, res) => {
  try {
    if (!['GET','HEAD'].includes(req.method)) { res.writeHead(405); res.end('Method not allowed'); return; }
    const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    if (pathname === '/studio') { res.writeHead(308, { Location: '/studio/' }); res.end(); return; }
    if (pathname.split('/').some(p => p.startsWith('.'))) { res.writeHead(404); res.end('Not found'); return; }
    let filename = path.resolve(root, '.' + pathname);
    if (filename !== root && !filename.startsWith(root + path.sep)) { res.writeHead(403); res.end('Forbidden'); return; }
    const info = await stat(filename);
    if (info.isDirectory()) filename = path.join(filename, 'index.html');
    const ext = path.extname(filename).toLowerCase();
    if (!types[ext]) { res.writeHead(404); res.end('Not found'); return; }
    const body = await readFile(filename);
    res.writeHead(200, { 'Content-Type':types[ext], 'Cache-Control':'no-store', 'X-Content-Type-Options':'nosniff' });
    res.end(req.method === 'HEAD' ? undefined : body);
  } catch {
    res.writeHead(404, { 'Content-Type':'text/plain; charset=utf-8' });
    res.end('Not found');
  }
});
server.on('error', error => {
  if (error.code === 'EADDRINUSE') console.error('Port ' + port + ' is already in use. Stop the other Saha server, or set SAHA_PORT to a different port.');
  else console.error(error.message);
  process.exitCode = 1;
});
server.listen(port, '0.0.0.0', () => {
  console.log(preview ? 'Saha static build preview is running. Keep this terminal open.' : 'Saha is running. Keep this terminal open.');
  console.log('Computer: http://localhost:' + port);
  try {
    for (const entries of Object.values(os.networkInterfaces())) {
      for (const entry of entries || []) {
        if (entry.family === 'IPv4' && !entry.internal) console.log('Possible phone address: http://' + entry.address + ':' + port);
      }
    }
  } catch {
    console.log('Network addresses could not be listed. On Windows, use ipconfig to find the Wi-Fi IPv4 address.');
  }
  console.log('Use the Wi-Fi address on a phone connected to the same network. Stop with Ctrl+C.');
});
