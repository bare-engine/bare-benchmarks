import kaplay from 'kaplay';
import { BUNNY } from '../../shared/image';
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

await k.loadSprite('bunny', BUNNY);
k.add([k.sprite('bunny'), k.pos(307, 161)]);
k.onDraw(() => report('kaplay'));
