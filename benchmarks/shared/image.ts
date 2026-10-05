// The one sprite every page draws, embedded as a data URL so no engine makes an asset request:
// the measurement is engine boot to first rendered frame, not asset loading.
import bunny from './bunny.png?inline';
export const BUNNY = bunny;
export const BUNNY_WIDTH = 26;
export const BUNNY_HEIGHT = 37;
