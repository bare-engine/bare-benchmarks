import { Application, Sprite, Stage, WEBGL, event, loader, state } from 'melonjs';
import { GEAR } from '../../shared/image';
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
await loader.preload([{ name: 'gear', type: 'image', src: GEAR }], undefined, false);

const gear = new Sprite(259, 119, { image: 'gear' });
gear.anchorPoint.set(0, 0);
state.set(state.PLAY, new Stage({ onResetEvent: () => {
    app.world.backgroundColor.parseCSS('#ffffff');
    app.world.addChild(gear);
    event.once(event.GAME_AFTER_DRAW, () => report('melon'));
} }));
state.change(state.PLAY, true);
