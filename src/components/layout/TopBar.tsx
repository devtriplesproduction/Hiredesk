"use client";
import { usePathname, useRouter } from "next/navigation";
import { clsx } from "clsx";
import { useStore } from "@/lib/store";
import { useTheme } from "@/lib/theme";
import { Menu, Sun, Moon } from "lucide-react";
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
  const { theme, toggleTheme } = useTheme();

  function handleLogout() {
    localStorage.removeItem("tsp_auth");
    router.push("/login");
  }

  return (
    <header className="h-[58px] sm:h-[60px] flex items-center justify-between px-4 sm:px-5 flex-shrink-0 z-40"
      style={{ background: "var(--topbar-bg)", borderBottom: "1px solid var(--border)", backdropFilter: "blur(20px)" }}>
      <div className="flex items-center gap-3">
        {/* Mobile menu trigger */}
        <Btn
          onClick={onMenuClick}
          className="flex lg:hidden w-10 h-10 rounded-xl items-center justify-center text-[var(--text-2)] hover:text-[var(--text)] hover:bg-[var(--glass-2)] transition-colors border border-[var(--border)]"
          aria-label="Toggle navigation menu"
        >
          <Menu size={20} />
        </Btn>

        <div className="w-9 h-9 sm:w-9 sm:h-9 rounded-xl overflow-hidden flex items-center justify-center flex-shrink-0 border border-[var(--border)]">
          <img src="/logo.png" alt="HireDesk Logo" className="w-full h-full object-cover" />
        </div>
        <div>
          <div className="text-sm sm:text-base font-bold tracking-tight leading-tight" style={{ color: "var(--text)" }}>HireDesk</div>
          <div className="text-[16px] sm:text-[15px] text-[var(--text-3)] font-medium leading-tight">Triple S Production</div>
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
                  ? "font-semibold bg-[var(--nav-active-bg)] border-[var(--nav-active-border)] shadow-sm shadow-black/40"
                  : "bg-transparent border-transparent hover:bg-[var(--glass)]"
              )}
              style={{
                color: isActive ? "var(--text)" : "var(--text-2)",
              }}
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
        {/* Theme Toggle */}
        <Btn
          onClick={toggleTheme}
          className="relative w-10 h-10 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center border border-[var(--border)] transition-all duration-300 hover:border-[var(--border-2)] group overflow-hidden"
          style={{ background: "var(--glass)" }}
          aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
          title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
        >
          <Sun
            size={18}
            className={clsx(
              "absolute transition-all duration-300 ease-in-out",
              theme === "light"
                ? "opacity-100 rotate-0 scale-100 text-[#F5C542]"
                : "opacity-0 rotate-90 scale-50 text-[#F5C542]"
            )}
          />
          <Moon
            size={18}
            className={clsx(
              "absolute transition-all duration-300 ease-in-out",
              theme === "dark"
                ? "opacity-100 rotate-0 scale-100 text-[#00D9FF]"
                : "opacity-0 -rotate-90 scale-50 text-[#00D9FF]"
            )}
          />
        </Btn>

        <Btn onClick={handleLogout}
          className="hidden sm:block text-xs sm:text-sm px-3 py-1.5 sm:px-4 sm:py-2 border border-[var(--border)] rounded-xl transition-colors font-medium"
          style={{ color: "var(--text-3)" }}
        >
          Sign Out
        </Btn>
      </div>
    </header>
  );
}

