import { cva } from "class-variance-authority";
import { cn } from "@/lib/cn";

/** Small printed tag: square-ish corners, sans semibold. Colour always comes with a word (and often an icon). */
export const badgeVariants = cva("inline-flex items-center gap-1 whitespace-nowrap rounded-[var(--tag-radius)] font-sans font-semibold leading-none [&_svg]:size-3.5 [&_svg]:shrink-0", {
  variants: {
    variant: {
      neutral: "bg-surface-2 text-muted-foreground",
      outline: "border border-border-strong text-muted-foreground",
      ink: "border border-foreground/70 text-foreground",
      primary: "bg-accent-soft text-accent-soft-foreground",
      accent: "bg-accent-soft text-accent-soft-foreground",
      success: "bg-success-soft text-success-foreground",
      danger: "bg-danger-soft text-danger-foreground",
      warning: "bg-warning-soft text-warning-foreground",
      highlight: "bg-highlight text-highlight-foreground",
      stage1: "bg-stage-1-soft text-stage-1",
      stage2: "bg-stage-2-soft text-stage-2",
      stage3: "bg-stage-3-soft text-stage-3",
      solid: "bg-primary text-primary-foreground",
    },
    size: {
      sm: "px-1.5 py-1 text-[0.6875rem]",
      md: "px-2 py-1.5 text-xs",
    },
  },
  defaultVariants: { variant: "neutral", size: "md" },
});

export function Badge({ className, variant, size, ...props }) {
  return <span className={cn(badgeVariants({ variant, size }), className)} {...props} />;
}
