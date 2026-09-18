import { Actor, Color, Engine, ImageSource, Loader, Sprite, vec } from 'excalibur';
import { report } from './report';

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
const image = new ImageSource('./initial/generated/texturePackImages.webp');
await game.start(new Loader([image]));
const gear = new Actor({ pos: vec(320, 180), angularVelocity: Math.PI / 3 });
gear.graphics.use(new Sprite({ image, sourceView: { x: 2, y: 2, width: 122, height: 122 }, destSize: { width: 122, height: 122 } }));
game.add(gear);
game.once('postframe', () => report('excalibur'));
