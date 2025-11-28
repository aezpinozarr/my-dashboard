import type { Metadata } from "next";
import "./globals.css";
import { UserProvider } from "@/context/UserContext";
import { SidebarProvider } from "@/components/ui/sidebar";
import ClientLayoutWrapper from "./ClientLayoutWrapper";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: "Gobierno De Tabasco",
  description: "Creado por EstrategIA 360",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body>
        <UserProvider>
          <SidebarProvider>
            <ClientLayoutWrapper>
              {children}
            </ClientLayoutWrapper>
          </SidebarProvider>
        </UserProvider>

        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}