"use client";

import { useUser } from "@/context/UserContext";
import { MainNavigation } from "@/components/layout/MainNavigation";

export default function ClientLayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useUser();

  return (
    <div className="flex min-h-screen flex-col w-full overflow-x-hidden">
      {user && <MainNavigation />} {/* SOLO si hay sesión */}

      <main className="flex-1 p-4 bg-[#fafafa] overflow-y-auto w-full mx-auto">
        {children}
      </main>
    </div>
  );
}