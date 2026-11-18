import { BookOpen, ChartColumn, LogIn, LogOut, Menu, Moon, PanelLeft, Sun, UserPen } from "lucide-react";
import { useEffect, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Tooltip } from "@/components/ui/misc";
import { openRegistration } from "@/features/student/registration";
import { session, useSession } from "@/features/student/session";
import { cn } from "@/lib/cn";
import { initials, ord } from "@/lib/format";
import { theme, useDarkMode } from "@/lib/theme";

function navItems(student) {
  return [{ to: "/grades", label: "კლასები", end: true }, student && { to: `/grade/${student.grade}`, label: "ჩემი კლასი" }, student && { to: "/profile", label: "პროფილი" }].filter(Boolean);
}

function NavItem({ to, end, children }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        cn(
          "relative flex h-[var(--header-height)] items-center px-3 text-sm font-semibold transition-colors",
          "after:absolute after:inset-x-3 after:bottom-0 after:h-0.5 after:origin-left after:bg-accent after:transition-transform after:duration-200",
          isActive ? "text-foreground after:scale-x-100" : "text-muted-foreground after:scale-x-0 hover:text-foreground",
        )
      }
    >
      {children}
    </NavLink>
  );
}

function ThemeButton({ className }) {
  const dark = useDarkMode();
  return (
    <Tooltip content={dark ? "ღია თემა" : "მუქი თემა"}>
      <Button variant="ghost" size="icon" className={className} onClick={() => theme.toggle()} aria-label={dark ? "ღია თემაზე გადართვა" : "მუქ თემაზე გადართვა"}>
        {dark ? <Sun /> : <Moon />}
      </Button>
    </Tooltip>
  );
}

function StudentMenu({ student }) {
  const navigate = useNavigate();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="flex h-10 items-center gap-2.5 rounded-full py-1 pl-1 pr-1 transition-colors hover:bg-surface-2 sm:pr-3 focus-visible:outline-2 focus-visible:outline-ring"
        >
          <span className="grid size-8 place-items-center rounded-full border border-foreground/80 font-serif text-[0.8125rem] font-semibold" aria-hidden="true">
            {initials(student.firstName, student.lastName)}
          </span>
          <span className="hidden text-left leading-tight sm:block">
            <span className="block text-sm font-semibold">{student.firstName}</span>
            <span className="block text-[0.6875rem] text-subtle-foreground">{ord(student.grade)} კლასი</span>
          </span>
          <span className="sr-only">პროფილის მენიუ</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuLabel>
          <p className="font-serif text-base font-semibold">
            {student.firstName} {student.lastName}
          </p>
          <p className="text-xs text-subtle-foreground">
            {ord(student.grade)} კლასი · {student.school}
          </p>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => navigate("/profile")}>
          <ChartColumn /> პროფილი და პროგრესი
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => navigate(`/grade/${student.grade}`)}>
          <BookOpen /> ჩემი კლასი
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => openRegistration({ edit: true })}>
          <UserPen /> მონაცემების შეცვლა
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onSelect={() => {
            session.clear();
            navigate("/");
          }}
        >
          <LogOut /> გამოსვლა
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function MobileMenu({ student }) {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  useEffect(() => setOpen(false), [pathname]);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setOpen(true)} aria-label="მენიუ">
        <Menu />
      </Button>
      <DialogContent side="right" className="max-w-xs p-0">
        <DialogTitle className="sr-only">მენიუ</DialogTitle>
        <div className="flex h-[var(--header-height)] items-center border-b border-border px-5">
          <Logo />
        </div>
        <nav aria-label="მთავარი მენიუ" className="flex flex-col p-3">
          {navItems(student).map((it) => (
            <NavLink
              key={it.to}
              to={it.to}
              end={it.end}
              className={({ isActive }) =>
                cn("flex min-h-12 items-center rounded-md px-3 font-serif text-lg", isActive ? "bg-surface-2 text-foreground" : "text-muted-foreground hover:bg-surface-2 hover:text-foreground")
              }
            >
              {it.label}
            </NavLink>
          ))}
          <NavLink to="/teacher" className="flex min-h-12 items-center rounded-md px-3 font-serif text-lg text-muted-foreground hover:bg-surface-2 hover:text-foreground">
            მასწავლებლისთვის
          </NavLink>
        </nav>
        {!student && (
          <div className="mt-auto border-t border-border p-4">
            <Button
              className="w-full"
              onClick={() => {
                setOpen(false);
                openRegistration();
              }}
            >
              <LogIn aria-hidden="true" /> შესვლა
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

/**
 * The running head of every page. `fluid` spans the full width (book layout, where the contents
 * sidebar sits under it); `onOpenContents` adds the contents button for screens without the sidebar.
 */
export function SiteHeader({ fluid = false, onOpenContents }) {
  const { student } = useSession();
  return (
    <header className="sticky top-0 z-40 h-[var(--header-height)] border-b border-border bg-background/90 backdrop-blur-md supports-[backdrop-filter]:bg-background/80">
      <div className={cn("flex h-full items-center gap-2", fluid ? "px-3 sm:px-5" : "mx-auto max-w-[var(--content-max)] px-4 sm:px-6 lg:px-10")}>
        {onOpenContents && (
          <Tooltip content="სარჩევი">
            <Button variant="ghost" size="icon" className="-ml-1 lg:hidden" onClick={onOpenContents} aria-label="სარჩევის გახსნა">
              <PanelLeft />
            </Button>
          </Tooltip>
        )}
        <Logo />
        <nav aria-label="მთავარი მენიუ" className="ml-6 hidden h-full items-center md:flex">
          {navItems(student).map((it) => (
            <NavItem key={it.to} to={it.to} end={it.end}>
              {it.label}
            </NavItem>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-1">
          <ThemeButton />
          {student ? (
            <StudentMenu student={student} />
          ) : (
            <Button onClick={() => openRegistration()} size="sm" className="hidden px-4 sm:inline-flex">
              <LogIn aria-hidden="true" /> შესვლა
            </Button>
          )}
          <MobileMenu student={student} />
        </div>
      </div>
    </header>
  );
}
