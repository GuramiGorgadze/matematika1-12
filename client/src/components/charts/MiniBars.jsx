import { useId, useMemo } from "react";
import { cn } from "@/lib/cn";

/** clean y-axis maximum: 1, 2, 5 × 10ⁿ */
function niceMax(v) {
  if (v <= 4) return Math.max(1, Math.ceil(v));
  const p = 10 ** Math.floor(Math.log10(v));
  for (const m of [1, 2, 2.5, 5, 10]) if (m * p >= v) return m * p;
  return 10 * p;
}

/**
 * Single-series column chart (one hue, no legend — the title names the series).
 * Follows the dataviz mark specs: ≤24px columns, 4px rounded data-end, square at the baseline,
 * hairline solid gridlines, text in text tokens, per-bar hover/focus tooltip (value first).
 */
export function MiniBars({ title, data, format = (v) => String(v), className, height = 168 }) {
  const id = useId();
  const max = useMemo(() => niceMax(Math.max(0, ...data.map((d) => d.value))), [data]);
  const ticks = [0, max / 2, max];
  return (
    <figure className={cn("rounded-[var(--panel-radius)] border border-border bg-surface p-4 sm:p-5", className)} aria-labelledby={`${id}-t`}>
      <figcaption id={`${id}-t`} className="mb-4 font-serif text-[0.9375rem] font-semibold">
        {title}
      </figcaption>
      <div className="relative" style={{ height }}>
        {/* gridlines + y ticks */}
        {ticks.map((t) => (
          <div key={t} className="absolute inset-x-0 flex items-center gap-2" style={{ bottom: `${(t / max) * 100}%`, transform: "translateY(50%)" }} aria-hidden="true">
            <span className="num w-7 shrink-0 text-right text-[0.6875rem] text-subtle-foreground">{Number.isInteger(t) ? t : t.toFixed(1)}</span>
            <span className="h-px flex-1 bg-border" />
          </div>
        ))}
        <ol className="absolute inset-y-0 left-9 right-0 flex items-end gap-[2px]">
          {data.map((d) => {
            const h = max ? (d.value / max) * 100 : 0;
            return (
              <li key={d.key} className="group relative flex h-full flex-1 items-end justify-center">
                <button type="button" className="absolute inset-0 rounded-md focus-visible:outline-2 focus-visible:outline-ring" aria-label={`${d.label}: ${format(d.value)}`} />
                {d.value > 0 && (
                  <span
                    className="pointer-events-none w-full max-w-6 rounded-t-[4px] bg-chart-1 transition-[filter] duration-150 group-hover:brightness-110 group-focus-within:brightness-110"
                    style={{ height: `${h}%` }}
                  />
                )}
                <span
                  role="tooltip"
                  className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 hidden -translate-x-1/2 whitespace-nowrap rounded-md bg-foreground px-2.5 py-1.5 text-center shadow-md group-hover:block group-focus-within:block"
                >
                  <span className="num block text-sm font-semibold text-background">{format(d.value)}</span>
                  <span className="block text-[0.6875rem] text-background/75">{d.label}</span>
                </span>
              </li>
            );
          })}
        </ol>
      </div>
      <div className="ml-9 mt-2 flex justify-between text-[0.6875rem] text-subtle-foreground" aria-hidden="true">
        <span>{data[0]?.short}</span>
        <span>{data[Math.floor(data.length / 2)]?.short}</span>
        <span>{data.at(-1)?.short}</span>
      </div>
    </figure>
  );
}
