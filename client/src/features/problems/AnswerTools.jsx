import { CircleHelp } from "lucide-react";
import { useCallback } from "react";
import { cn } from "@/lib/cn";

export const SYMBOLS = ["√", "π", "^", "(", ")", "/", "≤", "≥", "∞", ";"];

/** insert text at the caret of a controlled input */
export function useInsert(inputRef, value, setValue) {
  return useCallback(
    (text) => {
      const el = inputRef.current;
      if (!el) return;
      const a = el.selectionStart ?? value.length;
      const b = el.selectionEnd ?? value.length;
      const next = value.slice(0, a) + text + value.slice(b);
      setValue(next);
      requestAnimationFrame(() => {
        el.focus();
        el.setSelectionRange(a + text.length, a + text.length);
      });
    },
    [inputRef, value, setValue],
  );
}

/** symbols that are awkward to type on a phone */
export function SymbolBar({ onInsert, className }) {
  return (
    <div role="group" aria-label="სიმბოლოების ჩასმა" className={cn("flex flex-wrap gap-1.5", className)}>
      {SYMBOLS.map((c) => (
        <button
          key={c}
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => onInsert(c)}
          aria-label={`ჩასმა: ${c}`}
          className="grid h-10 min-w-10 place-items-center rounded-md border border-border-strong bg-surface px-2 font-mathtext text-[1.0625rem] text-foreground transition-colors hover:border-foreground/40 hover:bg-surface-2 active:translate-y-px"
        >
          {c}
        </button>
      ))}
    </div>
  );
}

/** how to type answers — a margin note that opens on demand */
export function AnswerHelp({ className }) {
  return (
    <details className={cn("group text-sm", className)}>
      <summary className="inline-flex cursor-pointer list-none items-center gap-2 rounded-sm font-semibold text-muted-foreground transition-colors hover:text-foreground [&::-webkit-details-marker]:hidden">
        <CircleHelp className="size-4" aria-hidden="true" /> როგორ ჩავწერო პასუხი
      </summary>
      <ul className="mt-3 grid grid-cols-1 gap-x-8 gap-y-1.5 rounded-md bg-surface-2 px-4 py-3.5 text-muted-foreground sm:grid-cols-2 [&_code]:rounded-[3px] [&_code]:bg-surface [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-[0.8125rem] [&_code]:text-foreground">
        <li>
          წილადი: <code>3/4</code>, ათწილადი: <code>2,5</code> ან <code>2.5</code>
        </li>
        <li>
          ფესვი: <code>sqrt(3)</code> ან <code>√3</code>, მაგ. <code>5√2</code>
        </li>
        <li>
          ხარისხი: <code>x^2</code>, π: <code>pi</code> ან <code>π</code>
        </li>
        <li>
          რამდენიმე პასუხი: <code>2; 3</code>
        </li>
        <li>
          შუალედი: <code>(2;5]</code>, უსასრულობა: <code>inf</code>
        </li>
        <li>ერთეულის დაწერა საჭირო არ არის (სმ, მ², °)</li>
        <li className="sm:col-span-2">
          ტრიგონომეტრიაში (XI კლასი) პასუხი ზუსტი სახით იწერება: <code>√3/2</code>, <code>-1/2</code>, <code>(√6+√2)/4</code>, <code>2π/3</code> — ათწილადი არ ჩაითვლება
        </li>
        <li className="sm:col-span-2">
          გამოსახულება — როგორც რვეულში: <code>2x+3</code>, <code>(x-1)(x+1)</code>
        </li>
      </ul>
    </details>
  );
}
