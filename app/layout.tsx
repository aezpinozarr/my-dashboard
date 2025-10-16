import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { UserProvider } from "@/context/UserContext"; // ⬅️ importa el provider
import { Toaster } from "sonner";

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
        {/* ⬇️ Envuelve toda la app para que el contexto esté disponible en todas las páginas */}
        <UserProvider>
          {children}
        </UserProvider>
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}