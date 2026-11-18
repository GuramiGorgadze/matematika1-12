import { Suspense, useEffect, useState } from "react";
import { Outlet, useLocation, useParams } from "react-router-dom";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { BookContents } from "@/features/book/BookContents";
import { PageSkeleton } from "./AppShell";
import { Footer } from "./Footer";
import { SiteHeader } from "./SiteHeader";

/**
 * The book: the grade's table of contents on the left (a sheet on small screens), the page on the right.
 * Loaded lazily with the curriculum.
 */
export default function BookLayout() {
  const n = Number(useParams().n);
  const valid = n >= 1 && n <= 12;
  const [tocOpen, setTocOpen] = useState(false);
  const { pathname } = useLocation();
  useEffect(() => setTocOpen(false), [pathname]);

  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader fluid onOpenContents={valid ? () => setTocOpen(true) : undefined} />
      <div className="flex flex-1">
        {valid && (
          <aside aria-label="კლასის სარჩევი" className="hidden w-[var(--sidebar-width)] shrink-0 border-r border-border bg-[var(--sidebar-bg)] lg:block">
            <div className="scrollbar-thin sticky top-[var(--header-height)] h-[calc(100dvh-var(--header-height))] overflow-y-auto overscroll-contain">
              <BookContents n={n} />
            </div>
          </aside>
        )}
        <div className="flex min-w-0 flex-1 flex-col">
          <main id="main" className="flex-1" tabIndex={-1}>
            <Suspense fallback={<PageSkeleton bare />}>
              <Outlet />
            </Suspense>
          </main>
          <Footer compact />
        </div>
      </div>
      {valid && (
        <Dialog open={tocOpen} onOpenChange={setTocOpen}>
          <DialogContent side="left" className="bg-[var(--sidebar-bg)] p-0">
            <DialogTitle className="sr-only">სარჩევი</DialogTitle>
            <BookContents n={n} onNavigate={() => setTocOpen(false)} />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
