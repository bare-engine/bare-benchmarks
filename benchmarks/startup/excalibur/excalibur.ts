import { Actor, Color, Engine, ImageSource, vec } from 'excalibur';
import { BUNNY } from '../../shared/image';
import { report } from '../../shared/report';

const game = new Engine({
    width: 640,
    height: 360,
    resolution: { width: 640, height: 360 },
    pixelRatio: 1,
    antialiasing: true,
    backgroundColor: Color.White,
    suppressPlayButton: true,
    suppressConsoleBootMessage: true,
});
// Excalibur's loaders pad startup with fixed delays (500 ms after load, plus a play-button/audio-unlock
// wait), so load the image directly and start without one, as its docs allow.
const image = new ImageSource(BUNNY);
await Promise.all([image.load(), game.start()]);
const actor = new Actor({ pos: vec(307, 161), anchor: vec(0, 0) });
actor.graphics.use(image.toSprite());
game.add(actor);
game.once('postframe', () => report('excalibur'));
