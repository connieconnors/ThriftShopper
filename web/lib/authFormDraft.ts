/** Persist auth form fields across legal-doc navigation (session-scoped). */

const LOGIN_DRAFT_KEY = "ts_login_form_draft";
const SIGNUP_DRAFT_KEY = "ts_signup_form_draft";

export type LoginFormDraft = {
  email?: string;
  password?: string;
  acceptTerms?: boolean;
};

export type SignupFormDraft = {
  email?: string;
  password?: string;
  confirmPassword?: string;
  acceptTerms?: boolean;
  acceptsMarketing?: boolean;
};

function readDraft<T>(key: string): T | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function writeDraft<T>(key: string, draft: T) {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(key, JSON.stringify(draft));
  } catch {
    /* quota / private mode */
  }
}

export function readLoginDraft(): LoginFormDraft | null {
  return readDraft<LoginFormDraft>(LOGIN_DRAFT_KEY);
}

export function writeLoginDraft(draft: LoginFormDraft) {
  writeDraft(LOGIN_DRAFT_KEY, draft);
}

export function clearLoginDraft() {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(LOGIN_DRAFT_KEY);
}

export function readSignupDraft(): SignupFormDraft | null {
  return readDraft<SignupFormDraft>(SIGNUP_DRAFT_KEY);
}

export function writeSignupDraft(draft: SignupFormDraft) {
  writeDraft(SIGNUP_DRAFT_KEY, draft);
}

export function clearSignupDraft() {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(SIGNUP_DRAFT_KEY);
}
