import { Application, Sprite, Stage, WEBGL, event, loader, state } from 'melonjs';
import { runRenderBenchmark, SPRITE_SCALE, WIDTH, HEIGHT } from '../../shared/bunnies';
import { GEAR } from '../../shared/image';

const app = new Application(WIDTH, HEIGHT, { parent: 'game', renderer: WEBGL, antiAlias: false, subPixel: true, scale: 1, backgroundColor: '#ffffff', prewarm: false });
await app.init();
await loader.preload([{ name: 'gear', type: 'image', src: GEAR }], undefined, false);

const sprites: Sprite[] = [];
const rotations: number[] = []; // melonJS rotates incrementally, so track what each sprite has been given
state.set(state.PLAY, new Stage({ onResetEvent: () => {
    app.world.backgroundColor.parseCSS('#ffffff');
    void runRenderBenchmark('melon', {
        setCount(sim) {
            while (sprites.length > sim.count) { app.world.removeChild(sprites.pop()!); rotations.pop(); }
            while (sprites.length < sim.count) {
                const sprite = new Sprite(0, 0, { image: 'gear' });
                sprite.scale(SPRITE_SCALE);
                app.world.addChild(sprite);
                sprites.push(sprite);
                rotations.push(0);
            }
        },
        apply(sim) {
            for (let i = 0; i < sim.count; i++) {
                const sprite = sprites[i];
                sprite.pos.x = sim.x[i];
                sprite.pos.y = sim.y[i];
                sprite.rotate(sim.rotation[i] - rotations[i]);
                rotations[i] = sim.rotation[i];
            }
        },
        onFrame(update, rendered) {
            event.on(event.GAME_BEFORE_UPDATE, update);
            event.on(event.GAME_AFTER_DRAW, rendered);
        },
    });
} }));
state.change(state.PLAY, true);
