import { Input, BufferSource, MP4, EncodedPacketSink, Output, Mp4OutputFormat, BufferTarget, CanvasSource, EncodedAudioPacketSource, canEncodeVideo } from 'mediabunny';
import { WIDTH, HEIGHT, FPS, DURATION, makeRenderer } from './renderer.js';

export async function readSoundtrack(buffer) {
  const input = new Input({ source: new BufferSource(buffer), formats: [MP4] });
  try {
    const track = await input.getPrimaryAudioTrack();
    if (!track || track.codec !== 'aac') throw new Error('The shared soundtrack is unavailable.');
    const decoderConfig = await track.getDecoderConfig();
    const packets = [];
    for await (const packet of new EncodedPacketSink(track).packets()) packets.push(packet.clone());
    if (!decoderConfig || !packets.length) throw new Error('Unable to read the shared soundtrack.');
    return { packets, decoderConfig };
  } finally { input.dispose(); }
}

// Reuse these exact AAC packets for every output: no re-encoding, fades or gain changes.
export async function copySoundtrack(source, soundtrack) {
  for (let i = 0; i < soundtrack.packets.length; i++) {
    await source.add(soundtrack.packets[i].clone(), i === 0 ? { decoderConfig: soundtrack.decoderConfig } : undefined);
  }
  source.close();
}

export const supportsExport = () => canEncodeVideo('avc', { width: WIDTH, height: HEIGHT, frameRate: FPS, bitrate: 10_000_000 });

export async function exportVideo(images, winner, recipe, soundtrack, { signal, progress = () => {} } = {}) {
  const canvas = new OffscreenCanvas(WIDTH, HEIGHT);
  const draw = makeRenderer(canvas, images, winner, recipe);
  const output = new Output({ format: new Mp4OutputFormat({ fastStart: 'in-memory' }), target: new BufferTarget() });
  const video = new CanvasSource(canvas, { codec: 'avc', bitrate: 10_000_000, keyFrameInterval: 2 });
  const audio = new EncodedAudioPacketSource('aac');
  output.addVideoTrack(video, { frameRate: FPS }); output.addAudioTrack(audio);
  try {
    await output.start();
    await copySoundtrack(audio, soundtrack);
    for (let frame = 0; frame < DURATION * FPS; frame++) {
      if (signal?.aborted) throw new DOMException('Export cancelled.', 'AbortError');
      draw(frame / FPS); await video.add(frame / FPS, 1 / FPS);
      if (frame % 12 === 0) { progress(frame / (DURATION * FPS)); await new Promise(resolve => setTimeout(resolve, 0)); }
    }
    video.close(); await output.finalize(); progress(1);
    return new Blob([output.target.buffer], { type: 'video/mp4' });
  } catch (error) { await output.cancel().catch(() => {}); throw error; }
}
