import * as M from "@radix-ui/react-dropdown-menu";
import { cn } from "@/lib/cn";

export const DropdownMenu = M.Root;
export const DropdownMenuTrigger = M.Trigger;

export function DropdownMenuContent({ className, align = "end", ...props }) {
  return (
    <M.Portal>
      <M.Content
        align={align}
        sideOffset={8}
        className={cn("z-50 min-w-60 rounded-[var(--panel-radius)] border border-border bg-surface p-1.5 text-foreground shadow-lg data-[state=open]:animate-fade", className)}
        {...props}
      />
    </M.Portal>
  );
}

export function DropdownMenuItem({ className, ...props }) {
  return (
    <M.Item
      className={cn(
        "flex min-h-10 cursor-pointer select-none items-center gap-2.5 rounded-md px-2.5 py-2 text-sm font-medium outline-none transition-colors data-[highlighted]:bg-surface-2 [&_svg]:size-4 [&_svg]:text-subtle-foreground",
        className,
      )}
      {...props}
    />
  );
}

export function DropdownMenuLabel({ className, ...props }) {
  return <M.Label className={cn("px-2.5 pb-2 pt-1.5", className)} {...props} />;
}

export function DropdownMenuSeparator() {
  return <M.Separator className="-mx-1.5 my-1.5 h-px bg-border" />;
}
