import { ArrowLeft } from "lucide-react";
import { useEffect } from "react";
import { ButtonLink } from "@/components/ui/button";

/** a missing page: a blank leaf with its number */
export default function NotFoundPage() {
  useEffect(() => {
    document.title = "გვერდი ვერ მოიძებნა · მათემატიკა";
  }, []);
  return (
    <div className="flex flex-col items-center px-4 py-24 text-center">
      <div className="relative">
        <div className="absolute inset-0 translate-x-2.5 translate-y-2.5 rotate-[2.5deg] rounded-[var(--panel-radius)] border border-border bg-surface-2" aria-hidden="true" />
        <div className="relative flex h-56 w-44 flex-col justify-between rounded-[var(--panel-radius)] border border-border bg-surface px-5 py-4 shadow-md">
          <span className="eyebrow self-start text-subtle-foreground">გვერდი</span>
          <span className="num font-display text-6xl font-medium text-accent">404</span>
          <span className="h-px w-full bg-border" aria-hidden="true" />
        </div>
      </div>
      <h1 className="mt-12 text-[2rem] leading-tight">ეს გვერდი წიგნში არ არის</h1>
      <p className="mt-3 max-w-md font-serif text-[1.0625rem] leading-relaxed text-muted-foreground">შესაძლოა ბმული შეიცვალა. დაბრუნდი სარჩევზე და აირჩიე სასურველი თემა.</p>
      <ButtonLink to="/grades" className="mt-8" variant="secondary">
        <ArrowLeft aria-hidden="true" /> სარჩევზე დაბრუნება
      </ButtonLink>
    </div>
  );
}
