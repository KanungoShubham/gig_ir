"use client";

import { useId, useState } from "react";
import type { PlatformBreakdown } from "@/lib/reconciliation";

const PLATFORM_COLOR: Record<string, string> = {
  upwork: "#2a78d6",
  fiverr: "#eb6834",
  direct: "#1baf7a",
  other: "#eda100",
};

const PLATFORM_LABEL: Record<string, string> = {
  upwork: "Upwork",
  fiverr: "Fiverr",
  direct: "Direct / UPI",
  other: "Other",
};

function formatInr(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

const SIZE = 132;
const STROKE = 18;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function PlatformDonutChart({ data }: { data: PlatformBreakdown[] }) {
  const [hovered, setHovered] = useState<string | null>(null);
  const titleId = useId();

  const total = data.reduce((sum, d) => sum + d.netAmountInr, 0);

  if (data.length === 0 || total <= 0) {
    return (
      <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm shadow-slate-200/50">
        <h3 className="text-sm font-medium text-slate-700">Income mix</h3>
        <p className="mt-6 text-center text-sm text-slate-400">No data yet.</p>
      </div>
    );
  }

  let cumulativeOffset = 0;
  const segments = data.map((row) => {
    const fraction = row.netAmountInr / total;
    const dash = fraction * CIRCUMFERENCE;
    const offset = cumulativeOffset;
    cumulativeOffset += dash;
    return { ...row, fraction, dash, offset };
  });

  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm shadow-slate-200/50">
      <h3 id={titleId} className="text-sm font-medium text-slate-700">
        Income mix
      </h3>

      <div className="mt-3 flex flex-wrap items-center justify-center gap-4 sm:justify-start">
        <svg
          viewBox={`0 0 ${SIZE} ${SIZE}`}
          width={SIZE}
          height={SIZE}
          role="img"
          aria-labelledby={titleId}
          className="shrink-0"
        >
          <g transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}>
            <circle cx={SIZE / 2} cy={SIZE / 2} r={RADIUS} fill="none" stroke="#f1f0ec" strokeWidth={STROKE} />
            {segments.map((seg) => (
              <circle
                key={seg.platform}
                cx={SIZE / 2}
                cy={SIZE / 2}
                r={RADIUS}
                fill="none"
                stroke={PLATFORM_COLOR[seg.platform]}
                strokeWidth={hovered === seg.platform ? STROKE + 3 : STROKE}
                strokeDasharray={`${seg.dash} ${CIRCUMFERENCE - seg.dash}`}
                strokeDashoffset={-seg.offset}
                strokeLinecap="butt"
                style={{ transition: "stroke-width 120ms" }}
                onPointerEnter={() => setHovered(seg.platform)}
                onPointerLeave={() => setHovered(null)}
                tabIndex={0}
                role="img"
                aria-label={`${PLATFORM_LABEL[seg.platform]}: ${formatInr(seg.netAmountInr)}, ${Math.round(seg.fraction * 100)}%`}
              />
            ))}
          </g>
          <text
            x={SIZE / 2}
            y={SIZE / 2 - 6}
            textAnchor="middle"
            fontSize="10"
            fill="#898781"
          >
            Net income
          </text>
          <text x={SIZE / 2} y={SIZE / 2 + 12} textAnchor="middle" fontSize="13" fontWeight={700} fill="#0b0b0b">
            {formatInr(total)}
          </text>
        </svg>

        <ul className="w-full min-w-0 space-y-1.5 text-sm sm:w-auto sm:flex-1">
          {segments.map((seg) => (
            <li
              key={seg.platform}
              onPointerEnter={() => setHovered(seg.platform)}
              onPointerLeave={() => setHovered(null)}
              className={`grid grid-cols-[auto_1fr_auto] items-center gap-2 rounded-md px-1.5 py-1 transition ${
                hovered === seg.platform ? "bg-slate-50" : ""
              }`}
            >
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: PLATFORM_COLOR[seg.platform] }}
                aria-hidden
              />
              <span className="min-w-0 truncate text-slate-600">{PLATFORM_LABEL[seg.platform]}</span>
              <span className="shrink-0 font-medium text-slate-900">
                {Math.round(seg.fraction * 100)}%
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
