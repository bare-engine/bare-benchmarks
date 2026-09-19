import { Application, Assets, Sprite } from 'pixi.js';
import { report } from '../../shared/report';
async function start() {
    const app = new Application();
    const [, sheet] = await Promise.all([
        app.init({ width: 640, height: 360, resolution: 1, preference: 'webgl', antialias: true, background: 0xffffff, autoStart: false }),
        Assets.load('./initial/generated/texturePackImages.json'),
    ]);
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
