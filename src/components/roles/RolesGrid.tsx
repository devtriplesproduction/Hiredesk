"use client";
import { useState } from "react";
import { useStore } from "@/lib/store";
import { Btn, Modal, Input, Select } from "@/components/ui";
import { useRouter } from "next/navigation";
import { clsx } from "clsx";

export default function RolesGrid() {
  const { roles, addRole, setFilters, candidates } = useStore();
  const router = useRouter();
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState("");
  const [type, setType] = useState<"Full-time" | "Intern" | "Freelance">("Full-time");
  const [skills, setSkills] = useState("");

  function handleAdd() {
    if (!name.trim()) return;
    const keywords = skills.split(",").map(s => s.trim().toLowerCase()).filter(Boolean);
    addRole({
      id: name.toLowerCase().replace(/\s+/g, "-") + "-" + Date.now(),
      name: name.trim(), type, keywords, count: 0, isActive: true,
    });
    setName(""); setSkills(""); setShowAdd(false);
  }

  function viewCandidates(roleId: string) {
    setFilters({ roleId });
    router.push("/candidates");
  }

  const totalCandidates = candidates.length;

  return (
    <>
      {/* Roles grid — 1 col on mobile, 2 on sm, 3 on lg, 4 on xl */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {roles.map(r => {
          const pct = totalCandidates > 0 ? Math.round(r.count / totalCandidates * 100) : 0;
          const avgScore = candidates.filter(c => c.roleId === r.id).reduce((a, c) => a + c.score.total, 0) / (r.count || 1);
          return (
            <div
              key={r.id}
              className="p-4 sm:p-5 rounded-xl glass hover:bg-[var(--glass-2)] hover:border-[var(--border-2)] transition-all duration-200 cursor-pointer active:scale-[0.98]"
              onClick={() => viewCandidates(r.id)}
            >
              <div className="flex justify-between items-start mb-2">
                <div className="flex-1 min-w-0 mr-2">
                  <div className="text-sm sm:text-base font-semibold truncate text-[#F2F2F2]">{r.name}</div>
                  <div className="font-mono text-[10.5px] text-[#B0B0B0] mt-0.5 uppercase tracking-widest font-medium">{r.type}</div>
                </div>
                <span className="font-mono text-xs px-2 py-0.5 rounded-lg border border-[#3A3A3A] bg-[#292929] text-[#D4D4D8] font-medium flex-shrink-0">{r.count}</span>
              </div>

              {/* Bar */}
              <div className="h-[2px] bg-[var(--glass-3)] rounded-full mb-3">
                <div className="h-full bg-white/60 rounded-full transition-all duration-700" style={{ width: `${pct}%` }} />
              </div>

              {/* Keywords */}
              <div className="flex flex-wrap gap-1">
                {r.keywords.slice(0, 4).map(k => (
                  <span key={k} className="font-mono text-[9.5px] px-1.5 py-0.5 rounded border border-[var(--border-2)] bg-[var(--glass)] text-[#A0A0A0] uppercase font-medium">
                    {k}
                  </span>
                ))}
                {r.keywords.length > 4 && (
                  <span className="font-mono text-[9.5px] text-[#A0A0A0] font-medium self-center">+{r.keywords.length - 4}</span>
                )}
              </div>

              {r.count > 0 && (
                <div className="mt-3 pt-2 border-t border-[var(--border)] font-mono text-[10.5px] text-[#8A8A8A]">
                  Avg score: <span className="text-[#F2F2F2] font-semibold">{Math.round(avgScore)}</span>
                </div>
              )}
            </div>
          );
        })}

        {/* Add role card */}
        <Btn
          onClick={() => setShowAdd(true)}
          className="p-4 sm:p-5 rounded-xl border-2 border-dashed border-[var(--border-2)] text-[#A0A0A0] hover:border-[var(--border-3)] hover:text-[#F2F2F2] transition-all duration-200 flex flex-col items-center justify-center gap-2 min-h-[120px] active:scale-[0.98]"
        >
          <div className="text-3xl text-[#A0A0A0] font-light">+</div>
          <div className="font-mono text-[10.5px] uppercase tracking-widest text-[#B0B0B0] font-medium">Add Role</div>
        </Btn>
      </div>

      {/* Add Role Modal */}
      <Modal open={showAdd} onClose={() => setShowAdd(false)} className="max-w-[460px] w-full">
        <div className="text-lg sm:text-xl font-bold mb-1 text-[#F2F2F2] tracking-tight">Add New Role</div>
        <div className="font-mono text-xs text-[#B0B0B0] mb-5 tracking-wide">Define role name, type, and scoring keywords</div>

        <div className="flex flex-col gap-4">
          <Input label="Role Name" placeholder="e.g. Brand Strategist" value={name} onChange={e => setName(e.target.value)} />
          <Select label="Employment Type" value={type} onChange={e => setType(e.target.value as typeof type)}>
            <option value="Full-time">Full-time</option>
            <option value="Intern">Intern</option>
            <option value="Freelance">Freelance</option>
          </Select>
          <Input label="Key Skills / Keywords (comma separated)" placeholder="e.g. branding, strategy, market research, analysis"
            value={skills} onChange={e => setSkills(e.target.value)} />
        </div>

        <div className="h-px bg-[var(--border)] my-5" />
        <div className="flex justify-end gap-2">
          <Btn variant="ghost" onClick={() => setShowAdd(false)}>Cancel</Btn>
          <Btn variant="primary" onClick={handleAdd} disabled={!name.trim()}>Add Role</Btn>
        </div>
      </Modal>
    </>
  );
}
