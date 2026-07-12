import { logoutUser } from "@/features/admin-auth/actions"

export const metadata = { title: "Sin acceso" }

export default function NoAccessPage() {
  return (
    <main className="grid min-h-[100dvh] place-items-center px-6 py-12">
      <section className="app-card max-w-md p-8 text-center">
        <h1 className="text-2xl font-semibold">Cuenta sin acceso</h1>
        <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
          Tu cuenta todavía no pertenece a una congregación. Solicita acceso al administrador.
        </p>
        <form action={logoutUser} className="mt-6">
          <button type="submit" className="min-h-11 rounded-full bg-[var(--action)] px-5 font-semibold text-[var(--action-foreground)]">
            Cerrar sesión
          </button>
        </form>
      </section>
    </main>
  )
}
