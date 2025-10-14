// utils/projectile.ts
export interface HasBodyAndAngle {
  x: number;
  y: number;
  angle?: number;        // 度
  rotation?: number;     // ラジアン
  body?: { width?: number; height?: number; radius?: number };
}

/** シューター中心から「銃口（前方）」の生成位置を返す */
export function getMuzzleSpawn(
  shooter: HasBodyAndAngle,
  angleDeg: number,              // 弾の発射角（度）
  bulletRadius: number,          // 弾の見た目/当たり半径
  padding = 2                    // 余白(ピクセル)
): { x: number; y: number } {
  // シューターの“当たり半径”を概算（矩形でも円でもOK）
  const w = shooter.body?.width ?? 0;
  const h = shooter.body?.height ?? 0;
  const shooterHitRadius =
    shooter.body?.radius ??
    Math.max(w, h) * 0.5 || 12; // 幅高さ不明な場合のフォールバック

  // 射出方向（単位ベクトル）
  const rad = (angleDeg * Math.PI) / 180;
  const dx = Math.cos(rad);
  const dy = Math.sin(rad);

  // 銃口までの距離：シューター半径＋弾半径＋ε
  const muzzle = shooterHitRadius + bulletRadius + padding;

  return {
    x: shooter.x + dx * muzzle,
    y: shooter.y + dy * muzzle,
  };
}
