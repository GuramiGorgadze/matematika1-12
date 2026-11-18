import * as Tip from "@radix-ui/react-tooltip";
import { cn } from "@/lib/cn";

/** thin rule-like progress bar */
export function Progress({ value = 0, max = 100, className, barClassName, label }) {
  const pct = max ? Math.min(100, Math.max(0, (value / max) * 100)) : 0;
  return (
    <div role="progressbar" aria-valuemin={0} aria-valuemax={max} aria-valuenow={value} aria-label={label} className={cn("h-1.5 w-full overflow-hidden rounded-full bg-surface-3", className)}>
      <div className={cn("h-full rounded-full bg-accent transition-[width] duration-500 ease-out", barClassName)} style={{ width: `${pct}%` }} />
    </div>
  );
}

/** circular score indicator (a thin ring, like a compass circle) */
export function ScoreRing({ value, max, size = 128, stroke = 6, className, children }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = max ? Math.max(0, Math.min(1, value / max)) : 0;
  const tone = pct >= 0.75 ? "var(--success)" : pct >= 0.5 ? "var(--chart-1)" : pct >= 0.3 ? "var(--warning)" : "var(--danger)";
  return (
    <div className={cn("relative inline-grid place-items-center", className)} style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90" aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--surface-3)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={tone}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - pct)}
          style={{ transition: "stroke-dashoffset .8s var(--ease-out)" }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">{children}</div>
    </div>
  );
}

export function Skeleton({ className }) {
  return <div className={cn("animate-pulse rounded-md bg-surface-2", className)} aria-hidden="true" />;
}

export function Kbd({ children }) {
  return (
    <kbd className="inline-flex min-w-6 items-center justify-center rounded-[var(--tag-radius)] border border-border-strong bg-surface px-1.5 py-0.5 font-mono text-[0.75rem] text-muted-foreground shadow-[inset_0_-1px_0_var(--border-strong)]">
      {children}
    </kbd>
  );
}

export const TooltipProvider = Tip.Provider;
export function Tooltip({ content, children, side = "top" }) {
  return (
    <Tip.Root delayDuration={250}>
      <Tip.Trigger asChild>{children}</Tip.Trigger>
      <Tip.Portal>
        <Tip.Content side={side} sideOffset={6} className="z-50 max-w-xs rounded-md bg-foreground px-2.5 py-1.5 text-xs font-medium text-background shadow-md data-[state=delayed-open]:animate-fade">
          {content}
        </Tip.Content>
      </Tip.Portal>
    </Tip.Root>
  );
}

/**
 * A figure: label in Mtavruli, value in large display numerals. Place several inside <StatGrid> —
 * they are separated by hairlines rather than boxed.
 */
export function Stat({ label, value, hint, icon: Icon, tone, className }) {
  const toneCls = { success: "text-success", warning: "text-warning", danger: "text-danger", highlight: "text-foreground", primary: "text-foreground", neutral: "text-foreground" };
  return (
    <div className={cn("min-w-0 px-4 py-4 sm:px-5", className)}>
      <div className="eyebrow flex items-center gap-1.5 text-subtle-foreground">
        {Icon && <Icon className="size-3.5" aria-hidden="true" />}
        <span className="truncate">{label}</span>
      </div>
      <div className={cn("num mt-1.5 font-display text-[2rem] font-medium leading-none tracking-tight", toneCls[tone] || "text-foreground")}>{value}</div>
      {hint && <div className="mt-1.5 text-xs text-subtle-foreground">{hint}</div>}
    </div>
  );
}

/** hairlines between figures come from a 1px gap over a rule-coloured background; pick column counts that fill every row */
export function StatGrid({ className, children }) {
  return <div className={cn("grid gap-px border-y border-rule-ink/80 bg-border [&>*]:bg-background", className)}>{children}</div>;
}

export function EmptyState({ icon: Icon, title, children, action, className }) {
  return (
    <div className={cn("flex flex-col items-center gap-3 rounded-[var(--panel-radius)] border border-dashed border-border-strong px-6 py-12 text-center", className)}>
      {Icon ? (
        <span className="grid size-12 place-items-center rounded-full border border-border-strong text-subtle-foreground">
          <Icon className="size-5" aria-hidden="true" />
        </span>
      ) : (
        <span className="font-display text-4xl leading-none text-accent" aria-hidden="true">
          §
        </span>
      )}
      <h3 className="font-serif text-lg font-semibold">{title}</h3>
      {children && <div className="max-w-md text-sm leading-relaxed text-muted-foreground">{children}</div>}
      {action}
    </div>
  );
}

/** margin note: a coloured rule on the left, tinted paper */
export function Callout({ icon: Icon, tone = "primary", title, children, className }) {
  const tones = {
    primary: "border-accent bg-accent-soft/60 text-foreground [&_.co-icon]:text-accent",
    highlight: "border-highlight-strong bg-highlight/45 text-foreground [&_.co-icon]:text-foreground",
    warning: "border-warning bg-warning-soft text-warning-foreground",
    danger: "border-danger bg-danger-soft text-danger-foreground",
    success: "border-success bg-success-soft text-success-foreground",
    neutral: "border-border-strong bg-surface-2 text-muted-foreground",
  };
  return (
    <div className={cn("flex gap-3 rounded-r-md border-l-[3px] px-4 py-3 text-sm leading-relaxed", tones[tone], className)} role="note">
      {Icon && <Icon className="co-icon mt-0.5 size-[1.1rem] shrink-0" aria-hidden="true" />}
      <div className="min-w-0">
        {title && <p className="font-semibold">{title}</p>}
        <div className={cn(title && "mt-0.5", "[&_a]:font-semibold [&_a]:underline")}>{children}</div>
      </div>
    </div>
  );
}
