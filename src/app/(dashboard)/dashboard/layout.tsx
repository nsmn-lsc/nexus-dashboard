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
      <div className="relative flex flex-col min-h-screen bg-[#070b12] overflow-hidden">
        {/* Fondo Ambiental Táctico Cyberpunk con Mezcla de Gradientes */}
        <div className="fixed inset-0 pointer-events-none z-0">
          <Image
            src="/nexus-ambient-bg.jpg"
            alt="Nexus Ambient HUD Background"
            fill
            className="object-cover opacity-20 filter contrast-125"
            priority
          />
          {/* Overlay de desvanecimiento para garantizar contraste supremo */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#070b12]/85 via-[#070b12]/90 to-[#070b12]/95" />
          <div className="absolute inset-0 hud-grid opacity-60" />
        </div>

        {/* Header Táctico */}
        <div className="relative z-30">
          <Header />
        </div>

        <div className="relative z-10 flex flex-1 overflow-hidden">
          {/* Sidebar colapsable */}
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
