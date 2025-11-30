"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export function UrlMaskProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  useEffect(() => {
    if (pathname !== "/") {
      // 🔥 Mantiene la ruta REAL para Next.js
      // 🔥 pero oculta visualmente en el navegador
      window.history.replaceState({}, "", "/");
    }
  }, [pathname]);

  return <>{children}</>;
}