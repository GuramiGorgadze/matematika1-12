import { Suspense, useEffect } from "react";
import { Outlet, ScrollRestoration, useLocation, useNavigate } from "react-router-dom";
import { Toaster } from "sonner";
import { Skeleton, TooltipProvider } from "@/components/ui/misc";
import { RegistrationDialogHost } from "@/features/student/registration";
import { useDarkMode } from "@/lib/theme";
import { Container } from "./Container";
import { Footer } from "./Footer";
import { SiteHeader } from "./SiteHeader";

export function PageSkeleton({ bare = false }) {
  const body = (
    <div aria-busy="true" aria-label="იტვირთება">
      <Skeleton className="h-3.5 w-40" />
      <Skeleton className="mt-6 h-11 w-2/3 max-w-xl" />
      <Skeleton className="mt-4 h-4 w-1/2 max-w-md" />
      <div className="mt-12 space-y-4">
        {Array.from({ length: 5 }, (_, i) => (
          <Skeleton key={i} className="h-14" />
        ))}
      </div>
    </div>
  );
  return bare ? <div className="px-4 py-10 sm:px-6 lg:px-12">{body}</div> : <Container className="py-12">{body}</Container>;
}

/* links from the original single-file app looked like #klasi-7/t2/3 — keep them working */
function LegacyHashRedirect() {
  const { hash } = useLocation();
  const navigate = useNavigate();
  useEffect(() => {
    const m = /^#klasi-(\d{1,2})(?:\/([a-z0-9-]+)(?:\/(\d{1,2}|test))?)?$/.exec(hash);
    if (m) {
      const [, n, seg, sub] = m;
      if (!seg) navigate(`/grade/${n}`, { replace: true });
      else if (seg.startsWith("tool-")) navigate(`/grade/${n}/tools/${seg}`, { replace: true });
      else if (seg.startsWith("ex-")) navigate(`/grade/12/exam/${seg.slice(3)}`, { replace: true });
      else navigate(`/grade/${n}/${seg}${sub ? `/${sub}` : ""}`, { replace: true });
    } else if (hash === "#profili") navigate("/profile", { replace: true });
    else if (hash === "#mastsavlebeli") navigate("/teacher", { replace: true });
  }, [hash, navigate]);
  return null;
}

/** providers and global hosts shared by every layout */
export function RootShell() {
  const dark = useDarkMode();
  return (
    <TooltipProvider>
      <a href="#main" className="sr-only z-[60] rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground focus:not-sr-only focus:fixed focus:left-4 focus:top-3">
        გადასვლა შიგთავსზე
      </a>
      <Outlet />
      <RegistrationDialogHost />
      <LegacyHashRedirect />
      <ScrollRestoration getKey={(location) => location.pathname} />
      <Toaster
        position="bottom-center"
        theme={dark ? "dark" : "light"}
        closeButton
        gap={10}
        toastOptions={{
          style: {
            fontFamily: "var(--typeface-sans)",
            background: "var(--surface)",
            color: "var(--foreground)",
            border: "1px solid var(--border-strong)",
            borderRadius: "var(--panel-radius)",
            boxShadow: "var(--elevation-lg)",
          },
          classNames: { success: "[&_[data-icon]]:!text-success", error: "[&_[data-icon]]:!text-danger", warning: "[&_[data-icon]]:!text-warning", description: "!text-muted-foreground" },
        }}
      />
    </TooltipProvider>
  );
}

/** pages that read like the cover and front matter: header, centred content, colophon */
export function SiteLayout() {
  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />
      <main id="main" className="flex-1" tabIndex={-1}>
        <Suspense fallback={<PageSkeleton />}>
          <Outlet />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}
