import { Check, GraduationCap } from "lucide-react";
import { useSyncExternalStore } from "react";
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/misc";
import { RegistrationForm } from "./RegistrationForm";
import { useSession } from "./session";

/* one global dialog for "sign in" (header button) and "edit my details" (profile) */
let dlg = { open: false, edit: false, then: null };
const subs = new Set();
const setDlg = (v) => {
  dlg = v;
  subs.forEach((l) => l());
};
export const openRegistration = ({ edit = false, then } = {}) => setDlg({ open: true, edit, then });

export function RegistrationDialogHost() {
  const state = useSyncExternalStore(
    (l) => (subs.add(l), () => subs.delete(l)),
    () => dlg,
  );
  const { student } = useSession();
  const close = () => setDlg({ ...dlg, open: false });
  return (
    <Dialog open={state.open} onOpenChange={(o) => !o && close()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{state.edit ? "შენი მონაცემები" : "გამარჯობა! გავიცნოთ ერთმანეთი"}</DialogTitle>
          <DialogDescription>{state.edit ? "შეცვლის შემდეგ შედეგები იგივე პროფილში დარჩება." : "შეავსე ოთხი ველი — შენი ამოცანების და ტესტების შედეგები შენს პროფილში შეინახება."}</DialogDescription>
        </DialogHeader>
        <DialogBody>
          <RegistrationForm
            key={String(state.open) + state.edit}
            edit={state.edit}
            initial={state.edit ? student : null}
            onCancel={close}
            onDone={(s) => {
              close();
              state.then?.(s);
            }}
          />
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}

/** learning pages need a student (progress and tests are saved to a profile) */
export function StudentGate({ children }) {
  const { status } = useSession();
  if (status === "ready") return children;
  if (status === "loading")
    return (
      <div className="px-4 py-12 sm:px-6 lg:px-12">
        <Skeleton className="h-3.5 w-32" />
        <Skeleton className="mt-6 h-11 w-2/3 max-w-lg" />
        <Skeleton className="mt-10 h-72 w-full max-w-xl" />
      </div>
    );
  return (
    <section className="px-4 py-12 sm:px-6 sm:py-16 lg:px-12" aria-labelledby="gate-h">
      <div className="mx-auto grid grid-cols-1 max-w-5xl gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,28rem)] lg:gap-14">
        <div className="lg:pt-4">
          <p className="eyebrow text-accent">ერთი წუთი</p>
          <h1 id="gate-h" className="mt-3 text-[2.125rem] leading-[1.12] sm:text-[2.5rem]">
            ჯერ გავიცნოთ ერთმანეთი
          </h1>
          <p className="mt-4 max-w-xl font-serif text-[1.0625rem] leading-relaxed text-muted-foreground">
            ჩაწერე სახელი, გვარი, კლასი და სკოლა. ასე შეინახება შენი ამოხსნილი ამოცანები, ტესტების შედეგები და პროგრესი — და მასწავლებელიც დაინახავს მათ.
          </p>
          <ul className="mt-8 space-y-3 border-t border-border pt-6 text-[0.9375rem]">
            {["პროგრესი ინახება და ყველა მოწყობილობაზე გაგყვება", "ტესტების შედეგები: რომელ კითხვაზე შეცდი და რატომ", "იგივე მონაცემებით შესვლა ნებისმიერ დროს"].map((t) => (
              <li key={t} className="flex gap-3">
                <Check className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden="true" />
                <span>{t}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-[var(--panel-radius)] border border-border bg-surface shadow-md">
          <div className="flex items-center gap-3 border-b border-border px-6 py-4">
            <GraduationCap className="size-5 text-accent" aria-hidden="true" />
            <h2 className="font-serif text-lg font-semibold">მოსწავლის ბარათი</h2>
          </div>
          <div className="p-6">
            <RegistrationForm />
          </div>
        </div>
      </div>
    </section>
  );
}
