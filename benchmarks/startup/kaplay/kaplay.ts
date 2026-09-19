import kaplay from 'kaplay';
import { loadAtlas } from '../../shared/atlas';
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

const atlas = await loadAtlas('./initial/generated/texturePackImages.json');
const { w: sheetW, h: sheetH } = atlas.meta.size;
const names = ['⚙', '📊'];
await k.loadSprite('atlas', './initial/generated/texturePackImages.webp', {
    frames: names.map((name) => {
        const f = atlas.frames[name].frame;
        return k.quad(f.x / sheetW, f.y / sheetH, f.w / sheetW, f.h / sheetH);
    }),
});
k.add([k.sprite('atlas', { frame: 0 }), k.pos(188, 120)]);
k.add([k.sprite('atlas', { frame: 1 }), k.pos(330, 120)]);
k.onDraw(() => report('kaplay'));
