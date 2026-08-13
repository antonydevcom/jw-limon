import Link from "next/link";
import type { ReactNode } from "react";
import { Citrus, LogIn, LogOut } from "lucide-react";
import { logoutUser } from "@/features/admin-auth/actions";
import { DesktopNavigation } from "@/components/layout/DesktopNavigation";
import { MobileNavigation } from "@/components/layout/MobileNavigation";
import { NavigationProvider } from "@/components/layout/NavigationProvider";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import type { ThemePreference } from "@/features/settings/types/preferences";

export function AppShell({
  children,
  initialTheme,
  isAuthenticated = false,
}: {
  children: ReactNode;
  initialTheme?: ThemePreference;
  isAuthenticated?: boolean;
}) {
  return (
    <NavigationProvider>
    <div className="min-h-[100dvh] bg-[var(--shell-gradient)] pb-24 lg:pb-0">
      <aside className="fixed inset-y-4 left-4 hidden w-80 overflow-hidden rounded-[1.25rem] border border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] shadow-[var(--sidebar-shadow)] lg:block">
        <div className="flex h-full flex-col">
          <Link
            href="/dashboard"
            className="m-4 flex min-h-24 items-center gap-4 rounded-[1rem] bg-[var(--sidebar-inner)] px-5 text-[var(--foreground)] transition hover:bg-[var(--surface-muted)]"
          >
            <span className="flex size-14 shrink-0 items-center justify-center rounded-full bg-[var(--primary-soft)] text-[var(--primary)]">
              <Citrus className="size-7 stroke-[1.8]" aria-hidden="true" />
            </span>
            <span className="min-w-0">
              <span className="block text-2xl font-bold leading-none text-[var(--foreground)]">
                El Limón
              </span>
              <span className="mt-1 block truncate text-sm font-medium text-[var(--muted)]">
                Congregación
              </span>
            </span>
          </Link>
          <div className="min-h-0 flex-1 overflow-y-auto pb-3">
            <DesktopNavigation />
          </div>
          <div className="h-24 shrink-0" aria-hidden="true" />
        </div>
      </aside>
      <div className="lg:pl-[22rem]">
        <header className="sticky top-0 z-10 border-b border-[var(--border)] bg-[var(--app-bar-muted)] px-5 pb-3 pt-12 text-[var(--on-app-bar)] lg:hidden">
          <div className="flex items-end justify-between gap-4">
            <Link href="/dashboard" className="flex items-center gap-3 font-semibold">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[var(--primary-soft)] text-[var(--primary)]">
                <Citrus className="size-5 stroke-[1.8]" aria-hidden="true" />
              </span>
              <span className="text-[1.7rem] leading-none tracking-normal">El Limón</span>
            </Link>
          </div>
        </header>
        <main className="mx-auto max-w-7xl px-3 py-4 sm:px-5 lg:px-8 lg:py-4">
          {children}
        </main>
      </div>
      <div className="fixed right-3 top-[calc(2.15rem+env(safe-area-inset-top))] z-20 flex items-center gap-1 rounded-full border border-[var(--border)] bg-[var(--surface)]/95 p-1 shadow-[var(--shadow-soft)] backdrop-blur lg:bottom-8 lg:left-8 lg:right-auto lg:top-auto lg:gap-2 lg:p-2">
        <ThemeToggle className="text-[var(--primary)]" initialTheme={initialTheme} />
        {isAuthenticated ? (
          <form action={logoutUser}>
            <button type="submit" className="flex size-11 items-center justify-center rounded-full text-[var(--primary)] transition-colors hover:bg-[var(--surface-muted)]" aria-label="Cerrar sesión" title="Cerrar sesión">
              <LogOut className="size-6 stroke-[1.7]" aria-hidden="true" />
            </button>
          </form>
        ) : (
          <Link href="/admin" className="flex size-11 items-center justify-center rounded-full text-[var(--primary)] transition-colors hover:bg-[var(--surface-muted)]" aria-label="Acceso administrador" title="Acceso administrador">
            <LogIn className="size-6 stroke-[1.7]" aria-hidden="true" />
          </Link>
        )}
      </div>
      <MobileNavigation />
    </div>
    </NavigationProvider>
  );
}
