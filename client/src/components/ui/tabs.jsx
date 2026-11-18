import * as T from "@radix-ui/react-tabs";
import { cn } from "@/lib/cn";

export const Tabs = T.Root;

/** underline tabs on a hairline, like section tabs in a book */
export function TabsList({ className, ...props }) {
  return <T.List className={cn("scrollbar-none flex max-w-full items-end gap-6 overflow-x-auto border-b border-border", className)} {...props} />;
}

export function TabsTrigger({ className, ...props }) {
  return (
    <T.Trigger
      className={cn(
        "relative -mb-px inline-flex h-11 shrink-0 items-center gap-2 whitespace-nowrap border-b-2 border-transparent px-0.5 text-sm font-semibold text-muted-foreground transition-colors duration-[var(--primitive-duration-fast)] hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-[-2px] data-[state=active]:border-accent data-[state=active]:text-foreground [&_svg]:size-4",
        className,
      )}
      {...props}
    />
  );
}

export function TabsContent({ className, ...props }) {
  return <T.Content className={cn("mt-6 focus-visible:outline-none", className)} {...props} />;
}
