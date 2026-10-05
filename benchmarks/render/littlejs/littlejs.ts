import {
    Color,
    EngineObject,
    engineInit,
    glSetAntialias,
    setCameraScale,
    setCanvasClearColor,
    setCanvasFixedSize,
    setCanvasPixelRatio,
    setShowSplashScreen,
    textureInfos,
    TileInfo,
    vec2,
} from 'littlejsengine';
import { runRenderBenchmark, WIDTH, HEIGHT } from '../../shared/bunnies';
import { BUNNY, BUNNY_WIDTH, BUNNY_HEIGHT } from '../../shared/image';

class Bunny extends EngineObject {
    constructor() {
        super(vec2(0, 0), vec2(BUNNY_WIDTH, BUNNY_HEIGHT), new TileInfo(vec2(0, 0), vec2(BUNNY_WIDTH, BUNNY_HEIGHT), textureInfos[0], 0));
        this.mass = 0; // static: skip the physics/gravity step
    }
}
setCanvasFixedSize(vec2(WIDTH, HEIGHT));
setCanvasPixelRatio(1);
setCameraScale(1);
setCanvasClearColor(new Color(1, 1, 1, 1));
setShowSplashScreen(false);
glSetAntialias(false);

const root = document.body.appendChild(document.createElement('div'));
const bunnies: Bunny[] = [];
let frameUpdate = () => {};
let frameRendered = () => {};

// LittleJS positions by centre with the camera at the origin, y up; gameRender runs once per frame before
// objects draw and gameRenderPost after, unlike gameUpdate which is a fixed 60 Hz step.
await engineInit(
    () => {
        void runRenderBenchmark('littlejs', {
            setCount(sim) {
                while (bunnies.length > sim.count) bunnies.pop()!.destroy();
                while (bunnies.length < sim.count) bunnies.push(new Bunny());
            },
            apply(sim) {
                for (let i = 0; i < sim.count; i++) {
                    const bunny = bunnies[i];
                    bunny.pos.x = sim.x[i] - WIDTH / 2;
                    bunny.pos.y = HEIGHT / 2 - sim.y[i];
                    bunny.angle = sim.rotation[i];
                }
            },
            onFrame(update, rendered) { frameUpdate = update; frameRendered = rendered; },
        });
    },
    () => {},
    () => {},
    () => frameUpdate(),
    () => frameRendered(),
    [BUNNY],
    root,
);
root.style.cssText = `position:relative;width:${WIDTH}px;height:${HEIGHT}px;overflow:hidden;background:#fff`;
