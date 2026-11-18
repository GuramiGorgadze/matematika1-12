import * as D from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/cn";

export const Dialog = D.Root;
export const DialogTrigger = D.Trigger;
export const DialogClose = D.Close;

const SHEET = {
  right: "inset-y-0 right-0 h-full w-full max-w-2xl border-y-0 border-r-0 data-[state=open]:animate-[sheet-in-right_.28s_var(--ease-out)]",
  left: "inset-y-0 left-0 h-full w-[min(22rem,88vw)] border-y-0 border-l-0 data-[state=open]:animate-[sheet-in-left_.26s_var(--ease-out)]",
};

/**
 * Centered dialog, or a side sheet with side="right" | "left". `hideClose` + onEscapeKeyDown /
 * onPointerDownOutside preventDefault make a dialog that must be completed (registration).
 */
export function DialogContent({ className, children, side, hideClose, overlayClassName, ...props }) {
  return (
    <D.Portal>
      <D.Overlay className={cn("fixed inset-0 z-50 bg-overlay data-[state=open]:animate-fade", overlayClassName)} />
      <D.Content
        className={cn(
          "fixed z-50 flex flex-col border border-border bg-surface text-foreground shadow-lg outline-none",
          side
            ? cn("overflow-y-auto", SHEET[side])
            : "left-1/2 top-1/2 max-h-[calc(100dvh-2rem)] w-[calc(100vw-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-[var(--dialog-radius)] data-[state=open]:animate-[dialog-in_.22s_var(--ease-out)]",
          className,
        )}
        {...props}
      >
        {children}
        {!hideClose && (
          <D.Close className="absolute right-3 top-3 grid size-10 place-items-center rounded-md text-subtle-foreground transition-colors hover:bg-surface-2 hover:text-foreground" aria-label="დახურვა">
            <X className="size-5" />
          </D.Close>
        )}
      </D.Content>
    </D.Portal>
  );
}

export function DialogHeader({ className, ...props }) {
  return <div className={cn("flex flex-col gap-1.5 px-6 pt-6", className)} {...props} />;
}
export function DialogTitle({ className, ...props }) {
  return <D.Title className={cn("pr-10 font-serif text-xl font-semibold leading-snug", className)} {...props} />;
}
export function DialogDescription({ className, ...props }) {
  return <D.Description className={cn("text-sm leading-relaxed text-muted-foreground", className)} {...props} />;
}
export function DialogBody({ className, ...props }) {
  return <div className={cn("px-6 py-5", className)} {...props} />;
}
export function DialogFooter({ className, ...props }) {
  return <div className={cn("flex flex-col-reverse gap-2 border-t border-border px-6 py-4 sm:flex-row sm:justify-end", className)} {...props} />;
}
