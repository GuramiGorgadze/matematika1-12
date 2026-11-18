import { forwardRef, useId } from "react";
import { cn } from "@/lib/cn";

const control =
  "w-full rounded-[var(--control-radius)] border border-[var(--input-border)] bg-[var(--input-bg)] px-3.5 font-sans text-[0.9375rem] text-foreground shadow-xs transition-[border-color,box-shadow] duration-[var(--primitive-duration-fast)] placeholder:text-subtle-foreground hover:border-foreground/35 focus:border-[var(--input-border-focus)] focus:outline-none focus:ring-[3px] focus:ring-accent/15 disabled:opacity-60 aria-[invalid=true]:border-danger aria-[invalid=true]:focus:ring-danger/15";

export const Input = forwardRef(function Input({ className, ...props }, ref) {
  return <input ref={ref} className={cn(control, "h-[var(--control-height)]", className)} {...props} />;
});

export const Select = forwardRef(function Select({ className, children, ...props }, ref) {
  return (
    <div className="relative">
      <select ref={ref} className={cn(control, "h-[var(--control-height)] appearance-none pr-10", className)} {...props}>
        {children}
      </select>
      <svg aria-hidden="true" viewBox="0 0 20 20" className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-subtle-foreground">
        <path d="M5 7.5 10 12.5 15 7.5" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
});

export function Label({ className, ...props }) {
  return <label className={cn("text-sm font-semibold text-foreground", className)} {...props} />;
}

/** label + control + helper / error, wired with ids for screen readers */
export function Field({ label, hint, error, children, className }) {
  const id = useId();
  const hintId = `${id}-hint`;
  const errId = `${id}-err`;
  const describedBy = [hint && hintId, error && errId].filter(Boolean).join(" ") || undefined;
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <Label htmlFor={id}>{label}</Label>
      {children({ id, "aria-invalid": error ? true : undefined, "aria-describedby": describedBy })}
      {hint && !error && (
        <p id={hintId} className="text-xs text-subtle-foreground">
          {hint}
        </p>
      )}
      {error && (
        <p id={errId} role="alert" className="text-xs font-medium text-danger-foreground">
          {error}
        </p>
      )}
    </div>
  );
}
