export const REPORT_REASONS = [
  "Prohibited item",
  "Inaccurate description",
  "Suspected counterfeit",
  "Inappropriate content",
  "Spam or scam",
] as const;

export type ReportReason = (typeof REPORT_REASONS)[number];

export const BLOCKED_USERS_STORAGE_KEY = "ts_blocked_user_ids";

export function readBlockedUsersFromStorage(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(BLOCKED_USERS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? parsed.filter((id) => typeof id === "string") : [];
  } catch {
    return [];
  }
}

export function writeBlockedUsersToStorage(ids: string[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(BLOCKED_USERS_STORAGE_KEY, JSON.stringify(ids));
}

export function addBlockedUserToStorage(userId: string) {
  const ids = new Set(readBlockedUsersFromStorage());
  ids.add(userId);
  writeBlockedUsersToStorage([...ids]);
}
