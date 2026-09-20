import kaplay from 'kaplay';
import { SCALE, SPRITES, loadAtlas } from '../../shared/atlas';
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

// KAPLAY's loadSpriteAtlas(src, jsonUrl) fetches the JSON before starting the image, so load both
// in parallel here and hand it the decoded image with the frame rects.
const image = new Image();
const imageLoaded = new Promise<HTMLImageElement>((resolve, reject) => {
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Could not load the atlas image'));
});
image.src = './initial/generated/texturePackImages.webp';
const [atlas] = await Promise.all([loadAtlas('./initial/generated/texturePackImages.json'), imageLoaded]);
await k.loadSpriteAtlas(image, Object.fromEntries(Object.entries(atlas.frames).map(([name, { frame: f }]) =>
    [name, { x: f.x, y: f.y, width: f.w, height: f.h }])));
for (const [name, x, y] of SPRITES) k.add([k.sprite(name), k.pos(x, y), k.scale(SCALE)]);
k.onDraw(() => report('kaplay'));
