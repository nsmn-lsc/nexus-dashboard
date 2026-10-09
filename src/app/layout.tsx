import type { Metadata } from "next";
import { Rajdhani, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const rajdhani = Rajdhani({
  variable: "--font-rajdhani",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

export const metadata: Metadata = {
  title: "Nexus Dashboard // Tactical Project Controller",
  description: "Centro de comando y control de proyectos, puertos e infraestructura Hetzner",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="dark">
      <body
        className={`${rajdhani.variable} ${jetbrainsMono.variable} antialiased bg-[#090d16] text-slate-200 min-h-screen selection:bg-hud-cyan selection:text-[#090d16]`}
      >
        <div className="min-h-screen w-full hud-grid relative">
          {children}
        </div>
      </body>
    </html>
  );
}
