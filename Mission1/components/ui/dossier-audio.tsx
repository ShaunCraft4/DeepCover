import type { AudioHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

type DossierAudioProps = AudioHTMLAttributes<HTMLAudioElement>;

/**
 * Native `<audio controls>` framed for the dossier UI (dark chrome, accent tint — see `globals.css` `.dossier-audio`).
 */
export function DossierAudio({ className, ...props }: DossierAudioProps) {
  return (
    <div
      className={cn(
        "dossier-audio-frame relative overflow-hidden rounded-lg",
        className,
      )}
    >
      <div className="pointer-events-none absolute inset-0 opacity-[0.14] scanlines" />
      <audio className="dossier-audio relative z-[1] block w-full" {...props} />
    </div>
  );
}
