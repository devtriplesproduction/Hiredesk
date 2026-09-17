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
  const { filters, setFilters, clearFilters, roles } = useStore();
  const hasActive =
    filters.search ||
    filters.roleId !== "all" ||
    filters.status !== "all" ||
    filters.city ||
    filters.gender !== "all" ||
    filters.exp !== "all";

  // ─── Local search state: debounce 200ms before pushing to global filter ─────
  const [localSearch, setLocalSearch] = useState(filters.search);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync if the external filter is cleared (e.g. clearFilters button)
  useEffect(() => {
    setLocalSearch(filters.search);
  }, [filters.search]);

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
  const roleOptions: FilterOption[] = useMemo(() => [
    { value: "all", label: "All Roles" },
    ...roles.map(r => ({ value: r.id, label: r.name })),
  ], [roles]);

  const statusOptions: FilterOption[] = useMemo(() => [
    { value: "all", label: "All Status" },
    { value: "new", label: "New" },
    { value: "review", label: "In Review" },
    { value: "approved", label: "Approved" },
    { value: "rejected", label: "Rejected" },
  ], []);

  const genderOptions: FilterOption[] = useMemo(() => [
    { value: "all", label: "All Genders" },
    ...GENDERS.map(g => ({ value: g, label: g })),
  ], []);

  const expOptions: FilterOption[] = useMemo(() => [
    { value: "all", label: "All Exp." },
    ...EXP_LEVELS.map(e => ({ value: e, label: e })),
  ], []);

  const cityOptions: FilterOption[] = useMemo(() => [
    { value: "", label: "All Cities" },
    ...CITIES.map(c => ({ value: c, label: c })),
  ], []);

  const sortOptions: FilterOption[] = useMemo(() => [
    { value: "newest", label: "Newest First", icon: <ArrowDown size={13} className="text-[#8A8F98]" /> },
    { value: "oldest", label: "Oldest First", icon: <ArrowUp size={13} className="text-[#8A8F98]" /> },
    { value: "score-desc", label: "Score High–Low", icon: <Star size={13} className="text-[#F5C542]" /> },
    { value: "score-asc", label: "Score Low–High", icon: <Star size={13} className="text-[#8A8F98]" /> },
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
        value={filters.status}
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
          className="h-[40px] px-3.5 rounded-[9px] text-[11.5px] font-semibold tracking-wide transition-all duration-150 inline-flex items-center justify-center gap-1.5 cursor-pointer select-none active:scale-[0.98] whitespace-nowrap flex-shrink-0"
          style={{
            background: "#151719",
            border: "1px solid #303238",
            color: "#9A9FA8",
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = "rgba(239, 68, 68, 0.10)";
            e.currentTarget.style.borderColor = "rgba(239, 68, 68, 0.35)";
            e.currentTarget.style.color = "#EF4444";
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = "#151719";
            e.currentTarget.style.borderColor = "#303238";
            e.currentTarget.style.color = "#9A9FA8";
          }}
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
          className="h-[40px] px-3 rounded-[9px] border border-[#303238] hover:border-[#EF4444]/40 bg-[#151719] hover:bg-[#1A1D21] text-[#8A8F98] hover:text-[#EF4444] text-[12px] font-medium transition-all duration-150 inline-flex items-center justify-center gap-1.5 cursor-pointer flex-shrink-0"
          title="Clear all active filters"
        >
          <X size={13} />
          <span>Clear</span>
        </button>
      )}
    </div>
  );
}
