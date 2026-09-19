import { Application, Assets, Sprite } from 'pixi.js';
import { report } from '../../shared/report';
async function start() {
    const app = new Application();
    // SOME OPTIMIZATIONS SPECIFICALLY FOR A QUICK START-UP
    await Assets.init({ skipDetections: true, texturePreference: { format: ['webp'] }, preferences: { preferWorkers: false } });
    const sheetUrl = './initial/generated/texturePackImages.json';
    const [, assets] = await Promise.all([
        app.init({ width: 640, height: 360, resolution: 1, preference: 'webgl', antialias: true, background: 0xffffff, autoStart: false }),
        Assets.load([sheetUrl, './initial/generated/texturePackImages.webp']),
    ]);
    const sheet = assets[sheetUrl];
    document.body.appendChild(app.canvas);
    const gear = new Sprite(sheet.textures['⚙']);
    gear.position.set(188, 120);
    app.stage.addChild(gear);
    const chart = new Sprite(sheet.textures['📊']);
    chart.position.set(330, 120);
    app.stage.addChild(chart);
    app.renderer.runners.postrender.add({ postrender: () => report('pixi') });
    app.start();
}
void start();
