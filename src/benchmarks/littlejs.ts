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
    tile,
    vec2,
} from 'littlejsengine';
import { report } from './report';

class Gear extends EngineObject {
    constructor() {
        super(vec2(0, 0), vec2(122, 122), tile(0, vec2(122, 122), 0, 2, 0));
        this.mass = 0; // static: skip the physics/gravity step
    }
    override update() { this.angle += Math.PI / 180; }
    override render() { super.render(); report('littlejs'); }
}
setCanvasFixedSize(vec2(640, 360));
setCanvasPixelRatio(1);
setCameraScale(1);
setCanvasClearColor(new Color(1, 1, 1, 1));
setShowSplashScreen(false);
glSetAntialias(true);

const root = document.body.appendChild(document.createElement('div'));

await engineInit(
    () => { new Gear(); },
    () => {},
    () => {},
    () => {},
    () => {},
    ['./initial/generated/texturePackImages.webp'],
    root,
);
// engineInit overwrites the root's cssText, so style it afterwards.
root.style.cssText = 'position:relative;width:640px;height:360px;overflow:hidden;background:#fff';
