"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export function UrlMaskProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  useEffect(() => {
    // Esto oculta la URL real
    window.history.replaceState({}, "", "/");
  }, [pathname]);

  return children;
}