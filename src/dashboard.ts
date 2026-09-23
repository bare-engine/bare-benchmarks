import './dashboard.css';
declare const __VERSIONS__: Record<string, string>;
const engines = ['bare', 'pixi', 'phaser', 'melon', 'excalibur', 'kaplay', 'littlejs'];
const colors: Record<string, string> = { bare: '#3b82f6', pixi: '#e2497f', phaser: '#5fb4ff', melon: '#ffb454', excalibur: '#c792ea', kaplay: '#ff6b6b', littlejs: '#4dd0c4' };
const names: Record<string, string> = { bare: 'Bare', pixi: 'PixiJS', phaser: 'Phaser', melon: 'MelonJS', excalibur: 'Excalibur', kaplay: 'KAPLAY', littlejs: 'LittleJS' };
const $ = (id: string) => document.getElementById(id)!;
type Sample = { engine: string; value: number; round: number; fps?: number; baselineFps?: number };
let sizes: Record<string, number> = {};
const median = (values: number[]) => { const s = [...values].sort((a,b) => a-b); return (s[Math.floor(s.length/2)] + s[Math.floor((s.length-1)/2)]) / 2; };
type Row = { engine: string; value: number; label: string; tip: string };
const version = (engine: string) => `<span>Version</span><span>${__VERSIONS__[engine]}</span>`;
// Rows with data first, best to worst; bars are relative to the largest value.
function rows(target: string, list: Row[], higherIsBetter = false) {
    const sorted = [...list].sort((a, b) => higherIsBetter ? (b.value || 0) - (a.value || 0) : (a.value || Infinity) - (b.value || Infinity));
    const longest = Math.max(...list.map(r => r.value), 1);
    $(target).innerHTML = sorted.map(({ engine, value, label, tip }) => {
        const width = value ? Math.max(value / longest * 100, 1) : 0;
        return `<div class="row"><div class="name">${names[engine]}</div><div class="track"><div class="bar" style="width:${width}%;background:${colors[engine]}"></div></div><div class="time">${value ? label : '<small>awaiting</small>'}</div><div class="tip">${tip}</div></div>`;
    }).join('');
}
function drawSizes() {
    rows('sizes', engines.map(engine => {
        const bytes = sizes[engine] ?? 0;
        return { engine, value: bytes, label: `${(bytes / 1024).toFixed(1)} <small>KB</small>`, tip: version(engine) + `<span>Bytes</span><span>${bytes.toLocaleString()}</span>` };
    }));
}

// One benchmark section: its own controls, status and results list. Sections share the server, which
// runs one benchmark at a time (409 otherwise).
class Bench {
    samples: Sample[] = [];
    failures: string[] = [];
    controller: AbortController | undefined;
    bench: string; unit: string; higherIsBetter: boolean;
    run: HTMLButtonElement; cancel: HTMLButtonElement; runs: HTMLSelectElement; profile: HTMLSelectElement; status: HTMLElement;
    constructor(controls: HTMLElement) {
        this.bench = controls.dataset.bench!;
        this.unit = controls.dataset.unit ?? 'ms';
        this.higherIsBetter = 'higherIsBetter' in controls.dataset;
        this.run = controls.querySelector('.run')!;
        this.cancel = controls.querySelector('.cancel')!;
        this.runs = controls.querySelector('.runs')!;
        this.profile = controls.querySelector('.profile')!;
        this.status = controls.nextElementSibling!.querySelector('.status')!;
        this.run.onclick = () => this.start();
        this.cancel.onclick = () => this.controller?.abort();
        this.draw();
    }
    draw() {
        const format = (v: number) => this.unit === 'ms' ? v.toFixed(1) : Math.round(v).toLocaleString();
        rows(`results-${this.bench}`, engines.map(engine => {
            const mine = this.samples.filter(s => s.engine === engine);
            const values = mine.map(s => s.value);
            const value = values.length ? median(values) : 0;
            const last = mine[mine.length - 1];
            const fps = last?.fps !== undefined ? `<span>Frame rate</span><span>${last.fps.toFixed(1)} of ${last.baselineFps!.toFixed(1)} fps</span>` : '';
            return { engine, value, label: `${format(value)} <small>${this.unit}</small>`, tip: version(engine)
                + `<span>Range</span><span>${values.length ? `${format(Math.min(...values))}–${format(Math.max(...values))} ${this.unit}` : '—'}</span>${fps}<span>Samples</span><span>${values.length}</span>` };
        }), this.higherIsBetter);
    }
    async start() {
        this.run.disabled = true; this.cancel.disabled = false; this.runs.disabled = true; this.profile.disabled = true;
        this.samples = []; this.failures = []; this.draw();
        this.controller = new AbortController();
        this.status.textContent = 'Launching controlled browser…';
        const runs = this.runs.value;
        try {
            const response = await fetch(`./api/run?bench=${this.bench}&runs=${runs}&profile=${this.profile.value}`, { method: 'POST', signal: this.controller.signal });
            if (!response.ok) throw new Error(await response.text());
            if (!response.headers.get('content-type')?.includes('application/x-ndjson')) throw new Error('Start the local runner with npm start to control cache and network.');
            const reader = response.body!.getReader();
            const decoder = new TextDecoder();
            let pending = '';
            let done = false;
            while (true) {
                const chunk = await reader.read();
                if (chunk.done) break;
                pending += decoder.decode(chunk.value, { stream: true });
                let end: number;
                while ((end = pending.indexOf('\n')) >= 0) {
                    const event = JSON.parse(pending.slice(0, end)); pending = pending.slice(end + 1);
                    if (event.type === 'meta') $('environment').textContent = `${event.browser} · headless · ${event.network.label} · gzip`;
                    if (event.type === 'progress') this.status.textContent = `${names[event.engine]} · round ${event.round} of ${runs}`;
                    if (event.type === 'sample') { this.samples.push(event); this.draw(); }
                    if (event.type === 'failure') this.failures.push(`${names[event.engine]} round ${event.round}: ${event.error}`);
                    if (event.type === 'error') throw new Error(event.error);
                    if (event.type === 'done') done = true;
                }
            }
            if (!done) throw new Error('Runner disconnected; partial results retained.');
            this.status.textContent = this.failures.length ? `Finished with errors: ${this.failures.join(' ')}` : `Complete · ${runs} sample${runs === '1' ? '' : 's'} per engine.`;
        } catch (error) {
            this.status.textContent = this.controller.signal.aborted ? 'Cancelled; partial results retained.' : String(error);
        } finally {
            this.controller = undefined;
            this.run.disabled = false; this.cancel.disabled = true; this.runs.disabled = false; this.profile.disabled = false;
        }
    }
}
document.querySelectorAll<HTMLElement>('.controls[data-bench]').forEach(controls => new Bench(controls));
drawSizes();
// Sizes are measured at build time (see scripts/build.mjs), so they show without running anything.
fetch('./sizes.json').then(r => r.ok ? r.json() : {}).then(data => { sizes = data; drawSizes(); }).catch(() => {});
