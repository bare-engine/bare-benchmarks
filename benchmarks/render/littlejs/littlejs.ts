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
import { runRenderBenchmark, SPRITE_SIZE, WIDTH, HEIGHT } from '../../shared/bunnies';
import { GEAR, GEAR_SIZE } from '../../shared/image';

class Gear extends EngineObject {
    constructor() {
        super(vec2(0, 0), vec2(SPRITE_SIZE, SPRITE_SIZE), new TileInfo(vec2(0, 0), vec2(GEAR_SIZE, GEAR_SIZE), textureInfos[0], 0));
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
const gears: Gear[] = [];
let frameUpdate = () => {};
let frameRendered = () => {};

// LittleJS positions by centre with the camera at the origin, y up; gameRender runs once per frame before
// objects draw and gameRenderPost after, unlike gameUpdate which is a fixed 60 Hz step.
await engineInit(
    () => {
        void runRenderBenchmark('littlejs', {
            setCount(sim) {
                while (gears.length > sim.count) gears.pop()!.destroy();
                while (gears.length < sim.count) gears.push(new Gear());
            },
            apply(sim) {
                for (let i = 0; i < sim.count; i++) {
                    const gear = gears[i];
                    gear.pos.x = sim.x[i] - WIDTH / 2;
                    gear.pos.y = HEIGHT / 2 - sim.y[i];
                    gear.angle = sim.rotation[i];
                }
            },
            onFrame(update, rendered) { frameUpdate = update; frameRendered = rendered; },
        });
    },
    () => {},
    () => {},
    () => frameUpdate(),
    () => frameRendered(),
    [GEAR],
    root,
);
root.style.cssText = `position:relative;width:${WIDTH}px;height:${HEIGHT}px;overflow:hidden;background:#fff`;
