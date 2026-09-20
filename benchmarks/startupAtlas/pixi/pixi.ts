import { Application, Assets, Sprite } from 'pixi.js';
import { SCALE, SPRITES } from '../../shared/atlas';
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
    for (const [name, x, y] of SPRITES) {
        const sprite = new Sprite(sheet.textures[name]);
        sprite.position.set(x, y);
        sprite.scale.set(SCALE);
        app.stage.addChild(sprite);
    }
    app.renderer.runners.postrender.add({ postrender: () => report('pixi') });
    app.start();
}
void start();
