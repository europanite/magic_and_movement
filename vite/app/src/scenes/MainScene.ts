import Phaser from "phaser";
import { createASR } from "../asr";
import { logger } from "../logger";
import { Rock } from "../entities/Rock";
import { Enemy } from "../entities/Enemy";
import { Boss } from "../entities/Boss";
import { Player } from "../entities/Player";
import { Bullet } from '../entities/Bullet';
import { DeathFX } from "../effects/DeathFX";
import { SoundManager } from "../audio/SoundManager";

export class MainScene extends Phaser.Scene {
  private player!: Player;
  private boss!: Boss;
  private bullets!: Phaser.Physics.Arcade.Group; 
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private friendlies!: Phaser.Physics.Arcade.Group;
  private enemies!:    Phaser.Physics.Arcade.Group;
  private rocks!:      Phaser.Physics.Arcade.StaticGroup;

  private words_rock = [
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
    ]
  private words_enemy = [
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
    ]

  wasd!: { [k: string]: Phaser.Input.Keyboard.Key };
  facing: "back" | "left" | "right" | "forward" = "back";

  // === Sprite Sheet ===
  static FRAME_W = 32;
  static FRAME_H = 32;

  // Frame Assignment
  static FRAMES = {
    back:  { idle: 0,  walk: [0, 1, 2] },
    left:  { idle: 3,  walk: [3, 4, 5] },
    right: { idle: 6,  walk: [6, 7, 8] },
    forward:    { idle: 9, walk: [9, 10, 11] },
  };

  // input
  private dir = { forward:false, back:false, left:false, right:false };
  private W = 1200;
  private H = 900;
  private Max_H = 4800;
  private X_PLAYER = this.W/2;
  private Y_PLAYER = this.Max_H - this.H/2;

  constructor(){
    super("MainScene");
  }

  preload() {
    this.load.spritesheet('player', 'images/witch_sheet.png', {frameWidth: MainScene.FRAME_W,frameHeight: MainScene.FRAME_H,},);
    this.load.spritesheet('enemy', 'images/enemy_sheet.png', {frameWidth: MainScene.FRAME_W,frameHeight: MainScene.FRAME_H,},);
    this.load.spritesheet('boss', 'images/enemy_sheet.png', {frameWidth: MainScene.FRAME_W,frameHeight: MainScene.FRAME_H,});
    this.load.image("bullet", "images/bullet.png");
    this.load.audio("bgm_main", "audio/bgm.mp3");
    this.load.audio("se_player_die", "audio/character_destroy.mp3");
    this.load.audio("se_enemy_die",  "audio/character_destroy.mp3");
    this.load.audio("se_boss_die",   "audio/character_destroy.mp3");
    this.load.audio("se_bullet_fire",     "audio/bullet_timeout.mp3");
    this.load.audio("se_bullet_timeout",  "audio/bullet_timeout.mp3");
    this.load.audio("se_bullet_collision","audio/bullet_timeout.mp3");
  }

  create() {
    // log
    logger.cmd("GAME START");
    SoundManager.init(this);

    // audio
    const bgm = this.sound.add("bgm_main", { loop: true, volume: 0.4 });
    bgm.play();

    // ground
    this.cameras.main.setBackgroundColor(0x66CDAA);

    // boundary & camera
    this.cameras.main.setBounds(0, 0, this.W, this.Max_H);
    this.physics.world.setBounds(0, 0, this.W, this.Max_H);

    // Player
    this.friendlies = this.physics.add.group({ classType: Player, runChildUpdate: true });
    this.player = new Player(
      this, 
      this.X_PLAYER,
      this.Y_PLAYER,
      "you",
      5);
    this.friendlies.add(this.player);

    this.cursors = this.input.keyboard!.createCursorKeys();
    this.wasd = {
      W: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      A: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      S: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      D: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.D),
      SPACE: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE),
    } as any;

    // animation
    this.makeWalkAnim("walk-back",    MainScene.FRAMES.back.walk);
    this.makeWalkAnim("walk-left",    MainScene.FRAMES.left.walk);
    this.makeWalkAnim("walk-right",   MainScene.FRAMES.right.walk);
    this.makeWalkAnim("walk-forward", MainScene.FRAMES.forward.walk);
  
    // 発射（スペース）
    this.input.keyboard!.on('keydown-SPACE', () => {
      // 既存チューニングを維持（400, r8, life 1000ms, arm 300ms）
      this.player.shoot(this.player.direction, {
        speed: 400,
        radius: 8,
        lifespanMs: 1000,
        armDelayMs: 300,
      });
    });

    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);

    // Player Input
    const kb = this.input.keyboard!;
    const setKey = (key:string, k:keyof typeof this.dir, v:boolean)=>{
      kb.on(`${v?'keydown':'keyup'}-${key}`, ()=> this.dir[k]=v);
    };
    const logKey = (type:string, key:string)=> logger.cmd(`key ${type}: ${key}`);
    kb.on("keydown", (e: KeyboardEvent) => logKey("back", e.key));
    kb.on("keyup",   (e: KeyboardEvent) => logKey("forward",   e.key));

    // Bullets group
    this.bullets = this.physics.add.group({
      classType: Bullet,
      runChildUpdate: true,
      maxSize: 600,
    });

    // Enemy
    this.enemies = this.physics.add.group({ classType: Enemy, runChildUpdate: true });
    const ENEMY_COUNT = 6;
    for (let i = 0; i < ENEMY_COUNT; i++) {
      const randX = Phaser.Math.Between(100, this.W - 100);
      const randY = Phaser.Math.Between(500, this.Max_H - 200);
      const e = new Enemy(this, randX, randY, this.getUniqueWord(this.words_enemy));
      this.enemies.add(e);
    }

    // === Enemy Attack ===
    this.time.addEvent({
      delay: 2000,
      loop: true,
      callback: () => {
        if (!this.player?.active) return;

        this.enemies.children.each((enemyGO: Phaser.GameObjects.GameObject) => {
          const e = enemyGO as Phaser.Physics.Arcade.Sprite;
          if (!e.active) return;

          const canSee =
            this.inFOVAndRange(e.x, e.y, this.player.x, this.player.y, { fovDeg: 120, range: 700 }) &&
            this.hasLineOfSight(e.x, e.y, this.player.x, this.player.y);

          if (!canSee) return;

          // Shoot
          const ang = Phaser.Math.RadToDeg(
            Phaser.Math.Angle.Between(e.x, e.y, this.player.x, this.player.y)
          );
          (e as any ).shoot(ang, {
            speed: 220,
            radius: 8,
            lifespanMs: 2000,
            armDelayMs: 300,
          });
        });
      },
    });

    // === ランダム岩（障害物） ===
    this.rocks = this.physics.add.staticGroup();

    const ROCK_COUNT = 24; // 岩の数
    const MIN_W = 24, MAX_W = 96; // 幅の最小・最大
    const MIN_H = 24, MAX_HH = 96; // 高さの最小・最大
    const SAFE_RADIUS = 140; // プレイヤー初期位置の安全距離

    const playerSpawn = new Phaser.Math.Vector2(this.player.x, this.player.y);
    const placed: Phaser.Geom.Rectangle[] = []; // 重なり回避用

    const placeRock = (rx: number, ry: number, rw: number, rh: number) => {

      const name = this.getUniqueWord(this.words_rock);
      const rock = new Rock(this, rx, ry, rw, rh, name);
      this.rocks.add(rock);

      placed.push(new Phaser.Geom.Rectangle(rx - rw / 2, ry - rh / 2, rw, rh));
    };
    // ランダム配置ループ
    for (let i = 0; i < ROCK_COUNT; i++) {
      let tries = 0;
      while (tries++ < 25) {
        const rw = Phaser.Math.Between(MIN_W, MAX_W);
        const rh = Phaser.Math.Between(MIN_H, MAX_HH);
        const rx = Phaser.Math.Between(60 + rw/2, this.W - 60 - rw/2);
        const ry = Phaser.Math.Between(200 + rh/2, this.Max_H - 200 - rh/2);

        // プレイヤー初期位置の安全距離を確保
        if (playerSpawn.distance(new Phaser.Math.Vector2(rx, ry)) < SAFE_RADIUS) continue;

        // 既存の岩と簡易重なり回避
        const cand = new Phaser.Geom.Rectangle(rx - rw/2, ry - rh/2, rw, rh);
        const is_overlaps = placed.some(r => Phaser.Geom.Rectangle.Overlaps(r, cand));
        if (is_overlaps) continue;

        placeRock(rx, ry, rw, rh);

        break;
      }
    }

    // === Boss ===
    const bossName = this.getUniqueWord(this.words_enemy);
    this.boss = new Boss(this, this.W * 0.5, 300, bossName, 30);
    this.enemies.add(this.boss);

    // === Boss atack ===
    this.time.addEvent({
      delay: 1500,
      loop: true,
      callback: () => {
        if (!this.boss?.active) return;

      // visibility
      const canSee =
        this.inFOVAndRange(this.boss.x, this.boss.y, this.player.x, this.player.y, { fovDeg: 120, range: 700 }) &&
        this.hasLineOfSight(this.boss.x, this.boss.y, this.player.x, this.player.y);

      if (!canSee) return;

        // 複数弾を放つ（扇状）
        const numBullets = 6;
        const baseDeg = Phaser.Math.RadToDeg(Phaser.Math.Angle.Between(this.boss.x, this.boss.y, this.player.x, this.player.y));
        for (let i = 0; i < numBullets; i++) {
          const a = baseDeg - 30 + (60 * i) / 5; // -30°〜+30°を6発
          this.spawnBullet(this.boss.x, this.boss.y, a, 300, 8, 2500, 300);
        }
      },
    });

    // Collision
    // Dynamic × Static
    this.physics.add.collider(this.friendlies,  this.rocks); 
    this.physics.add.collider(this.enemies, this.rocks);
    
    // 4) 弾 × 岩（現状維持：弾だけ消える＝岩は不死）
    this.physics.add.collider(this.bullets, this.rocks, (bGO) => {
      (bGO as Bullet).takeDamage(1);
    });

    // 5) Bullet × Bullet
    this.physics.add.collider(this.bullets, this.bullets, (aGO, bGO) => {
      const a = aGO as Bullet, b = bGO as Bullet;
      if (!a.active || !b.active) return;
      // どちらかが未武装なら相殺しない
      if (!a.isArmed() && !b.isArmed()) return;

      DeathFX.playSE(this, DeathFX.seKey("bullet_collision"), 0, 0.6);

      a.takeDamage(1);
      b.takeDamage(1);
    });

    // Enemy Collision
    this.physics.add.overlap(this.bullets, this.enemies, (bGO, eGO) => {
      const b = bGO as Bullet;
      if (!b.isArmed()) return;
      (eGO as any).takeDamage?.(1);
      logger.cmd(`Enemy Hit`)
      b.takeDamage(1);
    });

    // Player Collision
    this.physics.add.overlap(this.bullets, this.friendlies, (bGO, pGO) => {
      const b = bGO as Bullet;
      if (!b.isArmed()) return;
      (pGO as any).takeDamage?.(1);
      logger.cmd(`Player Hit`)
      b.takeDamage(1);
    });

    this.setupMic();

    this.registerInterruptHandlers();
  }

  update() {
    const speed = 200;
    const left    = (this.cursors.left?.isDown  || this.wasd.A.isDown   || this.dir.left);
    const right   = (this.cursors.right?.isDown || this.wasd.D.isDown   || this.dir.right);
    const forward = (this.cursors.up?.isDown    || this.wasd.W.isDown   || this.dir.forward);
    const back    = (this.cursors.down?.isDown  || this.wasd.S.isDown   || this.dir.back);

    // 速度初期化
    for (const friendly of this.friendlies.getChildren()) {
      if ((friendly as any).isAutoMoving?.()) continue; // ★自動移動を尊重
      friendly.setVelocity(0);
      // 入力に応じて速度・向き設定（斜めは最後に押された軸を優先したい場合は工夫可）
      let moving = false;
      if (left)    { friendly.setVelocityX(-speed); this.facing = "left";    moving = true; friendly.direction=180; }
      if (right)   { friendly.setVelocityX( speed); this.facing = "right";   moving = true; friendly.direction=0; }
      if (forward) { friendly.setVelocityY(-speed); this.facing = "forward"; moving = true; friendly.direction=270; }
      if (back)    { friendly.setVelocityY( speed); this.facing = "back";    moving = true; friendly.direction=90; }
      // アニメ再生 or 待機フレーム
      if (moving) {
        friendly.play(`walk-${this.facing}`, true);
      } else {
        // 立ち止まったらその向きのidleフレームで停止
        friendly.anims.stop();
        const idleFrame = MainScene.FRAMES[this.facing].idle;
        friendly.setFrame(idleFrame);
      }
    }

  }

  // ==== ユーティリティ: 歩行アニメを作る ====
  private makeWalkAnim(key: string, frames: number[]) {
    this.anims.create({
      key,
      frames: frames.map((f) => ({ key: "player", frame: f })),
      frameRate: 8,
      repeat: -1,
    });
  }

  private setupMic() {
    const btn = document.getElementById("btnMic") as HTMLButtonElement | null;
    const stat = document.getElementById("micStatus");
    const asr = createASR("en-US");
    if (!btn || !stat) return;
    if (!asr.supported) { stat.textContent = "mic: unsupported (use keys)"; btn.disabled = true; return; }

    let running = false;
    const set = (k: keyof typeof this.dir, val: boolean)=> (this.dir[k] = val);

    btn.onclick = () => {
      if (!running) {
        asr.start((text, isFinal) => {
          const lower = text.toLowerCase();
          if (!isFinal) { stat.textContent = "mic: listening…"; return; }
          // === ターゲット名検出 ===
          this.enemies.children.each((enemyGO: Phaser.GameObjects.GameObject) => {
            const enemy = enemyGO as Enemy;
            const name = enemy.displayName.toLowerCase();
            if (lower.includes(name)) {
              logger.cmd(`🎯 "${name}" detected by voice!`);
              // 散弾発射
              const angle = Phaser.Math.RadToDeg(
                Phaser.Math.Angle.Between(this.player.x, this.player.y, enemy.x, enemy.y)
              );
              this.player.shootSpread(angle, 5, 30, {
                speed: 400,
                radius: 8,
                lifespanMs: 1000,
                armDelayMs: 300,
              });
            }
          });

          this.rocks.children.each((obj: Phaser.GameObjects.GameObject) => {
            const rock = obj as Rock;
            const rockName = (rock.getData("name") as string).toLowerCase();
            if (lower.includes(rockName)) {
              logger.cmd(`Voice detected rock "${rockName}"`);
              this.player.moveToRock(rock);
            }
          });

          logger.cmd(`voice: ${lower}`);

          // 移動（押下状態を切替）
          if (/\bforward\b/.test(lower)) { set("forward", true);  set("back",false); set("left",false); set("right",false); }
          if (/\bback\b/.test(lower))    { set("forward", false); set("back",true);  set("left",false); set("right",false); }
          if (/\bleft\b/.test(lower))    { set("forward", false); set("back",false); set("left",true);  set("right",false); }
          if (/\bright\b/.test(lower))   { set("forward", false); set("back",false); set("left",false); set("right",true); }
          if (/\bstop\b/.test(lower))    { set("forward", false); set("back",false); set("left",false); set("right",false); }

          // “shoot” 単独なら最後に動いた向きへ
          if (/\bshoot\b/.test(lower) && !/\bshoot (left|right|forward|back)\b/.test(lower)) {
            this.player.shoot(this.player.direction, {
              speed: 400,
              radius: 8,
              lifespanMs: 1000,
              armDelayMs: 300,
            });
          }
        });
        running = true; btn.textContent = "⏹ Stop mic"; stat.textContent = "mic: listening…";
      } else {
        asr.stop(); running = false; btn.textContent = "🎤 Start mic"; stat.textContent = "mic: idle";
      }
    };

  }

  // === LoS / FOV / Range ===
  private hasLineOfSight(ax: number, ay: number, bx: number, by: number): boolean {
    const ray = new Phaser.Geom.Line(ax, ay, bx, by);
    let blocked = false;
    this.rocks.children.iterate((go: Phaser.GameObjects.GameObject) => {
      if (blocked) return;
      const r = go as Phaser.GameObjects.Rectangle;
      const rect = new Phaser.Geom.Rectangle(r.x - r.width/2, r.y - r.height/2, r.width, r.height);
      if (Phaser.Geom.Intersects.LineToRectangle(ray, rect)) blocked = true;
    });
    return !blocked;
  }

  private inFOVAndRange(ex: number, ey: number, px: number, py: number, opts?: {
    fovDeg?: number; range?: number;
  }): boolean {
    const fovDeg = opts?.fovDeg ?? 100; // 視野角（例：±50°）
    const range  = opts?.range ?? 600;  // 射程
    const dx = px - ex, dy = py - ey;
    const dist = Math.hypot(dx, dy);
    if (dist > range) return false;

    // 敵の「向き」は未管理なので、敵→プレイヤー方向ベクトルをそのまま視線とみなす
    //（向き管理したいなら敵の回転等に合わせて angleDiff を計算）
    // ここではFOVは実質「どの方向でもOK」に近いが、将来の向き実装に備えて残す
    const angleToPlayer = Phaser.Math.Angle.Normalize(Math.atan2(dy, dx));
    const angleForward  = angleToPlayer; // 簡略：前方＝プレイヤー方向
    const angDiff = Phaser.Math.RadToDeg(Phaser.Math.Angle.Wrap(angleToPlayer - angleForward));
    return Math.abs(angDiff) <= fovDeg * 0.5;
  }

  private getUniqueWord(pool: string[]): string {
    if (pool.length === 0) return "none";
    const i = Phaser.Math.Between(0, pool.length - 1);
    return pool.splice(i, 1)[0];
  }

  private spawnBullet(
    x: number, y: number,
    angleDeg: number,
    speed = 500,
    radius = 8,
    lifeMs = 3000,
    armDelayMs = 300
  ) {
    const b = this.bullets.get(x, y, "bullet", 0, true) as Bullet | null;
    if (!b) return null;
    b.setActive(true).setVisible(true);
    b.configure({ speed, radius, lifespanMs: lifeMs, armDelayMs });

    const body = b.body as Phaser.Physics.Arcade.Body;
    body.enable = true;
    body.reset(x, y);
    b.fire(angleDeg, speed);
    return b;
  }

  private registerInterruptHandlers() {
    this.input.keyboard!.on('keydown', (e: KeyboardEvent) => {
      if (this.player.isAutoMoving()) {
        this.player.interruptAutoMove();
      }
    });

    // const asr = createASR("en-US");
    // if (asr.supported) {
    //   asr.start((text, isFinal) => {
    //     if (isFinal && this.player.isAutoMoving()) {
    //       logger.info(`ASR interrupt: "${text}"`);
    //       this.player.interruptAutoMove();
    //     }
    //   });
    // }
  }
}