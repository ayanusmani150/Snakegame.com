import type { Status, Vec } from "../game/engine";

interface Props {
  status: Status;
  onDir: (d: Vec) => void;
  onCenter: () => void;
}

function Arrow({ rotate }: { rotate: number }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-6 w-6 text-venom-300"
      style={{ transform: `rotate(${rotate}deg)` }}
      fill="none"
      stroke="currentColor"
      strokeWidth="2.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M12 19V5" />
      <path d="M5 12l7-7 7 7" />
    </svg>
  );
}

function CenterIcon({ status }: { status: Status }) {
  if (status === "running") {
    return (
      <svg viewBox="0 0 24 24" className="h-6 w-6 text-fruit-400" fill="currentColor" aria-hidden>
        <rect x="6" y="5" width="4" height="14" rx="1" />
        <rect x="14" y="5" width="4" height="14" rx="1" />
      </svg>
    );
  }
  if (status === "over") {
    return (
      <svg
        viewBox="0 0 24 24"
        className="h-6 w-6 text-venom-300"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <path d="M3 12a9 9 0 1 0 3-6.7" />
        <path d="M3 4v5h5" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6 text-venom-300" fill="currentColor" aria-hidden>
      <path d="M7 4.8v14.4a1 1 0 0 0 1.52.85l11.2-7.2a1 1 0 0 0 0-1.7L8.52 3.95A1 1 0 0 0 7 4.8z" />
    </svg>
  );
}

export default function Dpad({ status, onDir, onCenter }: Props) {
  const dirBtn =
    "dpad-btn flex h-14 items-center justify-center rounded-lg border border-pit-600 bg-pit-800/90 shadow-[0_3px_0_rgba(0,0,0,0.45)]";
  const press = (fn: () => void) => (e: React.PointerEvent) => {
    e.preventDefault();
    fn();
  };

  return (
    <div className="grid w-48 select-none grid-cols-3 gap-2" aria-label="Touch controls">
      <span />
      <button type="button" className={dirBtn} onPointerDown={press(() => onDir({ x: 0, y: -1 }))} aria-label="Steer up">
        <Arrow rotate={0} />
      </button>
      <span />
      <button type="button" className={dirBtn} onPointerDown={press(() => onDir({ x: -1, y: 0 }))} aria-label="Steer left">
        <Arrow rotate={-90} />
      </button>
      <button
        type="button"
        className="dpad-btn flex h-14 items-center justify-center rounded-lg border border-pit-500 bg-pit-700 shadow-[0_3px_0_rgba(0,0,0,0.45)]"
        onPointerDown={press(onCenter)}
        aria-label={status === "running" ? "Pause" : "Play"}
      >
        <CenterIcon status={status} />
      </button>
      <button type="button" className={dirBtn} onPointerDown={press(() => onDir({ x: 1, y: 0 }))} aria-label="Steer right">
        <Arrow rotate={90} />
      </button>
      <span />
      <button type="button" className={dirBtn} onPointerDown={press(() => onDir({ x: 0, y: 1 }))} aria-label="Steer down">
        <Arrow rotate={180} />
      </button>
      <span />
    </div>
  );
}
