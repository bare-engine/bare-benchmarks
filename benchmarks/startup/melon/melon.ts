import { Application, Sprite, Stage, TextureAtlas, WEBGL, event, loader, state } from 'melonjs';
import { report } from '../../shared/report';

const app = new Application(640, 360, {
    parent: 'game',
    renderer: WEBGL,
    antiAlias: true,
    subPixel: true,
    scale: 1,
    backgroundColor: '#ffffff',
    // By default preload() compiles every built-in shader program before completing, meant to hide behind
    // the loading screen this page disables; off, only the programs the first frame uses get compiled.
    prewarm: false,
});

await app.init();
// The third argument skips melonJS's built-in loading stage (dark background + logo).
await loader.preload([
    { name: 'gearImage', type: 'image', src: './initial/generated/texturePackImages.webp' },
    { name: 'gearAtlas', type: 'json', src: './initial/generated/texturePackImages.json' },
], undefined, false);

// AssetPack emits the TexturePacker hash schema; melonJS sniffs meta.app and expects the array flavour.
const packed = loader.getJSON('gearAtlas') as unknown as { meta: Record<string, unknown>; frames: Record<string, object> };
const atlasData = {
    ...packed,
    meta: { ...packed.meta, app: 'texturepacker' },
    frames: Object.entries(packed.frames).map(([filename, frame]) => ({ filename, ...(frame as object) })),
};
const atlas = new TextureAtlas(atlasData, loader.getImage('gearImage')!);
const gear = new Sprite(188, 120, { image: atlas, region: '⚙' });
gear.anchorPoint.set(0, 0);
const chart = new Sprite(330, 120, { image: atlas, region: '📊' });
chart.anchorPoint.set(0, 0);
state.set(state.PLAY, new Stage({ onResetEvent: () => {
    app.world.backgroundColor.parseCSS('#ffffff');
    app.world.addChild(gear);
    app.world.addChild(chart);
    event.once(event.GAME_AFTER_DRAW, () => report('melon'));
} }));
state.change(state.PLAY, true);
