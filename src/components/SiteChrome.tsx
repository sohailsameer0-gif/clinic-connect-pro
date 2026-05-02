import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Stethoscope, Sun, Moon, Bell, Menu, LogOut, User, LayoutDashboard, Building2, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useAuth, useIsAdmin, useIsClinicUser } from "@/lib/auth/AuthProvider";
import { useTheme } from "@/lib/theme/ThemeProvider";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import NotificationBell from "@/components/NotificationBell";

const NAV = [
  { to: "/", label: "Home" },
  { to: "/search", label: "Find Care" },
  { to: "/clinics", label: "Clinics" },
  { to: "/about", label: "About" },
  { to: "/contact", label: "Contact" },
];

export function Header() {
  const { user, signOut } = useAuth();
  const isAdmin = useIsAdmin();
  const isClinic = useIsClinicUser();
  const { theme, toggle } = useTheme();
  const navigate = useNavigate();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = useState(false);

  const dashboardLink = isAdmin ? "/admin" : isClinic ? "/clinic" : "/patient";

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center gap-4 px-4">
        <Link to="/" className="flex items-center gap-2 font-semibold">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-hero text-primary-foreground shadow-glow">
            <Stethoscope className="h-5 w-5" />
          </span>
          <span className="text-lg tracking-tight">MediBook</span>
        </Link>

        <nav className="ml-6 hidden items-center gap-1 md:flex">
          {NAV.map((item) => {
            const active = path === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`relative rounded-md px-3 py-2 text-sm font-medium transition ${
                  active ? "text-primary" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {item.label}
                {active && (
                  <motion.span
                    layoutId="nav-underline"
                    className="absolute inset-x-2 -bottom-0.5 h-0.5 rounded-full bg-primary"
                  />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={toggle} aria-label="Toggle theme">
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>

          {user ? (
            <>
              <NotificationBell />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="gap-2 px-2">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-primary/10 text-primary text-xs">
                        {(user.email ?? "U").slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="hidden max-w-[140px] truncate text-sm md:inline">{user.email}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate({ to: dashboardLink })}>
                    <LayoutDashboard className="mr-2 h-4 w-4" />
                    Dashboard
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate({ to: "/patient/profile" })}>
                    <User className="mr-2 h-4 w-4" />
                    Profile
                  </DropdownMenuItem>
                  {isClinic && (
                    <DropdownMenuItem onClick={() => navigate({ to: "/clinic" })}>
                      <Building2 className="mr-2 h-4 w-4" />
                      Clinic Panel
                    </DropdownMenuItem>
                  )}
                  {isAdmin && (
                    <DropdownMenuItem onClick={() => navigate({ to: "/admin" })}>
                      <ShieldCheck className="mr-2 h-4 w-4" />
                      Admin Panel
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={async () => {
                      await signOut();
                      navigate({ to: "/" });
                    }}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <div className="hidden items-center gap-2 md:flex">
              <Button variant="ghost" onClick={() => navigate({ to: "/login" })}>
                Log in
              </Button>
              <Button onClick={() => navigate({ to: "/signup" })} className="shadow-soft">
                Get started
              </Button>
            </div>
          )}

          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden" aria-label="Open menu">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72">
              <div className="mt-8 flex flex-col gap-2">
                {NAV.map((item) => (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={() => setOpen(false)}
                    className="rounded-md px-3 py-2 text-sm font-medium hover:bg-accent"
                  >
                    {item.label}
                  </Link>
                ))}
                {!user && (
                  <>
                    <div className="my-2 h-px bg-border" />
                    <Button variant="outline" onClick={() => { setOpen(false); navigate({ to: "/login" }); }}>
                      Log in
                    </Button>
                    <Button onClick={() => { setOpen(false); navigate({ to: "/signup" }); }}>
                      Get started
                    </Button>
                  </>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}

export function Footer() {
  return (
    <footer className="border-t border-border/60 bg-muted/40">
      <div className="container mx-auto grid gap-10 px-4 py-12 md:grid-cols-4">
        <div className="md:col-span-2">
          <Link to="/" className="flex items-center gap-2 font-semibold">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-hero text-primary-foreground">
              <Stethoscope className="h-5 w-5" />
            </span>
            <span className="text-lg">MediBook</span>
          </Link>
          <p className="mt-4 max-w-md text-sm text-muted-foreground">
            Trusted multi-clinic appointment booking for dentists and doctors. Find verified care, book in seconds, and manage every visit in one place.
          </p>
        </div>
        <div>
          <h4 className="mb-3 text-sm font-semibold">Patients</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link to="/search" className="hover:text-foreground">Find a clinic</Link></li>
            <li><Link to="/signup" className="hover:text-foreground">Create account</Link></li>
            <li><Link to="/about" className="hover:text-foreground">How it works</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="mb-3 text-sm font-semibold">Clinics</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link to="/for-clinics" className="hover:text-foreground">List your clinic</Link></li>
            <li><Link to="/contact" className="hover:text-foreground">Contact sales</Link></li>
            <li><Link to="/terms" className="hover:text-foreground">Terms</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border/60 py-6 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} MediBook. Healthcare, made effortless.
      </div>
    </footer>
  );
}
