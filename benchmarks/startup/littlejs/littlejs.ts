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
import { loadAtlas, type Atlas } from '../../shared/atlas';
import { report } from '../../shared/report';

let atlas: Atlas;
class AtlasSprite extends EngineObject {
    // x/y are screen top-left; LittleJS positions by center with the camera at the origin, y up.
    constructor(name: string, x: number, y: number) {
        const f = atlas.frames[name].frame;
        // tile() treats a vec2 as a grid index, so build the pixel-rect TileInfo directly.
        super(vec2(x + f.w / 2 - 320, 180 - (y + f.h / 2)), vec2(f.w, f.h), new TileInfo(vec2(f.x, f.y), vec2(f.w, f.h), textureInfos[0], 0));
        this.mass = 0; // static: skip the physics/gravity step
    }
}
class Gear extends AtlasSprite {
    constructor() { super('⚙', 188, 120); }
    override render() { super.render(); report('littlejs'); }
}
setCanvasFixedSize(vec2(640, 360));
setCanvasPixelRatio(1);
setCameraScale(1);
setCanvasClearColor(new Color(1, 1, 1, 1));
setShowSplashScreen(false);
glSetAntialias(true);

const root = document.body.appendChild(document.createElement('div'));

// engineInit awaits gameInit, so the JSON fetch overlaps the image load and objects are created once both are in.
const atlasPromise = loadAtlas('./initial/generated/texturePackImages.json');
await engineInit(
    async () => { atlas = await atlasPromise; new Gear(); new AtlasSprite('📊', 330, 120); },
    () => {},
    () => {},
    () => {},
    () => {},
    ['./initial/generated/texturePackImages.webp'],
    root,
);
// engineInit overwrites the root's cssText, so style it afterwards.
root.style.cssText = 'position:relative;width:640px;height:360px;overflow:hidden;background:#fff';
