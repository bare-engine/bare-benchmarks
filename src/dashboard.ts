import './dashboard.css';
declare const __VERSIONS__: Record<string, string>;
const engines = ['bare', 'pixi', 'phaser'];
const names: Record<string, string> = { bare: 'Bare', pixi: 'PixiJS', phaser: 'Phaser' };
const $ = (id: string) => document.getElementById(id)!;
const run = $('run') as HTMLButtonElement;
const download = $('download') as HTMLButtonElement;
const samples: Record<string, number[]> = {};
const errors: Record<string, string> = {};
const median = (values: number[]) => { const s = [...values].sort((a,b) => a-b); return (s[Math.floor(s.length/2)] + s[Math.floor((s.length-1)/2)]) / 2; };
function draw() {
    const max = Math.max(...engines.map(e => samples[e]?.length ? median(samples[e]) : 0), 1);
    $('results').innerHTML = engines.map(e => {
        const s = samples[e] || [];
        return `<tr><td><strong>${names[e]}</strong><small>${__VERSIONS__[e]}</small></td><td class="time">${s.length ? median(s).toFixed(1) + ' <small>ms</small>' : '—'}</td><td>${s.length ? Math.min(...s).toFixed(1) + '–' + Math.max(...s).toFixed(1) + ' ms' : '—'}</td><td>${s.length}${errors[e] ? ' · failed' : ''}</td><td><div class="bar" style="width:${s.length ? median(s)/max*100 : 0}%"></div></td></tr>`;
    }).join('');
}
function measure(engine: string): Promise<number> {
    return new Promise((resolve, reject) => {
        const frame = document.createElement('iframe');
        frame.title = `${names[engine]} startup scene`;
        let timer: ReturnType<typeof setTimeout>;
        const cleanup = () => { clearTimeout(timer); window.removeEventListener('message', onMessage); document.removeEventListener('visibilitychange', onVisibility); frame.remove(); };
        const onVisibility = () => { if (document.hidden) { cleanup(); reject(new Error('Tab hidden; run again with this tab visible.')); } };
        const onMessage = (event: MessageEvent) => {
            if (event.origin !== location.origin || event.source !== frame.contentWindow || event.data?.type !== 'startup-result' || event.data.engine !== engine) return;
            if (!Number.isFinite(event.data.ms) || event.data.ms <= 0) return;
            cleanup(); resolve(event.data.ms);
        };
        window.addEventListener('message', onMessage);
        document.addEventListener('visibilitychange', onVisibility);
        timer = setTimeout(() => { cleanup(); reject(new Error(`${names[engine]} timed out after 30 seconds. Check its standalone page and browser console.`)); }, 30000);
        frame.src = `./startup/${engine}/index.html?run=${crypto.randomUUID()}`;
        $('stage').replaceChildren(frame);
    });
}
run.onclick = async () => {
    if (document.hidden) return;
    run.disabled = true; download.disabled = true;
    const count = Number(($('runs') as HTMLSelectElement).value);
    for (const e of engines) { samples[e] = []; delete errors[e]; }
    draw();
    let stopped = false;
    for (let round = 0; round < count && !stopped; round++) {
        for (let offset = 0; offset < engines.length; offset++) {
            const engine = engines[(round + offset) % engines.length];
            if (errors[engine]) continue;
            $('status').textContent = `Running ${names[engine]} · round ${round+1} of ${count}`;
            $('current').textContent = `${names[engine]} ${__VERSIONS__[engine]} · 640 × 360`;
            try { samples[engine].push(await measure(engine)); }
            catch (error) { errors[engine] = String(error); if (document.hidden) { stopped = true; break; } }
            draw();
        }
    }
    $('status').textContent = Object.keys(errors).length ? Object.values(errors).join(' ') : `Complete · ${count} samples per engine. Run again to compare.`;
    $('current').textContent = 'Measurement finished. Open a scene below to inspect it.';
    $('stage').innerHTML = engines.map(e => `<a href="./startup/${e}/index.html" target="_blank" rel="noopener">Open ${names[e]} ↗</a>`).join('');
    run.disabled = false; download.disabled = !engines.some(e => samples[e].length);
};
download.onclick = () => {
    const blob = new Blob([JSON.stringify({ measuredAt: new Date().toISOString(), userAgent: navigator.userAgent, cache: 'browser cache enabled; mixed first visit and warm reloads', metric: 'navigation to first render submission, milliseconds', versions: __VERSIONS__, samples, errors }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'startup-results.json'; a.click(); URL.revokeObjectURL(url);
};
draw();
run.click();
