import { Actor, Color, Engine, ImageSource, Sprite, vec } from 'excalibur';
import { loadAtlas } from '../../shared/atlas';
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
// wait), so load the resources directly and start without one, as its docs allow.
const image = new ImageSource('./initial/generated/texturePackImages.webp');
const [atlas] = await Promise.all([loadAtlas('./initial/generated/texturePackImages.json'), image.load()]);
await game.start();
function addSprite(name: string, x: number, y: number) {
    const f = atlas.frames[name].frame;
    const actor = new Actor({ pos: vec(x, y), anchor: vec(0, 0) });
    actor.graphics.use(new Sprite({ image, sourceView: { x: f.x, y: f.y, width: f.w, height: f.h }, destSize: { width: f.w, height: f.h } }));
    game.add(actor);
}
addSprite('⚙', 188, 120);
addSprite('📊', 330, 120);
game.once('postframe', () => report('excalibur'));
