import Phaser from "phaser";
import { Base } from "./Base";
import { DeathFX } from "../effects/DeathFX";
import { SoundManager } from "../audio/SoundManager";
import { logger } from "../logger";
import { clamp } from "../utils/math";

export type CharacterSoundProfile = {
  death?: string;
  hit?: string;
  attack?: string;
};

export type CharacterBaseOptions = ConstructorParameters<typeof Base>[6] & {
  sounds?: CharacterSoundProfile;
};

type SceneWithSpawnBullet = Phaser.Scene & {
  spawnBullet?: (
    x: number,
    y: number,
    angleDeg: number,
    speed?: number,
    radius?: number,
    lifespanMs?: number,
    armDelayMs?: number
  ) => void;
};

export type WeaponConfig = {
  speed: number;
  radius: number;
  lifespanMs: number;
  armDelayMs: number;
  cooldownMs: number;
};

export type ShootOverrides = Partial<Omit<WeaponConfig, "cooldownMs">>;

export class CharacterBase extends Base {
  public direction: number = 90;          // 0:右, 90:下, 180:左, 270:上（右手座標）
  public speed: number = 0;               // px/s
  public speed_default: number = 240;
  public speed_run: number = 480;

  protected sounds: Required<CharacterSoundProfile> = { death: "", hit: "", attack: "" };

  protected weapon: WeaponConfig = {
    speed: 300,
    radius: 8,
    lifespanMs: 2500,
    armDelayMs: 300,
    cooldownMs: 140,
  };

  protected lastShotAt = 0;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    texture: string,
    frame: number | string,
    displayName: string,
    maxHp = 1,
    opts: CharacterBaseOptions = {}
  ) {
    super(scene, x, y, texture, frame, displayName, maxHp, opts);
    if (opts?.sounds) this.sounds = { ...this.sounds, ...opts.sounds };
  }

  preUpdate(time: number, delta: number) {
    super.preUpdate(time, delta);
    if (!this.active) return;

    const body = this.body as Phaser.Physics.Arcade.Body | undefined;
    if (!body) return;

    // ◆ 単一運動モデル：speed / direction → velocity
    if (this.speed !== 0) {
      const a = Phaser.Math.DegToRad(this.direction);
      body.setVelocity(Math.cos(a) * this.speed, Math.sin(a) * this.speed);
      this.onWalkFrame(this.facingFromDirection(this.direction));
    } else {
      body.setVelocity(0, 0);
    }
  }

  public setWeapon(config: Partial<WeaponConfig>) {
    this.weapon = { ...this.weapon, ...config };
    return this;
  }

  public canShoot(now = this.scene.time.now): boolean {
    return (now - this.lastShotAt) >= this.weapon.cooldownMs;
  }

  public shoot(angleDeg: number, overrides: ShootOverrides = {}): boolean {
    const scene = this.scene as SceneWithSpawnBullet;
    const now = this.scene.time.now;
    if (!this.canShoot(now)) return false;
    if (typeof scene.spawnBullet !== "function") {
      console.warn("[CharacterBase] scene.spawnBullet not found");
      return false;
    }
    const speed      = overrides.speed      ?? this.weapon.speed;
    const radius     = overrides.radius     ?? this.weapon.radius;
    const lifespanMs = overrides.lifespanMs ?? this.weapon.lifespanMs;
    const armDelayMs = overrides.armDelayMs ?? this.weapon.armDelayMs;

    scene.spawnBullet(this.x, this.y, angleDeg, speed, radius, lifespanMs, armDelayMs);
    this.lastShotAt = now;

    if (this.sounds.attack) this.scene.sound.play(this.sounds.attack, { volume: 0.6 });
    return true;
  }

  public shootSpread(centerDeg: number, count = 5, spreadDeg = 30, overrides: ShootOverrides = {}): boolean {
    if (count <= 0) return false;
    const scene = this.scene as SceneWithSpawnBullet;
    const now = this.scene.time.now;
    if (!this.canShoot(now)) return false;
    if (typeof scene.spawnBullet !== "function") {
      console.warn("[CharacterBase] scene.spawnBullet not found");
      return false;
    }
    const speed      = overrides.speed      ?? this.weapon.speed;
    const radius     = overrides.radius     ?? this.weapon.radius;
    const lifespanMs = overrides.lifespanMs ?? this.weapon.lifespanMs;
    const armDelayMs = overrides.armDelayMs ?? this.weapon.armDelayMs;

    if (count === 1) {
      scene.spawnBullet(this.x, this.y, centerDeg, speed, radius, lifespanMs, armDelayMs);
    } else {
      const step = spreadDeg / (count - 1);
      const start = centerDeg - spreadDeg / 2;
      for (let i = 0; i < count; i++) {
        const ang = start + step * i;
        scene.spawnBullet(this.x, this.y, ang, speed, radius, lifespanMs, armDelayMs);
      }
    }
    this.lastShotAt = now;
    if (this.sounds.attack) this.scene.sound.play(this.sounds.attack, { volume: 0.6 });
    return true;
  }

  protected override die() {
    if (this.getData("__dying")) return;
    this.setData("__dying", true);

    this.nameTag?.destroy();
    const kind = (this.getData("kind") as "player" | "enemy" | "boss") ?? "enemy";

    this.setActive(false).setVisible(false);
    const body = this.body as Phaser.Physics.Arcade.Body | undefined;
    if (body) body.enable = false;

    SoundManager.I?.characters?.playDeath(kind);

    DeathFX.burstParticles(
      this.scene, this.x, this.y,
      kind === "player" ? 0x80d0ff : kind === "boss" ? 0xff8080 : 0xffe080
    );
    this.scene.cameras.main.shake(kind === "boss" ? 200 : 120, kind === "boss" ? 0.01 : 0.006);
    DeathFX.tweenVanish(this.scene, this as unknown as Phaser.GameObjects.Sprite, () => {
      if (!this.destroyed) this.destroy();
    });
  }

  protected facingFromDirection(dirDeg: number): "right"|"left"|"forward"|"back" {
    const d = ((dirDeg % 360) + 360) % 360;
    const right = (d <= 45 || d > 315);
    const left  = (d > 135 && d <= 225);
    const back  = (d > 45 && d <= 135);
    if (right) return "right";
    if (left)  return "left";
    if (back)  return "back";
    return "forward";
  }

  protected onWalkFrame(_facing: "right"|"left"|"forward"|"back") { /* hook */ }

  public setDirection(deg: number) {
    this.direction = ((deg % 360) + 360) % 360;
    return this;
  }
  public setSpeed(v: number) {
    this.speed = Math.max(0, v);
    return this;
  }
  public accelerateBy(dv: number) {
    return this.setSpeed(this.speed + dv);
  }
  public rotateBy(deltaDeg: number) {
    this.direction = ((this.direction + deltaDeg) % 360 + 360) % 360;
    return this;
  }

  public faceTo(x: number, y: number) {
    const ang = Math.atan2(y - this.y, x - this.x);
    return this.setDirection(Phaser.Math.RadToDeg(ang));
  }

  public faceToAndWalk(x: number, y: number) {
    const ang = Math.atan2(y - this.y, x - this.x);
    this.setDirection(Phaser.Math.RadToDeg(ang));
    this.walk();
  }

  public stop()      { return this.setSpeed(0); }
  public walk()      { return this.setSpeed(this.speed_default); }
  public run()       { return this.setSpeed(this.speed_run); }
  public right()     { this.setDirection(0);   return this.walk(); }
  public left()      { this.setDirection(180); return this.walk(); }
  public forward()   { this.setDirection(270); return this.walk(); }
  public back()      { this.setDirection(90);  return this.walk(); }
  public turn_right(){ return this.rotateBy(90); }
  public turn_left() { return this.rotateBy(-90); }
  public turn_back() { return this.rotateBy(180); }
  public speedup()   { return this.accelerateBy(+10); }
}
