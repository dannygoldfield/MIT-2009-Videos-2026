import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { Input, BufferSource, MP4, EncodedPacketSink, Output, Mp4OutputFormat, BufferTarget, EncodedAudioPacketSource } from 'mediabunny';
import { reelOrder, position, LANDING, DURATION } from '../generator/renderer.js';
import { readSoundtrack, copySoundtrack } from '../generator/export.js';

test('every uploaded student can be selected as the landing portrait, including the first and last', () => {
  for (const count of [1, 3, 54, 108, 120]) for (let winner = 0; winner < count; winner++) {
    const order = reelOrder(count, winner);
    assert.equal(order.length, 54); assert.equal(order[53], winner);
    assert.ok(order.every(i => i >= 0 && i < count));
    if (count > 1) assert.ok(!order.slice(0, -1).includes(winner));
  }
  assert.throws(() => reelOrder(0, 0)); assert.throws(() => reelOrder(3, 3));
});
test('all looks settle exactly at the soundtrack hit and hold through the celebration', () => {
  assert.equal(position(0), 0);
  for (const t of [LANDING, 12.5, 15, DURATION]) assert.equal(position(t), 53);
  for (let t = 0; t <= DURATION; t += .01) assert.ok(Number.isFinite(position(t)));
  for (const t of [.2, .8, 6.1, 11.3, 12]) assert.ok(Math.abs(position(t - .00001) - position(t + .00001)) < .01);
});

test('all three exports preserve every AAC packet and its timing without re-encoding', async () => {
  const buffer = await readFile(new URL('../generator/audio/disco-d.m4a', import.meta.url));
  const original = await readSoundtrack(buffer);
  const signature = sound => sound.packets.map(p => ({ timestamp: p.timestamp, duration: p.duration, hash: createHash('sha256').update(p.data).digest('hex') }));
  for (let i = 0; i < 3; i++) {
    const output = new Output({ format: new Mp4OutputFormat({ fastStart: 'in-memory' }), target: new BufferTarget() });
    const source = new EncodedAudioPacketSource('aac'); output.addAudioTrack(source);
    await output.start(); await copySoundtrack(source, original); await output.finalize();
    const copied = await readSoundtrack(output.target.buffer);
    assert.deepEqual(signature(copied), signature(original));
  }
  const input = new Input({ source: new BufferSource(await readFile(new URL('../assets/videos/MIT-2.009-Neon-Circuit-Disco-Space-Disco-18s.mp4', import.meta.url))), formats: [MP4] });
  try {
    const track = await input.getPrimaryAudioTrack(); const packets = [];
    for await (const p of new EncodedPacketSink(track).packets()) packets.push(p);
    assert.deepEqual(signature({ packets }), signature(original), 'Generator music must match the original selected Disco D soundtrack');
  } finally { input.dispose(); }
});

test('the deployed generator has its page, bundled app, stylesheet and soundtrack', async () => {
  for (const path of ['generator/index.html', 'generator/app.js', 'generator/style.css', 'generator/audio/disco-d.m4a']) assert.ok((await readFile(new URL('../vercel-site/' + path, import.meta.url))).length > 0);
  const html = await readFile(new URL('../vercel-site/generator/index.html', import.meta.url), 'utf8');
  assert.ok(html.includes('href="/tests/"') && html.includes('href="/selects/"'));
  const bundle = await readFile(new URL('../vercel-site/generator/app.js', import.meta.url), 'utf8');
  assert.ok(!/from\s*["']mediabunny["']/.test(bundle));
});
