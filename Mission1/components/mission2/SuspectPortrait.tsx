"use client";

import { useMemo } from "react";

type Props = {
  name: string;
  tensionLevel: number;
  codeRevealed: boolean;
  contradictionThisTurn: boolean;
};

type Expr = "neutral" | "nervous" | "smug" | "caught";

function pickExpression(t: number, codeOut: boolean, contra: boolean): Expr {
  if (codeOut) return "caught";
  if (t >= 86) return "caught";
  if (t >= 61) return "smug";
  if (t >= 31) return "nervous";
  if (contra) return "nervous";
  return "neutral";
}

export function SuspectPortrait({
  name,
  tensionLevel,
  codeRevealed,
  contradictionThisTurn,
}: Props) {
  const expr = useMemo(
    () => pickExpression(tensionLevel, codeRevealed, contradictionThisTurn),
    [tensionLevel, codeRevealed, contradictionThisTurn],
  );

  const statusColor =
    tensionLevel < 35 ? "bg-emerald-400" : tensionLevel < 70 ? "bg-amber-400" : "bg-red-500";

  return (
    <div className="relative mx-auto w-full max-w-md">
      <div
        className="pointer-events-none absolute -inset-10 opacity-40 mission2-radar-sweep"
        style={{
          background:
            "conic-gradient(from 0deg, rgba(0,255,157,0.0), rgba(0,255,157,0.12), rgba(0,255,157,0.0))",
        }}
      />
      <div className="relative overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-4 shadow-glow">
        <div className="pointer-events-none absolute inset-0 opacity-25">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,rgba(0,255,157,0.15),transparent_55%)]" />
        </div>

        <div className="relative flex items-start justify-between gap-3">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-[var(--text-secondary)]">
              Subject
            </p>
            <p className="font-display text-xl font-extrabold tracking-[-0.02em] text-[var(--text-primary)]">
              {name}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`h-2.5 w-2.5 rounded-full ${statusColor} shadow-[0_0_12px_rgba(0,255,157,0.35)]`}
            />
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--text-muted)]">
              LIVE
            </span>
          </div>
        </div>

        <div className="relative mt-4 aspect-[4/3] w-full overflow-hidden rounded-xl border border-[var(--border)] bg-black/40">
          <div className="pointer-events-none absolute inset-0 opacity-30">
            <div className="h-full w-full bg-[linear-gradient(90deg,transparent,rgba(0,255,157,0.08),transparent)] mission2-scan-line" />
          </div>

          <svg
            viewBox="0 0 320 240"
            className="h-full w-full"
            role="img"
            aria-label={`Stylized portrait of ${name}`}
          >
            <defs>
              <linearGradient id="skin" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#c7b8a8" />
                <stop offset="100%" stopColor="#8f7a6a" />
              </linearGradient>
              <linearGradient id="suit" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#1b1b1f" />
                <stop offset="100%" stopColor="#0b0b0d" />
              </linearGradient>
            </defs>

            <rect x="0" y="0" width="320" height="240" fill="#0a0a0c" />
            <polygon points="40,240 160,40 280,240" fill="url(#suit)" opacity="0.95" />
            <ellipse cx="160" cy="118" rx="74" ry="86" fill="url(#skin)" />
            <rect x="96" y="168" width="128" height="34" rx="10" fill="#141418" />

            <g
              className={
                expr === "nervous"
                  ? "animate-[pulse_2.2s_ease-in-out_infinite]"
                  : expr === "caught"
                    ? "animate-[pulse_1.2s_ease-in-out_infinite]"
                    : ""
              }
            >
              <ellipse cx="132" cy="112" rx="10" ry="7" fill="#0b0b0d" />
              <ellipse cx="188" cy="112" rx="10" ry="7" fill="#0b0b0d" />
              {expr === "nervous" && (
                <ellipse cx="134" cy="113" rx="3" ry="2" fill="#ffffff" opacity="0.35" />
              )}
            </g>

            {expr === "smug" && (
              <path
                d="M 128 150 Q 160 168 192 146"
                fill="none"
                stroke="#2b2b33"
                strokeWidth="4"
                strokeLinecap="round"
              />
            )}
            {expr === "neutral" && (
              <path
                d="M 132 150 Q 160 158 188 150"
                fill="none"
                stroke="#2b2b33"
                strokeWidth="4"
                strokeLinecap="round"
              />
            )}
            {expr === "nervous" && (
              <path
                d="M 132 152 Q 160 154 188 152"
                fill="none"
                stroke="#2b2b33"
                strokeWidth="4"
                strokeLinecap="round"
              />
            )}
            {expr === "caught" && (
              <>
                <path
                  d="M 124 148 Q 160 172 196 148"
                  fill="none"
                  stroke="#2b2b33"
                  strokeWidth="4"
                  strokeLinecap="round"
                />
                <path
                  d="M 210 92 C 218 100 218 112 210 120"
                  fill="none"
                  stroke="rgba(0,255,157,0.35)"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
              </>
            )}

            <rect x="118" y="78" width="84" height="10" rx="3" fill="#15151a" opacity="0.55" />
          </svg>
        </div>

        <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--text-muted)]">
          Read: <span className="text-[var(--accent)]">{expr}</span>
        </p>
      </div>
    </div>
  );
}
