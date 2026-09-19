"use client";
import React, { useState, useMemo } from "react";
import { useStore } from "@/lib/store";
import { Btn, Modal, Input } from "@/components/ui";
import { FilterSelect, type FilterOption } from "@/components/candidates/FilterSelect";
import { useRouter } from "next/navigation";
import { clsx } from "clsx";
import { 
  Trash2, 
  Pencil, 
  Search, 
  X, 
  Briefcase, 
  GraduationCap, 
  Zap, 
  Users, 
  Layers, 
  Sparkles,
  SlidersHorizontal
} from "lucide-react";
import { dialog } from "@/lib/dialog";
import type { Role } from "@/types";

const EMPLOYMENT_TYPE_OPTIONS: FilterOption[] = [
  {
    value: "Full-time",
    label: "Full-time",
    icon: <Briefcase size={14} className="text-cyan-400" />,
  },
  {
    value: "Intern",
    label: "Intern",
    icon: <GraduationCap size={14} className="text-purple-400" />,
  },
  {
    value: "Freelance",
    label: "Freelance",
    icon: <Zap size={14} className="text-amber-400" />,
  },
];

export default function RolesGrid() {
  const { roles, addRole, updateRole, deleteRole, deleteRoles, setFilters, candidates } = useStore();
  const router = useRouter();

  // Search & Filter controls
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTypeFilter, setActiveTypeFilter] = useState<"All" | "Full-time" | "Intern" | "Freelance">("All");

  // Add Role state
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState("");
  const [type, setType] = useState<"Full-time" | "Intern" | "Freelance">("Full-time");
  const [skills, setSkills] = useState("");

  // Selection & bulk delete
  const [selectedRoleIds, setSelectedRoleIds] = useState<Set<string>>(new Set());
  const [isDeleting, setIsDeleting] = useState(false);

  // Edit Role state
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [editName, setEditName] = useState("");
  const [editType, setEditType] = useState<"Full-time" | "Intern" | "Freelance">("Full-time");
  const [editSkills, setEditSkills] = useState("");
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  function handleAdd() {
    if (!name.trim()) return;
    const keywords = skills.split(",").map(s => s.trim().toLowerCase()).filter(Boolean);
    addRole({
      id: name.toLowerCase().replace(/\s+/g, "-") + "-" + Date.now(),
      name: name.trim(), type, keywords, count: 0, isActive: true,
    });
    setName(""); setSkills(""); setType("Full-time"); setShowAdd(false);
    dialog.success({
      title: "Role Created",
      message: `Role "${name.trim()}" has been successfully added.`,
    });
  }

  function handleOpenEdit(e: React.MouseEvent, r: Role) {
    e.stopPropagation();
    setEditingRole(r);
    setEditName(r.name);
    setEditType(r.type);
    setEditSkills(r.keywords.join(", "));
  }

  async function handleSaveEdit() {
    if (!editingRole || !editName.trim()) return;
    const keywords = editSkills.split(",").map(s => s.trim().toLowerCase()).filter(Boolean);
    setIsSavingEdit(true);
    try {
      await updateRole(editingRole.id, {
        name: editName.trim(),
        type: editType,
        keywords,
      });
      setEditingRole(null);
      dialog.success({
        title: "Role Updated",
        message: `Role "${editName.trim()}" has been updated successfully.`,
      });
    } catch (err: any) {
      console.error("[RolesGrid] Failed to update role:", err);
      dialog.error({
        title: "Update Failed",
        message: `Failed to update role: ${err?.message || "Unknown error"}`,
      });
    } finally {
      setIsSavingEdit(false);
    }
  }

  function viewCandidates(roleId: string) {
    setFilters({ roleId });
    router.push("/candidates");
  }

  function toggleSelectRole(id: string) {
    setSelectedRoleIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleDeleteRole(e: React.MouseEvent, role: Role) {
    e.stopPropagation();
    if (isDeleting) return;

    const roleCandidatesCount = candidates.filter(c => c.roleId === role.id).length;
    const confirmed = await dialog.confirm({
      title: `Delete Role: ${role.name}`,
      message: roleCandidatesCount > 0
        ? `Are you sure you want to delete "${role.name}"? There are ${roleCandidatesCount} candidate(s) currently tagged with this role. Their profiles will remain intact, but this role category will be removed.`
        : `Are you sure you want to delete "${role.name}"? This action cannot be undone.`,
      confirmText: "DELETE ROLE",
      cancelText: "CANCEL",
      isDestructive: true,
    });

    if (!confirmed) return;

    setIsDeleting(true);
    try {
      await deleteRole(role.id);
      setSelectedRoleIds(prev => {
        const next = new Set(prev);
        next.delete(role.id);
        return next;
      });
      dialog.success({
        title: "Role Deleted",
        message: `Role "${role.name}" was successfully deleted.`,
      });
    } catch (err: any) {
      console.error("[RolesGrid] Failed to delete role:", err);
      dialog.error({
        title: "Deletion Failed",
        message: `Could not delete role: ${err?.message || "Unknown error"}`,
      });
    } finally {
      setIsDeleting(false);
    }
  }

  async function handleDeleteSelected() {
    if (isDeleting || selectedRoleIds.size === 0) return;
    const count = selectedRoleIds.size;
    const selectedRoles = roles.filter(r => selectedRoleIds.has(r.id));
    const roleNames = selectedRoles.map(r => r.name).join(", ");
    const totalAffectedCandidates = candidates.filter(c => selectedRoleIds.has(c.roleId)).length;

    const confirmed = await dialog.confirm({
      title: `Delete ${count} Selected Role${count > 1 ? "s" : ""}`,
      message: totalAffectedCandidates > 0
        ? `Are you sure you want to delete ${count} role(s) (${roleNames})? There are ${totalAffectedCandidates} candidate(s) tagged with these roles.`
        : `Are you sure you want to delete ${count} selected role(s) (${roleNames})? This action cannot be undone.`,
      confirmText: `DELETE ${count} ROLE${count > 1 ? "S" : ""}`,
      cancelText: "CANCEL",
      isDestructive: true,
    });

    if (!confirmed) return;

    setIsDeleting(true);
    try {
      await deleteRoles(Array.from(selectedRoleIds));
      setSelectedRoleIds(new Set());
      dialog.success({
        title: "Roles Deleted",
        message: `Successfully deleted ${count} selected role${count > 1 ? "s" : ""}.`,
      });
    } catch (err: any) {
      console.error("[RolesGrid] Failed to delete selected roles:", err);
      dialog.error({
        title: "Deletion Failed",
        message: `Could not delete selected roles: ${err?.message || "Unknown error"}`,
      });
    } finally {
      setIsDeleting(false);
    }
  }

  const totalCandidates = candidates.length;

  // Filter roles based on search and employment type
  const filteredRoles = useMemo(() => {
    return roles.filter(r => {
      const matchesSearch = 
        !searchQuery.trim() ||
        r.name.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
        r.keywords.some(k => k.toLowerCase().includes(searchQuery.toLowerCase().trim()));
      
      const matchesType = activeTypeFilter === "All" || r.type === activeTypeFilter;
      return matchesSearch && matchesType;
    });
  }, [roles, searchQuery, activeTypeFilter]);

  function getTypeBadge(roleType: Role["type"]) {
    switch (roleType) {
      case "Full-time":
        return (
          <span className="inline-flex items-center gap-1.5 font-mono text-[16px] px-2 py-0.5 rounded-md bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-medium whitespace-nowrap">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
            Full-time
          </span>
        );
      case "Intern":
        return (
          <span className="inline-flex items-center gap-1.5 font-mono text-[16px] px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-400 border border-purple-500/20 font-medium whitespace-nowrap">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-400"></span>
            Intern
          </span>
        );
      case "Freelance":
        return (
          <span className="inline-flex items-center gap-1.5 font-mono text-[16px] px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20 font-medium whitespace-nowrap">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
            Freelance
          </span>
        );
    }
  }

  return (
    <>
      {/* Overview Stats Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div className="p-3.5 rounded-xl bg-[var(--card-bg)] border border-[var(--border-2)] flex flex-col justify-between shadow-sm">
          <div className="text-[15px] font-mono text-[var(--text-3)] uppercase tracking-wider flex items-center gap-1.5">
            <Layers size={13} className="text-cyan-400" /> Total Roles
          </div>
          <div className="text-xl sm:text-2xl font-bold text-text mt-1.5">{roles.length}</div>
        </div>

        <div className="p-3.5 rounded-xl bg-[var(--card-bg)] border border-[var(--border-2)] flex flex-col justify-between shadow-sm">
          <div className="text-[15px] font-mono text-[var(--text-3)] uppercase tracking-wider flex items-center gap-1.5">
            <Users size={13} className="text-[var(--text-3)]" /> Total Candidates
          </div>
          <div className="text-xl sm:text-2xl font-bold text-text mt-1.5">{totalCandidates}</div>
        </div>

        <div className="p-3.5 rounded-xl bg-[var(--card-bg)] border border-[var(--border-2)] flex flex-col justify-between shadow-sm">
          <div className="text-[15px] font-mono text-[var(--text-3)] uppercase tracking-wider flex items-center gap-1.5">
            <Briefcase size={13} className="text-cyan-400" /> Full-time
          </div>
          <div className="text-xl sm:text-2xl font-bold text-text mt-1.5">
            {roles.filter(r => r.type === "Full-time").length}
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-[var(--card-bg)] border border-[var(--border-2)] flex flex-col justify-between shadow-sm">
          <div className="text-[15px] font-mono text-[var(--text-3)] uppercase tracking-wider flex items-center gap-1.5">
            <GraduationCap size={13} className="text-purple-400" /> Intern / Freelance
          </div>
          <div className="text-xl sm:text-2xl font-bold text-text mt-1.5">
            {roles.filter(r => r.type !== "Full-time").length}
          </div>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-3)]" />
          <input
            type="text"
            placeholder="Search roles by name or skill keywords..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full h-[40px] pl-9 pr-8 bg-[var(--input-bg)] border border-[var(--input-border)] hover:border-[var(--border-2)] focus:border-[#00D9FF] focus:ring-1 focus:ring-[#00D9FF]/20 rounded-xl text-sm text-[var(--text)] placeholder:text-[var(--text-3)] outline-none transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--text-3)] hover:text-[var(--text)] p-1"
            >
              <X size={13} />
            </button>
          )}
        </div>

        {/* Type Tabs */}
        <div className="flex items-center gap-1 p-1 bg-[var(--card-bg)] border border-[var(--border-2)] rounded-xl self-start sm:self-auto overflow-x-auto">
          {(["All", "Full-time", "Intern", "Freelance"] as const).map(tab => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTypeFilter(tab)}
              className={clsx(
                "px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all whitespace-nowrap",
                activeTypeFilter === tab
                  ? "bg-[var(--card-bg)] text-[#00D9FF] shadow-sm border border-[#00D9FF]/25 font-bold"
                  : "text-[var(--text-3)] hover:text-[var(--text)] hover:bg-[var(--card-bg)]"
              )}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Bulk action bar when roles are selected */}
      {selectedRoleIds.size > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3 rounded-xl mb-4 bg-[var(--input-bg)] border border-[var(--input-border)] animate-fade-in shadow-lg">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-[var(--text)] uppercase tracking-wider">
              {selectedRoleIds.size} role{selectedRoleIds.size !== 1 ? "s" : ""} selected
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Btn
              variant="danger"
              size="sm"
              onClick={handleDeleteSelected}
              disabled={isDeleting}
              className="inline-flex items-center gap-1.5"
            >
              <Trash2 size={13} />
              <span>{isDeleting ? "Deleting..." : `Delete Selected Role${selectedRoleIds.size !== 1 ? "s" : ""}`}</span>
            </Btn>
            <Btn
              variant="outline"
              size="sm"
              onClick={() => setSelectedRoleIds(new Set())}
              disabled={isDeleting}
            >
              Clear Selection
            </Btn>
          </div>
        </div>
      )}

      {/* Roles grid — 1 col on mobile, 2 on sm, 3 on desktop */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredRoles.map(r => {
          const isSel = selectedRoleIds.has(r.id);
          const pct = totalCandidates > 0 ? Math.round(r.count / totalCandidates * 100) : 0;
          const avgScore = candidates.filter(c => c.roleId === r.id).reduce((a, c) => a + c.score.total, 0) / (r.count || 1);
          return (
            <div
              key={r.id}
              className={clsx(
                "p-4 sm:p-5 rounded-2xl transition-all duration-200 cursor-pointer active:scale-[0.98] relative group flex flex-col justify-between",
                isSel
                  ? "border border-[#00D9FF]/60 bg-[#00D9FF]/[0.05] shadow-[0_0_20px_rgba(0,217,255,0.08)] ring-1 ring-[#00D9FF]/30"
                  : "bg-[var(--card-bg)]/80 hover:bg-[var(--card-bg)] border border-[var(--border-2)] hover:border-[var(--border-2)] shadow-sm hover:shadow-lg hover:shadow-black/40 hover:-translate-y-0.5"
              )}
              onClick={() => viewCandidates(r.id)}
            >
              <div>
                <div className="flex justify-between items-start mb-2.5">
                  <div className="flex items-start gap-2.5 flex-1 min-w-0 mr-2">
                    <input
                      type="checkbox"
                      checked={isSel}
                      onChange={(e) => {
                        e.stopPropagation();
                        toggleSelectRole(r.id);
                      }}
                      onClick={(e) => e.stopPropagation()}
                      className="w-4 h-4 mt-1 rounded border-[var(--input-border)] bg-[var(--input-bg)] accent-[#00D9FF] cursor-pointer shrink-0"
                      title={`Select ${r.name}`}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm sm:text-base font-bold truncate text-[var(--text)] group-hover:text-[var(--text)] transition-colors">
                        {r.name}
                      </div>
                      <div className="mt-1">
                        {getTypeBadge(r.type)}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 flex-shrink-0">
                    <span 
                      className={clsx(
                        "font-mono text-[15px] px-2 py-0.5 rounded-lg border font-semibold flex items-center gap-1",
                        r.count > 0 
                          ? "bg-cyan-500/10 text-cyan-300 border-cyan-500/30" 
                          : "bg-[var(--card-bg)] text-[var(--text-3)] border-[var(--border-2)]"
                      )}
                      title={`${r.count} candidate(s) mapped`}
                    >
                      <Users size={10} className="opacity-70" />
                      {r.count}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => handleOpenEdit(e, r)}
                      className="p-1.5 rounded-lg text-[var(--text-3)] hover:text-[#00D9FF] hover:bg-[#00D9FF]/10 border border-transparent hover:border-[#00D9FF]/20 transition-all duration-150 active:scale-95"
                      title={`Edit ${r.name}`}
                      aria-label={`Edit ${r.name}`}
                    >
                      <Pencil size={13} />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => handleDeleteRole(e, r)}
                      className="p-1.5 rounded-lg text-[var(--text-3)] hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-all duration-150 active:scale-95"
                      title={`Delete ${r.name}`}
                      aria-label={`Delete ${r.name}`}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                {/* Candidate Share Progress Bar */}
                <div className="h-[3px] bg-[var(--card-bg)] rounded-full my-3 overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-[#00D9FF] to-[#3B82F6] rounded-full transition-all duration-700" 
                    style={{ width: `${pct}%` }} 
                  />
                </div>

                {/* Keywords Chips */}
                <div className="flex flex-wrap gap-1 mb-3">
                  {r.keywords.slice(0, 4).map(k => (
                    <span 
                      key={k} 
                      className="font-mono text-[9.5px] px-2 py-0.5 rounded-md border border-[var(--border-2)] bg-[var(--card-bg)] text-[var(--text-3)] uppercase font-medium hover:text-[var(--text)] transition-colors"
                    >
                      {k}
                    </span>
                  ))}
                  {r.keywords.length > 4 && (
                    <span className="font-mono text-[9.5px] px-1.5 py-0.5 rounded-md bg-[var(--card-bg)] text-[var(--text-3)] font-medium self-center">
                      +{r.keywords.length - 4}
                    </span>
                  )}
                </div>
              </div>

              {/* Card Footer: Avg Score */}
              {r.count > 0 ? (
                <div className="pt-2.5 border-t border-[var(--border-2)] flex items-center justify-between font-mono text-[10.5px]">
                  <span className="text-[var(--text-3)]">Avg Score</span>
                  <span className={clsx(
                    "px-2 py-0.5 rounded-md font-bold text-xs",
                    avgScore >= 70 ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/25" :
                    avgScore >= 45 ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/25" :
                    "bg-amber-500/10 text-amber-400 border border-amber-500/25"
                  )}>
                    {Math.round(avgScore)}
                  </span>
                </div>
              ) : (
                <div className="pt-2.5 border-t border-[var(--border-2)] flex items-center justify-between font-mono text-[10.5px] text-[var(--text-3)]">
                  <span>Avg Score</span>
                  <span>—</span>
                </div>
              )}
            </div>
          );
        })}

        {/* Existing Add Role card at the end of the grid */}
        <Btn
          onClick={() => setShowAdd(true)}
          className="p-5 rounded-2xl border-2 border-dashed border-[var(--border-2)] hover:border-[#00D9FF]/50 bg-[var(--card-bg)]/50 hover:bg-[var(--card-bg)] text-[var(--text-3)] hover:text-[var(--text)] transition-all duration-200 flex flex-col items-center justify-center gap-2.5 min-h-[140px] active:scale-[0.98] group shadow-sm"
        >
          <div className="w-10 h-10 rounded-xl bg-[var(--card-bg)] group-hover:bg-[#00D9FF]/10 border border-[var(--border-2)] group-hover:border-[#00D9FF]/30 flex items-center justify-center text-xl text-[var(--text-3)] group-hover:text-[#00D9FF] transition-all">
            +
          </div>
          <div className="font-mono text-[15px] uppercase tracking-widest text-[var(--text-3)] group-hover:text-[var(--text)] font-semibold">
            Add Role
          </div>
        </Btn>
      </div>

      {filteredRoles.length === 0 && (
        <div className="text-center py-12 p-6 rounded-2xl bg-[var(--card-bg)] border border-[var(--border-2)] mt-4">
          <SlidersHorizontal size={28} className="mx-auto text-[var(--text-3)] mb-3" />
          <div className="text-base font-semibold text-[var(--text)]">No matching roles found</div>
          <div className="text-xs text-[var(--text-3)] mt-1 max-w-sm mx-auto">
            Try adjusting your search query or reset the employment type filter to view all roles.
          </div>
          <button
            onClick={() => { setSearchQuery(""); setActiveTypeFilter("All"); }}
            className="mt-4 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[var(--card-bg)] hover:bg-[var(--card-bg)] text-[#00D9FF] border border-[#00D9FF]/20 transition-all"
          >
            Clear Filters
          </button>
        </div>
      )}

      {/* Add Role Modal */}
      <Modal open={showAdd} onClose={() => setShowAdd(false)} className="max-w-[480px] w-full">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
            <Layers size={16} />
          </div>
          <div>
            <div className="text-lg sm:text-xl font-bold text-[var(--text)] tracking-tight">Add New Role</div>
            <div className="font-mono text-xs text-[var(--text)] tracking-wide">Define role title, employment type, and scoring keywords</div>
          </div>
        </div>

        <div className="h-px bg-[var(--card-bg)] my-4" />

        <div className="flex flex-col gap-4">
          <Input 
            label="Role Name" 
            placeholder="e.g. Brand Strategist" 
            value={name} 
            onChange={e => setName(e.target.value)} 
          />

          {/* Employment Type using candidate-themed FilterSelect */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-[var(--text-3)] uppercase tracking-wider">
              Employment Type
            </label>
            <FilterSelect
              options={EMPLOYMENT_TYPE_OPTIONS}
              value={type}
              onChange={val => setType(val as typeof type)}
              placeholder="Select Employment Type"
              containerClassName="w-full"
              menuClassName="w-full max-w-none bg-[var(--input-bg)] border-[var(--border-2)] shadow-2xl"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Input 
              label="Key Skills / Keywords (comma separated)" 
              placeholder="e.g. branding, strategy, market research, analysis"
              value={skills} 
              onChange={e => setSkills(e.target.value)} 
            />

            {/* Live keyword chip preview */}
            {skills.trim() && (
              <div className="flex flex-wrap gap-1.5 mt-1 p-2.5 rounded-xl bg-[var(--card-bg)] border border-[var(--border-2)]">
                <div className="text-[16px] text-[var(--text-3)] uppercase tracking-wider w-full mb-0.5 font-mono">
                  Keyword Preview ({skills.split(",").filter(s => s.trim()).length}):
                </div>
                {skills.split(",").map(s => s.trim()).filter(Boolean).map(tag => (
                  <span 
                    key={tag} 
                    className="font-mono text-[16px] px-2 py-0.5 rounded-md bg-[var(--card-bg)] text-cyan-300 border border-cyan-500/25"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="h-px bg-[var(--card-bg)] my-5" />
        <div className="flex justify-end gap-2.5">
          <Btn variant="ghost" onClick={() => setShowAdd(false)}>Cancel</Btn>
          <Btn variant="primary" onClick={handleAdd} disabled={!name.trim()}>Create Role</Btn>
        </div>
      </Modal>

      {/* Edit Role Modal */}
      <Modal open={!!editingRole} onClose={() => setEditingRole(null)} className="max-w-[480px] w-full">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-8 h-8 rounded-lg bg-[#00D9FF]/10 border border-[#00D9FF]/20 flex items-center justify-center text-[#00D9FF]">
            <Pencil size={15} />
          </div>
          <div>
            <div className="text-lg sm:text-xl font-bold text-[var(--text)] tracking-tight">Edit Role</div>
            <div className="font-mono text-xs text-[var(--text)] tracking-wide">
              Update role title, employment type, or scoring keywords
            </div>
          </div>
        </div>

        <div className="h-px bg-[var(--card-bg)] my-4" />

        <div className="flex flex-col gap-4">
          <Input
            label="Role Name"
            placeholder="e.g. Brand Strategist"
            value={editName}
            onChange={e => setEditName(e.target.value)}
          />

          {/* Employment Type using candidate-themed FilterSelect */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-[var(--text-3)] uppercase tracking-wider">
              Employment Type
            </label>
            <FilterSelect
              options={EMPLOYMENT_TYPE_OPTIONS}
              value={editType}
              onChange={val => setEditType(val as typeof editType)}
              placeholder="Select Employment Type"
              containerClassName="w-full"
              menuClassName="w-full max-w-none bg-[var(--input-bg)] border-[var(--border-2)] shadow-2xl"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Input
              label="Key Skills / Keywords (comma separated)"
              placeholder="e.g. branding, strategy, market research, analysis"
              value={editSkills}
              onChange={e => setEditSkills(e.target.value)}
            />

            {/* Live keyword chip preview */}
            {editSkills.trim() && (
              <div className="flex flex-wrap gap-1.5 mt-1 p-2.5 rounded-xl bg-[var(--card-bg)] border border-[var(--border-2)]">
                <div className="text-[16px] text-[var(--text-3)] uppercase tracking-wider w-full mb-0.5 font-mono">
                  Keyword Preview ({editSkills.split(",").filter(s => s.trim()).length}):
                </div>
                {editSkills.split(",").map(s => s.trim()).filter(Boolean).map(tag => (
                  <span 
                    key={tag} 
                    className="font-mono text-[16px] px-2 py-0.5 rounded-md bg-[var(--card-bg)] text-cyan-300 border border-cyan-500/25"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="h-px bg-[var(--card-bg)] my-5" />
        <div className="flex justify-end gap-2.5">
          <Btn variant="ghost" onClick={() => setEditingRole(null)} disabled={isSavingEdit}>
            Cancel
          </Btn>
          <Btn variant="primary" onClick={handleSaveEdit} disabled={!editName.trim() || isSavingEdit}>
            {isSavingEdit ? "Saving..." : "Save Changes"}
          </Btn>
        </div>
      </Modal>
    </>
  );
}



