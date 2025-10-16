export type LogLevel = "log" | "info" | "warn" | "error" | "cmd";
type Entry = { ts: number; level: LogLevel; msg: string };

export class OverlayLogger {
  private el: HTMLElement;
  private buf: Entry[] = [];
  private max = 200;
  private visible = true;

  constructor(opts?: { max?: number; captureConsole?: boolean }) {
    if (opts?.max) this.max = opts.max;
    this.el = this.ensureOverlay();
    if (opts?.captureConsole) this.captureConsole();
    window.addEventListener("keydown", (e) => {
      if (e.key === "`") this.toggle();
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "l") {
        e.preventDefault(); this.clear();
      }
    });
  }
  private ensureOverlay() {
    const el = document.getElementById("log") as HTMLPreElement | null;
    if (!el) throw new Error("#log element not found");
    return el;
  }
  
  private captureConsole() {
    const _log = console.log, _info = console.info, _warn = console.warn, _error = console.error;
    console.log = (...a: any[]) => { this.write("log", a.join(" ")); _log(...a); };
    console.info = (...a: any[]) => { this.write("info", a.join(" ")); _info(...a); };
    console.warn = (...a: any[]) => { this.write("warn", a.join(" ")); _warn(...a); };
    console.error = (...a: any[]) => { this.write("error", a.join(" ")); _error(...a); };
  }

  log(msg: string)  { this.write("log", msg); }
  info(msg: string) { this.write("info", msg); }
  warn(msg: string) { this.write("warn", msg); }
  error(msg: string){ this.write("error", msg); }
  cmd(msg: string)  { this.write("cmd", msg); }

  clear() { this.buf = []; this.render(); }
  toggle() { this.visible = !this.visible; (this.el as any).style.display = this.visible ? "" : "none"; }

  private write(level: LogLevel, msg: string) {
    this.buf.push({ ts: Date.now(), level, msg });
    if (this.buf.length > this.max) {
      this.buf.splice(0, this.buf.length - this.max);
    }
    this.render();
  }

  private render() {
    const lines = this.buf
      .slice() 
      .reverse()
      .map(e => this.format(e));
    (this.el as HTMLPreElement).textContent = lines.join("\n");
  }

  private format(e: Entry) {
    switch (e.level) {
      case "info":  return `[INFO]  ${e.msg}`;
      case "warn":  return `[WARN]  ${e.msg}`;
      case "error": return `[ERROR] ${e.msg}`;
      case "cmd":   return `> ${e.msg}`;
      default:      return e.msg;
    }
  }

  private hhmmss(ts:number){ const d=new Date(ts);
    return `${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}:${String(d.getSeconds()).padStart(2,"0")}`; }
  private tag(level: LogLevel){
    switch(level){ case "cmd": return "[CMD]"; case "info": return "[INFO]"; case "warn": return "[WARN]"; case "error": return "[ERR ]"; default: return "[LOG ]"; }
  }
}
export const logger = new OverlayLogger({ max: 300, captureConsole: false });
