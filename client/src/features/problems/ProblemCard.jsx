import { Check, CircleCheck, CircleX, Eye, EyeOff, Lightbulb, TriangleAlert } from "lucide-react";
import { memo, useRef, useState } from "react";
import { LevelDots, MathHtml } from "@/components/math/MathHtml";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CHK } from "@/content/index.js";
import { LETTERS } from "@/content/tests";
import { useProgress } from "@/features/student/progress";
import { cn } from "@/lib/cn";
import { SymbolBar, useInsert } from "./AnswerTools";

function Feedback({ st, local }) {
  if (local === "empty")
    return (
      <span className="inline-flex items-center gap-1.5 text-warning-foreground">
        <TriangleAlert className="size-4" aria-hidden="true" /> ჯერ ჩაწერე პასუხი.
      </span>
    );
  if (local === "pick")
    return (
      <span className="inline-flex items-center gap-1.5 text-warning-foreground">
        <TriangleAlert className="size-4" aria-hidden="true" /> აირჩიე ვარიანტი.
      </span>
    );
  if (st?.ok)
    return (
      <span className="inline-flex items-center gap-1.5 text-success-foreground">
        <CircleCheck className="size-4" aria-hidden="true" /> სწორია{st.ft ? " — პირველივე ცდით!" : ""}
        {st.n > 1 && <span className="font-normal text-subtle-foreground">· ცდა: {st.n}</span>}
      </span>
    );
  if (st?.seen && !st?.n)
    return (
      <span className="inline-flex items-center gap-1.5 text-muted-foreground">
        <Eye className="size-4" aria-hidden="true" /> ამოხსნა ნანახია. სცადე და შეამოწმე შენი პასუხი.
      </span>
    );
  if (st?.n)
    return (
      <span className="inline-flex flex-wrap items-center gap-1.5 text-danger-foreground">
        <CircleX className="size-4" aria-hidden="true" /> ჯერ არა — სცადე ხელახლა.
        {st.n >= 2 && <span className="font-normal text-muted-foreground">შეგიძლია ამოხსნაც ნახო.</span>}
      </span>
    );
  return null;
}

/* the answer is written on a ruled line, as in an exercise book */
const lineInput =
  "h-11 rounded-none border-0 border-b-[1.5px] border-foreground/35 bg-transparent px-1 font-mathtext text-[1.1875rem] shadow-none hover:border-foreground/60 focus:border-accent focus:shadow-[0_1.5px_0_0_var(--accent)] focus:ring-0";

/** one practice problem: hanging number, statement, answer line, check, solution — progress saved */
export const ProblemCard = memo(function ProblemCard({ p, index }) {
  const progress = useProgress();
  const st = progress.get(p.id);
  const auto = !!p.k;
  const isChoice = auto && p.k.t === "ch";
  const [value, setValue] = useState("");
  const [choice, setChoice] = useState(null);
  const [local, setLocal] = useState(null);
  const [open, setOpen] = useState(!!(st?.ok || st?.seen));
  const inputRef = useRef(null);
  const insert = useInsert(inputRef, value, setValue);
  const [focused, setFocused] = useState(false);

  function check(e) {
    e.preventDefault();
    let val;
    if (isChoice) {
      if (choice == null) return setLocal("pick");
      val = String(choice);
    } else {
      val = value.trim();
      if (!val) return setLocal("empty");
    }
    setLocal(null);
    const ok = !!CHK.check(val, p.k);
    const cur = progress.get(p.id) || { n: 0 };
    const patch = { n: (cur.n || 0) + 1, t: Date.now() };
    if (ok && !cur.ok) {
      patch.ok = 1;
      if (!cur.n && !cur.seen) patch.ft = 1;
    }
    progress.mark(p.id, patch);
    if (ok) setOpen(true);
  }

  function toggleSolution() {
    const next = !open;
    setOpen(next);
    if (next && !st?.ok && !st?.seen) progress.mark(p.id, { seen: 1 });
  }

  function selfMark(ok) {
    const cur = progress.get(p.id) || { n: 0 };
    progress.mark(p.id, { ok: ok ? 1 : 0, n: (cur.n || 0) + 1, t: Date.now() });
  }

  const solved = !!st?.ok;
  const solutionBtn = (
    <Button variant="ghost" onClick={toggleSolution} aria-expanded={open}>
      {open ? <EyeOff /> : <Lightbulb />} {open ? "დამალვა" : "ამოხსნა"}
    </Button>
  );

  return (
    <li className="grid scroll-mt-28 grid-cols-[2.25rem_minmax(0,1fr)] gap-x-3 border-t border-border py-7 sm:grid-cols-[3rem_minmax(0,1fr)] sm:gap-x-5" id={`p-${index + 1}`}>
      <div className="flex flex-col items-end gap-2 pt-px">
        <span className={cn("num font-display text-[1.625rem] font-medium leading-none", solved ? "text-success" : "text-accent")}>{index + 1}.</span>
        {solved && <Check className="size-4 text-success" aria-label="ამოხსნილია" />}
      </div>

      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <LevelDots level={p.l} />
          {!auto && <span className="text-xs font-medium text-subtle-foreground">თვითშემოწმება</span>}
        </div>

        <MathHtml html={p.q} className="mt-2.5 text-[1.0625rem] leading-relaxed" />

        {isChoice ? (
          <form onSubmit={check} className="mt-5">
            <div role="radiogroup" aria-label={`ვარიანტები, ამოცანა ${index + 1}`} className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {p.k.opts.map((o, j) => (
                <label
                  key={j}
                  className={cn(
                    "flex min-h-12 cursor-pointer items-center gap-3 rounded-md border px-3.5 py-2.5 transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ring",
                    choice === j ? "border-foreground bg-surface-2" : "border-border-strong hover:border-foreground/40 hover:bg-surface-2/60",
                  )}
                >
                  <input type="radio" name={`o-${p.id}`} className="sr-only" checked={choice === j} onChange={() => (setChoice(j), setLocal(null))} />
                  <span
                    className={cn(
                      "grid size-7 shrink-0 place-items-center rounded-full border font-serif text-sm font-semibold transition-colors",
                      choice === j ? "border-foreground bg-foreground text-background" : "border-border-strong text-muted-foreground",
                    )}
                  >
                    {LETTERS[j] || j + 1}
                  </span>
                  <MathHtml html={o} as="span" className="min-w-0" />
                </label>
              ))}
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button type="submit" variant="secondary">
                შემოწმება
              </Button>
              {solutionBtn}
            </div>
          </form>
        ) : auto ? (
          <form onSubmit={check} className="mt-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <label className="flex min-w-0 flex-1 items-end gap-3 sm:max-w-md">
                <span className="pb-2.5 text-sm font-semibold text-muted-foreground">პასუხი:</span>
                <Input
                  ref={inputRef}
                  value={value}
                  onChange={(e) => (setValue(e.target.value), local && setLocal(null))}
                  onFocus={() => setFocused(true)}
                  onBlur={() => setTimeout(() => setFocused(false), 150)}
                  autoComplete="off"
                  autoCapitalize="off"
                  autoCorrect="off"
                  spellCheck={false}
                  enterKeyHint="done"
                  aria-label={`შენი პასუხი, ამოცანა ${index + 1}`}
                  className={lineInput}
                />
              </label>
              <div className="flex gap-2">
                <Button type="submit" variant="secondary">
                  შემოწმება
                </Button>
                {solutionBtn}
              </div>
            </div>
            {focused && <SymbolBar onInsert={insert} className="mt-3" />}
          </form>
        ) : (
          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-end">
            <label className="flex min-w-0 flex-1 items-end gap-3 sm:max-w-md">
              <span className="pb-2.5 text-sm font-semibold text-muted-foreground">პასუხი:</span>
              <Input value={value} onChange={(e) => setValue(e.target.value)} aria-label={`შენი პასუხი, ამოცანა ${index + 1}`} className={lineInput} />
            </label>
            <Button variant="secondary" onClick={toggleSolution} aria-expanded={open}>
              <Eye /> პასუხის ნახვა
            </Button>
          </div>
        )}

        <p className="mt-3 min-h-5 text-sm font-semibold" role="status" aria-live="polite">
          <Feedback st={st} local={local} />
        </p>

        {open && (
          <div className={cn("mt-3 border-l-[3px] py-1 pl-5 motion-safe:animate-fade", solved ? "border-success" : "border-border-strong")}>
            <p className="eyebrow text-subtle-foreground">ამოხსნა</p>
            <p className="mt-2 flex flex-wrap items-baseline gap-2 text-[0.9375rem] font-semibold">
              პასუხი: <MathHtml html={p.a} as="span" inline className="mx-inline font-mathtext text-[1.0625rem] font-semibold text-success-foreground" />
            </p>
            {p.s && <MathHtml html={p.s} className="mt-2 text-[1rem] leading-relaxed text-muted-foreground" />}
            {!auto && (
              <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-border pt-3 text-sm">
                <span className="font-semibold">შენი პასუხი სწორი იყო?</span>
                <Button size="sm" variant="secondary" onClick={() => selfMark(true)}>
                  <CircleCheck className="text-success" /> დიახ
                </Button>
                <Button size="sm" variant="ghost" onClick={() => selfMark(false)}>
                  <CircleX /> არა
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </li>
  );
});
