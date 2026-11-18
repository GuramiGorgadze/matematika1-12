import { ArrowRight, BookOpenText, Check, CircleCheck, ClipboardList, Eye, FileSpreadsheet, ListChecks, PencilLine, X } from "lucide-react";
import { lazy, Suspense, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ParabolaFigure, ThalesFigure } from "@/components/brand/Decor";
import { PageSkeleton } from "@/components/layout/AppShell";
import { Container, SectionHeading } from "@/components/layout/Container";
import { Button, ButtonLink } from "@/components/ui/button";
import { Stat, StatGrid } from "@/components/ui/misc";
import { CATALOG } from "@/content/grades";
import { GradeIndex } from "@/features/book/GradeIndex";
import { openRegistration } from "@/features/student/registration";
import { useSession } from "@/features/student/session";
import { thousands } from "@/lib/format";

const StudentDesk = lazy(() => import("./home/StudentDesk"));


/* ---------- the cover ---------- */
function TextbookPage() {
  return (
    <figure className="relative mx-auto w-full max-w-[34rem]" aria-label="სახელმძღვანელოს გვერდის ნიმუში">
      {/* the page underneath */}
      <div className="absolute inset-0 translate-x-3 translate-y-3 rotate-[1.6deg] rounded-[var(--panel-radius)] border border-border bg-surface-2" aria-hidden="true" />
      <div className="relative rounded-[var(--panel-radius)] border border-border bg-surface px-6 pb-6 pt-5 shadow-md sm:px-8">
        <div className="flex items-baseline justify-between border-b border-border pb-2.5 text-[0.6875rem] text-subtle-foreground">
          <span className="eyebrow">მე-8 კლასი · წრეწირი</span>
          <span className="num font-serif">117</span>
        </div>
        <ThalesFigure className="mt-3" />
        <figcaption className="mt-1 text-center text-xs text-subtle-foreground">ნახ. 5.3 · თალესის თეორემა</figcaption>
        <div className="mt-5 border-l-[3px] border-accent pl-4">
          <p className="eyebrow text-accent">თეორემა</p>
          <p className="mt-1.5 font-serif text-[0.9375rem] leading-relaxed">დიამეტრზე დაყრდნობილი ჩახაზული კუთხე მართია.</p>
        </div>
      </div>
    </figure>
  );
}

function Hero() {
  const navigate = useNavigate();
  return (
    <section className="overflow-x-clip border-b border-border">
      <Container className="grid grid-cols-1 items-center gap-14 py-14 sm:py-20 lg:grid-cols-[minmax(0,1.08fr)_minmax(0,0.92fr)] lg:gap-16 lg:py-24">
        <div className="animate-rise">
          <p className="eyebrow text-accent">მათემატიკა · 1–12 კლასი</p>
          <h1 className="mt-5 text-[2.125rem] leading-[1.12] tracking-[-0.01em] sm:text-[3.25rem] xl:text-[3.625rem]">
            სახელმძღვანელო, რომელიც <span className="marker">შენს პასუხებს</span> ამოწმებს.
          </h1>
          <p className="mt-6 max-w-xl font-serif text-[1.125rem] leading-relaxed text-muted-foreground">
            წესები, ფორმულები და დამტკიცებები 1-ლიდან მე-12 კლასამდე. ათასობით ამოცანა მყისიერი შემოწმებით, შემაჯამებელი ტესტები, ეროვნული გამოცდები და ინტერაქტიული დაფები.
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-3">
            <Button size="lg" variant="accent" onClick={() => openRegistration({ then: (s) => navigate(`/grade/${s.grade}`) })}>
              დაიწყე სწავლა <ArrowRight aria-hidden="true" />
            </Button>
            <ButtonLink size="lg" variant="secondary" to="/grades">
              სარჩევის ნახვა
            </ButtonLink>
          </div>
          <p className="mt-4 text-sm text-subtle-foreground">უფასოა. რეგისტრაციას ერთი წუთი სჭირდება.</p>
        </div>
        <div className="animate-rise [animation-delay:120ms]">
          <TextbookPage />
        </div>
      </Container>
    </section>
  );
}

function Figures() {
  return (
    <Container className="py-12 sm:py-16">
      <StatGrid className="grid-cols-2 lg:grid-cols-4">
        <Stat label="კლასი" value={CATALOG.grades} hint="დაწყებითიდან საშუალომდე" />
        <Stat label="გაკვეთილი" value={CATALOG.lessons} hint="წესები, მაგალითები, დამტკიცებები" />
        <Stat label="ამოცანა" value={thousands(CATALOG.problems)} hint="ავტომატური შემოწმებით" />
        <Stat label="ონლაინ გამოცდა" value={CATALOG.exams} hint="ეროვნული და სავარჯიშო" />
      </StatGrid>
    </Container>
  );
}

const STEPS = [
  { icon: BookOpenText, title: "წაიკითხე გაკვეთილი", text: "განმარტებები, ძირითადი ფორმულები, ამოხსნილი მაგალითები და დამტკიცებები — ერთ გვერდზე, ნახაზებით." },
  { icon: PencilLine, title: "ამოხსენი ამოცანები", text: "ჩაწერე პასუხი და მაშინვე გაიგებ, სწორია თუ არა. თუ გაჭედე, ნახე ამოხსნა ნაბიჯ-ნაბიჯ." },
  { icon: ListChecks, title: "ჩააბარე ტესტი", text: "თავის ბოლოს — შემაჯამებელი ტესტი დროით. შედეგი ჩანს კითხვა-კითხვით, შეცდომების ახსნით." },
];

function Method() {
  return (
    <section className="border-y border-border bg-surface-2/60" aria-labelledby="method-h">
      <Container className="py-16 sm:py-20">
        <SectionHeading id="method-h" overline="მეთოდი" title="სამი ნაბიჯი ყოველ თემაზე" />
        <ol className="grid grid-cols-1 gap-px overflow-hidden rounded-[var(--panel-radius)] border border-border bg-border md:grid-cols-3">
          {STEPS.map((s, i) => (
            <li key={s.title} className="bg-surface p-6 sm:p-8">
              <div className="flex items-center justify-between">
                <span className="num font-display text-5xl font-medium leading-none text-accent">{i + 1}</span>
                <s.icon className="size-6 text-subtle-foreground" aria-hidden="true" />
              </div>
              <h3 className="mt-6 text-xl">{s.title}</h3>
              <p className="mt-2 font-serif text-[0.9875rem] leading-relaxed text-muted-foreground">{s.text}</p>
            </li>
          ))}
        </ol>
      </Container>
    </section>
  );
}

/* a marked test paper */
function GradedPaper() {
  const rows = [
    [1, "x = 4", true],
    [2, "12 სმ²", true],
    [3, "−3", false, "3"],
    [4, "½", true],
    [5, "(2; −1)", true],
  ];
  return (
    <div className="relative mx-auto w-full max-w-md rounded-[var(--panel-radius)] border border-border bg-surface p-6 shadow-md sm:p-7">
      <div className="flex items-start justify-between gap-4 border-b border-border pb-4">
        <div>
          <p className="eyebrow text-subtle-foreground">შემაჯამებელი ტესტი</p>
          <p className="mt-1 font-serif text-lg font-semibold">IV თავი · განტოლებები</p>
        </div>
        <div className="relative shrink-0 px-6 py-3 text-center">
          <svg viewBox="0 0 100 60" preserveAspectRatio="none" className="absolute -inset-1 h-[calc(100%+0.5rem)] w-[calc(100%+0.5rem)] -rotate-[5deg]" aria-hidden="true">
            <ellipse cx="50" cy="30" rx="48" ry="27" fill="none" stroke="var(--accent)" strokeWidth="1.8" strokeDasharray="262 26" vectorEffect="non-scaling-stroke" />
          </svg>
          <span className="num relative font-display text-3xl font-medium leading-none">17</span>
          <span className="num relative text-sm text-muted-foreground"> / 20</span>
        </div>
      </div>
      <ol className="divide-y divide-border">
        {rows.map(([n, a, ok, right]) => (
          <li key={n} className="flex items-center gap-3 py-2.5 text-sm">
            <span className="num w-7 text-subtle-foreground">№{n}</span>
            <span className={ok ? "font-mathtext text-base" : "font-mathtext text-base text-danger line-through decoration-1"}>{a}</span>
            {right && <span className="font-mathtext text-base text-success-foreground">{right}</span>}
            <span className="ml-auto inline-flex items-center gap-1 text-xs font-semibold">
              {ok ? (
                <>
                  <Check className="size-4 text-success" aria-hidden="true" /> <span className="text-success-foreground">სწორია</span>
                </>
              ) : (
                <>
                  <X className="size-4 text-danger" aria-hidden="true" /> <span className="text-danger-foreground">არასწორია</span>
                </>
              )}
            </span>
          </li>
        ))}
      </ol>
      <p className="mt-3 flex items-center gap-2 rounded-md bg-warning-soft px-3 py-2 text-xs font-medium text-warning-foreground">
        <Eye className="size-4 shrink-0" aria-hidden="true" /> ჩანართი დატოვა ერთხელ · 0:12 · №14 კითხვაზე
      </p>
    </div>
  );
}

function Spreads() {
  return (
    <Container className="space-y-24 py-20 sm:py-24">
      <section className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-20" aria-labelledby="tests-h">
        <div>
          <p className="eyebrow text-accent">ტესტები</p>
          <h2 id="tests-h" className="mt-3 text-[1.875rem] leading-tight sm:text-[2.25rem]">
            ტესტი, როგორც გამოცდაზე
          </h2>
          <p className="mt-4 max-w-lg font-serif text-[1.0625rem] leading-relaxed text-muted-foreground">
            ყოველ თავს აქვს შემაჯამებელი ტესტი, მე-12 კლასს — წინა წლების ეროვნული გამოცდები. ტესტი ცალკე, მშვიდ ეკრანზე იხსნება, დრო აითვლება და ბოლოს ყველა კითხვის შედეგი ჩანს.
          </p>
          <ul className="mt-6 space-y-3 text-[0.9375rem]">
            {["პასუხები ინახება ყოველ ნაბიჯზე — კავშირის გაწყვეტაც არ აშინებს", "შედეგი კითხვა-კითხვით: შენი პასუხი, სწორი პასუხი და ამოხსნა", "ჩანართიდან გასვლა ფიქსირდება — ასე შედეგი სანდოა"].map(
              (t) => (
                <li key={t} className="flex gap-3">
                  <CircleCheck className="mt-0.5 size-[1.1rem] shrink-0 text-accent" aria-hidden="true" />
                  {t}
                </li>
              ),
            )}
          </ul>
        </div>
        <GradedPaper />
      </section>

      <section className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-20" aria-labelledby="boards-h">
        <div className="order-2 rounded-[var(--panel-radius)] border border-border bg-surface p-4 shadow-md sm:p-6 lg:order-1">
          <div className="mb-2 flex items-center justify-between border-b border-border pb-3">
            <span className="font-mathtext text-lg">
              <i>y</i> = <i>x</i>² − 4
            </span>
            <span className="text-xs text-subtle-foreground">გრაფიკების დაფა</span>
          </div>
          <ParabolaFigure />
        </div>
        <div className="order-1 lg:order-2">
          <p className="eyebrow text-accent">დაფები</p>
          <h2 id="boards-h" className="mt-3 text-[1.875rem] leading-tight sm:text-[2.25rem]">
            დახაზე და დაინახე
          </h2>
          <p className="mt-4 max-w-lg font-serif text-[1.0625rem] leading-relaxed text-muted-foreground">
            ფუნქციების გრაფიკები, გეომეტრიული აგებები, ტრიგონომეტრიული წრე, ვექტორები და სივრცითი ფიგურები — ინტერაქტიულ დაფებზე, რომლებიც ყოველი კლასის სარჩევშია.
          </p>
        </div>
      </section>
    </Container>
  );
}

function Teachers() {
  return (
    <section className="border-y border-border bg-surface-2/60" aria-labelledby="teachers-h">
      <Container className="grid grid-cols-1 gap-12 py-16 sm:py-20 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:items-center">
        <div>
          <p className="eyebrow text-accent">მასწავლებლისთვის</p>
          <h2 id="teachers-h" className="mt-3 text-[1.875rem] leading-tight sm:text-[2.25rem]">
            ყველა შედეგი ერთ ჟურნალში
          </h2>
          <p className="mt-4 max-w-lg font-serif text-[1.0625rem] leading-relaxed text-muted-foreground">
            მასწავლებლის პანელში ჩანს თითოეული მოსწავლის აქტივობა, ტესტები და პასუხები კითხვა-კითხვით — და ისიც, დატოვა თუ არა ტესტის ჩანართი და რამდენი ხნით.
          </p>
          <ButtonLink to="/teacher" variant="primary" className="mt-8">
            მასწავლებლის პანელი <ArrowRight aria-hidden="true" />
          </ButtonLink>
        </div>
        <dl className="grid grid-cols-1 gap-px overflow-hidden rounded-[var(--panel-radius)] border border-border bg-border sm:grid-cols-2">
          {[
            [ClipboardList, "პასუხები კითხვა-კითხვით", "სწორი, არასწორი და გამოტოვებული — ყოველი ტესტისთვის."],
            [Eye, "ჩანართიდან გასვლები", "რამდენჯერ, რამდენი ხნით და რომელ კითხვაზე."],
            [FileSpreadsheet, "Google Sheets", "მოსწავლეები, ტესტები და პასუხები ავტომატურად ცხრილში."],
            [CircleCheck, "CSV ექსპორტი", "ერთი დაჭერით — Excel-ისთვის მზა ფაილი."],
          ].map(([Icon, t, d]) => (
            <div key={t} className="bg-surface p-6">
              <dt className="font-serif text-[1.0625rem] font-semibold">
                <Icon className="mb-4 block size-5 text-accent" aria-hidden="true" />
                {t}
              </dt>
              <dd className="mt-1 text-sm leading-relaxed text-muted-foreground">{d}</dd>
            </div>
          ))}
        </dl>
      </Container>
    </section>
  );
}

function Landing() {
  return (
    <>
      <Hero />
      <Figures />
      <section aria-labelledby="toc-h">
        <Container className="pb-8">
          <SectionHeading id="toc-h" overline="სარჩევი" title="თორმეტი კლასი — ერთი სახელმძღვანელო" lead="აირჩიე კლასი: თავები, გაკვეთილები, ამოცანები და ტესტები." />
          <GradeIndex />
        </Container>
      </section>
      <div className="h-20" />
      <Method />
      <Spreads />
      <Teachers />
    </>
  );
}

export default function HomePage() {
  const { status, student } = useSession();
  useEffect(() => {
    document.title = "მათემატიკა 1–12 · სახელმძღვანელო";
  }, []);
  if (status === "ready" && student)
    return (
      <Suspense fallback={<PageSkeleton />}>
        <StudentDesk student={student} />
      </Suspense>
    );
  return <Landing />;
}
