// app/src/entities/CharacterBase.ts
import Phaser from "phaser";
import { Base } from "./Base";
import { DeathFX } from "../effects/DeathFX";
import { SoundManager } from "../audio/SoundManager";

export type CharacterSoundProfile = {
  death?: string;   // 撃破（死亡）時のSEキー
  hit?: string;     // 被弾時のSEキー（必要なら）
  attack?: string;  // 攻撃時のSEキー（必要なら）
};

export type CharacterBaseOptions = ConstructorParameters<typeof Base>[6] & {
  sounds?: CharacterSoundProfile;
};

export class CharacterBase extends Base {
  protected sounds: Required<CharacterSoundProfile> = {
    death: "", hit: "", attack: "",
  };

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
    if (opts?.sounds) {
      this.sounds = { ...this.sounds, ...opts.sounds };
    }
  }
    // app/src/entities/CharacterBase.ts
    protected override die() {
    // ① 再入防止
    if (this.getData("__dying")) return;
    this.setData("__dying", true);

    this.nameTag?.destroy();
    this.hitboxGfx?.destroy();

    const kind = (this.getData("kind") as "player"|"enemy"|"boss") ?? "enemy";

    // ② まず無効化（これで preUpdate から再実行されなくなる）
    this.setActive(false).setVisible(false);
    const body = this.body as Phaser.Physics.Arcade.Body | undefined;
    if (body) body.enable = false;

    // ③ SE 再生（必要なら個別キー／なければ種別デフォルト）
    //    ここは SoundManager 経由でも DeathFX.playSE でも OK
    //    既存方針どおり SoundManager を生かす例：
    SoundManager.I?.characters?.playDeath(kind);

    // ④ 視覚演出（粒子・シェイク・フェード）
    DeathFX.burstParticles(this.scene, this.x, this.y,
        kind === "player" ? 0x80d0ff : kind === "boss" ? 0xff8080 : 0xffe080);
    this.scene.cameras.main.shake(kind === "boss" ? 200 : 120, kind === "boss" ? 0.01 : 0.006);

    // ⑤ tween 完了時の破棄（ここでだけ destroy）
    DeathFX.tweenVanish(this.scene, this as unknown as Phaser.GameObjects.Sprite, () => {
        if (!this.destroyed) this.destroy();
    });
    }
}
