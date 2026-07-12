"use client";

import { navigationItems } from "@/components/layout/navigationItems";
import {
  NavigationLink,
  useNavigationState,
} from "@/components/layout/NavigationProvider";
import { cn } from "@/shared/utils/cn";

export function DesktopNavigation() {
  const { activePath } = useNavigationState();

  return (
    <nav className="space-y-1.5 px-4 py-2" aria-label="Navegación principal">
      {navigationItems.map((item) => {
        const Icon = item.icon;
        const isActive =
          activePath === item.href ||
          (item.href !== "/dashboard" && activePath.startsWith(item.href));

        return (
          <NavigationLink
            key={item.href}
            href={item.href}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "group flex min-h-12 items-center gap-3.5 rounded-full px-4 text-[0.94rem] font-semibold text-[var(--foreground)] transition-[background,color,box-shadow,transform] duration-200 hover:bg-[var(--surface-muted)] active:translate-y-px",
              isActive &&
                "bg-[var(--primary)] text-white shadow-[0_10px_22px_var(--primary-glow)] hover:bg-[var(--primary)] [&_*]:text-white",
            )}
          >
            <Icon
              className={cn(
                "size-5 shrink-0 stroke-[1.8] text-[var(--muted)] transition-colors group-hover:text-[var(--foreground)]",
                isActive && "text-white group-hover:text-white",
              )}
              aria-hidden="true"
            />
            <span className="min-w-0 flex-1 truncate">{item.label}</span>
          </NavigationLink>
        );
      })}
    </nav>
  );
}
