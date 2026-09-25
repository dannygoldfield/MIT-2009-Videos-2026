# MIT 2.009 — Videos to share

[Open the public collection](https://mit-2009-videos-2026.pages.dev/)

Four videos with browser previews and original-quality MP4 downloads. The page
has a light background, simple controls, and links to the separate looping
slideshows where available. Videos are silent H.264 MP4s at 30 frames per second.

| Original catalog number | Video | Duration |
| --- | --- | --- |
| 01 | Six teams — Balloon Bloom | 45 seconds |
| 03 | Student headshots | 129.6 seconds |
| 06 | 2025 Finals | 63 seconds |
| 09 | Theme Reveal & Balloon Challenge | 64.4 seconds |

Balloon Bloom uses a 7-second transition and a 0.5-second hold. Student
headshots use 1.2 seconds per photo. 2025 Finals uses 1 second per photo;
Theme Reveal uses 1.4 seconds. Items 01 and 03 loop in the preview player.
Only one preview plays at a time. The original catalog numbering is intentional.

## What is included

- `assets/videos/`: the four original MP4s, with the Finals filename updated.
- `assets/previews/`: the four poster images.
- `assets/CATALOG.json`: titles, descriptions, timings, links, and file hashes.
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
2. Run `npm test` to build and check the collection. It checks the four selected
   items, complete file hashes, byte-range seeking, and download filenames.
3. Run `npm start` to review the page. Commit source changes to Git when ready.

The current layout and tests deliberately describe the approved four-video
selection. If adding videos, update the page's collection count and the selection
test too. Page layout, styling, and browser controls currently live in `build.py`.

## Update the existing Cloudflare site

1. Run `npm run build`. The upload file will be
   `dist/MIT-2.009-Selected-Videos-Cloudflare.zip`.
2. In Cloudflare, open **Workers & Pages → mit-2009-videos-2026 → Create deployment**.
3. Choose **Production**, upload that ZIP, wait for all files to finish uploading,
   then choose **Save and deploy**.
4. Open https://mit-2009-videos-2026.pages.dev/ and check playback and downloads.

This is a Direct Upload project. Pushing to GitHub backs up source code and media;
it does **not** automatically republish the Cloudflare site. No hosting account
settings or public URLs were changed when this repository was created.

## How the large files are delivered

Cloudflare Pages has a 25 MiB limit per asset. The build splits each original MP4
into 16 MiB parts, and a small Pages Worker streams them as a single MP4 with
support for seeking. There is no video recompression. The parts, compiled worker,
and upload ZIP are generated locally and are not committed.

The site is public, though it asks search engines not to index it. Its GitHub
repository is private. Do not add account credentials or student information
beyond the already approved media. Existing photo/slideshow projects and the
separate Test Studio and HPR repositories remain independent.

## Existing looping slideshow links

- [Six teams — Balloon Bloom](https://mit-2009-connect-teams-2026.pages.dev/?transition=bloom-7-hold-0-5)
- [Student headshots](https://mit-2009-student-headshots.pages.dev/)

The 2025 Finals and Theme Reveal cuts are watchable in the collection's video
players; they do not have separate matching slideshow websites.
