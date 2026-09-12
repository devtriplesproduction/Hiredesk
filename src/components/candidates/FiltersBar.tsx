"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { useStore } from "@/lib/store";
import { CITIES, GENDERS, EXP_LEVELS } from "@/lib/data";
import type { SortKey } from "@/types";
import { clsx } from "clsx";
import { Btn } from "@/components/ui";

const AGE_RANGES = [{ label:"18–24",value:"18-24" },{ label:"25–30",value:"25-30" },{ label:"31–40",value:"31-40" },{ label:"40+",value:"40+" }];

const sel = "bg-[var(--glass-2)] border border-[var(--border)] rounded-xl text-[var(--text)] text-sm px-3.5 py-2.5 transition-colors cursor-pointer appearance-none outline-none focus:border-[var(--border-3)] [&>option]:bg-[#1a1a1a]";

export default function FiltersBar() {
  const { filters, setFilters, clearFilters, roles } = useStore();
  const hasActive = filters.search || filters.roleId !== "all" || filters.status !== "all"
    || filters.city || filters.gender !== "all" || filters.ageRange !== "all" || filters.exp !== "all";

  // ─── Local search state: debounce 200ms before pushing to global filter ─────
  // This prevents useFilteredCandidates from re-running on every keystroke
  const [localSearch, setLocalSearch] = useState(filters.search);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync if the external filter is cleared (e.g. clearFilters button)
  useEffect(() => {
    setLocalSearch(filters.search);
  }, [filters.search]);

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setLocalSearch(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setFilters({ search: val });
    }, 200);
  }, [setFilters]);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:flex lg:flex-wrap gap-2 mb-4">
      <input
        className="bg-[var(--glass-2)] border border-[var(--border)] rounded-xl text-[var(--text)] text-sm px-3.5 py-2.5 w-full lg:w-44 placeholder:text-[var(--text-3)] outline-none focus:border-[var(--border-3)] transition-colors col-span-2 sm:col-span-1"
        placeholder="Search name / email…"
        value={localSearch}
        onChange={handleSearchChange}
      />

      <select className={clsx(sel, "w-full lg:w-auto")} value={filters.roleId} onChange={e => setFilters({ roleId: e.target.value })}>
        <option value="all">All Roles</option>
        {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
      </select>

      <select className={clsx(sel, "w-full lg:w-auto")} value={filters.status} onChange={e => setFilters({ status: e.target.value })}>
        <option value="all">All Status</option>
        <option value="new">New</option>
        <option value="review">In Review</option>
        <option value="approved">Approved</option>
        <option value="rejected">Rejected</option>
      </select>

      <select className={clsx(sel, "w-full lg:w-auto")} value={filters.gender} onChange={e => setFilters({ gender: e.target.value })}>
        <option value="all">All Genders</option>
        {GENDERS.map(g => <option key={g} value={g}>{g}</option>)}
      </select>

      <select className={clsx(sel, "w-full lg:w-auto")} value={filters.ageRange} onChange={e => setFilters({ ageRange: e.target.value })}>
        <option value="all">All Ages</option>
        {AGE_RANGES.map(a => <option key={a.value} value={a.value}>{a.label}</option>)}
      </select>

      <select className={clsx(sel, "w-full lg:w-auto")} value={filters.exp} onChange={e => setFilters({ exp: e.target.value })}>
        <option value="all">All Exp.</option>
        {EXP_LEVELS.map(e => <option key={e} value={e}>{e}</option>)}
      </select>

      <select className={clsx(sel, "w-full lg:w-auto")} value={filters.city} onChange={e => setFilters({ city: e.target.value })}>
        <option value="">All Cities</option>
        {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
      </select>

      {/* Sort control */}
      <select
        className={clsx(sel, "w-full lg:w-auto")}
        value={filters.sort}
        onChange={e => setFilters({ sort: e.target.value as SortKey })}
        title="Sort candidates"
      >
        <option value="newest">↓ Newest First</option>
        <option value="oldest">↑ Oldest First</option>
        <option value="score-desc">★ Score High–Low</option>
        <option value="score-asc">★ Score Low–High</option>
        <option value="name-az">A–Z Name</option>
      </select>

      {hasActive && (
        <Btn onClick={clearFilters}
          className="text-sm font-medium px-3.5 py-2.5 rounded-xl border border-[var(--border)] text-[var(--text-3)] hover:text-[var(--text)] hover:border-[var(--border-2)] transition-colors col-span-2 sm:col-span-1 w-full lg:w-auto text-center justify-center">
          ✕ Clear
        </Btn>
      )}
    </div>
  );
}
