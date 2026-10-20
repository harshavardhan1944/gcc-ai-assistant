import { useEffect, useState } from "react";
import { MapPin, Moon, Sun } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useAdvisor } from "@/lib/advisor";

export function useTheme() {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    const saved = localStorage.getItem("gcc-theme");
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const apply = (d: boolean) => {
      document.documentElement.classList.toggle("dark", d);
      setDark(d);
    };
    apply(saved ? saved === "dark" : mq.matches);
    const on = (e: MediaQueryListEvent) => !localStorage.getItem("gcc-theme") && apply(e.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  const toggle = () => {
    const d = !dark;
    localStorage.setItem("gcc-theme", d ? "dark" : "light");
    document.documentElement.classList.toggle("dark", d);
    setDark(d);
  };
  return { dark, toggle };
}

export function ThemeToggle() {
  const { dark, toggle } = useTheme();
  return (
    <button
      onClick={toggle}
      aria-label={dark ? "Switch to light theme" : "Switch to dark theme"}
      className="rounded-full border p-2 text-muted-foreground transition-colors duration-150 hover:text-foreground"
    >
      {dark ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
}

export function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2">
      <MapPin size={22} className="text-brand" aria-hidden />
      <span className="font-serif text-[22px] font-semibold leading-none">GCC Atlas</span>
      <span className="hidden text-[13px] text-muted-foreground sm:inline">Location Advisor</span>
    </Link>
  );
}

export function TopBar() {
  const { aiAvailable, setFlexOpen } = useAdvisor();
  return (
    <header className="sticky top-0 z-40 h-16 border-b bg-card/95 backdrop-blur">
      <div className="mx-auto flex h-full max-w-[1360px] items-center gap-4 px-4 sm:px-6">
        <Logo />
        <div className="hidden flex-1 justify-center gap-2 md:flex">
          {["6 metros", "Pay data Aug 2026 · Rents 2025", aiAvailable ? "AI on" : "AI off"].map((c) => (
            <span key={c} className="rounded-full border px-3 py-1 text-[12px] text-muted-foreground">
              {c}
            </span>
          ))}
        </div>
        <div className="ml-auto flex items-center gap-2">
          <ThemeToggle />
          <button
            onClick={() => setFlexOpen(true)}
            className="rounded-full bg-brand px-4 py-2 text-[13px] font-semibold text-primary-foreground transition-opacity duration-150 hover:opacity-90"
          >
            Talk to Flexiple
          </button>
        </div>
      </div>
    </header>
  );
}
