import { Application, Assets, Sprite } from 'pixi.js';
import { GEAR } from '../../shared/image';
import { report } from '../../shared/report';
async function start() {
    const app = new Application();
    // SOME OPTIMIZATIONS SPECIFICALLY FOR A QUICK START-UP
    await Assets.init({ skipDetections: true, texturePreference: { format: ['webp'] }, preferences: { preferWorkers: false } });
    const [, texture] = await Promise.all([
        app.init({ width: 640, height: 360, resolution: 1, preference: 'webgl', antialias: true, background: 0xffffff, autoStart: false }),
        Assets.load({ alias: 'gear', src: GEAR, loadParser: 'loadTextures' }),
    ]);
    document.body.appendChild(app.canvas);
    const gear = new Sprite(texture);
    gear.position.set(259, 119);
    app.stage.addChild(gear);
    app.renderer.runners.postrender.add({ postrender: () => report('pixi') });
    app.start();
}
void start();
