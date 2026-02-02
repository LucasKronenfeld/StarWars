import { useEffect, useMemo, useState } from 'react';

type Props = {
  title: string;
  subtitle?: string;
  crawl: string;
};

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handler = () => setReduced(mq.matches);
    handler();
    mq.addEventListener?.('change', handler);
    return () => mq.removeEventListener?.('change', handler);
  }, []);
  return reduced;
}

function clamp(min: number, max: number, value: number) {
  return Math.max(min, Math.min(max, value));
}

export default function OpeningCrawl({ title, subtitle, crawl }: Props) {
  const prefersReducedMotion = usePrefersReducedMotion();
  const [isPlaying, setIsPlaying] = useState(true);
  const [speed, setSpeed] = useState<0.75 | 1 | 1.5>(1);
  const [restartKey, setRestartKey] = useState(0);

  const lines = useMemo(() => crawl.split('\n').filter(Boolean), [crawl]);

  const baseDuration = useMemo(() => {
    const seconds = clamp(20, 60, Math.ceil(crawl.length / 20));
    return seconds;
  }, [crawl.length]);

  const duration = baseDuration / speed;

  if (!crawl?.trim()) {
    return (
      <div className="rounded-lg border border-slate-800 bg-slate-950 p-6 text-slate-300">
        No opening crawl available.
      </div>
    );
  }

  // Reduced motion => static (still styled)
  if (prefersReducedMotion) {
    return (
      <div className="rounded-xl border border-slate-800 bg-black p-6">
        <div className="text-center text-yellow-300 font-semibold text-lg">{subtitle}</div>
        <div className="text-center text-yellow-200 font-bold text-2xl mt-1">{title}</div>
        <div className="mt-6 space-y-3 text-yellow-200 leading-7">
          {lines.map((l, i) => (
            <p key={i} className="text-base">{l}</p>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-800 bg-black overflow-hidden">
      {/* Controls */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-950/40">
        <div className="text-slate-200 text-sm">Opening Crawl</div>
        <div className="flex items-center gap-2">
          <select
            className="bg-slate-900 text-slate-200 text-sm rounded-md px-2 py-1 border border-slate-700"
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value) as 0.75 | 1 | 1.5)}
          >
            <option value={0.75}>0.75x</option>
            <option value={1}>1x</option>
            <option value={1.5}>1.5x</option>
          </select>
          <button
            className="bg-slate-800 hover:bg-slate-700 text-slate-100 text-sm rounded-md px-3 py-1"
            onClick={() => setIsPlaying((v) => !v)}
          >
            {isPlaying ? 'Pause' : 'Play'}
          </button>
          <button
            className="bg-slate-800 hover:bg-slate-700 text-slate-100 text-sm rounded-md px-3 py-1"
            onClick={() => {
              setRestartKey((k) => k + 1);
              setIsPlaying(true);
            }}
          >
            Restart
          </button>
        </div>
      </div>

      {/* Crawl viewport */}
      <div className="relative h-[520px] [perspective:320px]">
        {/* subtle fade at top */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black to-transparent z-10" />
        {/* subtle fade at bottom */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black to-transparent z-10" />

        <div className="absolute inset-0 flex justify-center">
          <div
            key={restartKey}
            className="w-[min(720px,90%)] text-yellow-200 font-semibold tracking-wide leading-8 text-lg"
            style={{
              transformOrigin: '50% 100%',
              transform: 'rotateX(22deg)',
            }}
          >
            <div
              className="opening-crawl"
              style={{
                animationDuration: `${duration}s`,
                animationPlayState: isPlaying ? 'running' : 'paused',
              }}
            >
              <div className="text-center text-yellow-300 font-semibold text-lg">
                {subtitle}
              </div>
              <div className="text-center text-yellow-200 font-bold text-3xl mt-1">
                {title}
              </div>

              <div className="mt-8 space-y-6">
                {lines.map((l, i) => (
                  <p key={i}>{l}</p>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Local CSS */}
      <style>
        {`
          @keyframes crawl {
            0% { transform: translateY(65%); opacity: 1; }
            90% { opacity: 1; }
            100% { transform: translateY(-220%); opacity: 0; }
          }
          .opening-crawl {
            animation-name: crawl;
            animation-timing-function: linear;
            animation-iteration-count: 1;
            animation-fill-mode: forwards;
            padding-bottom: 200px;
          }
        `}
      </style>
    </div>
  );
}
