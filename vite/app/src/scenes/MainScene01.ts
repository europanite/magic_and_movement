import Phaser from "phaser";
import { createASR } from "../asr";
import { logger } from "../logger";
import { Rock } from "../entities/Rock";
import { Enemy } from "../entities/Enemy";
import { Boss } from "../entities/Boss";
import { Friendly } from "../entities/Friendly";
import { Bullet } from '../entities/Bullet';
import { SoundManager } from "../audio/SoundManager";
import { Setting } from "./Setting";

export class MainScene01 extends Phaser.Scene {
  private friendly!: Friendly;
  private friendlies!: Phaser.Physics.Arcade.Group;
  private boss!: Boss;
  private bullets!: Phaser.Physics.Arcade.Group; 
  private enemies!:    Phaser.Physics.Arcade.Group;
  private rocks!:      Phaser.Physics.Arcade.StaticGroup;

  // input
  private X_FRIENDLY = Setting.WORLD.W/2;
  private Y_FRIENDLY = Setting.WORLD.Max_H - Setting.WORLD.H/2;

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

  constructor(){
    super("MainScene01");
  }

  preload() {
    this.load.spritesheet('friendly', 'images/witch_sheet.png', {frameWidth: Setting.SPRITE.FRAME_W,frameHeight: Setting.SPRITE.FRAME_H,},);
    this.load.spritesheet('enemy', 'images/enemy_sheet.png', {frameWidth: Setting.SPRITE.FRAME_W,frameHeight: Setting.SPRITE.FRAME_H,},);
    this.load.spritesheet('boss', 'images/enemy_sheet.png', {frameWidth: Setting.SPRITE.FRAME_W,frameHeight: Setting.SPRITE.FRAME_H,});
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
    this.cameras.main.setBounds(0, 0, Setting.WORLD.W, Setting.WORLD.Max_H);
    this.physics.world.setBounds(0, 0, Setting.WORLD.W, Setting.WORLD.Max_H);

    this.create_friendlies();

    this.create_bullets();

    this.create_enemies();

    this.create_rocks();

    this.create_boss();

    this.set_collision();

    this.setupMic();

    this.registerInterruptHandlers();
  }

  update() {
    for (const friendly of this.friendlies.getChildren()) {
      friendly.updateAction();
    }
  }

  private setupMic() {
    const btn = document.getElementById("btnMic") as HTMLButtonElement | null;
    const stat = document.getElementById("micStatus");
    const asr = createASR("en-US");
    if (!btn || !stat) return;
    if (!asr.supported) { stat.textContent = "mic: unsupported (use keys)"; btn.disabled = true; return; }

    let running = false;

    btn.onclick = () => {
      if (!running) {
        asr.start((text, isFinal) => {
          const lower = text.toLowerCase();
          if (!isFinal) { stat.textContent = "mic: listening…"; return; }
          this.listen();
          logger.cmd(`voice: ${lower}`);

          // Movement
          this.friendly.setup_mic(lower);

        });
        running = true; btn.textContent = "⏹ Stop mic"; stat.textContent = "mic: listening…";
      } else {
        asr.stop(); running = false; btn.textContent = "🎤 Start mic"; stat.textContent = "mic: idle";
      }
    };

  }
  private listen(lower=""){
          this.enemies.children.each((enemyGO: Phaser.GameObjects.GameObject) => {
            const enemy = enemyGO as Enemy;
            const name = enemy.displayName.toLowerCase();
            if (lower.includes(name)) {
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

  private set_collision(){
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
  }
  private create_boss(){
    // === Boss ===
    const bossName = this.getUniqueWord(this.words_enemy);
    this.boss = new Boss(this, Setting.WORLD.W * 0.5, 300, bossName, 30);
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
  }
  private create_rocks(){
    // === Rocks ===
    this.rocks = this.add.group({ runChildUpdate: true }); 

    const ROCK_COUNT = 24;
    const MIN_W = 24, MAX_W = 96; 
    const MIN_H = 24, MAX_H = 96;
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
        const rh = Phaser.Math.Between(MIN_H, MAX_H);
        const rx = Phaser.Math.Between(60 + rw/2, Setting.WORLD.W - 60 - rw/2);
        const ry = Phaser.Math.Between(200 + rh/2, Setting.WORLD.Max_H - 200 - rh/2);

        if (friendlySpawn.distance(new Phaser.Math.Vector2(rx, ry)) < SAFE_RADIUS) continue;

        const cand = new Phaser.Geom.Rectangle(rx - rw/2, ry - rh/2, rw, rh);
        const is_overlaps = placed.some(r => Phaser.Geom.Rectangle.Overlaps(r, cand));
        if (is_overlaps) continue;

        placeRock(rx, ry, rw, rh);

        break;
      }
    }
  }
  private create_enemies(){
    // Enemy
    this.enemies = this.physics.add.group({ classType: Enemy, runChildUpdate: true });
    const ENEMY_COUNT = 6;
    for (let i = 0; i < ENEMY_COUNT; i++) {
      const randX = Phaser.Math.Between(100, Setting.WORLD.W - 100);
      const randY = Phaser.Math.Between(500, Setting.WORLD.Max_H - 200);
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
  }

  private create_bullets(){
    // Bullets group
    this.bullets = this.physics.add.group({
      classType: Bullet,
      runChildUpdate: true,
      maxSize: 600,
    });
  }
  private create_friendlies(){
    // Friendly
    this.friendlies = this.physics.add.group({ classType: Friendly, runChildUpdate: true });
    this.friendly = new Friendly(
      this, 
      this.X_FRIENDLY,
      this.Y_FRIENDLY,
      "you",
      5);

    this.friendlies.add(this.friendly);
  }
}