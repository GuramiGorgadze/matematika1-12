import { ArrowLeft, LoaderCircle } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Breadcrumbs } from "@/components/layout/Container";
import { GRADE_TOOLS, TOOLS } from "@/content/grades";
import { StudentGate } from "@/features/student/registration";
import { ord } from "@/lib/format";
import NotFoundPage from "./NotFoundPage";

/* [html builder, mount function, root selector] from the original boards */
const BOARDS = {
  "tool-geo": (B) => [B.toolsHTML, B.mountTool, "#tool-general"],
  "tool-trig": (B) => [B.trigHTML, B.mountTrig, "#tool-trig"],
  "tool-3d": (B) => [B.tool3dHTML, B.mount3D, "#tool-3d"],
  "tool-vec": (B) => [B.toolVecHTML, B.mountVec, "#tool-vec"],
};

/** hosts one of the original imperative canvas boards inside React */
function BoardHost({ tool }) {
  const ref = useRef(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let alive = true;
    let inst = null;
    const host = ref.current;
    import("@/content/pack/boards.js").then((B) => {
      if (!alive || !host) return;
      const [html, mount, sel] = BOARDS[tool](B);
      host.innerHTML = html();
      inst = mount(host.querySelector(sel) || host.firstElementChild);
      setReady(true);
    });
    return () => {
      alive = false;
      try {
        inst?.destroy?.();
      } catch {
        /* board already gone */
      }
      if (host) host.innerHTML = "";
    };
  }, [tool]);
  return (
    <>
      {!ready && (
        <div className="grid h-80 place-items-center rounded-[var(--panel-radius)] border border-border bg-surface text-muted-foreground">
          <LoaderCircle className="size-6 animate-spin" aria-label="იტვირთება" />
        </div>
      )}
      <div className="mx">
        <div ref={ref} className="toolpage" />
      </div>
    </>
  );
}

function ToolView({ n, tool }) {
  const t = TOOLS[tool];
  useEffect(() => {
    document.title = `${t.title} · მათემატიკა`;
  }, [t]);
  return (
    <div className="px-4 py-10 sm:px-8 lg:px-12 xl:px-16">
      <div className="mx-auto max-w-6xl">
        <Breadcrumbs items={[{ label: `${ord(n)} კლასი`, to: `/grade/${n}` }, { label: "დაფები" }, { label: t.title }]} />
        <header className="mt-8 border-b border-border pb-6">
          <p className="eyebrow text-accent">ინტერაქტიული დაფა</p>
          <h1 className="mt-2 text-[2rem] leading-tight sm:text-[2.5rem]">{t.title}</h1>
          <p className="mt-2 max-w-2xl font-serif text-[1.0625rem] leading-relaxed text-muted-foreground">{t.desc}</p>
        </header>
        <div className="mt-8">
          <BoardHost tool={tool} />
        </div>
        <Link to={`/grade/${n}`} className="mt-10 inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground transition-colors hover:text-accent">
          <ArrowLeft className="size-4" aria-hidden="true" /> {ord(n)} კლასის სარჩევი
        </Link>
      </div>
    </div>
  );
}

export default function ToolPage() {
  const { n: ns, tool } = useParams();
  const n = Number(ns);
  if (!(n >= 1 && n <= 12) || !TOOLS[tool] || !(GRADE_TOOLS[n] || []).includes(tool)) return <NotFoundPage />;
  return (
    <StudentGate>
      <ToolView key={tool} n={n} tool={tool} />
    </StudentGate>
  );
}
