import Phaser from 'phaser';
import { runRenderBenchmark, SPRITE_SCALE, WIDTH, HEIGHT } from '../../shared/bunnies';
import { GEAR } from '../../shared/image';

class Bunnies extends Phaser.Scene {
    sprites: Phaser.GameObjects.Image[] = [];
    frameUpdate = () => {};
    preload() {
        this.load.image('gear', GEAR);
    }
    create() {
        void runRenderBenchmark('phaser', {
            setCount: sim => {
                while (this.sprites.length > sim.count) this.sprites.pop()!.destroy();
                while (this.sprites.length < sim.count) this.sprites.push(this.add.image(0, 0, 'gear').setScale(SPRITE_SCALE));
            },
            apply: sim => {
                for (let i = 0; i < sim.count; i++) {
                    const sprite = this.sprites[i];
                    sprite.x = sim.x[i];
                    sprite.y = sim.y[i];
                    sprite.rotation = sim.rotation[i];
                }
            },
            onFrame: (update, rendered) => {
                this.frameUpdate = update;
                this.game.events.on(Phaser.Core.Events.POST_RENDER, rendered);
            },
        });
    }
    update() { this.frameUpdate(); }
}
new Phaser.Game({ type: Phaser.WEBGL, width: WIDTH, height: HEIGHT, backgroundColor: '#ffffff', antialias: false, banner: false, audio: { noAudio: true }, scene: Bunnies });
