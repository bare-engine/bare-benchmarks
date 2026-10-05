import { Actor, CollisionType, Color, Engine, ImageSource, vec } from 'excalibur';
import { runRenderBenchmark, WIDTH, HEIGHT } from '../../shared/bunnies';
import { BUNNY } from '../../shared/image';

const game = new Engine({
    width: WIDTH,
    height: HEIGHT,
    resolution: { width: WIDTH, height: HEIGHT },
    pixelRatio: 1,
    antialiasing: false,
    backgroundColor: Color.White,
    suppressPlayButton: true,
    suppressConsoleBootMessage: true,
});
const image = new ImageSource(BUNNY);
await Promise.all([image.load(), game.start()]);
const sprite = image.toSprite();
const actors: Actor[] = [];

void runRenderBenchmark('excalibur', {
    setCount(sim) {
        while (actors.length > sim.count) actors.pop()!.kill();
        while (actors.length < sim.count) {
            // Actors are Excalibur's sprite objects; opt out of collision so only the scene graph and renderer are measured.
            const actor = new Actor({ pos: vec(0, 0), anchor: vec(0.5, 0.5), collisionType: CollisionType.PreventCollision });
            actor.graphics.use(sprite);
            game.add(actor);
            actors.push(actor);
        }
    },
    apply(sim) {
        for (let i = 0; i < sim.count; i++) {
            const actor = actors[i];
            actor.pos.x = sim.x[i];
            actor.pos.y = sim.y[i];
            actor.rotation = sim.rotation[i];
        }
    },
    onFrame(update, rendered) {
        game.on('preupdate', update);
        game.on('postframe', rendered);
    },
});
