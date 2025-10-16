// 変更点の要旨：
// - setDir は歩かせない（向くだけ）に修正
// - 日本語コマンドを追加（例：「歩け/ストップ/走れ/方向◯度/岩◯◯」）
// - moveToRock は向くだけ。walk で auto-move を開始。

export type VoiceCmd =
  | { t: "setDir", deg: number }
  | { t: "rotate", ddeg: number }
  | { t: "setSpeed", v: number }
  | { t: "accel", dv: number }
  | { t: "stop" } | { t: "walk" } | { t: "run" }
  | { t: "attack" } 
  | { t: "spread", count?: number }
  | { t: "moveToRock", name: string };

const num = (s: string) => Number(s.replace(/[^\d\.\-]/g, "")) || 0;

export function parseVoice(textRaw: string): VoiceCmd[] {
  const text = textRaw.trim().toLowerCase();
  const out: VoiceCmd[] = [];

  // ======== English ========
  if (/face right/.test(text))   out.push({ t: "setDir", deg: 0 });
  if (/face left/.test(text))    out.push({ t: "setDir", deg: 180 });
  if (/face forward/.test(text)) out.push({ t: "setDir", deg: 270 });
  if (/face back|face backward/.test(text)) out.push({ t: "setDir", deg: 90 });

  const mTurn = text.match(/turn\s+(right|left)\s*(\d+)?/);
  if (mTurn) {
    const sign = mTurn[1] === "left" ? -1 : +1;
    const amt = mTurn[2] ? +num(mTurn[2]) : 90;
    out.push({ t: "rotate", ddeg: sign * amt });
  }

  if (/\bstop\b/.test(text)) out.push({ t: "stop" });
  if (/\bwalk\b/.test(text)) out.push({ t: "walk" });
  if (/\brun\b/.test(text))  out.push({ t: "run" });
  if (/\battack\b/.test(text)) out.push({ t: "attack" });

  const mSpeedAbs = text.match(/speed\s*(?:to|=)\s*(\d+)/);
  if (mSpeedAbs) out.push({ t: "setSpeed", v: +num(mSpeedAbs[1]) });

  const mSpeedRel = text.match(/(?:speed|faster|slower)\s*([+\-]?\d+)/);
  if (mSpeedRel) out.push({ t: "accel", dv: +num(mSpeedRel[1]) });

  const mDir = text.match(/(?:direction|heading)\s*(\d+)/);
  if (mDir) out.push({ t: "setDir", deg: +num(mDir[1]) });

  const mSpread = text.match(/spread\s*(\d+)/);
  if (mSpread) out.push({ t: "spread", count: Math.max(1, Math.min(21, +mSpread[1])) });

  const mRock = text.match(/\brock\s+([a-z0-9_]+)/);
  if (mRock) out.push({ t: "moveToRock", name: mRock[1] });

  return out;
}

export function applyVoiceCmds(player: any, cmds: VoiceCmd[]) {
  console.info("[VoiceCmd]", cmds);

  for (const c of cmds) {
    // 1) rock 以外の入力は「割り込み優先」
    if (c.t !== "moveToRock") {
      player.interruptAutoMove?.();
    }

    switch (c.t) {
      case "setDir":   player.setDirection(c.deg); break;
      case "rotate":   player.rotateBy(c.ddeg);    break;
      case "setSpeed": player.setSpeed(c.v);       break;
      case "accel":    player.accelerateBy(c.dv);  break;

      case "stop":     player.stopAutoMove();      break;

      // walk/run は明示的に移動開始
      case "walk":     player.startAutoMove();     break;
      case "run":      player.setSpeed(player.speed_run); player.startAutoMove(); break;

      case "attack":   player.shootSpread(player.direction, 3, 18); break;
      case "spread":   player.shootSpread(player.direction, c.count ?? 5, Math.min(60, 6 * (c.count ?? 5))); break;

      case "moveToRock": {
        const rock = player.scene.children.getAll().find(
          (o: any) => o?.getData && o.getData("name") === c.name
        );
        if (rock) {
          // 向く + すぐ歩く
          player.moveToRock(rock);
          player.startAutoMove();
        }
        break;
      }
    }
  }
}