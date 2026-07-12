"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ComponentProps,
  type ReactNode,
} from "react";

interface NavigationState {
  activePath: string;
  pendingPath: string | null;
  beginNavigation: (path: string) => boolean;
}

const NavigationContext = createContext<NavigationState | null>(null);

export function NavigationProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [pendingPath, setPendingPath] = useState<string | null>(null);
  const effectivePendingPath = pathname === pendingPath ? null : pendingPath;

  useEffect(() => {
    if (!effectivePendingPath) return;
    const timeout = window.setTimeout(() => setPendingPath(null), 15_000);
    return () => window.clearTimeout(timeout);
  }, [effectivePendingPath]);

  const beginNavigation = useCallback(
    (path: string) => {
      if (path === pathname || path === effectivePendingPath) return false;
      setPendingPath(path);
      return true;
    },
    [effectivePendingPath, pathname],
  );

  const value = useMemo(
    () => ({
      activePath: effectivePendingPath ?? pathname,
      pendingPath: effectivePendingPath,
      beginNavigation,
    }),
    [beginNavigation, effectivePendingPath, pathname],
  );

  return (
    <NavigationContext.Provider value={value}>
      {children}
    </NavigationContext.Provider>
  );
}

export function useNavigationState() {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error("useNavigationState must be used inside NavigationProvider");
  }
  return context;
}

type NavigationLinkProps = Omit<ComponentProps<typeof Link>, "href" | "onNavigate"> & {
  href: string;
};

export function NavigationLink({ href, ...props }: NavigationLinkProps) {
  const { beginNavigation } = useNavigationState();

  return (
    <Link
      {...props}
      href={href}
      onNavigate={(event) => {
        if (!beginNavigation(href)) event.preventDefault();
      }}
    />
  );
}
