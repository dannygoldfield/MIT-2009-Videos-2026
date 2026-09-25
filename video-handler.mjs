// Serve unchanged MP4 bytes from Pages assets smaller than its per-file limit.
export function createVideoHandler(videos) {
  return {
    async fetch(request, env, context = { waitUntil() {} }) {
      const url = new URL(request.url);
      if (!url.pathname.startsWith('/videos/')) return env.ASSETS.fetch(request);
      const video = videos[url.pathname];
      if (!video) return new Response('Video not found', { status: 404 });
      if (!['GET', 'HEAD'].includes(request.method)) {
        return new Response('Method not allowed', { status: 405, headers: { Allow: 'GET, HEAD' } });
      }
      const etag = `"${video.sha256}"`;
      const headers = new Headers({
        'Content-Type': 'video/mp4',
        'Accept-Ranges': 'bytes',
        'Cache-Control': 'public, max-age=3600',
        'ETag': etag,
        'X-Content-Type-Options': 'nosniff',
        'X-Robots-Tag': 'noindex',
        'Content-Disposition': `${url.searchParams.get('download') === '1' ? 'attachment' : 'inline'}; filename="${video.filename}"`,
      });
      if ((request.headers.get('If-None-Match') || '').split(',').map(s => s.trim()).includes(etag)) {
        return new Response(null, { status: 304, headers });
      }
      let start = 0, end = video.size - 1, partial = false;
      const range = request.headers.get('Range');
      const ifRange = request.headers.get('If-Range');
      if (range && request.method === 'GET' && (!ifRange || ifRange === etag)) {
        const match = /^bytes=(\d*)-(\d*)$/i.exec(range.trim());
        let valid = !!match && !!(match[1] || match[2]);
        if (valid) {
          if (!match[1]) {
            const suffix = Number(match[2]);
            valid = Number.isSafeInteger(suffix) && suffix > 0;
            start = Math.max(0, video.size - suffix);
          } else {
            start = Number(match[1]);
            end = match[2] ? Math.min(Number(match[2]), end) : end;
            valid = Number.isSafeInteger(start) && Number.isSafeInteger(end) && start <= end && start < video.size;
          }
        }
        if (!valid) {
          headers.set('Content-Range', `bytes */${video.size}`);
          return new Response(null, { status: 416, headers });
        }
        partial = true;
        headers.set('Content-Range', `bytes ${start}-${end}/${video.size}`);
      }
      const length = end - start + 1;
      headers.set('Content-Length', String(length));
      if (request.method === 'HEAD') return new Response(null, { headers });

      // Read one asset at a time. No whole-video buffering, and seeking only
      // requests parts that overlap the requested interval.
      async function* bytes() {
        let offset = 0;
        for (const part of video.parts) {
          const partEnd = offset + part.size - 1;
          if (end < offset) break;
          if (start <= partEnd) {
            const from = Math.max(0, start - offset);
            const to = Math.min(part.size - 1, end - offset);
            const assetUrl = new URL(part.path, url.origin);
            const response = await env.ASSETS.fetch(new Request(assetUrl, {
              headers: { Range: `bytes=${from}-${to}` },
            }));
            if (![200, 206].includes(response.status) || !response.body) throw new Error('Video asset unavailable');
            const expectedRange = `bytes ${from}-${to}/${part.size}`;
            if (response.status === 206 && response.headers.get('Content-Range') !== expectedRange) {
              await response.body.cancel();
              throw new Error('Unexpected asset range');
            }
            let skip = response.status === 206 ? 0 : from;
            let remaining = to - from + 1;
            const reader = response.body.getReader();
            try {
              while (remaining > 0) {
                const { value, done } = await reader.read();
                if (done) throw new Error('Incomplete video asset');
                if (skip >= value.byteLength) { skip -= value.byteLength; continue; }
                const chunk = value.subarray(skip, Math.min(value.byteLength, skip + remaining));
                skip = 0;
                remaining -= chunk.byteLength;
                yield chunk;
              }
            } finally {
              await reader.cancel();
              reader.releaseLock();
            }
          }
          offset += part.size;
        }
      }
      const iterator = bytes();
      const stream = new ReadableStream({
        async pull(controller) {
          try {
            const next = await iterator.next();
            if (next.done) controller.close(); else controller.enqueue(next.value);
          } catch (error) { controller.error(error); }
        },
        async cancel() { await iterator.return(); },
      });
      // Cloudflare derives Content-Length from this stream type. A regular
      // stream is also supported so the same handler runs in local tests.
      let body = stream;
      if (typeof FixedLengthStream !== 'undefined') {
        const fixed = new FixedLengthStream(length);
        context.waitUntil(stream.pipeTo(fixed.writable).catch(() => {}));
        body = fixed.readable;
      }
      return new Response(body, { status: partial ? 206 : 200, headers });
    },
  };
}
