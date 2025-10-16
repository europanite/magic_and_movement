import Phaser from "phaser";
import { CharacterBase } from "./CharacterBase";
import { logger } from "../logger";

export class Player extends CharacterBase {
  public direction: number = 90;

  // 自動移動
  private moveTarget: Phaser.Math.Vector2 | null = null;
  private targetRock: import("./Rock").Rock | null = null;
  private moveSpeed = 180;
  private facing: "right" | "left" | "forward" | "back" = "forward";
  private interrupted = false;
  private clampEnabled = false;

constructor(scene: Phaser.Scene, x: number, y: number, name = "you", maxHp = 5) {
  super(scene, x, y, "player", 0, name, maxHp, {
    sounds: { death: "se_player_die" },
    collideWorldBounds: true, // ←★追加！
  });
  this.setData("kind", "player");
}

  /**
   * 岩の名前を呼んだときに MainScene から呼ばれる想定のAPI
   * - 目的地を岩の中心座標に設定
   * - 目的岩の参照を保持（当たり判定チェックで使用）
   */
  moveToRock(target: Phaser.GameObjects.Rectangle) {
    this.moveTarget = new Phaser.Math.Vector2(target.x, target.y);
    this.targetRock = target;
    logger.info(`Move: heading to rock "${target.getData("name")}"`);
  }

  private playWalkAnim() {
    const key = {
      right:   "walk-right",
      left:    "walk-left",
      forward: "walk-forward",
      back:    "walk-back",
    }[this.facing];
    if (this.anims.currentAnim?.key !== key) {
      this.anims.play(key, true);
    }
  }

  public isAutoMoving(): boolean {
    return !!this.moveTarget;
  }

  /**
   * 自動移動中は「プレイヤー×岩の collider」を一時的に無効化するため、
   * Arcade Body の checkCollision を切り替える。
   * 目的外の岩では止まらず、目的の岩のヒットボックスに入った瞬間だけ停止。
   */
  preUpdate(time: number, delta: number) {
    super.preUpdate(time, delta);
    // --- 割り込みがあったら、このフレームは何もせず終了 ---
    if (this.interrupted) {
      this.interrupted = false; // ←★ ここで即リセット
      return;
    }

    const body = this.body as Phaser.Physics.Arcade.Body;

    if (this.moveTarget) {

      const dx = this.moveTarget.x - this.x;
      const dy = this.moveTarget.y - this.y;

      // Direction
      if (Math.abs(dx) >= Math.abs(dy)) {
        this.facing = dx >= 0 ? "right" : "left";
        this.direction = dx >= 0 ? 0 : 180;
      } else {
        this.facing = dy >= 0 ? "back" : "forward";
        this.direction = dy >= 0 ? 90 : 270;
      }

      // 速度更新 & アニメ
      const angle = Math.atan2(dy, dx);
      this.scene.physics.velocityFromRotation(angle, this.moveSpeed, body.velocity);
      this.playWalkAnim();

      // ---- ② 目的の岩の当たり判定に触れたら停止 ----
      if (this.targetRock && (this.targetRock.body as Phaser.Physics.Arcade.StaticBody)) {
        const pr = new Phaser.Geom.Rectangle(body.x, body.y, body.width, body.height);
        const rb = this.targetRock.body as Phaser.Physics.Arcade.StaticBody;
        const rr = new Phaser.Geom.Rectangle(rb.x, rb.y, rb.width, rb.height);

        if (Phaser.Geom.Intersects.RectangleToRectangle(pr, rr)) {
          this.stopAutoMove();
          logger.info("Stopped on target rock hitbox.");
        }
      }
    } else {
      // 自動移動していないときは通常の衝突（岩で止まる）に戻す
      if (body.checkCollision.none !== false) body.checkCollision.none = false;
    }

    // カメラが自分を映すようになったらクランプON
    const cam = this.scene.cameras.main;
    if (!this.clampEnabled) {
      if (cam.worldView.contains(this.x, this.y)) {
        this.clampEnabled = true;
      }
      return; // それまでは押し戻さない
    }

    this.keepInsideCameraView();
  }

  /** 自動移動の明示停止API（停止時に衝突判定も元に戻す） */
  public stopAutoMove() {
    const body = this.body as Phaser.Physics.Arcade.Body;
    if (body) {
      body.setVelocity(0, 0);
      body.checkCollision.none = false; // 通常の collider を復帰
    }
    this.moveTarget = null;
    this.targetRock = null;
  }

  public interruptAutoMove() {
    if (this.isAutoMoving()) {
      logger.info("Auto-move interrupted by user input.");
      this.stopAutoMove();
      this.interrupted = true;
    }
  }

  // Player.ts の class Player 内に追加
  private keepInsideCameraView() {
    const body = this.body as Phaser.Physics.Arcade.Body;
    if (!body) return;

    const cam = this.scene.cameras.main;
    // いま画面に映っているワールド領域（スクロール込み）
    const view = cam.worldView;

    // ヒットボックスの“半分”で余白（はみ出しを防ぐ）
    const halfW = body.width  * 0.5;
    const halfH = body.height * 0.5;

    // クランプ先（左/右/上/下）
    const minX = view.left  + halfW;
    const maxX = view.right - halfW;
    const minY = view.top   + halfH;
    const maxY = view.bottom- halfH;

    // 実際に押し戻す
    this.x = Phaser.Math.Clamp(this.x, minX, maxX);
    this.y = Phaser.Math.Clamp(this.y, minY, maxY);

    // 位置を直接いじったので、物理Bodyも同期
    body.position.x = this.x - halfW;
    body.position.y = this.y - halfH;
  }

}
