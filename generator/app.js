import { STYLES, DURATION, makeRenderer } from './renderer.js';
import { readSoundtrack, exportVideo, supportsExport } from './export.js';

const $ = id => document.getElementById(id);
const presets = [{ style: 'neon', strength: 1 }, { style: 'prism', strength: 1 }, { style: 'pixel', strength: 1 }];
let photos = [], images = [], renders = [], supported = false, busy = false, controller, soundtrackPromise, heldBytes = 0;
const urls = [];
const cards = presets.map((recipe, i) => {
  const card = document.createElement('article'); card.className = 'look';
  card.innerHTML = `<div class="canvas-wrap"><canvas width="270" height="480" aria-label="Option ${i + 1} preview"></canvas><div class="placeholder">Your headshot<br>goes here.</div></div><p class="eyebrow">OPTION ${i + 1}</p><label class="field">Effect<select aria-label="Effect for option ${i + 1}"></select></label><label class="amount" for="strength-${i}">Celebration strength <output>100%</output></label><input id="strength-${i}" aria-label="Celebration strength for option ${i + 1}" type="range" min="50" max="140" step="5" value="100">`;
  const select = card.querySelector('select');
  for (const [value, name] of Object.entries(STYLES)) select.add(new Option(name, value));
  select.value = recipe.style;
  select.addEventListener('change', () => { recipe.style = select.value; rebuild(); });
  card.querySelector('input').addEventListener('input', event => { recipe.strength = Number(event.target.value) / 100; card.querySelector('output').textContent = `${event.target.value}%`; rebuild(); });
  $('cards').append(card); return card;
});
function say(text) { $('status').textContent = text; }
function error(text) { $('error').textContent = text; $('error').hidden = !text; }
function updateControls() {
  $('photos').disabled = busy; $('student').disabled = busy || !photos.length; $('team').disabled = busy;
  $('time').disabled = busy || !photos.length; $('preview').disabled = busy || !photos.length;
  $('generate').disabled = busy || !photos.length || !supported;
  $('batch').disabled = busy || photos.length < 2 || !supported || !('showDirectoryPicker' in window);
  for (const card of cards) for (const input of card.querySelectorAll('input,select')) input.disabled = busy;
  $('cancel').hidden = !busy; $('progress').hidden = !busy;
}
function draw(time) { renders.forEach(render => render(time)); $('time').value = String(time); $('clock').textContent = `${time.toFixed(1)} / 18s`; }
function rebuild() {
  $('music').pause();
  if (!images.length) return;
  renders = cards.map((card, i) => makeRenderer(card.querySelector('canvas'), images, Number($('student').value), { ...presets[i], team: $('team').value }));
  draw(Number($('time').value));
}
async function loadPhotos(files) {
  if (!files.length) return;
  if (files.length > 120) return error('Choose up to 120 headshots at a time.');
  if (files.some(file => !['image/jpeg', 'image/png', 'image/webp'].includes(file.type))) return error('Choose JPG, PNG or WebP headshots.');
  busy = true; updateControls(); error(''); $('music').pause();
  const loaded = [];
  try {
    files.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
    for (let i = 0; i < files.length; i++) {
      say(`Reading headshot ${i + 1} of ${files.length}…`);
      const original = await createImageBitmap(files[i]);
      const scale = Math.min(1, 864 / Math.max(original.width, original.height));
      const canvas = new OffscreenCanvas(Math.max(1, Math.round(original.width * scale)), Math.max(1, Math.round(original.height * scale)));
      const ctx = canvas.getContext('2d'); ctx.imageSmoothingQuality = 'high'; ctx.drawImage(original, 0, 0, canvas.width, canvas.height); original.close();
      loaded.push(await createImageBitmap(canvas));
    }
    images.forEach(image => image.close()); images = loaded; photos = files;
    $('student').replaceChildren(); files.forEach((file, i) => $('student').add(new Option(file.name, String(i))));
    $('photo-count').textContent = `${files.length} headshot${files.length === 1 ? '' : 's'} loaded. Originals stay on your device.`;
    cards.forEach(card => card.querySelector('.placeholder').hidden = true);
    rebuild(); say('Preview the three looks, then make your MP4s.');
  } catch (reason) { loaded.forEach(image => image.close()); error(`Could not read these photos: ${reason.message}`); }
  finally { busy = false; updateControls(); }
}
$('photos').addEventListener('change', event => loadPhotos([...event.target.files]));
$('student').addEventListener('change', rebuild); $('team').addEventListener('change', rebuild);
$('time').addEventListener('input', () => { $('music').pause(); $('music').currentTime = Number($('time').value); draw(Number($('time').value)); });
$('preview').addEventListener('click', async () => {
  try { if (!$('music').paused) $('music').pause(); else { $('music').currentTime = 0; await $('music').play(); } } catch (reason) { error(reason.message); }
});
$('music').addEventListener('play', () => { $('preview').textContent = 'Pause preview'; });
$('music').addEventListener('pause', () => { $('preview').textContent = 'Play all three with music'; });
function animate() { if (images.length && !$('music').paused && !busy) draw(Math.min(DURATION, $('music').currentTime)); requestAnimationFrame(animate); }
requestAnimationFrame(animate);

async function soundtrack() {
  if (!soundtrackPromise) soundtrackPromise = (async () => {
    const response = await fetch('./audio/disco-d.m4a');
    if (!response.ok) throw new Error('Could not load Disco D. Reload and try again.');
    return readSoundtrack(await response.arrayBuffer());
  })().catch(reason => { soundtrackPromise = null; throw reason; });
  return soundtrackPromise;
}
const slug = name => name.replace(/\.[^.]+$/, '').normalize('NFKD').replace(/[^a-zA-Z0-9_-]+/g, '-').replace(/^-|-$/g, '').slice(0, 90) || 'student';
const stamp = () => new Date().toISOString().replace(/[:.]/g, '-');
function recipeFor(index, recipes) { return { version: 1, source: photos[index].name, reelPhotos: photos.map(p => p.name), seconds: 18, fps: 60, width: 1080, height: 1920, landing: 12, audio: 'Disco D — Space Disco; original AAC copied without changes', recipes }; }
function addDownloads(index, outputs, recipes, date) {
  const section = document.createElement('section'); section.className = 'result-set';
  const heading = document.createElement('h2'); heading.textContent = photos[index].name; section.append(heading);
  const list = document.createElement('div'); list.className = 'result-videos';
  outputs.forEach(({ blob, filename }, i) => {
    heldBytes += blob.size;
    const url = URL.createObjectURL(blob); urls.push(url);
    const item = document.createElement('div'); const video = document.createElement('video');
    video.controls = true; video.playsInline = true; video.preload = 'metadata'; video.src = url;
    video.addEventListener('play', () => { $('music').pause(); document.querySelectorAll('#results video').forEach(other => { if (other !== video) other.pause(); }); });
    const link = document.createElement('a'); link.className = 'button'; link.href = url; link.download = filename; link.textContent = `Download ${i + 1} · ${STYLES[recipes[i].style]}`;
    item.append(video, link); list.append(item);
  });
  const settings = new Blob([JSON.stringify(recipeFor(index, recipes), null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(settings); urls.push(url);
  const link = document.createElement('a'); link.className = 'recipe-link'; link.href = url; link.download = `${slug(photos[index].name)}-${date}-settings.json`; link.textContent = 'Download these effect settings';
  section.append(list, link); $('results').prepend(section);
}
async function generate(all = false) {
  error('');
  if (!all && heldBytes > 250_000_000) return error('Download the videos already made, then reload and choose your headshots again to free memory. For a full set, use Export everyone to a folder.');
  let directory;
  if (all) {
    try { directory = await window.showDirectoryPicker({ mode: 'readwrite' }); } catch (reason) { if (reason.name !== 'AbortError') error(reason.message); return; }
  }
  busy = true; controller = new AbortController(); updateControls(); $('music').pause(); $('progress').value = 0;
  const date = stamp(), recipes = presets.map(p => ({ ...p, team: $('team').value }));
  const indices = all ? photos.map((_, i) => i) : [Number($('student').value)];
  let finished = 0;
  try {
    const sound = await soundtrack();
    const folder = directory ? await directory.getDirectoryHandle(`MIT-2.009-Headshots-${date}`, { create: true }) : null;
    for (const index of indices) {
      const outputs = [];
      for (let i = 0; i < recipes.length; i++) {
        if (controller.signal.aborted) throw new DOMException('Export cancelled.', 'AbortError');
        say(`${photos[index].name} · making option ${i + 1} of 3. ${finished} of ${indices.length * 3} finished.`);
        const blob = await exportVideo(images, index, recipes[i], sound, { signal: controller.signal, progress: p => { $('progress').value = (finished + p) / (indices.length * 3); } });
        const filename = `${String(index + 1).padStart(3, '0')}-${slug(photos[index].name)}-${i + 1}-${recipes[i].style}-${date}.mp4`;
        if (folder) {
          const handle = await folder.getFileHandle(filename, { create: true }); const stream = await handle.createWritable(); await stream.write(blob); await stream.close();
        } else outputs.push({ blob, filename });
        finished++;
      }
      if (folder) {
        const handle = await folder.getFileHandle(`${String(index + 1).padStart(3, '0')}-${slug(photos[index].name)}-settings.json`, { create: true });
        const stream = await handle.createWritable(); await stream.write(JSON.stringify(recipeFor(index, recipes), null, 2)); await stream.close();
      } else addDownloads(index, outputs, recipes, date);
    }
    say(folder ? `${finished} MP4s saved in ${folder.name}.` : 'Your three MP4s are ready below. Download them before closing this page.');
    if (!folder) $('results').scrollIntoView({ behavior: 'smooth', block: 'start' });
  } catch (reason) { if (reason.name === 'AbortError') say(`Export stopped. ${finished} complete file${finished === 1 ? '' : 's'}${all ? ' remain in your chosen folder' : ' finished in the interrupted set; make the set again to download all three'}.`); else error(`Could not finish exporting: ${reason.message}`); }
  finally { busy = false; controller = null; updateControls(); }
}
$('generate').addEventListener('click', () => generate(false)); $('batch').addEventListener('click', () => generate(true)); $('cancel').addEventListener('click', () => controller?.abort());
window.addEventListener('beforeunload', event => { if (busy) { event.preventDefault(); event.returnValue = ''; } });
try { supported = typeof OffscreenCanvas !== 'undefined' && await supportsExport(); } catch { supported = false; }
$('compatibility').textContent = supported ? ('showDirectoryPicker' in window ? 'MP4 export is available. Batch export saves three videos per student into a new folder you choose.' : 'MP4 export is available. This browser does not support saving a whole batch to a folder.') : 'This browser cannot create these MP4s. Open this page in a browser with H.264 video export, such as current Chrome or Edge.';
updateControls();
