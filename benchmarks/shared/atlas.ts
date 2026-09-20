// Frame lookup for frameworks without a built-in TexturePacker/AssetPack loader,
// so every atlas benchmark pays for the same JSON request + parse.
export type AtlasFrame = { x: number; y: number; w: number; h: number };
export type Atlas = { frames: Record<string, { frame: AtlasFrame }>; meta: { size: { w: number; h: number } } };

export async function loadAtlas(url: string): Promise<Atlas> {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Could not load atlas ${url}`);
    return res.json();
}

// The two 1200 px paintings in the atlas, drawn side by side at quarter size on the 640 × 360 canvas.
export const SCALE = 0.25;
export const SPRITES: [name: string, x: number, y: number][] = [['vanGogh1', 10, 60], ['vanGogh2', 330, 60]];
