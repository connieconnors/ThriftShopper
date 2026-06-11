/**
 * My Canvas Playground persistence.
 *
 * Phase A: localStorage per user (async API for Phase B Supabase swap).
 * Call initCanvasStore(userId) once when the Canvas page knows the user.
 */

export type CanvasEntryType = "vibe_search" | "discovery_note" | "story";

export type CanvasEntry = {
  id: string;
  type: CanvasEntryType;
  text?: string;
  imageDataUrl?: string;
  createdAt: string;
};

/** Stable ids for single-field sections (Phase B may use row ids instead). */
export const CANVAS_VIBE_ENTRY_ID = "vibe-active";
export const CANVAS_DISCOVERY_TEXT_ID = "discovery-text";
export const CANVAS_STORY_ENTRY_ID = "story-active";

export class CanvasStoreQuotaError extends Error {
  constructor() {
    super("Canvas storage quota exceeded");
    this.name = "CanvasStoreQuotaError";
  }
}

let activeUserId: string | null = null;

export function initCanvasStore(userId: string | null): void {
  activeUserId = userId;
}

function storageKey(): string {
  return activeUserId ? `ts_canvas_${activeUserId}` : "ts_canvas_guest";
}

function isQuotaError(err: unknown): boolean {
  if (!(err instanceof DOMException)) return false;
  return (
    err.code === 22 ||
    err.code === 1014 ||
    err.name === "QuotaExceededError" ||
    err.name === "NS_ERROR_DOM_QUOTA_REACHED"
  );
}

async function readAll(): Promise<CanvasEntry[]> {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(storageKey());
    if (!raw) return [];
    const parsed = JSON.parse(raw) as CanvasEntry[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function writeAll(entries: CanvasEntry[]): Promise<void> {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(storageKey(), JSON.stringify(entries));
  } catch (err) {
    if (isQuotaError(err)) throw new CanvasStoreQuotaError();
    throw err;
  }
}

export async function loadCanvasEntries(): Promise<CanvasEntry[]> {
  return readAll();
}

export async function saveCanvasEntry(entry: CanvasEntry): Promise<void> {
  const entries = await readAll();
  const index = entries.findIndex((e) => e.id === entry.id);
  if (index >= 0) {
    entries[index] = entry;
  } else {
    entries.push(entry);
  }
  await writeAll(entries);
}

export async function deleteCanvasEntry(id: string): Promise<void> {
  const entries = await readAll();
  const next = entries.filter((e) => e.id !== id);
  if (next.length === entries.length) return;
  await writeAll(next);
}

/** Downscale image to max edge, return JPEG data URL for localStorage. */
export async function compressImageToDataUrl(
  file: File,
  maxEdge = 800
): Promise<string> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error("Could not read image"));
      el.src = url;
    });

    const { naturalWidth: w, naturalHeight: h } = img;
    const scale = Math.min(1, maxEdge / Math.max(w, h));
    const tw = Math.max(1, Math.round(w * scale));
    const th = Math.max(1, Math.round(h * scale));

    const canvas = document.createElement("canvas");
    canvas.width = tw;
    canvas.height = th;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Could not prepare image");
    ctx.drawImage(img, 0, 0, tw, th);

    const dataUrl = canvas.toDataURL("image/jpeg", 0.82);
    if (!dataUrl.startsWith("data:image/")) {
      throw new Error("Could not encode image");
    }
    return dataUrl;
  } finally {
    URL.revokeObjectURL(url);
  }
}
