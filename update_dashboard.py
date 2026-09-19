import re

with open(r'c:\Users\HP\Desktop\Triple S\HireDesk\src\app\(app)\page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update the grid columns from lg:col-span-7 and lg:col-span-5 to 8 and 4
content = content.replace('className="lg:col-span-7 glass p-5 sm:p-6 rounded-2xl flex flex-col justify-between"', 'className="lg:col-span-8 glass p-5 sm:p-6 rounded-2xl flex flex-col h-[520px]"')
content = content.replace('className="lg:col-span-5 glass p-5 sm:p-6 rounded-2xl flex flex-col justify-between"', 'className="lg:col-span-4 glass p-5 sm:p-6 rounded-2xl flex flex-col h-[520px]"')
content = content.replace('className="lg:col-span-8 glass p-5 sm:p-6 rounded-2xl flex flex-col justify-between h-[520px]"', 'className="lg:col-span-8 glass p-5 sm:p-6 rounded-2xl flex flex-col h-[520px]"')
content = content.replace('className="lg:col-span-4 glass p-5 sm:p-6 rounded-2xl flex flex-col justify-between h-[520px]"', 'className="lg:col-span-4 glass p-5 sm:p-6 rounded-2xl flex flex-col h-[520px]"')

# 2. Top Candidates layout
top_cands_start_marker = '<div className="lg:col-span-8 glass p-5 sm:p-6 rounded-2xl flex flex-col h-[520px]">'
top_cands_end_marker = '{/* Right Column: By Role'

top_start = content.find(top_cands_start_marker)
top_end = content.find(top_cands_end_marker)

if top_start != -1 and top_end != -1:
    new_top_cands = """<div className="lg:col-span-8 glass p-5 sm:p-6 rounded-2xl flex flex-col h-[520px]">
          {/* Header */}
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-[var(--border)] flex-shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/25 flex items-center justify-center text-amber-400">
                <Award size={16} />
              </div>
              <div>
                <div className="text-sm sm:text-base font-bold text-text tracking-tight">
                  Top Candidates
                </div>
                <div className="text-[11px] text-[var(--text-3)]">
                  Highest scoring profiles ranked by ATS resume parser
                </div>
              </div>
            </div>
            <Btn
              variant="outline"
              size="sm"
              onClick={() => {
                setFilters({ search: "", roleId: "all", status: "all", city: "", gender: "all", ageRange: "all", exp: "all", sort: "score-desc" });
                router.push("/candidates");
              }}
              className="flex items-center gap-1 text-xs"
            >
              <span>View All</span>
              <ChevronRight size={13} />
            </Btn>
          </div>

          {/* List */}
          {topCandidates.length === 0 ? (
            <div className="font-mono text-xs text-[var(--text-3)] text-center flex-1 flex items-center justify-center">
              No candidates evaluated yet
            </div>
          ) : (
            <div className="space-y-2.5 flex-1 overflow-y-auto pr-2 custom-scrollbar">
              {topCandidates.map((c, i) => {
                return (
                  <div
                    key={c.id}
                    onClick={() => setInspectCandidate(c)}
                    className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.06] border border-white/[0.04] hover:border-border transition-all duration-150 cursor-pointer group"
                  >
                    {/* Rank Medal */}
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs flex-shrink-0">
                      {i === 0 && (
                        <span className="w-7 h-7 rounded-md bg-amber-500/20 border border-amber-500/40 text-amber-300 flex items-center justify-center text-[12px] shadow-[0_0_8px_rgba(245,158,11,0.2)]">
                          1
                        </span>
                      )}
                      {i === 1 && (
                        <span className="w-7 h-7 rounded-md bg-slate-300/20 border border-slate-300/40 text-slate-200 flex items-center justify-center text-[12px]">
                          2
                        </span>
                      )}
                      {i === 2 && (
                        <span className="w-7 h-7 rounded-md bg-orange-500/20 border border-orange-500/40 text-orange-300 flex items-center justify-center text-[12px]">
                          3
                        </span>
                      )}
                      {i > 2 && (
                        <span className="w-7 h-7 rounded-md bg-white/5 border border-border text-[var(--text-3)] font-mono text-[12px] flex items-center justify-center">
                          {i + 1}
                        </span>
                      )}
                    </div>

                    {/* Candidate Avatar Initial */}
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-white/10 to-white/5 border border-border flex items-center justify-center font-bold text-sm text-text flex-shrink-0 group-hover:border-cyan-500/40 transition-colors">
                      {c.name ? c.name[0]?.toUpperCase() : "?"}
                    </div>

                    {/* Candidate Info */}
                    <div className="flex-1 min-w-0 grid grid-cols-2 items-center gap-4">
                      <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-text truncate group-hover:text-cyan-400 transition-colors">
                            {c.name}
                          </span>
                          <span className="hidden sm:inline-block font-mono text-[10px] text-[var(--text-3)] flex-shrink-0">
                            {c.city ? `· ${c.city}` : ""}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs text-[var(--text-2)] truncate">
                            {c.roleName}
                          </span>
                          {c.exp && (
                            <span className="font-mono text-[10px] text-[var(--text-3)] hidden md:inline flex-shrink-0">
                              · {c.exp}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex justify-end items-center gap-3 pr-2">
                          <StatusBadge status={c.status} className="hidden sm:inline-flex" />
                          <ScoreBadge score={c.score?.total || 0} />
                          <ArrowUpRight size={14} className="text-[var(--text-3)] opacity-0 group-hover:opacity-100 transition-opacity hidden lg:block" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Footer */}
          <div className="mt-4 pt-3 border-t border-[var(--border)] flex items-center justify-between text-xs text-[var(--text-3)] flex-shrink-0">
            <span>Showing top 5 talent matches</span>
            <button
              type="button"
              onClick={() => router.push("/candidates")}
              className="text-cyan-400 hover:underline flex items-center gap-1 font-medium"
            >
              Browse all {total} candidates →
            </button>
          </div>
        </div>

        """
    content = content[:top_start] + new_top_cands + content[top_end:]

# 3. By Role section
role_start_marker = '<div className="lg:col-span-4 glass p-5 sm:p-6 rounded-2xl flex flex-col h-[520px]">'
role_end_marker = '      {/* ─── Recent Candidate Stream'

role_start = content.find(role_start_marker)
role_end = content.find(role_end_marker)

if role_start != -1 and role_end != -1:
    new_role = """<div className="lg:col-span-4 glass p-5 sm:p-6 rounded-2xl flex flex-col h-[520px]">
          {/* Header */}
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-[var(--border)] flex-shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/25 flex items-center justify-center text-cyan-400">
                <BarChart3 size={16} />
              </div>
              <div>
                <div className="text-sm sm:text-base font-bold text-text tracking-tight flex items-center gap-2">
                  By Role
                  <span className="text-[11px] font-mono font-medium px-2 py-0.5 rounded-full bg-white/5 border border-border text-[var(--text-2)]">
                    {roleBreakdown.length} Positions
                  </span>
                </div>
                <div className="text-[11px] text-[var(--text-3)]">
                  Applicant density & talent score by department
                </div>
              </div>
            </div>
            <Btn
              variant="outline"
              size="sm"
              onClick={() => router.push("/roles")}
              className="flex items-center gap-1 text-xs"
            >
              <span>Roles</span>
              <ChevronRight size={13} />
            </Btn>
          </div>

          {/* Role List */}
          {roleBreakdown.length === 0 ? (
            <div className="font-mono text-xs text-[var(--text-3)] text-center flex-1 flex items-center justify-center">
              No active roles configured
            </div>
          ) : (
            <div className="space-y-3 flex-1 overflow-y-auto pr-2 custom-scrollbar">
              {roleBreakdown.map((r, i) => {
                const visual = getRoleVisual(r.name, i);
                const percentage = total > 0 ? Math.round((r.count / total) * 100) : 0;
                return (
                  <div
                    key={r.id}
                    onClick={() => goRoleFiltered(r.id)}
                    className="p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.06] border border-white/[0.04] hover:border-border transition-all duration-150 cursor-pointer group flex flex-col gap-2"
                    title={`Click to view all candidates for ${r.name}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5 min-w-0 mr-2">
                        <div className={`w-8 h-8 rounded-lg ${visual.boxBg} border flex items-center justify-center flex-shrink-0 ${visual.glow}`}>
                          {visual.icon}
                        </div>
                        <div className="min-w-0 flex flex-col">
                          <div className="text-[13px] font-semibold text-text truncate group-hover:text-cyan-300 transition-colors">
                            {r.name}
                          </div>
                          <div className="text-[10px] text-[var(--text-3)] font-mono truncate">
                            {r.type || "Full-time"} {r.avgScore > 0 ? `· Avg Score: ${r.avgScore}` : ""}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <span className="font-bold text-text text-sm">
                          {r.count}
                        </span>
                        <span className="text-[10px] font-mono text-[var(--text-3)]">
                          ({percentage}%)
                        </span>
                      </div>
                    </div>

                    {/* Vibrant Custom Progress Bar */}
                    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden border border-border">
                      <div
                        className={`h-full rounded-full bg-gradient-to-r ${visual.barGradient} transition-all duration-700`}
                        style={{ width: `${Math.max(percentage, 3)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ─── Role Insights & Distribution Footer (Fills the previous empty void!) ─── */}
          <div className="mt-4 pt-3.5 border-t border-[var(--border)] flex-shrink-0">
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.05]">
                <div className="text-[10px] uppercase font-mono tracking-wider text-[var(--text-3)] mb-0.5">
                  Most Demanded
                </div>
                <div className="font-bold text-text truncate text-xs">
                  {topDemandedRole ? topDemandedRole.name : "None"}
                </div>
                <div className="text-[10px] text-cyan-400 font-mono mt-0.5">
                  {topDemandedRole ? `${topDemandedRole.count} candidates (${total > 0 ? Math.round(topDemandedRole.count / total * 100) : 0}%)` : "—"}
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.05]">
                <div className="text-[10px] uppercase font-mono tracking-wider text-[var(--text-3)] mb-0.5">
                  Top Scoring Role
                </div>
                <div className="font-bold text-text truncate text-xs">
                  {highestScoringRole ? highestScoringRole.name : "None"}
                </div>
                <div className="text-[10px] text-emerald-400 font-mono mt-0.5">
                  {highestScoringRole ? `Avg ${highestScoringRole.avgScore} pts` : "—"}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
"""
    content = content[:role_start] + new_role + content[role_end:]

with open(r'c:\Users\HP\Desktop\Triple S\HireDesk\src\app\(app)\page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Replacement complete")
