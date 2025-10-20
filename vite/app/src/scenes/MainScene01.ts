import Phaser from "phaser";
import { createASR } from "../asr";
import { logger } from "../logger";
import { Rock } from "../entities/Rock";
import { Enemy } from "../entities/Enemy";
import { Boss } from "../entities/Boss";
import { Friendly } from "../entities/Friendly";
import { Bullet } from '../entities/Bullet';
import { SoundManager } from "../audio/SoundManager";



export class MainScene01 extends Phaser.Scene {
  private friendly!: Friendly;
  private boss!: Boss;
  private bullets!: Phaser.Physics.Arcade.Group; 
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private friendlies!: Phaser.Physics.Arcade.Group;
  private enemies!:    Phaser.Physics.Arcade.Group;
  private rocks!:      Phaser.Physics.Arcade.StaticGroup;
  private bgm?: Phaser.Sound.BaseSound;
  // === Sprite Sheet ===
  private FRAME_W = 32;
  private FRAME_H = 32;

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

  // Frame Assignment
  private FRAMES = {
    back:  { idle: 0,  walk: [0, 1, 2] },
    left:  { idle: 3,  walk: [3, 4, 5] },
    right: { idle: 6,  walk: [6, 7, 8] },
    forward:    { idle: 9, walk: [9, 10, 11] },
  };

  // input
  private dir = { forward:false, back:false, left:false, right:false };
  private W = 1200;
  private H = 900;
  private Max_H = 2400;
  private X_FRIENDLY = this.W/2;
  private Y_FRIENDLY = this.Max_H - this.H/2;

  constructor(){
    super("MainScene01");
  }

  preload() {
    this.load.spritesheet('friendly', 'images/witch_sheet.png', {frameWidth: this.FRAME_W,frameHeight: this.FRAME_H,},);
    this.load.spritesheet('enemy', 'images/enemy_sheet.png', {frameWidth: this.FRAME_W,frameHeight: this.FRAME_H,},);
    this.load.spritesheet('boss', 'images/enemy_sheet.png', {frameWidth: this.FRAME_W,frameHeight: this.FRAME_H,});
    this.load.image("bullet", "images/bullet.png");
    this.load.audio("bgm_main", "audio/bgm.mp3");
    this.load.audio("se_friendly_die", "audio/character_destroy.mp3");
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

    // Friendly
    this.friendlies = this.physics.add.group({ classType: Friendly, runChildUpdate: true });
    this.friendly = new Friendly(
      this, 
      this.X_FRIENDLY,
      this.Y_FRIENDLY,
      "you",
      5);

    // Check destructions
    this.friendly.once(Phaser.GameObjects.Events.DESTROY, () => {
      this.triggerGameResults("defeated");
    });

    this.friendlies.add(this.friendly);

    this.cursors = this.input.keyboard!.createCursorKeys();
    this.wasd = {
      W: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      A: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      S: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      D: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.D),
      SPACE: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE),
    } as any;

    // animation
    this.makeWalkAnim("walk-back",    this.FRAMES.back.walk);
    this.makeWalkAnim("walk-left",    this.FRAMES.left.walk);
    this.makeWalkAnim("walk-right",   this.FRAMES.right.walk);
    this.makeWalkAnim("walk-forward", this.FRAMES.forward.walk);
  
    // Shoot
    this.input.keyboard!.on('keydown-SPACE', () => {
      this.friendly.shoot(this.friendly.direction, {
        speed: 400,
        radius: 8,
        lifespanMs: 1000,
        armDelayMs: 300,
      });
    });

    this.cameras.main.startFollow(this.friendly, true, 0.1, 0.1);

    // Friendly Input
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
        if (!this.friendly?.active) return;

        this.enemies.children.each((enemyGO: Phaser.GameObjects.GameObject) => {
          const e = enemyGO as Phaser.Physics.Arcade.Sprite;
          if (!e.active) return;

          const canSee =
            this.inFOVAndRange(e.x, e.y, this.friendly.x, this.friendly.y, { fovDeg: 120, range: 700 }) &&
            this.hasLineOfSight(e.x, e.y, this.friendly.x, this.friendly.y);

          if (!canSee) return;

          // Shoot
          const ang = Phaser.Math.RadToDeg(
            Phaser.Math.Angle.Between(e.x, e.y, this.friendly.x, this.friendly.y)
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

    // === Rocks ===
    this.rocks = this.add.group({ runChildUpdate: true }); 

    const ROCK_COUNT = 24;
    const MIN_W = 24, MAX_W = 96; 
    const MIN_H = 24, MAX_HH = 96;
    const SAFE_RADIUS = 140;

    const friendlySpawn = new Phaser.Math.Vector2(this.friendly.x, this.friendly.y);
    const placed: Phaser.Geom.Rectangle[] = [];

    const placeRock = (rx: number, ry: number, rw: number, rh: number) => {

      const name = this.getUniqueWord(this.words_rock);
      const rock = new Rock(this, rx, ry, rw, rh, name,3);
      this.rocks.add(rock);

      placed.push(new Phaser.Geom.Rectangle(rx - rw / 2, ry - rh / 2, rw, rh));
    };
    // Random Position Loop
    for (let i = 0; i < ROCK_COUNT; i++) {
      let tries = 0;
      while (tries++ < 25) {
        const rw = Phaser.Math.Between(MIN_W, MAX_W);
        const rh = Phaser.Math.Between(MIN_H, MAX_HH);
        const rx = Phaser.Math.Between(60 + rw/2, this.W - 60 - rw/2);
        const ry = Phaser.Math.Between(200 + rh/2, this.Max_H - 200 - rh/2);

        if (friendlySpawn.distance(new Phaser.Math.Vector2(rx, ry)) < SAFE_RADIUS) continue;

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
        this.inFOVAndRange(this.boss.x, this.boss.y, this.friendly.x, this.friendly.y, { fovDeg: 120, range: 700 }) &&
        this.hasLineOfSight(this.boss.x, this.boss.y, this.friendly.x, this.friendly.y);

      if (!canSee) return;
        const angle = Phaser.Math.RadToDeg(
          Phaser.Math.Angle.Between(this.boss.x, this.boss.y,  this.friendly.x,  this.friendly.y)
        );
        this.boss.shootSpread(angle, 5, 30, {
                speed: 400,
                radius: 8,
                lifespanMs: 1000,
                armDelayMs: 300,
        });
        this.boss.setWeapon({ armDelayMs: 500 });
      },
    });

    // Collision

    // Friendly × Rock
    this.physics.add.collider(this.friendly, this.rocks, (_pGO, rGO) => {
      const rock = rGO as Rock;
      if (this.friendly.isAutoMoving() && this.friendly.getTargetRock() === rock) {
        this.friendly.stopAutoMove();
        (this.friendly.body as Phaser.Physics.Arcade.Body).setVelocity(0, 0);
      }
    });
    // enemies × Rock
    this.physics.add.collider(this.enemies, this.rocks);
    
    // 4) Bullet × Rock
    this.physics.add.collider(this.bullets, this.rocks, (b: Bullet, r: Rock) => {
      if (!b.active || !r.active) return;
      r.takeDamage(1);
      b.takeDamage(1);
    });

    // 5) Bullet × Bullet
    this.physics.add.collider(
      this.bullets,
      this.bullets,
      (aGO, bGO) => {
        const a = aGO as Bullet;
        const b = bGO as Bullet;
        if (!a.active || !b.active) return;
        a.takeDamage?.(1);
        b.takeDamage?.(1);
      },
      (aGO, bGO) => {
        const a = aGO as Bullet;
        const b = bGO as Bullet;

        if (!a.active || !b.active || !a.visible || !b.visible) return false;

        if (!a.isArmed?.() || !b.isArmed?.()) return false;

        const ao = a.getOwner?.();
        const bo = b.getOwner?.();
        if (ao && bo && ao === bo) return false;

        const af = a.getData?.("faction");
        const bf = b.getData?.("faction");
        if (af && bf && af === bf) return false;

        return true;
      }
    );

    // Enemy Collision
    this.physics.add.overlap(this.bullets, this.enemies, (bGO, eGO) => {
      const b = bGO as Bullet;
      if (!b.isArmed()) return;
      (eGO as any).takeDamage?.(1);
      logger.cmd(`Enemy Hit`)
      b.takeDamage(1);
    });

    // Friendly Collision
    this.physics.add.overlap(this.bullets, this.friendlies, (bGO, pGO) => {
      const b = bGO as Bullet;
      if (!b.isArmed()) return;
      (pGO as any).takeDamage?.(1);
      logger.cmd(`Friendly Hit`)
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

    for (const friendly of this.friendlies.getChildren()) {
      if ((friendly as any).isAutoMoving?.()) continue;
      friendly.setVelocity(0);

      let moving = false;
      if (left)    { friendly.setVelocityX(-speed); friendly.direction = 180; moving = true; }
      if (right)   { friendly.setVelocityX( speed); friendly.direction =   0; moving = true; }
      if (forward) { friendly.setVelocityY(-speed); friendly.direction = 270; moving = true; }
      if (back)    { friendly.setVelocityY( speed); friendly.direction =  90; moving = true; }

      if (moving) {
        const key = friendly.direction === 0   ? "right"
                  : friendly.direction === 180 ? "left"
                  : friendly.direction === 270 ? "forward"
                  : "back";
        friendly.play(`walk-${key}`, true);
      } else {
        (friendly as any).playIdleFromDirection?.();
      }
    }

  }

  private makeWalkAnim(key: string, frames: number[]) {
    this.anims.create({
      key,
      frames: frames.map((f) => ({ key: "friendly", frame: f })),
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
          logger.cmd(`🎯  MIC: "${text}"`);
          if (!isFinal) { stat.textContent = "mic: listening…"; return; }
          this.enemies.children.each((enemyGO: Phaser.GameObjects.GameObject) => {
            const enemy = enemyGO as Enemy;
            const name = enemy.displayName.toLowerCase();
            if (lower.includes(name)) {
              const angle = Phaser.Math.RadToDeg(
                Phaser.Math.Angle.Between(this.friendly.x, this.friendly.y, enemy.x, enemy.y)
              );
              // Align visible facing to aim
              this.friendly.faceToward(enemy.x, enemy.y);
              // Fire strictly using character's direction so graphics and bullet match
              this.friendly.shootSpread(this.friendly.direction, 5, 30, {
                speed: 400, radius: 8, lifespanMs: 1000, armDelayMs: 300,
              });
            }
          });

          this.rocks.children.each((obj: Phaser.GameObjects.GameObject) => {
            const rock = obj as Rock;
            const rockName = (rock.getData("name") as string).toLowerCase();
            if (lower.includes(rockName)) {
              logger.cmd(`Voice detected rock "${rockName}"`);
              this.friendly.moveToRock(rock);
            }
          });

          logger.cmd(`voice: ${lower}`);

          // Movement
          if (/\bforward\b/.test(lower)) { set("forward", true);  set("back",false); set("left",false); set("right",false); }
          if (/\bback\b/.test(lower))    { set("forward", false); set("back",true);  set("left",false); set("right",false); }
          if (/\bleft\b/.test(lower))    { set("forward", false); set("back",false); set("left",true);  set("right",false); }
          if (/\bright\b/.test(lower))   { set("forward", false); set("back",false); set("left",false); set("right",true); }
          if (/\bstop\b/.test(lower))    { set("forward", false); set("back",false); set("left",false); set("right",false); }

          if (/\bshoot\b/.test(lower) && !/\bshoot (left|right|forward|back)\b/.test(lower)) {
            this.friendly.shoot(this.friendly.direction, {
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
    const fovDeg = opts?.fovDeg ?? 100; 
    const range  = opts?.range ?? 600;
    const dx = px - ex, dy = py - ey;
    const dist = Math.hypot(dx, dy);
    if (dist > range) return false;

    const angleToFriendly = Phaser.Math.Angle.Normalize(Math.atan2(dy, dx));
    const angleForward  = angleToFriendly;
    const angDiff = Phaser.Math.RadToDeg(Phaser.Math.Angle.Wrap(angleToFriendly - angleForward));
    return Math.abs(angDiff) <= fovDeg * 0.5;
  }

  private getUniqueWord(pool: string[]): string {
    if (pool.length === 0) return "none";
    const i = Phaser.Math.Between(0, pool.length - 1);
    return pool.splice(i, 1)[0];
  }

  public spawnBullet(
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
      if (this.friendly.isAutoMoving()) {
        this.friendly.interruptAutoMove();
      }
    });

  }

  private triggerGameResults(reason: "defeated" | "timeout" | "fell") {
    if ((this as any).__GameResultsFired) return;
    (this as any).__GameResultsFired = true;

    this.input.keyboard?.enabled && (this.input.keyboard.enabled = false);
    this.physics.world.isPaused || this.physics.pause();
    this.bgm?.stop();

    const startAt = this.time.now;
    this.cameras.main.fade(400, 0, 0, 0);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      this.scene.start("GameResultsScene", {
        reason,
        timeMs: this.time.now - startAt,
        score: (this as any).score ?? 0,
      });
    });
  }
  
}