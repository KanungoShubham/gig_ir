"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  DEMO_EMAIL,
  DEMO_PASSWORD,
  currentUser,
  ensureDemoAccount,
  logIn,
  signUp,
} from "@/lib/auth";

const fieldClass =
  "mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-100";

const HIGHLIGHTS = [
  { label: "Platforms reconciled", value: "Upwork · Fiverr · Direct" },
  { label: "Fee visibility", value: "Every platform cut, itemized" },
  { label: "Tax buffer", value: "Auto set-aside on net income" },
];

type Status = "idle" | "loading" | "success";

function Spinner() {
  return (
    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 0 1 8-8v4a4 4 0 0 0-4 4H4z" />
    </svg>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<"email" | "password" | null>(null);
  const [status, setStatus] = useState<Status>("idle");

  useEffect(() => {
    ensureDemoAccount();
    if (currentUser()) {
      router.replace("/dashboard");
    }
  }, [router]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setStatus("loading");

    // Small delay so the loading state is visible — mirrors a real network
    // round-trip even though the demo auth is instant/local.
    setTimeout(() => {
      const result = mode === "login" ? logIn(email, password) : signUp(email, password);
      if (!result.ok) {
        setError(result.error);
        setStatus("idle");
        return;
      }
      setStatus("success");
      sessionStorage.setItem(
        "income-reconciler:toast",
        mode === "login" ? "Logged in successfully" : "Account created successfully"
      );
      setTimeout(() => router.push("/dashboard"), 600);
    }, 500);
  }

  function fillDemoCredentials() {
    setMode("login");
    setEmail(DEMO_EMAIL);
    setPassword(DEMO_PASSWORD);
    setError(null);
  }

  async function copyToClipboard(value: string, field: "email" | "password") {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(field);
      setTimeout(() => setCopied(null), 1500);
    } catch {
      // Clipboard API can be unavailable (e.g. insecure context); silently ignore.
    }
  }

  return (
    <main className="grid min-h-screen grid-cols-1 lg:grid-cols-5">
      {/* Right: auth form */}
      <section className="flex items-center justify-center bg-[#f6f6f4] px-4 py-12 lg:order-2 lg:col-span-2">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 text-sm font-semibold text-white">
              IR
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">Income Reconciler</p>
              <p className="text-xs text-slate-400">Multi-platform freelance income tracking</p>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-100 bg-white p-7 shadow-xl shadow-slate-200/60">
            <h1 className="text-xl font-semibold text-slate-900">
              {mode === "login" ? "Welcome back" : "Create your account"}
            </h1>
            <p className="mt-1 text-sm text-slate-400">
              {mode === "login"
                ? "Log in to see your reconciled income."
                : "Takes less than a minute."}
            </p>

            <div className="mt-5 flex rounded-full bg-slate-100 p-1 text-sm">
              <button
                type="button"
                onClick={() => setMode("login")}
                className={`flex-1 rounded-full py-1.5 font-medium transition ${
                  mode === "login"
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-400 hover:text-slate-600"
                }`}
              >
                Log in
              </button>
              <button
                type="button"
                onClick={() => setMode("signup")}
                className={`flex-1 rounded-full py-1.5 font-medium transition ${
                  mode === "signup"
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-400 hover:text-slate-600"
                }`}
              >
                Sign up
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              <fieldset disabled={status !== "idle"} className="space-y-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-slate-700">
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={fieldClass}
                    placeholder="you@example.com"
                  />
                </div>
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-slate-700">
                    Password
                  </label>
                  <input
                    id="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={fieldClass}
                    placeholder="••••••••"
                  />
                </div>

                {error && (
                  <p role="alert" className="text-sm text-red-600">
                    {error}
                  </p>
                )}

                {status === "success" && (
                  <p role="status" className="text-sm font-medium text-teal-700">
                    {mode === "login" ? "Welcome back!" : "Account created!"} Redirecting…
                  </p>
                )}

                <button
                  type="submit"
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-teal-700 py-2.5 text-sm font-medium text-white shadow-sm shadow-teal-900/10 transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-80"
                >
                  {status === "loading" && <Spinner />}
                  {status === "loading"
                    ? "Logging in…"
                    : status === "success"
                      ? "Success"
                      : mode === "login"
                        ? "Log in"
                        : "Create account"}
                </button>
              </fieldset>
            </form>

            <div className="mt-5 rounded-xl border border-teal-100 bg-teal-50/60 p-3.5 text-xs">
              <p className="font-medium text-teal-900">Reviewer demo account</p>
              <div className="mt-2 space-y-1.5">
                <div className="flex items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5">
                  <span className="truncate font-mono text-slate-600">{DEMO_EMAIL}</span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(DEMO_EMAIL, "email")}
                    className="shrink-0 font-medium text-teal-700 hover:text-teal-900"
                  >
                    {copied === "email" ? "Copied" : "Copy"}
                  </button>
                </div>
                <div className="flex items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5">
                  <span className="truncate font-mono text-slate-600">{DEMO_PASSWORD}</span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(DEMO_PASSWORD, "password")}
                    className="shrink-0 font-medium text-teal-700 hover:text-teal-900"
                  >
                    {copied === "password" ? "Copied" : "Copy"}
                  </button>
                </div>
              </div>
              <button
                type="button"
                onClick={fillDemoCredentials}
                className="mt-2 font-medium text-teal-800 underline underline-offset-2 hover:text-teal-950"
              >
                Fill demo credentials
              </button>
            </div>

            <p className="mt-4 text-center text-xs text-slate-400">
              Demo auth — data is stored in your browser only, not a real backend.
            </p>
          </div>
        </div>
      </section>

      {/* Left: brand panel */}
      <section className="relative hidden flex-col justify-between overflow-hidden bg-teal-800 p-10 text-white lg:order-1 lg:col-span-3 lg:flex">
        <div
          aria-hidden
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage: "radial-gradient(#fff 1.5px, transparent 1.5px)",
            backgroundSize: "22px 22px",
          }}
        />

        <div className="relative" />

        <div className="relative max-w-lg">
          <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-teal-100">
            Take-home exercise submission
          </span>
          <h2 className="mt-5 text-4xl font-semibold leading-[1.15]">
            One dashboard for every platform you invoice from.
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-teal-100">
            Freelancers earning across Upwork, Fiverr, and direct clients lose
            track of fees, currencies, and how much is actually safe to
            spend. This reconciles it all in one place.
          </p>

          <dl className="mt-10 grid grid-cols-1 gap-4 border-t border-white/15 pt-6 sm:grid-cols-3">
            {HIGHLIGHTS.map((item) => (
              <div key={item.label} className="rounded-xl bg-white/5 p-3.5">
                <dt className="text-xs text-teal-200">{item.label}</dt>
                <dd className="mt-1 text-sm font-semibold text-white">{item.value}</dd>
              </div>
            ))}
          </dl>
        </div>

        <p className="relative text-xs text-teal-200">Demo data only — nothing here is real.</p>
      </section>
    </main>
  );
}
