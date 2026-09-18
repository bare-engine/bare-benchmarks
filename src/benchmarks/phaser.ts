import Phaser from 'phaser';
import { report } from './report';
class Startup extends Phaser.Scene {
    private gear!: Phaser.GameObjects.Image;
    preload() {
        this.load.atlas('gear', './initial/generated/texturePackImages.webp', './initial/generated/texturePackImages.json');
        this.load.on('loaderror', () => { throw new Error('Could not load the gear atlas'); });
    }
    create() {
        this.gear = this.add.image(320, 180, 'gear', '⚙');
        this.game.events.once(Phaser.Core.Events.POST_RENDER, () => report('phaser'));
    }
    update(_time: number, delta: number) { if (this.gear) this.gear.angle += delta * 0.06; }
}
new Phaser.Game({ type: Phaser.WEBGL, width: 640, height: 360, backgroundColor: '#ffffff', antialias: true, banner: false, audio: { noAudio: true }, scene: Startup });
