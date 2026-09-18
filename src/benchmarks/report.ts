let reported = false;
export function report(engine: string) {
    if (reported) return;
    reported = true;
    // Run after the complete render stack, including Bare's final WebGL flush.
    queueMicrotask(() => {
        const submittedMs = performance.now();
        const canvas = document.querySelector('canvas')!;
        const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
        if (!gl || gl.isContextLost()) throw new Error('No active WebGL context for first-frame measurement');
        // Deliberately synchronize once: the primary metric includes GPU completion.
        gl.finish();
        const ms = performance.now();
        const result = { type: 'startup-result', engine, ms, submittedMs, metric: 'navigation-to-first-gpu-completed-frame' };
        (window as any).__benchmarkResult = result;
        parent.postMessage(result, location.origin);
    });
}
