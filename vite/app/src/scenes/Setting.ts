// app/src/config/.config.ts
// Centralized configuration for .
// All values here are meant to be "tunable" without touching scene logic.

export const Setting = {

  // Base world / camera preferences for this scene (can be tweaked per level)
  WORLD: {
    W: 1200,   // matches GameConfig width, but can be oversized for camera
    H: 900,   // matches GameConfig height
    Max_H : 2400,
    margin: 32,    // safe margin for placements / camera padding
  },

  // Spritesheet frame sizes (was: FRAME_W / FRAME_H in .ts)
  SPRITE: {
    FRAME_W : 32,
    FRAME_H : 32,
  },

  // Player / movement tuning
  PLAYER: {
    walkSpeed: 200, // default speed used when startWalking() is called
  },

  // Bullet defaults (used by spawnBullet())
  BULLET: {
    speed: 300,
    radius: 8,
    lifespanMs: 2500,
    armDelayMs: 300,
  },

  // Population / spawn counts (set sensible defaults; adjust as you like)
  POPULATION: {
    rocks: 16,
    enemies: 10,
    friendlies: 1,
  },

  // Naming pool for rocks (was: words_rock in .ts)
  ROCKS: {
    namePool: [
      "rock","stone","hill","cliff","sand","dust","mud","cave","valley","island",
      "shore","beach","wave","shell","pebble","boulder","mountain","forest","tree","leaf",
      "root","branch","grass","moss","vine","river","stream","lake","pond","water",
      "ice","snow","frost","storm","cloud","wind","breeze","rain","drop"
    ],
  },

  // Scene audio and UI toggles
  OPTIONS: {
    physicsDebug: true,  // leave runtime debug on/off here
    bgmVolume: 0.5,
    sfxVolume: 0.6,
  },
} as const;

export type SettingType = typeof Setting;
