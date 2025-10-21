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

  DEPTH: {
    POINT:  10,
    CHARACTER: 20,
    LABEL: 100,
  },
} as const;

export type SettingType = typeof Setting;

export const WORDS_POINT: string[] = [
  "alpha","bravo","charlie","delta","echo","foxtrot","golf","hotel","india","juliet",
  "kilo","lima","mike","november","oscar","papa","quebec","romeo","sierra","tango",
  "uniform","victor","whiskey","xray","yankee","zulu",
  "amber","ash","aurora","blaze","cedar","cobalt","comet","coral","copper","ember",
  "falcon","fern","glacier","granite","ivy","jasper","maple","neon","olive",
  "onyx","orchid","quartz","raven","willow"
];
export const WORDS_ROCK: string[] = [
    "rock","stone","hill","cliff","sand","dust","mud","cave","valley","island",
    "shore","beach","wave","shell","pebble","boulder","mountain","forest","tree","leaf",
    "root","branch","grass","moss","vine","river","stream","lake","pond","water",
    "ice","snow","frost","storm","cloud","wind","breeze","rain","drop","mist",
    "shadow","light","sun","moon","star","sky","dawn","night","day","twilight",
    "earth","soil","field","plain","plate","ridge","path","trail","step","road",
    "wall","gate","bridge","pillar","arch","ring","circle","cube","crystal","gem",
    "iron","silver","gold","metal","orange","coal","salt","clay","brick","dusty",
    "silent","still","calm","cold","hard","solid","heavy","quiet","deep","rough",
    "wild","lonely","ancient","broken","gray","brown","smooth","soft","sharp","flat"
];

export const WORDS_ENEMY: string[] = [
    "fire","flame","smoke","ash","ember","fang","claw","wing","scale","tail",
    "wolf","bear","fox","hawk","snake","rat","crow","bat","boar","owl",
    "ghost","spirit","shade","shadow","demon","devil","beast","ogre","goblin","witch",
    "wizard","soldier","hunter","bandit","pirate","ninja","robot","drone","guard","sniper",
    "viper","wasp","bee","ant","spider","scorpion","hound","lion","tiger","dragon",
    "rage","anger","hate","fear","pain","death","skull","bone","blood","fangs",
    "sword","blade","arrow","gun","bomb","laser","missile","tank","snare","trap",
    "storm","thunder","lightning","spark","blast","toxic","acid","venom","dark","evil",
    "hot","mad","wild","fast","swift","fierce","cruel","sharp","dead","furious",
    "iron","steel","mech","void","warp","curse","doom","burn","bite","crash"
];