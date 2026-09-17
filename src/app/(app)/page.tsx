"use client";
import { useMemo } from "react";
import { useStore } from "@/lib/store";
import { StatCard, ScoreBadge, StatusBadge, Btn } from "@/components/ui";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const { candidates, roles, setFilters } = useStore();
  const router = useRouter();

  const total = candidates.length;

  const { approved, inReview, rejected, avgScore } = useMemo(() => {
    const app = candidates.filter(c => c.status === "approved").length;
    const rev = candidates.filter(c => c.status === "review").length;
    const rej = candidates.filter(c => c.status === "rejected").length;
    const avg = total > 0 ? Math.round(candidates.reduce((a, c) => a + c.score.total, 0) / total) : 0;
    return { approved: app, inReview: rev, rejected: rej, avgScore: avg };
  }, [candidates, total]);

  const topCandidates = useMemo(() => {
    return [...candidates].sort((a, b) => b.score.total - a.score.total).slice(0, 6);
  }, [candidates]);

  const roleBreakdown = useMemo(() => {
    return roles.map(r => ({ ...r })).filter(r => r.count > 0).sort((a, b) => b.count - a.count);
  }, [roles]);

  const recentCandidates = useMemo(() => {
    return [...candidates].sort((a, b) => b.id.localeCompare(a.id)).slice(0, 5);
  }, [candidates]);

  function goFiltered(status: string) {
    setFilters({ search: "", roleId: "all", status, city: "", gender: "all", ageRange: "all", exp: "all", sort: "newest" });
    router.push("/candidates");
  }

  return (
    <div className="animate-fade-in">
      {/* Header — stacks vertically on mobile so button never collides with text */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Dashboard</h1>
          <div className="font-mono text-[11px] sm:text-xs text-[var(--text-3)] mt-1 uppercase tracking-widest">
            Triple S Production · Hiring Round Overview
          </div>
        </div>
        <Btn variant="primary" size="md" onClick={() => router.push("/upload")} className="self-start sm:self-auto flex-shrink-0">
          + Upload Resumes
        </Btn>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatCard label="Total Candidates" value={total} delta="Active pipeline" deltaUp />
        <StatCard label="Approved" value={approved} delta={`${total > 0 ? Math.round(approved / total * 100) : 0}% approval rate`} deltaUp={approved > 0} />
        <StatCard label="Avg Score" value={avgScore} delta={avgScore >= 70 ? "Strong pool" : avgScore >= 50 ? "Decent pool" : "Needs more resumes"} />
        <StatCard label="In Review" value={inReview} delta={`${rejected} rejected`} />
      </div>

      {/* Status cards — clickable */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {(["new", "review", "approved", "rejected"] as const).map(s => {
          const cnt = candidates.filter(c => c.status === s).length;
          return (
            <Btn key={s} onClick={() => goFiltered(s)}
              className="glass p-4 text-left hover:bg-[var(--glass-2)] hover:border-[var(--border-2)] transition-all duration-200 rounded-xl active:scale-95">
              <div className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-2">{cnt}</div>
              <StatusBadge status={s} />
            </Btn>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        {/* Top candidates */}
        <div className="glass p-4 sm:p-5 rounded-xl">
          <div className="text-sm sm:text-base font-bold mb-4 tracking-tight">Top Candidates</div>
          {topCandidates.length === 0
            ? <div className="font-mono text-xs text-[var(--text-3)] py-4 text-center">No candidates yet</div>
            : topCandidates.map((c, i) => (
              <div key={c.id} className="flex items-center gap-3 py-3 border-b border-[var(--border)] last:border-0">
                <div className="font-mono text-xs text-[var(--text-3)] w-5 flex-shrink-0">{i + 1}</div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold truncate">{c.name}</div>
                  <div className="font-mono text-[10px] text-[var(--text-3)] uppercase tracking-wider">{c.roleName}</div>
                </div>
                <ScoreBadge score={c.score.total} />
              </div>
            ))}
        </div>

        {/* Role breakdown */}
        <div className="glass p-4 sm:p-5 rounded-xl">
          <div className="text-sm sm:text-base font-bold mb-4 tracking-tight">By Role</div>
          {roleBreakdown.length === 0
            ? <div className="font-mono text-xs text-[var(--text-3)] py-4 text-center">No data yet</div>
            : roleBreakdown.slice(0, 8).map(r => (
              <div key={r.id} className="mb-3">
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-[var(--text-2)] truncate mr-2">{r.name}</span>
                  <span className="font-mono text-[10px] text-[var(--text-3)] flex-shrink-0">{r.count}</span>
                </div>
                <div className="h-[2px] bg-[var(--glass-3)] rounded-full">
                  <div className="h-full bg-white/70 rounded-full transition-all duration-700"
                    style={{ width: `${total > 0 ? Math.round(r.count / total * 100) : 0}%` }} />
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* Recent activity */}
      <div className="glass p-4 sm:p-5 rounded-xl">
        <div className="flex items-center justify-between mb-4">
          <div className="text-sm sm:text-base font-bold tracking-tight">Recent Candidates</div>
          <Btn variant="outline" size="sm" onClick={() => router.push("/candidates")}>View All →</Btn>
        </div>
        <div className="flex flex-col gap-2 overflow-x-auto">
          {recentCandidates.map(c => (
            <div key={c.id} className="grid grid-cols-[36px_1fr_44px_165px] sm:grid-cols-[36px_1fr_48px_175px] items-center gap-3 py-3 border-b border-[var(--border)] last:border-0 min-w-[320px]">
              <div className="w-9 h-9 rounded-xl bg-[var(--glass-3)] border border-[var(--border-2)] flex items-center justify-center font-bold text-sm flex-shrink-0">
                {c.name[0]}
              </div>
              <div className="min-w-0">
                <div className="text-sm font-semibold truncate">{c.name}</div>
                <div className="font-mono text-[10px] text-[var(--text-3)] truncate">{c.roleName} · {c.city} · {c.appliedAt}</div>
              </div>
              <div className="flex items-center justify-center w-full">
                <ScoreBadge score={c.score.total} className="w-full text-center" />
              </div>
              <div className="flex items-center justify-center w-full">
                <StatusBadge status={c.status} className="w-full text-center" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
