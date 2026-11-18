import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { GRADES, ORIGINAL_GRADES } from "@/content/grades";
import { cn } from "@/lib/cn";
import { ord, STAGE_STYLES, STAGES } from "@/lib/format";

function StageBlock({ stage, mine, level }) {
  const H = `h${level}`;
  const st = STAGE_STYLES[stage.key];
  const grades = GRADES.filter((g) => g.n >= stage.from && g.n <= stage.to);
  return (
    <section aria-labelledby={`stage-${stage.key}`}>
      <header className="flex items-center gap-3 border-b-[1.5px] border-rule-ink pb-2.5">
        <span className={cn("h-4 w-1.5 rounded-[1px]", st.fill)} aria-hidden="true" />
        <H id={`stage-${stage.key}`} className="font-serif text-lg font-semibold">
          {stage.title}
        </H>
        <span className="num ml-auto text-sm text-subtle-foreground">{stage.range}</span>
      </header>
      <ol>
        {grades.map((g) => (
          <li key={g.n} className="border-b border-border">
            <Link
              to={`/grade/${g.n}`}
              className="group -mx-2 flex items-start gap-4 rounded-md px-2 py-4 transition-colors hover:bg-surface-2/70 focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-ring"
            >
              <span className={cn("num w-11 shrink-0 text-right font-display text-[2.5rem] font-medium leading-[0.9]", st.text)}>{g.n}</span>
              <span className="min-w-0 flex-1">
                <span className="flex items-baseline gap-2">
                  <span className="font-serif text-[1.125rem] font-semibold transition-colors group-hover:text-accent">{ord(g.n)} კლასი</span>
                  {mine === g.n && (
                    <Badge variant="solid" size="sm" className="self-center">
                      შენი
                    </Badge>
                  )}
                  {g.n !== 12 && !ORIGINAL_GRADES.has(g.n) && (
                    <Badge variant="outline" size="sm" className="self-center" title="ზოგადი ნიმუშის მასალა">
                      ნიმუში
                    </Badge>
                  )}
                  <span className="leader hidden sm:block" aria-hidden="true" />
                  <span className="num hidden whitespace-nowrap text-xs text-subtle-foreground sm:inline">
                    {g.chapters} თავი · {g.lessons} გაკვეთილი
                  </span>
                </span>
                <span className="mt-1 block text-sm leading-relaxed text-muted-foreground">{g.topics.join(" · ")}</span>
                {g.n === 12 && (
                  <Badge variant="stage3" size="sm" className="mt-2">
                    ეროვნული გამოცდები
                  </Badge>
                )}
              </span>
              <ArrowRight className="mt-2 size-4 shrink-0 text-subtle-foreground transition-[transform,color] duration-200 group-hover:translate-x-0.5 group-hover:text-accent" aria-hidden="true" />
            </Link>
          </li>
        ))}
      </ol>
    </section>
  );
}

/** the series as a table of contents: stage → grade, with topics and dotted leaders */
/** `level`: heading level of the stage titles (3 under a section heading, 2 directly under the page title) */
export function GradeIndex({ mine, className, level = 3 }) {
  return (
    <div className={cn("grid gap-x-16 gap-y-12 lg:grid-cols-2", className)}>
      <StageBlock stage={STAGES[0]} mine={mine} level={level} />
      <div className="space-y-12">
        <StageBlock stage={STAGES[1]} mine={mine} level={level} />
        <StageBlock stage={STAGES[2]} mine={mine} level={level} />
      </div>
    </div>
  );
}
