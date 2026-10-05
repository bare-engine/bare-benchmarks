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
import { BUNNY, BUNNY_WIDTH, BUNNY_HEIGHT } from '../../shared/image';
import { report } from '../../shared/report';

class Bunny extends EngineObject {
    constructor() {
        // Screen top-left (307, 161); LittleJS positions by center with the camera at the origin, y up.
        // tile() treats a vec2 as a grid index, so build the pixel-rect TileInfo directly.
        super(vec2(307 + BUNNY_WIDTH / 2 - 320, 180 - (161 + BUNNY_HEIGHT / 2)), vec2(BUNNY_WIDTH, BUNNY_HEIGHT), new TileInfo(vec2(0, 0), vec2(BUNNY_WIDTH, BUNNY_HEIGHT), textureInfos[0], 0));
        this.mass = 0; // static: skip the physics/gravity step
    }
    override render() { super.render(); report('littlejs'); }
}
setCanvasFixedSize(vec2(640, 360));
setCanvasPixelRatio(1);
setCameraScale(1);
setCanvasClearColor(new Color(1, 1, 1, 1));
setShowSplashScreen(false);
glSetAntialias(true);

const root = document.body.appendChild(document.createElement('div'));

await engineInit(() => { new Bunny(); }, () => {}, () => {}, () => {}, () => {}, [BUNNY], root);
// engineInit overwrites the root's cssText, so style it afterwards.
root.style.cssText = 'position:relative;width:640px;height:360px;overflow:hidden;background:#fff';
