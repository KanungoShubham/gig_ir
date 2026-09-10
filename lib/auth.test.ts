/**
 * @jest-environment jsdom
 */
import {
  currentUser,
  hashPassword,
  isValidEmail,
  logIn,
  logOut,
  signUp,
} from "./auth";

beforeEach(() => {
  localStorage.clear();
});

describe("hashPassword", () => {
  it("is deterministic for the same input", () => {
    expect(hashPassword("secret123")).toBe(hashPassword("secret123"));
  });

  it("differs for different inputs", () => {
    expect(hashPassword("secret123")).not.toBe(hashPassword("secret124"));
  });

  it("never returns the plaintext password", () => {
    expect(hashPassword("secret123")).not.toBe("secret123");
  });
});

describe("isValidEmail", () => {
  it("accepts a well-formed email", () => {
    expect(isValidEmail("a@b.com")).toBe(true);
  });

  it("rejects a malformed email", () => {
    expect(isValidEmail("not-an-email")).toBe(false);
    expect(isValidEmail("a@b")).toBe(false);
    expect(isValidEmail("")).toBe(false);
  });
});

describe("signUp", () => {
  it("creates a new account and logs the user in", () => {
    const result = signUp("test@example.com", "password1");
    expect(result.ok).toBe(true);
    expect(currentUser()).toBe("test@example.com");
  });

  it("normalizes email casing/whitespace", () => {
    signUp("  Test@Example.com  ", "password1");
    expect(currentUser()).toBe("test@example.com");
  });

  it("rejects a duplicate email", () => {
    signUp("test@example.com", "password1");
    logOut();
    const result = signUp("test@example.com", "password2");
    expect(result.ok).toBe(false);
  });

  it("rejects an invalid email", () => {
    const result = signUp("not-an-email", "password1");
    expect(result.ok).toBe(false);
  });

  it("rejects a too-short password", () => {
    const result = signUp("test@example.com", "abc");
    expect(result.ok).toBe(false);
  });
});

describe("logIn", () => {
  it("logs in with correct credentials", () => {
    signUp("test@example.com", "password1");
    logOut();
    const result = logIn("test@example.com", "password1");
    expect(result.ok).toBe(true);
    expect(currentUser()).toBe("test@example.com");
  });

  it("rejects an incorrect password", () => {
    signUp("test@example.com", "password1");
    logOut();
    const result = logIn("test@example.com", "wrongpassword");
    expect(result.ok).toBe(false);
    expect(currentUser()).toBeNull();
  });

  it("rejects a nonexistent account", () => {
    const result = logIn("nobody@example.com", "password1");
    expect(result.ok).toBe(false);
  });
});

describe("logOut", () => {
  it("clears the current session", () => {
    signUp("test@example.com", "password1");
    logOut();
    expect(currentUser()).toBeNull();
  });
});
