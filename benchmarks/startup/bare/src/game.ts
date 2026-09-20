import { Scene, StartBare } from 'bare-engine';
import { GEAR } from '../../../shared/image';
import { report } from '../../../shared/report';

export class Game extends Scene
{
    constructor()
    {
        super();
    }

    async OnStart()
    {
        // No packed atlas in this project, so nothing gets preloaded; load the inline image like the other engines.
        // texture: 'NONE' skips the asset-registry lookup, the decoded texture is set directly.
        const texture = await rapid.texture.load(GEAR);
        this.AddGameObject({ name: 'gear', texture: 'NONE', baseClass: 'GameObject' }).SetTexture(texture).SetPosition(259, 119);
    }

    OnPostRender() { report('bare'); }
}

StartBare(Game, { resolution: { width: 640, height: 360, scale: 1 }, antiAlias: true });
