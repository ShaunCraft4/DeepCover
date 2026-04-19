import Link from "next/link";

export default function Mission2IndexPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[var(--bg)] px-4 py-12 text-[var(--text-primary)] md:py-16">
      <div className="pointer-events-none absolute inset-0 opacity-30 mission2-radar-sweep" />
      <div className="relative mx-auto max-w-lg text-center">
        <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-[var(--text-secondary)]">
          Mission 02
        </p>
        <h1 className="mt-4 font-display text-3xl font-extrabold tracking-[-0.02em] md:text-4xl">
          The Interrogation Room
        </h1>
        <p className="mt-5 text-base leading-relaxed text-[var(--text-secondary)]">
          Ask questions. Catch the subject in a lie. Get the launch code before your questions run
          out.
        </p>
        <div className="mt-10 flex flex-col items-stretch gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/mission2/briefing"
            className="inline-flex items-center justify-center rounded-md border border-[rgba(0,255,157,0.35)] bg-[rgba(0,255,157,0.08)] px-8 py-3 font-mono text-[11px] uppercase tracking-[0.2em] text-[var(--accent)] transition hover:bg-[rgba(0,255,157,0.14)]"
          >
            Continue
          </Link>
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-[var(--border)] px-8 py-3 font-mono text-[11px] uppercase tracking-[0.2em] text-[var(--text-secondary)] transition hover:border-[rgba(0,255,157,0.3)] hover:bg-[rgba(0,255,157,0.04)]"
          >
            Home
          </Link>
        </div>
      </div>
    </main>
  );
}
