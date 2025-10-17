// app/src/commands/VoiceInput.ts
import { createASR } from "../asr";
import { CommandParser } from "./CommandParser";
import { logger } from "../logger";

export class VoiceInput {
  private rec = createASR("en-US");
  private active = false;

  constructor(private parser: CommandParser) {}

  attach(btnId = "btnMic", statusId = "micStatus") {
    const btn = document.getElementById(btnId) as HTMLButtonElement | null;
    const status = document.getElementById(statusId) as HTMLSpanElement | null;

    if (!this.rec.supported) {
      status && (status.textContent = "mic: unsupported");
      logger.warn("Web Speech API is not available.");
      return;
    }

    const set = (s: string) => status && (status.textContent = s);

    btn?.addEventListener("click", () => {
      if (!this.active) {
        this.rec.start((txt, isFinal) => {
          set(`mic: listening${isFinal ? " (final)" : ""}`);
          if (isFinal) this.parser.fromText(txt);
        });
        this.active = true;
        set("mic: listening");
      } else {
        this.rec.stop();
        this.active = false;
        set("mic: stopped");
      }
    });
  }
}
