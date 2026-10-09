import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "SIF UNIFORMS - Represent Your Institution",
    short_name: "SIF UNIFORMS",
    description: "SIF UNIFORMS: Multi-School Uniform Ordering PWA with Direct Home Delivery",
    start_url: "/parent",
    scope: "/",
    id: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#1e3a8a",
    orientation: "portrait-primary",
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: "/icons/icon-512-maskable.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
