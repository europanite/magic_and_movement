import Phaser from "phaser";
import { Base } from "./Base";
import { DeathFX } from "../effects/DeathFX";
import { SoundManager } from "../audio/SoundManager";

/** Character Sounds */
export type CharacterSoundProfile = {
  death?: string; 
  hit?: string;
  attack?: string;
};

export type CharacterBaseOptions = ConstructorParameters<typeof Base>[6] & {
  sounds?: CharacterSoundProfile;
};

/** Bullet API  */
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

/** Weapon parameters */
export type WeaponConfig = {
  speed: number;
  radius: number;
  lifespanMs: number;
  armDelayMs: number;
  cooldownMs: number;
};

export type ShootOverrides = Partial<Omit<WeaponConfig, "cooldownMs">>;

export class Character extends Base {
  protected sounds: Required<CharacterSoundProfile> = { death: "", hit: "", attack: "" };

  /** Ciommon */
  protected weapon: WeaponConfig = {
    speed: 300,
    radius: 8,
    lifespanMs: 2500,
    armDelayMs: 300,
    cooldownMs: 140,
  };

  /** Cool Down*/
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

  /** Weapons */
  public setWeapon(config: Partial<WeaponConfig>) {
    this.weapon = { ...this.weapon, ...config };
    return this;
  }

  /** Cool down */
  public canShoot(now = this.scene.time.now): boolean {
    return (now - this.lastShotAt) >= this.weapon.cooldownMs;
  }

  /** shoot one bullet */
  public shoot(angleDeg: number, overrides: ShootOverrides = {}): boolean {
    const scene = this.scene as SceneWithSpawnBullet;
    const now = this.scene.time.now;
    if (!this.canShoot(now)) return false;
    if (typeof scene.spawnBullet !== "function") {
      console.warn("[Character] scene.spawnBullet not found");
      return false;
    }

    const speed      = overrides.speed      ?? this.weapon.speed;
    const radius     = overrides.radius     ?? this.weapon.radius;
    const lifespanMs = overrides.lifespanMs ?? this.weapon.lifespanMs;
    const armDelayMs = overrides.armDelayMs ?? this.weapon.armDelayMs;

    scene.spawnBullet(this.x, this.y, angleDeg, speed, radius, lifespanMs, armDelayMs);
    this.lastShotAt = now;

    // Shoot SE
    if (this.sounds.attack) {
      this.scene.sound.play(this.sounds.attack, { volume: 0.6 });
    }

    return true;
  }

  /**
   * Shoot Bullets：
   *  centerDeg … 
   *  count …… 
   *  spreadDeg … 
   */
  public shootSpread(centerDeg: number, count = 5, spreadDeg = 30, overrides: ShootOverrides = {}): boolean {
    if (count <= 0) return false;
    const scene = this.scene as SceneWithSpawnBullet;
    const now = this.scene.time.now;
    if (!this.canShoot(now)) return false;
    if (typeof scene.spawnBullet !== "function") {
      console.warn("[Character] scene.spawnBullet not found");
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

    // Attack SE
    if (this.sounds.attack) {
      this.scene.sound.play(this.sounds.attack, { volume: 0.6 });
    }

    return true;
  }

  // ===== die =====
  protected override die() {
    if (this.getData("__dying")) return;
    this.setData("__dying", true);

    this.nameTag?.destroy();

    const kind = (this.getData("kind") as "friendly" | "enemy" | "boss") ?? "enemy";

    this.setActive(false).setVisible(false);
    const body = this.body as Phaser.Physics.Arcade.Body | undefined;
    if (body) body.enable = false;

    SoundManager.I?.characters?.playDeath(kind);

    DeathFX.burstParticles(
      this.scene,
      this.x,
      this.y,
      kind === "friendly" ? 0x80d0ff : kind === "boss" ? 0xff8080 : 0xffe080
    );
    this.scene.cameras.main.shake(kind === "boss" ? 200 : 120, kind === "boss" ? 0.01 : 0.006);

    DeathFX.tweenVanish(this.scene, this as unknown as Phaser.GameObjects.Sprite, () => {
      if (!this.destroyed) this.destroy();
    });
  }
  public forward(){}
  public back(){}
  public right(){}
  public left (){}
  public walk(){}
  public work(){}
  public light(){}
  // public play(){}
  public pray (){}
  public lay (){}
  public stay(){}
  public dig(){}
  public stop(){}
  public run(){}
  public learn (){}
  public rock(){}
  public lock(){}
  public barrage(){}
}
