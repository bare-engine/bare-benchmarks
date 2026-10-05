// Bunnymark-style render benchmark shared by every engine page.
//
// The simulation (positions, velocities, wall bounce, spin) lives here in typed arrays and is identical for
// every engine, in the spirit of the Rapid.js benchmark (github.com/nightre/Rapid.js, docs/benchmark). Each
// engine page only supplies an adapter that creates its own sprite objects and copies x/y/rotation into them
// once per frame, so what differs between engines is their scene graph, batching and draw cost.
//
// Headless Chromium caps requestAnimationFrame at the display rate, so frame time cannot go below one vsync
// and "ms per frame" would saturate. The metric is instead the classic bunnymark one: the largest sprite
// count an engine holds at full frame rate. Counts double from START until frames drop, then bisect.
import { BUNNY_WIDTH as SPRITE_WIDTH, BUNNY_HEIGHT as SPRITE_HEIGHT } from './image';

export const WIDTH = 640;
export const HEIGHT = 360;

const START = 1000;
const MAX = 1_000_000;
const BISECTIONS = 3;
const WARMUP_MS = 500;
const SAMPLE_MS = 1000;
const BASELINE_MS = 1000;
const PASS_RATIO = 0.9; // fps at a count must stay within this fraction of the empty-scene fps

export type Sim = {
    count: number;
    x: Float32Array; y: Float32Array;
    vx: Float32Array; vy: Float32Array;
    rotation: Float32Array; spin: Float32Array;
};

export type Adapter = {
    // Make the engine hold exactly sim.count sprites (add or remove), initialised from sim.
    setCount(sim: Sim): void | Promise<void>;
    // Copy sim x/y (sprite centre, canvas pixels) and rotation (radians) into the engine's objects.
    apply(sim: Sim): void;
    // Call update once per frame before the engine renders, and rendered once after it has.
    onFrame(update: () => void, rendered: () => void): void;
};

// Deterministic per count, so every engine gets the same sprites.
function createRandom(seed: number) {
    return () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 0x100000000; };
}

export function createSim(count: number): Sim {
    const random = createRandom(0x2f6e2b1 + count);
    const sim: Sim = { count, x: new Float32Array(count), y: new Float32Array(count), vx: new Float32Array(count), vy: new Float32Array(count), rotation: new Float32Array(count), spin: new Float32Array(count) };
    for (let i = 0; i < count; i++) {
        sim.x[i] = SPRITE_WIDTH / 2 + random() * (WIDTH - SPRITE_WIDTH);
        sim.y[i] = SPRITE_HEIGHT / 2 + random() * (HEIGHT - SPRITE_HEIGHT);
        const angle = random() * Math.PI * 2;
        const speed = 55 + random() * 115;
        sim.vx[i] = Math.cos(angle) * speed;
        sim.vy[i] = Math.sin(angle) * speed;
        sim.rotation[i] = random() * Math.PI * 2;
        sim.spin[i] = (random() < 0.5 ? -1 : 1) * (0.8 + random() * 3.2);
    }
    return sim;
}

export function updateSim(sim: Sim, delta: number) {
    const minX = SPRITE_WIDTH / 2, minY = SPRITE_HEIGHT / 2, maxX = WIDTH - minX, maxY = HEIGHT - minY;
    for (let i = 0; i < sim.count; i++) {
        let x = sim.x[i] + sim.vx[i] * delta;
        let y = sim.y[i] + sim.vy[i] * delta;
        if (x <= minX) { x = minX; sim.vx[i] = Math.abs(sim.vx[i]); } else if (x >= maxX) { x = maxX; sim.vx[i] = -Math.abs(sim.vx[i]); }
        if (y <= minY) { y = minY; sim.vy[i] = Math.abs(sim.vy[i]); } else if (y >= maxY) { y = maxY; sim.vy[i] = -Math.abs(sim.vy[i]); }
        sim.x[i] = x;
        sim.y[i] = y;
        sim.rotation[i] += sim.spin[i] * delta;
    }
}

export async function runRenderBenchmark(engine: string, adapter: Adapter) {
    let sim = createSim(0);
    let previous = 0;
    let frameListener: ((now: number) => void) | undefined;
    adapter.onFrame(
        () => {
            const now = performance.now();
            const delta = previous ? Math.min((now - previous) / 1000, 0.05) : 0;
            previous = now;
            updateSim(sim, delta);
            adapter.apply(sim);
        },
        () => frameListener?.(performance.now()),
    );
    // Average fps over sampleMs after warmupMs, counted from rendered frames.
    const measure = (warmupMs: number, sampleMs: number) => new Promise<number>(resolve => {
        let start = 0, sampleStart = 0, frames = 0;
        frameListener = now => {
            if (!start) { start = now; return; }
            if (!sampleStart) { if (now - start >= warmupMs) sampleStart = now; return; }
            frames++;
            if (now - sampleStart >= sampleMs) { frameListener = undefined; resolve(frames / ((now - sampleStart) / 1000)); }
        };
    });
    const at = async (count: number) => {
        sim = createSim(count);
        await adapter.setCount(sim);
        return measure(WARMUP_MS, SAMPLE_MS);
    };

    const baseline = await measure(WARMUP_MS, BASELINE_MS);
    const target = baseline * PASS_RATIO;
    const steps: { count: number; fps: number }[] = [];
    let pass = 0, passFps = 0, fail = 0;
    for (let count = START; count <= MAX; count *= 2) {
        const fps = await at(count);
        steps.push({ count, fps });
        if (fps < target) { fail = count; break; }
        pass = count; passFps = fps;
    }
    if (fail) {
        for (let i = 0; i < BISECTIONS; i++) {
            const count = Math.round((pass + fail) / 2 / 100) * 100;
            if (count <= pass || count >= fail) break;
            const fps = await at(count);
            steps.push({ count, fps });
            if (fps < target) fail = count; else { pass = count; passFps = fps; }
        }
    }
    const result = { type: 'render-result', engine, value: pass, fps: passFps, baselineFps: baseline, targetFps: target, steps, metric: 'sprites-at-full-frame-rate' };
    (window as any).__benchmarkResult = result;
    parent.postMessage(result, location.origin);
}
