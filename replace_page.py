import re

with open(r'c:\Users\HP\Desktop\Triple S\HireDesk\src\app\(app)\page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Extract and remove the Score Tier Distribution block
score_block_start_marker = '{/* ─── Score Tier Distribution Strip ───────────────────────────── */}'
score_block_start = content.find(score_block_start_marker)

# Find the end of this block by finding the next section ─── Recent Candidate Stream
next_section_marker = '{/* ─── Recent Candidate Stream / Table (Matches Candidate List Page) ─ */}'
score_block_end = content.find(next_section_marker)

if score_block_start == -1 or score_block_end == -1:
    print("Could not find the Score Tier Distribution block boundaries.")
    exit(1)

# Remove the score block from content
new_content = content[:score_block_start] + content[score_block_end:]

# 2. Find the Interactive Pipeline Stage Strip
funnel_start_marker = '{/* ─── Interactive Pipeline Stage Strip with Tab Toggle ───────────────────────── */}'
funnel_start = new_content.find(funnel_start_marker)
# Find the end by looking for the next section ─── Two Columns: Top Candidates
two_columns_marker = '{/* ─── Two Columns: Top Candidates & By Role (Redesigned!) ──────── */}'
funnel_end = new_content.find(two_columns_marker)

if funnel_start == -1 or funnel_end == -1:
    print("Could not find the Hiring Funnel Status block boundaries.")
    exit(1)

new_funnel_block = """      {/* ─── Interactive Pipeline Stage Strip & Talent Quality ───────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 mb-5">
        {/* Left: Hiring Funnel Status */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <button
              type="button"
              onClick={() => setShowFunnel(prev => !prev)}
              className={clsx(
                "px-3.5 py-1.5 rounded-xl text-xs font-semibold tracking-wide transition-all duration-200 inline-flex items-center gap-2 cursor-pointer border select-none",
                showFunnel
                  ? "bg-cyan-500/15 border-cyan-500/40 text-cyan-400 shadow-[0_0_15px_rgba(0,217,255,0.15)]"
                  : "bg-white/[0.04] border-border text-[var(--text-2)] hover:text-text hover:bg-white/[0.08] hover:border-border-2"
              )}
            >
              <Activity size={14} className={showFunnel ? "text-cyan-400" : "text-[var(--text-3)]"} />
              <span>Hiring Funnel Status</span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/10 text-[var(--text-3)]">
                {showFunnel ? "Hide" : "Show 6 Stages"}
              </span>
              {showFunnel ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>

            {showFunnel && (
              <span className="text-[11px] text-[var(--text-3)] hidden sm:inline animate-fade-in">
                Click any stage to filter candidates
              </span>
            )}
          </div>

          {showFunnel && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 animate-fade-in">
              {[
                { 
                  key: "new", 
                  label: "New", 
                  color: "cyan", 
                  bg: "hover:border-cyan-500/30", 
                  dot: "bg-cyan-400",
                  count: newCount,
                },
                { 
                  key: "review", 
                  label: "In Review", 
                  color: "amber", 
                  bg: "hover:border-amber-500/30", 
                  dot: "bg-amber-400",
                  count: inReview,
                },
                { 
                  key: "shortlisted", 
                  label: "Shortlisted", 
                  color: "purple", 
                  bg: "hover:border-purple-500/30", 
                  dot: "bg-purple-400",
                  count: shortlisted,
                },
                { 
                  key: "offer_accepted", 
                  label: "Offered", 
                  color: "emerald", 
                  bg: "hover:border-emerald-500/30", 
                  dot: "bg-emerald-400",
                  count: offerAccepted,
                },
                { 
                  key: "rejected", 
                  label: "Rejected", 
                  color: "rose", 
                  bg: "hover:border-rose-500/30", 
                  dot: "bg-rose-400",
                  count: rejected,
                },
                { 
                  key: "hired", 
                  label: "Hired", 
                  color: "blue", 
                  bg: "hover:border-blue-500/30", 
                  dot: "bg-blue-400",
                  count: hired,
                },
              ].map(stage => {
                const pct = total > 0 ? Math.round((stage.count / total) * 100) : 0;
                return (
                  <button
                    key={stage.key}
                    onClick={() => goFiltered(stage.key)}
                    className={`glass p-3.5 sm:p-4 rounded-xl text-left transition-all duration-200 hover:bg-[var(--glass-2)] ${stage.bg} group relative overflow-hidden cursor-pointer`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${stage.dot}`} />
                        <span className="text-xs font-medium text-[var(--text-2)] group-hover:text-text transition-colors">
                          {stage.label}
                        </span>
                      </div>
                      <span className="font-mono text-[10px] text-[var(--text-3)]">{pct}%</span>
                    </div>
                    <div className="text-xl sm:text-2xl font-bold text-text tracking-tight">
                      {stage.count}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Right: Talent Quality & Score Distribution */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <button
              type="button"
              onClick={() => setShowQuality(prev => !prev)}
              className={clsx(
                "px-3.5 py-1.5 rounded-xl text-xs font-semibold tracking-wide transition-all duration-200 inline-flex items-center gap-2 cursor-pointer border select-none",
                showQuality
                  ? "bg-purple-500/15 border-purple-500/40 text-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.15)]"
                  : "bg-white/[0.04] border-border text-[var(--text-2)] hover:text-text hover:bg-white/[0.08] hover:border-border-2"
              )}
            >
              <Sparkles size={14} className={showQuality ? "text-purple-400" : "text-[var(--text-3)]"} />
              <span>Talent Quality & Score Distribution</span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/10 text-[var(--text-3)]">
                {showQuality ? "Hide" : "Show Breakdown"}
              </span>
              {showQuality ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>

            {showQuality && (
              <span className="text-[11px] font-mono text-[var(--text-3)] hidden sm:inline animate-fade-in">
                Total Resumes Evaluated: {total}
              </span>
            )}
          </div>

          {showQuality && (
            <div className="glass p-5 rounded-2xl animate-fade-in">
              {/* Multi-tier bar */}
              <div className="h-3 w-full rounded-full bg-white/5 overflow-hidden flex border border-border mb-3.5">
                <div
                  title={`Exceptional (80+): ${scoreBands.exceptional}`}
                  className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full transition-all duration-500"
                  style={{ width: `${total > 0 ? (scoreBands.exceptional / total) * 100 : 0}%` }}
                />
                <div
                  title={`Strong (65-79): ${scoreBands.strong}`}
                  className="bg-gradient-to-r from-cyan-400 to-blue-500 h-full transition-all duration-500"
                  style={{ width: `${total > 0 ? (scoreBands.strong / total) * 100 : 0}%` }}
                />
                <div
                  title={`Moderate (45-64): ${scoreBands.moderate}`}
                  className="bg-gradient-to-r from-amber-400 to-orange-400 h-full transition-all duration-500"
                  style={{ width: `${total > 0 ? (scoreBands.moderate / total) * 100 : 0}%` }}
                />
                <div
                  title={`Low (<45): ${scoreBands.low}`}
                  className="bg-gradient-to-r from-rose-500 to-red-500 h-full transition-all duration-500"
                  style={{ width: `${total > 0 ? (scoreBands.low / total) * 100 : 0}%` }}
                />
              </div>

              {/* Legend */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-sm bg-emerald-400 flex-shrink-0" />
                  <div>
                    <span className="text-text font-semibold">{scoreBands.exceptional}</span>
                    <span className="text-[var(--text-3)] ml-1">Exceptional (80+)</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-sm bg-cyan-400 flex-shrink-0" />
                  <div>
                    <span className="text-text font-semibold">{scoreBands.strong}</span>
                    <span className="text-[var(--text-3)] ml-1">Strong (65-79)</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-sm bg-amber-400 flex-shrink-0" />
                  <div>
                    <span className="text-text font-semibold">{scoreBands.moderate}</span>
                    <span className="text-[var(--text-3)] ml-1">Moderate (45-64)</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-sm bg-rose-400 flex-shrink-0" />
                  <div>
                    <span className="text-text font-semibold">{scoreBands.low}</span>
                    <span className="text-[var(--text-3)] ml-1">Low (&lt;45)</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
\n"""

new_content = new_content[:funnel_start] + new_funnel_block + new_content[funnel_end:]

with open(r'c:\Users\HP\Desktop\Triple S\HireDesk\src\app\(app)\page.tsx', 'w', encoding='utf-8') as f:
    f.write(new_content)

print("Replacement complete")
