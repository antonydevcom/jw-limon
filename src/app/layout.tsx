import type { Metadata, Viewport } from "next";
import Script from "next/script";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "El Limón",
    template: "%s | El Limón",
  },
  description:
    "Aplicación privada para organizar los formatos de la Congregación El Limón.",
  applicationName: "El Limón",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180" }],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "El Limón",
  },
  robots: {
    index: false,
    follow: false,
    noarchive: true,
    nosnippet: true,
  },
};

export const viewport: Viewport = {
  themeColor: "#f8f5fb",
};

const themeScript = `
(() => {
  try {
    const storedTheme = window.localStorage.getItem("theme");
    const theme = storedTheme === "light" || storedTheme === "dark"
      ? storedTheme
      : "light";
    const storedAccent = window.localStorage.getItem("accent");
    const accent =
      storedAccent === "purple" ||
      storedAccent === "green" ||
      storedAccent === "blue" ||
      storedAccent === "pink" ||
      storedAccent === "orange"
      ? storedAccent
      : "purple";
    document.documentElement.classList.toggle("dark", theme === "dark");
    document.documentElement.dataset.theme = theme;
    document.documentElement.dataset.accent = accent;
  } catch {
    document.documentElement.dataset.theme = "light";
    document.documentElement.dataset.accent = "purple";
  }
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body>
        <Script id="theme-init" strategy="beforeInteractive">
          {themeScript}
        </Script>
        {children}
      </body>
    </html>
  );
}
