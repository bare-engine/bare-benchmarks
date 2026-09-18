let reported = false;
export function report(engine: string) {
    if (reported) return;
    reported = true;
    // Run after the complete render stack, including Bare's final WebGL flush.
    queueMicrotask(() => {
        const ms = performance.now();
        const result = { type: 'startup-result', engine, ms };
        (window as any).__benchmarkResult = result;
        parent.postMessage(result, location.origin);
    });
}
