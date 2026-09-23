import { GameObject, Scene, StartBare } from 'bare-engine';
import { runRenderBenchmark, SPRITE_SCALE, WIDTH, HEIGHT } from '../../../shared/bunnies';
import { GEAR } from '../../../shared/image';

const DEG = 180 / Math.PI;

export class Game extends Scene
{
    objects: GameObject[] = [];
    frameUpdate = () => {};
    frameRendered = () => {};

    constructor()
    {
        super();
    }

    async OnStart()
    {
        const texture = await rapid.texture.load(GEAR);
        void runRenderBenchmark('bare', {
            setCount: sim =>
            {
                while (this.objects.length > sim.count) this.RemoveGameObject(this.objects.pop()!);
                while (this.objects.length < sim.count)
                    this.objects.push(this.AddGameObject({ name: 'gear', texture: 'NONE', baseClass: 'GameObject' }).SetTexture(texture).CenterPivot().SetScale(SPRITE_SCALE));
            },
            apply: sim =>
            {
                for (let i = 0; i < sim.count; i++)
                {
                    const object = this.objects[i];
                    object.x = sim.x[i];
                    object.y = sim.y[i];
                    object.rotation = sim.rotation[i] * DEG;
                }
            },
            onFrame: (update, rendered) => { this.frameUpdate = update; this.frameRendered = rendered; },
        });
    }

    OnUpdate() { this.frameUpdate(); }

    OnPostRender() { this.frameRendered(); }
}

StartBare(Game, { resolution: { width: WIDTH, height: HEIGHT, scale: 1 }, antiAlias: false });
