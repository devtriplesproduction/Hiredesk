"use client";
import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useStore } from "@/lib/store";
import { CITIES, GENDERS, EXP_LEVELS } from "@/lib/data";
import type { SortKey } from "@/types";
import { FilterSelect, FilterSearch, type FilterOption } from "./FilterSelect";
import { ArrowDown, ArrowUp, Star, X } from "lucide-react";

interface FiltersBarProps {
  onBulkDelete?: () => void;
}

export default function FiltersBar({ onBulkDelete }: FiltersBarProps) {
  const { filters, setFilters, clearFilters, roles, candidates } = useStore();
  const hasActive = Boolean(
    filters.search ||
    filters.roleId !== "all" ||
    filters.status !== "all" ||
    filters.city ||
    filters.gender !== "all" ||
    filters.exp !== "all" ||
    (filters.employmentStatus && filters.employmentStatus !== "all")
  );

  // ─── Local search state: debounce 200ms before pushing to global filter ─────
  const [localSearch, setLocalSearch] = useState(filters.search);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync if the external filter is cleared (e.g. clearFilters button)
  useEffect(() => {
    setLocalSearch(filters.search);
  }, [filters.search]);

  // Sanitize status if legacy or external source set status to "hired"
  useEffect(() => {
    if (filters.status === "hired") {
      setFilters({ status: "all" });
    }
  }, [filters.status, setFilters]);

  const handleSearchChange = useCallback(
    (val: string) => {
      setLocalSearch(val);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        setFilters({ search: val });
      }, 200);
    },
    [setFilters]
  );

  // ─── Filter Options ────────────────────────────────────────────────────────
  const roleOptions: FilterOption[] = useMemo(() => {
    const list = [...roles];
    candidates.forEach(c => {
      if (c.roleId && !list.some(r => r.id === c.roleId)) {
        list.push({
          id: c.roleId,
          name: c.roleName || c.roleId,
          type: "Full-time",
          count: 0,
          isActive: true,
          keywords: [],
        });
      }
    });
    return [
      { value: "all", label: "All Roles" },
      ...list.map(r => ({ value: r.id, label: r.name })),
    ];
  }, [roles, candidates]);

  const statusOptions: FilterOption[] = useMemo(() => [
    { value: "all", label: "All Status" },
    { value: "new", label: "New" },
    { value: "review", label: "In Review" },
    { value: "shortlisted", label: "Shortlisted" },
    { value: "interview_1", label: "Interview R1" },
    { value: "interview_2", label: "Interview R2" },
    { value: "offer", label: "Offer Prep" },
    { value: "offer_sent", label: "Offer Sent" },
    { value: "offer_accepted", label: "Offer Accepted" },
    { value: "offer_rejected", label: "Offer Rejected" },
    { value: "onboarding_requested", label: "Onboarding Required" },
    { value: "onboarding_review", label: "Onboarding Review" },
    { value: "onboarding_verified", label: "Onboarding Verified" },
    { value: "onboarding_rejected", label: "Onboarding Rejected" },
    { value: "approved", label: "Approved" },
    { value: "rejected", label: "Rejected" },
  ], []);

  const genderOptions: FilterOption[] = useMemo(() => {
    const seen = new Set<string>(["Male", "Female", "Non-binary", "Prefer not to say"]);
    candidates.forEach(c => {
      const g = (c.gender || "").trim();
      if (g && g !== "—") seen.add(g);
    });
    return [
      { value: "all", label: "All Genders" },
      ...Array.from(seen).map(g => ({ value: g, label: g })),
    ];
  }, [candidates]);

  const expOptions: FilterOption[] = useMemo(() => {
    const seen = new Set<string>(EXP_LEVELS);
    candidates.forEach(c => {
      const e = (c.exp || "").trim();
      if (e && e !== "—" && !EXP_LEVELS.includes(e)) seen.add(e);
    });
    return [
      { value: "all", label: "All Exp." },
      ...Array.from(seen).map(e => ({ value: e, label: e })),
    ];
  }, [candidates]);

  const cityOptions: FilterOption[] = useMemo(() => {
    const citySet = new Set<string>();
    candidates.forEach(c => {
      const ct = (c.city || "").trim();
      if (ct && ct !== "—" && ct.toLowerCase() !== "not specified") citySet.add(ct);
    });
    CITIES.forEach(c => citySet.add(c));
    const sorted = Array.from(citySet).sort((a, b) => a.localeCompare(b));
    return [
      { value: "", label: "All Cities" },
      ...sorted.map(c => ({ value: c, label: c })),
      { value: "Not specified", label: "Not Specified" },
    ];
  }, [candidates]);

  const sortOptions: FilterOption[] = useMemo(() => [
    { value: "newest", label: "Newest First", icon: <ArrowDown size={13} className="text-[var(--text-3)]" /> },
    { value: "oldest", label: "Oldest First", icon: <ArrowUp size={13} className="text-[var(--text-3)]" /> },
    { value: "score-desc", label: "Score High–Low", icon: <Star size={13} className="text-[#F5C542]" /> },
    { value: "score-asc", label: "Score Low–High", icon: <Star size={13} className="text-[var(--text-3)]" /> },
    { value: "name-az", label: "A–Z Name" },
  ], []);

  return (
    <div className="w-full flex items-center gap-2 mb-4 overflow-x-auto lg:overflow-visible pb-1 lg:pb-0 scrollbar-none flex-nowrap min-w-0">
      {/* 1. Search */}
      <FilterSearch
        value={localSearch}
        onChange={handleSearchChange}
        placeholder="Search name / email…"
        className="flex-[1.3] min-w-[170px]"
      />

      {/* 2. All Roles */}
      <FilterSelect
        options={roleOptions}
        value={filters.roleId}
        onChange={val => setFilters({ roleId: val })}
        placeholder="All Roles"
        containerClassName="flex-1 min-w-[110px]"
      />

      {/* 3. All Status */}
      <FilterSelect
        options={statusOptions}
        value={filters.status === "hired" ? "all" : filters.status}
        onChange={val => setFilters({ status: val })}
        placeholder="All Status"
        containerClassName="flex-1 min-w-[100px]"
      />

      {/* 4. All Genders */}
      <FilterSelect
        options={genderOptions}
        value={filters.gender}
        onChange={val => setFilters({ gender: val })}
        placeholder="All Genders"
        containerClassName="flex-1 min-w-[95px]"
      />

      {/* 5. All Exp. */}
      <FilterSelect
        options={expOptions}
        value={filters.exp}
        onChange={val => setFilters({ exp: val })}
        placeholder="All Exp."
        containerClassName="flex-1 min-w-[88px]"
      />

      {/* 6. All Cities */}
      <FilterSelect
        options={cityOptions}
        value={filters.city}
        onChange={val => setFilters({ city: val })}
        placeholder="All Cities"
        align="right"
        containerClassName="flex-1 min-w-[92px]"
      />

      {/* 7. Newest First (Sort) */}
      <FilterSelect
        options={sortOptions}
        value={filters.sort}
        onChange={val => setFilters({ sort: val as SortKey })}
        placeholder="Sort by"
        align="right"
        containerClassName="flex-1 min-w-[125px]"
      />

      {/* 8. Bulk Delete button */}
      {onBulkDelete && (
        <button
          type="button"
          onClick={onBulkDelete}
          className="h-[40px] px-3.5 rounded-[9px] text-[11.5px] font-semibold tracking-wide transition-all duration-150 inline-flex items-center justify-center gap-1.5 cursor-pointer select-none active:scale-[0.98] whitespace-nowrap flex-shrink-0 bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--text-3)] hover:bg-red-500/10 hover:border-[#EF4444]/35 hover:text-[#EF4444]"
        >
          <span>⌀</span>
          <span>BULK DELETE</span>
        </button>
      )}

      {/* Clear Active Filters button */}
      {hasActive && (
        <button
          type="button"
          onClick={clearFilters}
          className="h-[40px] px-3 rounded-[9px] border border-[var(--border-2)] hover:border-[#EF4444]/40 bg-[var(--input-bg)] hover:bg-[var(--card-bg)] text-[var(--text-3)] hover:text-[#EF4444] text-[16px] font-medium transition-all duration-150 inline-flex items-center justify-center gap-1.5 cursor-pointer flex-shrink-0"
          title="Clear all active filters"
        >
          <X size={13} />
          <span>Clear</span>
        </button>
      )}
    </div>
  );
}
