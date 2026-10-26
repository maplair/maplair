// Runs debug/tests/markers-perf.html in headless Chromium and profiles it: prints the
// benchmark results, the time of the rendering phases per benchmark step (from a
// performance trace) and the functions with the most self time (from a CPU profile).
//
// Usage: pnpm build && node build/markers-perf.js [count] [query]
// e.g. `node build/markers-perf.js 5000 'spread=3&culling'`
//
// Map tiles are stubbed with an empty image to keep runs deterministic. Headless
// Chromium composites in software, so compare frame times between runs rather than
// reading them as absolute values. The trace and the CPU profile are written to
// tmp/markers-perf/ and can be loaded into the performance panel of the DevTools.
import {chromium} from 'playwright';
import {createServer} from 'node:http';
import {mkdirSync, readFile, writeFileSync} from 'node:fs';
import {extname, join, resolve} from 'node:path';

const [count = '1000', query = ''] = process.argv.slice(2);
const root = resolve(import.meta.dirname, '..');
const outDir = join(root, 'tmp/markers-perf');
const types = {'.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml'};
const emptyPng = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=', 'base64');
const phases = ['UpdateLayoutTree', 'Layout', 'PrePaint', 'Paint', 'Layerize', 'Commit', 'FireAnimationFrame', 'FunctionCall'];

const server = createServer((req, res) => {
	const file = join(root, decodeURIComponent(new URL(req.url, 'http://localhost').pathname));
	readFile(file, (err, data) => {
		if (err) { res.writeHead(404).end(); return; }
		res.writeHead(200, {'content-type': types[extname(file)] ?? 'application/octet-stream'}).end(data);
	});
}).listen(0);

const browser = await chromium.launch();
const page = await browser.newPage({viewport: {width: 1280, height: 800}});
await page.route('https://tile.openstreetmap.org/**', route => route.fulfill({contentType: 'image/png', body: emptyPng}));
await page.goto(`http://localhost:${server.address().port}/debug/tests/markers-perf.html?${query}`);
await page.fill('#count', count);

const cdp = await page.context().newCDPSession(page);
await cdp.send('Profiler.enable');
await cdp.send('Profiler.setSamplingInterval', {interval: 100});
await browser.startTracing(page, {categories: ['devtools.timeline', 'disabled-by-default-devtools.timeline', 'blink.user_timing']});
await cdp.send('Profiler.start');
await page.click('#run');
await page.waitForSelector('body[data-done]', {timeout: 300000});
const {profile} = await cdp.send('Profiler.stop');
const trace = await browser.stopTracing();
console.log(await page.textContent('#results'));
await browser.close();
server.close();

mkdirSync(outDir, {recursive: true});
const name = `${count}${query ? `-${query.replace(/\W+/g, '_')}` : ''}`;
writeFileSync(join(outDir, `${name}.trace.json`), trace);
writeFileSync(join(outDir, `${name}.cpuprofile`), JSON.stringify(profile));

// time of the rendering phases on the main thread, per step of the benchmark
const events = JSON.parse(trace.toString()).traceEvents;
const mainThread = events.find(e => e.name === 'FireAnimationFrame' || e.name === 'FunctionCall')?.tid;
const steps = {};
for (const begin of events.filter(e => e.ph === 'b' && e.cat.includes('blink.user_timing'))) {
	const end = events.find(e => e.ph === 'e' && e.name === begin.name && e.id2?.local === begin.id2?.local);
	if (!end) { continue; }
	const row = steps[begin.name] = {};
	for (const e of events) {
		if (e.ph === 'X' && e.tid === mainThread && e.ts >= begin.ts && e.ts <= end.ts && phases.includes(e.name)) {
			row[e.name] = (row[e.name] ?? 0) + e.dur / 1000;
		}
	}
	for (const phase in row) { row[phase] = Math.round(row[phase] * 10) / 10; }
}
console.log('\nRendering phases on the main thread (ms):');
console.table(steps);

// functions with the most self time
const nodes = new Map(profile.nodes.map(node => [node.id, node]));
const selfTimes = new Map();
profile.samples.forEach((id, i) => {
	const {functionName, url, lineNumber} = nodes.get(id).callFrame;
	const key = `${functionName || '(anonymous)'} ${url.split('/').pop()}:${lineNumber + 1}`;
	selfTimes.set(key, (selfTimes.get(key) ?? 0) + (profile.timeDeltas[i] ?? 0) / 1000);
});
console.log('Self time (ms):');
for (const [key, time] of [...selfTimes].sort((a, b) => b[1] - a[1]).slice(0, 25)) {
	console.log(time.toFixed(1).padStart(9), key);
}
console.log(`\nTrace and CPU profile written to ${outDir}`);
