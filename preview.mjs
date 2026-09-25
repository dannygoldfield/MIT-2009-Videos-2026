import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { createVideoHandler } from './video-handler.mjs';
import { localAssets } from './local-assets.mjs';
const manifest = JSON.parse(await readFile(new URL('./video-manifest.json', import.meta.url)));
const handler = createVideoHandler(manifest);
const port = Number(process.env.PORT || 8792);
const env = { ASSETS: localAssets(fileURLToPath(new URL('./site', import.meta.url))) };
createServer(async (req, res) => {
  try {
    const request = new Request(`http://127.0.0.1:${port}` + req.url, { method: req.method, headers: req.headers });
    const response = await handler.fetch(request, env);
    res.writeHead(response.status, Object.fromEntries(response.headers));
    if (response.body) await pipeline(Readable.fromWeb(response.body), res); else res.end();
  } catch (error) {
    if (error.code !== 'ERR_STREAM_PREMATURE_CLOSE') console.error(error.message);
    if (!res.headersSent) res.writeHead(500);
    res.end();
  }
}).listen(port, '127.0.0.1', () => console.log(`Video collection preview: http://127.0.0.1:${port}/`));
