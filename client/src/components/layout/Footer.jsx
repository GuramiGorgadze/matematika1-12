import { Link } from "react-router-dom";
import { LogoMark } from "@/components/brand/Logo";
import { cn } from "@/lib/cn";
import { Container } from "./Container";

const COLUMNS = [
  {
    title: "სარჩევი",
    links: [
      ["/grades", "ყველა კლასი"],
      ["/grade/1", "დაწყებითი · 1–6"],
      ["/grade/7", "საბაზო · 7–9"],
      ["/grade/10", "საშუალო · 10–12"],
    ],
  },
  {
    title: "სხვა",
    links: [
      ["/grade/12", "ეროვნული გამოცდები"],
      ["/profile", "ჩემი პროფილი"],
      ["/teacher", "მასწავლებლისთვის"],
    ],
  },
];

/** colophon */
export function Footer({ compact = false }) {
  const Wrap = compact ? "div" : Container;
  return (
    <footer className={cn("border-t border-border", compact && "mt-16")}>
      <Wrap className={cn("grid gap-10 py-12 md:grid-cols-[1.6fr_1fr_1fr]", compact && "px-4 sm:px-6 lg:px-10")}>
        <div className="max-w-sm">
          <div className="flex items-center gap-2.5">
            <LogoMark className="size-7" />
            <span className="font-serif text-lg font-semibold">მათემატიკა</span>
          </div>
          <p className="mt-3 font-serif text-[0.9375rem] leading-relaxed text-muted-foreground">
            მათემატიკის სახელმძღვანელო 1-ლიდან მე-12 კლასამდე: წესები, დამტკიცებები, ამოცანები მყისიერი შემოწმებით და ტესტები.
          </p>
        </div>
        {COLUMNS.map((c) => (
          <nav key={c.title} aria-label={c.title}>
            <p className="eyebrow text-subtle-foreground">{c.title}</p>
            <ul className="mt-3 space-y-2 text-sm">
              {c.links.map(([to, label]) => (
                <li key={to}>
                  <Link to={to} className="text-muted-foreground transition-colors hover:text-accent">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </Wrap>
      <Wrap className={cn(compact && "px-4 sm:px-6 lg:px-10")}>
        <div className="flex flex-wrap justify-between gap-2 border-t border-border py-5 text-xs text-subtle-foreground">
          <span>© {new Date().getFullYear()} მათემატიკა</span>
          <span className="font-serif italic">აწყობილია შრიფტებით Noto Serif Georgian და Noto Sans Georgian.</span>
        </div>
      </Wrap>
    </footer>
  );
}
