// Frame lookup for frameworks without a built-in TexturePacker/AssetPack loader,
// so every benchmark pays for the same JSON request + parse.
export type AtlasFrame = { x: number; y: number; w: number; h: number };
export type Atlas = { frames: Record<string, { frame: AtlasFrame }>; meta: { size: { w: number; h: number } } };

export async function loadAtlas(url: string): Promise<Atlas> {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Could not load atlas ${url}`);
    return res.json();
}
