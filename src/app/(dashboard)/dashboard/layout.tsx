import React from "react";
import Image from "next/image";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { auth } from "@/lib/session";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  return (
    <div className="relative flex flex-col min-h-screen bg-[#070b12] text-slate-200">
      {/* Fondo Ambiental Táctico Cyberpunk Vivo */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none" aria-hidden="true">
        <div className="absolute inset-0 nx-kenburns opacity-35 filter brightness-75 contrast-125">
          <Image
            src="/nexus-login-hero.jpg"
            alt="Nexus Ambient HUD Background"
            fill
            className="object-cover"
            priority
          />
        </div>

        {/* Auroras cibernéticas lejanas y atmosféricas */}
        <div className="absolute -top-1/4 -left-1/4 w-[50vw] h-[50vw] rounded-full bg-hud-cyan/[0.08] blur-[140px] nx-aurora pointer-events-none" />
        <div className="absolute -bottom-1/4 -right-1/4 w-[50vw] h-[50vw] rounded-full bg-hud-magenta/[0.06] blur-[150px] nx-aurora-slow pointer-events-none" />

        {/* Piso de cuadrícula en perspectiva inferior */}
        <div className="absolute left-[-50%] right-[-50%] bottom-[-15%] h-[40%] nx-floor opacity-25" />

        {/* Overlay con degradado táctico oscuro para mantener legibilidad 100% nítida */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#070b12]/90 via-[#070b12]/80 to-[#070b12]/95" />

        {/* Barrido de escaneo táctico lento */}
        <div className="absolute inset-x-0 top-0 h-28 nx-scan bg-gradient-to-b from-transparent via-hud-cyan/[0.04] to-transparent" />

        {/* Malla HUD + scanlines CRT sutiles */}
        <div className="absolute inset-0 hud-grid opacity-30" />
        <div className="absolute inset-0 nx-scanlines opacity-40" />
      </div>

      {/* Header Táctico con transparencia para apreciar el fondo */}
      <div className="relative z-30">
        <Header user={session?.user} />
      </div>

      <div className="relative z-10 flex flex-1 overflow-hidden">
        {/* Sidebar colapsable con blur */}
        <Sidebar />

        {/* Área de Trabajo Principal */}
        <main className="flex-1 overflow-y-auto p-6 space-y-4">
          <Breadcrumb />
          {children}
        </main>
      </div>
    </div>
  );
}
