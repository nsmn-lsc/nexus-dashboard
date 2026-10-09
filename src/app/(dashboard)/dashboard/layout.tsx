import React from "react";
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
      <div className="flex flex-col min-h-screen bg-[#090d16]">
        {/* Header Táctico */}
        <Header />

        <div className="flex flex-1 overflow-hidden">
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
