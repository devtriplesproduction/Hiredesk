import { useMemo } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useStore } from "@/lib/store";
import { clsx } from "clsx";
import { X } from "lucide-react";
import { Btn } from "@/components/ui";

const NAV = [
  { label: "Dashboard", href: "/" },
  { label: "Candidates", href: "/candidates" },
  { label: "Upload", href: "/upload" },
  { label: "Contracts", href: "/contracts" },
  { label: "Roles", href: "/roles" },
];

export default function Sidebar({ isOpen, onClose }: { isOpen?: boolean; onClose?: () => void }) {
  const router = useRouter();
  const pathname = usePathname();
  const { candidates, roles, setFilters, exportCSV } = useStore();
  
  const counts = useMemo(() => {
    const res = { new: 0, review: 0, approved: 0, rejected: 0 };
    candidates.forEach(c => {
      if (c.status === "new" || c.status === "review" || c.status === "approved" || c.status === "rejected") {
        res[c.status]++;
      }
    });
    return res;
  }, [candidates]);

  function go(status: string) { setFilters({ status }); router.push("/candidates"); onClose?.(); }
  function goRole(id: string) { setFilters({ roleId: id }); router.push("/candidates"); onClose?.(); }

  function handleLogout() {
    localStorage.removeItem("tsp_auth");
    router.push("/login");
    onClose?.();
  }

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/75 backdrop-blur-sm lg:hidden transition-all duration-200"
          onClick={onClose}
        />
      )}

      <aside className={clsx(
        "flex flex-col gap-0.5 p-3 overflow-y-auto h-full flex-shrink-0 transition-transform duration-250 ease-in-out z-50",
        "fixed inset-y-0 left-0 bg-[#080808] w-[230px] border-r border-[var(--border)] lg:static lg:flex lg:translate-x-0 lg:w-[220px]",
        isOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"
      )}>
        {/* Mobile Header with close button */}
        <div className="flex items-center justify-between px-2.5 py-2 lg:hidden mb-2 border-b border-[var(--border)]">
          <div className="text-xs font-extrabold tracking-tight uppercase text-[var(--text-3)]">Navigation</div>
          <Btn 
            onClick={onClose} 
            className="w-7 h-7 rounded-lg flex items-center justify-center text-[var(--text-2)] hover:text-white hover:bg-[var(--glass-2)] border border-[var(--border)]"
          >
            <X size={15} />
          </Btn>
        </div>

        {/* Mobile Navigation Links */}
        <div className="flex flex-col gap-0.5 lg:hidden mb-2 pb-2 border-b border-[var(--border)]">
          {NAV.map(n => (
            <Btn key={n.href} onClick={() => { router.push(n.href); onClose?.(); }}
              className={clsx(
                "flex items-center gap-2.5 px-2.5 py-2 rounded-xl w-full text-left transition-all duration-150 border",
                pathname === n.href
                  ? "text-white bg-[var(--glass-3)] border-[var(--border-2)]"
                  : "text-[var(--text-2)] bg-transparent border-transparent hover:text-white hover:bg-[var(--glass-2)]"
              )}>
              <span className="text-xs font-semibold">{n.label}</span>
            </Btn>
          ))}
          <Btn onClick={handleLogout}
            className="flex items-center gap-2.5 px-2.5 py-2 rounded-xl w-full text-left transition-all duration-150 border border-transparent text-[var(--red)] hover:bg-red-500/10 hover:border-red-500/20 mt-1">
            <span className="text-xs font-bold uppercase tracking-wider">Sign Out</span>
          </Btn>
        </div>

        <SLabel>All Roles</SLabel>
        <SItem label="All Candidates" badge={candidates.length} onClick={() => { setFilters({ roleId:"all" }); router.push("/candidates"); onClose?.(); }} />
        {roles.map(r => (
          <SItem key={r.id} label={r.name} badge={r.count} onClick={() => goRole(r.id)} small />
        ))}
        <div className="h-px bg-[var(--border)] my-2" />
        <SLabel>Status Filter</SLabel>
        <SItem label="New"       badge={counts.new}      onClick={() => go("new")} />
        <SItem label="In Review" badge={counts.review}   onClick={() => go("review")} />
        <SItem label="Approved"  badge={counts.approved} onClick={() => go("approved")} accent="var(--green)" />
        <SItem label="Rejected"  badge={counts.rejected} onClick={() => go("rejected")} accent="var(--red)" />
        <div className="h-px bg-[var(--border)] my-2" />
        <SLabel>Tools</SLabel>
        <SItem label="Export CSV" onClick={() => { exportCSV(); onClose?.(); }} />
      </aside>
    </>
  );
}

function SLabel({ children }: { children: React.ReactNode }) {
  return <div className="text-[10px] font-semibold text-[var(--text-3)] uppercase tracking-widest px-2.5 pt-2 pb-1">{children}</div>;
}

function SItem({ label, badge, onClick, small, accent }: {
  label: string; badge?: number; onClick: () => void; small?: boolean; accent?: string;
}) {
  return (
    <Btn onClick={onClick} className="flex items-center gap-2.5 px-2.5 py-2 rounded-xl w-full text-left transition-all duration-150 border border-transparent hover:bg-[var(--glass-2)] hover:border-[var(--border)]">
      <span className="flex-1 overflow-hidden text-ellipsis whitespace-nowrap text-left"
        style={{ fontSize: small ? "12px" : "13px", fontWeight: 500, color: accent ?? "var(--text-2)" }}>
        {label}
      </span>
      {badge !== undefined && (
        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-lg flex-shrink-0"
          style={{ background: "var(--glass-3)", border: "1px solid var(--border)", color: "var(--text-3)" }}>
          {badge}
        </span>
      )}
    </Btn>
  );
}

