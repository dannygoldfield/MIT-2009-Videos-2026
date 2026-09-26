import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { createVideoHandler } from '../video-handler.mjs';
import { localAssets } from '../local-assets.mjs';

const root = fileURLToPath(new URL('../site', import.meta.url));
const manifest = JSON.parse(await readFile(new URL('../video-manifest.json', import.meta.url)));
const handler = createVideoHandler(manifest);
const env = { ASSETS: localAssets(root) };
const [path, video] = Object.entries(manifest)[0];
const req = (route = path, options = {}) => new Request('https://example.com' + route, options);

test('All Tests preserves the four slideshows and twelve headshot reel tests', () => {
  assert.equal(Object.keys(manifest).length, 16);
  assert.ok(manifest['/videos/MIT-2.009-2025-Finals-1p0s.mp4']);
  assert.ok(manifest['/videos/MIT-2.009-Yellow-Slot-A-Quick-8s-Portrait-15.mp4']);
  assert.ok(manifest['/videos/MIT-2.009-Yellow-Slot-B-Slow-11s-Portrait-15.mp4']);
  assert.ok(!JSON.stringify(manifest).includes('Lecture'));
});
for (const [route, entry] of Object.entries(manifest)) {
  test('full original bytes: ' + entry.filename, async () => {
    const response = await handler.fetch(req(route), env);
    assert.equal(response.status, 200);
    assert.equal(response.headers.get('Content-Length'), String(entry.size));
    let size = 0;
    const hash = createHash('sha256');
    for await (const chunk of response.body) { hash.update(chunk); size += chunk.byteLength; }
    assert.equal(size, entry.size);
    assert.equal(hash.digest('hex'), entry.sha256);
  });
}
for (const honorRanges of [true, false]) {
  test(`seeking including part boundaries; asset Range support=${honorRanges}`, async () => {
    const all = Buffer.concat(await Promise.all(video.parts.map(p => readFile(root+p.path))));
    const ranges = [[0, 1023], [16777000, 16777400], [video.size-500, video.size-1], [16777216, 16777216]];
    for (const [start, end] of ranges) {
      const response = await handler.fetch(req(path, { headers: { Range: `bytes=${start}-${end}` } }), { ASSETS: localAssets(root, honorRanges) });
      assert.equal(response.status, 206);
      assert.equal(response.headers.get('Content-Range'), `bytes ${start}-${end}/${video.size}`);
      assert.deepEqual(Buffer.from(await response.arrayBuffer()), all.subarray(start,end+1));
    }
    for (const range of ['bytes=-200', `bytes=${video.size-200}-`, `bytes=${video.size-200}-${video.size+900}`]) {
      const response = await handler.fetch(req(path, { headers: { Range: range } }), { ASSETS: localAssets(root, honorRanges) });
      assert.equal(response.status, 206);
      assert.deepEqual(Buffer.from(await response.arrayBuffer()), all.subarray(-200));
    }
  });
}
test('HEAD and named downloads', async () => {
  const response = await handler.fetch(req(path+'?download=1', { method: 'HEAD' }), env);
  assert.equal(response.body, null);
  assert.equal(response.headers.get('Content-Length'), String(video.size));
  assert.equal(response.headers.get('Content-Disposition'), `attachment; filename="${video.filename}"`);
});
test('invalid ranges, unknown files, and methods', async () => {
  for (const Range of ['bytes=-0', 'bytes=999999999-', 'bytes=6-2', 'bytes=-', 'bytes=0-1,4-8', 'junk']) {
    const response = await handler.fetch(req(path, { headers: { Range } }), env);
    assert.equal(response.status, 416);
    assert.equal(response.headers.get('Content-Range'), `bytes */${video.size}`);
  }
  assert.equal((await handler.fetch(req('/videos/unknown.mp4'), env)).status, 404);
  assert.equal((await handler.fetch(req(path, { method: 'POST' }), env)).status, 405);
});
test('conditional requests and static pages', async () => {
  const cached = await handler.fetch(req(path, { headers: { 'If-None-Match': `"${video.sha256}"` } }), env);
  assert.equal(cached.status, 304);
  const mismatch = await handler.fetch(req(path, { headers: { Range: 'bytes=1-9', 'If-Range': '"old"' } }), env);
  assert.equal(mismatch.status, 200);
  await mismatch.body.cancel();
  const index = await handler.fetch(req('/'), env);
  const html = await index.text();
  assert.equal((html.match(/<article/g) || []).length, 16);
  assert.ok(html.includes('2025 Finals'));
  assert.ok(html.includes('16 videos.'));
  assert.ok(html.includes('<h1>All Tests</h1>'));
  assert.ok(html.includes('href="/selects/"'));
  assert.ok(html.includes('With sound'));
  assert.ok(!html.includes('No audio'));
  assert.deepEqual([...html.matchAll(/id="video-(\d+)"/g)].map(m => Number(m[1])), [29,28,27,26,25,24,23,22,21,20,19,18,9,6,3,1]);
  assert.ok(!html.includes('Lecture 1'));
});

test('Selects contains only Danny’s six picks, newest first, using the original files', async () => {
  const response = await handler.fetch(req('/selects/'), env);
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.ok(html.includes('<h1>Selects</h1>'));
  assert.ok(html.includes('6 selected videos. Watch, download, and post.'));
  assert.deepEqual([...html.matchAll(/id="video-(\d+)"/g)].map(m => Number(m[1])), [25,20,9,6,3,1]);
  assert.ok(!html.includes('href="/"'), 'Share page should not lead recipients to experiments');
  const catalog = JSON.parse(await readFile(new URL('../assets/CATALOG.json', import.meta.url)));
  const chosen = catalog.filter(r => [1,3,6,9,20,25].includes(r.number));
  const sources = [...html.matchAll(/<source src="([^"]+)"/g)].map(m => m[1]);
  assert.equal(sources.length, 6);
  for (const r of chosen) {
    const route = '/' + r.file;
    assert.ok(sources.includes(route));
    assert.ok(manifest[route]);
    assert.ok(html.includes(`href="${route}?download=1"`));
    assert.ok(html.includes(`poster="/${r.thumbnail}"`));
  }
});

test('Selects directory redirects and serves HEAD requests in local preview', async () => {
  const redirect = await handler.fetch(req('/selects'), env);
  assert.equal(redirect.status, 301);
  assert.equal(redirect.headers.get('Location'), 'https://example.com/selects/');
  const head = await handler.fetch(req('/selects/', { method: 'HEAD' }), env);
  assert.equal(head.status, 200);
  assert.equal(head.body, null);
  assert.equal(head.headers.get('Content-Type'), 'text/html');
});
