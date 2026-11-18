import { memo, useMemo } from "react";
import { renderMath } from "@/content/index.js";
import { cn } from "@/lib/cn";

/**
 * Renders lesson/problem HTML that contains TeX ($…$ and $$…$$) as MathML.
 * The HTML comes from the bundled curriculum (trusted, authored content), never from users.
 */
export const MathHtml = memo(function MathHtml({ html, className, as: Tag = "div", inline = false }) {
  const out = useMemo(() => renderMath(html), [html]);
  return <Tag className={cn(!inline && "mx-inline", className)} dangerouslySetInnerHTML={{ __html: out }} />;
});

export const LEVELS = { 1: "ძირითადი", 2: "საშუალო", 3: "რთული" };

export function LevelDots({ level, className }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-xs font-medium text-subtle-foreground", className)}>
      <span className="flex gap-[3px]" aria-hidden="true">
        {[1, 2, 3].map((i) => (
          <i key={i} className={cn("size-[7px] rounded-full", i <= level ? (level === 3 ? "bg-accent" : "bg-foreground/75") : "border border-border-strong")} />
        ))}
      </span>
      {LEVELS[level]}
    </span>
  );
}
