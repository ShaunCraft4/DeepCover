"use client";

import { motion } from "framer-motion";

import type { PlayerTag } from "@/data/types";
import { cn } from "@/lib/utils";

const OPTIONS: PlayerTag[] = ["REAL", "SYNTHETIC", "UNCERTAIN"];

type TagSelectorProps = {
  value: PlayerTag | null;
  onChange: (tag: PlayerTag) => void;
  disabled?: boolean;
};

export function TagSelector({ value, onChange, disabled }: TagSelectorProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-dossier-muted">
          Classification
        </p>
        <p className="font-mono text-[10px] text-dossier-muted">Commit tag</p>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {OPTIONS.map((opt) => {
          const active = value === opt;
          const palette =
            opt === "REAL"
              ? {
                  active:
                    "border-emerald-400/50 bg-emerald-500/10 text-emerald-100 shadow-[0_0_0_1px_rgba(52,211,153,0.25)]",
                  idle: "hover:border-emerald-400/25 hover:bg-emerald-500/5",
                }
              : opt === "SYNTHETIC"
                ? {
                    active:
                      "border-rose-400/50 bg-rose-500/10 text-rose-100 shadow-[0_0_0_1px_rgba(244,63,94,0.25)]",
                    idle: "hover:border-rose-400/25 hover:bg-rose-500/5",
                  }
                : {
                    active:
                      "border-amber-400/40 bg-amber-500/10 text-amber-100 shadow-[0_0_0_1px_rgba(251,191,36,0.22)]",
                    idle: "hover:border-amber-400/25 hover:bg-amber-500/5",
                  };

          return (
            <motion.button
              key={opt}
              type="button"
              disabled={disabled}
              onClick={() => onChange(opt)}
              className={cn(
                "relative overflow-hidden rounded-lg border border-dossier-border bg-dossier-bg/35 px-2 py-3 text-center transition-colors disabled:opacity-40",
                active ? palette.active : palette.idle,
              )}
              whileTap={{ scale: 0.98 }}
            >
              <span className="block font-mono text-[10px] uppercase tracking-[0.18em]">
                {opt}
              </span>
              {active ? (
                <motion.span
                  layoutId="tag-glow"
                  className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/5 to-transparent"
                  transition={{ type: "spring", stiffness: 500, damping: 38 }}
                />
              ) : null}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
