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
    <Modal open={open} onClose={onClose} className="max-w-[960px] w-full max-h-[90vh] md:max-h-[85vh] flex flex-col p-4 sm:p-6 overflow-y-auto md:overflow-hidden">
      <div className="flex items-start justify-between pb-3 mb-4 border-b border-[var(--border)]">
        <div>
          <div className="text-[18px] font-bold tracking-tight">✨ Requirements Smart Matcher</div>
          <div className="font-mono text-[10px] text-[var(--text-3)] uppercase tracking-widest mt-0.5">
            Define job requirements to filter and rank candidates instantly
          </div>
        </div>
        <Btn onClick={onClose} className="text-[var(--text-3)] hover:text-white transition-colors">✕</Btn>
      </div>

      <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-6 min-h-0 md:overflow-hidden">
        {/* Left Side: Filter Requirements */}
        <div className="md:col-span-5 flex flex-col gap-4 md:overflow-y-auto pr-2 pb-4">
          <div className="text-xs font-semibold text-[var(--text-3)] uppercase tracking-widest border-b border-[var(--border)] pb-1 mb-1">
            Job Requirements
          </div>

          {/* Job Profile Role */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-semibold text-[var(--text-2)]">Preferred Job Role</label>
            <select
              value={roleId}
              onChange={e => handleRoleChange(e.target.value)}
              className="bg-[var(--glass-2)] border border-[var(--border)] rounded-xl text-white text-xs px-3 py-2 outline-none focus:border-[var(--border-3)]"
            >
              <option value="all">Any / All Profiles</option>
              {DEFAULT_ROLES.map(r => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
          </div>

          {/* Experience and Education row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-semibold text-[var(--text-2)]">Required Experience</label>
              <select
                value={prefExp}
                onChange={e => setPrefExp(e.target.value)}
                className="bg-[var(--glass-2)] border border-[var(--border)] rounded-xl text-white text-xs px-3 py-2 outline-none focus:border-[var(--border-3)]"
              >
                <option value="all">Any Experience</option>
                {EXP_LEVELS.map(x => (
                  <option key={x} value={x}>{x}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-semibold text-[var(--text-2)]">Required Education</label>
              <select
                value={prefEdu}
                onChange={e => setPrefEdu(e.target.value)}
                className="bg-[var(--glass-2)] border border-[var(--border)] rounded-xl text-white text-xs px-3 py-2 outline-none focus:border-[var(--border-3)]"
              >
                <option value="all">Any Education</option>
                {EDU.map(e => (
                  <option key={e} value={e}>{e}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Overall Score threshold */}
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between items-center">
              <label className="text-[11px] font-semibold text-[var(--text-2)]">Min Overall ATS Score</label>
              <span className="font-mono text-xs text-white bg-[var(--glass-2)] px-2 py-0.5 rounded border border-[var(--border)] font-bold">
                {minScore}+
              </span>
            </div>
            <input
              type="range" min={0} max={100} value={minScore}
              onChange={e => setMinScore(Number(e.target.value))}
              className="w-full h-1 bg-[var(--glass-3)] rounded-lg appearance-none cursor-pointer accent-white"
            />
          </div>

          {/* Required Skills list */}
          <div className="flex flex-col gap-1.5 flex-1 min-h-[150px]">
            <div className="flex justify-between items-center">
              <label className="text-[11px] font-semibold text-[var(--text-2)]">Select Required Skills ({selectedSkills.size})</label>
              {selectedSkills.size > 0 && (
                <Btn
                  onClick={() => setSelectedSkills(new Set())}
                  className="text-[9px] font-mono text-[var(--text-3)] hover:text-white uppercase tracking-wider"
                >
                  Clear Skills
                </Btn>
              )}
            </div>
            <div
              className="flex-1 p-3 rounded-xl border border-[var(--border)] overflow-y-auto max-h-[220px]"
              style={{ background: "#0a0a0a" }}
            >
              <div className="flex flex-wrap gap-1.5">
                {availableSkills.map(skill => {
                  const active = selectedSkills.has(skill);
                  return (
                    <Btn
                      key={skill}
                      onClick={() => toggleSkill(skill)}
                      className={clsx(
                        "text-[10px] font-medium px-2.5 py-1 rounded-lg border transition-all",
                        active
                          ? "bg-white text-black border-white font-semibold"
                          : "bg-[var(--glass)] border-[var(--border)] text-[var(--text-3)] hover:text-white hover:border-[var(--border-2)]"
                      )}
                    >
                      {skill}
                    </Btn>
                  );
                })}
              </div>
            </div>
          </div>

          <Btn variant="outline" size="sm" onClick={clearAll} className="w-full text-center justify-center">
            Reset Requirements
          </Btn>
        </div>

        {/* Right Side: Ranked Match Results */}
        <div className="md:col-span-7 flex flex-col min-h-0 overflow-hidden">
          <div className="text-xs font-semibold text-[var(--text-3)] uppercase tracking-widest border-b border-[var(--border)] pb-1 mb-3 flex justify-between">
            <span>Ranked Candidates ({matchedCandidates.length})</span>
            <span className="font-mono text-[10px] text-[var(--text-3)] lowercase italic">highest match percentage first</span>
          </div>

          <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-2 pb-4">
            {matchedCandidates.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center py-20 text-[var(--text-3)]">
                <span className="text-3xl mb-2 opacity-30">🔍</span>
                <span className="text-sm font-semibold">No candidates found</span>
                <span className="text-xs max-w-xs mt-1">Upload resumes in the main table first.</span>
              </div>
            ) : (
              matchedCandidates.map(({ candidate: c, matchScore, matchedSkillsList, missingSkillsList }) => {
                const badgeColor = matchScore >= 75 ? "text-[var(--green)] bg-green-500/10 border-green-500/20" : matchScore >= 45 ? "text-[var(--yellow)] bg-yellow-500/10 border-yellow-500/20" : "text-[var(--red)] bg-red-500/10 border-red-500/20";
                return (
                  <div
                    key={c.id}
                    className="p-4 rounded-xl border border-[var(--border)] hover:border-[var(--border-3)] hover:bg-white/[0.01] transition-all flex flex-col gap-2.5"
                    style={{ background: "var(--glass)" }}
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between">
                      <div>
                        <div
                          className="font-bold text-[14px] cursor-pointer hover:underline text-white"
                          onClick={() => {
                            onViewCandidate(c);
                            onClose();
                          }}
                        >
                          {c.name}
                        </div>
                        <div className="text-[11px] text-[var(--text-3)] font-medium mt-0.5">
                          {c.roleName} · {c.exp} · {c.education} · {c.city}
                        </div>
                      </div>

                      {/* Match Score Badge */}
                      <div className={clsx("font-mono text-xs font-extrabold px-3 py-1 rounded-lg border flex items-center gap-1.5", badgeColor)}>
                        <span>✨</span>
                        <span>{matchScore}% Match</span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full h-1.5 rounded-full overflow-hidden bg-white/[0.04]">
                      <div
                        className={clsx(
                          "h-full rounded-full transition-all duration-500",
                          matchScore >= 75 ? "bg-[var(--green)]" : matchScore >= 45 ? "bg-[var(--yellow)]" : "bg-[var(--red)]"
                        )}
                        style={{ width: `${matchScore}%` }}
                      />
                    </div>

                    {/* Matching Breakdown details */}
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-[10px] font-mono text-[var(--text-3)] border-t border-white/[0.03] pt-2 mt-0.5">
                      <div className="flex items-center gap-1">
                        <span>{c.roleId === roleId || roleId === "all" ? "🟢" : "🔴"}</span>
                        <span>Role</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span>{prefExp === "all" || c.exp === prefExp ? "🟢" : "🔴"}</span>
                        <span>Exp ({c.exp})</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span>{prefEdu === "all" || c.education === prefEdu ? "🟢" : "🔴"}</span>
                        <span>Edu ({c.education})</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span>{c.score.total >= minScore ? "🟢" : "🔴"}</span>
                        <span>ATS Score ({c.score.total})</span>
                      </div>
                      {selectedSkills.size > 0 && (
                        <div className="flex items-center gap-1">
                          <span>{matchedSkillsList.length === selectedSkills.size ? "🟢" : matchedSkillsList.length > 0 ? "🟡" : "🔴"}</span>
                          <span>Skills: {matchedSkillsList.length}/{selectedSkills.size} matched</span>
                        </div>
                      )}
                    </div>

                    {/* Skills list tags */}
                    {selectedSkills.size > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-1 border-t border-white/[0.03] pt-2">
                        {matchedSkillsList.map(s => (
                          <span key={s} className="text-[9px] bg-green-500/10 text-[var(--green)] font-semibold border border-green-500/20 px-2 py-0.5 rounded-lg flex items-center gap-1">
                            ✓ {s}
                          </span>
                        ))}
                        {missingSkillsList.map(s => (
                          <span key={s} className="text-[9px] bg-red-500/10 text-red-400 font-semibold border border-red-500/20 px-2 py-0.5 rounded-lg flex items-center gap-1">
                            ✕ {s}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Quick Profile Viewer action */}
                    <div className="flex justify-end pt-1">
                      <Btn
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          onViewCandidate(c);
                          onClose();
                        }}
                        className="text-[10px] font-bold"
                      >
                        Inspect Candidate Profile →
                      </Btn>
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
