"use client";

type Props = {
  value: number;
  label?: string;
  behavioralFlag: string | null;
};

export function TensionMeter({ value, label = "STRESS", behavioralFlag }: Props) {
  const v = Math.min(100, Math.max(0, value));
  const high = v >= 75;

  const gradient =
    v < 50
      ? `linear-gradient(180deg, rgba(0,255,157,0.95) 0%, rgba(245,158,11,0.85) 100%)`
      : `linear-gradient(180deg, rgba(245,158,11,0.9) 0%, rgba(239,68,68,0.95) 100%)`;

  return (
    <div className="flex w-full flex-col items-center gap-3 lg:min-h-[320px] lg:w-16">
      <p className="text-center font-mono text-[10px] uppercase tracking-[0.24em] text-[var(--text-secondary)]">
        {label}
      </p>
      <div
        className={`relative h-48 w-4 overflow-hidden rounded-full border border-[var(--border)] bg-black/50 transition-all duration-500 lg:h-64 ${
          high ? "mission2-tension-pulse" : ""
        }`}
      >
        <div
          className="absolute bottom-0 left-0 right-0 rounded-b-full transition-[height] duration-700 ease-out"
          style={{
            height: `${v}%`,
            background: gradient,
            boxShadow: "0 0 18px rgba(0,255,157,0.18)",
          }}
        />
      </div>
      <p className="font-mono text-[11px] text-[var(--accent)]">{Math.round(v)}</p>
      <p
        className={`max-w-[12rem] text-center text-[10px] leading-snug text-[var(--text-secondary)] transition-opacity duration-500 ${
          behavioralFlag ? "opacity-100" : "opacity-0"
        }`}
      >
        {behavioralFlag ?? "—"}
      </p>
    </div>
  );
}
