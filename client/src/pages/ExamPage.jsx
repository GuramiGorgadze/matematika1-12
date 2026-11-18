import { ArrowLeft, Check, LoaderCircle, Play, RotateCcw } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { MathHtml } from "@/components/math/MathHtml";
import { ConfirmDialog } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Callout } from "@/components/ui/misc";
import { CHK } from "@/content/index.js";
import { countStatuses, examAnswers, examMax, scoreExam } from "@/content/tests";
import { useExams } from "@/content/useExams";
import { StudentGate } from "@/features/student/registration";
import { useSession } from "@/features/student/session";
import { outbox } from "@/features/tests/outbox";
import { emptyFocus, focusSummary } from "@/features/tests/presence";
import { examKey } from "@/features/tests/storage";
import {
  AnswerCompare,
  ChoiceOptions,
  HistoryList,
  QuestionChips,
  ResultFilters,
  ResultSummary,
  ReviewCard,
  TestRules,
  TestShell,
  TimerBar,
  useCountdown,
  WrittenAnswer,
} from "@/features/tests/TestUI";
import { clientInfo, useRunRecord } from "@/features/tests/useRun";
import { cn } from "@/lib/cn";
import { newId } from "@/lib/text";
import NotFoundPage from "./NotFoundPage";

const has = (v) => v != null && String(v).trim() !== "";

function Figure({ it, figs }) {
  const src = it.f && figs ? figs[it.f] : null;
  if (!src) return null;
  return (
    <figure className="ex-figure mt-3">
      <img src={src} alt={`ამოცანა ${it.n}-ის ნახაზი`} loading="lazy" className="max-h-72 w-auto max-w-full" />
    </figure>
  );
}

function Exam({ ex, figs }) {
  const key = examKey(ex.id);
  const [view, setView] = useState(null);
  const [viewIdx, setViewIdx] = useState(0);
  const [filter, setFilter] = useState("all");
  const [confirm, setConfirm] = useState(false);
  const qRef = useRef(1);
  const max = examMax(ex);

  const buildPing = useCallback(
    (run) => ({
      status: "in_progress",
      kind: "exam",
      testId: ex.id,
      title: ex.title,
      testGrade: 12,
      startedAt: run.start,
      timeLimitSec: ex.min * 60,
      questionCount: ex.items.length,
      answeredCount: Object.values(run.ans).filter(has).length,
      focus: focusSummary(run.focus),
      client: clientInfo(),
    }),
    [ex],
  );
  const getQ = useCallback(() => qRef.current, []);
  const finishRef = useRef(() => {});
  const onTimeUp = useCallback(() => finishRef.current(true), []);
  const { rec, commit, finishFocus } = useRunRecord(key, { running: view === "run", buildPing, getQ, onTimeUp });

  function finish(auto) {
    const r = rec.run;
    if (!r) return;
    const at = Math.min(Date.now(), r.end);
    const focus = finishFocus(at);
    const { score, results } = scoreExam(ex, r.ans, {}, CHK);
    const att = { clientId: r.clientId, at, used: (at - r.start) / 1000, ans: r.ans, self: {}, auto: !!auto, score, max, focus };
    rec.hist = [...rec.hist, att].slice(-10);
    rec.run = null;
    commit();
    outbox.saveAttempt(att.clientId, {
      ...buildPing({ ...r, focus }),
      status: "submitted",
      finishedAt: at,
      durationSec: Math.round(att.used),
      autoSubmitted: !!auto,
      answers: examAnswers(ex, r.ans, results),
      focus,
    });
    setConfirm(false);
    setViewIdx(rec.hist.length - 1);
    setFilter("all");
    setView("res");
    window.scrollTo(0, 0);
  }
  finishRef.current = finish;

  useEffect(() => {
    if (view) return;
    if (rec.run && Date.now() >= rec.run.end) finish(true);
    else setView(rec.run ? "run" : "intro");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    document.title = `${ex.title} · მე-12 კლასი`;
  }, [ex.title]);

  function start() {
    const now = Date.now();
    rec.run = { clientId: newId("exam"), start: now, end: now + ex.min * 60000, ans: {}, focus: emptyFocus() };
    commit();
    outbox.saveAttempt(rec.run.clientId, buildPing(rec.run));
    setView("run");
    window.scrollTo(0, 0);
  }

  const kicker = ex.grp === "nat" ? "ერთიანი ეროვნული გამოცდა · მე-12 კლასი" : "სავარჯიშო ტესტი · მე-12 კლასი";
  const back = { to: "/grade/12#exams", label: "ტესტების სიაზე დაბრუნება" };
  if (!view) return null;

  if (view === "intro") {
    const live = rec.run;
    return (
      <TestShell kicker={kicker} title={ex.title} back={back}>
        <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
          <p className="eyebrow text-stage-3">{ex.grp === "nat" ? `ერთიანი ეროვნული გამოცდა · ${ex.year}` : "სავარჯიშო ტესტი"}</p>
          <h1 className="mt-3 text-[2.125rem] leading-[1.14] sm:text-[2.625rem]">{ex.title}</h1>

          <dl className="mt-10 grid grid-cols-3 gap-px border-y border-rule-ink/80 bg-border">
            {[
              [ex.items.length, "ამოცანა"],
              [max, "მაქსიმალური ქულა"],
              [`${ex.min / 60} სთ`, "დრო"],
            ].map(([v, l]) => (
              <div key={l} className="bg-background px-4 py-4 sm:px-5">
                <dt className="eyebrow text-subtle-foreground">{l}</dt>
                <dd className="num mt-1 font-display text-[2rem] font-medium leading-none">{v}</dd>
              </div>
            ))}
          </dl>

          <section aria-labelledby="rules-h" className="mt-10">
            <h2 id="rules-h" className="eyebrow text-subtle-foreground">
              წესები
            </h2>
            <div className="mt-4">
              <TestRules
                items={[
                  "დროის ათვლა იწყება დაწყებისთანავე და ჩერდება მხოლოდ ტესტის დასრულებისას — გვერდის დახურვის დროსაც გრძელდება.",
                  "1–37 ამოცანებში აირჩიე ერთი ვარიანტი. 38–41 ამოცანებში ამოხსენი რვეულში და ჩაწერე საბოლოო პასუხი.",
                  "სწორ პასუხებს და ამოხსნებს დასრულების შემდეგ ნახავ; ღია ამოცანების ქულა შეგიძლია თავად შეაფასო. დროის ამოწურვისას ტესტი თავისით სრულდება.",
                ]}
              />
            </div>
          </section>

          <div className="mt-10 flex flex-wrap items-center gap-4">
            {live ? (
              <Button size="lg" variant="accent" onClick={() => setView("run")}>
                <Play /> გაგრძელება
              </Button>
            ) : (
              <Button size="lg" variant="accent" onClick={start}>
                <Play /> ტესტის დაწყება
              </Button>
            )}
            <Link to={back.to} className="link text-sm font-semibold text-muted-foreground">
              ყველა ტესტი
            </Link>
          </div>
          <p className="mt-6 max-w-2xl text-xs leading-relaxed text-subtle-foreground">
            {ex.grp === "nat"
              ? `წყარო: შეფასებისა და გამოცდების ეროვნული ცენტრის ოფიციალური ტესტი, ივლისი ${ex.year}, I ვარიანტი. სწორი პასუხები და ამოხსნები შედგენილია ამ საიტზე და შეიძლება შეცდომა შეიცავდეს — უპირატესად ოფიციალურ პასუხებს მიენდე.`
              : "ტესტი შედგენილია ეროვნული გამოცდის სტრუქტურით; რიცხვები და ამოცანები ორიგინალურია."}
          </p>
          <HistoryList
            hist={rec.hist}
            onOpen={(i) => {
              setViewIdx(i);
              setFilter("all");
              setView("res");
            }}
          />
        </div>
      </TestShell>
    );
  }

  if (view === "run" && rec.run)
    return <Running ex={ex} figs={figs} run={rec.run} commit={commit} kicker={kicker} qRef={qRef} confirm={confirm} setConfirm={setConfirm} onFinish={() => finish(false)} />;

  const att = rec.hist[viewIdx];
  if (!att) return null;
  return (
    <TestShell kicker={kicker} title={ex.title} back={back}>
      <Result
        ex={ex}
        figs={figs}
        att={att}
        filter={filter}
        setFilter={setFilter}
        onSelf={(n, v) => {
          att.self = { ...(att.self || {}), [n]: v };
          att.score = scoreExam(ex, att.ans, att.self, CHK).score;
          commit();
          outbox.saveScores(att.clientId, { [n]: v });
        }}
        onAgain={start}
        onHistory={() => setView("intro")}
      />
    </TestShell>
  );
}

function Running({ ex, figs, run, commit, kicker, qRef, confirm, setConfirm, onFinish }) {
  const remaining = useCountdown(run.end, true);
  const answered = ex.items.filter((it) => has(run.ans[it.n])).length;
  const setAns = (n, v) => {
    if (has(v)) run.ans[n] = v;
    else delete run.ans[n];
    qRef.current = n;
    commit();
  };
  const jump = (i) => {
    const el = document.getElementById(`eq-${ex.items[i].n}`);
    el?.scrollIntoView({ block: "start" });
    qRef.current = ex.items[i].n;
  };
  /* remember which question the student is looking at (for the tab-leave record) */
  useEffect(() => {
    const io = new IntersectionObserver((es) => es.forEach((e) => e.isIntersecting && (qRef.current = Number(e.target.dataset.n))), { rootMargin: "-40% 0px -50% 0px" });
    document.querySelectorAll("[data-n]").forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [qRef]);

  return (
    <TestShell
      kicker={kicker}
      title={ex.title}
      progress={answered / ex.items.length}
      bar={<TimerBar remaining={remaining} total={ex.min * 60} answered={answered} count={ex.items.length} focus={run.focus} onFinish={() => setConfirm(true)} />}
    >
      <div className="mx-auto max-w-3xl px-4 pb-16 pt-8 sm:px-6">
        <QuestionChips count={ex.items.length} state={(i) => ({ n: ex.items[i].n, done: has(run.ans[ex.items[i].n]) })} onJump={jump} />
        <ol className="mt-8 border-b border-border">
          {ex.items.map((it) => {
            const done = has(run.ans[it.n]);
            return (
              <li
                key={it.n}
                id={`eq-${it.n}`}
                data-n={it.n}
                className="grid scroll-mt-24 grid-cols-[2.25rem_minmax(0,1fr)] gap-x-3 border-t border-border py-8 sm:grid-cols-[3rem_minmax(0,1fr)] sm:gap-x-5"
              >
                <div className="flex flex-col items-end gap-2">
                  <span className={cn("num font-display text-[1.625rem] font-medium leading-none", done ? "text-foreground" : "text-accent")}>{it.n}.</span>
                  {done && <Check className="size-4" aria-label="პასუხი გაცემულია" />}
                </div>
                <div className="min-w-0">
                  <Badge variant={it.o ? "neutral" : "highlight"} size="sm">
                    {it.p} ქულა
                  </Badge>
                  <MathHtml html={it.t} className="mt-3 text-[1.0625rem] leading-relaxed" />
                  <Figure it={it} figs={figs} />
                  <div className="mt-5">
                    {it.o ? (
                      <ChoiceOptions options={it.o} value={run.ans[it.n] ?? null} onChange={(v) => setAns(it.n, v)} label={`ვარიანტები, ამოცანა ${it.n}`} />
                    ) : (
                      <WrittenAnswer value={run.ans[it.n] ?? ""} onChange={(v) => setAns(it.n, v)} label={`საბოლოო პასუხი, ამოცანა ${it.n}`} />
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
        <div className="mt-10 flex justify-center">
          <Button size="lg" variant="accent" onClick={() => setConfirm(true)}>
            ტესტის დასრულება
          </Button>
        </div>
      </div>
      <ConfirmDialog
        open={confirm}
        onOpenChange={setConfirm}
        title="დავასრულოთ ტესტი?"
        description={`${ex.items.length - answered ? `უპასუხოდ დარჩა ${ex.items.length - answered} ამოცანა. ` : "ყველა ამოცანას გაეცი პასუხი. "}დასრულების შემდეგ პასუხებს ვეღარ შეცვლი.`}
        confirmLabel="დიახ, დავასრულებ"
        cancelLabel="გავაგრძელებ"
        onConfirm={onFinish}
      />
    </TestShell>
  );
}

function Result({ ex, figs, att, filter, setFilter, onSelf, onAgain, onHistory }) {
  const { results, score } = useMemo(() => scoreExam(ex, att.ans, att.self, CHK), [ex, att.ans, att.self]);
  const counts = countStatuses(results);
  const max = examMax(ex);
  const pc = Math.round((score / max) * 100);
  const shown = ex.items
    .map((it, i) => [it, i])
    .filter(([it, i]) => filter === "all" || (filter === "wrong" ? ["wrong", "partial"].includes(results[i].status) : filter === "none" ? results[i].status === "unanswered" : !it.o));
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <p className="eyebrow text-accent">შედეგი</p>
      <h1 className="mt-3 text-[2rem] leading-[1.15] sm:text-[2.375rem]">{ex.title}</h1>
      <div className="mt-8">
        <ResultSummary
          score={score}
          max={max}
          percent={pc}
          durationSec={att.used}
          limitSec={ex.min * 60}
          auto={att.auto}
          counts={counts}
          focus={att.focus}
          clientId={att.clientId}
          extra={counts.pending > 0 && <Callout tone="highlight">{counts.pending} ღია ამოცანა შენს შეფასებას ელოდება: ქვემოთ შეადარე შენი ამოხსნა სწორ პასუხს და მიანიჭე ქულა.</Callout>}
        />
      </div>
      <h2 className="mt-14 text-[1.5rem]">ამოცანები</h2>
      <div className="mt-5">
        <QuestionChips
          count={ex.items.length}
          label="ამოცანების შედეგები"
          state={(i) => ({ n: ex.items[i].n, status: results[i].status })}
          onJump={(i) => {
            setFilter("all");
            requestAnimationFrame(() => document.getElementById(`rq-${ex.items[i].n}`)?.scrollIntoView({ block: "start" }));
          }}
        />
      </div>
      <div className="mt-5">
        <ResultFilters
          value={filter}
          onChange={setFilter}
          options={[
            ["all", "ყველა", ex.items.length],
            ["wrong", "არასწორი", counts.wrong + counts.partial],
            ["none", "უპასუხო", counts.unanswered],
            ["w", "ღია ამოცანები"],
          ]}
        />
      </div>
      <ol className="mt-6 border-b border-border">
        {shown.map(([it, i]) => {
          const r = results[i];
          const a = att.ans[it.n];
          return (
            <ReviewCard key={it.n} n={it.n} status={r.status} points={r.points} maxPoints={it.p} question={it.t}>
              <Figure it={it} figs={figs} />
              {it.o ? (
                <ChoiceOptions options={it.o} value={a ?? null} review correct={it.a} />
              ) : (
                <>
                  <AnswerCompare mine={has(a) ? a : null} correct={it.ans} solution={it.sol} />
                  <div role="group" aria-label={`ქულის მინიჭება, ამოცანა ${it.n}`} className="mt-3 flex flex-wrap items-center gap-2 border-t border-border pt-3 text-sm">
                    <span className="mr-1 font-semibold text-muted-foreground">{it.k ? "ქულა (სწორი მსვლელობისას შეგიძლია შეცვალო):" : "შეაფასე შენი ამოხსნა:"}</span>
                    {Array.from({ length: it.p + 1 }, (_, q) => (
                      <button
                        key={q}
                        type="button"
                        aria-pressed={r.points === q && (r.manual || r.auto)}
                        onClick={() => onSelf(it.n, q)}
                        className={cn(
                          "num size-10 rounded-md border text-sm font-semibold transition-colors",
                          r.points === q && (r.manual || (r.auto && r.status !== "unanswered")) ? "border-foreground bg-foreground text-background" : "border-border-strong hover:border-foreground/40",
                        )}
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </ReviewCard>
          );
        })}
      </ol>
      <div className="mt-10 flex flex-wrap items-center gap-3">
        <Button variant="accent" onClick={onAgain}>
          <RotateCcw /> ხელახლა ცდა
        </Button>
        <Button variant="secondary" onClick={onHistory}>
          ჩემი ცდები
        </Button>
        <Link to="/grade/12#exams" className="inline-flex items-center gap-2 px-2 text-sm font-semibold text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" aria-hidden="true" /> ყველა ტესტი
        </Link>
      </div>
    </div>
  );
}

export default function ExamPage() {
  const { examId } = useParams();
  const { status } = useSession();
  const m = useExams();
  const back = { to: "/grade/12#exams", label: "ტესტების სიაზე დაბრუნება" };
  if (!m)
    return (
      <TestShell kicker="მე-12 კლასი" title="ონლაინ ტესტი" back={back}>
        <div className="grid place-items-center py-24 text-muted-foreground">
          <LoaderCircle className="size-6 animate-spin" aria-label="იტვირთება" />
        </div>
      </TestShell>
    );
  const ex = m.EXAMS.find((e) => e.id === examId);
  if (!ex)
    return (
      <TestShell kicker="მათემატიკა" title="გვერდი ვერ მოიძებნა" back={back}>
        <NotFoundPage />
      </TestShell>
    );
  if (status !== "ready")
    return (
      <TestShell kicker="მე-12 კლასი" title={ex.title} back={back}>
        <StudentGate />
      </TestShell>
    );
  return <Exam key={ex.id} ex={ex} figs={m.EXFIGS} />;
}
