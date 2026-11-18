import { ArrowLeft, ArrowRight, Clock3, Play, RotateCcw } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { LevelDots, MathHtml } from "@/components/math/MathHtml";
import { ConfirmDialog } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Kbd } from "@/components/ui/misc";
import { CHK, findChapter, keyedProblems, PBYID, testable } from "@/content/index.js";
import { buildChapterTest, chapterAnswers, chapterQuestion, CHAPTER_TEST_SIZES, countStatuses, minutesFor, scoreChapter } from "@/content/tests";
import { StudentGate } from "@/features/student/registration";
import { useSession } from "@/features/student/session";
import { outbox } from "@/features/tests/outbox";
import { emptyFocus, focusSummary } from "@/features/tests/presence";
import { chapterTestKey } from "@/features/tests/storage";
import {
  AnswerCompare,
  ChoiceOptions,
  FlagButton,
  HistoryList,
  QuestionChips,
  ResultFilters,
  ResultSummary,
  ReviewCard,
  Solution,
  TestRules,
  TestShell,
  TimerBar,
  useCountdown,
  WrittenAnswer,
} from "@/features/tests/TestUI";
import { clientInfo, useRunRecord } from "@/features/tests/useRun";
import { cn } from "@/lib/cn";
import { ord } from "@/lib/format";
import { newId } from "@/lib/text";
import NotFoundPage from "./NotFoundPage";

const has = (v) => v != null && String(v).trim() !== "";
const verdictOf = (pc) =>
  pc >= 90 ? "შესანიშნავია!" : pc >= 75 ? "ძალიან კარგი შედეგია." : pc >= 50 ? "კარგი საფუძველია — გაიმეორე არასწორად ამოხსნილი ამოცანები." : "ღირს თავის გაკვეთილების გამეორება და ხელახლა ცდა.";

function ChapterTest({ n, ch }) {
  const key = chapterTestKey(n, ch.id);
  const testId = `${n}:${ch.id}`;
  const title = `თავი ${ch.no}. ${ch.title}`;
  const [view, setView] = useState(null);
  const [size, setSize] = useState(30);
  const [viewIdx, setViewIdx] = useState(0);
  const [filter, setFilter] = useState("all");
  const [confirm, setConfirm] = useState(false);
  const qRef = useRef(0);

  const buildPing = useCallback(
    (run) => ({
      status: "in_progress",
      kind: "chapter",
      testId,
      title: `${title} — შემაჯამებელი ტესტი (${run.items.length})`,
      testGrade: n,
      chapterId: ch.id,
      startedAt: run.start,
      timeLimitSec: run.min * 60,
      questionCount: run.items.length,
      answeredCount: Object.values(run.ans).filter(has).length,
      focus: focusSummary(run.focus),
      client: clientInfo(),
    }),
    [testId, title, n, ch.id],
  );
  const getQ = useCallback(() => qRef.current + 1, []);
  const finishRef = useRef(() => {});
  const onTimeUp = useCallback(() => finishRef.current(true), []);
  const { rec, commit, finishFocus } = useRunRecord(key, { running: view === "run", buildPing, getQ, onTimeUp });
  const run = rec.run;
  if (run) qRef.current = run.cur;

  function finish(auto) {
    const r = rec.run;
    if (!r) return;
    const at = Math.min(Date.now(), r.end);
    const focus = finishFocus(at);
    const { score, results } = scoreChapter(r.items, r.ans, PBYID, CHK);
    const att = { clientId: r.clientId, at, used: (at - r.start) / 1000, min: r.min, items: r.items, ans: r.ans, auto: !!auto, score, max: r.items.length, focus };
    rec.hist = [...rec.hist, att].slice(-10);
    rec.run = null;
    commit();
    outbox.saveAttempt(att.clientId, {
      ...buildPing({ ...r, focus }),
      status: "submitted",
      finishedAt: at,
      durationSec: Math.round(att.used),
      autoSubmitted: !!auto,
      answers: chapterAnswers(r.items, r.ans, results, PBYID),
      focus,
    });
    setConfirm(false);
    setViewIdx(rec.hist.length - 1);
    setFilter("all");
    setView("res");
    window.scrollTo(0, 0);
  }
  finishRef.current = finish;

  /* first render: resume a running test, or finish one whose time ran out while away */
  useEffect(() => {
    if (view) return;
    if (rec.run && Date.now() >= rec.run.end) finish(true);
    else setView(rec.run ? "run" : "intro");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    document.title = `შემაჯამებელი ტესტი · თავი ${ch.no} · ${ord(n)} კლასი`;
  }, [ch.no, n]);

  function start(sz) {
    const now = Date.now();
    const min = minutesFor(sz);
    const items = buildChapterTest(keyedProblems(ch), sz, now);
    rec.run = { clientId: newId("cht"), start: now, end: now + min * 60000, min, items, ans: {}, flag: {}, cur: 0, focus: emptyFocus() };
    commit();
    outbox.saveAttempt(rec.run.clientId, buildPing(rec.run));
    setView("run");
    window.scrollTo(0, 0);
  }

  const kicker = `შემაჯამებელი ტესტი · ${ord(n)} კლასი`;
  const back = { to: `/grade/${n}/${ch.id}`, label: `თავი ${ch.no}-ზე დაბრუნება` };

  if (!view) return null;

  /* ---------- intro: the exam cover sheet ---------- */
  if (view === "intro") {
    return (
      <TestShell kicker={kicker} title={title} back={back}>
        <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
          <p className="eyebrow text-accent">შემაჯამებელი ტესტი</p>
          <h1 className="mt-3 text-[2.125rem] leading-[1.14] sm:text-[2.625rem]">{title}</h1>

          <section aria-labelledby="size-h" className="mt-10">
            <h2 id="size-h" className="eyebrow text-subtle-foreground">
              ამოცანების რაოდენობა
            </h2>
            <div role="radiogroup" aria-labelledby="size-h" className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
              {CHAPTER_TEST_SIZES.map((s) => (
                <button
                  key={s.n}
                  type="button"
                  role="radio"
                  aria-checked={size === s.n}
                  onClick={() => setSize(s.n)}
                  className={cn(
                    "flex items-end justify-between rounded-[var(--panel-radius)] border px-5 py-4 text-left transition-[border-color,background-color,box-shadow]",
                    size === s.n ? "border-foreground bg-surface shadow-[inset_0_0_0_1px_var(--foreground)]" : "border-border-strong hover:border-foreground/40 hover:bg-surface/60",
                  )}
                >
                  <span>
                    <span className="num block font-display text-[2.5rem] font-medium leading-none">{s.n}</span>
                    <span className="mt-1 block text-sm font-semibold">ამოცანა</span>
                  </span>
                  <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Clock3 className="size-4" aria-hidden="true" /> {s.min} წთ
                  </span>
                </button>
              ))}
            </div>
          </section>

          <section aria-labelledby="rules-h" className="mt-10 border-t border-border pt-8">
            <h2 id="rules-h" className="eyebrow text-subtle-foreground">
              წესები
            </h2>
            <div className="mt-4">
              <TestRules
                items={[
                  "დროის ათვლა იწყება დაწყების ღილაკზე დაჭერისთანავე და არ ჩერდება — გვერდის დახურვის დროსაც.",
                  "ეკრანზე ერთი ამოცანა ჩანს; ნომრებით ან ღილაკებით („წინა“, „შემდეგი“) ნებისმიერ ამოცანაზე გადახვალ. გაუგებარი ამოცანა მონიშნე.",
                  "ზოგ ამოცანაში ვარიანტი უნდა აირჩიო, ზოგში — პასუხი ჩაწერო. ამოხსენი რვეულში, პასუხი აქ შეიყვანე.",
                  "სწორ პასუხებს და ამოხსნებს ტესტის დასრულების შემდეგ დაინახავ. ყოველ ცდაზე ამოცანები ახლიდან შეირჩევა.",
                ]}
              />
            </div>
          </section>

          <div className="mt-10 flex flex-wrap items-center gap-4">
            <Button size="lg" variant="accent" onClick={() => start(size)}>
              <Play aria-hidden="true" /> ტესტის დაწყება
            </Button>
            <Link to={back.to} className="link text-sm font-semibold text-muted-foreground">
              თავზე დაბრუნება
            </Link>
          </div>

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

  /* ---------- running: one question at a time ---------- */
  if (view === "run" && run) {
    return (
      <Running key={run.clientId} run={run} commit={commit} title={title} kicker={kicker} onAsk={() => setConfirm(true)} confirm={confirm} setConfirm={setConfirm} onFinish={() => finish(false)} />
    );
  }

  /* ---------- result ---------- */
  const att = rec.hist[viewIdx];
  if (!att) return null;
  return (
    <TestShell kicker={kicker} title={title} back={back}>
      <Result att={att} title={title} filter={filter} setFilter={setFilter} onAgain={() => start(att.max)} onHistory={() => setView("intro")} backTo={back.to} />
    </TestShell>
  );
}

function Running({ run, commit, title, kicker, onAsk, confirm, setConfirm, onFinish }) {
  const remaining = useCountdown(run.end, true);
  const N = run.items.length;
  const i = run.cur;
  const it = run.items[i];
  const p = PBYID[it.id];
  const answered = Object.values(run.ans).filter(has).length;
  const flagged = Object.keys(run.flag).length;

  const setAns = (v) => {
    if (has(v)) run.ans[i] = v;
    else delete run.ans[i];
    commit();
  };
  const go = (k) => {
    run.cur = Math.max(0, Math.min(N - 1, k));
    commit();
    document.getElementById("cq")?.focus({ preventScroll: true });
  };
  useEffect(() => {
    const onKey = (e) => {
      const tag = e.target?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || e.altKey || e.ctrlKey || e.metaKey) return;
      if (e.key === "ArrowRight") go(run.cur + 1);
      else if (e.key === "ArrowLeft") go(run.cur - 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  return (
    <TestShell kicker={kicker} title={title} progress={answered / N} bar={<TimerBar remaining={remaining} total={run.min * 60} answered={answered} count={N} focus={run.focus} onFinish={onAsk} />}>
      <div className="mx-auto max-w-3xl px-4 pb-16 pt-8 sm:px-6">
        <QuestionChips count={N} state={(k) => ({ done: has(run.ans[k]), flag: !!run.flag[k], cur: k === i })} onJump={go} />

        <section id="cq" tabIndex={-1} aria-label={`ამოცანა ${i + 1}`} className="mt-10 outline-none">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-border pb-4">
            <p className="flex items-baseline gap-1.5">
              <span className="num font-display text-[2.5rem] font-medium leading-none text-accent">{i + 1}</span>
              <span className="num text-sm text-subtle-foreground">/ {N}</span>
            </p>
            {p && <LevelDots level={p.l} />}
            <span className="ml-auto">
              <FlagButton
                on={run.flag[i]}
                onToggle={() => {
                  if (run.flag[i]) delete run.flag[i];
                  else run.flag[i] = 1;
                  commit();
                }}
              />
            </span>
          </div>
          <MathHtml html={chapterQuestion(it, p)} className="mt-6 text-[1.1875rem] leading-relaxed" />
          <div className="mt-8">
            {it.o ? (
              <ChoiceOptions options={it.o} value={run.ans[i] ?? null} onChange={(v) => setAns(v)} label="ვარიანტები" />
            ) : (
              <WrittenAnswer key={i} value={run.ans[i] ?? ""} onChange={setAns} label={`შენი პასუხი, ამოცანა ${i + 1}`} onEnter={() => go(i + 1)} />
            )}
          </div>
        </section>

        <div className="mt-12 flex items-center justify-between gap-3 border-t border-border pt-5">
          <Button variant="secondary" onClick={() => go(i - 1)} disabled={i === 0}>
            <ArrowLeft /> წინა
          </Button>
          <span className="hidden text-xs text-subtle-foreground sm:block">
            <Kbd>←</Kbd> <Kbd>→</Kbd> ამოცანებს შორის გადასვლა
          </span>
          {i < N - 1 ? (
            <Button onClick={() => go(i + 1)}>
              შემდეგი <ArrowRight />
            </Button>
          ) : (
            <Button variant="accent" onClick={onAsk}>
              დასრულება
            </Button>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={confirm}
        onOpenChange={setConfirm}
        title="დავასრულოთ ტესტი?"
        description={`${N - answered ? `უპასუხოდ დარჩა ${N - answered} ამოცანა. ` : "ყველა ამოცანას გაეცი პასუხი. "}${flagged ? `მონიშნული გაქვს ${flagged} ამოცანა. ` : ""}დასრულების შემდეგ პასუხებს ვეღარ შეცვლი.`}
        confirmLabel="დიახ, დავასრულებ"
        cancelLabel="გავაგრძელებ"
        onConfirm={onFinish}
      />
    </TestShell>
  );
}

function Result({ att, title, filter, setFilter, onAgain, onHistory, backTo }) {
  const { results } = useMemo(() => scoreChapter(att.items, att.ans, PBYID, CHK), [att]);
  const counts = countStatuses(results);
  const pc = Math.round((att.score / att.max) * 100);
  const shown = att.items
    .map((it, i) => [it, i])
    .filter(([it, i]) => filter === "all" || (filter === "wrong" ? results[i] === "wrong" : filter === "none" ? results[i] === "unanswered" : filter === "w" ? !it.o : !!it.o));
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <p className="eyebrow text-accent">შედეგი</p>
      <h1 className="mt-3 text-[2rem] leading-[1.15] sm:text-[2.375rem]">{title}</h1>
      <div className="mt-8">
        <ResultSummary
          score={att.score}
          max={att.max}
          percent={pc}
          durationSec={att.used}
          limitSec={att.min * 60}
          auto={att.auto}
          counts={counts}
          verdict={verdictOf(pc)}
          focus={att.focus}
          clientId={att.clientId}
        />
      </div>

      <section aria-labelledby="review-h" className="mt-14">
        <h2 id="review-h" className="text-[1.5rem]">
          ამოცანები
        </h2>
        <div className="mt-5">
          <QuestionChips
            count={att.items.length}
            label="ამოცანების შედეგები"
            state={(i) => ({ status: results[i] })}
            onJump={(i) => {
              setFilter("all");
              requestAnimationFrame(() => document.getElementById(`rq-${i + 1}`)?.scrollIntoView({ block: "start" }));
            }}
          />
        </div>
        <div className="mt-5">
          <ResultFilters
            value={filter}
            onChange={setFilter}
            options={[
              ["all", "ყველა", att.items.length],
              ["wrong", "არასწორი", counts.wrong],
              ["none", "უპასუხო", counts.unanswered],
              ["w", "ჩასაწერი"],
              ["c", "შემოსახაზი"],
            ]}
          />
        </div>
        <ol className="mt-6 border-b border-border">
          {shown.map(([it, i]) => {
            const p = PBYID[it.id] || { q: "", a: "", s: "", l: 1 };
            const a = att.ans[i];
            return (
              <ReviewCard key={i} n={i + 1} status={results[i]} points={results[i] === "correct" ? 1 : 0} maxPoints={1} question={chapterQuestion(it, p)} level={<LevelDots level={p.l} />}>
                {it.o ? (
                  <>
                    <ChoiceOptions options={it.o} value={a ?? null} review correct={it.c} />
                    {p.s && <Solution html={p.s} />}
                  </>
                ) : (
                  <AnswerCompare mine={has(a) ? a : null} correct={p.a} solution={p.s} />
                )}
              </ReviewCard>
            );
          })}
        </ol>
      </section>

      <div className="mt-10 flex flex-wrap items-center gap-3">
        <Button variant="accent" onClick={onAgain}>
          <RotateCcw /> ხელახლა ცდა
        </Button>
        <Button variant="secondary" onClick={onHistory}>
          ჩემი ცდები
        </Button>
        <Link to={backTo} className="inline-flex items-center gap-2 px-2 text-sm font-semibold text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" aria-hidden="true" /> თავზე დაბრუნება
        </Link>
      </div>
    </div>
  );
}

export default function ChapterTestPage() {
  const { n: ns, chapterId } = useParams();
  const { status } = useSession();
  const n = Number(ns);
  const ch = n >= 1 && n <= 12 ? findChapter(n, chapterId) : null;
  if (!ch || !testable(ch))
    return (
      <TestShell kicker="მათემატიკა" title="გვერდი ვერ მოიძებნა" back={{ to: "/grades", label: "სარჩევი" }}>
        <NotFoundPage />
      </TestShell>
    );
  /* not signed in yet: the registration card inside the exam room */
  if (status !== "ready")
    return (
      <TestShell kicker={`შემაჯამებელი ტესტი · ${ord(n)} კლასი`} title={`თავი ${ch.no}. ${ch.title}`} back={{ to: `/grade/${n}/${ch.id}`, label: "თავზე დაბრუნება" }}>
        <StudentGate />
      </TestShell>
    );
  return <ChapterTest key={`${n}/${ch.id}`} n={n} ch={ch} />;
}
