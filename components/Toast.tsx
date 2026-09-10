"use client";

export function Toast({ message }: { message: string }) {
  return (
    <div
      role="status"
      className="fixed top-5 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-full bg-slate-900 px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-slate-900/20 animate-[toast-in_200ms_ease-out]"
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        <circle cx="12" cy="12" r="9" />
        <path d="m8 12.5 2.5 2.5L16 9" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      {message}
    </div>
  );
}
