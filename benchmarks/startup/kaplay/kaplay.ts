import kaplay from 'kaplay';
import { GEAR } from '../../shared/image';
import { report } from '../../shared/report';

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

await k.loadSprite('gear', GEAR);
k.add([k.sprite('gear'), k.pos(259, 119)]);
k.onDraw(() => report('kaplay'));
