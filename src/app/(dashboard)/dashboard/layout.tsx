import React from "react";
import Image from "next/image";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { AuthProvider } from "@/components/providers/AuthProvider";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <div className="relative flex flex-col min-h-screen bg-[#070b12] text-slate-200">
        {/* Fondo Ambiental Táctico Cyberpunk Visible */}
        <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
          <Image
            src="/nexus-login-hero.jpg"
            alt="Nexus Ambient HUD Background"
            fill
            className="object-cover opacity-35 filter brightness-75 contrast-125 select-none"
            priority
          />
          {/* Overlay con degradado táctico que permite apreciar el centro de mando */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#070b12]/80 via-[#070b12]/70 to-[#070b12]/85" />
          {/* Malla HUD sutil */}
          <div className="absolute inset-0 hud-grid opacity-40" />
        </div>

        {/* Header Táctico con transparencia para apreciar el fondo */}
        <div className="relative z-30">
          <Header />
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
    </AuthProvider>
  );
}
