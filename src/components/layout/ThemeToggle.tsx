"use client";

import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { updateUserPreferences } from "@/features/settings/actions/preferences";
import {
  isThemePreference,
  type ThemePreference,
} from "@/features/settings/types/preferences";
import { cn } from "@/shared/utils/cn";

type Theme = ThemePreference;
const defaultTheme: Theme = "light";

function applyTheme(theme: Theme) {
  document.documentElement.classList.toggle("dark", theme === "dark");
  document.documentElement.dataset.theme = theme;
}

export function ThemeToggle({
  className,
  initialTheme,
}: {
  className?: string;
  initialTheme?: Theme;
}) {
  const [theme, setTheme] = useState<Theme>(initialTheme ?? defaultTheme);

  useEffect(() => {
    const domTheme = document.documentElement.dataset.theme;
    if (!initialTheme && isThemePreference(domTheme) && domTheme !== theme) {
      const frame = window.requestAnimationFrame(() => setTheme(domTheme));
      return () => window.cancelAnimationFrame(frame);
    }
    applyTheme(theme);
    window.localStorage.setItem("theme", theme);
  }, [initialTheme, theme]);

  useEffect(() => {
    function handleThemeChange(event: Event) {
      const next = (event as CustomEvent<Theme>).detail;
      if (isThemePreference(next)) setTheme(next);
    }

    window.addEventListener("themechange", handleThemeChange);

    return () => {
      window.removeEventListener("themechange", handleThemeChange);
    };
  }, []);

  function toggleTheme() {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    window.localStorage.setItem("theme", nextTheme);
    applyTheme(nextTheme);
    window.dispatchEvent(new CustomEvent<Theme>("themechange", { detail: nextTheme }));
    void updateUserPreferences({ theme: nextTheme });
  }

  const label =
    theme === "dark" ? "Cambiar a tema claro" : "Cambiar a tema oscuro";
  const Icon = theme === "dark" ? Sun : Moon;

  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={toggleTheme}
      className={cn(
        "flex size-11 items-center justify-center rounded-full text-current transition hover:bg-current/10 active:scale-[0.98]",
        className,
      )}
    >
      <Icon className="size-6" aria-hidden="true" />
    </button>
  );
}
