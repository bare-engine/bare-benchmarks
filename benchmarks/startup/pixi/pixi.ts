import { Application, Assets, Sprite } from 'pixi.js';
import { BUNNY } from '../../shared/image';
import { report } from '../../shared/report';
async function start() {
    const app = new Application();
    // SOME OPTIMIZATIONS SPECIFICALLY FOR A QUICK START-UP
    await Assets.init({ skipDetections: true, texturePreference: { format: ['png'] }, preferences: { preferWorkers: false } });
    const [, texture] = await Promise.all([
        app.init({ width: 640, height: 360, resolution: 1, preference: 'webgl', antialias: true, background: 0xffffff, autoStart: false }),
        Assets.load({ alias: 'bunny', src: BUNNY, loadParser: 'loadTextures' }),
    ]);
    document.body.appendChild(app.canvas);
    const bunny = new Sprite(texture);
    bunny.position.set(307, 161);
    app.stage.addChild(bunny);
    app.renderer.runners.postrender.add({ postrender: () => report('pixi') });
    app.start();
}
void start();
