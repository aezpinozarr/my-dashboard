import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { UserProvider } from "@/context/UserContext";
import { Toaster } from "sonner";
import { SidebarProvider } from "@/components/ui/sidebar";
import { MainNavigation } from "@/components/layout/MainNavigation";
import { UrlMaskProvider } from "./UrlMaskProvider";  // ⬅️ lo agregamos

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

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
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <UserProvider>
          <SidebarProvider>
            <UrlMaskProvider>
              <div className="flex min-h-screen flex-col w-full overflow-x-hidden">
                <MainNavigation />
                <main className="flex-1 p-4 bg-[#fafafa] overflow-y-auto w-full overflow-x-hidden mx-auto">
                  {children}
                </main>
              </div>
            </UrlMaskProvider>
          </SidebarProvider>
        </UserProvider>

        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}