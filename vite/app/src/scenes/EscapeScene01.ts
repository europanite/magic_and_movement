// app/src/scenes/EscapeScene.ts
import Phaser from "phaser";
import { Friendly } from "../entities/Friendly";
import { Chaser } from "../entities/Chaser";
import { CommandParser } from "../commands/CommandParser";
import { VoiceInput } from "../commands/VoiceInput";

type MoveState = { up: boolean; down: boolean; left: boolean; right: boolean };

export class EscapeScene01 extends Phaser.Scene {
  private player!: Friendly;
  private chasers!: Phaser.GameObjects.Group;
  private blocks!: Phaser.Physics.Arcade.StaticGroup;
  private safeZone!: Phaser.GameObjects.Zone;

  private timeLeft = 75; // survive N seconds to win
  private timerText!: Phaser.GameObjects.Text;

  private move: MoveState = { up: false, down: false, left: false, right: false };
  private moveSpeed = 180;
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

  constructor() {
    super("EscapeScene01");
  }

  preload() {
    // Optionally load a raster city map
    this.load.image("bullet", "images/bullet.png");
    this.load.spritesheet('friendly', 'images/witch_sheet.png', {frameWidth: this.FRAME_W,frameHeight: this.FRAME_H,},);
    this.load.spritesheet('enemy', 'images/enemy_sheet.png', {frameWidth: this.FRAME_W,frameHeight: this.FRAME_H,},);
  }

  create() {
    // --- World / Camera ------------------------------------------------------
    const W = 2000, H = 2000;
    this.physics.world.setBounds(0, 0, W, H);
    // this.add.image(0, 0, "city").setOrigin(0).setScrollFactor(1);

    // animation
    this.makeWalkAnim("walk-back",    this.FRAMES.back.walk);
    this.makeWalkAnim("walk-left",    this.FRAMES.left.walk);
    this.makeWalkAnim("walk-right",   this.FRAMES.right.walk);
    this.makeWalkAnim("walk-forward", this.FRAMES.forward.walk);

    // --- Player --------------------------------------------------------------
    this.player = new Friendly(this, 200, 200, "you", 5);
    this.cameras.main.startFollow(this.player, true, 0.12, 0.12);
    this.cameras.main.setBounds(0, 0, W, H);

    // --- Obstacles (placeholder layout; replace with your blocks) -----------
    this.blocks = this.physics.add.staticGroup();
    this.blocks.create(600, 420, undefined).setDisplaySize(320, 90).refreshBody();
    this.blocks.create(1150, 880, undefined).setDisplaySize(520, 120).refreshBody();
    this.blocks.create(1450, 420, undefined).setDisplaySize(280, 280).refreshBody();
    this.blocks.create(400, 1300, undefined).setDisplaySize(360, 160).refreshBody();
    this.physics.add.collider(this.player, this.blocks);

    // --- Safe Zone (win if overlap) -----------------------------------------
    this.safeZone = this.add.zone(1880, 120, 160, 160);
    this.physics.world.enable(this.safeZone);
    (this.safeZone.body as Phaser.Physics.Arcade.Body).setAllowGravity(false).moves = false;

    // --- Chasers -------------------------------------------------------------
    this.chasers = this.add.group();
    const c1 = new Chaser(this, 1600, 1600, "Chaser A", { speed: 120, dashEveryMs: 0 });
    const c2 = new Chaser(this, 300, 1700, "Chaser B", { speed: 110, dashEveryMs: 4200, dashSpeed: 240 });
    c1.setTarget(this.player).setObstacles(this.blocks);
    c2.setTarget(this.player).setObstacles(this.blocks);
    this.chasers.addMultiple([c1, c2]);

    this.physics.add.collider(this.chasers, this.blocks);
    this.physics.add.overlap(this.player, this.chasers, () => this.gameOver(false));
    this.physics.add.overlap(this.player, this.safeZone, () => this.gameOver(true));

    // --- HUD -----------------------------------------------------------------
    this.timerText = this.add.text(12, 46, "", { fontSize: "16px", color: "#fff" })
      .setScrollFactor(0)
      .setDepth(2000);

    // --- Keyboard: press to move, release to stop ---------------------------
    const onDown = (k: string) => {
      if (k === "arrowup" || k === "w") this.move.up = true;
      if (k === "arrowdown" || k === "s") this.move.down = true;
      if (k === "arrowleft" || k === "a") this.move.left = true;
      if (k === "arrowright" || k === "d") this.move.right = true;
    };
    const onUp = (k: string) => {
      if (k === "arrowup" || k === "w") this.move.up = false;
      if (k === "arrowdown" || k === "s") this.move.down = false;
      if (k === "arrowleft" || k === "a") this.move.left = false;
      if (k === "arrowright" || k === "d") this.move.right = false;
    };
    this.input.keyboard!.on("keydown", (e: KeyboardEvent) => onDown(e.key.toLowerCase()));
    this.input.keyboard!.on("keyup", (e: KeyboardEvent) => onUp(e.key.toLowerCase()));

    // --- Voice (optional): accept only "stop" for simplicity ----------------
    const parser = new CommandParser({
      exec: (s: any) => {
        if (s.type === "STOP") {
          this.move = { up: false, down: false, left: false, right: false };
        }
      },
    } as any);
    new VoiceInput(parser).attach();

    // --- Countdown -----------------------------------------------------------
    this.time.addEvent({
      delay: 1000,
      loop: true,
      callback: () => {
        this.timeLeft -= 1;
        if (this.timeLeft <= 0) this.gameOver(true);
      },
    });
  }

  update() {
    // HUD
    this.timerText.setText(`Survive: ${Math.max(0, this.timeLeft)}s  •  Reach the Safe Zone`);

    // Player movement (normalized 8-way)
    const body = this.player.body as Phaser.Physics.Arcade.Body;
    let vx = 0, vy = 0;
    if (this.move.up) vy -= 1;
    if (this.move.down) vy += 1;
    if (this.move.left) vx -= 1;
    if (this.move.right) vx += 1;

    if (vx !== 0 || vy !== 0) {
      // 斜め移動も速度一定に
      const len = Math.hypot(vx, vy) || 1;
      body.setVelocity((vx / len) * this.moveSpeed, (vy / len) * this.moveSpeed);

      // 向いている方向を決める（横優先）
      if (Math.abs(vx) >= Math.abs(vy)) {
        this.player.direction = vx >= 0 ? 0 : 180;    // 右:0 / 左:180
      } else {
        this.player.direction = vy >= 0 ? 90 : 270;   // 下:90 / 上:270
      }

      // 向きに応じて walk アニメを再生
      const key = this.player.direction === 0   ? "right"
                 : this.player.direction === 180 ? "left"
                 : this.player.direction === 270 ? "forward"
                 : "back";
      this.player.play(`walk-${key}`, true);
    } else {
      // 停止時は最後の向きの先頭フレームで止める
      (this.player as any).playIdleFromDirection?.();
      body.setVelocity(0, 0);
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
}
