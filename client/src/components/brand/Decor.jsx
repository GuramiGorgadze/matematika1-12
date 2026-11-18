import { cn } from "@/lib/cn";

/*
 * Line drawings in the manner of textbook figures: 1.5 px ink strokes, dashed construction lines,
 * vermilion points, italic serif labels. Purely decorative (aria-hidden) unless a caption is passed.
 */

const ink = { stroke: "var(--foreground)", strokeWidth: 1.6, fill: "none", strokeLinecap: "round", strokeLinejoin: "round" };
const guide = { stroke: "var(--subtle-foreground)", strokeWidth: 1.1, fill: "none", strokeDasharray: "5 5" };
const label = { fill: "var(--foreground)", fontFamily: "var(--typeface-mathtext)", fontStyle: "italic", fontSize: 19 };

/** Thales' theorem with its compass-and-straightedge construction */
export function ThalesFigure({ className }) {
  const A = [90, 210];
  const B = [390, 210];
  const O = [240, 210];
  const C = [176.6, 74.1];
  return (
    <svg viewBox="0 0 480 360" className={cn("h-auto w-full", className)} aria-hidden="true">
      {/* perpendicular bisector: two compass arcs from A and B, and the dashed line through O */}
      <path d="M205 82 A200 200 0 0 1 275 82" {...guide} transform="translate(0 -4)" />
      <path d="M205 338 A200 200 0 0 0 275 338" {...guide} transform="translate(0 4)" />
      <line x1="240" y1="40" x2="240" y2="352" {...guide} />
      {/* the circle and its diameter */}
      <circle cx={O[0]} cy={O[1]} r="150" {...ink} />
      <line x1={A[0]} y1={A[1]} x2={B[0]} y2={B[1]} {...ink} />
      {/* triangle ACB, radius OC */}
      <path d={`M${A} L${C} L${B}`} {...ink} strokeWidth="2" />
      <line x1={O[0]} y1={O[1]} x2={C[0]} y2={C[1]} {...guide} strokeDasharray="3 4" />
      {/* right-angle mark at C */}
      <path d="M169.1 85.9 L180.9 93.4 L188.4 81.6" {...ink} strokeWidth="1.4" />
      {/* equal-radius ticks */}
      <path d="M163 210 v-8 M167 210 v-8 M313 210 v-8 M317 210 v-8" stroke="var(--foreground)" strokeWidth="1.3" />
      {/* points */}
      {[A, B, C, O].map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="4.5" fill="var(--accent-decor)" stroke="var(--background)" strokeWidth="2" />
      ))}
      <text x={A[0] - 26} y={A[1] + 6} {...label}>
        A
      </text>
      <text x={B[0] + 12} y={B[1] + 6} {...label}>
        B
      </text>
      <text x={C[0] - 22} y={C[1] - 10} {...label}>
        C
      </text>
      <text x={O[0] + 8} y={O[1] + 24} {...label}>
        O
      </text>
      {/* the result, highlighted */}
      <rect x="300" y="300" width="150" height="34" rx="2" fill="var(--highlight)" transform="rotate(-1.5 375 317)" />
      <text x="375" y="323" textAnchor="middle" fill="var(--foreground)" fontFamily="var(--typeface-mathtext)" fontSize="20">
        ∠<tspan fontStyle="italic">ACB</tspan> = 90°
      </text>
    </svg>
  );
}

/** a parabola on axes with its vertex and roots marked */
export function ParabolaFigure({ className }) {
  /* y = x² − 4: origin at (200, 190), 46 px per unit across, 18 px per unit up */
  const sx = (x) => 200 + 46 * x;
  const sy = (y) => 190 - 18 * y;
  const d = Array.from({ length: 65 }, (_, i) => -3.2 + i * 0.1)
    .map((x, i) => `${i ? "L" : "M"}${sx(x).toFixed(1)} ${sy(x * x - 4).toFixed(1)}`)
    .join(" ");
  return (
    <svg viewBox="0 0 400 290" className={cn("h-auto w-full", className)} aria-hidden="true">
      {[-3, -2, -1, 1, 2, 3].map((k) => (
        <line key={`v${k}`} x1={sx(k)} y1="24" x2={sx(k)} y2="276" stroke="var(--border)" strokeWidth="1" />
      ))}
      {[-4, -2, 2, 4, 6].map((k) => (
        <line key={`h${k}`} x1="40" y1={sy(k)} x2="360" y2={sy(k)} stroke="var(--border)" strokeWidth="1" />
      ))}
      <line x1="30" y1={sy(0)} x2="372" y2={sy(0)} {...ink} strokeWidth="1.3" />
      <line x1="200" y1="280" x2="200" y2="16" {...ink} strokeWidth="1.3" />
      <path d={`M372 ${sy(0)} l-8 -4 v8 z M200 16 l-4 8 h8 z`} fill="var(--foreground)" />
      <path d={d} stroke="var(--chart-1)" strokeWidth="2.6" fill="none" strokeLinecap="round" />
      {[
        [sx(-2), sy(0)],
        [sx(2), sy(0)],
        [sx(0), sy(-4)],
      ].map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="4.5" fill="var(--accent-decor)" stroke="var(--background)" strokeWidth="2" />
      ))}
      <text x="364" y={sy(0) + 22} {...label}>
        x
      </text>
      <text x="210" y="30" {...label}>
        y
      </text>
    </svg>
  );
}

/** short double rule with a centred section mark — chapter openers and section breaks */
export function SectionRule({ className }) {
  return (
    <div className={cn("flex items-center gap-4 text-accent", className)} aria-hidden="true">
      <span className="h-px flex-1 bg-border-strong" />
      <span className="font-display text-xl leading-none">§</span>
      <span className="h-px flex-1 bg-border-strong" />
    </div>
  );
}
