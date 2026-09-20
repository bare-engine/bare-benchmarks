import Phaser from 'phaser';
import { SCALE, SPRITES } from '../../shared/atlas';
import { report } from '../../shared/report';
class Startup extends Phaser.Scene {
    preload() {
        this.load.atlas('atlas', './initial/generated/texturePackImages.webp', './initial/generated/texturePackImages.json');
        this.load.on('loaderror', () => { throw new Error('Could not load the atlas'); });
    }
    create() {
        for (const [name, x, y] of SPRITES) this.add.image(x, y, 'atlas', name).setOrigin(0).setScale(SCALE);
        this.game.events.once(Phaser.Core.Events.POST_RENDER, () => report('phaser'));
    }
}
new Phaser.Game({ type: Phaser.WEBGL, width: 640, height: 360, backgroundColor: '#ffffff', antialias: true, banner: false, audio: { noAudio: true }, scene: Startup });
