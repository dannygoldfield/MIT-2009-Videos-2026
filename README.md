# MIT 2.009 — All Tests and Selects

- [All Tests](https://mit-2009-videos-2026.pages.dev/tests/): all forty videos, newest first.
- [Selects](https://mit-2009-videos-2026.pages.dev/): items 1, 3, 6, 9, 20, 25, 38, 39, 40, and 41, newest first. This is the link to share with people who may post the videos.

Selects shows only the chosen videos and has no navigation back to All Tests.
The original root URL now shows only Selects, so people who received it earlier
see the chosen videos. The earlier `/selects/` link shows the same collection.
All experiments are at `/tests/`; an old root anchor for an unselected video stays
on Selects and does not redirect to a test. Both pages use the same original MP4s,
posters, and catalog numbers. Video download URLs remain unchanged. To change the picks, edit `assets/SELECTS.json`,
rebuild, and upload the site again.

Forty videos with browser previews and original-quality MP4 downloads. The page
has a light background, simple controls, and links to the separate looping
slideshows where available. The four slideshow videos are silent H.264 MP4s at 30 frames per second.
The two original portrait reel tests are 60 fps with original ticks and a landing chime.
Fourteen newer mixed-team reel tests are 18 seconds at 60 fps and silent.

| Original catalog number | Video | Duration |
| --- | --- | --- |
| 01 | Six teams — Balloon Bloom | 45 seconds |
| 03 | Student headshots | 129.6 seconds |
| 06 | 2025 Finals | 63 seconds |
| 09 | Theme Reveal & Balloon Challenge | 64.4 seconds |
| 18 | Yellow Team — Slot reel A (quick spin) | 8 seconds |
| 19 | Yellow Team — Slot reel B (slow landing) | 11 seconds |
| 20 | All teams — Paper confetti | 18 seconds |
| 21 | All teams — Color bloom | 18 seconds |
| 22 | All teams — Paper confetti · Neighbors visible | 18 seconds |
| 23 | All teams — Color bloom · Neighbors visible | 18 seconds |
| 24 | Blue Team — Confetti shower | 18 seconds |
| 25 | Blue Team — Confetti shower · Neighbors visible | 18 seconds |
| 26 | Blue Team — Analog party poppers | 18 seconds |
| 27 | Blue Team — Analog paper drift | 18 seconds |
| 28 | Blue Team — Six pieces · Gentle sway | 18 seconds |
| 29 | Blue Team — Six pieces · Slow turns | 18 seconds |
| 30 | Blue Team — Digital · Neon Circuit | 18 seconds |
| 31 | Blue Team — Digital · Prism Jackpot | 18 seconds |
| 32 | Blue Team — Digital · Orbit | 18 seconds |
| 33 | Blue Team — Digital · Pixel Party | 18 seconds |
| 34 | Disco A — Mirrorball | 18 seconds |
| 35 | Disco B — Neon Boogie | 18 seconds |
| 36 | Disco C — Pocket Funk | 18 seconds |
| 37 | Disco D — Space Disco | 18 seconds |
| 38 | Blue Team — Neon Circuit · Disco D | 18 seconds |
| 39 | Blue Team — Prism Jackpot · Disco D | 18 seconds |
| 40 | Blue Team — Orbit · Disco D | 18 seconds |
| 41 | Blue Team — Pixel Party · Disco D | 18 seconds |
| 42 | Six teams — Together · Disco D | 18 seconds |
| 43 | Six teams — Color Cascade · Disco D | 18 seconds |
| 44 | Six teams — Center Out · Disco D | 18 seconds |
| 45 | One machine — Slow Bloom · Disco D | 15 seconds |
| 46 | One machine — Color Sweep · Disco D | 15 seconds |
| 47 | One machine — Color Rush · Disco D | 15 seconds |
| 48 | Vertical — Six-window machine · Disco D | 15 seconds |
| 49 | Vertical — One reel builds six · Disco D | 15 seconds |
| 50 | Vertical — Two reels, three rounds · Disco D | 15 seconds |
| 51 | Vertical — Neon Arcade · Disco D | 15 seconds |
| 52 | Vertical — Color Ribbons · Disco D | 15 seconds |
| 53 | Vertical — Pixel Jackpot · Disco D | 15 seconds |

Balloon Bloom uses a 7-second transition and a 0.5-second hold. Student
headshots use 1.2 seconds per photo. 2025 Finals uses 1 second per photo;
Theme Reveal uses 1.4 seconds. Items 01 and 03 loop in the preview player.
The original two reel tests use one column of Yellow Team portraits, bounce at the stop,
and settle on photo 15. The mixed-team tests sample 54 portraits (nine per team). Items 20–21 land on Yellow Team photo 15; items 22–23 land on Blue Team photo 88 and retain partial neighboring portraits above and below. Items 20–23 compare paper confetti with a six-color bloom. Items 24–25 both feature photo 88, settle two seconds sooner, and use six times as many paper particles in a foreground shower; item 24 isolates the winner, while item 25 retains neighboring portraits. Items 26–27 build on item 25 with varied paper shapes and folds, simulated air currents, unequal rebounds, and fixed pools of warm interior lighting from concealed bulbs. Item 26 uses uneven party-popper bursts; item 27 uses a looser drifting shower. Both retain neighboring portraits. Items 28–29 use exactly six large paper pieces, one per team color, released at uneven intervals within 0.31 seconds and falling from top to bottom. They retain photo 88, neighboring portraits, and warm interior lighting. Items 30–33 explore modern digital slot screens: Neon Circuit, Prism Jackpot, Orbit, and Pixel Party. They use the same 54 portraits, land on photo 88 at 12 seconds, retain neighboring portraits, and celebrate with six seconds of LED chases, color pulses, rings, or pixel lights. These appear only in All Tests. Items 34–37 are four original 120 BPM disco sketches, all paired with the unchanged Neon Circuit video for comparison. Each accents the 12-second landing, includes MP3 and WAV downloads, and has matched loudness. These audio auditions are only in All Tests. Items 38–41 are the selected updates to those four digital graphics: blue background glow, slowly changing accents that settle on blue at 12 seconds, plus identical Disco D audio. The copied AAC stream has matching hashes and starts at zero in all four. These four are in Selects; prior silent looks and music auditions remain in All Tests. None of the reel tests loop. Only one preview plays at a time. The original catalog numbering is intentional. The page shows the newest additions first; append future videos to assets/CATALOG.json.

## What is included

- `assets/videos/`: the forty original MP4s, with the Finals filename updated.
- `assets/previews/`: the forty poster images.
- `assets/CATALOG.json`: titles, descriptions, timings, links, and file hashes.
- `assets/audio/`: standalone MP3 and 24-bit WAV disco-beat exports.
- `assets/SELECTS.json`: catalog numbers to show on the share page.
- `build.py`: creates the website and Cloudflare upload ZIP.
- `video-handler.mjs`: serves MP4 playback, seeking, and downloads.
- `preview.mjs` and `local-assets.mjs`: local preview server.
- `tests/`: video delivery and file-integrity checks.

Everything needed to rebuild this collection is in this repository. It does not
depend on a Codex workspace, Downloads folder, or the other 13 video exports.
The source MP4s are tracked once; generated copies and ZIPs are excluded from Git.

## Preview on this Mac

Node.js 22 or later and Python 3.10 or later are required. There are no external
packages to install.

1. Open a terminal in this project folder.
2. Run `npm start`.
3. Open http://127.0.0.1:8792/ in a browser.

Press Control-C in the terminal to stop the preview. You can choose another
port with `PORT=8793 npm start`.

## Make an update

1. Change the text or file references in `assets/CATALOG.json`. For a replacement
   video, copy the MP4 into `assets/videos/`, update its details and SHA-256 hash,
   and update its poster in `assets/previews/`.
2. Run `npm test` to build and check the collection. It checks all forty
   items, Selects membership, complete file hashes, byte-range seeking, and download filenames.
3. Run `npm start` to review the page. Commit source changes to Git when ready.

The collection count comes from the catalog. If adding videos, update the
selection test too. Page layout, styling, and browser controls currently live in `build.py`.

## Update the existing Cloudflare site

1. Run `npm run build`. The upload file will be
   `dist/MIT-2.009-Selected-Videos-Cloudflare.zip`.
2. In Cloudflare, open **Workers & Pages → mit-2009-videos-2026 → Create deployment**.
3. Choose **Production**, upload that ZIP, wait for all files to finish uploading,
   then choose **Save and deploy**.
4. Open both All Tests and Selects and check playback and downloads.

This is a Direct Upload project. Pushing to GitHub backs up source code and media;
it does **not** automatically republish the Cloudflare site. No hosting account
settings or public URLs were changed when this repository was created.

## How the large files are delivered

Cloudflare Pages has a 25 MiB limit per asset. The build splits each original MP4
into 16 MiB parts, and a small Pages Worker streams them as a single MP4 with
support for seeking. There is no video recompression. The parts, compiled worker,
and upload ZIP are generated locally and are not committed.

The site is public, though it asks search engines not to index it. Its existing GitHub
repository is public. Do not add account credentials or student information
beyond the already approved media. Existing photo/slideshow projects and the
separate Test Studio and HPR repositories remain independent.

## Existing looping slideshow links

- [Six teams — Balloon Bloom](https://mit-2009-connect-teams-2026.pages.dev/?transition=bloom-7-hold-0-5)
- [Student headshots](https://mit-2009-student-headshots.pages.dev/)

The 2025 Finals and Theme Reveal cuts are watchable in the collection's video
players; they do not have separate matching slideshow websites.

## Six-reel lecture comparisons

Items 42–44 show six reels across in 16:9: Together, Color Cascade, and Center Out.
Each includes all 108 approved portraits, lands on one expressive portrait per team,
and uses identical Disco D music. Spectrum and Mirrorball join the four earlier
digital styles. All winners are settled by 12 seconds. These are in All Tests only;
Selects is unchanged.

## Unified cabinet tests

Items 45–47 are revised as Slow Bloom, Color Sweep and Color Rush. These compare
three single-color cycling patterns and six-color winning bursts. No text appears
on the machine. Six reels use independent starts, speeds and stopping times:
Yellow 7.5s, Green 8s, Purple 8.5s, Red 9s, Pink 9.5s, Blue 10s. The last reel
completes one winner per team color on the Disco D hit. All are 15 seconds with
five seconds of a large light show. The same catalog numbers and MP4 paths are
preserved. Revision-specific query strings bypass older browser-cached copies.
These remain in All Tests; the ten Selects are unchanged.

## Vertical six-team examples

Items 48–50 compare a six-window 2 × 3 cabinet, one large reel that builds a
six-person grid, and two stacked reels playing three rounds. All are 1080 × 1920,
60 fps and 15 seconds. The same six winners appear in each, with the same music.
The final grid arrives at ten seconds, then celebrates for five seconds.
Item 48 includes all 108 approved photos; 49 and 50 sample 30 and 47 photos.
These are All Tests only.

## Six-window graphic styles

Items 51–53 build on 48 with Neon Arcade, Color Ribbons and Pixel Jackpot.
Each has colored gutters during the spin and a distinct complete cabinet,
frame treatment and six-color celebration. All retain the same 108 photos,
independent reel timing, six winners and exact Disco D audio as 48.
The original 48 remains unchanged. All Tests only.
