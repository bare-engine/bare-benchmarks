# Web game engine benchmarks

Run `npm install`, then `npm start` and open http://127.0.0.1:4173.

Tested 2026-10-05:

<!-- startup -->
![First rendered frame: Bare 102.5 ms, LittleJS 114.0 ms, KAPLAY 164.4 ms, PixiJS 219.8 ms, Phaser 236.3 ms, MelonJS 261.3 ms, Excalibur 276.7 ms](docs/startup-2026-10-05.png)
<!-- /startup -->

<!-- performance -->
![Sprites at full frame rate: Bare 72,000 sprites, LittleJS 64,000 sprites, PixiJS 48,000 sprites, Phaser 36,000 sprites, Excalibur 3,500 sprites, MelonJS 2,500 sprites, KAPLAY 2,000 sprites](docs/performance-2026-10-05.png)
<!-- /performance -->

<!-- bundle -->
![JavaScript downloaded: LittleJS 15.3 KB, Bare 38.0 KB, KAPLAY 69.9 KB, Excalibur 124.6 KB, PixiJS 139.6 KB, MelonJS 241.4 KB, Phaser 375.3 KB](docs/bundle-2026-10-05.png)
<!-- /bundle -->
