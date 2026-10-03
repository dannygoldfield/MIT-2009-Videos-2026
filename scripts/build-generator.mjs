import { build } from 'esbuild';
import { cp, mkdir, readFile, writeFile } from 'node:fs/promises';
await mkdir('vercel-site/generator', { recursive: true });
for (const file of ['index.html', 'style.css', 'audio']) await cp(`generator/${file}`, `vercel-site/generator/${file}`, { recursive: true });
await build({ entryPoints: ['generator/app.js'], outfile: 'vercel-site/generator/app.js', bundle: true, format: 'esm', target: 'es2022', minify: true, legalComments: 'eof' });
await writeFile('vercel-site/generator/mediabunny-LICENSE.txt', await readFile('node_modules/mediabunny/LICENSE'));
const testsPage = await readFile('vercel-site/tests/index.html', 'utf8');
await writeFile('vercel-site/tests/index.html', testsPage.replace('</nav>', '<a href="/generator/">Headshot generator <span aria-hidden="true">↗</span></a></nav>'));
console.log('Built focused headshot generator at /generator/.');
