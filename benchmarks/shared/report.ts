let reported = false;
export function report(engine: string) {
    if (reported) return;
    reported = true;
    // Run after the complete render stack, including Bare's final WebGL flush.
    queueMicrotask(() => {
        const submittedMs = performance.now();
        const canvases = Array.from(document.querySelectorAll('canvas')).reverse();
        const gl = canvases.reduce<WebGLRenderingContext | WebGL2RenderingContext | null>((context, canvas) =>
            context
            || (canvas.getContext('webgl2') as WebGL2RenderingContext | null)
            || (canvas.getContext('webgl') as WebGLRenderingContext | null), null);
        if (!gl || gl.isContextLost()) throw new Error('No active WebGL context for first-frame measurement');
        // Deliberately synchronize once: the primary metric includes GPU completion.
        gl.finish();
        const ms = performance.now();
        const result = { type: 'startup-result', engine, value: ms, ms, submittedMs, metric: 'navigation-to-first-gpu-completed-frame' };
        (window as any).__benchmarkResult = result;
        parent.postMessage(result, location.origin);
    });
}
