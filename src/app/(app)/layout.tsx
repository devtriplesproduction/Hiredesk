"use client";
import { useState } from "react";
import TopBar from "@/components/layout/TopBar";
import Sidebar from "@/components/layout/Sidebar";
import AuthGuard from "@/components/layout/AuthGuard";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <AuthGuard>
      {/* Desktop: fixed h-screen layout. Mobile: full-height scrollable layout */}
      <div className="flex flex-col min-h-screen lg:h-screen lg:overflow-hidden">
        <TopBar onMenuClick={() => setSidebarOpen(prev => !prev)} />
        <div className="flex flex-1 relative lg:overflow-hidden">
          <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
          <main className="flex-1 overflow-y-auto p-4 md:p-5 lg:p-6 pb-8">
            {children}
          </main>
        </div>
      </div>
    </AuthGuard>
  );
}
