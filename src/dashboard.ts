import './dashboard.css';
declare const __VERSIONS__: Record<string, string>;
const engines = ['bare', 'pixi', 'phaser', 'melon', 'excalibur', 'kaplay', 'littlejs'];
const names: Record<string, string> = { bare: 'Bare', pixi: 'PixiJS', phaser: 'Phaser', melon: 'MelonJS', excalibur: 'Excalibur', kaplay: 'KAPLAY', littlejs: 'LittleJS' };
const $ = (id: string) => document.getElementById(id)!;
const run = $('run') as HTMLButtonElement;
const cancel = $('cancel') as HTMLButtonElement;
type Sample = { engine: string; ms: number; submittedMs: number; round: number };
let samples: Sample[] = [];
let metadata: Record<string, unknown> = {};
let failures: string[] = [];
let controller: AbortController | undefined;
const median = (values: number[]) => { const s = [...values].sort((a,b) => a-b); return (s[Math.floor(s.length/2)] + s[Math.floor((s.length-1)/2)]) / 2; };
function draw() {
    const medians = Object.fromEntries(engines.map(engine => {
        const values = samples.filter(s => s.engine === engine).map(s => s.ms);
        return [engine, values.length ? median(values) : 0];
    }));
    const longest = Math.max(...Object.values(medians), 1);
    $('results').innerHTML = engines.map(engine => {
        const values = samples.filter(s => s.engine === engine).map(s => s.ms);
        const value = medians[engine];
        const width = values.length ? Math.max(value / longest * 100, 2) : 0;
        return `<tr><td><strong>${names[engine]}</strong><small>${__VERSIONS__[engine]}</small></td><td class="time">${values.length ? value.toFixed(1) + ' <small>ms</small>' : '—'}<small class="range">${values.length ? `${Math.min(...values).toFixed(1)}–${Math.max(...values).toFixed(1)} ms · ${values.length} samples` : 'Awaiting samples'}</small></td><td class="visual"><div class="track"><div class="bar" style="width:${width}%"></div></div></td></tr>`;
    }).join('');
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
