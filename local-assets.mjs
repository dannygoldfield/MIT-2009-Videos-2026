import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { Readable } from 'node:stream';

export function localAssets(root, honorRanges = true) {
  return { async fetch(request) {
    const pathname = decodeURIComponent(new URL(request.url).pathname);
    let path = resolve(root, '.' + pathname);
    if (path !== resolve(root) && !path.startsWith(resolve(root) + sep)) return new Response(null, { status: 403 });
    let info;
    try { info = await stat(path); } catch { return new Response(null, { status: 404 }); }
    if (info.isDirectory()) {
      if (!pathname.endsWith('/')) {
        const url = new URL(request.url);
        url.pathname += '/';
        return Response.redirect(url, 301);
      }
      path = resolve(path, 'index.html');
      try { info = await stat(path); } catch { return new Response(null, { status: 404 }); }
    }
    if (!info.isFile()) return new Response(null, { status: 404 });
    const mime = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.jpg': 'image/jpeg', '.bin': 'application/octet-stream', '.mp3': 'audio/mpeg', '.wav': 'audio/wav' }[extname(path)] || 'text/plain';
    const headers = new Headers({ 'Content-Type': mime });
    let start = 0, end = info.size - 1, status = 200;
    const range = /^bytes=(\d+)-(\d+)$/.exec(request.headers.get('Range') || '');
    if (range && honorRanges) {
      start = Number(range[1]); end = Math.min(Number(range[2]), end); status = 206;
      headers.set('Content-Range', `bytes ${start}-${end}/${info.size}`);
    }
    headers.set('Content-Length', String(end - start + 1));
    return new Response(request.method === 'HEAD' ? null : Readable.toWeb(createReadStream(path, { start, end })), { status, headers });
  }};
}
