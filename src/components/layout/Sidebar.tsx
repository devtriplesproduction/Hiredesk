import { useState, useMemo } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useStore } from "@/lib/store";
import { clsx } from "clsx";
import { X, ChevronRight } from "lucide-react";
import { Btn } from "@/components/ui";

const NAV = [
  { label: "Dashboard", href: "/" },
  { label: "Candidates", href: "/candidates" },
  { label: "Employees", href: "/employees" },
  { label: "Upload", href: "/upload" },
  { label: "Contracts", href: "/contracts" },
  { label: "Roles", href: "/roles" },
];

interface StageItem {
  key: string;
  label: string;
  color: string;
  matchValues: string[];
}

interface StageGroup {
  category: string;
  items: StageItem[];
}

const HIRING_STAGES: StageGroup[] = [
  {
    category: "Applications",
    items: [
      { key: "new", label: "New", color: "#38BDF8", matchValues: ["new"] },
      { key: "screening", label: "Screening", color: "#F5C542", matchValues: ["review", "in_review", "inreview"] },
    ],
  },
  {
    category: "Screening",
    items: [
      { key: "shortlisted", label: "Shortlisted", color: "#00D9FF", matchValues: ["shortlisted"] },
    ],
  },
  {
    category: "Interviews",
    items: [
      { key: "interview", label: "Interview", color: "#A78BFA", matchValues: ["interview_1", "interview_r1", "interview1", "interviewr1"] },
      { key: "final_discussion", label: "Final Discussion", color: "#8B5CF6", matchValues: ["interview_2", "interview_r2", "interview2", "interviewr2"] },
    ],
  },
  {
    category: "Offers",
    items: [
      { key: "offer_sent", label: "Offer Sent", color: "#FB923C", matchValues: ["offer", "offer_prep", "offerprep"] },
      { key: "offer_sent", label: "Offer Sent", color: "#60A5FA", matchValues: ["offer_sent", "offersent"] },
      { key: "offer_accepted", label: "Offer Accepted", color: "#22C55E", matchValues: ["offer_accepted", "offeraccepted"] },
      { key: "offer_rejected", label: "Offer Rejected", color: "#EF4444", matchValues: ["offer_rejected", "offerrejected"] },
    ],
  },
  {
    category: "Onboarding",
    items: [
      { key: "onboarding_requested", label: "Onboarding Required", color: "#FACC15", matchValues: ["onboarding_requested", "onboarding_required", "onboardingrequested", "onboardingrequired"] },
      { key: "onboarding_review", label: "Onboarding Review", color: "#EAB308", matchValues: ["onboarding_review", "onboardingreview"] },
      { key: "onboarding_verified", label: "Onboarding Verification", color: "#22C55E", matchValues: ["onboarding_verified", "onboarding_verification", "onboardingverified", "onboardingverification"] },
      { key: "onboarding_rejected", label: "Onboarding Rejected", color: "#EF4444", matchValues: ["onboarding_rejected", "onboardingrejected"] },
    ],
  },
  {
    category: "Completed",
    items: [
      { key: "hired", label: "Hired", color: "#22C55E", matchValues: ["hired", "offer_accepted", "approved"] },
      { key: "rejected", label: "Rejected", color: "#EF4444", matchValues: ["rejected", "offer_rejected", "onboarding_rejected"] },
    ],
  },
];

function normalizeStatus(s?: string) {
  return (s || "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

function candidateMatchesStage(candidateStatus: string | undefined, item: StageItem) {
  const norm = normalizeStatus(candidateStatus);
  return item.matchValues.some(val => normalizeStatus(val) === norm);
}

function isStageActive(item: StageItem, filterStatus?: string) {
  if (!filterStatus || filterStatus === "all") return false;
  return item.matchValues.some(val => normalizeStatus(val) === normalizeStatus(filterStatus));
}

export default function Sidebar({ isOpen, onClose }: { isOpen?: boolean; onClose?: () => void }) {
  const router = useRouter();
  const pathname = usePathname();
  const { candidates, roles, filters, setFilters, clearFilters, exportCSV, employees } = useStore();

  const hiredCandidateIds = useMemo(() => {
    const ids = new Set<string>();
    employees.forEach(e => {
      const cid = e.candidateId || (e as any).candidate_id;
      if (cid) ids.add(cid);
    });
    return ids;
  }, [employees]);

  const activeCandidates = useMemo(() => {
    return candidates.filter(c => c.status !== "hired" && !hiredCandidateIds.has(c.id));
  }, [candidates, hiredCandidateIds]);

  const roleCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    activeCandidates.forEach(c => {
      counts[c.roleId] = (counts[c.roleId] || 0) + 1;
    });
    return counts;
  }, [activeCandidates]);

  const stageCounts = useMemo(() => {
    const res: Record<string, number> = {};
    HIRING_STAGES.forEach(grp => {
      grp.items.forEach(item => {
        res[item.key] = 0;
      });
    });

    activeCandidates.forEach(c => {
      for (const grp of HIRING_STAGES) {
        for (const item of grp.items) {
          if (candidateMatchesStage(c.status, item)) {
            res[item.key]++;
            return;
          }
        }
      }
    });

    res["hired"] = employees.length;

    return res;
  }, [activeCandidates, employees]);

  const [expandedMenu, setExpandedMenu] = useState<string | null>(null);
  const [activeMainMenu, setActiveMainMenu] = useState<string | null>(null);

  function handleMainMenuClick(category: string) {
    if (expandedMenu === category) {
      setExpandedMenu(null);
      setActiveMainMenu(null);
    } else {
      setExpandedMenu(category);
      setActiveMainMenu(category);
    }
  }

  function go(status: string, category?: string) {
    if (status === "hired") {
      router.push("/employees");
      onClose?.();
      return;
    }
    setFilters({ status, roleId: "all" });
    if (category) {
      setExpandedMenu(category);
      setActiveMainMenu(category);
    }
    router.push("/candidates");
    onClose?.();
  }

  function goRole(id: string) {
    setFilters({ roleId: id, status: "all" });
    router.push("/candidates");
    onClose?.();
  }

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
        "fixed inset-y-0 left-0 w-[230px] border-r border-[var(--border)] lg:static lg:flex lg:translate-x-0 lg:w-[220px]",
        isOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"
      )} style={{ background: "var(--sidebar-bg)" }}>
        {/* Mobile Header with close button */}
        <div className="flex items-center justify-between px-2.5 py-2 lg:hidden mb-2 border-b border-[var(--border)]">
          <div className="text-xs font-extrabold tracking-tight uppercase text-[var(--text-2)]">Navigation</div>
          <Btn
            onClick={onClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-[var(--text-2)] hover:text-[var(--text)] hover:bg-[var(--glass-2)] border border-[var(--border)]"
          >
            <X size={15} />
          </Btn>
        </div>

        {/* Mobile Navigation Links */}
        <div className="flex flex-col gap-1 lg:hidden mb-2 pb-2 border-b border-[var(--border)]">
          {NAV.map(n => {
            const isActive = n.href === "/" ? pathname === "/" : (pathname === n.href || pathname?.startsWith(n.href + "/"));
            return (
              <Btn
                key={n.href}
                onClick={() => { router.push(n.href); onClose?.(); }}
                className={clsx(
                  "flex items-center justify-between px-3 py-2.5 rounded-xl w-full text-left transition-all duration-150 border",
                  isActive
                    ? "text-text font-semibold bg-[var(--nav-active-bg)] border-[var(--border-2)] shadow-sm"
                    : "text-[var(--text-2)] bg-transparent border-transparent hover:text-[var(--text)] hover:bg-[var(--glass-2)]"
                )}
              >
                <div className="flex items-center gap-2.5">
                  {isActive ? (
                    <span className="w-1.5 h-1.5 rounded-full bg-[#00D9FF] shadow-[0_0_8px_rgba(0,217,255,0.8)] flex-shrink-0" />
                  ) : (
                    <span className="w-1.5 h-1.5 rounded-full bg-transparent flex-shrink-0" />
                  )}
                  <span className="text-xs font-semibold">{n.label}</span>
                </div>
                {isActive && (
                  <span className="text-[16px] font-mono font-bold tracking-wider text-[#00D9FF] bg-[#00D9FF]/10 px-1.5 py-0.5 rounded border border-[#00D9FF]/20">
                    Active
                  </span>
                )}
              </Btn>
            );
          })}
          <Btn onClick={handleLogout}
            className="flex items-center gap-2.5 px-2.5 py-2 rounded-xl w-full text-left transition-all duration-150 border border-transparent text-[var(--red)] hover:bg-red-500/10 hover:border-red-500/20 mt-1">
            <span className="text-xs font-bold uppercase tracking-wider">Sign Out</span>
          </Btn>
        </div>

        <SLabel>Hiring</SLabel>
        {HIRING_STAGES.map(grp => {
          const isExpanded = expandedMenu === grp.category;
          const isMainActive = activeMainMenu === grp.category;
          const groupTotal = grp.items.reduce((sum, item) => sum + (stageCounts[item.key] ?? 0), 0);

          return (
            <div key={grp.category} className="flex flex-col gap-0.5">
              <SItem
                label={grp.category}
                badge={groupTotal}
                active={isMainActive}
                activeColor="#00D9FF"
                onClick={() => handleMainMenuClick(grp.category)}
                small
                rightElement={
                  <ChevronRight
                    size={14}
                    className={clsx(
                      "transition-transform duration-200 flex-shrink-0",
                      isExpanded ? "rotate-90" : "",
                      isMainActive ? "text-[#00D9FF]" : "text-[var(--text)] group-hover:text-[var(--text)]"
                    )}
                  />
                }
              />

              <div
                className={clsx(
                  "flex flex-col gap-0.5 pl-3 transition-all duration-200 ease-in-out overflow-hidden",
                  isExpanded ? "max-h-[300px] opacity-100 mt-0.5 mb-1" : "max-h-0 opacity-0 pointer-events-none"
                )}
              >
                {grp.items.map(item => (
                  <SItem
                    key={item.key}
                    label={item.label}
                    badge={stageCounts[item.key] ?? 0}
                    active={isStageActive(item, filters?.status)}
                    activeColor={item.color}
                    onClick={() => go(item.key, grp.category)}
                    small
                  />
                ))}
              </div>
            </div>
          );
        })}
        <div className="h-px bg-[var(--border)] my-2" />
        <SLabel>All Roles</SLabel>
        <SItem
          label="All Candidates"
          badge={activeCandidates.length}
          active={(filters?.roleId ?? "all") === "all" && (filters?.status ?? "all") === "all"}
          onClick={() => { clearFilters(); router.push("/candidates"); onClose?.(); }}
        />
        {roles.map(r => (
          <SItem
            key={r.id}
            label={r.name}
            badge={roleCounts[r.id] ?? 0}
            active={filters?.roleId === r.id}
            onClick={() => goRole(r.id)}
            small
          />
        ))}
        <div className="h-px bg-[var(--border)] my-2" />
        <SLabel>Tools</SLabel>
        <SItem label="Export Excel" onClick={() => { exportCSV(); onClose?.(); }} />
      </aside>
    </>
  );
}

function SLabel({ children }: { children: React.ReactNode }) {
  return <div className="text-[10.5px] font-semibold uppercase tracking-widest px-2.5 pt-2 pb-1" style={{ color: "var(--text-2)" }}>{children}</div>;
}

function SItem({ label, badge, onClick, small, accent, active, activeColor, rightElement }: {
  label: string; badge?: number; onClick: () => void; small?: boolean; accent?: string; active?: boolean; activeColor?: string; rightElement?: React.ReactNode;
}) {
  const effectiveActiveColor = activeColor || "#00D9FF";

  return (
    <Btn
      onClick={onClick}
      style={{ minHeight: "45.25px" }}
      className={clsx(
        "flex items-center gap-2.5 px-2.5 py-2 rounded-xl w-full text-left transition-all duration-150 border border-transparent hover:bg-[var(--glass-2)] hover:border-[var(--border)] group min-h-[45.25px]",
        active && "bg-[var(--glass-2)] border-[var(--border)]"
      )}
    >
      <span
        className={clsx(
          "flex-1 overflow-hidden text-ellipsis whitespace-nowrap text-left transition-colors",
          active
            ? ""
            : accent
              ? ""
              : ""
        )}
        style={{
          fontSize: small ? "12px" : "13px",
          fontWeight: 500,
          color: active ? effectiveActiveColor : (accent || "var(--text)"),
        }}
      >
        {label}
      </span>
      {badge !== undefined && (
        <span
          className="text-[16px] font-semibold px-1.5 py-0.5 rounded-lg flex-shrink-0"
          style={
            active && activeColor
              ? {
                background: `${effectiveActiveColor}1A`,
                border: `1px solid ${effectiveActiveColor}33`,
                color: effectiveActiveColor,
              }
              : {
                background: "var(--badge-bg)",
                border: "1px solid var(--badge-border)",
                color: "var(--badge-text)",
              }
          }
        >
          {badge}
        </span>
      )}
      {rightElement}
    </Btn>
  );
}

