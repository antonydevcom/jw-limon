import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Congregación El Limón",
    short_name: "El Limón",
    description:
      "Aplicación privada para organizar y descargar formatos de congregación.",
    start_url: "/",
    scope: "/",
    id: "/",
    display: "standalone",
    orientation: "any",
    background_color: "#f8f5fb",
    theme_color: "#f8f5fb",
    lang: "es",
    categories: ["productivity", "utilities"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      {
        src: "/icons/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
