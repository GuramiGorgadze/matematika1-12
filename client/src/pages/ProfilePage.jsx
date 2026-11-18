import { ArrowRight, CalendarDays, ChartColumn, EyeOff, ListChecks, LoaderCircle, LogOut, ShieldCheck, UserPen } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Container } from "@/components/layout/Container";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Callout, EmptyState, Progress, Stat, StatGrid } from "@/components/ui/misc";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { chapterNo, CURR, problemsOf } from "@/content/index.js";
import { useProgress } from "@/features/student/progress";
import { openRegistration, StudentGate } from "@/features/student/registration";
import { session, useSession } from "@/features/student/session";
import { FocusReport, STATUS } from "@/features/tests/TestUI";
import { api } from "@/lib/api";
import { cn } from "@/lib/cn";
import { clock, dateOnly, dateTime, humanDuration, initials, ord, pct, STAGE_STYLES, stageOf } from "@/lib/format";

function useGradeStats() {
  const progress = useProgress();
  return useMemo(() => {
    const out = [];
    let solved = 0;
    let firstTry = 0;
    let tries = 0;
    let lessonsDone = 0;
    for (const s of Object.values(progress.all())) {
      tries += s.n || 0;
      if (s.ok) {
        solved++;
        if (s.ft) firstTry++;
      }
    }
    for (let n = 1; n <= 12; n++) {
      const chs = [];
      let t = 0;
      let sv = 0;
      for (const ch of CURR[n]) {
        if (ch.soon) continue;
        let ct = 0;
        let cs = 0;
        for (const l of ch.lessons) {
          const ps = problemsOf(l.id);
          const done = ps.filter((p) => progress.get(p.id)?.ok).length;
          ct += ps.length;
          cs += done;
          if (ps.length && done === ps.length) lessonsDone++;
        }
        chs.push({ ch, t: ct, s: cs });
        t += ct;
        sv += cs;
      }
      out.push({ n, chs, t, s: sv });
    }
    return { grades: out, solved, firstTry, tries, lessonsDone };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [progress.version()]);
}

/** one test, question by question, in a side sheet */
function AttemptDialog({ item, onClose }) {
  const [full, setFull] = useState(null);
  const [err, setErr] = useState("");
  useEffect(() => {
    if (!item) return;
    setFull(null);
    setErr("");
    api(`/me/attempts/${encodeURIComponent(item.clientId)}`)
      .then((r) => setFull(r.attempt))
      .catch((e) => setErr(e.message));
  }, [item]);
  return (
    <Dialog open={!!item} onOpenChange={(o) => !o && onClose()}>
      <DialogContent side="right">
        {item && (
          <>
            <DialogHeader className="border-b border-border pb-5">
              <p className="eyebrow text-accent">{item.kind === "exam" ? "გამოცდა" : "შემაჯამებელი ტესტი"}</p>
              <DialogTitle>{item.title}</DialogTitle>
              <DialogDescription>
                {dateTime(item.finishedAt || item.startedAt)} · {item.status === "submitted" ? `${item.score} / ${item.maxScore} (${Math.round(item.percent)}%)` : "მიმდინარე"}
              </DialogDescription>
            </DialogHeader>
            <DialogBody className="grid gap-6">
              {!full && !err && <LoaderCircle className="mx-auto size-6 animate-spin text-muted-foreground" aria-label="იტვირთება" />}
              {err && <p className="text-sm text-danger-foreground">{err}</p>}
              {full && (
                <>
                  <FocusReport focus={full.focus} />
                  {full.answers?.length > 0 && (
                    <ol className="border-b border-border">
                      {full.answers.map((a) => {
                        const S = STATUS[a.status] || STATUS.unanswered;
                        return (
                          <li key={a.n} className="grid grid-cols-[2rem_minmax(0,1fr)] gap-x-3 border-t border-border py-4">
                            <span className={cn("num text-right font-display text-xl leading-none", S.num)}>{a.n}.</span>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <Badge variant={S.variant} size="sm">
                                  {S.label}
                                </Badge>
                                <span className="num ml-auto text-xs text-muted-foreground">
                                  {a.points} / {a.maxPoints}
                                </span>
                              </div>
                              <p className="mt-2 line-clamp-2 font-serif text-[0.9375rem] text-muted-foreground">{a.prompt}</p>
                              <dl className="mt-2 grid grid-cols-1 gap-1 text-sm sm:grid-cols-2">
                                <div>
                                  <dt className="inline text-subtle-foreground">შენი: </dt>
                                  <dd className="inline font-mathtext">{a.given ?? "—"}</dd>
                                </div>
                                <div>
                                  <dt className="inline text-subtle-foreground">სწორი: </dt>
                                  <dd className="inline font-mathtext text-success-foreground">{a.correct}</dd>
                                </div>
                              </dl>
                            </div>
                          </li>
                        );
                      })}
                    </ol>
                  )}
                </>
              )}
            </DialogBody>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function TestsTab() {
  const [items, setItems] = useState(null);
  const [err, setErr] = useState("");
  const [open, setOpen] = useState(null);
  useEffect(() => {
    api("/me/attempts")
      .then((r) => setItems(r.items))
      .catch((e) => setErr(e.offline ? "ტესტების ისტორია ოფლაინ რეჟიმში ვერ ჩაიტვირთა." : e.message));
  }, []);
  if (err)
    return (
      <EmptyState icon={ListChecks} title="ვერ ჩაიტვირთა">
        {err}
      </EmptyState>
    );
  if (!items) return <LoaderCircle className="mx-auto my-10 size-6 animate-spin text-muted-foreground" aria-label="იტვირთება" />;
  if (!items.length)
    return (
      <EmptyState icon={ListChecks} title="ჯერ ტესტი არ დაგიწერია">
        შემაჯამებელი ტესტები ყოველი თავის გვერდზეა, ეროვნული გამოცდები კი — მე-12 კლასში.
      </EmptyState>
    );
  return (
    <>
      <Table>
        <THead>
          <TR>
            <TH>ტესტი</TH>
            <TH className="text-right">შედეგი</TH>
            <TH className="hidden text-right md:table-cell">სწორი · არასწ. · უპას.</TH>
            <TH className="text-right">გასვლები</TH>
            <TH>
              <span className="sr-only">დეტალები</span>
            </TH>
          </TR>
        </THead>
        <TBody>
          {items.map((a) => (
            <TR key={a.clientId} className="cursor-pointer hover:bg-surface-2/60" onClick={() => setOpen(a)}>
              <TD className="max-w-[22rem]">
                <span className="block truncate font-semibold">{a.title}</span>
                <span className="text-xs text-subtle-foreground">
                  {dateTime(a.finishedAt || a.startedAt)} · {a.kind === "exam" ? "გამოცდა" : "თავის ტესტი"}
                </span>
              </TD>
              <TD className="num whitespace-nowrap text-right">
                {a.status === "submitted" ? (
                  <>
                    <b className="font-semibold">{a.score}</b> / {a.maxScore}
                    <span className="ml-2 text-muted-foreground">{Math.round(a.percent)}%</span>
                  </>
                ) : (
                  <Badge variant="warning" size="sm">
                    მიმდინარე
                  </Badge>
                )}
              </TD>
              <TD className="num hidden whitespace-nowrap text-right text-muted-foreground md:table-cell">
                <span className="text-success-foreground">{a.counts?.correct ?? 0}</span> · <span className="text-danger-foreground">{a.counts?.wrong ?? 0}</span> · {a.counts?.unanswered ?? 0}
              </TD>
              <TD className="num whitespace-nowrap text-right">
                {a.focus?.leaves > 0 ? (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-warning-foreground">
                    <EyeOff className="size-3.5" aria-hidden="true" /> {a.focus.leaves} · {clock(a.focus.awayMs / 1000)}
                  </span>
                ) : (
                  <span className="text-subtle-foreground">0</span>
                )}
              </TD>
              <TD className="text-right">
                <button
                  type="button"
                  onClick={() => setOpen(a)}
                  className="grid size-9 place-items-center rounded-md text-subtle-foreground hover:bg-surface-3 hover:text-foreground"
                  aria-label={`დეტალები: ${a.title}`}
                >
                  <ArrowRight className="size-4" />
                </button>
              </TD>
            </TR>
          ))}
        </TBody>
      </Table>
      <AttemptDialog item={open} onClose={() => setOpen(null)} />
    </>
  );
}

function ProgressTab({ stats, grade }) {
  const shown = stats.grades.filter((g) => g.t && (g.n === grade || g.s > 0)).sort((a, b) => (a.n === grade ? -1 : b.n === grade ? 1 : a.n - b.n));
  if (!shown.length)
    return (
      <EmptyState icon={ChartColumn} title="პროგრესი ჯერ ცარიელია">
        გადადი შენს კლასზე და ამოხსენი პირველი ამოცანა.
      </EmptyState>
    );
  return (
    <div className="space-y-12">
      {shown.map((g) => {
        const st = STAGE_STYLES[stageOf(g.n)];
        return (
          <section key={g.n} aria-labelledby={`pg-${g.n}`}>
            <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1 border-b-[1.5px] border-rule-ink pb-2">
              <h2 id={`pg-${g.n}`} className="font-serif text-xl font-semibold">
                <Link to={`/grade/${g.n}`} className="hover:text-accent">
                  {ord(g.n)} კლასი
                </Link>
              </h2>
              {g.n === grade && (
                <Badge variant="solid" size="sm">
                  შენი კლასი
                </Badge>
              )}
              <span className="num ml-auto text-sm text-muted-foreground">
                {g.s} / {g.t} · {pct(g.s, g.t)}%
              </span>
            </div>
            <ol>
              {g.chs.map(({ ch, t, s }) => (
                <li key={ch.id} className="border-b border-border">
                  <Link
                    to={`/grade/${g.n}/${ch.id}`}
                    className="group -mx-2 grid grid-cols-[2rem_minmax(0,1fr)_auto] items-center gap-x-4 gap-y-2 rounded-md px-2 py-3 transition-colors hover:bg-surface-2/70 sm:grid-cols-[2rem_minmax(0,1fr)_10rem_4.5rem]"
                  >
                    <span className={cn("num text-right font-display text-xl leading-none", st.text)}>{chapterNo(ch)}</span>
                    <span className="min-w-0 truncate font-serif text-[1rem] font-semibold group-hover:text-accent">{ch.title}</span>
                    <Progress value={s} max={t || 1} className="col-span-3 col-start-2 h-1 sm:col-span-1 sm:col-start-auto" barClassName="bg-success" label={`${ch.title}: ${pct(s, t)}%`} />
                    <span className="num row-start-1 text-right text-xs text-muted-foreground sm:col-start-4 sm:row-start-auto">
                      {s} / {t}
                    </span>
                  </Link>
                </li>
              ))}
            </ol>
          </section>
        );
      })}
    </div>
  );
}

function ProfileView() {
  const { student } = useSession();
  const navigate = useNavigate();
  const stats = useGradeStats();
  const [fresh, setFresh] = useState(student);
  useEffect(() => {
    document.title = "პროფილი · მათემატიკა";
    api("/me")
      .then((r) => setFresh(r.student))
      .catch(() => {});
  }, []);
  const act = fresh?.activity || {};

  return (
    <Container className="py-12 sm:py-16">
      <header className="flex flex-wrap items-end justify-between gap-6 border-b-[1.5px] border-rule-ink pb-8">
        <div className="flex items-center gap-5">
          <span className="grid size-20 shrink-0 place-items-center rounded-full border-[1.5px] border-foreground font-serif text-2xl font-semibold" aria-hidden="true">
            {initials(student.firstName, student.lastName)}
          </span>
          <div className="min-w-0">
            <p className="eyebrow text-accent">მოსწავლის ბარათი</p>
            <h1 className="mt-1 text-[2.125rem] leading-tight sm:text-[2.625rem]">
              {student.firstName} {student.lastName}
            </h1>
            <p className="mt-1 text-muted-foreground">
              {ord(student.grade)} კლასი · {student.school}
            </p>
            <p className="mt-1 flex items-center gap-1.5 text-xs text-subtle-foreground">
              <CalendarDays className="size-3.5" aria-hidden="true" /> რეგისტრაცია: {dateOnly(fresh?.createdAt || act.firstSeenAt)}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => openRegistration({ edit: true })}>
            <UserPen /> შეცვლა
          </Button>
          <Button
            variant="ghost"
            onClick={() => {
              session.clear();
              navigate("/");
            }}
          >
            <LogOut /> გამოსვლა
          </Button>
        </div>
      </header>

      <section aria-label="სტატისტიკა" className="mt-10">
        <StatGrid className="grid-cols-2 md:grid-cols-3">
          <Stat label="ამოხსნილი ამოცანა" value={stats.solved} tone="success" />
          <Stat label="დასრულებული გაკვეთილი" value={stats.lessonsDone} />
          <Stat label="პირველივე ცდით" value={stats.firstTry} hint={stats.solved ? `${pct(stats.firstTry, stats.solved)}% ამოხსნილიდან` : undefined} />
          <Stat label="სულ ცდა" value={stats.tries} />
          <Stat label="დრო საიტზე" value={humanDuration(act.seconds || 0)} />
          <Stat label="შემოსვლა" value={act.visits || 0} hint={`აქტიური დღე: ${Object.keys(act.days || {}).length}`} />
        </StatGrid>
      </section>

      <Tabs defaultValue="progress" className="mt-14">
        <TabsList>
          <TabsTrigger value="progress">
            <ChartColumn /> პროგრესი
          </TabsTrigger>
          <TabsTrigger value="tests">
            <ListChecks /> ტესტები
          </TabsTrigger>
        </TabsList>
        <TabsContent value="progress" className="mt-8">
          <ProgressTab stats={stats} grade={student.grade} />
        </TabsContent>
        <TabsContent value="tests" className="mt-8">
          <TestsTab />
        </TabsContent>
      </Tabs>

      <Callout icon={ShieldCheck} tone="neutral" title="სად ინახება ჩემი მონაცემები?" className="mt-16 max-w-3xl">
        შედეგები ჯერ ამ ბრაუზერში ინახება, შემდეგ კი ავტომატურად იგზავნება სერვერზე, სადაც მათ მასწავლებელი ხედავს. სხვა მოწყობილობაზე იგივე სახელით, გვარით, კლასითა და სკოლით შესვლისას პროგრესი
        დაგიბრუნდება. საზიარო კომპიუტერზე სამუშაოს დასრულების შემდეგ დააჭირე „გამოსვლას“.
      </Callout>
    </Container>
  );
}

export default function ProfilePage() {
  return (
    <StudentGate>
      <ProfileView />
    </StudentGate>
  );
}
