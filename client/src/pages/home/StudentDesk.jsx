import { ArrowRight, ListChecks } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Container } from "@/components/layout/Container";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Progress, Skeleton, Stat, StatGrid } from "@/components/ui/misc";
import { chapterNo, CURR, LESSON_PLACE, lessonNo, testable } from "@/content/index.js";
import { lessonStats, useLastLesson, useSolved } from "@/features/book/book";
import { useProgress } from "@/features/student/progress";
import { bestOf, chapterTestKey, useTestRecord } from "@/features/tests/storage";
import { api } from "@/lib/api";
import { cn } from "@/lib/cn";
import { ago, ord, STAGE_STYLES, stageOf, thousands } from "@/lib/format";

/** the lesson to continue: the last one opened, or the first lesson of the student's grade */
function useContinue(grade) {
  const last = useLastLesson();
  const place = last && LESSON_PLACE[last.lessonId];
  if (place) {
    const ch = CURR[place.grade].find((c) => c.id === place.chapterId);
    return { grade: place.grade, ch, index: place.index, lesson: ch.lessons[place.index - 1], at: last.at, fresh: false };
  }
  const ch = CURR[grade].find((c) => !c.soon);
  return ch ? { grade, ch, index: 1, lesson: ch.lessons[0], fresh: true } : null;
}

function Bookmark() {
  return (
    <svg viewBox="0 0 28 44" className="absolute -top-px right-8 h-11 w-7" aria-hidden="true">
      <path d="M0 0h28v44l-14-10L0 44z" fill="var(--accent)" />
    </svg>
  );
}

function ContinueCard({ grade }) {
  const progress = useProgress();
  const c = useContinue(grade);
  if (!c) return null;
  const st = lessonStats(progress, c.lesson.id);
  const to = `/grade/${c.grade}/${c.ch.id}/${c.index}`;
  return (
    <section aria-labelledby="continue-h" className="relative rounded-[var(--panel-radius)] border border-border bg-surface p-6 shadow-sm sm:p-8">
      <Bookmark />
      <p className="eyebrow text-accent">{c.fresh ? "დაიწყე აქედან" : "სანიშნე"}</p>
      <p className="mt-4 text-sm text-subtle-foreground">
        {ord(c.grade)} კლასი · თავი {c.ch.no} · {c.ch.title}
      </p>
      <h2 id="continue-h" className="mt-1.5 pr-10 text-[1.375rem] leading-snug sm:text-[1.875rem]">
        <span className="num mr-2 font-display font-medium text-accent">{lessonNo(c.ch, c.index - 1)}</span>
        {c.lesson.title}
      </h2>
      <div className="mt-6 flex flex-wrap items-end justify-between gap-6">
        <div className="w-full max-w-xs">
          <div className="mb-1.5 flex justify-between text-xs text-subtle-foreground">
            <span>ამოცანები</span>
            <span className="num">
              {st.solved} / {st.total}
            </span>
          </div>
          <Progress value={st.solved} max={st.total || 1} barClassName="bg-success" label="ამოხსნილი ამოცანები" />
          {c.at && <p className="mt-2 text-xs text-subtle-foreground">ბოლოს გახსნილი {ago(c.at)}</p>}
        </div>
        <ButtonLink to={to} variant="accent" size="lg">
          {c.fresh ? "დაწყება" : "გაგრძელება"} <ArrowRight aria-hidden="true" />
        </ButtonLink>
      </div>
    </section>
  );
}

function ChapterRow({ n, ch }) {
  const { solved, total } = useSolved(ch.lessons.map((l) => l.id));
  const rec = useTestRecord(chapterTestKey(n, ch.id));
  const best = bestOf(rec.hist);
  const st = STAGE_STYLES[stageOf(n)];
  return (
    <li className="border-b border-border">
      <Link
        to={`/grade/${n}/${ch.id}`}
        className="group -mx-2 grid grid-cols-[2.5rem_minmax(0,1fr)] items-center gap-x-4 gap-y-2 rounded-md px-2 py-4 transition-colors hover:bg-surface-2/70 sm:grid-cols-[2.5rem_minmax(0,1fr)_9rem_4.5rem]"
      >
        <span className={cn("num text-right font-display text-3xl font-medium leading-none", st.text)}>{chapterNo(ch)}</span>
        <span className="min-w-0">
          <span className="block truncate font-serif text-[1.0625rem] font-semibold transition-colors group-hover:text-accent">{ch.title}</span>
          <span className="text-xs text-subtle-foreground">
            {ch.lessons.length} გაკვეთილი{ch.placeholder ? " · ნიმუში" : ""}
          </span>
        </span>
        <span className="col-start-2 sm:col-start-auto">
          <span className="num mb-1 block text-right text-xs text-subtle-foreground">
            {solved} / {total}
          </span>
          <Progress value={solved} max={total || 1} className="h-1" barClassName="bg-success" label={`${ch.title}: ამოხსნილი ამოცანები`} />
        </span>
        <span className="hidden text-right text-xs sm:block">
          {best ? <span className="num font-semibold text-foreground">{Math.round(best.pct * 100)}%</span> : testable(ch) ? <span className="text-subtle-foreground">ტესტი —</span> : null}
        </span>
      </Link>
    </li>
  );
}

function RecentTests() {
  const [items, setItems] = useState(null);
  useEffect(() => {
    let alive = true;
    api("/me/attempts")
      .then((r) => alive && setItems(r.items || []))
      .catch(() => alive && setItems([]));
    return () => {
      alive = false;
    };
  }, []);
  return (
    <section aria-labelledby="recent-h">
      <div className="flex items-baseline justify-between border-b-[1.5px] border-rule-ink pb-2">
        <h2 id="recent-h" className="font-serif text-lg font-semibold">
          ბოლო ტესტები
        </h2>
        <Link to="/profile" className="link text-xs font-semibold text-muted-foreground">
          ყველა
        </Link>
      </div>
      {items === null ? (
        <div className="space-y-3 pt-4">
          <Skeleton className="h-10" />
          <Skeleton className="h-10" />
        </div>
      ) : items.length === 0 ? (
        <p className="pt-4 text-sm leading-relaxed text-muted-foreground">
          ჯერ ტესტი არ დაგიწერია. თავის ბოლოს მოძებნე <span className="font-semibold text-foreground">შემაჯამებელი ტესტი</span>.
        </p>
      ) : (
        <ul className="divide-y divide-border">
          {items.slice(0, 5).map((a) => (
            <li key={a.clientId} className="flex items-center gap-3 py-3">
              <ListChecks className="size-4 shrink-0 text-subtle-foreground" aria-hidden="true" />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold">{a.title}</span>
                <span className="text-xs text-subtle-foreground">{ago(a.finishedAt || a.startedAt)}</span>
              </span>
              {a.status === "submitted" ? (
                <span className="num text-sm font-semibold">{Math.round(a.percent ?? 0)}%</span>
              ) : (
                <Badge variant="warning" size="sm">
                  მიმდინარე
                </Badge>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function Totals({ n }) {
  const ids = CURR[n].flatMap((c) => (c.soon ? [] : c.lessons.map((l) => l.id)));
  const progress = useProgress();
  const { solved, total } = useSolved(ids);
  const done = ids.filter((id) => lessonStats(progress, id).done).length;
  return (
    <StatGrid className="grid-cols-2">
      <Stat label="ამოხსნილი" value={thousands(solved)} hint={`${thousands(total)} ამოცანიდან`} />
      <Stat label="გაკვეთილი" value={done} hint={`${ids.length} გაკვეთილიდან`} />
    </StatGrid>
  );
}

/** the logged-in home: bookmark, the grade's chapters with progress, recent tests */
export default function StudentDesk({ student }) {
  const n = student.grade;
  return (
    <Container className="py-10 sm:py-14">
      <header className="flex flex-wrap items-end justify-between gap-6 border-b-[1.5px] border-rule-ink pb-6">
        <div className="animate-rise">
          <p className="eyebrow text-accent">
            {ord(n)} კლასი · {student.school}
          </p>
          <h1 className="mt-3 text-[2.25rem] leading-tight sm:text-[2.75rem]">გამარჯობა, {student.firstName}.</h1>
          <p className="mt-2 font-serif text-[1.0625rem] text-muted-foreground">გააგრძელე იქიდან, სადაც გაჩერდი.</p>
        </div>
        <div className="flex gap-2">
          <ButtonLink to={`/grade/${n}`} variant="secondary">
            სარჩევი
          </ButtonLink>
          <ButtonLink to="/grades" variant="ghost">
            ყველა კლასი
          </ButtonLink>
        </div>
      </header>

      <div className="mt-10 grid grid-cols-1 gap-12 lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-16">
        <div className="min-w-0 space-y-12">
          <ContinueCard grade={n} />
          <section aria-labelledby="chapters-h">
            <div className="flex items-baseline justify-between border-b-[1.5px] border-rule-ink pb-2">
              <h2 id="chapters-h" className="font-serif text-lg font-semibold">
                {ord(n)} კლასის თავები
              </h2>
              <span className="hidden text-xs text-subtle-foreground sm:inline">ამოცანები · ტესტი</span>
            </div>
            <ol>
              {CURR[n]
                .filter((c) => !c.soon)
                .map((ch) => (
                  <ChapterRow key={ch.id} n={n} ch={ch} />
                ))}
            </ol>
          </section>
        </div>
        <aside className="min-w-0 space-y-10">
          <Totals n={n} />
          <RecentTests />
        </aside>
      </div>
    </Container>
  );
}
