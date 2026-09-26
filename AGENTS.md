# MIT 2.009 Videos 2026

All Tests is the twenty-video collection at https://mit-2009-videos-2026.pages.dev/tests/.
Selects is the share page at https://mit-2009-videos-2026.pages.dev/. The earlier /selects/ URL shows the same picks.

- Preserve the catalog items 1, 3, 6, 9, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, and 33 unless requested otherwise.
- Use the names All Tests and Selects. Selects currently contains 1, 3, 6, 9, 20, and 25; change assets/SELECTS.json only when Danny changes his picks.
- Both pages show newest first. Keep existing catalog numbers and MP4 URLs. The root URL must show only Selects; all experiments belong at /tests/. Selects must not link back to experiments.
- Item 6 is titled "2025 Finals"; its old working title was Lecture 1.
- Keep source videos unchanged; do not recompress them for storage.
- Edit assets/CATALOG.json for titles, descriptions, and media references.
- site/, dist/, and video-manifest.json are generated; use python3 build.py.
- Run npm test when changing video delivery or the build process.
- The Cloudflare site uses dashboard Direct Upload, not automatic GitHub deployment.
- Keep secrets and credentials out of Git. Do not change unrelated Test Studio or HPR projects.
