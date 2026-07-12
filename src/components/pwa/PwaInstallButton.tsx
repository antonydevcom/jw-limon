"use client"

import { Download, Share, X } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { cn } from "@/shared/utils/cn"

interface InstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>
}

function isStandalone(): boolean {
  return window.matchMedia("(display-mode: standalone)").matches ||
    ("standalone" in navigator && navigator.standalone === true)
}

export function PwaInstallButton({ className }: { className?: string }) {
  const [prompt, setPrompt] = useState<InstallPromptEvent | null>(null)
  const [showIosHelp, setShowIosHelp] = useState(false)
  const [isIos, setIsIos] = useState(false)
  const [installed, setInstalled] = useState(true)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const dialogRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const initializationFrame = requestAnimationFrame(() => {
      setInstalled(isStandalone())
      setIsIos(/iphone|ipad|ipod/i.test(navigator.userAgent))
    })

    const register = () => {
      void navigator.serviceWorker?.register("/sw.js").catch(() => undefined)
    }
    const onPrompt = (event: Event) => {
      event.preventDefault()
      setPrompt(event as InstallPromptEvent)
    }
    const onInstalled = () => {
      setInstalled(true)
      setPrompt(null)
    }

    window.addEventListener("load", register, { once: true })
    window.addEventListener("beforeinstallprompt", onPrompt)
    window.addEventListener("appinstalled", onInstalled)
    if (document.readyState === "complete") register()

    return () => {
      cancelAnimationFrame(initializationFrame)
      window.removeEventListener("load", register)
      window.removeEventListener("beforeinstallprompt", onPrompt)
      window.removeEventListener("appinstalled", onInstalled)
    }
  }, [])

  useEffect(() => {
    if (!showIosHelp) return
    const previousOverflow = document.body.style.overflow
    const returnFocusTarget = triggerRef.current
    document.body.style.overflow = "hidden"
    closeRef.current?.focus()
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setShowIosHelp(false)
      if (event.key !== "Tab") return
      const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [tabindex]:not([tabindex="-1"])',
      )
      if (!focusable?.length) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }
    window.addEventListener("keydown", handleKey)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener("keydown", handleKey)
      returnFocusTarget?.focus()
    }
  }, [showIosHelp])

  if (installed || (!prompt && !isIos)) return null

  async function install() {
    if (!prompt) {
      setShowIosHelp(true)
      return
    }
    await prompt.prompt()
    const choice = await prompt.userChoice
    if (choice.outcome === "accepted") setInstalled(true)
    setPrompt(null)
  }

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={install}
        className={cn("flex size-11 items-center justify-center rounded-full transition-colors", className)}
        aria-label="Instalar El Limón"
        title="Instalar El Limón"
      >
        <Download className="size-5 stroke-[1.8]" aria-hidden="true" />
      </button>
      {showIosHelp && (
        <div className="fixed inset-0 z-[70] grid place-items-end bg-black/45 p-4 sm:place-items-center" role="presentation" onClick={() => setShowIosHelp(false)}>
          <section ref={dialogRef} className="app-card w-full max-w-sm p-5" role="dialog" aria-modal="true" aria-labelledby="install-title" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 id="install-title" className="text-lg font-semibold">Instalar en iPhone o iPad</h2>
                <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                  En Safari, toca Compartir y después “Agregar a pantalla de inicio”.
                </p>
              </div>
              <button ref={closeRef} type="button" className="flex size-11 shrink-0 items-center justify-center rounded-full hover:bg-[var(--surface-muted)]" onClick={() => setShowIosHelp(false)} aria-label="Cerrar instrucciones">
                <X className="size-5" aria-hidden="true" />
              </button>
            </div>
            <div className="mt-4 flex items-center gap-3 rounded-xl bg-[var(--primary-soft)] p-4 text-sm text-[var(--primary-strong)]">
              <Share className="size-5 shrink-0" aria-hidden="true" />
              Compartir → Agregar a pantalla de inicio
            </div>
          </section>
        </div>
      )}
    </>
  )
}
