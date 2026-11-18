import { Link } from "react-router-dom";
import { cn } from "@/lib/cn";

export function Container({ className, ...props }) {
  return <div className={cn("mx-auto w-full max-w-[var(--content-max)] px-4 sm:px-6 lg:px-10", className)} {...props} />;
}

/** running head: "კლასები / მე-7 კლასი / თავი III" — items: [{ label, to }], the last item is the current page */
export function Breadcrumbs({ items, className }) {
  return (
    <nav aria-label="ნავიგაცია" className={cn("text-[0.8125rem]", className)}>
      <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 text-subtle-foreground">
        {items.map((it, i) => {
          const last = i === items.length - 1;
          return (
            <li key={i} className="flex min-w-0 items-center gap-2">
              {i > 0 && (
                <span aria-hidden="true" className="text-border-strong">
                  /
                </span>
              )}
              {last || !it.to ? (
                <span aria-current={last ? "page" : undefined} className={cn("truncate", last && "text-muted-foreground")}>
                  {it.label}
                </span>
              ) : (
                <Link to={it.to} className="truncate rounded-sm transition-colors hover:text-foreground hover:underline hover:decoration-accent/60 hover:underline-offset-4">
                  {it.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

/** a section opener: optional Mtavruli label, serif title, lead text, and an action on the right */
export function SectionHeading({ title, lead, action, overline, className, id, as: Tag = "h2", ruled = false }) {
  return (
    <div className={cn("mb-6 flex flex-wrap items-end justify-between gap-x-6 gap-y-3", ruled && "border-b border-border pb-4", className)}>
      <div className="min-w-0 max-w-3xl">
        {overline && <p className="eyebrow mb-2 text-accent">{overline}</p>}
        <Tag id={id} className="text-[1.625rem] leading-tight sm:text-[1.875rem]">
          {title}
        </Tag>
        {lead && <p className="mt-2 text-[0.9375rem] leading-relaxed text-muted-foreground">{lead}</p>}
      </div>
      {action}
    </div>
  );
}

/** page title block */
export function PageHeader({ overline, title, lead, children, actions, className }) {
  return (
    <header className={cn("flex flex-wrap items-end justify-between gap-x-8 gap-y-5", className)}>
      <div className="min-w-0 max-w-3xl">
        {overline && <p className="eyebrow mb-3 text-accent">{overline}</p>}
        <h1 className="text-[2.125rem] leading-[1.12] sm:text-[2.75rem]">{title}</h1>
        {lead && <p className="mt-3 text-[1.0625rem] leading-relaxed text-muted-foreground">{lead}</p>}
        {children}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </header>
  );
}
