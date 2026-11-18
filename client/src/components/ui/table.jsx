import { cn } from "@/lib/cn";

/** Printed table: heavy rule on top and bottom, a light rule under the header, hairlines between rows. */
export function Table({ className, wrapperClassName, ...props }) {
  return (
    <div className={cn("w-full overflow-x-auto", wrapperClassName)}>
      <table className={cn("book-table text-sm", className)} {...props} />
    </div>
  );
}
export const THead = ({ className, ...p }) => <thead className={cn("text-left", className)} {...p} />;
export const TBody = ({ className, ...p }) => <tbody className={cn(className)} {...p} />;
export const TR = ({ className, ...p }) => <tr className={cn("transition-colors", className)} {...p} />;
export const TH = ({ className, ...p }) => <th className={cn("eyebrow whitespace-nowrap px-3 py-2.5 align-bottom font-semibold text-muted-foreground", className)} scope="col" {...p} />;
export const TD = ({ className, ...p }) => <td className={cn("px-3 py-3 align-middle", className)} {...p} />;
