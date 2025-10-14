const BASE = import.meta.env.VITE_API_BASE as string | undefined;

export async function createSession(): Promise<string> {
  if (!BASE) throw new Error("VITE_API_BASE not set");
  const r = await fetch(`${BASE}/commands/sessions`, { method: "POST" });
  const j = await r.json();
  return j.session_id as string;
}

export async function postRaw(sessionId: string, text: string) {
  if (!BASE) throw new Error("VITE_API_BASE not set");
  await fetch(`${BASE}/commands`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ session_id: sessionId, raw_text: text }),
  });
}

export async function pollNext(sessionId: string) {
  if (!BASE) throw new Error("VITE_API_BASE not set");
  const r = await fetch(`${BASE}/commands/next?session_id=${sessionId}`);
  if (!r.ok) return null;
  const t = await r.text();
  return t ? JSON.parse(t) as { command: "TURN_RIGHT"|"TURN_LEFT"|"LIGHT" } : null;
}
