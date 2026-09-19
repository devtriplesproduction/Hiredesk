"use client";
import { useState, useCallback, useMemo, memo, useEffect } from "react";
import { useStore, useFilteredCandidates } from "@/lib/store";
import { Btn, ScoreBadge, StatusBadge, EmploymentBadge, EmptyState, Pagination, dialog } from "@/components/ui";
import { getEmploymentStatusMeta } from "@/lib/data";
import CandidateDetail from "./CandidateDetail";
import FiltersBar from "./FiltersBar";
import BulkDeleteModal from "./BulkDeleteModal";
import SmartMatchModal from "./SmartMatchModal";
import type { Candidate } from "@/types";
import { clsx } from "clsx";

const thCls = "font-semibold text-[10.5px] uppercase tracking-[0.06em] text-[var(--text-3)] px-3 py-3 text-left border-b border-[var(--table-border)] select-none";
const tdCls = "px-3 py-3 border-b border-[var(--table-border)] align-middle";
const tdText = clsx(tdCls, "text-[11.5px] text-[var(--text-2)]");

// ─── Memoized Row: only re-renders when its own candidate or selection changes ─
interface RowProps {
  candidate: Candidate;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onView: (c: Candidate) => void;
  onDelete: (e: React.MouseEvent, c: Candidate) => void;
}

const CandidateRow = memo(function CandidateRow({ candidate: c, isSelected, onSelect, onView, onDelete }: RowProps) {
  const statusMeta = getEmploymentStatusMeta(c.employmentStatus);

  return (
    <tr
      className="h-[54px] hover:bg-[var(--table-row-hover)] transition-colors duration-150 cursor-pointer group"
      onClick={() => onView(c)}
    >
      <td className={clsx(tdCls, "w-[44px] text-center")} onClick={e => e.stopPropagation()}>
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => onSelect(c.id)}
          className="w-[16px] h-[16px] rounded border-[var(--input-border)] bg-[var(--input-bg)] accent-[#00D9FF] cursor-pointer"
        />
      </td>
      <td className={tdCls}>
        <div className="flex flex-col justify-center min-w-0">
          <div className="font-semibold text-[16px] text-[var(--text)] transition-colors truncate">
            {c.name}
          </div>
          <div className="text-[15px] text-[var(--text-2)] mt-0.5 truncate">
            {c.email}
          </div>
        </div>
      </td>
      <td className={tdCls}>
        <div className="text-[11.5px] text-[var(--text-3)] truncate">{c.roleName}</div>
      </td>
      <td className={clsx(tdCls, "text-center")}>
        <ScoreBadge score={c.score.total} />
      </td>
      <td className={tdCls}>
        <StatusBadge status={c.status} />
      </td>
      <td className={tdText}>{c.city || "—"}</td>
      <td className={tdText}>{c.gender || "—"}</td>
      <td className={tdCls}>
        <EmploymentBadge status={c.employmentStatus} />
      </td>
      <td className={tdText}>{c.exp || "—"}</td>
      <td className={clsx(tdText, "whitespace-nowrap")}>{c.appliedAt || "—"}</td>
      <td className={clsx(tdCls, "w-[44px] text-right")} onClick={e => e.stopPropagation()}>
        <button
          type="button"
          onClick={e => onDelete(e, c)}
          title={`Delete ${c.name}`}
          className="w-7 h-7 rounded-[7px] inline-flex items-center justify-center text-[var(--text-2)] hover:text-[#EF4444] hover:bg-red-500/10 border border-transparent hover:border-red-500/30 transition-all cursor-pointer"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            <line x1="10" y1="11" x2="10" y2="17" />
            <line x1="14" y1="11" x2="14" y2="17" />
          </svg>
        </button>
      </td>
    </tr>
  );
});

export default function CandidatesTable() {
  const { candidates, updateCandidate, deleteCandidate, deleteCandidates, selectedIds, toggleSelect, toggleSelectAll, clearSelection, clearFilters, filters } = useStore();
  const filtered = useFilteredCandidates();
  const [activeCandidate, setActiveCandidate] = useState<Candidate | null>(null);
  const [showBulkDelete, setShowBulkDelete] = useState(false);
  const [showSmartMatch, setShowSmartMatch] = useState(false);

  // ─── Pagination (10 entries per page) ──────────────────────────────────────
  const PAGE_SIZE = 10;
  const [currentPage, setCurrentPage] = useState(1);

  // Reset to page 1 whenever filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(Math.max(1, currentPage), totalPages);

  const paginatedCandidates = useMemo(() => {
    const start = (safePage - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, safePage]);

  const pageIds = useMemo(() => paginatedCandidates.map(c => c.id), [paginatedCandidates]);

  // ─── Memoized derived selection state ───────────────────────────────────────
  const { allPageSelected, selCount } = useMemo(() => {
    let count = 0;
    for (const c of filtered) {
      if (selectedIds.has(c.id)) count++;
    }
    const allPage = pageIds.length > 0 && pageIds.every(id => selectedIds.has(id));
    return {
      allPageSelected: allPage,
      selCount: count,
    };
  }, [filtered, pageIds, selectedIds]);

  const [isDeletingSelected, setIsDeletingSelected] = useState(false);

  // ─── Stable row action handlers ─────────────────────────────────────────────
  const handleDeleteSelected = useCallback(async () => {
    if (isDeletingSelected || selCount === 0) return;
    const ids = Array.from(selectedIds);
    const confirmed = await dialog.confirm({
      title: "Delete Candidates",
      message: `Are you sure you want to delete ${selCount} selected candidate${selCount !== 1 ? "s" : ""}? This action cannot be undone.`,
      confirmText: `DELETE ${selCount} CANDIDATE${selCount !== 1 ? "S" : ""}`,
      cancelText: "CANCEL",
      isDestructive: true,
    });
    if (!confirmed) return;

    setIsDeletingSelected(true);
    try {
      await deleteCandidates(ids);
      const deletedCount = ids.length;
      dialog.success({
        title: "Candidates Deleted",
        message: `Successfully deleted ${deletedCount} candidate${deletedCount !== 1 ? "s" : ""} from the database.`,
      });
    } catch (err: any) {
      console.error("[CandidatesTable] Bulk delete error:", err);
      dialog.error({
        title: "Deletion Failed",
        message: `Unable to delete candidates: ${err?.message || "Database error"}. The records remain in the database.`,
      });
    } finally {
      setIsDeletingSelected(false);
    }
  }, [isDeletingSelected, selCount, selectedIds, deleteCandidates]);

  const handleApproveSelected = useCallback(() => {
    Array.from(selectedIds).forEach(id => updateCandidate(id, { status: "approved" }));
    clearSelection();
  }, [selectedIds, updateCandidate, clearSelection]);

  const handleView = useCallback((c: Candidate) => setActiveCandidate(c), []);

  const handleDeleteCandidate = useCallback(async (e: React.MouseEvent, c: Candidate) => {
    e.stopPropagation();
    const confirmed = await dialog.confirm({
      title: "Delete Candidate",
      message: `Are you sure you want to permanently delete ${c.name}? This action cannot be undone.`,
      confirmText: "DELETE",
      cancelText: "CANCEL",
      isDestructive: true,
    });
    if (!confirmed) return;

    try {
      await deleteCandidate(c.id);
      dialog.success({
        title: "Candidate Deleted",
        message: `Successfully deleted ${c.name} from the database.`,
      });
    } catch (err: any) {
      console.error("[CandidatesTable] Delete error:", err);
      dialog.error({
        title: "Deletion Failed",
        message: `Unable to delete candidate: ${err?.message || "Database error"}.`,
      });
    }
  }, [deleteCandidate]);

  return (
    <>
      {/* ── Candidates Title Row ────────────────────────────────────────── */}
      <div className="flex items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-[22px] font-extrabold tracking-tight text-text">Candidates</h1>
          <div className="font-mono text-[16px] text-[var(--text-3)] mt-1 uppercase tracking-widest">
            All applicants · Filter · Review · Score
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowSmartMatch(true)}
          className="h-[35px] px-3.5 rounded-[8px] text-[11.5px] font-semibold tracking-wide transition-all duration-150 inline-flex items-center justify-center gap-1.5 cursor-pointer select-none active:scale-[0.98] whitespace-nowrap shrink-0"
          style={{
            background: "rgba(0, 217, 255, 0.08)",
            border: "1px solid rgba(0, 217, 255, 0.25)",
            color: "#00D9FF",
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = "rgba(0, 217, 255, 0.15)";
            e.currentTarget.style.borderColor = "rgba(0, 217, 255, 0.45)";
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = "rgba(0, 217, 255, 0.08)";
            e.currentTarget.style.borderColor = "rgba(0, 217, 255, 0.25)";
          }}
        >
          <span>✨</span>
          <span>SMART MATCH</span>
        </button>
      </div>

      <FiltersBar onBulkDelete={() => setShowBulkDelete(true)} />

      {/* Bulk action bar */}
      {selCount > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 px-4 py-2.5 rounded-[10px] mb-3.5 bg-[var(--input-bg)] border border-[var(--input-border)]">
          <span className="text-[16px] font-medium text-[var(--text)]">{selCount} selected</span>
          <div className="flex flex-wrap gap-2">
            <Btn variant="ghost" size="sm" onClick={handleApproveSelected} disabled={isDeletingSelected}>✓ Approve All</Btn>
            <Btn variant="danger" size="sm" onClick={handleDeleteSelected} disabled={isDeletingSelected}>
              {isDeletingSelected ? "Deleting..." : "✕ Delete Selected"}
            </Btn>
            <Btn variant="outline" size="sm" onClick={clearSelection} disabled={isDeletingSelected}>Clear</Btn>
          </div>
        </div>
      )}

      {/* Results count */}
      <div className="text-[16px] text-[var(--text-3)] font-medium mb-3.5">
        {filtered.length} result{filtered.length !== 1 ? "s" : ""}
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="text-4xl mb-3 opacity-20">◌</div>
          <div className="text-sm font-medium text-[var(--text-3)] mb-3">No candidates match the current filters</div>
          <button
            type="button"
            onClick={clearFilters}
            className="px-3.5 py-1.5 rounded-[8px] bg-[var(--input-bg)] hover:bg-[var(--card-bg)] border border-[var(--border-2)] text-[12px] font-semibold text-[#00D9FF] hover:border-[#00D9FF]/40 transition-all cursor-pointer"
          >
            Clear Filters
          </button>
        </div>
      ) : (
          <>
            {/* Mobile-First Candidate Cards */}
            <div className="flex flex-col gap-3 md:hidden">
              {paginatedCandidates.map(c => {
                const isSel = selectedIds.has(c.id);
                return (
                  <div
                    key={c.id}
                    className="p-4 rounded-[11px] border border-[var(--border-2)] flex flex-col gap-3"
                    style={{ background: "rgba(10, 11, 13, 0.55)" }}
                  >
                    <div className="flex justify-between items-start gap-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <input
                          type="checkbox"
                          checked={isSel}
                          onChange={() => toggleSelect(c.id)}
                          className="w-[16px] h-[16px] rounded border-[var(--input-border)] bg-[var(--input-bg)] accent-[#00D9FF] cursor-pointer shrink-0"
                        />
                        <div className="min-w-0">
                          <div 
                            className="font-semibold text-[16px] text-[var(--text)] cursor-pointer hover:text-[var(--text)] truncate"
                            onClick={() => handleView(c)}
                          >
                            {c.name}
                          </div>
                          <div className="text-[15px] text-[var(--text-3)] mt-0.5 truncate">{c.email}</div>
                        </div>
                      </div>
                      <StatusBadge status={c.status} />
                    </div>

                    <div className="flex justify-between items-center gap-3 border-t border-[var(--table-border)] pt-3">
                      <div className="min-w-0">
                        <div className="text-[11.5px] text-[var(--text-3)] truncate">{c.roleName}</div>
                        <div className="text-[12px] text-[var(--text-3)] mt-1 flex items-center gap-2">
                          <span>{c.city} · {c.exp}</span>
                          <EmploymentBadge status={c.employmentStatus} />
                        </div>
                      </div>
                      <ScoreBadge score={c.score.total} />
                    </div>

                    <div className="flex justify-end gap-2 border-t border-[var(--table-border)] pt-3">
                      <Btn variant="ghost" size="sm" onClick={() => handleView(c)}>View Profile</Btn>
                      <Btn variant="danger" size="sm" onClick={(e) => handleDeleteCandidate(e, c)}>✕ Delete</Btn>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop Candidate Table */}
            <div
              className="hidden md:block rounded-[11px] overflow-hidden border border-[var(--border-2)]"
              style={{ background: "rgba(10, 11, 13, 0.55)" }}
            >
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead style={{ background: "#0D0E11" }}>
                    <tr>
                      <th className={clsx(thCls, "w-[44px] text-center")}>
                        <input
                          type="checkbox"
                          checked={allPageSelected}
                          onChange={() => toggleSelectAll(pageIds)}
                          className="w-[16px] h-[16px] rounded border-[var(--input-border)] bg-[var(--input-bg)] accent-[#00D9FF] cursor-pointer"
                        />
                      </th>
                      <th className={clsx(thCls, "w-[23%]")}>Candidate</th>
                      <th className={clsx(thCls, "w-[14%]")}>Role</th>
                      <th className={clsx(thCls, "w-[7%] text-center")}>Score</th>
                      <th className={clsx(thCls, "w-[11%]")}>Status</th>
                      <th className={clsx(thCls, "w-[8%]")}>City</th>
                      <th className={clsx(thCls, "w-[8%]")}>Gender</th>
                      <th className={clsx(thCls, "w-[11%]")}>Employment</th>
                      <th className={clsx(thCls, "w-[8%]")}>Exp</th>
                      <th className={clsx(thCls, "w-[10%]")}>Applied</th>
                      <th className={clsx(thCls, "w-[44px] text-right")}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedCandidates.map(c => (
                      <CandidateRow
                        key={c.id}
                        candidate={c}
                        isSelected={selectedIds.has(c.id)}
                        onSelect={toggleSelect}
                        onView={handleView}
                        onDelete={handleDeleteCandidate}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination Controls */}
            <Pagination
              currentPage={safePage}
              totalItems={filtered.length}
              pageSize={PAGE_SIZE}
              onPageChange={setCurrentPage}
              itemName="candidates"
            />
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
