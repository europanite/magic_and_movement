// app/src/entities/CharacterBase.ts
import Phaser from "phaser";
import { Base } from "./Base";
import { DeathFX } from "../effects/DeathFX";
import { SoundManager } from "../audio/SoundManager";

/** Character 個別の効果音キー */
export type CharacterSoundProfile = {
  death?: string;   // 撃破（死亡）時のSEキー
  hit?: string;     // 被弾時のSEキー（必要なら）
  attack?: string;  // 攻撃時のSEキー（必要なら）
};

export type CharacterBaseOptions = ConstructorParameters<typeof Base>[6] & {
  sounds?: CharacterSoundProfile;
};

/** シーン側に実装されている想定の弾生成 API  */
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

/** 武器の既定パラメータ（spawnBullet の引数に対応） */
export type WeaponConfig = {
  speed: number;        // 発射速度
  radius: number;       // 弾の見た目半径（displaySize の半径想定）
  lifespanMs: number;   // 弾の寿命
  armDelayMs: number;   // アーム（起爆可）までの遅延
  cooldownMs: number;   // 射撃クールダウン
};

export type ShootOverrides = Partial<Omit<WeaponConfig, "cooldownMs">>;

export class CharacterBase extends Base {
  protected sounds: Required<CharacterSoundProfile> = { death: "", hit: "", attack: "" };

  /** 共有武器設定（各キャラで上書き可） */
  protected weapon: WeaponConfig = {
    speed: 300,
    radius: 8,
    lifespanMs: 2500,
    armDelayMs: 300,
    cooldownMs: 140,
  };

  /** クールダウン管理 */
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

  /** 武器パラメータをキャラ単位で上書き */
  public setWeapon(config: Partial<WeaponConfig>) {
    this.weapon = { ...this.weapon, ...config };
    return this;
  }

  /** クールダウンを考慮して撃てるか？ */
  public canShoot(now = this.scene.time.now): boolean {
    return (now - this.lastShotAt) >= this.weapon.cooldownMs;
  }

  /** 単発射撃：角度（度数法）必須。Override で速度/寿命/半径/アーム遅延を上書き可。 */
  public shoot(angleDeg: number, overrides: ShootOverrides = {}): boolean {
    const scene = this.scene as SceneWithSpawnBullet;
    const now = this.scene.time.now;
    if (!this.canShoot(now)) return false;
    if (typeof scene.spawnBullet !== "function") {
      console.warn("[CharacterBase] scene.spawnBullet が見つかりません。");
      return false;
    }

    const speed      = overrides.speed      ?? this.weapon.speed;
    const radius     = overrides.radius     ?? this.weapon.radius;
    const lifespanMs = overrides.lifespanMs ?? this.weapon.lifespanMs;
    const armDelayMs = overrides.armDelayMs ?? this.weapon.armDelayMs;

    scene.spawnBullet(this.x, this.y, angleDeg, speed, radius, lifespanMs, armDelayMs);
    this.lastShotAt = now;

    // 攻撃SE（あれば）
    if (this.sounds.attack) {
      this.scene.sound.play(this.sounds.attack, { volume: 0.6 });
    }

    return true;
  }

  /**
   * 扇状拡散射撃：
   *  centerDeg … 中心角度（度数法）
   *  count …… 発射数（2以上）
   *  spreadDeg … 全体の扇角（左右合計）
   */
  public shootSpread(centerDeg: number, count = 5, spreadDeg = 30, overrides: ShootOverrides = {}): boolean {
    if (count <= 0) return false;
    const scene = this.scene as SceneWithSpawnBullet;
    const now = this.scene.time.now;
    if (!this.canShoot(now)) return false;
    if (typeof scene.spawnBullet !== "function") {
      console.warn("[CharacterBase] scene.spawnBullet が見つかりません。");
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

    // 攻撃SE（あれば）
    if (this.sounds.attack) {
      this.scene.sound.play(this.sounds.attack, { volume: 0.6 });
    }

    return true;
  }

  // ===== 死亡処理：既存実装を踏襲しつつ安定化 =====
  protected override die() {
    // ① 再入防止
    if (this.getData("__dying")) return;
    this.setData("__dying", true);

    this.nameTag?.destroy();

    const kind = (this.getData("kind") as "player" | "enemy" | "boss") ?? "enemy";

    // ② まず無効化（preUpdate で再実行されないように）
    this.setActive(false).setVisible(false);
    const body = this.body as Phaser.Physics.Arcade.Body | undefined;
    if (body) body.enable = false;

    // ③ SE：SoundManager を優先。なければ DeathFX 側のデフォルトを利用可能。
    SoundManager.I?.characters?.playDeath(kind);

    // ④ 視覚演出（粒子・シェイク）
    DeathFX.burstParticles(
      this.scene,
      this.x,
      this.y,
      kind === "player" ? 0x80d0ff : kind === "boss" ? 0xff8080 : 0xffe080
    );
    this.scene.cameras.main.shake(kind === "boss" ? 200 : 120, kind === "boss" ? 0.01 : 0.006);

    // ⑤ tween 完了時に破棄（destroy はここだけ）
    DeathFX.tweenVanish(this.scene, this as unknown as Phaser.GameObjects.Sprite, () => {
      if (!this.destroyed) this.destroy();
    });
  }
}
