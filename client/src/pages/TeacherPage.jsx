import {
  ArrowLeft,
  ChartColumn,
  CircleCheck,
  CircleMinus,
  CircleX,
  Clock3,
  Download,
  EyeOff,
  FileSpreadsheet,
  KeyRound,
  ListChecks,
  LoaderCircle,
  LogOut,
  Moon,
  RefreshCw,
  Search,
  Sun,
  TriangleAlert,
  UsersRound,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { Logo, LogoMark } from "@/components/brand/Logo";
import { MiniBars } from "@/components/charts/MiniBars";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Field, Input, Select } from "@/components/ui/input";
import { Callout, EmptyState, Skeleton, Stat, StatGrid } from "@/components/ui/misc";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { FocusReport, STATUS } from "@/features/tests/TestUI";
import { api, download, TEACHER_TOKEN_KEY } from "@/lib/api";
import { cn } from "@/lib/cn";
import { ago, clock, dateTime, humanDuration, ord } from "@/lib/format";
import { theme, useDarkMode } from "@/lib/theme";

const getToken = () => {
  try {
    return sessionStorage.getItem(TEACHER_TOKEN_KEY);
  } catch {
    return null;
  }
};
const setToken = (t) => {
  try {
    if (t) sessionStorage.setItem(TEACHER_TOKEN_KEY, t);
    else sessionStorage.removeItem(TEACHER_TOKEN_KEY);
  } catch {
    /* ignore */
  }
};

function useTeacherQuery(path, deps = []) {
  const [state, setState] = useState({ data: null, error: null, loading: true });
  const load = useCallback(() => {
    if (!path) {
      setState({ data: null, error: null, loading: false });
      return Promise.resolve();
    }
    setState((s) => ({ ...s, loading: true }));
    return api(path, { as: "teacher" })
      .then((data) => setState({ data, error: null, loading: false }))
      .catch((error) => setState({ data: null, error, loading: false }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path, ...deps]);
  useEffect(() => {
    load();
  }, [load]);
  return { ...state, reload: load };
}

/* ---------- sign in: the register's cover ---------- */
function Login({ onDone }) {
  const [key, setKey] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(e) {
    e.preventDefault();
    if (!key.trim()) return setErr("ჩაწერეთ გასაღები.");
    setBusy(true);
    setErr("");
    try {
      const { token } = await api("/teacher/session", { method: "POST", body: { key }, as: "teacher" });
      setToken(token);
      onDone();
    } catch (e2) {
      setErr(e2.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="flex h-[var(--header-height)] items-center justify-between border-b border-border px-4 sm:px-6">
        <Logo />
        <Link to="/" className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" aria-hidden="true" /> საიტზე დაბრუნება
        </Link>
      </header>
      <main id="main" className="grid flex-1 place-items-center px-4 py-16">
        <div className="w-full max-w-md">
          <div className="rounded-[var(--panel-radius)] border border-border bg-surface shadow-md">
            <div className="rule-double mx-6 mt-6 pt-6 sm:mx-8">
              <p className="eyebrow text-accent">მასწავლებლისთვის</p>
              <h1 className="mt-2 text-[2rem] leading-tight">ჟურნალი</h1>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                მოსწავლეების აქტივობა, ტესტების შედეგები კითხვა-კითხვით და ჩანართიდან გასვლები. შესასვლელად ჩაწერეთ სერვერზე დაყენებული გასაღები (TEACHER_KEY).
              </p>
            </div>
            <form onSubmit={submit} className="grid gap-4 p-6 sm:p-8" noValidate>
              <Field label="გასაღები" error={err}>
                {(p) => <Input {...p} type="password" autoComplete="current-password" value={key} onChange={(e) => setKey(e.target.value)} autoFocus />}
              </Field>
              <Button type="submit" size="lg" disabled={busy}>
                {busy ? <LoaderCircle className="animate-spin" aria-hidden="true" /> : <KeyRound aria-hidden="true" />} შესვლა
              </Button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}

/* ---------- small pieces ---------- */
function Pct({ p }) {
  if (p == null) return <span className="text-subtle-foreground">—</span>;
  const v = Math.round(p);
  return <span className={cn("num font-semibold", v >= 75 ? "text-success-foreground" : v >= 50 ? "text-foreground" : "text-warning-foreground")}>{v}%</span>;
}

function Leaves({ n, ms }) {
  if (!n) return <span className="text-subtle-foreground">0</span>;
  return (
    <span className="inline-flex items-center gap-1.5 font-semibold text-warning-foreground">
      <EyeOff className="size-3.5" aria-hidden="true" /> {n} · <span className="num">{clock(ms / 1000)}</span>
    </span>
  );
}

function Counts({ c }) {
  return (
    <span className="num inline-flex items-center gap-2.5">
      <span className="inline-flex items-center gap-1 text-success-foreground">
        <CircleCheck className="size-3.5" aria-label="სწორი" /> {c?.correct ?? 0}
      </span>
      <span className="inline-flex items-center gap-1 text-danger-foreground">
        <CircleX className="size-3.5" aria-label="არასწორი" /> {c?.wrong ?? 0}
      </span>
      <span className="inline-flex items-center gap-1 text-muted-foreground">
        <CircleMinus className="size-3.5" aria-label="უპასუხო" /> {c?.unanswered ?? 0}
      </span>
    </span>
  );
}

/* ---------- attempt detail ---------- */
function AttemptDrawer({ id, onClose }) {
  const [a, setA] = useState(null);
  const [err, setErr] = useState("");
  useEffect(() => {
    if (!id) return;
    setA(null);
    setErr("");
    api(`/teacher/attempts/${id}`, { as: "teacher" })
      .then((r) => setA(r.attempt))
      .catch((e) => setErr(e.message));
  }, [id]);
  return (
    <Dialog open={!!id} onOpenChange={(o) => !o && onClose()}>
      <DialogContent side="right" className="max-w-3xl">
        <DialogHeader className="border-b border-border pb-5">
          <p className="eyebrow text-accent">{a?.kind === "exam" ? "გამოცდა" : "შემაჯამებელი ტესტი"}</p>
          <DialogTitle>{a ? a.title : "ტესტი"}</DialogTitle>
          <DialogDescription>{a ? `${a.studentName} · ${ord(a.studentGrade)} კლასი · ${a.school || ""}` : " "}</DialogDescription>
        </DialogHeader>
        <DialogBody className="grid gap-6">
          {!a && !err && <LoaderCircle className="mx-auto size-6 animate-spin text-muted-foreground" aria-label="იტვირთება" />}
          {err && (
            <Callout tone="danger" icon={TriangleAlert}>
              {err}
            </Callout>
          )}
          {a && (
            <>
              <StatGrid className="grid-cols-2 sm:grid-cols-4 [&>*]:bg-surface">
                <Stat label="ქულა" value={a.status === "submitted" ? `${a.score}/${a.maxScore}` : "—"} hint={a.status === "submitted" ? `${a.percent}%` : "მიმდინარე"} />
                <Stat label="დრო" value={a.durationSec ? humanDuration(a.durationSec) : "—"} hint={a.timeLimitSec ? `ლიმიტი ${humanDuration(a.timeLimitSec)}` : undefined} />
                <Stat label="დაწყება" value={dateTime(a.startedAt).split(" ")[1]} hint={dateTime(a.startedAt).split(" ")[0]} />
                <Stat
                  label="სწორი / არასწ."
                  value={a.status === "submitted" ? `${a.counts?.correct ?? 0}/${a.counts?.wrong ?? 0}` : "—"}
                  hint={a.status === "submitted" ? `უპასუხო: ${a.counts?.unanswered ?? 0}` : undefined}
                />
              </StatGrid>
              {a.autoSubmitted && (
                <Callout tone="neutral" icon={Clock3}>
                  დრო ამოიწურა და ტესტი ავტომატურად დასრულდა.
                </Callout>
              )}
              <FocusReport focus={a.focus} />
              {a.answers?.length > 0 ? (
                <Table>
                  <THead>
                    <TR>
                      <TH>№</TH>
                      <TH>შედეგი</TH>
                      <TH>ამოცანა</TH>
                      <TH>მოსწავლე</TH>
                      <TH>სწორი</TH>
                      <TH className="text-right">ქულა</TH>
                    </TR>
                  </THead>
                  <TBody>
                    {a.answers.map((x) => {
                      const S = STATUS[x.status] || STATUS.unanswered;
                      return (
                        <TR key={x.n}>
                          <TD className={cn("num font-display text-base", S.num)}>{x.n}</TD>
                          <TD>
                            <Badge variant={S.variant} size="sm">
                              {S.label}
                            </Badge>
                          </TD>
                          <TD className="max-w-64 text-xs text-muted-foreground">
                            <span className="line-clamp-2" title={x.prompt}>
                              {x.prompt}
                            </span>
                          </TD>
                          <TD className="font-mathtext text-[0.9375rem]">{x.given ?? "—"}</TD>
                          <TD className="font-mathtext text-[0.9375rem] text-success-foreground">{x.correct}</TD>
                          <TD className="num text-right">
                            {x.points}/{x.maxPoints}
                          </TD>
                        </TR>
                      );
                    })}
                  </TBody>
                </Table>
              ) : (
                <p className="text-sm text-muted-foreground">ტესტი ჯერ არ დასრულებულა — პასუხები დასრულების შემდეგ გამოჩნდება.</p>
              )}
            </>
          )}
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}

/* ---------- student detail ---------- */
function StudentDrawer({ id, onClose, onAttempt }) {
  const q = useTeacherQuery(id ? `/teacher/students/${id}` : null, [id]);
  const d = id ? q.data : null;
  const s = d?.student;
  return (
    <Dialog open={!!id} onOpenChange={(o) => !o && onClose()}>
      <DialogContent side="right" className="max-w-3xl">
        <DialogHeader className="border-b border-border pb-5">
          <p className="eyebrow text-accent">მოსწავლე</p>
          <DialogTitle>{s ? `${s.firstName} ${s.lastName}` : "მოსწავლე"}</DialogTitle>
          <DialogDescription>{s ? `${ord(s.grade)} კლასი · ${s.school}` : " "}</DialogDescription>
        </DialogHeader>
        <DialogBody className="grid gap-6">
          {!d && <LoaderCircle className="mx-auto size-6 animate-spin text-muted-foreground" aria-label="იტვირთება" />}
          {s && (
            <>
              <StatGrid className="grid-cols-3 [&>*]:bg-surface">
                <Stat label="ვიზიტები" value={s.activity?.visits || 0} hint={`აქტიური დღე: ${Object.keys(s.activity?.days || {}).length}`} />
                <Stat label="დრო საიტზე" value={humanDuration(s.activity?.seconds || 0)} hint={`ბოლოს: ${ago(s.activity?.lastSeenAt)}`} />
                <Stat label="ამოხსნილი" value={s.stats?.solved || 0} hint={`გაკვეთილი: ${s.stats?.lessonsDone || 0}`} tone="success" />
              </StatGrid>
              <section aria-labelledby="sd-tests">
                <h3 id="sd-tests" className="font-serif text-lg font-semibold">
                  ტესტები
                </h3>
                {d.attempts.length ? (
                  <ul className="mt-3 border-b border-border">
                    {d.attempts.map((a) => (
                      <li key={a.id} className="border-t border-border">
                        <button
                          type="button"
                          onClick={() => onAttempt(a.id)}
                          className="-mx-2 flex w-[calc(100%+1rem)] flex-wrap items-center gap-x-4 gap-y-1 rounded-md px-2 py-3 text-left transition-colors hover:bg-surface-2"
                        >
                          <span className="min-w-0 flex-1 basis-56">
                            <span className="block text-sm font-semibold">{a.title}</span>
                            <span className="text-xs text-subtle-foreground">{dateTime(a.finishedAt || a.startedAt)}</span>
                          </span>
                          {a.status === "submitted" ? (
                            <span className="num text-sm">
                              <b className="font-semibold">
                                {a.score}/{a.maxScore}
                              </b>{" "}
                              · <Pct p={a.percent} />
                            </span>
                          ) : (
                            <Badge variant="warning" size="sm">
                              მიმდინარე
                            </Badge>
                          )}
                          <span className="text-xs">
                            <Leaves n={a.focus?.leaves} ms={a.focus?.awayMs} />
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-2 text-sm text-muted-foreground">ტესტი ჯერ არ დაუწერია.</p>
                )}
              </section>
            </>
          )}
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}

/* ---------- overview ---------- */
function Overview({ data, onAttempt }) {
  const t = data.totals;
  const days = data.days.map((d) => {
    const [, m, dd] = d.date.split("-");
    return { ...d, key: d.date, short: `${dd}.${m}`, label: `${dd}.${m}.${d.date.slice(0, 4)}` };
  });
  return (
    <div className="grid gap-12">
      <section aria-label="მთავარი მაჩვენებლები">
        <StatGrid className="grid-cols-2 md:grid-cols-3">
          <Stat label="მოსწავლე" value={t.students} hint={`დღეს აქტიური: ${t.activeToday}`} />
          <Stat label="აქტიური ამ კვირაში" value={t.activeWeek} />
          <Stat label="დასრულებული ტესტი" value={t.tests} hint={t.inProgress ? `მიმდინარე: ${t.inProgress}` : undefined} />
          <Stat label="საშუალო შედეგი" value={t.avgPercent == null ? "—" : `${t.avgPercent}%`} />
          <Stat label="ტესტები გასვლებით" value={t.testsWithLeaves} hint={`გასვლა სულ: ${t.leaves}`} tone={t.testsWithLeaves ? "warning" : undefined} />
          <Stat label="ჩანართს გარეთ (სულ)" value={humanDuration(t.awayMs / 1000)} />
        </StatGrid>
      </section>

      <section aria-labelledby="days-h">
        <h2 id="days-h" className="font-serif text-xl font-semibold">
          ბოლო 14 დღე
        </h2>
        <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
          <MiniBars title="აქტიური მოსწავლეები დღეში" data={days.map((d) => ({ ...d, value: d.activeStudents }))} format={(v) => `${v} მოსწავლე`} />
          <MiniBars title="დასრულებული ტესტები დღეში" data={days.map((d) => ({ ...d, value: d.tests }))} format={(v) => `${v} ტესტი`} />
        </div>
        <details className="group mt-4 text-sm">
          <summary className="inline-flex cursor-pointer list-none items-center gap-1.5 font-semibold text-muted-foreground hover:text-foreground [&::-webkit-details-marker]:hidden">
            <ChartColumn className="size-4" aria-hidden="true" /> ცხრილად ნახვა
          </summary>
          <Table wrapperClassName="mt-3">
            <THead>
              <TR>
                <TH>დღე</TH>
                <TH className="text-right">აქტიური მოსწავლე</TH>
                <TH className="text-right">წუთი საიტზე</TH>
                <TH className="text-right">დასრულებული ტესტი</TH>
              </TR>
            </THead>
            <TBody>
              {days.map((d) => (
                <TR key={d.key}>
                  <TD>{d.label}</TD>
                  <TD className="num text-right">{d.activeStudents}</TD>
                  <TD className="num text-right">{d.minutes}</TD>
                  <TD className="num text-right">{d.tests}</TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </details>
      </section>

      <div className="grid grid-cols-1 gap-12 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
        <section aria-labelledby="bg-h">
          <h2 id="bg-h" className="mb-4 font-serif text-xl font-semibold">
            კლასების მიხედვით
          </h2>
          {data.byGrade.length ? (
            <Table>
              <THead>
                <TR>
                  <TH>კლასი</TH>
                  <TH className="text-right">მოსწავლე</TH>
                  <TH className="text-right">ტესტი</TH>
                  <TH className="text-right">საშუალო</TH>
                </TR>
              </THead>
              <TBody>
                {data.byGrade.map((g) => (
                  <TR key={g.grade}>
                    <TD className="font-semibold">{ord(g.grade)} კლასი</TD>
                    <TD className="num text-right">{g.students}</TD>
                    <TD className="num text-right">{g.tests}</TD>
                    <TD className="text-right">
                      <Pct p={g.avgPercent} />
                    </TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          ) : (
            <EmptyState icon={UsersRound} title="ჯერ მონაცემი არ არის" />
          )}
        </section>
        <section aria-labelledby="rc-h">
          <h2 id="rc-h" className="mb-4 font-serif text-xl font-semibold">
            ბოლო ტესტები
          </h2>
          {data.recent.length ? (
            <ul className="border-y-[1.5px] border-rule-ink">
              {data.recent.map((a) => (
                <li key={a.id} className="border-t border-border first:border-t-0">
                  <button type="button" onClick={() => onAttempt(a.id)} className="flex w-full flex-wrap items-center gap-x-4 gap-y-1 px-1 py-3 text-left transition-colors hover:bg-surface-2/70">
                    <span className="min-w-0 flex-1 basis-56">
                      <span className="block text-sm font-semibold">{a.studentName}</span>
                      <span className="block truncate text-xs text-subtle-foreground">
                        {a.title} · {dateTime(a.finishedAt)}
                      </span>
                    </span>
                    <Pct p={a.percent} />
                    <span className="w-24 text-right text-xs">
                      <Leaves n={a.focus?.leaves} ms={a.focus?.awayMs} />
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState icon={ListChecks} title="ტესტები ჯერ არ დასრულებულა" />
          )}
        </section>
      </div>
    </div>
  );
}

/* ---------- students ---------- */
function Filters({ q, setQ, grade, setGrade, children }) {
  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="relative min-w-60 flex-1">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-subtle-foreground" aria-hidden="true" />
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="ძიება: სახელი, გვარი, სკოლა" aria-label="ძიება" className="pl-10" />
      </div>
      <div className="w-40">
        <Select value={grade} onChange={(e) => setGrade(e.target.value)} aria-label="კლასი">
          <option value="">ყველა კლასი</option>
          {Array.from({ length: 12 }, (_, i) => (
            <option key={i + 1} value={i + 1}>
              {ord(i + 1)} კლასი
            </option>
          ))}
        </Select>
      </div>
      {children}
    </div>
  );
}

function Students({ onStudent }) {
  const [q, setQ] = useState("");
  const [grade, setGrade] = useState("");
  const [debounced, setDebounced] = useState("");
  useEffect(() => {
    const t = setTimeout(() => setDebounced(q.trim()), 300);
    return () => clearTimeout(t);
  }, [q]);
  const path = `/teacher/students?${new URLSearchParams({ ...(debounced && { q: debounced }), ...(grade && { grade }) })}`;
  const { data, error, loading } = useTeacherQuery(path);
  return (
    <div className="grid gap-6">
      <Filters q={q} setQ={setQ} grade={grade} setGrade={setGrade} />
      {error ? (
        <Callout tone="danger" icon={TriangleAlert}>
          {error.message}
        </Callout>
      ) : !data ? (
        <Skeleton className="h-64" />
      ) : data.items.length ? (
        <Table aria-busy={loading}>
          <THead>
            <TR>
              <TH>მოსწავლე</TH>
              <TH>კლასი</TH>
              <TH>ბოლო აქტივობა</TH>
              <TH className="text-right">ვიზიტი</TH>
              <TH className="text-right">დრო</TH>
              <TH className="text-right">ამოხსნილი</TH>
              <TH className="text-right">ტესტი</TH>
              <TH className="text-right">საუკეთესო</TH>
              <TH className="text-right">საშუალო</TH>
              <TH>გასვლები</TH>
            </TR>
          </THead>
          <TBody>
            {data.items.map((s) => (
              <TR key={s.id} className="cursor-pointer hover:bg-surface-2/60" onClick={() => onStudent(s.id)}>
                <TD>
                  <button type="button" className="text-left font-semibold hover:text-accent" onClick={() => onStudent(s.id)}>
                    {s.firstName} {s.lastName}
                  </button>
                  <span className="block max-w-56 truncate text-xs text-subtle-foreground">{s.school}</span>
                </TD>
                <TD className="num">{s.grade}</TD>
                <TD className="whitespace-nowrap text-muted-foreground">{ago(s.activity?.lastSeenAt)}</TD>
                <TD className="num text-right">{s.activity?.visits || 0}</TD>
                <TD className="num whitespace-nowrap text-right">{humanDuration(s.activity?.seconds || 0)}</TD>
                <TD className="num text-right">{s.stats?.solved || 0}</TD>
                <TD className="num text-right">
                  {s.tests}
                  {s.inProgress ? <span className="text-xs text-warning-foreground"> +{s.inProgress}</span> : null}
                </TD>
                <TD className="text-right">
                  <Pct p={s.bestPercent} />
                </TD>
                <TD className="text-right">
                  <Pct p={s.avgPercent} />
                </TD>
                <TD className="whitespace-nowrap text-xs">
                  <Leaves n={s.leaves} ms={s.awayMs} />
                </TD>
              </TR>
            ))}
          </TBody>
        </Table>
      ) : (
        <EmptyState icon={UsersRound} title="მოსწავლე ვერ მოიძებნა">
          {debounced || grade ? "შეცვალეთ ძიების პირობა." : "როცა მოსწავლეები დარეგისტრირდებიან, აქ გამოჩნდებიან."}
        </EmptyState>
      )}
    </div>
  );
}

/* ---------- tests ---------- */
function Tests({ onAttempt }) {
  const [q, setQ] = useState("");
  const [grade, setGrade] = useState("");
  const [kind, setKind] = useState("");
  const [status, setStatus] = useState("");
  const [limit, setLimit] = useState(50);
  const [debounced, setDebounced] = useState("");
  useEffect(() => {
    const t = setTimeout(() => setDebounced(q.trim()), 300);
    return () => clearTimeout(t);
  }, [q]);
  const params = { ...(debounced && { q: debounced }), ...(grade && { grade }), ...(kind && { kind }), ...(status && { status }), limit: String(limit) };
  const { data, error } = useTeacherQuery(`/teacher/attempts?${new URLSearchParams(params)}`);
  return (
    <div className="grid gap-6">
      <Filters q={q} setQ={setQ} grade={grade} setGrade={setGrade}>
        <div className="w-48">
          <Select value={kind} onChange={(e) => setKind(e.target.value)} aria-label="ტესტის ტიპი">
            <option value="">ყველა ტიპი</option>
            <option value="chapter">თავის ტესტები</option>
            <option value="exam">გამოცდები (მე-12)</option>
          </Select>
        </div>
        <div className="w-44">
          <Select value={status} onChange={(e) => setStatus(e.target.value)} aria-label="სტატუსი">
            <option value="">ყველა სტატუსი</option>
            <option value="submitted">დასრულებული</option>
            <option value="in_progress">მიმდინარე</option>
          </Select>
        </div>
      </Filters>
      {error ? (
        <Callout tone="danger" icon={TriangleAlert}>
          {error.message}
        </Callout>
      ) : !data ? (
        <Skeleton className="h-64" />
      ) : data.items.length ? (
        <>
          <Table>
            <THead>
              <TR>
                <TH>თარიღი</TH>
                <TH>მოსწავლე</TH>
                <TH>ტესტი</TH>
                <TH className="text-right">შედეგი</TH>
                <TH>სწორი · არასწ. · უპას.</TH>
                <TH className="text-right">დრო</TH>
                <TH>გასვლები</TH>
              </TR>
            </THead>
            <TBody>
              {data.items.map((a) => (
                <TR key={a.id} className="cursor-pointer hover:bg-surface-2/60" onClick={() => onAttempt(a.id)}>
                  <TD className="whitespace-nowrap text-muted-foreground">{dateTime(a.finishedAt || a.startedAt)}</TD>
                  <TD>
                    <button type="button" className="text-left font-semibold hover:text-accent" onClick={() => onAttempt(a.id)}>
                      {a.studentName}
                    </button>
                    <span className="block text-xs text-subtle-foreground">{ord(a.studentGrade)} კლასი</span>
                  </TD>
                  <TD className="max-w-72">
                    <span className="line-clamp-2 text-sm">{a.title}</span>
                  </TD>
                  <TD className="whitespace-nowrap text-right">
                    {a.status === "submitted" ? (
                      <span className="num">
                        <b className="font-semibold">
                          {a.score}/{a.maxScore}
                        </b>{" "}
                        · <Pct p={a.percent} />
                      </span>
                    ) : (
                      <Badge variant="warning" size="sm">
                        მიმდინარე
                      </Badge>
                    )}
                  </TD>
                  <TD className="whitespace-nowrap text-xs">{a.status === "submitted" ? <Counts c={a.counts} /> : "—"}</TD>
                  <TD className="num whitespace-nowrap text-right">{a.durationSec ? humanDuration(a.durationSec) : "—"}</TD>
                  <TD className="whitespace-nowrap text-xs">
                    <Leaves n={a.focus?.leaves} ms={a.focus?.awayMs} />
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>
              ნაჩვენებია {data.items.length} / {data.total}
            </span>
            {data.items.length < data.total && (
              <Button variant="secondary" size="sm" onClick={() => setLimit((l) => l + 50)}>
                მეტის ჩვენება
              </Button>
            )}
          </div>
        </>
      ) : (
        <EmptyState icon={ListChecks} title="ტესტი ვერ მოიძებნა" />
      )}
    </div>
  );
}

function SheetsStatus({ status, onResync }) {
  if (!status) return null;
  if (status.mode === "off")
    return (
      <p className="flex items-center gap-2 text-xs text-subtle-foreground">
        <FileSpreadsheet className="size-4" aria-hidden="true" /> Google Sheets გამორთულია
      </p>
    );
  const ok = !status.lastError;
  return (
    <div className="space-y-2">
      <p className={cn("flex items-center gap-2 text-xs font-semibold", ok ? "text-success-foreground" : "text-danger-foreground")} title={status.lastError?.message}>
        <FileSpreadsheet className="size-4" aria-hidden="true" />
        Sheets: {ok ? (status.lastOkAt ? `სინქრონიზებულია ${dateTime(status.lastOkAt).split(" ")[1]}` : "მზადაა") : "შეცდომა"}
      </p>
      <Button variant="outline" size="sm" className="w-full" onClick={onResync}>
        <RefreshCw /> ხელახლა გაგზავნა
      </Button>
    </div>
  );
}

const SECTIONS = [
  { key: "overview", label: "მიმოხილვა", icon: ChartColumn, title: "მიმოხილვა" },
  { key: "students", label: "მოსწავლეები", icon: UsersRound, title: "მოსწავლეები" },
  { key: "tests", label: "ტესტები", icon: ListChecks, title: "ტესტები" },
];

/* ---------- the register: sidebar + section ---------- */
function Dashboard({ onLogout }) {
  const ov = useTeacherQuery("/teacher/overview");
  const [section, setSection] = useState("overview");
  const [student, setStudent] = useState(null);
  const [attempt, setAttempt] = useState(null);
  const dark = useDarkMode();
  useEffect(() => {
    if (ov.error?.status === 401) onLogout();
  }, [ov.error, onLogout]);
  const sheets = ov.data?.sheets;
  const current = SECTIONS.find((s) => s.key === section);

  const exportCsv = async (what) => {
    try {
      await download(`/teacher/export/${what}.csv`, what === "students" ? "moswavleebi.csv" : "testebi.csv");
    } catch (e) {
      toast.error(e.message);
    }
  };
  const resync = async () => {
    try {
      await api("/teacher/sheets/resync", { method: "POST", as: "teacher" });
      toast.success("ყველა მონაცემი თავიდან გაიგზავნება Google Sheets-ში.");
      setTimeout(() => ov.reload(), 4000);
    } catch (e) {
      toast.error(e.message);
    }
  };

  const nav = (cls) => (
    <nav aria-label="ჟურნალის განყოფილებები" className={cls}>
      {SECTIONS.map((s) => (
        <button
          key={s.key}
          type="button"
          onClick={() => setSection(s.key)}
          aria-current={section === s.key ? "page" : undefined}
          className={cn(
            "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-semibold transition-colors",
            section === s.key ? "bg-surface text-foreground shadow-xs" : "text-muted-foreground hover:bg-surface-3 hover:text-foreground",
          )}
        >
          <s.icon className={cn("size-4", section === s.key ? "text-accent" : "text-subtle-foreground")} aria-hidden="true" />
          {s.label}
        </button>
      ))}
    </nav>
  );

  return (
    <div className="flex min-h-dvh">
      <aside className="hidden w-64 shrink-0 flex-col border-r border-border bg-surface-2 lg:flex">
        <div className="sticky top-0 flex h-dvh flex-col">
          <div className="flex h-[var(--header-height)] items-center border-b border-border px-5">
            <Logo />
          </div>
          <div className="px-3 py-5">
            <p className="eyebrow mb-2 px-3 text-subtle-foreground">მასწავლებლის ჟურნალი</p>
            {nav("grid gap-1")}
          </div>
          <div className="mt-auto space-y-5 border-t border-border p-5">
            <SheetsStatus status={sheets} onResync={resync} />
            <div className="space-y-1">
              <p className="eyebrow text-subtle-foreground">ექსპორტი</p>
              <Button variant="ghost" size="sm" className="w-full justify-start" onClick={() => exportCsv("students")}>
                <Download /> მოსწავლეები (CSV)
              </Button>
              <Button variant="ghost" size="sm" className="w-full justify-start" onClick={() => exportCsv("attempts")}>
                <Download /> ტესტები (CSV)
              </Button>
            </div>
            <div className="flex gap-1 border-t border-border pt-4">
              <Button variant="ghost" size="sm" className="flex-1 justify-start" onClick={onLogout}>
                <LogOut /> გასვლა
              </Button>
              <Button variant="ghost" size="icon-sm" onClick={() => theme.toggle()} aria-label={dark ? "ღია თემა" : "მუქი თემა"}>
                {dark ? <Sun /> : <Moon />}
              </Button>
            </div>
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* small screens: logo, actions and the section switch */}
        <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur-md lg:hidden">
          <div className="flex h-[var(--header-height)] items-center gap-2 px-4">
            <LogoMark className="size-7" />
            <span className="font-serif font-semibold">ჟურნალი</span>
            <div className="ml-auto flex gap-1">
              <Button variant="ghost" size="icon-sm" onClick={() => exportCsv("attempts")} aria-label="ტესტების ექსპორტი (CSV)">
                <Download />
              </Button>
              <Button variant="ghost" size="icon-sm" onClick={onLogout} aria-label="გასვლა">
                <LogOut />
              </Button>
            </div>
          </div>
          {nav("scrollbar-none flex gap-1 overflow-x-auto px-3 pb-2")}
        </header>

        <main id="main" tabIndex={-1} className="flex-1 px-4 py-10 sm:px-8 lg:px-12">
          <div className="mx-auto max-w-6xl">
            <header className="flex flex-wrap items-end justify-between gap-4 border-b-[1.5px] border-rule-ink pb-5">
              <div>
                <p className="eyebrow text-accent">მასწავლებლის ჟურნალი</p>
                <h1 className="mt-2 text-[2rem] leading-tight sm:text-[2.5rem]">{current.title}</h1>
              </div>
              <Button variant="secondary" size="sm" onClick={() => ov.reload()} disabled={ov.loading}>
                <RefreshCw className={cn(ov.loading && "animate-spin")} /> განახლება
              </Button>
            </header>
            <div className="mt-8">
              {section === "overview" &&
                (ov.error && ov.error.status !== 401 ? (
                  <Callout tone="danger" icon={TriangleAlert}>
                    {ov.error.message}
                  </Callout>
                ) : !ov.data ? (
                  <div className="grid gap-4">
                    <Skeleton className="h-28" />
                    <Skeleton className="h-60" />
                  </div>
                ) : (
                  <Overview data={ov.data} onAttempt={setAttempt} />
                ))}
              {section === "students" && <Students onStudent={setStudent} />}
              {section === "tests" && <Tests onAttempt={setAttempt} />}
            </div>
          </div>
        </main>
      </div>

      <StudentDrawer id={student} onClose={() => setStudent(null)} onAttempt={(id) => setAttempt(id)} />
      <AttemptDrawer id={attempt} onClose={() => setAttempt(null)} />
    </div>
  );
}

export default function TeacherPage() {
  const [authed, setAuthed] = useState(() => !!getToken());
  useEffect(() => {
    document.title = "მასწავლებლის ჟურნალი · მათემატიკა";
  }, []);
  const logout = useCallback(() => {
    setToken(null);
    setAuthed(false);
  }, []);
  return useMemo(() => (authed ? <Dashboard onLogout={logout} /> : <Login onDone={() => setAuthed(true)} />), [authed, logout]);
}
