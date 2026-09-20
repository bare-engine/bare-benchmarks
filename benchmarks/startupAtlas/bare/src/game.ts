import { Scene, StartBare } from 'bare-engine';
import { SCALE, SPRITES } from '../../../shared/atlas';
import { report } from '../../../shared/report';

export class Game extends Scene
{
    constructor()
    {
        super();
    }

    OnStart()
    {
        // The packed atlas in public/initial/generated is preloaded by Bare's bootstrap, so the textures are in.
        for (const [name, x, y] of SPRITES)
            this.AddGameObject(name).SetPosition(x, y).SetScale(SCALE);
    }

    OnPostRender() { report('bare'); }
}

StartBare(Game, { resolution: { width: 640, height: 360, scale: 1 }, antiAlias: true });
