import { createLights } from './lights.js';

export const WIDTH = 1080, HEIGHT = 1920, FPS = 60, DURATION = 18, LANDING = 12;
export const STYLES = { neon: 'Neon Circuit', prism: 'Prism Jackpot', orbit: 'Orbit', pixel: 'Pixel Party' };
export const TEAMS = { Yellow: '#F5CE19', Red: '#E8414A', Green: '#38AA6A', Pink: '#F184B6', Blue: '#348DDB', Purple: '#955BCD' };
const smooth = x => { x = Math.max(0, Math.min(1, x)); return x * x * (3 - 2 * x); };
const tileCache = new WeakMap();

// Preserve the original single-reel acceleration, deceleration and landing at 12 seconds.
export function position(time, distance = 53) {
  let t = time - .2;
  const accel = .6, cruise = 5.3, decel = 5.2, settle = .7;
  const speed = (distance + .09) / (.5 * accel + cruise + decel / 4);
  if (t <= 0) return 0;
  if (t < accel) return speed * (t / 2 - accel * Math.sin(Math.PI * t / accel) / (2 * Math.PI));
  t -= accel;
  const a = speed * accel / 2;
  if (t < cruise) return a + speed * t;
  t -= cruise;
  if (t < decel) {
    const u = t / decel;
    return a + speed * cruise + speed * decel / 4 * (1 - (1 - u) ** 4)
      + .023 * Math.exp(-(((u - .70) / .10) ** 2)) * Math.sin((u - .70) * 28);
  }
  t -= decel;
  if (t < settle) {
    const knots = [[0, .09], [.18, -.030], [.39, .010], [.53, -.002], [.7, 0]];
    for (let k = 1; k < knots.length; k++) {
      if (t <= knots[k][0]) {
        const [ta, ya] = knots[k - 1], [tb, yb] = knots[k];
        return distance + ya + (yb - ya) * smooth((t - ta) / (tb - ta));
      }
    }
  }
  return distance;
}

export function reelOrder(count, winner) {
  if (!Number.isInteger(count) || count < 1 || !Number.isInteger(winner) || winner < 0 || winner >= count) throw new Error('Choose a headshot.');
  const others = Array.from({ length: count }, (_, i) => i).filter(i => i !== winner);
  const pool = others.length ? others : [winner];
  return [...Array.from({ length: 53 }, (_, i) => pool[i % pool.length]), winner];
}

export function makeRenderer(canvas, images, winner, { style = 'neon', team = 'Blue', strength = 1 } = {}) {
  if (!STYLES[style] || !TEAMS[team]) throw new Error('Unknown effect or team.');
  const order = reelOrder(images.length, winner);
  const lights = createLights(style, { finishColor: team === 'Blue' ? null : TEAMS[team], strength });
  const ctx = canvas.getContext('2d');
  const tiles = images.map(image => {
    if (tileCache.has(image)) return tileCache.get(image);
    const tile = new OffscreenCanvas(848, 848), c = tile.getContext('2d');
    c.fillStyle = '#080d16'; c.fillRect(0, 0, 848, 848);
    const scale = Math.min(848 / image.width, 848 / image.height);
    c.save(); c.beginPath(); c.roundRect(0, 0, 848, 848, 19); c.clip();
    c.imageSmoothingQuality = 'high';
    c.drawImage(image, (848 - image.width * scale) / 2, (848 - image.height * scale) / 2, image.width * scale, image.height * scale);
    c.restore(); tileCache.set(image, tile); return tile;
  });
  const motion = new OffscreenCanvas(canvas.width, canvas.height), mctx = motion.getContext('2d');
  const sample = new OffscreenCanvas(canvas.width, canvas.height), sctx = sample.getContext('2d');
  sctx.setTransform(canvas.width / WIDTH, 0, 0, canvas.height / HEIGHT, 0, 0);
  function reel(t) {
    sctx.clearRect(0, 0, WIDTH, HEIGHT);
    const pos = position(t);
    for (let j = Math.floor(pos) - 2; j <= Math.ceil(pos) + 2; j++) {
      const y = 960 + (pos - j) * 876 - 424;
      if (y > HEIGHT || y + 848 < 0) continue;
      sctx.drawImage(tiles[order[((j % order.length) + order.length) % order.length]], 116, y);
    }
  }
  return time => {
    const t = Math.max(0, Math.min(DURATION, time));
    ctx.setTransform(canvas.width / WIDTH, 0, 0, canvas.height / HEIGHT, 0, 0);
    lights.back(ctx, t, t - LANDING);
    const speed = Math.abs(position(t + 1 / 120) - position(Math.max(0, t - 1 / 120))) * 60;
    const samples = speed > 2 ? 3 : 1;
    mctx.clearRect(0, 0, canvas.width, canvas.height);
    mctx.globalCompositeOperation = 'lighter'; mctx.globalAlpha = 1 / samples;
    for (let k = 0; k < samples; k++) {
      const offset = samples === 1 ? 0 : ((k + .5) / samples - .5) / FPS * .32;
      reel(Math.max(0, t + offset)); mctx.drawImage(sample, 0, 0);
    }
    mctx.globalCompositeOperation = 'source-over'; mctx.globalAlpha = 1;
    ctx.save(); ctx.beginPath(); ctx.roundRect(105, 202, 870, 1516, 32); ctx.clip();
    ctx.drawImage(motion, 0, 0, WIDTH, HEIGHT);
    ctx.restore(); lights.front(ctx, t, t - LANDING);
  };
}
