import { GameObject, Scene, StartBare } from 'bare-engine';
//import { ArcadeObject, ArcadePhysicsController } from 'bare-engine/arcade';
import settingsDataJson from '../public/data/settingsData.json';
import { report } from './benchmarks/report';

export class Game extends Scene
{
    obj: GameObject;

    constructor()
    {
        super(settingsDataJson);
    }

    OnStart()
    {
        this.obj = this.AddGameObject('⚙')
            .SetPosition(bare.width * .5, bare.height * .5)
            .CenterPivot();
    }

    OnFixedUpdate()
    {
        this.obj.rotation++;
    }

    OnPostRender() { report('bare'); }
}

StartBare(Game, { resolution: { width: 640, height: 360, scale: 1 }, antiAlias: true });
