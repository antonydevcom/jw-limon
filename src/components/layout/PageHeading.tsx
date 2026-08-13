import type { ReactNode } from "react";
import { CalendarDays, type LucideIcon } from "lucide-react";

export function PageHeading({
  title,
  subtitle,
  icon: Icon = CalendarDays,
  children,
}: {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  children?: ReactNode;
}) {
  return (
    <div className="app-card relative px-5 py-8 text-center sm:px-6 sm:py-9">
      <h1 className="flex items-center justify-center gap-2.5 text-2xl font-bold leading-tight text-[var(--primary-strong)] sm:text-3xl">
        <Icon className="size-7 stroke-[1.7] sm:size-8" aria-hidden="true" />
        <span>{title}</span>
      </h1>
      {subtitle && (
        <p className="mt-2 text-sm leading-6 text-[var(--muted)] sm:text-base">
          {subtitle}
        </p>
      )}
      {children && <div className="mt-4">{children}</div>}
    </div>
  );
}
