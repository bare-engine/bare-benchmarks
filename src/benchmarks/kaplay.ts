import kaplay from 'kaplay';
import { report } from './report';

const k = kaplay({
    width: 640,
    height: 360,
    scale: 1,
    pixelDensity: 1,
    crisp: false,
    background: '#ffffff',
    loadingScreen: false,
    debug: false,
    global: false,
});

await k.loadSprite('gear', './initial/generated/texturePackImages.webp', {
    frames: [k.quad(2 / 126, 2 / 126, 122 / 126, 122 / 126)],
});
const gear = k.add([
    k.sprite('gear'),
    k.pos(320, 180),
    k.anchor('center'),
    k.rotate(0),
]);
gear.onUpdate(() => { gear.angle += 60 * k.dt(); });
k.onDraw(() => report('kaplay'));
