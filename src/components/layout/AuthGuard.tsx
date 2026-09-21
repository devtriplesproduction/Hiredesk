"use client";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [ok, setOk] = useState(false);

  useEffect(() => {
    async function checkAuth() {
      if (pathname === "/login") {
        setOk(true);
        return;
      }
      const authFlag = localStorage.getItem("tsp_auth");
      const { data } = await import("@/lib/supabase").then(m => m.supabase.auth.getSession());
      
      if (!authFlag || !data.session) {
        localStorage.removeItem("tsp_auth"); // Clear invalid flag
        router.replace("/login");
      } else {
        setOk(true);
      }
    }
    checkAuth();
  }, [pathname, router]);

  if (!ok) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg)" }}>
      <div className="w-8 h-8 rounded-full border-2 border-[var(--border)] border-t-white animate-spin" />
    </div>
  );
  return <>{children}</>;
}
