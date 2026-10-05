import { Application, Sprite, Stage, WEBGL, event, loader, state } from 'melonjs';
import { BUNNY } from '../../shared/image';
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
await loader.preload([{ name: 'bunny', type: 'image', src: BUNNY }], undefined, false);

const bunny = new Sprite(307, 161, { image: 'bunny' });
bunny.anchorPoint.set(0, 0);
state.set(state.PLAY, new Stage({ onResetEvent: () => {
    app.world.backgroundColor.parseCSS('#ffffff');
    app.world.addChild(bunny);
    event.once(event.GAME_AFTER_DRAW, () => report('melon'));
} }));
state.change(state.PLAY, true);
