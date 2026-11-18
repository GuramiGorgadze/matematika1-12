import { cva } from "class-variance-authority";
import { forwardRef } from "react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/cn";

/**
 * Buttons. Ink is the default (primary); vermilion (accent) is kept for the one main action of a page.
 * All sizes from md up are 44 px tall (touch target).
 */
export const buttonVariants = cva(
  "inline-flex select-none items-center justify-center gap-2 whitespace-nowrap rounded-[var(--control-radius)] font-sans font-semibold transition-[background-color,color,border-color,box-shadow,transform] duration-[var(--primitive-duration-fast)] ease-out focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring active:translate-y-px disabled:pointer-events-none disabled:opacity-45 [&_svg]:size-[1.1em] [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary: "bg-primary text-primary-foreground shadow-xs hover:bg-primary-hover",
        accent: "bg-accent text-accent-foreground shadow-xs hover:bg-accent-hover",
        secondary: "border border-border-strong bg-surface text-foreground shadow-xs hover:border-foreground/35 hover:bg-surface-2",
        outline: "border border-border-strong bg-transparent text-foreground hover:border-foreground/35 hover:bg-surface-2",
        soft: "bg-accent-soft text-accent-soft-foreground hover:bg-accent-soft/70",
        ghost: "text-muted-foreground hover:bg-surface-2 hover:text-foreground",
        success: "bg-success text-white shadow-xs hover:brightness-110 dark:text-background",
        destructive: "bg-danger text-white shadow-xs hover:brightness-110 dark:text-background",
        "destructive-soft": "bg-danger-soft text-danger-foreground hover:bg-danger-soft/70",
        link: "h-auto px-0 text-foreground underline decoration-accent/50 decoration-[1.5px] underline-offset-[0.22em] hover:text-accent hover:decoration-accent active:translate-y-0",
      },
      size: {
        sm: "h-[var(--control-height-sm)] px-3 text-sm",
        md: "h-[var(--control-height)] px-4 text-[0.9375rem]",
        lg: "h-12 px-6 text-base",
        icon: "size-[var(--control-height)] p-0",
        "icon-sm": "size-[var(--control-height-sm)] p-0",
      },
    },
    compoundVariants: [{ variant: "link", className: "h-auto px-0" }],
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export const Button = forwardRef(function Button({ className, variant, size, type = "button", ...props }, ref) {
  return <button ref={ref} type={type} className={cn(buttonVariants({ variant, size }), className)} {...props} />;
});

/** a router link (or #anchor / external href) that looks like a button */
export function ButtonLink({ className, variant, size, to, href, ...props }) {
  const cls = cn(buttonVariants({ variant, size }), className);
  if (href) return <a href={href} className={cls} {...props} />;
  return <Link to={to} className={cls} {...props} />;
}
