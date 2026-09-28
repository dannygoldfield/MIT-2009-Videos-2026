# MIT 2.009 Videos 2026

All Tests is the thirty-four-video collection at https://mit-2009-videos-2026.pages.dev/tests/.
Selects is the share page at https://mit-2009-videos-2026.pages.dev/. The earlier /selects/ URL shows the same picks.

- Preserve the catalog items 1, 3, 6, 9, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, and 47 unless requested otherwise.
- Use the names All Tests and Selects. Selects currently contains 1, 3, 6, 9, 20, 25, 38, 39, 40, and 41; change assets/SELECTS.json only when Danny changes his picks.
- Both pages show newest first. Keep existing catalog numbers and MP4 URLs. The root URL must show only Selects; all experiments belong at /tests/. Selects must not link back to experiments.
- Danny chose Disco D (Space Disco) for all four digital graphics, with the pink background glow changed to blue and slowly changing accents that settle on blue at the 12-second landing. Updated items 38–41 are in Selects. Keep their music identical in timing and volume; preserve earlier versions 30–37 in All Tests.
- Item 6 is titled "2025 Finals"; its old working title was Lecture 1.
- Keep source videos unchanged; do not recompress them for storage.
- Edit assets/CATALOG.json for titles, descriptions, and media references.
- site/, dist/, and video-manifest.json are generated; use python3 build.py.
- Run npm test when changing video delivery or the build process.
- The Cloudflare site uses dashboard Direct Upload, not automatic GitHub deployment.
- Keep secrets and credentials out of Git. Do not change unrelated Test Studio or HPR projects.

- Items 42–44 are six-reel widescreen lecture tests, with identical Disco D audio and winners Yellow 15, Red 25, Green 43, Pink 67, Blue 89, Purple 107. They remain in All Tests until selected. Preserve all 108 approved students across each six-reel video.

- Items 45–47 revision 2 are Slow Bloom, Color Sweep and Color Rush: independent reels, no text, three one-color-at-a-time patterns and six-color winning bursts. Stops are Yellow 7.5s, Green 8s, Purple 8.5s, Red 9s, Pink 9.5s, Blue 10s; the last stop triggers the shared Disco D hit. Each is 15s, with the same 108 photos and six winners as 42–44. All Tests only. Preserve MP4 paths and use digest query strings for revised preview/download URLs.
