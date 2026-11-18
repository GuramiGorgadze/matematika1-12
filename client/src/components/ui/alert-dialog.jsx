import * as A from "@radix-ui/react-alert-dialog";
import { cn } from "@/lib/cn";
import { buttonVariants } from "./button";

/** confirmation dialog: focus starts on the safe (cancel) action */
export function ConfirmDialog({ open, onOpenChange, title, description, confirmLabel, cancelLabel = "გაუქმება", onConfirm, tone = "primary", children }) {
  return (
    <A.Root open={open} onOpenChange={onOpenChange}>
      <A.Portal>
        <A.Overlay className="fixed inset-0 z-50 bg-overlay data-[state=open]:animate-fade" />
        <A.Content className="fixed left-1/2 top-1/2 z-50 w-[calc(100vw-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-[var(--dialog-radius)] border border-border bg-surface p-6 shadow-lg data-[state=open]:animate-[dialog-in_.22s_var(--ease-out)]">
          <A.Title className="font-serif text-xl font-semibold leading-snug">{title}</A.Title>
          {description && <A.Description className="mt-2 text-sm leading-relaxed text-muted-foreground">{description}</A.Description>}
          {children}
          <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <A.Cancel className={buttonVariants({ variant: "secondary" })}>{cancelLabel}</A.Cancel>
            <A.Action className={cn(buttonVariants({ variant: tone === "danger" ? "destructive" : "primary" }))} onClick={onConfirm}>
              {confirmLabel}
            </A.Action>
          </div>
        </A.Content>
      </A.Portal>
    </A.Root>
  );
}
