// app/src/commands/CommandParser.ts
import type { Semantic, SemanticExecutor } from "./Semantics";
import { logger } from "../logger";

export class CommandParser {
  constructor(private exec: SemanticExecutor) {}

  /** Keyboard to semantic (keydown) */
  fromKey(e: KeyboardEvent) {
    const k = e.key.toLowerCase();
    let sem: Semantic | null = null;

    switch (k) {
      case "arrowleft": sem = { type: "GO_LEFT" }; break;
      case "arrowright": sem = { type: "GO_RIGHT" }; break;
      // case "arrowleft": sem = { type: "GO_LEFT" }; break;
      // case "arrowright": sem = { type: "GO_RIGHT" }; break;
      case "l": sem = { type: "LIGHT_TOGGLE" }; break;
      case "w": sem = { type: "WALK" }; break;
      case "s": sem = { type: "STOP" }; break;
      case " ": sem = { type: "SHOOT" }; break;
      case "0": sem = { type: "SET_DIRECTION", degrees: 0 }; break;
      case "9": sem = { type: "SET_DIRECTION", degrees: 90 }; break;
      case "1": sem = { type: "SET_DIRECTION", degrees: 180 }; break;
      case "2": sem = { type: "SET_DIRECTION", degrees: 270 }; break;
    }

    if (sem) {
      e.preventDefault();
      logger.cmd(`Key -> ${this.describe(sem)}`);
      this.exec.exec(sem);
    }
  }

  /** Keyboard to semantic (keyup) — unify "press to walk, release to stop" */
  fromKeyUp(e: KeyboardEvent) {
    const k = e.key.toLowerCase();
    // If movement-related key is released, stop.
    if (k === "w" || k.startsWith("arrow")) {
      const sem: Semantic = { type: "STOP" };
      logger.cmd(`KeyUp -> ${this.describe(sem)}`);
      this.exec.exec(sem);
    }
  }

  /** Finalized voice text to semantic(s) */
  fromText(text: string) {
    const raw = text.trim().toLowerCase();
    if (!raw) return;

    // --- Enemy name ("attack goblin", "goblin")
    const enemy = this.findEnemyName(raw);
    if (enemy) { this.exec.exec({ type: "ATTACK_ENEMY", name: enemy }); return; }

    // --- Rock name ("rock alpha", "alpha")
    const rock = this.findRockName(raw);
    if (rock) { this.exec.exec({ type: "MOVE_TO_ROCK", name: rock }); return; }

    // --- Directional move: "go/move/walk left|right|forward|back"
    if (/\b(go|move|walk)\s+(forward|ahead|up)\b/.test(raw)) { this.exec.exec({ type: "GO_FORWARD" }); return; }
    if (/\b(go|move|walk)\s+(back|backward|reverse|down)\b/.test(raw)) { this.exec.exec({ type: "GO_BACK" }); return; }
    if (/\b(go|move|walk)\s+left\b/.test(raw))  { this.exec.exec({ type: "GO_LEFT" }); return; }
    if (/\b(go|move|walk)\s+right\b/.test(raw)) { this.exec.exec({ type: "GO_RIGHT" }); return; }

    // --- Single-word move: "forward|back|left|right"
    if (/^(forward|ahead|up)\b/.test(raw)) { this.exec.exec({ type: "GO_FORWARD" }); return; }
    if (/^(back|backward|reverse|down)\b/.test(raw)) { this.exec.exec({ type: "GO_BACK" }); return; }
    if (/^left\b/.test(raw))  { this.exec.exec({ type: "GO_LEFT" }); return; }
    if (/^right\b/.test(raw)) { this.exec.exec({ type: "GO_RIGHT" }); return; }

    // --- Turning 
    if (/\bturn\s+(left)\b/.test(raw))  { this.exec.exec({ type: "TURN_LEFT" }); return; }
    if (/\bturn\s+(right)\b/.test(raw)) { this.exec.exec({ type: "TURN_RIGHT" }); return; }
    if (/\b(turn back|turn around|about face)\b/.test(raw)) { this.exec.exec({ type: "TURN_BACK" }); return; }

    // --- Stop synonyms
    if (/\b(stop|freeze|halt|wait|hold)\b/.test(raw)) { this.exec.exec({ type: "STOP" }); return; }

    // --- Walk/Start
    if (/\b(walk|go|move)\b/.test(raw)) { this.exec.exec({ type: "WALK" }); return; }

    // --- Actions
    if (/\b(shoot|fire)\b/.test(raw)) { this.exec.exec({ type: "SHOOT" }); return; }
    if (/\b(light|lamp|torch|flashlight)\b/.test(raw)) { this.exec.exec({ type: "LIGHT_TOGGLE" }); return; }

    if (/\b(face|direction)\s+(\d{1,3})\b/.test(raw)) {
      const m = raw.match(/\b(face|direction)\s+(\d{1,3})\b/)!;
      const deg = Math.max(0, Math.min(359, parseInt(m[2], 10)));
      this.exec.exec({ type: "SET_DIRECTION", degrees: deg }); return;
    }

    // Walk/Stop
    if (/\b(stop|freeze|halt)\b/.test(raw)) {
      this.exec.exec({ type: "STOP" }); return;
    }
    if (/\b(walk|go|move)\b/.test(raw)) {
      this.exec.exec({ type: "WALK" }); return;
    }

    // Actions
    if (/\bshoot|fire\b/.test(raw)) {
      this.exec.exec({ type: "SHOOT" }); return;
    }
    if (/\blight\b/.test(raw)) {
      this.exec.exec({ type: "LIGHT_TOGGLE" }); return;
    }

    logger.warn(`Voice not understood: "${text}"`);
  }

  private findRockName(raw: string): string | null {
    const list = this.exec.listRockNames?.() ?? [];
    for (const name of list) {
      const n = name.toLowerCase();
      if (raw.includes(n)) return n;
    }
    const m = raw.match(/\brock\s+([a-z0-9_-]+)\b/);
    return m ? m[1] : null;
  }

  private describe(s: Semantic): string {
    switch (s.type) {
      case "MOVE_TO_ROCK": return `MOVE_TO_ROCK("${s.name}")`;
      case "SET_DIRECTION": return `SET_DIRECTION(${s.degrees})`;
      default: return s.type;
    }
  }
  private findEnemyName(raw: string): string | null {
    const list = (this.exec as any).listEnemyNames?.() as string[] ?? [];
    for (const name of list) {
      const n = name.toLowerCase();
      if (raw === n || raw.includes(n)) return name;
    }
    const m = raw.match(/\b(enemy|target)\s+([a-z0-9_-]+)\b/);
    return m ? m[2] : null;
  }
}
