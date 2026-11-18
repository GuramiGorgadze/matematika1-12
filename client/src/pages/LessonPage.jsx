import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, Info, ListChecks } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Breadcrumbs } from "@/components/layout/Container";
import { Button } from "@/components/ui/button";
import { Callout, Progress } from "@/components/ui/misc";
import { findChapter, lessonNo, problemsOf, renderMath, testable } from "@/content/index.js";
import { lessonStats, rememberLesson } from "@/features/book/book";
import { AnswerHelp } from "@/features/problems/AnswerTools";
import { ProblemCard } from "@/features/problems/ProblemCard";
import { useProgress } from "@/features/student/progress";
import { StudentGate } from "@/features/student/registration";
import { cn } from "@/lib/cn";
import { ord } from "@/lib/format";
import NotFoundPage from "./NotFoundPage";

const smooth = () => (matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth");

/** hairline under the header that fills as you read */
function ReadingProgress({ target }) {
  const [p, setP] = useState(0);
  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      const el = target.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const total = Math.max(1, r.height - window.innerHeight * 0.5);
      setP(Math.min(1, Math.max(0, (window.innerHeight * 0.3 - r.top) / total)));
    };
    const onScroll = () => (raf ||= requestAnimationFrame(update));
    window.addEventListener("scroll", onScroll, { passive: true });
    update();
    return () => (window.removeEventListener("scroll", onScroll), cancelAnimationFrame(raf));
  }, [target]);
  return (
    <div className="pointer-events-none fixed inset-x-0 top-[var(--header-height)] z-30 h-[2px]" aria-hidden="true">
      <div className="h-full origin-left bg-accent transition-transform duration-150" style={{ transform: `scaleX(${p})` }} />
    </div>
  );
}

/** section headings of the lesson (h4), with the one being read highlighted */
function useSections(articleRef, html) {
  const [items, setItems] = useState([]);
  const [active, setActive] = useState(null);
  useEffect(() => {
    const el = articleRef.current;
    if (!el) return;
    const hs = [...el.querySelectorAll("h4")];
    hs.forEach((h, i) => (h.id ||= `sec-${i + 1}`));
    setItems(hs.map((h) => ({ id: h.id, title: h.textContent.trim() })));
    if (!hs.length) return;
    const io = new IntersectionObserver(
      (entries) => {
        const vis = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (vis[0]) setActive(vis[0].target.id);
      },
      { rootMargin: "-15% 0px -70% 0px" },
    );
    hs.forEach((h) => io.observe(h));
    return () => io.disconnect();
  }, [articleRef, html]);
  return { items, active };
}

function Rail({ n, ch, lesson, sections }) {
  const progress = useProgress();
  const st = lessonStats(progress, lesson.id);
  return (
    <nav aria-label="ამ გვერდზე" className="sticky top-[calc(var(--header-height)+2.5rem)] space-y-8">
      {sections.items.length > 0 && (
        <div>
          <p className="eyebrow text-subtle-foreground">ამ გვერდზე</p>
          <ol className="mt-3 border-l border-border">
            {sections.items.map((s) => (
              <li key={s.id}>
                <a
                  href={`#${s.id}`}
                  className={cn(
                    "-ml-px block border-l-2 py-1.5 pl-3.5 text-[0.8125rem] leading-snug transition-colors",
                    sections.active === s.id ? "border-accent font-semibold text-foreground" : "border-transparent text-muted-foreground hover:text-foreground",
                  )}
                >
                  {s.title}
                </a>
              </li>
            ))}
            {st.total > 0 && (
              <li>
                <a href="#probs" className="-ml-px block border-l-2 border-transparent py-1.5 pl-3.5 text-[0.8125rem] font-semibold text-accent hover:text-accent-hover">
                  სავარჯიშოები
                </a>
              </li>
            )}
          </ol>
        </div>
      )}
      {st.total > 0 && (
        <div>
          <div className="mb-1.5 flex justify-between text-xs text-subtle-foreground">
            <span>ამოხსნილი</span>
            <span className="num">
              {st.solved} / {st.total}
            </span>
          </div>
          <Progress value={st.solved} max={st.total} className="h-1" barClassName="bg-success" label="ამოხსნილი ამოცანები" />
        </div>
      )}
      {testable(ch) && (
        <Link to={`/grade/${n}/${ch.id}/test`} className="flex items-center gap-2 border-t border-border pt-4 text-sm font-semibold text-accent hover:text-accent-hover">
          <ListChecks className="size-4" aria-hidden="true" /> თავის შემაჯამებელი ტესტი
        </Link>
      )}
    </nav>
  );
}

function Problems({ lesson }) {
  const list = problemsOf(lesson.id);
  const progress = useProgress();
  const st = lessonStats(progress, lesson.id);
  const counts = [0, 0, 0, 0];
  list.forEach((p) => counts[p.l]++);
  if (!list.length) return null;
  return (
    <section id="probs" className="mt-20 scroll-mt-24" aria-labelledby="probs-h">
      <div className="rule-double pt-8">
        <p className="eyebrow text-accent">სავარჯიშოები</p>
        <div className="mt-2 flex flex-wrap items-end justify-between gap-x-8 gap-y-4">
          <h2 id="probs-h" className="text-[2rem] leading-tight">
            ამოცანები
          </h2>
          <div className="w-full max-w-56">
            <div className="mb-1.5 flex justify-between text-xs text-subtle-foreground">
              <span>ამოხსნილი</span>
              <span className="num font-semibold text-foreground">
                {st.solved} / {list.length}
              </span>
            </div>
            <Progress value={st.solved} max={list.length} className="h-1" barClassName="bg-success" label="ამოხსნილი ამოცანები" />
          </div>
        </div>
        <p className="mt-4 max-w-2xl font-serif leading-relaxed text-muted-foreground">
          ამოხსენი რვეულში, ჩაწერე პასუხი ხაზზე და დააჭირე „შემოწმებას“. ამოხსნის ნახვა ნებისმიერ დროს შეგიძლია — მაგრამ ჯერ სცადე.
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-subtle-foreground">
          <span>ძირითადი · {counts[1]}</span>
          <span>საშუალო · {counts[2]}</span>
          <span>რთული · {counts[3]}</span>
          <AnswerHelp className="basis-full sm:basis-auto" />
        </div>
      </div>
      <ol className="mt-6 border-b border-border">
        {list.map((p, i) => (
          <ProblemCard key={p.id} p={p} index={i} />
        ))}
      </ol>
    </section>
  );
}

function Pager({ n, ch, idx }) {
  const prev = idx > 1 ? ch.lessons[idx - 2] : null;
  const next = idx < ch.lessons.length ? ch.lessons[idx] : null;
  const toTest = !next && testable(ch);
  return (
    <nav className="mt-16 grid grid-cols-1 gap-4 border-t-[1.5px] border-rule-ink pt-6 sm:grid-cols-2" aria-label="გაკვეთილებს შორის გადასვლა">
      <Link to={prev ? `/grade/${n}/${ch.id}/${idx - 1}` : `/grade/${n}/${ch.id}`} className="group flex flex-col gap-1">
        <span className="inline-flex items-center gap-1.5 text-xs text-subtle-foreground">
          <ArrowLeft className="size-3.5" aria-hidden="true" /> {prev ? `წინა · ${lessonNo(ch, idx - 2)}` : "თავის დასაწყისი"}
        </span>
        <span className="font-serif text-lg font-semibold leading-snug transition-colors group-hover:text-accent">{prev ? prev.title : `თავი ${ch.no}. ${ch.title}`}</span>
      </Link>
      <Link
        to={next ? `/grade/${n}/${ch.id}/${idx + 1}` : toTest ? `/grade/${n}/${ch.id}/test` : `/grade/${n}`}
        className={cn("group flex flex-col items-end gap-1 text-right", toTest && "rounded-md bg-accent-soft/60 px-4 py-3")}
      >
        <span className={cn("inline-flex items-center gap-1.5 text-xs", toTest ? "font-semibold text-accent-soft-foreground" : "text-subtle-foreground")}>
          {next ? `შემდეგი · ${lessonNo(ch, idx)}` : toTest ? "თავი დასრულდა" : "სარჩევი"} <ArrowRight className="size-3.5" aria-hidden="true" />
        </span>
        <span className="font-serif text-lg font-semibold leading-snug transition-colors group-hover:text-accent">{next ? next.title : toTest ? "შემაჯამებელი ტესტი" : `${ord(n)} კლასი`}</span>
      </Link>
    </nav>
  );
}

function LessonView({ n, ch, idx }) {
  const l = ch.lessons[idx - 1];
  const no = lessonNo(ch, idx - 1);
  const articleRef = useRef(null);
  const html = useMemo(() => renderMath(l.html), [l.html]);
  const sections = useSections(articleRef, html);
  const hasProofs = /class="proof"/.test(l.html);
  const problemCount = problemsOf(l.id).length;
  const [proofsOpen, setProofsOpen] = useState(false);
  const [showTop, setShowTop] = useState(false);

  useEffect(() => {
    document.title = `${no} ${l.title} · მათემატიკა`;
    rememberLesson({ lessonId: l.id });
  }, [no, l.title, l.id]);
  useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > 900);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const toggleProofs = () => {
    const open = !proofsOpen;
    articleRef.current?.querySelectorAll("details.proof").forEach((d) => (d.open = open));
    setProofsOpen(open);
  };

  return (
    <>
      <ReadingProgress target={articleRef} />
      <div className="px-4 py-10 sm:px-8 lg:px-12 xl:px-16">
        <div className="mx-auto grid grid-cols-1 max-w-[68rem] gap-14 xl:grid-cols-[minmax(0,var(--measure))_var(--rail-width)] xl:justify-between">
          <div className="min-w-0">
            <Breadcrumbs items={[{ label: `${ord(n)} კლასი`, to: `/grade/${n}` }, { label: `თავი ${ch.no}`, to: `/grade/${n}/${ch.id}` }, { label: `§ ${no}` }]} />

            <header className="mt-8 border-b border-border pb-8">
              <p className="eyebrow flex items-center gap-2 text-accent">
                <span className="num font-display text-[1.0625rem] normal-case tracking-normal">§ {no}</span>
                <span className="text-subtle-foreground">· თავი {ch.no}</span>
              </p>
              <h1 className="mt-3 text-[1.875rem] leading-[1.16] sm:text-[2.625rem]">{l.title}</h1>
              <div className="mt-6 flex flex-wrap items-center gap-2">
                {problemCount > 0 && (
                  <Button variant="secondary" size="sm" onClick={() => document.getElementById("probs")?.scrollIntoView({ behavior: smooth() })}>
                    {problemCount} ამოცანა <ArrowDown />
                  </Button>
                )}
                {hasProofs && (
                  <Button variant="ghost" size="sm" onClick={toggleProofs} aria-pressed={proofsOpen}>
                    {proofsOpen ? "დამტკიცებების დახურვა" : "ყველა დამტკიცების გახსნა"}
                  </Button>
                )}
              </div>
            </header>

            {(ch.placeholder || l.placeholder) && (
              <Callout icon={Info} tone="neutral" className="mt-8">
                ეს გაკვეთილი ზოგადი ნიმუშია: მოკლე წესი, მაგალითი და სავარჯიშოები. სრული მასალა მოგვიანებით დაემატება.
              </Callout>
            )}

            <div className="mx mt-10">
              <article ref={articleRef} className="sec lesson-body" dangerouslySetInnerHTML={{ __html: html }} />
            </div>

            <Problems lesson={l} />
            <Pager n={n} ch={ch} idx={idx} />
          </div>

          <aside aria-label="გაკვეთილის ნავიგაცია" className="hidden xl:block">
            <Rail n={n} ch={ch} lesson={l} sections={sections} />
          </aside>
        </div>
      </div>
      <button
        type="button"
        onClick={() => window.scrollTo({ top: 0, behavior: smooth() })}
        aria-label="გვერდის დასაწყისში დაბრუნება"
        className={cn(
          "fixed bottom-5 right-5 z-30 grid size-12 place-items-center rounded-full border border-border-strong bg-surface text-foreground shadow-md transition-[opacity,transform,color] duration-200 hover:text-accent",
          showTop ? "opacity-100" : "pointer-events-none translate-y-3 opacity-0",
        )}
      >
        <ArrowUp className="size-5" />
      </button>
    </>
  );
}

export default function LessonPage() {
  const { n: ns, chapterId, lesson } = useParams();
  const n = Number(ns);
  const idx = Number(lesson);
  const ch = n >= 1 && n <= 12 ? findChapter(n, chapterId) : null;
  if (!ch || !(idx >= 1 && idx <= ch.lessons.length)) return <NotFoundPage />;
  return (
    <StudentGate>
      <LessonView key={`${n}/${chapterId}/${idx}`} n={n} ch={ch} idx={idx} />
    </StudentGate>
  );
}
