import './dashboard.css';
declare const __VERSIONS__: Record<string, string>;
const engines = ['bare', 'pixi', 'phaser', 'melon', 'excalibur', 'kaplay', 'littlejs'];
const colors: Record<string, string> = { bare: '#b9ef72', pixi: '#e2497f', phaser: '#5fb4ff', melon: '#ffb454', excalibur: '#c792ea', kaplay: '#ff6b6b', littlejs: '#4dd0c4' };
const names: Record<string, string> = { bare: 'Bare', pixi: 'PixiJS', phaser: 'Phaser', melon: 'MelonJS', excalibur: 'Excalibur', kaplay: 'KAPLAY', littlejs: 'LittleJS' };
const $ = (id: string) => document.getElementById(id)!;
const run = $('run') as HTMLButtonElement;
const cancel = $('cancel') as HTMLButtonElement;
type Sample = { engine: string; ms: number; submittedMs: number; round: number };
let samples: Sample[] = [];
let sizes: Record<string, number> = {};
let metadata: Record<string, unknown> = {};
let failures: string[] = [];
let controller: AbortController | undefined;
const median = (values: number[]) => { const s = [...values].sort((a,b) => a-b); return (s[Math.floor(s.length/2)] + s[Math.floor((s.length-1)/2)]) / 2; };
type Row = { engine: string; value: number; label: string; tip: string };
// Rows with data first, fastest/smallest to slowest/largest; bars are relative to the largest value.
function rows(target: string, list: Row[]) {
    const sorted = [...list].sort((a, b) => (a.value || Infinity) - (b.value || Infinity));
    const longest = Math.max(...list.map(r => r.value), 1);
    $(target).innerHTML = sorted.map(({ engine, value, label, tip }) => {
        const width = value ? Math.max(value / longest * 100, 1) : 0;
        return `<div class="row"><div class="name">${names[engine]}</div><div class="track"><div class="bar" style="width:${width}%;background:${colors[engine]}"></div></div><div class="time">${value ? label : '<small>awaiting</small>'}</div><div class="tip">${tip}</div></div>`;
    }).join('');
}
function draw() {
    const version = (engine: string) => `<span>Version</span><span>${__VERSIONS__[engine]}</span>`;
    rows('results', engines.map(engine => {
        const values = samples.filter(s => s.engine === engine).map(s => s.ms);
        const value = values.length ? median(values) : 0;
        return { engine, value, label: `${value.toFixed(1)} <small>ms</small>`, tip: version(engine)
            + `<span>Range</span><span>${values.length ? `${Math.min(...values).toFixed(1)}–${Math.max(...values).toFixed(1)} ms` : '—'}</span><span>Samples</span><span>${values.length}</span>` };
    }));
    rows('sizes', engines.map(engine => {
        const bytes = sizes[engine] ?? 0;
        return { engine, value: bytes, label: `${(bytes / 1024).toFixed(1)} <small>KB</small>`, tip: version(engine) + `<span>Bytes</span><span>${bytes.toLocaleString()}</span>` };
    }));
}
run.onclick = async () => {
    run.disabled = true; cancel.disabled = false;
    for (const id of ['runs', 'profile']) ($ (id) as HTMLSelectElement).disabled = true;
    samples = []; failures = []; metadata = {}; draw();
    controller = new AbortController();
    $('status').textContent = 'Launching controlled browser…';
    let done = false;
    try {
        const runs = ($('runs') as HTMLSelectElement).value;
        const profile = ($('profile') as HTMLSelectElement).value;
        const response = await fetch(`./api/run?runs=${runs}&profile=${profile}`, { method: 'POST', signal: controller.signal });
        if (!response.ok) throw new Error(await response.text());
        if (!response.headers.get('content-type')?.includes('application/x-ndjson')) throw new Error('Start the local runner with npm start to control cache and network.');
        const reader = response.body!.getReader();
        const decoder = new TextDecoder();
        let pending = '';
        while (true) {
            const chunk = await reader.read();
            if (chunk.done) break;
            pending += decoder.decode(chunk.value, { stream: true });
            let end: number;
            while ((end = pending.indexOf('\n')) >= 0) {
                const event = JSON.parse(pending.slice(0, end)); pending = pending.slice(end + 1);
                if (event.type === 'meta') { metadata = event; $('environment').textContent = `${event.browser} · headless · ${event.network.label} · gzip`; }
                if (event.type === 'progress') $('status').textContent = `${names[event.engine]} · cold cache · round ${event.round} of ${runs}`;
                if (event.type === 'sample') { samples.push(event); draw(); }
                if (event.type === 'failure') failures.push(`${names[event.engine]} round ${event.round}: ${event.error}`);
                if (event.type === 'error') throw new Error(event.error);
                if (event.type === 'done') done = true;
            }
        }
        if (!done) throw new Error('Runner disconnected; partial results retained.');
        $('status').textContent = failures.length ? `Finished with errors: ${failures.join(' ')}` : `Complete · ${runs} cold-cache samples per engine.`;
    } catch (error) {
        const message = controller.signal.aborted ? 'Cancelled; partial results retained.' : String(error);
        failures.push(message); $('status').textContent = message;
    } finally {
        controller = undefined;
        run.disabled = false; cancel.disabled = true;
        for (const id of ['runs', 'profile']) ($(id) as HTMLSelectElement).disabled = false;
    }
};
cancel.onclick = () => controller?.abort();
draw();
// Sizes are measured at build time (see scripts/build.mjs), so they show without running anything.
fetch('./sizes.json').then(r => r.ok ? r.json() : {}).then(data => { sizes = data; draw(); }).catch(() => {});
