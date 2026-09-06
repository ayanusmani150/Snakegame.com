export interface Vec {
  x: number;
  y: number;
}

export type Status = "idle" | "running" | "paused" | "over";
export type DifficultyKey = "garden" | "strike" | "frenzy";
export type GameEvent = "eat" | "over" | "win";

export const GRID = 21;

export interface DifficultySpec {
  key: DifficultyKey;
  label: string;
  tag: string;
  tick: number;
  minTick: number;
  blurb: string;
  accent: string;
}

export const DIFFICULTIES: Record<DifficultyKey, DifficultySpec> = {
  garden: {
    key: "garden",
    label: "Garden",
    tag: "CHILL",
    tick: 170,
    minTick: 108,
    blurb: "A lazy coil through warm grass.",
    accent: "#a5f84d",
  },
  strike: {
    key: "strike",
    label: "Strike",
    tag: "CLASSIC",
    tick: 118,
    minTick: 76,
    blurb: "The classic pace. Reflexes required.",
    accent: "#ffb02e",
  },
  frenzy: {
    key: "frenzy",
    label: "Frenzy",
    tag: "BRUTAL",
    tick: 82,
    minTick: 54,
    blurb: "Serpent overdrive. Blink and it ends.",
    accent: "#ff6259",
  },
};

export const DIFFICULTY_ORDER: DifficultyKey[] = ["garden", "strike", "frenzy"];

export interface GameEngine {
  status: Status;
  difficulty: DifficultyKey;
  tickMs: number;
  elapsed: number;
  snake: Vec[];
  prev: Vec[];
  dir: Vec;
  queue: Vec[];
  food: Vec;
  score: number;
  foods: number;
  time: number;
  deadAt: number;
}

function freeCell(snake: Vec[]): Vec {
  const occupied = new Set(snake.map((s) => s.y * GRID + s.x));
  const free: Vec[] = [];
  for (let y = 0; y < GRID; y++) {
    for (let x = 0; x < GRID; x++) {
      if (!occupied.has(y * GRID + x)) free.push({ x, y });
    }
  }
  return free[Math.floor(Math.random() * free.length)] ?? { x: 0, y: 0 };
}

export function createEngine(difficulty: DifficultyKey): GameEngine {
  const mid = Math.floor(GRID / 2);
  const snake: Vec[] = [
    { x: mid, y: mid },
    { x: mid - 1, y: mid },
    { x: mid - 2, y: mid },
  ];
  return {
    status: "idle",
    difficulty,
    tickMs: DIFFICULTIES[difficulty].tick,
    elapsed: 0,
    snake,
    prev: snake.map((s) => ({ ...s })),
    dir: { x: 1, y: 0 },
    queue: [],
    food: freeCell(snake),
    score: 0,
    foods: 0,
    time: 0,
    deadAt: 0,
  };
}

export function queueDir(eng: GameEngine, d: Vec): void {
  const last = eng.queue.length ? eng.queue[eng.queue.length - 1] : eng.dir;
  if (d.x === -last.x && d.y === -last.y) return; // never reverse into yourself
  if (d.x === last.x && d.y === last.y) return; // no duplicates
  if (eng.queue.length < 3) eng.queue.push(d);
}

export function step(eng: GameEngine): GameEvent | null {
  let d = eng.dir;
  while (eng.queue.length) {
    const n = eng.queue.shift()!;
    if (!(n.x === -d.x && n.y === -d.y)) {
      d = n;
      break;
    }
  }
  eng.dir = d;

  const head = eng.snake[0];
  const nh = { x: head.x + d.x, y: head.y + d.y };

  if (nh.x < 0 || nh.y < 0 || nh.x >= GRID || nh.y >= GRID) {
    eng.status = "over";
    eng.deadAt = eng.time;
    return "over";
  }

  const eating = nh.x === eng.food.x && nh.y === eng.food.y;
  const body = eating ? eng.snake : eng.snake.slice(0, -1);
  if (body.some((s) => s.x === nh.x && s.y === nh.y)) {
    eng.status = "over";
    eng.deadAt = eng.time;
    return "over";
  }

  eng.snake.unshift(nh);

  if (eating) {
    eng.score += 10;
    eng.foods += 1;
    const spec = DIFFICULTIES[eng.difficulty];
    eng.tickMs = Math.max(spec.minTick, eng.tickMs - 2);
    eng.food = freeCell(eng.snake);
    if (eng.snake.length >= GRID * GRID) {
      eng.status = "over";
      eng.deadAt = eng.time;
      return "win";
    }
    return "eat";
  }

  eng.snake.pop();
  return null;
}

/** 1..10 pace indicator derived from the current tick speed. */
export function paceLevel(eng: GameEngine): number {
  const spec = DIFFICULTIES[eng.difficulty];
  const span = spec.tick - spec.minTick;
  if (span <= 0) return 10;
  return Math.min(10, 1 + Math.round(((spec.tick - eng.tickMs) / span) * 9));
}
