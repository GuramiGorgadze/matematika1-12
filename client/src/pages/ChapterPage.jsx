import { ArrowLeft, ArrowRight, Check, Info, ListChecks } from "lucide-react";
import { useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { Breadcrumbs } from "@/components/layout/Container";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Callout } from "@/components/ui/misc";
import { chapterNo, CURR, findChapter, lessonNo, testable } from "@/content/index.js";
import { TOOLS } from "@/content/grades";
import { CHAPTER_TEST_SIZES } from "@/content/tests";
import { lessonStats, TOOL_ICONS } from "@/features/book/book";
import { useProgress } from "@/features/student/progress";
import { useSession } from "@/features/student/session";
import { bestOf, chapterTestKey, useTestRecord } from "@/features/tests/storage";
import { ord } from "@/lib/format";
import NotFoundPage from "./NotFoundPage";

function TestSlip({ n, ch }) {
  const rec = useTestRecord(chapterTestKey(n, ch.id));
  const best = bestOf(rec.hist);
  return (
    <section aria-labelledby="ct-h" className="rounded-[var(--panel-radius)] border border-border bg-surface shadow-sm">
      <div className="flex items-center gap-2.5 border-b border-border px-5 py-4">
        <ListChecks className="size-5 text-accent" aria-hidden="true" />
        <h2 id="ct-h" className="font-serif text-lg font-semibold">
          შემაჯამებელი ტესტი
        </h2>
      </div>
      <div className="p-5">
        <p className="text-sm leading-relaxed text-muted-foreground">შემოსახაზი და ჩასაწერი ამოცანები დროის ლიმიტით. ყოველ ცდაზე — ახალი ნაკრები.</p>
        <table className="book-table mt-4 text-sm">
          <thead>
            <tr>
              <th className="eyebrow py-2 text-left font-semibold text-muted-foreground">ამოცანა</th>
              <th className="eyebrow py-2 text-right font-semibold text-muted-foreground">დრო</th>
            </tr>
          </thead>
          <tbody>
            {CHAPTER_TEST_SIZES.map((s) => (
              <tr key={s.n}>
                <td className="num py-2">{s.n}</td>
                <td className="num py-2 text-right">{s.min} წთ</td>
              </tr>
            ))}
          </tbody>
        </table>
        {best && (
          <p className="mt-4 flex items-center justify-between text-sm">
            <span className="text-muted-foreground">საუკეთესო შედეგი</span>
            <span className="num font-semibold">
              {best.score} / {best.max} · {Math.round(best.pct * 100)}%
            </span>
          </p>
        )}
        {rec.run && (
          <Badge variant="warning" className="mt-4">
            ტესტი დაწყებულია
          </Badge>
        )}
        <ButtonLink to={`/grade/${n}/${ch.id}/test`} variant="accent" className="mt-5 w-full">
          {rec.run ? "ტესტის გაგრძელება" : "ტესტის დაწყება"} <ArrowRight aria-hidden="true" />
        </ButtonLink>
      </div>
    </section>
  );
}

function LessonRow({ n, ch, l, i }) {
  const progress = useProgress();
  const { student } = useSession();
  const st = lessonStats(progress, l.id);
  return (
    <li className="border-t border-border">
      <Link to={`/grade/${n}/${ch.id}/${i + 1}`} className="group grid grid-cols-[3.25rem_minmax(0,1fr)_auto] items-baseline gap-x-4 py-5">
        <span className="num font-display text-2xl font-medium text-subtle-foreground transition-colors group-hover:text-accent">{lessonNo(ch, i)}</span>
        <span className="min-w-0">
          <span className="block font-serif text-[1.25rem] font-semibold leading-snug transition-colors group-hover:text-accent">{l.title}</span>
          <span className="mt-1 block text-sm text-subtle-foreground">{st.total} ამოცანა</span>
        </span>
        <span className="text-right text-xs">
          {st.done ? (
            <span className="inline-flex items-center gap-1 font-semibold text-success-foreground">
              <Check className="size-4" aria-hidden="true" /> დასრულდა
            </span>
          ) : student && st.solved ? (
            <span className="num text-muted-foreground">
              {st.solved} / {st.total}
            </span>
          ) : (
            <ArrowRight className="size-4 text-subtle-foreground transition-[transform,color] group-hover:translate-x-0.5 group-hover:text-accent" aria-hidden="true" />
          )}
        </span>
      </Link>
    </li>
  );
}

function ChapterView({ n, ch }) {
  useEffect(() => {
    document.title = `თავი ${ch.no}. ${ch.title} · მათემატიკა`;
  }, [ch]);
  const list = CURR[n].filter((c) => !c.soon);
  const at = list.findIndex((c) => c.id === ch.id);
  const prev = list[at - 1];
  const next = list[at + 1];

  return (
    <div className="px-4 py-10 sm:px-8 lg:px-12 xl:px-16">
      <div className="mx-auto max-w-5xl">
        <Breadcrumbs items={[{ label: `${ord(n)} კლასი`, to: `/grade/${n}` }, { label: `თავი ${ch.no}` }]} />

        {/* chapter opener */}
        <header className="rule-double mt-8 grid grid-cols-1 gap-x-10 pt-10 md:grid-cols-[auto_minmax(0,1fr)]">
          <span className="num font-display text-[6.5rem] font-medium leading-[0.8] text-accent md:text-[8rem]" aria-hidden="true">
            {chapterNo(ch)}
          </span>
          <div className="mt-6 min-w-0 md:mt-0">
            <p className="eyebrow flex flex-wrap items-center gap-2 text-subtle-foreground">
              თავი {ch.no}
              {ch.placeholder && (
                <Badge variant="outline" size="sm">
                  ნიმუში
                </Badge>
              )}
            </p>
            <h1 className="mt-2 text-[1.875rem] leading-[1.14] sm:text-[2.875rem]">{ch.title}</h1>
            {ch.intro && (
              <p className="mt-6 max-w-[42rem] font-serif text-[1.1875rem] leading-relaxed text-muted-foreground first-letter:float-left first-letter:mr-2.5 first-letter:mt-1 first-letter:font-serif first-letter:text-[3.5rem] first-letter:font-semibold first-letter:leading-[0.85] first-letter:text-accent">
                {ch.intro}
              </p>
            )}
          </div>
        </header>

        {ch.placeholder && (
          <Callout icon={Info} tone="neutral" className="mt-10">
            ეს თავი ზოგადი ნიმუშის მასალაა: ძირითადი წესები, მაგალითები და ავტომატურად შემოწმებადი ამოცანები.
          </Callout>
        )}

        <div className="mt-12 grid grid-cols-1 gap-12 xl:grid-cols-[minmax(0,1fr)_18.5rem] xl:gap-14">
          <div className="min-w-0 space-y-10">
            {ch.groups.map((g, gi) => (
              <section key={gi} aria-labelledby={`g-${gi}`}>
                <h2 id={`g-${gi}`} className="eyebrow text-accent">
                  {ch.groups.length > 1 ? g.t : "ამ თავში"}
                </h2>
                <ol className="mt-2 border-b border-border">
                  {ch.lessons.slice(g.from - 1, g.to).map((l, k) => (
                    <LessonRow key={l.id} n={n} ch={ch} l={l} i={g.from - 1 + k} />
                  ))}
                </ol>
              </section>
            ))}
          </div>

          <aside aria-label="თავის ტესტი და დაფები" className="space-y-8 xl:sticky xl:top-[calc(var(--header-height)+2rem)] xl:self-start">
            {testable(ch) && <TestSlip n={n} ch={ch} />}
            {ch.tools?.length > 0 && (
              <section aria-labelledby="ct-tools">
                <h2 id="ct-tools" className="eyebrow text-subtle-foreground">
                  ამ თავის დაფები
                </h2>
                <ul className="mt-3 divide-y divide-border border-y border-border">
                  {ch.tools.map((k) => {
                    const t = TOOLS[k];
                    const Icon = TOOL_ICONS[t.icon];
                    return (
                      <li key={k}>
                        <Link to={`/grade/${n}/tools/${k}`} className="group flex items-center gap-3 py-3 text-sm font-semibold transition-colors hover:text-accent">
                          <Icon className="size-4 text-accent" aria-hidden="true" /> {t.title}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </section>
            )}
          </aside>
        </div>

        <nav className="mt-16 grid grid-cols-2 gap-4 border-t border-border pt-6" aria-label="თავებს შორის გადასვლა">
          {prev ? (
            <Link to={`/grade/${n}/${prev.id}`} className="group flex flex-col gap-1">
              <span className="inline-flex items-center gap-1.5 text-xs text-subtle-foreground">
                <ArrowLeft className="size-3.5" aria-hidden="true" /> თავი {prev.no}
              </span>
              <span className="font-serif text-lg font-semibold group-hover:text-accent">{prev.title}</span>
            </Link>
          ) : (
            <Link to={`/grade/${n}`} className="group flex flex-col gap-1">
              <span className="inline-flex items-center gap-1.5 text-xs text-subtle-foreground">
                <ArrowLeft className="size-3.5" aria-hidden="true" /> სარჩევი
              </span>
              <span className="font-serif text-lg font-semibold group-hover:text-accent">{ord(n)} კლასი</span>
            </Link>
          )}
          {next && (
            <Link to={`/grade/${n}/${next.id}`} className="group flex flex-col items-end gap-1 text-right">
              <span className="inline-flex items-center gap-1.5 text-xs text-subtle-foreground">
                თავი {next.no} <ArrowRight className="size-3.5" aria-hidden="true" />
              </span>
              <span className="font-serif text-lg font-semibold group-hover:text-accent">{next.title}</span>
            </Link>
          )}
        </nav>
      </div>
    </div>
  );
}

export default function ChapterPage() {
  const { n: ns, chapterId } = useParams();
  const n = Number(ns);
  const ch = n >= 1 && n <= 12 ? findChapter(n, chapterId) : null;
  if (!ch) return <NotFoundPage />;
  return <ChapterView n={n} ch={ch} />;
}
