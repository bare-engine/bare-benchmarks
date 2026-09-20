import Phaser from 'phaser';
import { GEAR } from '../../shared/image';
import { report } from '../../shared/report';
class Startup extends Phaser.Scene {
    preload() {
        this.load.image('gear', GEAR);
        this.load.on('loaderror', () => { throw new Error('Could not load the gear image'); });
    }
    create() {
        this.add.image(259, 119, 'gear').setOrigin(0);
        this.game.events.once(Phaser.Core.Events.POST_RENDER, () => report('phaser'));
    }
}
new Phaser.Game({ type: Phaser.WEBGL, width: 640, height: 360, backgroundColor: '#ffffff', antialias: true, banner: false, audio: { noAudio: true }, scene: Startup });
