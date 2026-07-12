"use client";

import { MoreHorizontal, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { ColorAccentPicker } from "@/components/layout/ColorAccentPicker";
import {
  NavigationLink,
  useNavigationState,
} from "@/components/layout/NavigationProvider";
import { navigationItems } from "@/components/layout/navigationItems";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { cn } from "@/shared/utils/cn";

const primaryMobileHrefs = new Set([
  "/dashboard",
  "/dashboard/reunion-semanal",
  "/dashboard/reunion-fin-semana",
  "/dashboard/servicio",
]);

const mobileLabels: Record<string, string> = {
  "/dashboard/reunion-semanal": "Semanal",
  "/dashboard/reunion-fin-semana": "Fin de semana",
};

export function MobileNavigation() {
  const { activePath } = useNavigationState();
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const moreButtonRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const closingForNavigationRef = useRef(false);

  useEffect(() => {
    if (!isMoreOpen) return;
    const previousOverflow = document.body.style.overflow;
    const returnFocusTarget = moreButtonRef.current;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();
    const handleDialogKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsMoreOpen(false);
      if (event.key !== "Tab") return;
      const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      if (!focusable?.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", handleDialogKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleDialogKey);
      if (!closingForNavigationRef.current) returnFocusTarget?.focus();
      closingForNavigationRef.current = false;
    };
  }, [isMoreOpen]);

  const primaryItems = navigationItems.filter((item) =>
    primaryMobileHrefs.has(item.href),
  );
  const secondaryItems = navigationItems.filter(
    (item) => !primaryMobileHrefs.has(item.href),
  );

  function isActive(href: string) {
    return activePath === href || (href !== "/dashboard" && activePath.startsWith(href));
  }

  const isMoreActive = secondaryItems.some((item) => isActive(item.href));

  return (
    <>
      {isMoreOpen && (
        <button
          type="button"
          aria-label="Cerrar menú"
          className="fixed inset-0 z-20 bg-black/35 lg:hidden"
          onClick={() => setIsMoreOpen(false)}
        />
      )}

      {isMoreOpen && (
        <div ref={dialogRef} id="mobile-more-menu" className="app-card fixed inset-x-3 bottom-[calc(5.75rem+env(safe-area-inset-bottom))] z-30 max-h-[min(70dvh,36rem)] overflow-y-auto lg:hidden" role="dialog" aria-modal="true" aria-labelledby="mobile-more-title">
          <div className="flex min-h-14 items-center justify-between border-b border-[var(--border)] px-4">
            <p id="mobile-more-title" className="text-base font-semibold text-[var(--foreground)]">
              Más secciones
            </p>
            <div className="flex items-center gap-1">
              <ColorAccentPicker
                className="text-[var(--foreground)]"
                menuPlacement="bottom"
              />
              <ThemeToggle className="text-[var(--foreground)]" />
              <button
                ref={closeButtonRef}
                type="button"
                aria-label="Cerrar menú"
                className="flex size-11 items-center justify-center rounded-full text-[var(--foreground)] hover:bg-[var(--surface-muted)]"
                onClick={() => setIsMoreOpen(false)}
              >
                <X className="size-5" aria-hidden="true" />
              </button>
            </div>
          </div>
          <div className="grid grid-cols-2">
            {secondaryItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);

              return (
                <NavigationLink
                  key={item.href}
                  href={item.href}
                  onClick={() => {
                    closingForNavigationRef.current = true;
                    setIsMoreOpen(false);
                  }}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex min-h-16 items-center gap-3 border-b border-[var(--border)] px-4 text-sm text-[var(--foreground)] transition hover:bg-[var(--surface-muted)]",
                    active && "bg-[var(--primary)] text-white [&_*]:text-white",
                  )}
                >
                  <Icon
                    className={cn(
                      "size-5 stroke-[1.7] text-[var(--muted)]",
                      active && "text-[var(--primary-strong)]",
                    )}
                    aria-hidden="true"
                  />
                  <span>{item.label}</span>
                </NavigationLink>
              );
            })}
          </div>
        </div>
      )}

      <nav
        className="fixed inset-x-3 bottom-3 z-40 rounded-[1.25rem] border border-[var(--border)] bg-[var(--app-bar-muted)] px-2 pb-[max(0.45rem,env(safe-area-inset-bottom))] pt-1 shadow-[var(--card-shadow)] lg:hidden"
        aria-label="Navegación móvil"
      >
        <div className="grid grid-cols-5 items-end">
          {primaryItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);

            return (
              <NavigationLink
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex min-h-16 flex-col items-center justify-end gap-0.5 px-1 text-[0.68rem] font-medium text-[var(--foreground)]",
                  active && "text-[var(--primary-strong)]",
                )}
              >
                <span
                  className={cn(
                    "flex size-10 items-center justify-center rounded-full text-[var(--muted)] transition",
                    active && "bg-[var(--primary)] text-white",
                  )}
                >
                  <Icon className="size-6 stroke-[1.6]" aria-hidden="true" />
                </span>
                <span className="max-w-[4.5rem] truncate">
                  {mobileLabels[item.href] ?? item.label}
                </span>
              </NavigationLink>
            );
          })}
          <button
            ref={moreButtonRef}
            type="button"
            aria-label="Abrir más secciones"
            aria-expanded={isMoreOpen}
            aria-controls="mobile-more-menu"
            className={cn(
              "flex min-h-16 flex-col items-center justify-end gap-0.5 px-1 text-[0.68rem] font-medium text-[var(--foreground)]",
              (isMoreOpen || isMoreActive) && "text-[var(--primary-strong)]",
            )}
            onClick={() => setIsMoreOpen((value) => !value)}
          >
            <span
              className={cn(
                "flex size-10 items-center justify-center rounded-full text-[var(--muted)] transition",
                (isMoreOpen || isMoreActive) &&
                  "bg-[var(--primary)] text-white",
              )}
            >
              <MoreHorizontal className="size-6 stroke-[1.6]" aria-hidden="true" />
            </span>
            <span>Más</span>
          </button>
        </div>
      </nav>
    </>
  );
}
