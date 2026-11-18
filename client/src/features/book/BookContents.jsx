import { Check, ChevronDown, ChevronsUpDown, ListChecks, Trophy } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, NavLink, useNavigate, useParams } from "react-router-dom";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Progress } from "@/components/ui/misc";
import { chapterNo, CURR, lessonNo, testable } from "@/content/index.js";
import { GRADE_TOOLS, TOOLS } from "@/content/grades";
import { useProgress } from "@/features/student/progress";
import { useSession } from "@/features/student/session";
import { bestOf, chapterTestKey, useTestRecord } from "@/features/tests/storage";
import { cn } from "@/lib/cn";
import { ord, STAGE_STYLES, STAGES, stageName, stageOf, thousands } from "@/lib/format";
import { lessonStats, TOOL_ICONS, useSolved } from "./book";

function GradeSwitcher({ n }) {
  const navigate = useNavigate();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="-mr-1.5 grid size-9 place-items-center rounded-md text-subtle-foreground transition-colors hover:bg-surface-3 hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring"
        aria-label="სხვა კლასის არჩევა"
      >
        <ChevronsUpDown className="size-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="max-h-[70dvh] min-w-52 overflow-y-auto">
        {STAGES.map((s, i) => (
          <div key={s.key}>
            {i > 0 && <DropdownMenuSeparator />}
            <DropdownMenuLabel className="eyebrow text-subtle-foreground">{s.title}</DropdownMenuLabel>
            {Array.from({ length: s.to - s.from + 1 }, (_, k) => s.from + k).map((g) => (
              <DropdownMenuItem key={g} onSelect={() => navigate(`/grade/${g}`)} className={cn(g === n && "font-semibold text-foreground")}>
                <span className={cn("num w-6 font-display text-base", STAGE_STYLES[s.key].text)}>{g}</span>
                {ord(g)} კლასი
                {g === n && <Check className="ml-auto !text-accent" aria-label="არჩეულია" />}
              </DropdownMenuItem>
            ))}
          </div>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function TestLink({ n, ch, onNavigate }) {
  const rec = useTestRecord(chapterTestKey(n, ch.id));
  const best = bestOf(rec.hist);
  return (
    <NavLink
      to={`/grade/${n}/${ch.id}/test`}
      onClick={onNavigate}
      className={({ isActive }) =>
        cn(
          "relative -ml-px flex items-center gap-2 border-l-2 py-1.5 pl-3 pr-2 text-[0.8125rem] font-semibold leading-snug transition-colors",
          isActive ? "border-accent text-foreground" : "border-transparent text-accent hover:text-accent-hover",
        )
      }
    >
      <ListChecks className="size-3.5 shrink-0" aria-hidden="true" />
      <span className="flex-1">შემაჯამებელი ტესტი</span>
      {rec.run ? (
        <span className="text-[0.6875rem] font-semibold text-warning">მიმდინარე</span>
      ) : (
        best && <span className="num text-[0.6875rem] text-subtle-foreground">{Math.round(best.pct * 100)}%</span>
      )}
    </NavLink>
  );
}

function ChapterEntry({ n, ch, active, onNavigate }) {
  const progress = useProgress();
  const [open, setOpen] = useState(active);
  useEffect(() => {
    if (active) setOpen(true);
  }, [active]);
  const listId = `toc-${ch.id}`;
  return (
    <li className="py-0.5">
      <div className="flex items-start gap-0.5">
        <Link
          to={`/grade/${n}/${ch.id}`}
          onClick={onNavigate}
          aria-current={active ? "true" : undefined}
          className={cn("flex min-w-0 flex-1 gap-3 rounded-md px-2 py-2 transition-colors hover:bg-surface-3", active ? "text-foreground" : "text-muted-foreground hover:text-foreground")}
        >
          <span className={cn("num w-5 shrink-0 text-right font-display text-[1.0625rem] leading-[1.35rem]", active ? "text-accent" : "text-subtle-foreground")}>{chapterNo(ch)}</span>
          <span className={cn("text-[0.875rem] leading-snug", active ? "font-semibold" : "font-medium")}>{ch.title}</span>
        </Link>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-controls={listId}
          aria-label={open ? "გაკვეთილების დამალვა" : "გაკვეთილების ჩვენება"}
          className="mt-1 grid size-8 shrink-0 place-items-center rounded-md text-subtle-foreground transition-colors hover:bg-surface-3 hover:text-foreground"
        >
          <ChevronDown className={cn("size-4 transition-transform duration-200", open && "rotate-180")} aria-hidden="true" />
        </button>
      </div>
      {open && (
        <ol id={listId} className="mb-2 ml-[1.9rem] mt-0.5 border-l border-border">
          {ch.lessons.map((l, i) => {
            const st = lessonStats(progress, l.id);
            return (
              <li key={l.id}>
                <NavLink
                  to={`/grade/${n}/${ch.id}/${i + 1}`}
                  onClick={onNavigate}
                  className={({ isActive }) =>
                    cn(
                      "relative -ml-px flex gap-2 border-l-2 py-1.5 pl-3 pr-2 text-[0.8125rem] leading-snug transition-colors",
                      isActive ? "border-accent font-semibold text-foreground" : "border-transparent text-muted-foreground hover:border-border-strong hover:text-foreground",
                    )
                  }
                >
                  <span className="num shrink-0 text-subtle-foreground">{lessonNo(ch, i)}</span>
                  <span className="flex-1">{l.title}</span>
                  {st.done && <Check className="mt-0.5 size-3.5 shrink-0 text-success" aria-label="დასრულებულია" />}
                </NavLink>
              </li>
            );
          })}
          {testable(ch) && (
            <li>
              <TestLink n={n} ch={ch} onNavigate={onNavigate} />
            </li>
          )}
        </ol>
      )}
    </li>
  );
}

/** The grade's table of contents: chapters → lessons → chapter test, then the boards. */
export function BookContents({ n, onNavigate }) {
  const { chapterId } = useParams();
  const { student } = useSession();
  const chapters = CURR[n] || [];
  const { solved, total } = useSolved(chapters.flatMap((c) => (c.soon ? [] : c.lessons.map((l) => l.id))));
  const tools = GRADE_TOOLS[n] || [];
  const stage = stageOf(n);
  return (
    <nav aria-label={`${ord(n)} კლასის სარჩევი`} className="flex min-h-full flex-col">
      <div className="border-b border-border px-5 pb-5 pt-6">
        <p className={cn("eyebrow", STAGE_STYLES[stage].text)}>{stageName(n)} საფეხური</p>
        <div className="mt-1.5 flex items-center justify-between gap-2">
          <Link to={`/grade/${n}`} onClick={onNavigate} className="font-serif text-[1.375rem] font-semibold leading-tight hover:text-accent">
            {ord(n)} კლასი
          </Link>
          <GradeSwitcher n={n} />
        </div>
        {student && total > 0 && (
          <div className="mt-4">
            <div className="mb-1.5 flex justify-between text-xs text-subtle-foreground">
              <span>ამოხსნილი ამოცანები</span>
              <span className="num">
                {thousands(solved)} / {thousands(total)}
              </span>
            </div>
            <Progress value={solved} max={total} className="h-1 bg-surface-3" barClassName="bg-success" label="ამოხსნილი ამოცანები" />
          </div>
        )}
      </div>

      <div className="flex-1 px-3 py-4">
        <p className="eyebrow mb-2 px-2 text-subtle-foreground">სარჩევი</p>
        <ol>
          {chapters.map((ch) => (
            <ChapterEntry key={ch.id} n={n} ch={ch} active={ch.id === chapterId} onNavigate={onNavigate} />
          ))}
        </ol>

        {n === 12 && (
          <>
            <p className="eyebrow mb-1 mt-6 px-2 text-subtle-foreground">გამოცდები</p>
            <Link
              to="/grade/12#exams"
              onClick={onNavigate}
              className="flex items-center gap-3 rounded-md px-2 py-2 text-[0.875rem] font-medium text-muted-foreground hover:bg-surface-3 hover:text-foreground"
            >
              <Trophy className="size-4 text-stage-3" aria-hidden="true" /> ეროვნული და სავარჯიშო ტესტები
            </Link>
          </>
        )}

        {tools.length > 0 && (
          <>
            <p className="eyebrow mb-1 mt-6 px-2 text-subtle-foreground">დაფები</p>
            <ul>
              {tools.map((k) => {
                const Icon = TOOL_ICONS[TOOLS[k].icon];
                return (
                  <li key={k}>
                    <NavLink
                      to={`/grade/${n}/tools/${k}`}
                      onClick={onNavigate}
                      className={({ isActive }) =>
                        cn(
                          "flex items-center gap-3 rounded-md px-2 py-2 text-[0.875rem] transition-colors",
                          isActive ? "bg-surface-3 font-semibold text-foreground" : "font-medium text-muted-foreground hover:bg-surface-3 hover:text-foreground",
                        )
                      }
                    >
                      <Icon className="size-4 shrink-0 text-subtle-foreground" aria-hidden="true" />
                      {TOOLS[k].title}
                    </NavLink>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </div>
    </nav>
  );
}
