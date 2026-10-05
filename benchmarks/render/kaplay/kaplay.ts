import kaplay, { type GameObj, type PosComp, type RotateComp } from 'kaplay';
import { runRenderBenchmark, WIDTH, HEIGHT } from '../../shared/bunnies';
import { BUNNY } from '../../shared/image';

const k = kaplay({ width: WIDTH, height: HEIGHT, scale: 1, pixelDensity: 1, crisp: false, background: '#ffffff', loadingScreen: false, debug: false, global: false });
await k.loadSprite('bunny', BUNNY);
const objects: GameObj<PosComp | RotateComp>[] = [];
const DEG = 180 / Math.PI;

void runRenderBenchmark('kaplay', {
    setCount(sim) {
        while (objects.length > sim.count) k.destroy(objects.pop()!);
        while (objects.length < sim.count) objects.push(k.add([k.sprite('bunny'), k.pos(0, 0), k.rotate(0), k.anchor('center')]));
    },
    apply(sim) {
        for (let i = 0; i < sim.count; i++) {
            const object = objects[i];
            object.pos.x = sim.x[i];
            object.pos.y = sim.y[i];
            object.angle = sim.rotation[i] * DEG;
        }
    },
    onFrame(update, rendered) {
        k.onUpdate(update);
        k.onDraw(rendered);
    },
});
