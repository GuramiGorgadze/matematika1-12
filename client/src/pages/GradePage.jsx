import { ArrowLeft, ArrowRight, Check, Clock3, Info } from "lucide-react";
import { useEffect } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { Breadcrumbs } from "@/components/layout/Container";
import { Badge } from "@/components/ui/badge";
import { Callout, Progress, Skeleton } from "@/components/ui/misc";
import { chapterNo, chapterProblemCount, CURR, lessonNo, testable } from "@/content/index.js";
import { GRADE_TOOLS, gradeMeta, TOOLS } from "@/content/grades";
import { EXAM_GROUPS, useExams } from "@/content/useExams";
import { lessonStats, TOOL_ICONS, useSolved } from "@/features/book/book";
import { useProgress } from "@/features/student/progress";
import { useSession } from "@/features/student/session";
import { bestOf, chapterTestKey, examKey, useTestRecord } from "@/features/tests/storage";
import { cn } from "@/lib/cn";
import { ord, STAGE_STYLES, stageName, stageOf, thousands } from "@/lib/format";
import NotFoundPage from "./NotFoundPage";

/* ---------- one chapter in the table of contents ---------- */
function TestRow({ n, ch }) {
  const rec = useTestRecord(chapterTestKey(n, ch.id));
  const best = bestOf(rec.hist);
  return (
    <li>
      <Link to={`/grade/${n}/${ch.id}/test`} className="group flex items-baseline gap-3 rounded-sm py-1.5 text-accent hover:text-accent-hover">
        <span className="w-9 shrink-0" aria-hidden="true" />
        <span className="min-w-0 flex-1 text-[0.9375rem] font-semibold sm:flex-none">შემაჯამებელი ტესტი</span>
        <span className="leader hidden sm:block" aria-hidden="true" />
        <span className="num whitespace-nowrap text-xs font-semibold">{rec.run ? <span className="text-warning">მიმდინარე</span> : best ? `საუკეთესო ${Math.round(best.pct * 100)}%` : "დროით"}</span>
      </Link>
    </li>
  );
}

function ChapterEntry({ n, ch }) {
  const progress = useProgress();
  const { student } = useSession();
  return (
    <li className="grid grid-cols-1 gap-x-6 border-t border-border py-9 sm:grid-cols-[4.5rem_minmax(0,1fr)]">
      <span className="num font-display text-5xl font-medium leading-none text-accent sm:text-right sm:text-6xl" aria-hidden="true">
        {chapterNo(ch)}
      </span>
      <div className="mt-3 min-w-0 sm:mt-0">
        <p className="eyebrow flex flex-wrap items-center gap-2 text-subtle-foreground">
          თავი {ch.no}
          {ch.placeholder && (
            <Badge variant="outline" size="sm">
              ნიმუში
            </Badge>
          )}
        </p>
        <h3 className="mt-1.5 text-[1.5rem] leading-snug">
          <Link to={`/grade/${n}/${ch.id}`} className="transition-colors hover:text-accent">
            {ch.title}
          </Link>
        </h3>
        {ch.short && <p className="mt-2 max-w-2xl font-serif leading-relaxed text-muted-foreground">{ch.short}</p>}
        <ol className="mt-5">
          {ch.lessons.map((l, i) => {
            const st = lessonStats(progress, l.id);
            return (
              <li key={l.id}>
                <Link to={`/grade/${n}/${ch.id}/${i + 1}`} className="group flex items-baseline gap-3 rounded-sm py-1.5">
                  <span className="num w-9 shrink-0 text-sm text-subtle-foreground">{lessonNo(ch, i)}</span>
                  <span className="min-w-0 flex-1 font-serif text-[1.0625rem] transition-colors group-hover:text-accent sm:flex-none">{l.title}</span>
                  <span className="leader hidden sm:block" aria-hidden="true" />
                  <span className="num whitespace-nowrap text-xs text-subtle-foreground">
                    {st.done ? (
                      <span className="inline-flex items-center gap-1 font-semibold text-success-foreground">
                        <Check className="size-3.5" aria-hidden="true" /> დასრულდა
                      </span>
                    ) : student && st.solved ? (
                      `${st.solved} / ${st.total}`
                    ) : (
                      `${st.total} ამოცანა`
                    )}
                  </span>
                </Link>
              </li>
            );
          })}
          {testable(ch) && <TestRow n={n} ch={ch} />}
        </ol>
      </div>
    </li>
  );
}

/* ---------- grade 12: national and practice exams ---------- */
function ExamRow({ ex }) {
  const rec = useTestRecord(examKey(ex.id));
  const best = bestOf(rec.hist);
  const max = ex.items.reduce((s, it) => s + it.p, 0);
  return (
    <li className="border-b border-border">
      <Link to={`/grade/12/exam/${ex.id}`} className="group -mx-2 flex flex-wrap items-center gap-x-5 gap-y-1 rounded-md px-2 py-3.5 transition-colors hover:bg-surface-2/70">
        <span className="num w-14 font-display text-2xl font-medium text-stage-3">{ex.year}</span>
        <span className="min-w-0 flex-1 font-serif text-[1.0625rem] font-semibold transition-colors group-hover:text-accent">{ex.title}</span>
        <span className="flex items-center gap-4 text-xs text-subtle-foreground">
          <span className="num">
            {ex.items.length} ამოცანა · {max} ქულა
          </span>
          <span className="num inline-flex items-center gap-1">
            <Clock3 className="size-3.5" aria-hidden="true" /> {ex.min / 60} სთ
          </span>
          {rec.run ? (
            <Badge variant="warning" size="sm">
              მიმდინარე
            </Badge>
          ) : best ? (
            <Badge variant="success" size="sm">
              {best.score} / {best.max}
            </Badge>
          ) : null}
        </span>
      </Link>
    </li>
  );
}

function ExamHub() {
  const m = useExams();
  return (
    <section id="exams" aria-labelledby="exams-h" className="scroll-mt-24 border-t-[1.5px] border-rule-ink pt-8">
      <p className="eyebrow text-accent">გამოცდები</p>
      <h2 id="exams-h" className="mt-2 text-[1.75rem]">
        ონლაინ ტესტები
      </h2>
      <p className="mt-2 max-w-2xl font-serif leading-relaxed text-muted-foreground">დროის ათვლით, ავტომატური შემოწმებით და დეტალური შედეგით — ისე, როგორც გამოცდაზე.</p>
      <div className="mt-8 grid grid-cols-1 gap-10 xl:grid-cols-2">
        {EXAM_GROUPS.map((g) => (
          <div key={g.key}>
            <h3 className="text-lg">{g.title}</h3>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{g.desc}</p>
            {m ? (
              <ul className="mt-3 border-t border-border">
                {m.EXAMS.filter((e) => e.grp === g.key).map((ex) => (
                  <ExamRow key={ex.id} ex={ex} />
                ))}
              </ul>
            ) : (
              <div className="mt-3 space-y-2">
                {Array.from({ length: 4 }, (_, i) => (
                  <Skeleton key={i} className="h-12" />
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

function GradeView({ n }) {
  const { student } = useSession();
  const { hash } = useLocation();
  const chapters = CURR[n];
  const st = STAGE_STYLES[stageOf(n)];
  const lessons = chapters.reduce((s, c) => s + (c.soon ? 0 : c.lessons.length), 0);
  const problems = chapters.reduce((s, c) => s + chapterProblemCount(c), 0);
  const { solved } = useSolved(chapters.flatMap((c) => (c.soon ? [] : c.lessons.map((l) => l.id))));
  const allPlaceholder = chapters.every((c) => c.placeholder);
  const tools = GRADE_TOOLS[n] || [];

  useEffect(() => {
    document.title = `${ord(n)} კლასი · მათემატიკა`;
  }, [n]);
  useEffect(() => {
    if (hash === "#exams") requestAnimationFrame(() => document.getElementById("exams")?.scrollIntoView());
  }, [hash]);

  return (
    <div className="px-4 py-10 sm:px-8 lg:px-12 xl:px-16">
      <div className="mx-auto max-w-5xl">
        <Breadcrumbs items={[{ label: "კლასები", to: "/grades" }, { label: `${ord(n)} კლასი` }]} />

        {/* the cover */}
        <header className="mt-8 grid grid-cols-1 gap-x-10 gap-y-6 border-b-[1.5px] border-rule-ink pb-10 sm:grid-cols-[auto_minmax(0,1fr)] sm:items-end">
          <span className={cn("num font-display text-[7.5rem] font-medium leading-[0.78] tracking-tight sm:text-[9.5rem]", st.text)} aria-hidden="true">
            {n}
          </span>
          <div className="min-w-0">
            <p className={cn("eyebrow", st.text)}>{stageName(n)} საფეხური</p>
            <h1 className="mt-2 text-[2.5rem] leading-tight sm:text-[3rem]">
              {ord(n)} კლასი
              {student?.grade === n && (
                <Badge variant="solid" className="ml-3 align-middle">
                  შენი კლასი
                </Badge>
              )}
            </h1>
            <p className="mt-2 font-serif text-[1.0625rem] leading-relaxed text-muted-foreground">{gradeMeta(n)?.topics.join(" · ")}</p>
            <div className="mt-6 flex flex-wrap gap-x-10 gap-y-4">
              <dl className="flex flex-wrap gap-x-10 gap-y-4">
                {[
                  [chapters.length, "თავი"],
                  [lessons, "გაკვეთილი"],
                  [problems, "ამოცანა"],
                ].map(([v, l]) => (
                  <div key={l} className="flex flex-col-reverse">
                    <dt className="mt-1 text-xs text-subtle-foreground">{l}</dt>
                    <dd className="num font-display text-[1.75rem] font-medium leading-none">{thousands(v)}</dd>
                  </div>
                ))}
              </dl>
              {student && (
                <div className="min-w-44 flex-1 self-end sm:max-w-60">
                  <div className="mb-1.5 flex justify-between text-xs text-subtle-foreground">
                    <span>ამოხსნილი</span>
                    <span className="num">{problems ? Math.round((100 * solved) / problems) : 0}%</span>
                  </div>
                  <Progress value={solved} max={problems || 1} className="h-1" barClassName="bg-success" label="ამოხსნილი ამოცანები" />
                </div>
              )}
            </div>
          </div>
        </header>

        {allPlaceholder && (
          <Callout icon={Info} tone="neutral" className="mt-8">
            ამ კლასის თემატური მასალა ჯერ ზოგადი ნიმუშია: მოკლე წესები, მაგალითები და ავტომატურად შემოწმებადი ამოცანები. სრული სახელმძღვანელოს მასალა მოგვიანებით დაემატება.
          </Callout>
        )}

        {n === 12 && (
          <div className="mt-12">
            <ExamHub />
          </div>
        )}

        {/* contents */}
        <section aria-labelledby="contents-h" className="mt-12">
          <h2 id="contents-h" className="eyebrow text-accent">
            სარჩევი
          </h2>
          <ol className="mt-2">
            {chapters.map((ch) => (
              <ChapterEntry key={ch.id} n={n} ch={ch} />
            ))}
          </ol>
        </section>

        {tools.length > 0 && (
          <section aria-labelledby="tools-h" className="border-t-[1.5px] border-rule-ink pt-8">
            <p className="eyebrow text-accent">დანართი</p>
            <h2 id="tools-h" className="mt-2 text-[1.75rem]">
              ინტერაქტიული დაფები
            </h2>
            <ul className="mt-6 grid grid-cols-1 gap-px overflow-hidden rounded-[var(--panel-radius)] border border-border bg-border sm:grid-cols-2">
              {tools.map((k) => {
                const t = TOOLS[k];
                const Icon = TOOL_ICONS[t.icon];
                return (
                  <li key={k} className="bg-surface">
                    <Link to={`/grade/${n}/tools/${k}`} className="group flex h-full gap-4 p-5 transition-colors hover:bg-surface-2/60">
                      <Icon className="mt-0.5 size-5 shrink-0 text-accent" aria-hidden="true" />
                      <span>
                        <span className="block font-serif text-[1.0625rem] font-semibold transition-colors group-hover:text-accent">{t.title}</span>
                        <span className="mt-1 block text-sm leading-relaxed text-muted-foreground">{t.desc}</span>
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        )}

        <nav className="mt-16 grid grid-cols-2 gap-4 border-t border-border pt-6" aria-label="კლასებს შორის გადასვლა">
          {n > 1 ? (
            <Link to={`/grade/${n - 1}`} className="group flex flex-col gap-1">
              <span className="inline-flex items-center gap-1.5 text-xs text-subtle-foreground">
                <ArrowLeft className="size-3.5" aria-hidden="true" /> წინა
              </span>
              <span className="font-serif text-lg font-semibold group-hover:text-accent">{ord(n - 1)} კლასი</span>
            </Link>
          ) : (
            <span />
          )}
          {n < 12 && (
            <Link to={`/grade/${n + 1}`} className="group flex flex-col items-end gap-1 text-right">
              <span className="inline-flex items-center gap-1.5 text-xs text-subtle-foreground">
                შემდეგი <ArrowRight className="size-3.5" aria-hidden="true" />
              </span>
              <span className="font-serif text-lg font-semibold group-hover:text-accent">{ord(n + 1)} კლასი</span>
            </Link>
          )}
        </nav>
      </div>
    </div>
  );
}

export default function GradePage() {
  const n = Number(useParams().n);
  if (!(n >= 1 && n <= 12)) return <NotFoundPage />;
  return <GradeView n={n} />;
}
