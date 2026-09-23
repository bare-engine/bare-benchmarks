import { Application, Assets, Container, Sprite, Texture } from 'pixi.js';
import { runRenderBenchmark, SPRITE_SCALE, WIDTH, HEIGHT } from '../../shared/bunnies';
import { GEAR } from '../../shared/image';

const app = new Application();
await Assets.init({ skipDetections: true, preferences: { preferWorkers: false } });
const [, texture] = await Promise.all([
    app.init({ width: WIDTH, height: HEIGHT, resolution: 1, preference: 'webgl', antialias: false, background: 0xffffff }),
    Assets.load<Texture>({ alias: 'gear', src: GEAR, loadParser: 'loadTextures' }),
]);
document.body.appendChild(app.canvas);
const container = new Container();
app.stage.addChild(container);
const sprites: Sprite[] = [];

void runRenderBenchmark('pixi', {
    setCount(sim) {
        while (sprites.length > sim.count) container.removeChild(sprites.pop()!).destroy();
        while (sprites.length < sim.count) {
            const sprite = new Sprite(texture);
            sprite.anchor.set(0.5);
            sprite.scale.set(SPRITE_SCALE);
            container.addChild(sprite);
            sprites.push(sprite);
        }
    },
    apply(sim) {
        for (let i = 0; i < sim.count; i++) {
            const sprite = sprites[i];
            sprite.x = sim.x[i];
            sprite.y = sim.y[i];
            sprite.rotation = sim.rotation[i];
        }
    },
    onFrame(update, rendered) {
        app.ticker.add(update); // NORMAL priority runs before the application's LOW-priority render
        app.renderer.runners.postrender.add({ postrender: rendered });
    },
});
