// app/src/scenes/EscapeScene.ts
import Phaser from "phaser";
import { Friendly } from "../entities/Friendly";
import { Chaser } from "../entities/Chaser";
import { CommandParser } from "../commands/CommandParser";
import { VoiceInput } from "../commands/VoiceInput";

type MoveState = { up: boolean; down: boolean; left: boolean; right: boolean };

export class EscapeScene extends Phaser.Scene {
  private hero!: Friendly;
  private chasers!: Phaser.GameObjects.Group;
  private blocks!: Phaser.Physics.Arcade.StaticGroup;
  private safeZone!: Phaser.GameObjects.Zone;

  private timeLeft = 75; // survive N seconds to win
  private timerText!: Phaser.GameObjects.Text;

  private move: MoveState = { up: false, down: false, left: false, right: false };
  private moveSpeed = 180;

  constructor() {
    super("EscapeScene");
  }

  preload() {
    // Optionally load a raster city map
    // this.load.image("city", "images/city_1024.png");
  }

  create() {
    // --- World / Camera ------------------------------------------------------
    const W = 2000, H = 2000;
    this.physics.world.setBounds(0, 0, W, H);
    // this.add.image(0, 0, "city").setOrigin(0).setScrollFactor(1);

    // --- Player --------------------------------------------------------------
    this.hero = new Friendly(this, 200, 200, "you", 5);
    this.cameras.main.startFollow(this.hero, true, 0.12, 0.12);
    this.cameras.main.setBounds(0, 0, W, H);

    // --- Obstacles (placeholder layout; replace with your blocks) -----------
    this.blocks = this.physics.add.staticGroup();
    this.blocks.create(600, 420, undefined).setDisplaySize(320, 90).refreshBody();
    this.blocks.create(1150, 880, undefined).setDisplaySize(520, 120).refreshBody();
    this.blocks.create(1450, 420, undefined).setDisplaySize(280, 280).refreshBody();
    this.blocks.create(400, 1300, undefined).setDisplaySize(360, 160).refreshBody();
    this.physics.add.collider(this.hero, this.blocks);

    // --- Safe Zone (win if overlap) -----------------------------------------
    this.safeZone = this.add.zone(1880, 120, 160, 160);
    this.physics.world.enable(this.safeZone);
    (this.safeZone.body as Phaser.Physics.Arcade.Body).setAllowGravity(false).moves = false;

    // --- Chasers -------------------------------------------------------------
    this.chasers = this.add.group();
    const c1 = new Chaser(this, 1600, 1600, "Chaser A", { speed: 120, dashEveryMs: 0 });
    const c2 = new Chaser(this, 300, 1700, "Chaser B", { speed: 110, dashEveryMs: 4200, dashSpeed: 240 });
    c1.setTarget(this.hero).setObstacles(this.blocks);
    c2.setTarget(this.hero).setObstacles(this.blocks);
    this.chasers.addMultiple([c1, c2]);

    this.physics.add.collider(this.chasers, this.blocks);
    this.physics.add.overlap(this.hero, this.chasers, () => this.gameOver(false));
    this.physics.add.overlap(this.hero, this.safeZone, () => this.gameOver(true));

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
    const body = this.hero.body as Phaser.Physics.Arcade.Body;
    let vx = 0, vy = 0;
    if (this.move.up) vy -= 1;
    if (this.move.down) vy += 1;
    if (this.move.left) vx -= 1;
    if (this.move.right) vx += 1;

    if (vx !== 0 || vy !== 0) {
      const len = Math.hypot(vx, vy) || 1;
      body.setVelocity((vx / len) * this.moveSpeed, (vy / len) * this.moveSpeed);
    } else {
      body.setVelocity(0, 0);
    }
  }

  private gameOver(win: boolean) {
    this.scene.start("GameResultsScene", { win, timeSurvived: 75 - this.timeLeft });
  }
}
