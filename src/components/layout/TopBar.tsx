"use client";
import { usePathname, useRouter } from "next/navigation";
import { clsx } from "clsx";
import { useStore } from "@/lib/store";
import { Menu } from "lucide-react";
import { Btn } from "@/components/ui";

const NAV = [
  { label: "Dashboard", href: "/" },
  { label: "Candidates", href: "/candidates" },
  { label: "Employees", href: "/employees" },
  { label: "Upload", href: "/upload" },
  { label: "Contracts", href: "/contracts" },
  { label: "Roles", href: "/roles" },
];

export default function TopBar({ onMenuClick }: { onMenuClick?: () => void }) {
  const router = useRouter();
  const pathname = usePathname();
  const { candidates } = useStore();

  function handleLogout() {
    localStorage.removeItem("tsp_auth");
    router.push("/login");
  }

  return (
    <header className="h-[58px] sm:h-[60px] flex items-center justify-between px-4 sm:px-5 flex-shrink-0 z-40"
      style={{ background: "rgba(10,10,10,0.95)", borderBottom: "1px solid var(--border)", backdropFilter: "blur(20px)" }}>
      <div className="flex items-center gap-3">
        {/* Mobile menu trigger */}
        <Btn
          onClick={onMenuClick}
          className="flex lg:hidden w-10 h-10 rounded-xl items-center justify-center text-[var(--text-2)] hover:text-white hover:bg-[var(--glass-2)] transition-colors border border-[var(--border)]"
          aria-label="Toggle navigation menu"
        >
          <Menu size={20} />
        </Btn>

        <div className="w-9 h-9 sm:w-9 sm:h-9 rounded-xl overflow-hidden flex items-center justify-center flex-shrink-0 border border-[var(--border)]">
          <img src="/logo.png" alt="HireDesk Logo" className="w-full h-full object-cover" />
        </div>
        <div>
          <div className="text-sm sm:text-base font-bold tracking-tight leading-tight">HireDesk</div>
          <div className="text-[10px] sm:text-[11px] text-[var(--text-3)] font-medium leading-tight">Triple S Production</div>
        </div>
      </div>

      <nav className="hidden lg:flex items-center gap-1.5">
        {NAV.map(n => {
          const isActive = n.href === "/" ? pathname === "/" : (pathname === n.href || pathname?.startsWith(n.href + "/"));
          return (
            <Btn
              key={n.href}
              onClick={() => router.push(n.href)}
              className={clsx(
                "relative text-sm font-medium px-4 py-2 rounded-xl transition-all duration-150 border inline-flex items-center gap-2",
                isActive
                  ? "text-white font-semibold bg-[#1F2228] border-[#383D48] shadow-sm shadow-black/40"
                  : "text-[#8B919C] bg-transparent border-transparent hover:text-white hover:bg-white/[0.05]"
              )}
            >
              <span>{n.label}</span>
              {isActive && (
                <span className="absolute -bottom-[1px] inset-x-3 h-[2px] bg-[#00D9FF] rounded-full shadow-[0_0_8px_rgba(0,217,255,0.7)]" />
              )}
            </Btn>
          );
        })}
      </nav>

      <div className="flex items-center gap-2 sm:gap-3">
        <div className="text-xs sm:text-sm text-[var(--text-2)] px-3 py-1.5 sm:px-3.5 sm:py-2 border border-[var(--border)] rounded-xl font-semibold bg-[var(--glass)]">
          <span className="font-mono">{candidates.length}</span>
          <span className="hidden xs:inline ml-1 text-[var(--text-3)] font-medium">candidates</span>
        </div>
        <Btn onClick={handleLogout}
          className="hidden sm:block text-xs sm:text-sm text-[var(--text-3)] hover:text-[var(--text)] px-3 py-1.5 sm:px-4 sm:py-2 border border-[var(--border)] rounded-xl transition-colors font-medium">
          Sign Out
        </Btn>
      </div>
    </header>
  );
}
