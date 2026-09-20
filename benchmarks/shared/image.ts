// The one sprite every startup page draws, embedded as a data URL so no engine makes an asset request:
// the measurement is engine boot to first rendered frame, not asset loading.
import gear from './gear.webp?inline';
export const GEAR = gear;
export const GEAR_SIZE = 122;
