"use client";
import { useState, useMemo } from "react";
import { Modal, Btn } from "@/components/ui";
import { useStore } from "@/lib/store";
import { DEFAULT_ROLES, SKILLS_POOL, EXP_LEVELS, EDU } from "@/lib/data";
import type { Candidate } from "@/types";
import { clsx } from "clsx";

interface Props {
  open: boolean;
  onClose: () => void;
  onViewCandidate: (c: Candidate) => void;
}

export default function SmartMatchModal({ open, onClose, onViewCandidate }: Props) {
  const { candidates } = useStore();

  // Requirements State
  const [roleId, setRoleId] = useState<string>("all");
  const [minScore, setMinScore] = useState<number>(50);
  const [prefExp, setPrefExp] = useState<string>("all");
  const [prefEdu, setPrefEdu] = useState<string>("all");
  const [selectedSkills, setSelectedSkills] = useState<Set<string>>(new Set());

  // Available skills to check/uncheck based on selected role (or all skills if role is "all")
  const availableSkills = useMemo(() => {
    if (roleId !== "all") {
      return SKILLS_POOL[roleId] ?? [];
    }
    // Aggregate unique skills across all pools if "all" is selected
    const all = new Set<string>();
    Object.values(SKILLS_POOL).forEach(list => list.forEach(s => all.add(s)));
    return Array.from(all).sort();
  }, [roleId]);

  // Handle skill toggle
  function toggleSkill(skill: string) {
    const next = new Set(selectedSkills);
    if (next.has(skill)) {
      next.delete(skill);
    } else {
      next.add(skill);
    }
    setSelectedSkills(next);
  }

  // Clear all filters
  function clearAll() {
    setRoleId("all");
    setMinScore(50);
    setPrefExp("all");
    setPrefEdu("all");
    setSelectedSkills(new Set());
  }

  // Automatically adjust selected skills if they are not in the new available list
  function handleRoleChange(newRole: string) {
    setRoleId(newRole);
    setSelectedSkills(new Set()); // Reset selected skills on role change to stay clean
  }

  // Calculate real-time candidate match scores
  const matchedCandidates = useMemo(() => {
    const filtered = candidates.filter(c => {
      if (roleId !== "all" && c.roleId !== roleId) return false;
      if (c.score.total < minScore) return false;
      return true;
    });

    const results = filtered.map(c => {
      // 1. Role match: 20 points (always true since we filtered)
      const rolePoints = 20;

      // 2. Experience match: 20 points
      const expPoints = prefExp === "all" || c.exp === prefExp ? 20 : 0;

      // 3. Education match: 20 points
      const eduPoints = prefEdu === "all" || c.education === prefEdu ? 20 : 0;

      // 4. Skills match: 40 points
      let skillPoints = 40;
      let matchedSkillsList: string[] = [];
      let missingSkillsList: string[] = [];

      if (selectedSkills.size > 0) {
        const reqSkills = Array.from(selectedSkills);
        const hasCount = reqSkills.filter(s => c.skills.includes(s)).length;
        skillPoints = Math.round((hasCount / reqSkills.length) * 40);
        matchedSkillsList = reqSkills.filter(s => c.skills.includes(s));
        missingSkillsList = reqSkills.filter(s => !c.skills.includes(s));
      }

      const totalMatchScore = rolePoints + expPoints + eduPoints + skillPoints;

      return {
        candidate: c,
        matchScore: totalMatchScore,
        rolePoints,
        expPoints,
        eduPoints,
        scorePoints: 10,
        skillPoints,
        matchedSkillsList,
        missingSkillsList,
      };
    });

    // Sort by match score descending, then by ATS score descending
    return results.sort((a, b) => b.matchScore - a.matchScore || b.candidate.score.total - a.candidate.score.total);
  }, [candidates, roleId, minScore, prefExp, prefEdu, selectedSkills]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      className="max-w-[1200px] w-full max-h-[95vh] md:h-[90vh] flex flex-col p-0 overflow-hidden bg-[var(--card-bg)] border-[var(--border-2)] shadow-2xl rounded-2xl"
    >
      {/* Top Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-2)] bg-[var(--table-row-hover)]/90 backdrop-blur-md flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-[#00D9FF]/10 border border-[#00D9FF]/30 flex items-center justify-center text-[#00D9FF] text-sm shadow-[0_0_12px_rgba(0,217,255,0.15)]">
            ✨
          </div>
          <div>
            <div className="text-[16px] font-bold tracking-tight text-text flex items-center gap-2">
              <span>Requirements Smart Matcher</span>
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#00D9FF] bg-[#00D9FF]/10 border border-[#00D9FF]/25 px-2 py-0.5 rounded-md">
                Live AI Match
              </span>
            </div>
            <div className="text-[15px] text-[var(--text-3)] mt-0.5">
              Specify target criteria to benchmark and instantly score candidates across your pool
            </div>
          </div>
        </div>
        <button
          onClick={onClose}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--text-3)] hover:text-[var(--text)] hover:bg-[var(--glass-2)] border border-transparent hover:border-[var(--border-3)] transition-all"
          aria-label="Close"
        >
          ✕
        </button>
      </div>

      {/* Main Grid: Left Panel (Requirements) & Right Panel (Candidate Matches) */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-12 min-h-0 divide-y md:divide-y-0 md:divide-x divide-[#1f242b] overflow-hidden">
        {/* Left Side: Filter Requirements */}
        <div className="md:col-span-5 flex flex-col min-h-0 bg-[var(--card-bg)] overflow-hidden">
          <div className="px-5 py-3 border-b border-[var(--border-2)] bg-[var(--card-bg)]/60 flex items-center justify-between flex-shrink-0">
            <span className="text-[15px] font-bold uppercase tracking-wider text-[var(--text)]">
              Match Criteria
            </span>
            <button
              onClick={clearAll}
              className="text-[15px] text-[var(--text-3)] hover:text-[#00D9FF] transition-colors font-medium"
            >
              Reset All
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-4 pr-4">
            {/* Job Profile Role */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-semibold text-[var(--text)]">Target Role</label>
              <div className="relative">
                <select
                  value={roleId}
                  onChange={e => handleRoleChange(e.target.value)}
                  className="w-full bg-[var(--card-bg)] border border-[var(--border-2)] hover:border-[var(--border-3)] focus:border-[#00D9FF] rounded-xl text-text text-[14px] px-3.5 py-2.5 outline-none transition-colors appearance-none cursor-pointer"
                >
                  <option value="all">Any / All Roles</option>
                  {DEFAULT_ROLES.map(r => (
                    <option key={r.id} value={r.id} className="bg-[var(--card-bg)] text-text">
                      {r.name}
                    </option>
                  ))}
                </select>
                <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--text-3)] text-[16px]">
                  ▼
                </div>
              </div>
            </div>

            {/* Experience and Education row */}
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-[13px] font-semibold text-[var(--text)]">Experience</label>
                <div className="relative">
                  <select
                    value={prefExp}
                    onChange={e => setPrefExp(e.target.value)}
                    className="w-full bg-[var(--card-bg)] border border-[var(--border-2)] hover:border-[var(--border-3)] focus:border-[#00D9FF] rounded-xl text-text text-[16px] px-3 py-2 outline-none transition-colors appearance-none cursor-pointer"
                  >
                    <option value="all">Any Exp.</option>
                    {EXP_LEVELS.map(x => (
                      <option key={x} value={x} className="bg-[var(--card-bg)] text-text">
                        {x}
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--text-3)] text-[16px]">
                    ▼
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[13px] font-semibold text-[var(--text)]">Education</label>
                <div className="relative">
                  <select
                    value={prefEdu}
                    onChange={e => setPrefEdu(e.target.value)}
                    className="w-full bg-[var(--card-bg)] border border-[var(--border-2)] hover:border-[var(--border-3)] focus:border-[#00D9FF] rounded-xl text-text text-[16px] px-3 py-2 outline-none transition-colors appearance-none cursor-pointer"
                  >
                    <option value="all">Any Edu.</option>
                    {EDU.map(e => (
                      <option key={e} value={e} className="bg-[var(--card-bg)] text-text">
                        {e}
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--text-3)] text-[16px]">
                    ▼
                  </div>
                </div>
              </div>
            </div>

            {/* Overall Score threshold */}
            <div className="flex flex-col gap-2 p-3.5 rounded-xl bg-[var(--card-bg)] border border-[var(--border-2)]">
              <div className="flex justify-between items-center">
                <span className="text-[13px] font-semibold text-[var(--text)]">Min ATS Score</span>
                <span className="font-mono text-[16px] text-[#00D9FF] bg-[#00D9FF]/10 border border-[#00D9FF]/25 px-2 py-0.5 rounded-md font-bold">
                  {minScore}+
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={minScore}
                onChange={e => setMinScore(Number(e.target.value))}
                className="w-full h-1.5 bg-[var(--card-bg)] rounded-lg appearance-none cursor-pointer accent-[#00D9FF]"
              />
              <div className="flex justify-between text-[16px] text-[var(--text-3)] font-mono">
                <span>0</span>
                <span>50</span>
                <span>100</span>
              </div>
            </div>

            {/* Required Skills list */}
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-1.5">
                  <label className="text-[13px] font-semibold text-[var(--text)]">Key Skills</label>
                  {selectedSkills.size > 0 && (
                    <span className="text-[16px] font-mono px-1.5 py-0.2 rounded bg-[#00D9FF]/15 text-[#00D9FF] font-semibold">
                      {selectedSkills.size}
                    </span>
                  )}
                </div>
                {selectedSkills.size > 0 && (
                  <button
                    onClick={() => setSelectedSkills(new Set())}
                    className="text-[16px] text-[var(--text-3)] hover:text-[#00D9FF] uppercase tracking-wider font-medium"
                  >
                    Clear Skills
                  </button>
                )}
              </div>
              <div className="p-3 rounded-xl border border-[var(--border-2)] bg-[var(--card-bg)] max-h-[170px] overflow-y-auto">
                <div className="flex flex-wrap gap-1.5">
                  {availableSkills.map(skill => {
                    const active = selectedSkills.has(skill);
                    return (
                      <button
                        key={skill}
                        type="button"
                        onClick={() => toggleSkill(skill)}
                        className={clsx(
                          "text-[15px] font-medium px-2.5 py-1 rounded-lg border transition-all text-left flex items-center gap-1",
                          active
                            ? "bg-[#00D9FF]/15 text-[#00D9FF] border-[#00D9FF]/40 shadow-sm"
                            : "bg-[var(--card-bg)] border-[var(--border-2)] text-[var(--text)] hover:text-[var(--text)] hover:border-[var(--border-3)]"
                        )}
                      >
                        {active && <span className="text-[16px]">✓</span>}
                        {skill}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 border-t border-[var(--border-2)] bg-[var(--card-bg)] flex-shrink-0">
            <button
              onClick={clearAll}
              className="w-full py-2.5 rounded-xl border border-[var(--border-2)] hover:border-[var(--border-3)] bg-[var(--card-bg)] hover:bg-[var(--table-row-hover)] text-[var(--text)] hover:text-[var(--text)] text-[16px] font-semibold transition-all"
            >
              Reset Requirements
            </button>
          </div>
        </div>

        {/* Right Side: Ranked Match Results */}
        <div className="md:col-span-7 flex flex-col min-h-0 bg-[var(--card-bg)] overflow-hidden">
          <div className="px-6 py-3 border-b border-[var(--border-2)] bg-[var(--card-bg)]/60 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-[15px] font-bold uppercase tracking-wider text-[var(--text)]">
                Ranked Matches
              </span>
              <span className="font-mono text-[15px] bg-[var(--card-bg)] text-[var(--text)] px-2 py-0.5 rounded-full font-medium">
                {matchedCandidates.length}
              </span>
            </div>
            <span className="text-[15px] text-[var(--text-3)]">
              Sorted by highest relevance
            </span>
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-3 pr-4">
            {matchedCandidates.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-20 text-[var(--text-3)]">
                <div className="w-12 h-12 rounded-2xl bg-[var(--card-bg)] border border-[var(--border-2)] flex items-center justify-center text-xl mb-3 text-[var(--text)]">
                  🔍
                </div>
                <div className="text-[16px] font-semibold text-[var(--text)]">No candidates matched</div>
                <div className="text-[16px] max-w-xs mt-1 text-[var(--text-3)]">
                  Try loosening your ATS score threshold, role filter, or required skills criteria.
                </div>
              </div>
            ) : (
              matchedCandidates.map(({ candidate: c, matchScore, matchedSkillsList, missingSkillsList }) => {
                const isTopTier = matchScore >= 75;
                const isMidTier = matchScore >= 45;

                const scoreColor = isTopTier
                  ? "text-[#22c55e] bg-[#22c55e]/10 border-[#22c55e]/25"
                  : isMidTier
                  ? "text-[#f5c542] bg-[#f5c542]/10 border-[#f5c542]/25"
                  : "text-[#ef4444] bg-[#ef4444]/10 border-[#ef4444]/25";

                const barColor = isTopTier
                  ? "bg-[#22c55e]"
                  : isMidTier
                  ? "bg-[#f5c542]"
                  : "bg-[#ef4444]";

                return (
                  <div
                    key={c.id}
                    className="p-4 rounded-xl border border-[var(--border-2)] bg-[var(--card-bg)] hover:border-[var(--border-3)] hover:bg-[var(--table-row-hover)] transition-all flex flex-col gap-3 group"
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div
                          className="font-bold text-[14.5px] cursor-pointer text-text group-hover:text-[#00D9FF] transition-colors truncate"
                          onClick={() => {
                            onViewCandidate(c);
                            onClose();
                          }}
                        >
                          {c.name}
                        </div>
                        <div className="text-[13px] text-[var(--text-3)] mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5">
                          <span className="text-[var(--text)] font-medium">{c.roleName}</span>
                          <span>•</span>
                          <span>{c.exp}</span>
                          <span>•</span>
                          <span>{c.education}</span>
                          {c.city && (
                            <>
                              <span>•</span>
                              <span>{c.city}</span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Match Score Badge */}
                      <div
                        className={clsx(
                          "font-mono text-[16px] font-bold px-2.5 py-1 rounded-lg border flex items-center gap-1.5 flex-shrink-0 shadow-sm",
                          scoreColor
                        )}
                      >
                        <span className="text-[16px]">✨</span>
                        <span>{matchScore}%</span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full h-1.5 rounded-full overflow-hidden bg-[var(--card-bg)]">
                      <div
                        className={clsx("h-full rounded-full transition-all duration-500", barColor)}
                        style={{ width: `${matchScore}%` }}
                      />
                    </div>

                    {/* Criteria Pill Tags */}
                    <div className="flex flex-wrap items-center gap-1.5 text-[12px] font-medium">
                      {/* Role Match */}
                      <span
                        className={clsx(
                          "px-2 py-0.5 rounded-md border flex items-center gap-1",
                          c.roleId === roleId || roleId === "all"
                            ? "bg-[#22c55e]/10 text-[#22c55e] border-[#22c55e]/20"
                            : "bg-[var(--card-bg)] text-[var(--text-3)] border-[var(--border-2)]"
                        )}
                      >
                        <span className="text-[11px]">
                          {c.roleId === roleId || roleId === "all" ? "✓" : "✕"}
                        </span>
                        Role
                      </span>

                      {/* Exp Match */}
                      <span
                        className={clsx(
                          "px-2 py-0.5 rounded-md border flex items-center gap-1",
                          prefExp === "all" || c.exp === prefExp
                            ? "bg-[#22c55e]/10 text-[#22c55e] border-[#22c55e]/20"
                            : "bg-[var(--card-bg)] text-[var(--text-3)] border-[var(--border-2)]"
                        )}
                      >
                        <span className="text-[11px]">
                          {prefExp === "all" || c.exp === prefExp ? "✓" : "✕"}
                        </span>
                        Exp ({c.exp})
                      </span>

                      {/* Edu Match */}
                      <span
                        className={clsx(
                          "px-2 py-0.5 rounded-md border flex items-center gap-1",
                          prefEdu === "all" || c.education === prefEdu
                            ? "bg-[#22c55e]/10 text-[#22c55e] border-[#22c55e]/20"
                            : "bg-[var(--card-bg)] text-[var(--text-3)] border-[var(--border-2)]"
                        )}
                      >
                        <span className="text-[11px]">
                          {prefEdu === "all" || c.education === prefEdu ? "✓" : "✕"}
                        </span>
                        Edu ({c.education})
                      </span>

                      {/* Score Match */}
                      <span
                        className={clsx(
                          "px-2 py-0.5 rounded-md border flex items-center gap-1",
                          c.score.total >= minScore
                            ? "bg-[#22c55e]/10 text-[#22c55e] border-[#22c55e]/20"
                            : "bg-[var(--card-bg)] text-[var(--text-3)] border-[var(--border-2)]"
                        )}
                      >
                        <span className="text-[11px]">
                          {c.score.total >= minScore ? "✓" : "✕"}
                        </span>
                        ATS: {c.score.total}
                      </span>

                      {/* Skills count if any selected */}
                      {selectedSkills.size > 0 && (
                        <span
                          className={clsx(
                            "px-2 py-0.5 rounded-md border flex items-center gap-1 font-mono",
                            matchedSkillsList.length === selectedSkills.size
                              ? "bg-[#22c55e]/10 text-[#22c55e] border-[#22c55e]/20"
                              : matchedSkillsList.length > 0
                              ? "bg-[#f5c542]/10 text-[#f5c542] border-[#f5c542]/20"
                              : "bg-[#ef4444]/10 text-[#ef4444] border-[#ef4444]/20"
                          )}
                        >
                          Skills: {matchedSkillsList.length}/{selectedSkills.size}
                        </span>
                      )}
                    </div>

                    {/* Skill Badges if selected */}
                    {selectedSkills.size > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {matchedSkillsList.map(s => (
                          <span
                            key={s}
                            className="text-[16px] bg-[#22c55e]/10 text-[#22c55e] font-medium border border-[#22c55e]/20 px-2 py-0.5 rounded-md flex items-center gap-1"
                          >
                            ✓ {s}
                          </span>
                        ))}
                        {missingSkillsList.map(s => (
                          <span
                            key={s}
                            className="text-[16px] bg-[#ef4444]/10 text-[#ef4444] font-medium border border-[#ef4444]/20 px-2 py-0.5 rounded-md flex items-center gap-1 opacity-80"
                          >
                            ✕ {s}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Footer Action */}
                    <div className="flex items-center justify-between pt-1 border-t border-[var(--border-2)]">
                      <span className="text-[15px] text-[var(--text-3)]">
                        ID: <span className="font-mono text-[var(--text-3)]">{c.id.slice(0, 8)}</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          onViewCandidate(c);
                          onClose();
                        }}
                        className="text-[13px] font-semibold text-[var(--text)] hover:text-[#00D9FF] flex items-center gap-1.5 transition-colors group/btn py-0.5"
                      >
                        <span>Inspect Candidate Profile</span>
                        <span className="transition-transform group-hover/btn:translate-x-0.5">→</span>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}

