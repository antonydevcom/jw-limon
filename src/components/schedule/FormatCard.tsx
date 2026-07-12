import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { ChevronRight, FileDown } from "lucide-react";

export function FormatCard({
  title,
  description,
  href,
  icon: Icon = FileDown,
}: {
  title: string;
  description: string;
  href: string;
  icon?: LucideIcon;
}) {
  return (
    <Link
      href={href}
      className="group flex min-h-24 items-center gap-5 border-b border-[var(--border)] bg-[var(--surface)] px-4 py-5 text-left transition hover:bg-[var(--surface-subtle)]"
    >
      <div className="flex min-w-0 flex-1 items-center gap-5">
        <span className="flex size-14 shrink-0 items-center justify-center text-[var(--foreground)]">
          <Icon className="size-9 stroke-[1.5]" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <h2 className="text-lg font-medium leading-tight text-[var(--foreground)]">
            {title}
          </h2>
          <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
            {description}
          </p>
        </div>
      </div>
      <span className="inline-flex min-h-11 items-center justify-center px-2 text-sm font-semibold text-[var(--primary)]">
        <ChevronRight
          className="size-5 transition group-hover:translate-x-0.5"
          aria-hidden="true"
        />
      </span>
    </Link>
  );
}
