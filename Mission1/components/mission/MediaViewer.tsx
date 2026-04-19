"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, Fingerprint, Radio } from "lucide-react";

import type { Artifact } from "@/data/types";
import { useMissionStore } from "@/store/mission-store";
import { DossierAudio } from "@/components/ui/dossier-audio";
import { useShallow } from "zustand/react/shallow";

function assetUrlFor(artifact: Artifact): string | null {
  const fromContent = (artifact.content as any)?.assetUrl;
  if (typeof fromContent === "string" && fromContent.trim()) return fromContent.trim();
  const fromMeta =
    artifact.metadata?.ASSET_URL || artifact.metadata?.URL || artifact.metadata?.SRC || "";
  return String(fromMeta || "").trim() || null;
}

/** Never print raw paths — only describe how the intercept clip was loaded. */
function secureLinePlaybackSourceLabel(src: string): string {
  if (src.startsWith("data:")) return "ElevenLabs — inline MP3 (this session)";
  if (src.startsWith("blob:")) return "ElevenLabs — MP3 fetched into memory for playback";
  return "ElevenLabs — refresh with cache bypass (⌘⇧R) if playback fails";
}

function MetaSidebar({ artifact }: { artifact: Artifact }) {
  return (
    <aside className="w-full shrink-0 border-t border-dossier-border bg-dossier-bg/25 p-5 lg:w-[320px] lg:border-l lg:border-t-0">
      <div className="flex items-center gap-2">
        <Fingerprint className="h-4 w-4 text-dossier-accent" />
        <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-dossier-muted">
          Technical metadata
        </p>
      </div>
      <dl className="mt-4 space-y-3">
        {Object.entries(artifact.metadata).map(([k, v]) => (
          <div key={k} className="rounded-md border border-dossier-border/80 bg-dossier-panel/30 p-3">
            <dt className="font-mono text-[10px] uppercase tracking-wider text-dossier-muted">{k}</dt>
            <dd className="mt-1 break-words font-mono text-xs text-dossier-text">{v}</dd>
          </div>
        ))}
      </dl>
    </aside>
  );
}

function HintCallouts({ hints }: { hints: string[] }) {
  return (
    <div className="mt-5 space-y-3">
      <div className="flex items-center gap-2">
        <AlertTriangle className="h-4 w-4 text-amber-300/90" />
        <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-dossier-muted">
          Analyst notes / anomaly hints
        </p>
      </div>
      <ul className="space-y-2">
        {hints.map((h) => (
          <li
            key={h}
            className="rounded-lg border border-amber-500/15 bg-amber-500/5 px-4 py-3 text-sm leading-relaxed text-dossier-text/90"
          >
            {h}
          </li>
        ))}
      </ul>
    </div>
  );
}

function WaveformPlaceholder() {
  const bars = Array.from({ length: 48 }, (_, i) => {
    const h = 18 + ((i * 17) % 44);
    return h;
  });
  return (
    <div className="relative overflow-hidden rounded-xl border border-dossier-border bg-gradient-to-b from-dossier-panel to-dossier-bg p-5">
      <div className="pointer-events-none absolute inset-0 opacity-30 scanlines" />
      <div className="flex items-end justify-between gap-1">
        {bars.map((h, idx) => (
          <motion.span
            key={idx}
            className="w-[3px] rounded-sm bg-dossier-accent/55"
            initial={false}
            animate={{ height: [h * 0.55, h, h * 0.75] }}
            transition={{
              duration: 1.6,
              repeat: Infinity,
              repeatType: "mirror",
              delay: idx * 0.02,
              ease: "easeInOut",
            }}
            style={{ height: h }}
          />
        ))}
      </div>
      <div className="mt-4 flex items-center justify-between font-mono text-[10px] text-dossier-muted">
        <span className="inline-flex items-center gap-2">
          <Radio className="h-3.5 w-3.5 text-dossier-accent" />
          SPECTRAL PREVIEW (TRAINING)
        </span>
        <span>NOT PLAYBACK ENABLED</span>
      </div>
    </div>
  );
}

type MediaViewerProps = {
  artifact: Artifact | null;
  /** Used to show operator hints only during the active run. */
  phase?: "briefing" | "operations" | "debrief";
};

export function MediaViewer({ artifact, phase = "operations" }: MediaViewerProps) {
  const sessionVisual = useMissionStore(
    useShallow((s) => ({
      generatedImages: s.generatedImages,
      transcriptById: s.transcriptById,
      documentBodyOverride: s.documentBodyOverride,
      socialPostOverride: s.socialPostOverride,
      audioMainSrc: s.audioMainSrc,
    })),
  );

  /**
   * Intercept audio must be a `data:` or `blob:` URL — raw `/mission1/api/...` paths often fail on
   * `<audio src>` behind the Vite proxy. We POST transcript lines, then GET artifact TTS, then MP3 blob.
   */
  const [interceptBlobUrl, setInterceptBlobUrl] = useState<string | null>(null);
  const [interceptLoadError, setInterceptLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (!artifact || artifact.id !== "art-secure-line" || artifact.content.kind !== "audio") {
      setInterceptBlobUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
      setInterceptLoadError(null);
      return;
    }
    if (sessionVisual.audioMainSrc) {
      setInterceptBlobUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
      setInterceptLoadError(null);
      return;
    }

    const lines =
      sessionVisual.transcriptById["art-secure-line"] ?? artifact.content.transcript;
    if (!lines.length) {
      setInterceptLoadError("No transcript lines to send to ElevenLabs.");
      return;
    }

    let cancelled = false;
    setInterceptLoadError(null);

    (async () => {
      const tryAudioResponse = async (r: Response): Promise<boolean> => {
        const ct = (r.headers.get("content-type") ?? "").toLowerCase();
        if (ct.includes("application/json")) {
          const raw = await r.text();
          try {
            const j = JSON.parse(raw) as { error?: string; detail?: string };
            setInterceptLoadError(j.detail || j.error || raw.slice(0, 400));
          } catch {
            setInterceptLoadError(raw.slice(0, 400));
          }
          return false;
        }
        if (!r.ok) {
          const raw = await r.text();
          setInterceptLoadError(raw.slice(0, 400) || `HTTP ${r.status}`);
          return false;
        }
        const blob = await r.blob();
        if (!blob.size) {
          setInterceptLoadError("Empty audio response from ElevenLabs route.");
          return false;
        }
        const url = URL.createObjectURL(blob);
        setInterceptBlobUrl((prev) => {
          if (prev) URL.revokeObjectURL(prev);
          return url;
        });
        setInterceptLoadError(null);
        return true;
      };

      let r = await fetch("/mission1/api/mission/tts", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ lines }),
      });
      if (cancelled) return;
      if (await tryAudioResponse(r)) return;

      setInterceptLoadError(null);
      r = await fetch("/mission1/api/mission/tts?artifactId=art-secure-line");
      if (cancelled) return;
      await tryAudioResponse(r);
    })();

    return () => {
      cancelled = true;
    };
  }, [artifact, sessionVisual.audioMainSrc, sessionVisual.transcriptById]);

  const imageSrcFor = (a: Artifact) =>
    sessionVisual.generatedImages[a.id] || assetUrlFor(a) || null;

  const audioSrcFor = (a: Artifact) => {
    if (a.id === "art-secure-line" && a.content.kind === "audio") {
      return sessionVisual.audioMainSrc || interceptBlobUrl || null;
    }
    return assetUrlFor(a);
  };

  const audioPlaybackSrc =
    artifact?.type === "audio" && artifact.content.kind === "audio"
      ? audioSrcFor(artifact)
      : null;

  return (
    <div className="relative flex h-full min-h-0 flex-col overflow-hidden rounded-xl border border-dossier-border glass-panel">
      <div className="pointer-events-none absolute inset-0 opacity-25 scanlines" />
      <div className="relative border-b border-dossier-border px-6 py-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
          <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-dossier-muted">
            Inspect selected artifact
          </p>
          {phase === "operations" ? (
            <p className="max-w-md text-xs leading-relaxed text-dossier-muted sm:text-right">
              Use hints below the media, then pick REAL / SYNTHETIC / UNCERTAIN on the right.
            </p>
          ) : null}
        </div>
        <AnimatePresence mode="wait">
          {artifact ? (
            <motion.div
              key={artifact.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              className="mt-2"
            >
              <h2 className="text-balance text-xl font-semibold tracking-tight text-dossier-text md:text-2xl">
                {artifact.title}
              </h2>
              <p className="mt-2 max-w-3xl text-sm leading-relaxed text-dossier-muted">
                {artifact.description}
              </p>
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-4 rounded-lg border border-dossier-border/80 bg-dossier-panel/30 px-4 py-3"
            >
              <p className="text-sm font-medium text-dossier-text">Start on the left</p>
              <p className="mt-1 text-sm leading-relaxed text-dossier-muted">
                Click the first item in the evidence list to load it here. You will review each
                one, assign a classification, then write the threat assessment before submitting.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {!artifact ? (
        <div className="relative flex flex-1 items-center justify-center p-8 text-sm text-dossier-muted">
          Nothing loaded yet — choose an artifact from the list.
        </div>
      ) : (
        <div className="relative flex min-h-0 flex-1 flex-col lg:flex-row">
          <div className="min-h-0 flex-1 overflow-y-auto p-6">
            {artifact.type === "image" && artifact.content.kind === "image" ? (
              <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
                <div>
                  <div className="overflow-hidden rounded-xl border border-dossier-border bg-gradient-to-br from-dossier-panel to-dossier-bg">
                    <div className="relative aspect-[16/10] w-full bg-[radial-gradient(circle_at_20%_0%,rgba(0,255,157,0.08),transparent_55%)]">
                      {imageSrcFor(artifact) ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={imageSrcFor(artifact) ?? undefined}
                          alt={artifact.title}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full min-h-[200px] items-center justify-center p-8">
                          <div className="h-full w-full rounded-lg border border-dossier-border/80 bg-[linear-gradient(120deg,rgba(255,255,255,0.06),transparent),linear-gradient(210deg,rgba(0,255,157,0.08),transparent)]" />
                        </div>
                      )}
                    </div>
                    <div className="border-t border-dossier-border/80 bg-dossier-bg/40 p-4">
                      <p className="text-xs leading-relaxed text-dossier-text/90">
                        {artifact.content.caption}
                      </p>
                      {artifact.content.paletteNote ? (
                        <p className="mt-2 font-mono text-[11px] text-dossier-muted">
                          {artifact.content.paletteNote}
                        </p>
                      ) : null}
                      {!imageSrcFor(artifact) ? (
                        <p className="mt-2 font-mono text-[10px] text-dossier-muted">
                          No image yet. Session bootstrap will generate one when Gemini is
                          configured.
                        </p>
                      ) : null}
                    </div>
                  </div>
                  <HintCallouts hints={artifact.anomalyHints} />
                </div>
                <MetaSidebar artifact={artifact} />
              </div>
            ) : null}

            {artifact.type === "audio" && artifact.content.kind === "audio" ? (
              <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
                <div>
                  {artifact.id === "art-secure-line" &&
                  !sessionVisual.audioMainSrc &&
                  !interceptBlobUrl &&
                  !interceptLoadError ? (
                    <div className="rounded-xl border border-dossier-border bg-dossier-bg/30 p-6 text-sm text-dossier-muted">
                      <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-dossier-accent">
                        Preparing audio
                      </p>
                      <p className="mt-2">Fetching ElevenLabs speech for this intercept…</p>
                    </div>
                  ) : artifact.id === "art-secure-line" &&
                    !sessionVisual.audioMainSrc &&
                    interceptLoadError &&
                    !interceptBlobUrl ? (
                    <div className="rounded-xl border border-amber-500/25 bg-amber-500/5 p-5 text-sm text-dossier-text/90">
                      <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-amber-200/90">
                        Audio unavailable
                      </p>
                      <p className="mt-2 leading-relaxed">{interceptLoadError}</p>
                      <p className="mt-3 text-[10px] leading-relaxed text-dossier-muted">
                        Set <span className="font-mono">ELEVENLABS_API_KEY</span> or{" "}
                        <span className="font-mono">VITE_ELEVENLABS_API_KEY</span> in the repo-root{" "}
                        <span className="font-mono">.env</span> and restart the dev server.
                      </p>
                    </div>
                  ) : audioPlaybackSrc ? (
                    <div className="rounded-xl border border-dossier-border bg-dossier-bg/30 p-5">
                      <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-dossier-muted">
                        Audio playback
                      </p>
                      <DossierAudio
                        key={audioPlaybackSrc}
                        className="mt-4"
                        controls
                        preload="metadata"
                        src={audioPlaybackSrc}
                      />
                      <p className="mt-2 text-[10px] leading-relaxed text-dossier-muted">
                        ElevenLabs voice synthesis. Set{" "}
                        <span className="font-mono">ELEVENLABS_API_KEY</span> or{" "}
                        <span className="font-mono">VITE_ELEVENLABS_API_KEY</span> in repo-root{" "}
                        <span className="font-mono">.env</span>; restart{" "}
                        <span className="font-mono">npm run dev</span> after changes.
                      </p>
                      {artifact.id === "art-secure-line" ? (
                        <p className="mt-3 font-mono text-[10px] text-dossier-muted">
                          Source: {secureLinePlaybackSourceLabel(audioPlaybackSrc)}
                        </p>
                      ) : null}
                    </div>
                  ) : (
                    <WaveformPlaceholder />
                  )}
                  <div className="mt-5 rounded-xl border border-dossier-border bg-dossier-bg/30 p-5">
                    <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-dossier-muted">
                      Transcript (machine-assisted)
                    </p>
                    <div className="mt-4 space-y-3">
                      {(sessionVisual.transcriptById[artifact.id] ?? artifact.content.transcript).map(
                        (line) => (
                        <p
                          key={line}
                          className="border-l-2 border-dossier-accent/30 pl-4 text-sm leading-relaxed text-dossier-text/90"
                        >
                          {line}
                        </p>
                        ),
                      )}
                    </div>
                  </div>
                  <div className="mt-5 rounded-xl border border-dossier-border bg-dossier-panel/25 p-5">
                    <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-dossier-muted">
                      Acoustic analysis notes
                    </p>
                    <ul className="mt-3 space-y-2 text-sm text-dossier-muted">
                      {artifact.content.analysisNotes.map((n) => (
                        <li key={n} className="leading-relaxed">
                          — {n}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <HintCallouts hints={artifact.anomalyHints} />
                </div>
                <MetaSidebar artifact={artifact} />
              </div>
            ) : null}

            {artifact.type === "document" && artifact.content.kind === "document" ? (
              <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
                <div>
                  <div className="rounded-xl border border-dossier-border bg-[linear-gradient(180deg,rgba(17,17,17,0.9),rgba(5,5,5,0.65))] p-8 shadow-glow">
                    <div className="flex items-center justify-between gap-4 border-b border-dossier-border pb-4">
                      <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-dossier-accent">
                        {artifact.content.header}
                      </p>
                      <span className="rounded border border-dossier-border px-2 py-1 font-mono text-[10px] text-dossier-muted">
                        DOC
                      </span>
                    </div>
                    <div className="mt-6 space-y-4 text-sm leading-relaxed text-dossier-text/90">
                      {(artifact.id === "art-policy-memo" && sessionVisual.documentBodyOverride
                        ? sessionVisual.documentBodyOverride
                        : artifact.content.body
                      ).map((p) => (
                        <p key={p}>{p}</p>
                      ))}
                    </div>
                    {artifact.content.footer ? (
                      <p className="mt-8 border-t border-dossier-border pt-4 font-mono text-[11px] text-dossier-muted">
                        {artifact.content.footer}
                      </p>
                    ) : null}
                  </div>
                  <HintCallouts hints={artifact.anomalyHints} />
                </div>
                <MetaSidebar artifact={artifact} />
              </div>
            ) : null}

            {artifact.type === "surveillance" && artifact.content.kind === "surveillance" ? (
              <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
                <div>
                  <div className="overflow-hidden rounded-xl border border-dossier-border bg-dossier-bg">
                    <div className="relative aspect-[16/10] w-full bg-[radial-gradient(circle_at_70%_20%,rgba(0,255,157,0.06),transparent_55%)]">
                      {imageSrcFor(artifact) ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={imageSrcFor(artifact) ?? undefined}
                          alt={artifact.title}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="h-full min-h-[200px] bg-[repeating-linear-gradient(0deg,rgba(255,255,255,0.03)_0px,rgba(255,255,255,0.03)_1px,transparent_2px,transparent_4px)] opacity-40" />
                      )}
                    </div>
                    <div className="border-t border-dossier-border/80 bg-dossier-bg/90 p-4">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <p className="shrink-0 rounded-md border border-dossier-border bg-dossier-panel/40 px-3 py-2 font-mono text-[10px] text-dossier-text">
                          {artifact.content.zoneLabel}
                        </p>
                        <span className="font-mono text-[10px] text-dossier-accent sm:text-right">
                          LIVE ENCODER FEED (SIM)
                        </span>
                      </div>
                      <div className="mt-3 rounded-lg border border-dossier-border bg-dossier-panel/25 p-4">
                        <p className="text-xs leading-relaxed text-dossier-text/90">
                          {artifact.content.captureNote}
                        </p>
                      </div>
                    </div>
                  </div>
                  <HintCallouts hints={artifact.anomalyHints} />
                </div>
                <MetaSidebar artifact={artifact} />
              </div>
            ) : null}

            {artifact.type === "social" && artifact.content.kind === "social" ? (
              <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
                <div>
                  <div className="mx-auto max-w-xl rounded-2xl border border-dossier-border bg-gradient-to-b from-dossier-panel to-dossier-bg p-1 shadow-glow">
                    <div className="rounded-xl bg-dossier-bg/70 p-5">
                      <div className="flex items-start gap-3">
                        <div className="h-11 w-11 rounded-full border border-dossier-border bg-gradient-to-br from-dossier-accent/25 to-transparent" />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-3">
                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold text-dossier-text">
                                {artifact.content.displayName}
                              </p>
                              <p className="truncate font-mono text-xs text-dossier-muted">
                                {artifact.content.handle}
                              </p>
                            </div>
                            <span className="shrink-0 font-mono text-[10px] text-dossier-muted">
                              {artifact.content.postedAgo}
                            </span>
                          </div>
                          <p className="mt-4 text-sm leading-relaxed text-dossier-text/90">
                            {artifact.id === "art-viral-post" && sessionVisual.socialPostOverride
                              ? sessionVisual.socialPostOverride
                              : artifact.content.text}
                          </p>
                          <div className="mt-5 grid grid-cols-3 gap-2 border-t border-dossier-border pt-4 font-mono text-[10px] text-dossier-muted">
                            <div>
                              <p className="text-dossier-text">Reposts</p>
                              <p className="mt-1">{artifact.content.metrics.reposts}</p>
                            </div>
                            <div>
                              <p className="text-dossier-text">Replies</p>
                              <p className="mt-1">{artifact.content.metrics.replies}</p>
                            </div>
                            <div>
                              <p className="text-dossier-text">Saves</p>
                              <p className="mt-1">{artifact.content.metrics.saves}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <HintCallouts hints={artifact.anomalyHints} />
                </div>
                <MetaSidebar artifact={artifact} />
              </div>
            ) : null}

            {artifact.type === "video" && artifact.content.kind === "video" ? (
              <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
                <div>
                  {assetUrlFor(artifact) ? (
                    <div className="overflow-hidden rounded-xl border border-dossier-border bg-dossier-bg">
                      <video
                        className="h-full w-full"
                        controls
                        preload="metadata"
                        poster={(artifact.content as any)?.posterUrl}
                      >
                        <source src={assetUrlFor(artifact) ?? undefined} />
                      </video>
                    </div>
                  ) : (
                    <div className="rounded-xl border border-dossier-border bg-dossier-bg/30 p-5 text-sm text-dossier-muted">
                      No video file attached yet. Add `assetUrl` to the artifact content or
                      `ASSET_URL` in metadata.
                    </div>
                  )}
                  <HintCallouts hints={artifact.anomalyHints} />
                </div>
                <MetaSidebar artifact={artifact} />
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
