import type { ReactNode } from "react";
import { getAppContext } from "@/shared/auth/appContext";
import { AppShell } from "@/components/layout/AppShell";
import { getUserPreferences } from "@/features/settings/actions/preferences";

export default async function AppLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  await getAppContext();
  const preferences = await getUserPreferences();

  return (
    <AppShell
      initialAccent={preferences.accent}
      initialTheme={preferences.theme}
    >
      {children}
    </AppShell>
  );
}
