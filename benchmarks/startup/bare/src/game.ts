import { Scene, StartBare } from 'bare-engine';
import { report } from '../../../shared/report';

export class Game extends Scene
{
    constructor()
    {
        super();
    }

    OnStart()
    {
        this.AddGameObject('⚙').SetPosition(188, 120);
        this.AddGameObject('📊').SetPosition(330, 120);
    }

    OnPostRender() { report('bare'); }
}

StartBare(Game, { resolution: { width: 640, height: 360, scale: 1 }, antiAlias: true });
