"use client";
import { useState, useCallback, useMemo, memo } from "react";
import { useStore, useFilteredCandidates } from "@/lib/store";
import { Btn, ScoreBadge, StatusBadge, EmptyState } from "@/components/ui";
import CandidateDetail from "./CandidateDetail";
import FiltersBar from "./FiltersBar";
import BulkDeleteModal from "./BulkDeleteModal";
import SmartMatchModal from "./SmartMatchModal";
import type { Candidate } from "@/types";
import { clsx } from "clsx";

const thCls = "font-mono text-[9px] uppercase tracking-widest text-[var(--text-3)] px-3 py-2.5 text-left font-normal border-b border-[var(--border)]";
const tdCls = "px-3 py-2.5 border-b border-white/[0.04] align-middle";
const tdMono = clsx(tdCls, "font-mono text-[10px] text-[var(--text-3)]");

// ─── Memoized Row: only re-renders when its own candidate or selection changes ─
interface RowProps {
  candidate: Candidate;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onView: (c: Candidate) => void;
  onReject: (id: string, name: string) => void;
}

const CandidateRow = memo(function CandidateRow({ candidate: c, isSelected, onSelect, onView, onReject }: RowProps) {
  return (
    <tr className="group hover:bg-white/[0.02] transition-colors">
      <td className={tdCls}>
        <input type="checkbox" checked={isSelected} onChange={() => onSelect(c.id)} />
      </td>
      <td className={tdCls}>
        <div
          className="font-semibold text-[13px] cursor-pointer hover:text-white transition-colors"
          onClick={() => onView(c)}
        >{c.name}</div>
        <div className="font-mono text-[9px] text-[var(--text-3)]">{c.email}</div>
      </td>
      <td className={tdCls}>
        <div className="font-mono text-[10px] text-[var(--text-2)]">{c.roleName}</div>
      </td>
      <td className={tdCls}><ScoreBadge score={c.score.total} /></td>
      <td className={tdCls}><StatusBadge status={c.status} /></td>
      <td className={tdMono}>{c.city}</td>
      <td className={tdMono}>{c.gender}</td>
      <td className={tdMono}>{c.age}</td>
      <td className={tdMono}>{c.exp}</td>
      <td className={tdMono}>{c.appliedAt}</td>
      <td className={tdCls}>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Btn variant="ghost" size="sm" onClick={() => onView(c)}>View</Btn>
          <Btn variant="danger" size="sm" onClick={() => onReject(c.id, c.name)}>✕</Btn>
        </div>
      </td>
    </tr>
  );
});

export default function CandidatesTable() {
  const { candidates, updateCandidate, deleteCandidates, selectedIds, toggleSelect, toggleSelectAll, clearSelection } = useStore();
  const filtered = useFilteredCandidates();
  const [activeCandidate, setActiveCandidate] = useState<Candidate | null>(null);
  const [showBulkDelete, setShowBulkDelete] = useState(false);
  const [showSmartMatch, setShowSmartMatch] = useState(false);

  // ─── Memoized derived selection state ───────────────────────────────────────
  const { allSelected, selCount } = useMemo(() => {
    let count = 0;
    for (const c of filtered) {
      if (selectedIds.has(c.id)) count++;
    }
    return {
      allSelected: filtered.length > 0 && count === filtered.length,
      selCount: count,
    };
  }, [filtered, selectedIds]);

  const filteredIds = useMemo(() => filtered.map(c => c.id), [filtered]);

  // ─── Stable row action handlers ─────────────────────────────────────────────
  const handleDeleteSelected = useCallback(() => {
    if (!confirm(`Delete ${selCount} selected candidates?`)) return;
    deleteCandidates(Array.from(selectedIds));
  }, [selCount, selectedIds, deleteCandidates]);

  const handleApproveSelected = useCallback(() => {
    Array.from(selectedIds).forEach(id => updateCandidate(id, { status: "approved" }));
    clearSelection();
  }, [selectedIds, updateCandidate, clearSelection]);

  const handleView = useCallback((c: Candidate) => setActiveCandidate(c), []);

  const handleReject = useCallback((id: string, name: string) => {
    if (confirm(`Delete ${name}?`)) updateCandidate(id, { status: "rejected" });
  }, [updateCandidate]);

  return (
    <>
      <FiltersBar />

      {/* Bulk action bar */}
      {selCount > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 px-4 py-2.5 rounded-lg mb-3 bg-[var(--glass-2)] border border-[var(--border-2)]">
          <span className="font-mono text-[11px] text-[var(--text-2)]">{selCount} selected</span>
          <div className="flex flex-wrap gap-2">
            <Btn variant="ghost" size="sm" onClick={handleApproveSelected}>✓ Approve All</Btn>
            <Btn variant="danger" size="sm" onClick={handleDeleteSelected}>✕ Delete Selected</Btn>
            <Btn variant="outline" size="sm" onClick={clearSelection}>Clear</Btn>
          </div>
        </div>
      )}

      {/* Results count */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-3">
        <div className="font-mono text-[10px] text-[var(--text-3)]">
          {filtered.length} result{filtered.length !== 1 ? "s" : ""}
        </div>
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          <Btn variant="ghost" size="sm" className="flex-1 sm:flex-none justify-center" onClick={() => setShowSmartMatch(true)}>✨ Smart Match</Btn>
          <Btn variant="ghost" size="sm" className="flex-1 sm:flex-none justify-center" onClick={() => setShowBulkDelete(true)}>⌀ Bulk Delete</Btn>
        </div>
      </div>

      {filtered.length === 0
        ? <EmptyState message="No candidates match the current filters" />
        : (
          <>
            {/* Mobile-First Candidate Cards */}
            <div className="flex flex-col gap-3 md:hidden">
              {filtered.map(c => {
                const isSel = selectedIds.has(c.id);
                return (
                  <div key={c.id} 
                    className={clsx(
                      "glass p-4 rounded-xl flex flex-col gap-3 transition-all duration-150",
                      isSel ? "bg-[var(--glass-2)] border-[var(--border-3)]" : ""
                    )}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-2.5 min-w-0">
                        <input 
                          type="checkbox" 
                          checked={isSel} 
                          onChange={() => toggleSelect(c.id)} 
                          className="mt-1"
                        />
                        <div className="min-w-0">
                          <div 
                            className="font-bold text-[14px] cursor-pointer hover:text-white truncate"
                            onClick={() => handleView(c)}
                          >
                            {c.name}
                          </div>
                          <div className="font-mono text-[10px] text-[var(--text-3)] truncate">{c.email}</div>
                        </div>
                      </div>
                      <StatusBadge status={c.status} />
                    </div>

                    <div className="flex justify-between items-center gap-3 border-t border-white/[0.03] pt-3">
                      <div className="min-w-0">
                        <div className="font-mono text-[11px] text-[var(--text-2)] truncate">{c.roleName}</div>
                        <div className="font-mono text-[9px] text-[var(--text-3)] mt-0.5">
                          {c.city} · {c.exp} · {c.age} yrs
                        </div>
                      </div>
                      <ScoreBadge score={c.score.total} />
                    </div>

                    <div className="flex justify-end gap-2 border-t border-white/[0.03] pt-3">
                      <Btn variant="ghost" size="sm" onClick={() => handleView(c)}>View Profile</Btn>
                      <Btn variant="danger" size="sm" onClick={() => handleReject(c.id, c.name)}>✕</Btn>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop Candidate Table */}
            <div className="hidden md:block rounded-xl overflow-hidden border border-[var(--border)]">
              <table className="w-full border-collapse">
                <thead style={{ background: "rgba(255,255,255,0.025)" }}>
                  <tr>
                    <th className={thCls}>
                      <input type="checkbox" checked={allSelected} onChange={() => toggleSelectAll(filteredIds)} />
                    </th>
                    <th className={thCls}>Candidate</th>
                    <th className={thCls}>Role</th>
                    <th className={thCls}>Score</th>
                    <th className={thCls}>Status</th>
                    <th className={thCls}>City</th>
                    <th className={thCls}>Gender</th>
                    <th className={thCls}>Age</th>
                    <th className={thCls}>Exp</th>
                    <th className={thCls}>Applied</th>
                    <th className={thCls}></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(c => (
                    <CandidateRow
                      key={c.id}
                      candidate={c}
                      isSelected={selectedIds.has(c.id)}
                      onSelect={toggleSelect}
                      onView={handleView}
                      onReject={handleReject}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

      {activeCandidate && (
        <CandidateDetail
          candidate={candidates.find(cand => cand.id === activeCandidate.id) ?? activeCandidate}
          onClose={() => setActiveCandidate(null)}
        />
      )}

      <BulkDeleteModal open={showBulkDelete} onClose={() => setShowBulkDelete(false)} />
      <SmartMatchModal open={showSmartMatch} onClose={() => setShowSmartMatch(false)} onViewCandidate={handleView} />
    </>
  );
}
