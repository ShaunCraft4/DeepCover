"use client";

import { motion } from "framer-motion";
import {
  AudioWaveform,
  Camera,
  FileText,
  Image as ImageIcon,
  Share2,
  Video,
} from "lucide-react";

import type { Artifact, ArtifactType, PlayerTag } from "@/data/types";
import { cn } from "@/lib/utils";

const typeIcon: Record<ArtifactType, typeof ImageIcon> = {
  image: ImageIcon,
  audio: AudioWaveform,
  video: Video,
  document: FileText,
  surveillance: Camera,
  social: Share2,
};

function StatusBadge({ tag }: { tag: PlayerTag | null }) {
  if (!tag) {
    return (
      <span className="font-mono text-[10px] uppercase tracking-wider text-dossier-muted">
        Unreviewed
      </span>
    );
  }
  const styles =
    tag === "REAL"
      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200"
      : tag === "SYNTHETIC"
        ? "border-rose-500/30 bg-rose-500/10 text-rose-200"
        : "border-amber-500/30 bg-amber-500/10 text-amber-100";
  return (
    <span
      className={cn(
        "rounded border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider",
        styles,
      )}
    >
      {tag}
    </span>
  );
}

type EvidenceBoardProps = {
  artifacts: Artifact[];
  selectedId: string | null;
  tags: Record<string, PlayerTag | null>;
  onSelect: (id: string) => void;
};

export function EvidenceBoard({ artifacts, selectedId, tags, onSelect }: EvidenceBoardProps) {
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-end justify-between gap-3 border-b border-dossier-border pb-4">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-dossier-muted">
            Evidence board
          </p>
          <p className="mt-1 text-sm text-dossier-text">Artifact queue</p>
        </div>
        <p className="font-mono text-[11px] text-dossier-muted">{artifacts.length} items</p>
      </div>

      <div className="mt-4 flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto pr-1">
        {artifacts.map((a, idx) => {
          const Icon = typeIcon[a.type];
          const active = a.id === selectedId;
          const tag = tags[a.id] ?? null;
          return (
            <motion.button
              key={a.id}
              type="button"
              onClick={() => onSelect(a.id)}
              className={cn(
                "group relative w-full rounded-lg border text-left transition-colors",
                active
                  ? "border-dossier-accent/50 bg-dossier-bg/70 shadow-glow-sm"
                  : "border-dossier-border bg-dossier-panel/40 hover:border-dossier-accent/25 hover:bg-dossier-bg/40",
              )}
              initial={false}
              whileHover={{ x: 2 }}
              transition={{ type: "spring", stiffness: 420, damping: 28 }}
              layout
            >
              <div className="flex gap-3 p-3">
                <div
                  className={cn(
                    "relative flex h-14 w-14 shrink-0 items-center justify-center rounded-md border",
                    active ? "border-dossier-accent/40 bg-dossier-bg" : "border-dossier-border bg-dossier-bg/60",
                  )}
                >
                  <Icon
                    className={cn(
                      "h-6 w-6 transition-colors",
                      active ? "text-dossier-accent" : "text-dossier-muted group-hover:text-dossier-text",
                    )}
                  />
                  <span className="absolute -right-1 -top-1 rounded bg-dossier-bg px-1 font-mono text-[9px] text-dossier-muted ring-1 ring-dossier-border">
                    {String(idx + 1).padStart(2, "0")}
                  </span>
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className="truncate text-sm font-medium text-dossier-text">{a.title}</p>
                    <StatusBadge tag={tag} />
                  </div>
                  <p className="mt-1 line-clamp-2 text-xs leading-snug text-dossier-muted">
                    {a.description}
                  </p>
                  <p className="mt-2 font-mono text-[10px] uppercase tracking-wider text-dossier-muted">
                    {a.type}
                  </p>
                </div>
              </div>
              {active ? (
                <motion.div
                  layoutId="artifact-active"
                  className="pointer-events-none absolute inset-y-2 left-1 w-[3px] rounded-full bg-dossier-accent"
                  transition={{ type: "spring", stiffness: 500, damping: 40 }}
                />
              ) : null}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
