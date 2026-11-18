import { AppWindow, ArrowLeft, ChevronRight, CircleCheck, CircleDot, CircleMinus, CircleX, Clock3, CloudUpload, EyeOff, Flag, LoaderCircle, MonitorX, PanelTopClose } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { LogoMark } from "@/components/brand/Logo";
import { MathHtml } from "@/components/math/MathHtml";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Callout, Tooltip } from "@/components/ui/misc";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { LETTERS } from "@/content/tests";
import { AnswerHelp, SymbolBar, useInsert } from "@/features/problems/AnswerTools";
import { cn } from "@/lib/cn";
import { clock, dateTime, humanDuration, timeOnly } from "@/lib/format";
import { useOutboxPending } from "./outbox";

export function useCountdown(end, active) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (!active) return;
    const t = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(t);
  }, [active]);
  return Math.max(0, (end - now) / 1000);
}

export const STATUS = {
  correct: { label: "სწორია", variant: "success", icon: CircleCheck, chip: "border-success/50 bg-success-soft text-success-foreground", num: "text-success" },
  wrong: { label: "არასწორია", variant: "danger", icon: CircleX, chip: "border-danger/50 bg-danger-soft text-danger-foreground", num: "text-danger" },
  unanswered: { label: "უპასუხო", variant: "neutral", icon: CircleMinus, chip: "border-dashed border-border-strong text-subtle-foreground", num: "text-subtle-foreground" },
  partial: { label: "ნაწილობრივ", variant: "warning", icon: CircleDot, chip: "border-warning/50 bg-warning-soft text-warning-foreground", num: "text-warning" },
  pending: { label: "შესაფასებელი", variant: "highlight", icon: CircleDot, chip: "border-highlight-strong bg-highlight text-highlight-foreground", num: "text-foreground" },
};

export const AWAY = {
  hidden: { label: "სხვა ჩანართი ან აპი", icon: AppWindow },
  blur: { label: "ფანჯარა არააქტიური", icon: PanelTopClose },
  closed: { label: "გვერდი დახურული", icon: MonitorX },
};

/**
 * The exam room: no site navigation, just a quiet running head with the test's name — and, while
 * the test runs, the clock. `back` = { to, label } (hidden while running, so nobody leaves by accident).
 */
export function TestShell({ kicker, title, back, bar, progress, children }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur-md">
        <div className="mx-auto flex min-h-[var(--header-height)] w-full max-w-5xl items-center gap-3 px-3 py-1.5 sm:px-6">
          {back ? (
            <Tooltip content={back.label}>
              <Link
                to={back.to}
                aria-label={back.label}
                className="grid size-10 shrink-0 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-surface-2 hover:text-foreground"
              >
                <ArrowLeft className="size-5" />
              </Link>
            </Tooltip>
          ) : (
            <LogoMark className="ml-1 size-7" />
          )}
          <div className="min-w-0 flex-1">
            <p className="eyebrow truncate text-subtle-foreground">{kicker}</p>
            <p className="truncate font-serif text-[0.9375rem] font-semibold leading-tight">{title}</p>
          </div>
          {bar}
        </div>
        {progress != null && (
          <div className="h-[2px] bg-transparent" aria-hidden="true">
            <div className="h-full bg-accent transition-[width] duration-300" style={{ width: `${Math.round(progress * 100)}%` }} />
          </div>
        )}
      </header>
      <main id="main" tabIndex={-1} className="flex-1">
        {children}
      </main>
    </div>
  );
}

/** clock, answered count and tab leaves — goes in the TestShell bar while a test runs */
export function TimerBar({ remaining, total, answered, count, focus, onFinish }) {
  const warn = remaining < Math.max(120, total * 0.15);
  const crit = remaining < 60;
  return (
    <div className="flex shrink-0 items-center gap-2 sm:gap-3">
      {focus?.leaves > 0 && (
        <Tooltip content="ჩანართიდან გასვლა ფიქსირდება">
          <span className="inline-flex h-8 items-center gap-1.5 rounded-full bg-warning-soft px-2.5 text-xs font-semibold text-warning-foreground">
            <EyeOff className="size-3.5" aria-hidden="true" />
            <span className="num">
              {focus.leaves}
              <span className="hidden sm:inline"> · {clock(focus.awayMs / 1000)}</span>
            </span>
            <span className="sr-only">ჩანართიდან გასვლა</span>
          </span>
        </Tooltip>
      )}
      <span className="hidden text-sm text-muted-foreground md:inline">
        <b className="num font-semibold text-foreground">{answered}</b> / {count}
      </span>
      <span
        role="timer"
        aria-label="დარჩენილი დრო"
        className={cn(
          "num inline-flex h-9 items-center gap-1.5 rounded-md px-2.5 font-display text-[1.1875rem] font-medium tabular-nums transition-colors",
          crit ? "bg-danger text-white motion-safe:animate-pulse dark:text-background" : warn ? "bg-warning-soft text-warning-foreground" : "text-foreground",
        )}
      >
        <Clock3 className="size-4" aria-hidden="true" />
        {clock(remaining)}
      </span>
      <Button size="sm" onClick={onFinish}>
        დასრულება
      </Button>
    </div>
  );
}

/** numbered squares to jump between questions; `state(i)` → { n, done, flag, cur, status } */
export function QuestionChips({ count, state, onJump, label = "ამოცანების ნომრები" }) {
  return (
    <nav aria-label={label} className="flex flex-wrap gap-1.5">
      {Array.from({ length: count }, (_, i) => {
        const s = state(i);
        const st = s.status && STATUS[s.status];
        return (
          <button
            key={i}
            type="button"
            onClick={() => onJump(i)}
            aria-current={s.cur ? "true" : undefined}
            aria-label={`ამოცანა ${s.n ?? i + 1}${s.done ? ", პასუხი გაცემულია" : ""}${s.flag ? ", მონიშნულია" : ""}${st ? `, ${st.label}` : ""}`}
            className={cn(
              "num relative grid size-10 place-items-center rounded-md border text-sm font-semibold transition-colors duration-150",
              st ? st.chip : s.done ? "border-foreground bg-foreground text-background" : "border-border-strong bg-surface text-muted-foreground hover:border-foreground/50 hover:text-foreground",
              s.cur && "outline-2 outline-offset-2 outline-accent",
            )}
          >
            {s.n ?? i + 1}
            {s.flag && <span className="absolute -right-1 -top-1 size-2.5 rounded-full border-2 border-background bg-accent" aria-hidden="true" />}
          </button>
        );
      })}
    </nav>
  );
}

/** ა) ბ) გ) დ) options; in review mode marks the right one and the student's choice */
export function ChoiceOptions({ options, value, onChange, review, correct, label }) {
  return (
    <div role={review ? undefined : "radiogroup"} aria-label={label} className="grid grid-cols-1 gap-2 sm:grid-cols-2">
      {options.map((o, j) => {
        const mine = value === j;
        const right = review && j === correct;
        const wrong = review && mine && j !== correct;
        const Tag = review ? "div" : "button";
        return (
          <Tag
            key={j}
            {...(review ? {} : { type: "button", role: "radio", "aria-checked": mine, onClick: () => onChange(mine ? null : j) })}
            className={cn(
              "flex min-h-12 items-center gap-3 rounded-md border px-3.5 py-2.5 text-left transition-colors",
              !review && (mine ? "border-foreground bg-surface-2" : "border-border-strong bg-surface hover:border-foreground/40 hover:bg-surface-2/60"),
              right && "border-success/60 bg-success-soft",
              wrong && "border-danger/60 bg-danger-soft",
              review && !right && !wrong && "border-border bg-surface text-muted-foreground",
            )}
          >
            <span
              className={cn(
                "grid size-7 shrink-0 place-items-center rounded-full border font-serif text-sm font-semibold",
                mine && !review
                  ? "border-foreground bg-foreground text-background"
                  : right
                    ? "border-success bg-success text-white dark:text-background"
                    : wrong
                      ? "border-danger bg-danger text-white dark:text-background"
                      : "border-border-strong text-muted-foreground",
              )}
            >
              {LETTERS[j]}
            </span>
            <MathHtml html={o} as="span" className="min-w-0 flex-1" />
            {right && <CircleCheck className="size-5 shrink-0 text-success" aria-label="სწორი პასუხი" />}
            {wrong && <CircleX className="size-5 shrink-0 text-danger" aria-label="შენი პასუხი" />}
          </Tag>
        );
      })}
    </div>
  );
}

export function WrittenAnswer({ value, onChange, label, onEnter, autoFocus }) {
  const ref = useRef(null);
  const insert = useInsert(ref, value || "", onChange);
  return (
    <div className="grid gap-3">
      <label className="flex max-w-md items-end gap-3">
        <span className="pb-2.5 text-sm font-semibold text-muted-foreground">პასუხი:</span>
        <Input
          ref={ref}
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), onEnter?.())}
          autoComplete="off"
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck={false}
          enterKeyHint="next"
          aria-label={label}
          autoFocus={autoFocus}
          className="h-11 rounded-none border-0 border-b-[1.5px] border-foreground/35 bg-transparent px-1 font-mathtext text-[1.1875rem] shadow-none hover:border-foreground/60 focus:border-accent focus:shadow-[0_1.5px_0_0_var(--accent)] focus:ring-0"
        />
      </label>
      <SymbolBar onInsert={insert} />
      <AnswerHelp />
    </div>
  );
}

/** numbered rules + the tab-leave notice */
export function TestRules({ items }) {
  return (
    <>
      <ol className="space-y-3">
        {items.map((t, i) => (
          <li key={i} className="grid grid-cols-[1.75rem_minmax(0,1fr)] gap-2 font-serif text-[1.0125rem] leading-relaxed">
            <span className="num font-display text-lg leading-[1.6] text-accent">{i + 1}.</span>
            <span>{t}</span>
          </li>
        ))}
      </ol>
      <Callout tone="warning" icon={EyeOff} className="mt-6">
        ტესტის დროს ჩანართიდან ან ფანჯრიდან გასვლა ფიქსირდება — რამდენჯერ და რამდენი ხნით. შედეგთან ერთად ეს ინფორმაცია მასწავლებელსაც ეგზავნება.
      </Callout>
    </>
  );
}

export function SaveStatus({ clientId }) {
  const pending = useOutboxPending(clientId);
  return pending ? (
    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
      <LoaderCircle className="size-3.5 animate-spin" aria-hidden="true" /> სერვერზე ინახება… (ოფლაინ რეჟიმში შეინახება კავშირის აღდგენისას)
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-success-foreground">
      <CloudUpload className="size-3.5" aria-hidden="true" /> შედეგი შენახულია
    </span>
  );
}

/** how often and how long the student left the test */
export function FocusReport({ focus, compact }) {
  const f = focus || { leaves: 0, awayMs: 0, longestMs: 0, events: [] };
  if (!f.leaves)
    return (
      <p className="flex items-center gap-2.5 text-sm text-success-foreground">
        <CircleCheck className="size-[1.1rem] shrink-0" aria-hidden="true" />
        <span>
          <b className="font-semibold">ჩანართი არ დაგიტოვებია.</b> ტესტი ბოლომდე ერთ ფანჯარაში დაწერე.
        </span>
      </p>
    );
  return (
    <div className="rounded-md border border-warning/40 bg-warning-soft/70 text-warning-foreground">
      <div className="flex flex-wrap items-center gap-x-6 gap-y-1.5 px-4 py-3 text-sm">
        <span className="inline-flex items-center gap-2 font-semibold">
          <EyeOff className="size-[1.1rem]" aria-hidden="true" /> ჩანართიდან გასვლა: {f.leaves}-ჯერ
        </span>
        <span>
          სულ: <b className="num">{clock(f.awayMs / 1000)}</b>
        </span>
        <span>
          ყველაზე ხანგრძლივი: <b className="num">{clock(f.longestMs / 1000)}</b>
        </span>
      </div>
      {!compact && f.events?.length > 0 && (
        <ol className="border-t border-warning/30 px-4 py-2 text-sm">
          {f.events.map((e, i) => {
            const A = AWAY[e.type] || AWAY.hidden;
            return (
              <li key={i} className="grid grid-cols-[4.5rem_3.5rem_minmax(0,1fr)] items-center gap-x-3 py-1.5 sm:grid-cols-[5rem_4rem_minmax(0,1fr)_auto]">
                <span className="num font-semibold">{timeOnly(e.from)}</span>
                <span className="num">{clock(e.ms / 1000)}</span>
                <span className="inline-flex min-w-0 items-center gap-1.5">
                  <A.icon className="size-3.5 shrink-0" aria-hidden="true" /> <span className="truncate">{A.label}</span>
                </span>
                {e.q ? <span className="col-start-3 text-xs opacity-80 sm:col-start-auto">ამოცანა №{e.q}</span> : null}
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}

/** the marked paper: circled score, percentage, verdict, counts, time, tab leaves */
export function ResultSummary({ score, max, percent, durationSec, limitSec, auto, counts, verdict, focus, clientId, extra }) {
  const figures = [
    ["სწორი", counts.correct, "text-success"],
    ["არასწორი", counts.wrong + (counts.partial || 0), "text-danger"],
    ["უპასუხო", counts.unanswered, "text-foreground"],
    ["დრო", humanDuration(durationSec), "text-foreground"],
  ];
  return (
    <section aria-label="შედეგი" className="overflow-hidden rounded-[var(--panel-radius)] border border-border bg-surface shadow-sm">
      <div className="grid grid-cols-1 gap-6 p-6 sm:p-8 md:grid-cols-[auto_minmax(0,1fr)] md:items-center md:gap-10">
        <div className="relative mx-auto px-9 py-5 md:mx-0">
          <svg viewBox="0 0 100 60" preserveAspectRatio="none" className="absolute inset-0 h-full w-full -rotate-[4deg]" aria-hidden="true">
            <ellipse cx="50" cy="30" rx="48" ry="27" fill="none" stroke="var(--accent)" strokeWidth="2" strokeDasharray="268 22" vectorEffect="non-scaling-stroke" />
          </svg>
          <p className="relative whitespace-nowrap">
            <span className="num font-display text-[3.75rem] font-medium leading-none">{score}</span>
            <span className="num text-xl text-muted-foreground"> / {max}</span>
          </p>
        </div>
        <div className="min-w-0 text-center md:text-left">
          <p className="num font-display text-[2.25rem] font-medium leading-none">{percent}%</p>
          {verdict && <p className="mt-2 font-serif text-[1.125rem] leading-snug">{verdict}</p>}
          <p className="mt-2 text-sm text-muted-foreground">
            ლიმიტი: {humanDuration(limitSec)}
            {auto && " · დრო ამოიწურა და ტესტი ავტომატურად დასრულდა"}
          </p>
          {(counts.partial > 0 || counts.pending > 0) && (
            <div className="mt-3 flex flex-wrap justify-center gap-2 md:justify-start">
              {counts.partial > 0 && <Badge variant="warning">ნაწილობრივ: {counts.partial}</Badge>}
              {counts.pending > 0 && <Badge variant="highlight">შესაფასებელი: {counts.pending}</Badge>}
            </div>
          )}
          {clientId && (
            <div className="mt-3">
              <SaveStatus clientId={clientId} />
            </div>
          )}
        </div>
      </div>
      <dl className="grid grid-cols-2 gap-px border-y border-border bg-border sm:grid-cols-4">
        {figures.map(([l, v, tone]) => (
          <div key={l} className="bg-surface px-5 py-4">
            <dt className="eyebrow text-subtle-foreground">{l}</dt>
            <dd className={cn("num mt-1 font-display text-[1.625rem] font-medium leading-tight", tone)}>{v}</dd>
          </div>
        ))}
      </dl>
      {extra && <div className="px-6 pt-5 sm:px-8">{extra}</div>}
      <div className="px-6 py-5 sm:px-8">
        <FocusReport focus={focus} />
      </div>
    </section>
  );
}

export function ResultFilters({ value, onChange, options }) {
  return (
    <div role="group" aria-label="ფილტრი" className="flex flex-wrap gap-1.5">
      {options.map(([k, label, n]) => (
        <button
          key={k}
          type="button"
          onClick={() => onChange(k)}
          aria-pressed={value === k}
          className={cn(
            "h-9 rounded-full border px-3.5 text-sm font-semibold transition-colors",
            value === k ? "border-foreground bg-foreground text-background" : "border-border-strong text-muted-foreground hover:border-foreground/40 hover:text-foreground",
          )}
        >
          {label}
          {n != null && <span className="num ml-1.5 opacity-75">{n}</span>}
        </button>
      ))}
    </div>
  );
}

/** one question of a finished test, set like an exercise with the teacher's mark in the margin */
export function ReviewCard({ n, status, points, maxPoints, question, children, level }) {
  const S = STATUS[status] || STATUS.unanswered;
  return (
    <li id={`rq-${n}`} className="grid scroll-mt-24 grid-cols-[2.25rem_minmax(0,1fr)] gap-x-3 border-t border-border py-7 sm:grid-cols-[3rem_minmax(0,1fr)] sm:gap-x-5">
      <div className="flex flex-col items-end gap-2">
        <span className={cn("num font-display text-[1.625rem] font-medium leading-none", S.num)}>{n}.</span>
        <S.icon className={cn("size-4", S.num)} aria-hidden="true" />
      </div>
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
          <Badge variant={S.variant} size="sm">
            {S.label}
          </Badge>
          {level}
          <span className="num ml-auto text-sm text-muted-foreground">
            <b className="font-semibold text-foreground">{points}</b> / {maxPoints} ქულა
          </span>
        </div>
        <MathHtml html={question} className="mt-3 text-[1.0625rem] leading-relaxed" />
        <div className="mt-4">{children}</div>
      </div>
    </li>
  );
}

export function AnswerCompare({ mine, correct, solution }) {
  return (
    <>
      <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="border-l-[3px] border-border-strong pl-4">
          <dt className="eyebrow text-subtle-foreground">შენი პასუხი</dt>
          <dd className="mt-1 break-words font-mathtext text-[1.125rem]">{mine ?? "—"}</dd>
        </div>
        <div className="border-l-[3px] border-success pl-4">
          <dt className="eyebrow text-success-foreground">სწორი პასუხი</dt>
          <dd className="mt-1">
            <MathHtml html={correct} as="span" className="font-semibold text-success-foreground" />
          </dd>
        </div>
      </dl>
      {solution && <Solution html={solution} />}
    </>
  );
}

export function Solution({ html }) {
  return (
    <details className="group mt-4">
      <summary className="inline-flex cursor-pointer list-none items-center gap-1.5 rounded-sm text-sm font-semibold text-accent hover:text-accent-hover [&::-webkit-details-marker]:hidden">
        <ChevronRight className="size-4 transition-transform group-open:rotate-90" aria-hidden="true" /> ამოხსნა
      </summary>
      <MathHtml html={html} className="mt-3 border-l border-border-strong pl-4 text-[1rem] leading-relaxed text-muted-foreground" />
    </details>
  );
}

/** previous attempts as a printed table */
export function HistoryList({ hist, onOpen }) {
  if (!hist.length) return null;
  return (
    <section className="mt-14" aria-labelledby="hist-h">
      <h2 id="hist-h" className="mb-4 text-[1.375rem]">
        შენი ცდები
      </h2>
      <Table>
        <THead>
          <TR>
            <TH>თარიღი</TH>
            <TH className="text-right">შედეგი</TH>
            <TH className="hidden text-right sm:table-cell">დრო</TH>
            <TH className="text-right">გასვლები</TH>
            <TH>
              <span className="sr-only">მოქმედება</span>
            </TH>
          </TR>
        </THead>
        <TBody>
          {hist
            .map((a, i) => [a, i])
            .reverse()
            .map(([a, i]) => (
              <TR key={a.clientId || i} className="hover:bg-surface-2/60">
                <TD className="whitespace-nowrap">{dateTime(a.at)}</TD>
                <TD className="num text-right">
                  <b className="font-semibold">{a.score}</b> / {a.max}
                </TD>
                <TD className="num hidden text-right text-muted-foreground sm:table-cell">{humanDuration(a.used)}</TD>
                <TD className="num text-right">
                  {a.focus?.leaves > 0 ? (
                    <span className="inline-flex items-center gap-1 font-semibold text-warning-foreground">
                      <EyeOff className="size-3.5" aria-hidden="true" /> {a.focus.leaves}
                    </span>
                  ) : (
                    <span className="text-subtle-foreground">0</span>
                  )}
                </TD>
                <TD className="text-right">
                  <Button variant="link" size="sm" onClick={() => onOpen(i)}>
                    ნახვა
                  </Button>
                </TD>
              </TR>
            ))}
        </TBody>
      </Table>
    </section>
  );
}

/* the flag toggle used on single-question pages */
export function FlagButton({ on, onToggle }) {
  return (
    <Button variant={on ? "soft" : "ghost"} size="sm" aria-pressed={!!on} onClick={onToggle}>
      <Flag className={cn(on && "fill-current")} /> {on ? "მონიშნულია" : "მოვნიშნავ"}
    </Button>
  );
}
