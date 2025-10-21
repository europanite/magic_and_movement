import { CommandParser } from "./CommandParser";
import { logger } from "../logger";

/**
 */
export class KeyInput {
  private attached = false;

  constructor(private parser: CommandParser) {}

  private onKeyDown = (e: KeyboardEvent) => {
    this.parser.fromKey(e);
  };

  private onKeyUp = (e: KeyboardEvent) => {
    this.parser.fromKeyUp(e);
  };

  /**
   */
  attach(target: Window | Document = window) {
    if (this.attached) return;
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
