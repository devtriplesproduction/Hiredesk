"use client";
import { useState, useMemo, memo, useCallback, useEffect } from "react";
import { useStore } from "@/lib/store";
import { EmptyState, Pagination } from "@/components/ui";
import { FilterSelect, FilterSearch } from "@/components/candidates/FilterSelect";
import CandidateDetail from "@/components/candidates/CandidateDetail";
import type { Candidate, Employee } from "@/types";
import { clsx } from "clsx";

// ─── Table styling (matches CandidatesTable) ─────────────────────────────────
const thCls = "font-semibold text-[10.5px] uppercase tracking-[0.06em] text-[var(--text-3)] px-3 py-3 text-left border-b border-[var(--table-border)] select-none";
const tdCls = "px-3 py-3 border-b border-[var(--table-border)] align-middle";
const tdText = clsx(tdCls, "text-[11.5px] text-[var(--text-3)]");

// ─── Employment type badge styles ────────────────────────────────────────────
function getEmploymentBadge(type: string) {
  const t = (type || "").toLowerCase();
  if (t.includes("intern")) {
    return {
      color: "#EAB308",
      bg: "rgba(234, 179, 8, 0.08)",
      border: "1px solid rgba(234, 179, 8, 0.25)",
      label: "Intern",
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
      className="h-[54px] hover:bg-[var(--table-row-hover)] transition-colors duration-150 cursor-pointer group"
      onClick={() => candidate && onView(candidate)}
    >
      <td className={tdCls}>
        <div className="flex flex-col justify-center min-w-0">
          <div className="font-semibold text-[16px] text-[var(--text)] group-hover:text-[var(--text)] transition-colors truncate">
            {e.name}
          </div>
          <div className="text-[15px] text-[var(--text-2)] mt-0.5 truncate">
            {e.email}
          </div>
        </div>
      </td>
      <td className={tdCls}>
        <div className="text-[11.5px] text-[var(--text-3)] truncate">{roleName}</div>
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

  // Enrich employees with candidate data (with defense-in-depth deduplication)
  const enriched = useMemo<EnrichedEmployee[]>(() => {
    const seen = new Set<string>();
    const uniqueEmployees = employees.filter(e => {
      const key = e.candidateId || (e as any).candidate_id || e.id;
      if (!key) return true;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    return uniqueEmployees.map(e => {
      const candidate = candidates.find(c => c.id === (e.candidateId || (e as any).candidate_id));
      const role = candidate ? roles.find(r => r.id === candidate.roleId) : undefined;
      return {
        employee: e,
        candidate,
        roleName: candidate?.roleName || role?.name || "—",
        city: candidate?.city || "—",
      };
    });
  }, [employees, candidates, roles]);

  // Build employment filter options with standard Full-Time, Intern, and Freelance options
  const employmentOptions = useMemo(() => {
    const standard = [
      { value: "all", label: "All Employment" },
      { value: "full-time", label: "Full-Time" },
      { value: "intern", label: "Intern" },
      { value: "freelance", label: "Freelance" },
    ];

    const knownKeys = new Set(["all", "full-time", "intern", "freelance"]);
    enriched.forEach(({ employee }) => {
      const raw = (employee.employmentType || "").trim();
      if (!raw) return;
      const lower = raw.toLowerCase();
      if (!lower.includes("full") && !lower.includes("intern") && !lower.includes("freelance") && !lower.includes("contract")) {
        if (!knownKeys.has(lower)) {
          knownKeys.add(lower);
          standard.push({ value: lower, label: raw });
        }
      }
    });

    return standard;
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

    let result = enriched.filter(({ employee: e, city, roleName }) => {
      // Search
      if (q) {
        const name = (e.name || "").toLowerCase();
        const email = (e.email || "").toLowerCase();
        const phone = (e.phone || "").replace(/[^0-9]/g, "");
        const cleanQ = q.replace(/[^0-9a-z]/gi, "");
        const role = (roleName || "").toLowerCase();
        const cCity = (city || "").toLowerCase();

        const matches = name.includes(q) || email.includes(q) || role.includes(q) || cCity.includes(q) || (cleanQ.length >= 3 && phone.includes(cleanQ));
        if (!matches) return false;
      }
      // Employment filter
      if (employmentFilter !== "all") {
        const empType = (e.employmentType || "").toLowerCase();
        if (employmentFilter === "full-time") {
          if (!empType.includes("full") && (empType.includes("intern") || empType.includes("freelance") || empType.includes("contract"))) {
            return false;
          }
        } else if (employmentFilter === "intern") {
          if (!empType.includes("intern")) {
            return false;
          }
        } else if (employmentFilter === "freelance") {
          if (!empType.includes("freelance") && !empType.includes("contract")) {
            return false;
          }
        } else if (empType !== employmentFilter.toLowerCase()) {
          return false;
        }
      }
      // City filter (case-insensitive)
      if (cityFilter !== "all" && city.trim().toLowerCase() !== cityFilter.trim().toLowerCase()) {
        return false;
      }
      return true;
    });

    // Sort
    result = [...result].sort((a, b) => {
      switch (sort) {
        case "newest": {
          const timeA = new Date(a.employee.createdAt || 0).getTime() || 0;
          const timeB = new Date(b.employee.createdAt || 0).getTime() || 0;
          return timeB - timeA;
        }
        case "oldest": {
          const timeA = new Date(a.employee.createdAt || 0).getTime() || 0;
          const timeB = new Date(b.employee.createdAt || 0).getTime() || 0;
          return timeA - timeB;
        }
        case "name-az":
          return (a.employee.name || "").localeCompare(b.employee.name || "");
        default:
          return 0;
      }
    });

    return result;
  }, [enriched, search, employmentFilter, cityFilter, sort]);

  // ─── Pagination (10 entries per page) ──────────────────────────────────────
  const PAGE_SIZE = 10;
  const [currentPage, setCurrentPage] = useState(1);

  // Reset to page 1 whenever filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, employmentFilter, cityFilter, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(Math.max(1, currentPage), totalPages);

  const paginatedEmployees = useMemo(() => {
    const start = (safePage - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, safePage]);

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
      <div className="text-[11.5px] text-[var(--text-3)] font-medium mb-3">
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
                {paginatedEmployees.map(data => (
                  <EmployeeRow key={data.employee.id} data={data} onView={handleView} />
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="flex flex-col gap-2 md:hidden">
            {paginatedEmployees.map(({ employee: e, candidate, roleName, city }) => {
              const empBadge = getEmploymentBadge(e.employmentType);
              const statusBadge = getStatusBadge(e.status);
              return (
                <div
                  key={e.id}
                  className="p-3.5 rounded-xl border border-[var(--table-border)] bg-[var(--card-bg)] hover:bg-[var(--input-bg)] transition-colors cursor-pointer"
                  onClick={() => candidate && setViewingCandidate(candidate)}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="min-w-0">
                      <div className="font-semibold text-[16px] text-[var(--text)] truncate">{e.name}</div>
                      <div className="text-[15px] text-[var(--text-2)] mt-0.5 truncate">{e.email}</div>
                    </div>
                    <span
                      className="text-[16px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-[5px] whitespace-nowrap flex-shrink-0"
                      style={{ color: statusBadge.color, backgroundColor: statusBadge.bg, border: statusBadge.border }}
                    >
                      {statusBadge.label}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-[15px] text-[var(--text-3)]">
                    <span>{roleName}</span>
                    <span className="text-[var(--text-3)]">·</span>
                    <span
                      className="text-[16px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-[5px]"
                      style={{ color: empBadge.color, backgroundColor: empBadge.bg, border: empBadge.border }}
                    >
                      {empBadge.label}
                    </span>
                    <span className="text-[var(--text-3)]">·</span>
                    <span>{city}</span>
                    <span className="text-[var(--text-3)]">·</span>
                    <span>{formatHiredDate(e.createdAt)}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination Controls */}
          <Pagination
            currentPage={safePage}
            totalItems={filtered.length}
            pageSize={PAGE_SIZE}
            onPageChange={setCurrentPage}
            itemName="employees"
          />
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
