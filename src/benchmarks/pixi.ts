import { Application, Assets, Sprite } from 'pixi.js';
import { report } from './report';
async function start() {
    const app = new Application();
    const [, sheet] = await Promise.all([
        app.init({ width: 640, height: 360, resolution: 1, preference: 'webgl', antialias: true, background: 0xffffff, autoStart: false }),
        Assets.load('./initial/generated/texturePackImages.json'),
    ]);
    document.body.appendChild(app.canvas);
    const gear = new Sprite(sheet.textures['⚙']);
    gear.anchor.set(0.5);
    gear.position.set(320, 180);
    app.stage.addChild(gear);
    app.render();
    report('pixi');
    app.ticker.add((ticker) => { gear.rotation += ticker.deltaMS * Math.PI / 3000; });
    app.start();
}
void start();
