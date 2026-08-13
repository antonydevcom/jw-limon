"use client";

import { useActionState } from "react";
import { loginUser, type LoginState } from "@/features/admin-auth/actions";
import { Button } from "@/components/ui/Button";

const initialState: LoginState = { error: null };

export default function AdminLoginPage() {
  const [state, formAction, pending] = useActionState(loginUser, initialState);

  return (
    <main className="min-h-screen bg-[var(--background)] px-6 py-10">
      <section className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-md flex-col justify-center">
        <div className="app-card p-8">
          <p className="text-sm font-medium text-[var(--primary)]">El Limón</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight">
            Acceso administrador
          </h1>
          <p className="mt-4 text-sm leading-6 text-[var(--muted)]">
            Solo para administradores de la congregación.
          </p>
          <form action={formAction} className="mt-8 space-y-4">
            <div>
              <label
                htmlFor="email"
                className="text-sm font-medium text-[var(--foreground)]"
              >
                Correo electrónico
              </label>
              <input
                id="email"
                name="email"
                type="email"
                inputMode="email"
                autoComplete="email"
                required
                className="mt-1.5 w-full rounded-[var(--control-radius)] border border-[var(--border)] bg-[var(--background)] px-4 py-3 text-sm focus:outline focus:outline-2 focus:outline-[var(--primary)]"
              />
            </div>
            <div>
              <label
                htmlFor="password"
                className="text-sm font-medium text-[var(--foreground)]"
              >
                Contraseña
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="mt-1.5 w-full rounded-[var(--control-radius)] border border-[var(--border)] bg-[var(--background)] px-4 py-3 text-sm focus:outline focus:outline-2 focus:outline-[var(--primary)]"
              />
            </div>
            {state.error && (
              <p className="mt-1 text-xs text-[var(--danger)]">{state.error}</p>
            )}
            <Button type="submit" disabled={pending} className="w-full">
              {pending ? "Entrando…" : "Entrar"}
            </Button>
          </form>
        </div>
      </section>
    </main>
  );
}
