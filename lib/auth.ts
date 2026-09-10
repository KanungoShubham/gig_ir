/**
 * DEMO-ONLY authentication. There is no backend: "accounts" are stored in
 * localStorage and passwords are hashed client-side with a non-cryptographic
 * hash purely so a plaintext password never sits in localStorage during the
 * demo. This is NOT production security — see README "Assumptions". A real
 * version would do password hashing (bcrypt/argon2) and session issuance
 * server-side, never in the browser.
 */

const USERS_KEY = "income-reconciler:users";
const SESSION_KEY = "income-reconciler:session";

interface StoredUser {
  email: string;
  passwordHash: string;
}

/** FNV-1a: fast, deterministic, NOT cryptographically secure. Demo use only. */
export function hashPassword(password: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < password.length; i++) {
    hash ^= password.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16);
}

function readUsers(): StoredUser[] {
  const raw = localStorage.getItem(USERS_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as StoredUser[];
  } catch {
    return [];
  }
}

function writeUsers(users: StoredUser[]): void {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export function signUp(
  email: string,
  password: string
): { ok: true } | { ok: false; error: string } {
  const normalized = normalizeEmail(email);
  if (!isValidEmail(normalized)) {
    return { ok: false, error: "Enter a valid email address." };
  }
  if (password.length < 6) {
    return { ok: false, error: "Password must be at least 6 characters." };
  }
  const users = readUsers();
  if (users.some((u) => u.email === normalized)) {
    return { ok: false, error: "An account with this email already exists." };
  }
  users.push({ email: normalized, passwordHash: hashPassword(password) });
  writeUsers(users);
  localStorage.setItem(SESSION_KEY, normalized);
  return { ok: true };
}

export function logIn(
  email: string,
  password: string
): { ok: true } | { ok: false; error: string } {
  const normalized = normalizeEmail(email);
  const users = readUsers();
  const user = users.find((u) => u.email === normalized);
  if (!user || user.passwordHash !== hashPassword(password)) {
    return { ok: false, error: "Invalid email or password." };
  }
  localStorage.setItem(SESSION_KEY, normalized);
  return { ok: true };
}

export function logOut(): void {
  localStorage.removeItem(SESSION_KEY);
}

export function currentUser(): string | null {
  return localStorage.getItem(SESSION_KEY);
}

/** Fixed demo credentials shown on the login screen for reviewer convenience. */
export const DEMO_EMAIL = "demo@incomereconciler.app";
export const DEMO_PASSWORD = "demo1234";

/** Creates the demo account on first load if it doesn't exist yet. Idempotent. */
export function ensureDemoAccount(): void {
  const users = readUsers();
  if (users.some((u) => u.email === DEMO_EMAIL)) return;
  users.push({ email: DEMO_EMAIL, passwordHash: hashPassword(DEMO_PASSWORD) });
  writeUsers(users);
}
