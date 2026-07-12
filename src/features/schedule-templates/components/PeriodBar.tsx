"use client"

import { ChevronLeft, ChevronRight } from "lucide-react"
import { useRouter, usePathname } from "next/navigation"
import { useTransition } from "react"
import { Button } from "@/components/ui/Button"
import {
  getSpanishMonthYearFromYM,
  prevYearMonth,
  nextYearMonth,
} from "@/shared/utils/dates"
import { createPeriod, publishPeriod, unpublishPeriod } from "../actions/periods"
import type { Database } from "@/types/database.types"

type Period = Database["public"]["Tables"]["schedule_periods"]["Row"]
type TemplateKey = Database["public"]["Enums"]["schedule_template_key"]

interface PeriodBarProps {
  yearMonth: string
  period: Period | null
  role: "admin" | "viewer"
  congregationId: string
  templateKey: TemplateKey
  basePath: string
  hidePublish?: boolean
  embedded?: boolean
}

export function PeriodBar({
  yearMonth,
  period,
  role,
  congregationId,
  templateKey,
  basePath,
  hidePublish = false,
  embedded = false,
}: PeriodBarProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [pending, startTransition] = useTransition()

  const isAdmin = role === "admin"
  const status = period?.status ?? null

  function navigate(ym: string) {
    router.push(`${pathname}?month=${ym}`)
  }

  function handlePublishToggle() {
    if (!period) return
    startTransition(async () => {
      if (status === "published") {
        await unpublishPeriod(period.id, basePath)
      } else {
        await publishPeriod(period.id, basePath)
      }
      router.refresh()
    })
  }

  function handleCreate() {
    startTransition(async () => {
      await createPeriod(congregationId, templateKey, yearMonth, basePath)
      router.refresh()
    })
  }

  return (
    <div
      className={
        embedded
          ? "relative grid gap-2 px-2 pt-1 sm:px-4"
          : "relative grid gap-3 border-b border-[var(--border)] bg-[var(--surface)] px-2 py-3 sm:px-4"
      }
    >
      {/* Month navigation — centered, JW Library style. Only admin changes month. */}
      <div className="flex items-center justify-center gap-4">
        <button
            onClick={() => navigate(prevYearMonth(yearMonth))}
            className="flex size-13 items-center justify-center rounded-full text-[var(--primary)] transition-colors hover:bg-[var(--surface-muted)] sm:size-14"
            aria-label="Mes anterior"
          >
            <ChevronLeft className="size-7 stroke-[2.3] sm:size-8" aria-hidden="true" />
          </button>
        <span className="min-w-[10rem] text-center text-base font-bold tracking-normal text-[var(--primary-strong)] sm:min-w-[12rem] sm:text-lg">
          {getSpanishMonthYearFromYM(yearMonth)}
        </span>
        <button
            onClick={() => navigate(nextYearMonth(yearMonth))}
            className="flex size-13 items-center justify-center rounded-full text-[var(--primary)] transition-colors hover:bg-[var(--surface-muted)] sm:size-14"
            aria-label="Mes siguiente"
          >
            <ChevronRight className="size-7 stroke-[2.3] sm:size-8" aria-hidden="true" />
          </button>
      </div>

      {isAdmin && period && status !== "archived" && !hidePublish && (
        <div className="flex justify-center sm:absolute sm:right-4 sm:top-1/2 sm:-translate-y-1/2">
          <Button
            variant={status === "published" ? "secondary" : "primary"}
            onClick={handlePublishToggle}
            disabled={pending}
          >
            {status === "published" ? "Quitar publicación" : "Publicar"}
          </Button>
        </div>
      )}
      {isAdmin && !period && (
        <div className="flex justify-center sm:absolute sm:right-4 sm:top-1/2 sm:-translate-y-1/2">
          <Button onClick={handleCreate} disabled={pending}>
            {pending ? "Creando…" : "Crear formato"}
          </Button>
        </div>
      )}
    </div>
  )
}
