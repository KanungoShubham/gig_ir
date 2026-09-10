"use client";

import { useId, useState } from "react";
import type { TrendPoint } from "@/lib/reconciliation";

const SERIES_COLOR = "#0d9488"; // single-series brand accent (teal-600)
const SVG_WIDTH = 640;
const SVG_HEIGHT = 220;
const PADDING = { top: 16, right: 16, bottom: 28, left: 56 };

function formatInr(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDateShort(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

/** Rounds a max value up to a clean axis tick (matches marks-and-anatomy.md). */
function niceMax(value: number): number {
  if (value <= 0) return 100;
  const magnitude = Math.pow(10, Math.floor(Math.log10(value)));
  const normalized = value / magnitude;
  const niceNormalized = normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10;
  return niceNormalized * magnitude;
}

export function IncomeTrendChart({ data }: { data: TrendPoint[] }) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const [showTable, setShowTable] = useState(false);
  const titleId = useId();

  if (data.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm shadow-slate-200/50">
        <p className="text-sm font-medium text-slate-700">Cumulative net income over time</p>
        <p className="mt-6 text-center text-sm text-slate-400">No data yet.</p>
      </div>
    );
  }

  const plotWidth = SVG_WIDTH - PADDING.left - PADDING.right;
  const plotHeight = SVG_HEIGHT - PADDING.top - PADDING.bottom;
  const maxY = niceMax(Math.max(...data.map((d) => d.cumulativeNetInr)));

  const x = (i: number) =>
    data.length === 1 ? PADDING.left : PADDING.left + (i / (data.length - 1)) * plotWidth;
  const y = (value: number) => PADDING.top + plotHeight - (value / maxY) * plotHeight;

  const linePath = data
    .map((point, i) => `${i === 0 ? "M" : "L"} ${x(i)} ${y(point.cumulativeNetInr)}`)
    .join(" ");
  const areaPath = `${linePath} L ${x(data.length - 1)} ${PADDING.top + plotHeight} L ${x(0)} ${
    PADDING.top + plotHeight
  } Z`;

  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((t) => Math.round(maxY * t));
  const hovered = hoverIndex !== null ? data[hoverIndex] : null;

  function handlePointerMove(e: React.PointerEvent<SVGRectElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const relativeX = e.clientX - rect.left;
    const ratio = Math.min(Math.max(relativeX / rect.width, 0), 1);
    const index = Math.round(ratio * (data.length - 1));
    setHoverIndex(index);
  }

  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm shadow-slate-200/50">
      <div className="flex items-center justify-between">
        <h3 id={titleId} className="text-sm font-medium text-slate-700">
          Cumulative net income over time
        </h3>
        <button
          type="button"
          onClick={() => setShowTable((v) => !v)}
          className="text-xs font-medium text-slate-500 underline underline-offset-2 hover:text-slate-900"
        >
          {showTable ? "Show chart" : "View as table"}
        </button>
      </div>

      {showTable ? (
        <table className="mt-4 w-full text-sm">
          <caption className="sr-only">Cumulative net income over time</caption>
          <thead>
            <tr className="text-left text-xs text-slate-500">
              <th className="py-1 font-medium">Date</th>
              <th className="py-1 font-medium text-right">Net that day</th>
              <th className="py-1 font-medium text-right">Cumulative</th>
            </tr>
          </thead>
          <tbody>
            {data.map((point) => (
              <tr key={point.date} className="border-t border-slate-100">
                <td className="py-1.5 text-slate-700">{point.date}</td>
                <td className="py-1.5 text-right text-slate-600">{formatInr(point.netAmountInr)}</td>
                <td className="py-1.5 text-right font-medium text-slate-900">
                  {formatInr(point.cumulativeNetInr)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div className="relative mt-4">
          <p className="sr-only">
            Line chart of cumulative net income from {formatDateShort(data[0].date)} to{" "}
            {formatDateShort(data[data.length - 1].date)}, ending at{" "}
            {formatInr(data[data.length - 1].cumulativeNetInr)}.
          </p>
          <svg
            viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
            width="100%"
            height={SVG_HEIGHT}
            role="img"
            aria-labelledby={titleId}
          >
            {yTicks.map((tick) => (
              <g key={tick}>
                <line
                  x1={PADDING.left}
                  x2={SVG_WIDTH - PADDING.right}
                  y1={y(tick)}
                  y2={y(tick)}
                  stroke="#e1e0d9"
                  strokeWidth={1}
                />
                <text x={PADDING.left - 8} y={y(tick)} textAnchor="end" dominantBaseline="middle" fontSize="11" fill="#898781">
                  {tick >= 1000 ? `${Math.round(tick / 1000)}k` : tick}
                </text>
              </g>
            ))}

            <path d={areaPath} fill={SERIES_COLOR} opacity={0.1} stroke="none" />
            <path d={linePath} fill="none" stroke={SERIES_COLOR} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />

            {data.map((point, i) => (
              <circle
                key={point.date}
                cx={x(i)}
                cy={y(point.cumulativeNetInr)}
                r={hoverIndex === i ? 5 : 4}
                fill={SERIES_COLOR}
                stroke="#ffffff"
                strokeWidth={2}
              />
            ))}

            {hoverIndex !== null && (
              <line
                x1={x(hoverIndex)}
                x2={x(hoverIndex)}
                y1={PADDING.top}
                y2={PADDING.top + plotHeight}
                stroke="#c3c2b7"
                strokeWidth={1}
              />
            )}

            {/* Transparent hit layer for pointer tracking across the whole plot. */}
            <rect
              x={PADDING.left}
              y={PADDING.top}
              width={plotWidth}
              height={plotHeight}
              fill="transparent"
              onPointerMove={handlePointerMove}
              onPointerLeave={() => setHoverIndex(null)}
            />
          </svg>

          {hovered && (
            <div
              className="pointer-events-none absolute top-2 rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs shadow-md"
              style={{
                left: `${(x(hoverIndex!) / SVG_WIDTH) * 100}%`,
                transform: "translateX(-50%)",
              }}
            >
              <p className="font-semibold text-slate-900">{formatInr(hovered.cumulativeNetInr)}</p>
              <p className="text-slate-500">{formatDateShort(hovered.date)}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
