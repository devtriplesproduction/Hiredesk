"use client";
import { useState, useMemo, memo, useCallback } from "react";
import { useStore } from "@/lib/store";
import { EmptyState } from "@/components/ui";
import { FilterSelect, FilterSearch } from "@/components/candidates/FilterSelect";
import CandidateDetail from "@/components/candidates/CandidateDetail";
import type { Candidate, Employee } from "@/types";
import { clsx } from "clsx";

// ─── Table styling (matches CandidatesTable) ─────────────────────────────────
const thCls = "font-semibold text-[10.5px] uppercase tracking-[0.06em] text-[#737983] px-3 py-3 text-left border-b border-[#1D2126] select-none";
const tdCls = "px-3 py-3 border-b border-[#1D2126] align-middle";
const tdText = clsx(tdCls, "text-[11.5px] text-[#8E949E]");

// ─── Employment type badge styles ────────────────────────────────────────────
function getEmploymentBadge(type: string) {
  const t = (type || "").toLowerCase();
  if (t.includes("intern")) {
    return {
      color: "#EAB308",
      bg: "rgba(234, 179, 8, 0.08)",
      border: "1px solid rgba(234, 179, 8, 0.25)",
      label: "Internship",
    };
  }
  if (t.includes("freelance") || t.includes("contract")) {
    return {
      color: "#38BDF8",
      bg: "rgba(56, 189, 248, 0.08)",
      border: "1px solid rgba(56, 189, 248, 0.25)",
      label: "Freelance",
    };
  }
  return {
    color: "#22C55E",
    bg: "rgba(34, 197, 94, 0.08)",
    border: "1px solid rgba(34, 197, 94, 0.25)",
    label: "Full-Time",
  };
}

// ─── Employee status badge styles ────────────────────────────────────────────
function getStatusBadge(status: string) {
  switch (status) {
    case "terminated":
      return {
        color: "#EF4444",
        bg: "rgba(239, 68, 68, 0.08)",
        border: "1px solid rgba(239, 68, 68, 0.25)",
        label: "TERMINATED",
      };
    case "on_leave":
      return {
        color: "#EAB308",
        bg: "rgba(234, 179, 8, 0.08)",
        border: "1px solid rgba(234, 179, 8, 0.25)",
        label: "ON LEAVE",
      };
    default:
      return {
        color: "#22C55E",
        bg: "rgba(34, 197, 94, 0.08)",
        border: "1px solid rgba(34, 197, 94, 0.25)",
        label: "ACTIVE",
      };
  }
}

// ─── Format date (matches HireDesk convention: D/M/YYYY) ─────────────────────
function formatHiredDate(dateStr: string): string {
  if (!dateStr) return "—";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "—";
    return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
  } catch {
    return "—";
  }
}

// ─── Sort options ────────────────────────────────────────────────────────────
type EmployeeSort = "newest" | "oldest" | "name-az";
const SORT_OPTIONS = [
  { value: "newest", label: "Newest First" },
  { value: "oldest", label: "Oldest First" },
  { value: "name-az", label: "Name A–Z" },
];

// ─── Enriched employee row data ──────────────────────────────────────────────
interface EnrichedEmployee {
  employee: Employee;
  candidate: Candidate | undefined;
  roleName: string;
  city: string;
}

// ─── Memoized Row ────────────────────────────────────────────────────────────
interface RowProps {
  data: EnrichedEmployee;
  onView: (c: Candidate) => void;
}

const EmployeeRow = memo(function EmployeeRow({ data, onView }: RowProps) {
  const { employee: e, candidate, roleName, city } = data;
  const empBadge = getEmploymentBadge(e.employmentType);
  const statusBadge = getStatusBadge(e.status);

  return (
    <tr
      className="h-[54px] hover:bg-[#121519] transition-colors duration-150 cursor-pointer group"
      onClick={() => candidate && onView(candidate)}
    >
      <td className={tdCls}>
        <div className="flex flex-col justify-center min-w-0">
          <div className="font-semibold text-[14px] text-[#E8EAED] group-hover:text-white transition-colors truncate">
            {e.name}
          </div>
          <div className="text-[11px] text-[#666C76] mt-0.5 truncate">
            {e.email}
          </div>
        </div>
      </td>
      <td className={tdCls}>
        <div className="text-[11.5px] text-[#9AA0AA] truncate">{roleName}</div>
      </td>
      <td className={tdCls}>
        <span
          className="text-[10.5px] font-semibold uppercase tracking-wider h-[23px] px-2.5 rounded-[6px] inline-flex items-center justify-center whitespace-nowrap select-none"
          style={{ color: empBadge.color, backgroundColor: empBadge.bg, border: empBadge.border }}
        >
          {empBadge.label}
        </span>
      </td>
      <td className={tdText}>{city || "—"}</td>
      <td className={clsx(tdText, "whitespace-nowrap")}>{formatHiredDate(e.createdAt)}</td>
      <td className={tdCls}>
        <span
          className="text-[10.5px] font-semibold uppercase tracking-wider h-[23px] px-2.5 rounded-[6px] inline-flex items-center justify-center whitespace-nowrap select-none"
          style={{ color: statusBadge.color, backgroundColor: statusBadge.bg, border: statusBadge.border }}
        >
          {statusBadge.label}
        </span>
      </td>
    </tr>
  );
});

// ─── Main Component ──────────────────────────────────────────────────────────
export default function EmployeesTable() {
  const { employees, candidates, roles } = useStore();

  // Local filter state
  const [search, setSearch] = useState("");
  const [employmentFilter, setEmploymentFilter] = useState("all");
  const [cityFilter, setCityFilter] = useState("all");
  const [sort, setSort] = useState<EmployeeSort>("newest");

  // Candidate detail modal
  const [viewingCandidate, setViewingCandidate] = useState<Candidate | null>(null);

  // Enrich employees with candidate data
  const enriched = useMemo<EnrichedEmployee[]>(() => {
    return employees.map(e => {
      const candidate = candidates.find(c => c.id === e.candidateId);
      const role = candidate ? roles.find(r => r.id === candidate.roleId) : undefined;
      return {
        employee: e,
        candidate,
        roleName: candidate?.roleName || role?.name || "—",
        city: candidate?.city || "—",
      };
    });
  }, [employees, candidates, roles]);

  // Build dynamic filter options
  const employmentOptions = useMemo(() => {
    const types = new Set<string>();
    enriched.forEach(({ employee }) => {
      if (employee.employmentType) {
        types.add(employee.employmentType);
      }
    });
    const opts = [{ value: "all", label: "All Employment" }];
    Array.from(types).sort().forEach(t => {
      const badge = getEmploymentBadge(t);
      opts.push({ value: t, label: badge.label });
    });
    return opts;
  }, [enriched]);

  const cityOptions = useMemo(() => {
    const cities = new Set<string>();
    enriched.forEach(({ city }) => {
      if (city && city !== "—") cities.add(city);
    });
    const opts = [{ value: "all", label: "All Cities" }];
    Array.from(cities).sort().forEach(c => {
      opts.push({ value: c, label: c });
    });
    return opts;
  }, [enriched]);

  // Filter + sort
  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();

    let result = enriched.filter(({ employee: e, city }) => {
      // Search
      if (q && !e.name.toLowerCase().includes(q) && !e.email.toLowerCase().includes(q)) {
        return false;
      }
      // Employment filter
      if (employmentFilter !== "all" && e.employmentType !== employmentFilter) {
        return false;
      }
      // City filter
      if (cityFilter !== "all" && city !== cityFilter) {
        return false;
      }
      return true;
    });

    // Sort
    result = [...result].sort((a, b) => {
      switch (sort) {
        case "newest":
          return (b.employee.createdAt ?? "") > (a.employee.createdAt ?? "") ? 1 : -1;
        case "oldest":
          return (a.employee.createdAt ?? "") > (b.employee.createdAt ?? "") ? 1 : -1;
        case "name-az":
          return a.employee.name.localeCompare(b.employee.name);
        default:
          return 0;
      }
    });

    return result;
  }, [enriched, search, employmentFilter, cityFilter, sort]);

  const handleView = useCallback((c: Candidate) => setViewingCandidate(c), []);

  return (
    <>
      {/* ── Filters Bar ───────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <FilterSearch
          value={search}
          onChange={setSearch}
          placeholder="Search name / email…"
          className="w-[200px]"
        />
        <FilterSelect
          options={employmentOptions}
          value={employmentFilter}
          onChange={setEmploymentFilter}
          placeholder="All Employment"
        />
        <FilterSelect
          options={cityOptions}
          value={cityFilter}
          onChange={setCityFilter}
          placeholder="All Cities"
        />
        <FilterSelect
          options={SORT_OPTIONS}
          value={sort}
          onChange={v => setSort(v as EmployeeSort)}
          placeholder="Newest First"
          align="right"
        />
      </div>

      {/* ── Results count ─────────────────────────────────────────── */}
      <div className="text-[11.5px] text-[#737983] font-medium mb-3">
        {filtered.length} {filtered.length === 1 ? "employee" : "employees"}
      </div>

      {/* ── Table / Empty State ────────────────────────────────────── */}
      {filtered.length === 0 ? (
        employees.length === 0 ? (
          <EmptyState
            icon="👥"
            message="No Employees Yet — Employees will appear here when candidates are marked as hired."
          />
        ) : (
          <EmptyState
            icon="🔍"
            message="No employees match your current filters."
          />
        )
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className={thCls}>Employee</th>
                  <th className={thCls}>Role</th>
                  <th className={thCls}>Employment</th>
                  <th className={thCls}>City</th>
                  <th className={thCls}>Date Hired</th>
                  <th className={thCls}>Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(data => (
                  <EmployeeRow key={data.employee.id} data={data} onView={handleView} />
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="flex flex-col gap-2 md:hidden">
            {filtered.map(({ employee: e, candidate, roleName, city }) => {
              const empBadge = getEmploymentBadge(e.employmentType);
              const statusBadge = getStatusBadge(e.status);
              return (
                <div
                  key={e.id}
                  className="p-3.5 rounded-xl border border-[#1D2126] bg-[#111214] hover:bg-[#151719] transition-colors cursor-pointer"
                  onClick={() => candidate && setViewingCandidate(candidate)}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="min-w-0">
                      <div className="font-semibold text-[14px] text-[#E8EAED] truncate">{e.name}</div>
                      <div className="text-[11px] text-[#666C76] mt-0.5 truncate">{e.email}</div>
                    </div>
                    <span
                      className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-[5px] whitespace-nowrap flex-shrink-0"
                      style={{ color: statusBadge.color, backgroundColor: statusBadge.bg, border: statusBadge.border }}
                    >
                      {statusBadge.label}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-[11px] text-[#8E949E]">
                    <span>{roleName}</span>
                    <span className="text-[#2B2F35]">·</span>
                    <span
                      className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-[5px]"
                      style={{ color: empBadge.color, backgroundColor: empBadge.bg, border: empBadge.border }}
                    >
                      {empBadge.label}
                    </span>
                    <span className="text-[#2B2F35]">·</span>
                    <span>{city}</span>
                    <span className="text-[#2B2F35]">·</span>
                    <span>{formatHiredDate(e.createdAt)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* ── Candidate Detail Modal (reused from Candidates) ────────── */}
      {viewingCandidate && (
        <CandidateDetail
          candidate={viewingCandidate}
          onClose={() => setViewingCandidate(null)}
        />
      )}
    </>
  );
}
