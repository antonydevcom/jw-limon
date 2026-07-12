"use client";

import { Palette } from "lucide-react";
import { useEffect, useState } from "react";
import { updateUserPreferences } from "@/features/settings/actions/preferences";
import {
  accentPreferences,
  type AccentPreference,
  isAccentPreference,
} from "@/features/settings/types/preferences";
import { cn } from "@/shared/utils/cn";

type Accent = AccentPreference;
type MenuPlacement = "top" | "bottom";
const defaultAccent: Accent = "purple";

const accents: Array<{ value: Accent; label: string; swatchClassName: string }> = [
  { value: "purple", label: "Morado",  swatchClassName: "accent-swatch-purple" },
  { value: "green",  label: "Verde",   swatchClassName: "accent-swatch-green"  },
  { value: "blue",   label: "Azul",    swatchClassName: "accent-swatch-blue"   },
  { value: "pink",   label: "Rosa",    swatchClassName: "accent-swatch-pink"   },
  { value: "orange", label: "Naranja", swatchClassName: "accent-swatch-orange" },
];

function applyAccent(accent: Accent) {
  document.documentElement.dataset.accent = accent;
}

function isAccent(value: unknown): value is Accent {
  return accentPreferences.includes(value as Accent);
}

export function ColorAccentPicker({
  className,
  menuPlacement = "top",
  initialAccent,
}: {
  className?: string;
  menuPlacement?: MenuPlacement;
  initialAccent?: Accent;
}) {
  const [accent, setAccent] = useState<Accent>(initialAccent ?? defaultAccent);
  const [open, setOpen] = useState(false);
  const activeAccent = accents.find((a) => a.value === accent) ?? accents[0];

  useEffect(() => {
    const domAccent = document.documentElement.dataset.accent;
    if (!initialAccent && isAccentPreference(domAccent) && domAccent !== accent) {
      const frame = window.requestAnimationFrame(() => setAccent(domAccent));
      return () => window.cancelAnimationFrame(frame);
    }
    applyAccent(accent);
    window.localStorage.setItem("accent", accent);
  }, [accent, initialAccent]);

  useEffect(() => {
    function handleAccentChange(event: Event) {
      const next = (event as CustomEvent<Accent>).detail;
      if (isAccent(next)) setAccent(next);
    }
    window.addEventListener("accentchange", handleAccentChange);
    return () => window.removeEventListener("accentchange", handleAccentChange);
  }, []);

  function selectAccent(next: Accent) {
    setAccent(next);
    window.localStorage.setItem("accent", next);
    applyAccent(next);
    window.dispatchEvent(new CustomEvent<Accent>("accentchange", { detail: next }));
    void updateUserPreferences({ accent: next });
    setOpen(false);
  }

  const menuPosition =
    menuPlacement === "bottom"
      ? "top-full mt-2 right-0 lg:bottom-full lg:left-1/2 lg:right-auto lg:top-auto lg:mb-2 lg:mt-0 lg:-translate-x-1/2"
      : "bottom-full mb-2 left-1/2 -translate-x-1/2";

  return (
    <div className="relative">
      <button
        type="button"
        aria-label="Cambiar color de estilo"
        aria-expanded={open}
        title="Cambiar color de estilo"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex size-11 items-center justify-center rounded-full text-current transition hover:bg-current/10 active:scale-[0.98]",
          className,
        )}
      >
        <span
          className={cn(
            "flex size-5 items-center justify-center rounded-full",
            activeAccent.swatchClassName,
          )}
          aria-hidden="true"
        >
          <Palette className="size-3.5 text-white" aria-hidden="true" />
        </span>
      </button>

      {open && (
        <div
          className={cn(
            "absolute z-50 rounded-[var(--card-radius)] border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 shadow-[var(--card-shadow)]",
            menuPosition,
          )}
        >
          <p className="mb-2.5 whitespace-nowrap text-xs font-semibold text-[var(--muted)]">
            Color de estilo
          </p>
          <div className="flex justify-center gap-2">
            {accents.map((item) => (
              <button
                key={item.value}
                type="button"
                aria-label={item.label}
                aria-pressed={item.value === accent}
                title={item.label}
                onClick={() => selectAccent(item.value)}
                className={cn(
                  "size-8 rounded-full transition hover:scale-110 active:scale-95",
                  item.swatchClassName,
                  item.value === accent &&
                    "ring-2 ring-[var(--primary)] ring-offset-2 ring-offset-[var(--surface)]",
                )}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
