import Phaser from 'phaser';
import { report } from '../../shared/report';
class Startup extends Phaser.Scene {
    preload() {
        this.load.atlas('gear', './initial/generated/texturePackImages.webp', './initial/generated/texturePackImages.json');
        this.load.on('loaderror', () => { throw new Error('Could not load the gear atlas'); });
    }
    create() {
        this.add.image(188, 120, 'gear', '⚙').setOrigin(0);
        this.add.image(330, 120, 'gear', '📊').setOrigin(0);
        this.game.events.once(Phaser.Core.Events.POST_RENDER, () => report('phaser'));
    }
}
new Phaser.Game({ type: Phaser.WEBGL, width: 640, height: 360, backgroundColor: '#ffffff', antialias: true, banner: false, audio: { noAudio: true }, scene: Startup });
