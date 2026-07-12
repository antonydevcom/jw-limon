import { FileDown, LockKeyhole } from "lucide-react";
import { Button } from "@/components/ui/Button";

export function FormatPlaceholder({
  title,
  description,
  periodLabel,
}: {
  title: string;
  description: string;
  periodLabel: string;
}) {
  return (
    <section className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-medium text-[var(--muted)]">
            {periodLabel}
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">
            {title}
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--muted)]">
            {description}
          </p>
        </div>
        <Button variant="secondary" disabled>
          <FileDown className="mr-2 size-4" aria-hidden="true" />
          Descargar PDF
        </Button>
      </div>
      <div className="border border-dashed border-[var(--border)] bg-[var(--surface)] p-8">
        <div className="mx-auto max-w-xl text-center">
          <LockKeyhole
            className="mx-auto size-8 text-[var(--foreground)]"
            aria-hidden="true"
          />
          <h2 className="mt-4 text-lg font-semibold">
            Formato pendiente de conectar
          </h2>
          <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
            Esta pantalla reserva la ruta, el nombre y la estructura visual. La
            edición, publicación y descarga se conectarán cuando se implemente
            Supabase y las acciones del módulo.
          </p>
        </div>
      </div>
    </section>
  );
}
