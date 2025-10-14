// utils/hitbox.ts
import Phaser from "phaser";

/**
 * 見た目（スケール・フレーム・オリジン適用後）の中心と
 * 物理ボディの中心を「必ず」一致させる。
 * - 丸: 最小辺ベースの円
 * - 角: 矩形
 */
export function syncHitboxToDisplay(
  obj: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody,
  opts: { hitboxShape?: "circle" | "rect"; scaleFactor?: number; padding?: number } = {}
) {
  const hitboxShape = opts.hitboxShape ?? "circle";
  const scaleFactor = opts.scaleFactor ?? 1.0;
  const padding     = opts.padding ?? 0;

  // 表示サイズ（scale 済み）
  const wDisp = Math.max(1, obj.displayWidth  - padding * 2);
  const hDisp = Math.max(1, obj.displayHeight - padding * 2);

  const body = obj.body as Phaser.Physics.Arcade.Body;

  if (hitboxShape === "circle") {
    const r = Math.max(1, (Math.min(wDisp, hDisp) * scaleFactor) * 0.5);

    // ① まず半径だけセット（サイズは r*2 に）
    body.setCircle(r);

    // ② スプライトの表示上の中心（ピクセル）
    const dOx = obj.displayOriginX;         // = displayWidth * originX
    const dOy = obj.displayOriginY;         // = displayHeight * originY

    // ③ body の中心をスプライト中心に一致させる
    //    → offset は「スプライト左上から body 左上まで」の差
    body.setOffset(dOx - r, dOy - r);
  } else {
    const bw = Math.max(1, wDisp * scaleFactor);
    const bh = Math.max(1, hDisp * scaleFactor);

    // ① サイズだけセット（center=true は使わない）
    body.setSize(bw, bh);

    // ② 表示中心に合わせて offset を決め打ち
    const dOx = obj.displayOriginX;
    const dOy = obj.displayOriginY;
    body.setOffset(dOx - bw * 0.5, dOy - bh * 0.5);
  }

  // 最終同期（位置ズレの温床を断つ）
  body.updateFromGameObject();
}
