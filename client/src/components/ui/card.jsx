import { cn } from "@/lib/cn";

/** A panel: raised paper with a hairline edge. No drop shadow at rest — the page is flat like print. */
export function Card({ className, interactive, as: Tag = "div", ...props }) {
  return (
    <Tag
      className={cn(
        "rounded-[var(--panel-radius)] border border-[var(--panel-border)] bg-[var(--panel-bg)]",
        interactive &&
          "transition-[border-color,box-shadow,background-color] duration-[var(--primitive-duration-normal)] ease-out hover:border-border-strong hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
        className,
      )}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }) {
  return <div className={cn("flex flex-col gap-1.5 p-5 sm:p-6", className)} {...props} />;
}

export function CardTitle({ className, as: Tag = "h3", ...props }) {
  return <Tag className={cn("font-serif text-lg font-semibold leading-snug text-foreground", className)} {...props} />;
}

export function CardDescription({ className, ...props }) {
  return <p className={cn("text-sm leading-relaxed text-muted-foreground", className)} {...props} />;
}

export function CardContent({ className, ...props }) {
  return <div className={cn("px-5 pb-5 sm:px-6 sm:pb-6", className)} {...props} />;
}

export function CardFooter({ className, ...props }) {
  return <div className={cn("flex items-center gap-3 border-t border-border px-5 py-4 sm:px-6", className)} {...props} />;
}
