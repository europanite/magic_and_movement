// app/src/commands/KeyInput.ts
import { CommandParser } from "./CommandParser";
import { logger } from "../logger";

/**
 * Centralized keyboard handler.
 * - keydown は CommandParser.fromKey()
 * - keyup   は CommandParser.fromKeyUp()
 * - attach/detach で安全に登録解除できる
 */
export class KeyInput {
  private attached = false;

  constructor(private parser: CommandParser) {}

  private onKeyDown = (e: KeyboardEvent) => {
    // NOTE: CommandParser 側で preventDefault() する
    this.parser.fromKey(e);
  };

  private onKeyUp = (e: KeyboardEvent) => {
    this.parser.fromKeyUp(e);
  };

  /**
   * 既存の window 直付けを一本化
   */
  attach(target: Window | Document = window) {
    if (this.attached) return;
    // keydown/keyup を集中管理（passive:false で preventDefault を有効に）
    target.addEventListener("keydown", this.onKeyDown, { passive: false });
    target.addEventListener("keyup", this.onKeyUp, { passive: false });
    this.attached = true;
    logger.info("[KeyInput] attached");
  }

  detach(target: Window | Document = window) {
    if (!this.attached) return;
    target.removeEventListener("keydown", this.onKeyDown as any);
    target.removeEventListener("keyup", this.onKeyUp as any);
    this.attached = false;
    logger.info("[KeyInput] detached");
  }
}
