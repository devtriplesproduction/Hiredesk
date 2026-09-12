"use client";
import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from "react";
import type { Candidate, Role, Contract, Filters, Interview, Offer, CandidateDocument, Employee, EmployeeBond, EmployeeResignation } from "@/types";
import { DEFAULT_ROLES, generateSeedCandidates, getContractTemplates } from "@/lib/data";
import { exportCandidatesToCSV } from "@/lib/utils/csv";

interface Store {
  candidates: Candidate[];
  roles: Role[];
  contracts: Contract[];
  filters: Filters;
  selectedIds: Set<string>;
  setCandidates: (c: Candidate[]) => void;
  setRoles: (r: Role[]) => void;
  addCandidate: (c: Candidate) => void;
  addCandidates: (c: Candidate[]) => void;
  updateCandidate: (id: string, patch: Partial<Candidate>) => void;
  deleteCandidate: (id: string) => void;
  deleteCandidates: (ids: string[]) => void;
  deleteBelowScore: (threshold: number) => number;
  addRole: (r: Role) => void;
  updateContract: (id: string, body: string) => void;
  setFilters: (f: Partial<Filters>) => void;
  clearFilters: () => void;
  toggleSelect: (id: string) => void;
  toggleSelectAll: (ids: string[]) => void;
  clearSelection: () => void;
  exportCSV: () => void;
  interviews: Interview[];
  setInterviews: (i: Interview[]) => void;
  addInterview: (i: Interview) => void;
  updateInterview: (id: string, patch: Partial<Interview>) => void;
  offers: Offer[];
  addOffer: (o: Offer) => void;
  updateOffer: (id: string, patch: Partial<Offer>) => void;
  documents: CandidateDocument[];
  updateDocument: (id: string, patch: Partial<CandidateDocument>) => void;
  employees: Employee[];
  addEmployee: (e: Employee) => void;
  updateEmployee: (id: string, patch: Partial<Employee>) => void;
  employeeBonds: EmployeeBond[];
  updateEmployeeBond: (b: EmployeeBond) => void;
  employeeResignations: EmployeeResignation[];
  addEmployeeResignation: (r: EmployeeResignation) => void;
}

const DEFAULT_FILTERS: Filters = {
  search: "", roleId: "all", status: "all",
  city: "", gender: "all", ageRange: "all", exp: "all",
  sort: "newest",
};

const StoreCtx = createContext<Store | null>(null);

// ─── O(1) role count via Map ────────────────────────────────────────────────
function computeRoleCounts(candidates: Candidate[], roles: Role[]): Role[] {
  const countMap = new Map<string, number>();
  for (const c of candidates) {
    countMap.set(c.roleId, (countMap.get(c.roleId) ?? 0) + 1);
  }
  return roles.map(r => ({ ...r, count: countMap.get(r.id) ?? 0 }));
}

// ─── Debounce helper ─────────────────────────────────────────────────────────
function debounce<T extends (...args: any[]) => void>(fn: T, ms: number): T {
  let timer: ReturnType<typeof setTimeout>;
  return ((...args: any[]) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  }) as T;
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [candidates, setCandidatesRaw] = useState<Candidate[]>([]);
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [documents, setDocuments] = useState<CandidateDocument[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [employeeBonds, setEmployeeBonds] = useState<EmployeeBond[]>([]);
  const [employeeResignations, setEmployeeResignations] = useState<EmployeeResignation[]>([]);
  const [roles, setRolesRaw] = useState<Role[]>(DEFAULT_ROLES);
  const [contracts, setContracts] = useState<Contract[]>(getContractTemplates);
  const [filters, setFiltersRaw] = useState<Filters>(DEFAULT_FILTERS);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const initializedRef = useRef(false);

  // ─── Stable, Resilient State Hydration ───────────────────
  const loadInitialData = useCallback(async () => {
    try {
      const { getDBCandidates, getDBRoles, getDBContracts, getDBInterviews, getDBOffers, getDBCandidateDocuments, getDBEmployees, getDBEmployeeBonds, getDBEmployeeResignations, insertDBRoles, insertDBContracts } = await import("@/lib/supabase");
      
      console.log("[HireDesk Store] Starting database hydration...");
      
      // 1. Resilient Candidates Hydration
      let dbCandidates: Candidate[] = [];
      try {
        dbCandidates = await getDBCandidates();
        setCandidatesRaw(dbCandidates);
        console.log(`[HireDesk Store] Hydrated ${dbCandidates.length} candidates from database.`);
      } catch (candidatesErr: any) {
        console.error("[HireDesk Store] Failed to load candidates from database:", candidatesErr);
      }

      // 2. Resilient Roles Hydration
      let dbRoles: Role[] = [];
      let rolesLoaded = false;
      try {
        dbRoles = await getDBRoles();
        rolesLoaded = true;
      } catch (rolesErr: any) {
        if (rolesErr?.code === "PGRST205") {
          console.warn(
            "[HireDesk Store] Supabase 'roles' table not found. Falling back to default roles. " +
            "Please run the roles schema migration in your Supabase SQL editor to enable persistent custom roles."
          );
        } else {
          console.error("[HireDesk Store] Failed to load roles from database:", rolesErr);
        }
      }

      if (rolesLoaded) {
        if (dbRoles.length === 0) {
          const defaultRoles = computeRoleCounts(dbCandidates, DEFAULT_ROLES);
          setRolesRaw(defaultRoles);
          insertDBRoles(defaultRoles).catch(err => 
            console.error("[HireDesk Store] Failed to seed default roles to Supabase:", err)
          );
        } else {
          setRolesRaw(computeRoleCounts(dbCandidates, dbRoles));
        }
      } else {
        setRolesRaw(computeRoleCounts(dbCandidates, DEFAULT_ROLES));
      }

      // 3. Resilient Contracts Hydration
      let dbContracts: Contract[] = [];
      let contractsLoaded = false;
      try {
        dbContracts = await getDBContracts();
        contractsLoaded = true;
      } catch (contractsErr: any) {
        if (contractsErr?.code === "PGRST205") {
          console.warn(
            "[HireDesk Store] Supabase 'contracts' table not found. Falling back to default contract templates. " +
            "Please run the contracts schema migration in your Supabase SQL editor to enable persistent custom contracts."
          );
        } else {
          console.error("[HireDesk Store] Failed to load contracts from database:", contractsErr);
        }
      }

      if (contractsLoaded) {
        if (dbContracts.length === 0) {
          const defaultContracts = getContractTemplates();
          setContracts(defaultContracts);
          insertDBContracts(defaultContracts).catch(err =>
            console.error("[HireDesk Store] Failed to seed default contracts to Supabase:", err)
          );
        } else {
          setContracts(dbContracts);
        }
      } else {
        setContracts(getContractTemplates());
      }

      try {
        const dbInterviews = await getDBInterviews();
        setInterviews(dbInterviews);
      } catch (err) {
        console.error("[HireDesk Store] Failed to load interviews:", err);
      }

      try {
        const dbOffers = await getDBOffers();
        setOffers(dbOffers);
      } catch (err) {
        console.error("[HireDesk Store] Failed to load offers:", err);
      }

      try {
        const dbDocs = await getDBCandidateDocuments();
        setDocuments(dbDocs);
      } catch (err) {
        console.error("[HireDesk Store] Failed to load candidate documents:", err);
      }

      try {
        const dbEmps = await getDBEmployees();
        setEmployees(dbEmps);
      } catch (err) {
        console.error("[HireDesk Store] Failed to load employees:", err);
      }

      try {
        const dbBonds = await getDBEmployeeBonds();
        setEmployeeBonds(dbBonds);
      } catch (err) {
        console.error("[HireDesk Store] Failed to load bonds:", err);
      }

      try {
        const dbRes = await getDBEmployeeResignations();
        setEmployeeResignations(dbRes);
      } catch (err) {
        console.error("[HireDesk Store] Failed to load resignations:", err);
      }

    } catch (e) {
      console.error("[HireDesk Store] Critical error during database state hydration:", e);
    } finally {
      initializedRef.current = true;
    }
  }, []);

  // ─── Setup Supabase Auth Listener for Dynamic Hydration ───
  useEffect(() => {
    let sub: any = null;

    async function initAuthAndHydrate() {
      const { supabase } = await import("@/lib/supabase");

      // Initial load attempt immediately
      await loadInitialData();

      // Listen to auth events to handle sign-in, token refresh, and sign-out
      const { data } = supabase.auth.onAuthStateChange((event, session) => {
        console.log(`[HireDesk Auth] Event Triggered: ${event}`);
        
        if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
          console.log("[HireDesk Auth] User session active. Re-hydrating cloud state...");
          loadInitialData();
        } else if (event === "SIGNED_OUT") {
          console.log("[HireDesk Auth] User logged out. Clearing sensitive client state.");
          setCandidatesRaw([]);
          setRolesRaw(computeRoleCounts([], DEFAULT_ROLES));
          setContracts(getContractTemplates());
        }
      });
      
      sub = data?.subscription;
    }

    initAuthAndHydrate();

    return () => {
      if (sub) {
        sub.unsubscribe();
      }
    };
  }, [loadInitialData]);

  // ─── Mutation helpers ───────────────────────────────────────────────────────
  const setCandidates = useCallback((c: Candidate[]) => {
    setCandidatesRaw(c);
    setRolesRaw(prev => computeRoleCounts(c, prev));
  }, []);

  const setRoles = useCallback((r: Role[]) => {
    setRolesRaw(r);
    import("@/lib/supabase").then(db => db.insertDBRoles(r)).catch(console.error);
  }, []);

  const addCandidate = useCallback((c: Candidate) => {
    setCandidatesRaw(prev => {
      const next = [...prev, c];
      setRolesRaw(rPrev => computeRoleCounts(next, rPrev));
      return next;
    });
    import("@/lib/supabase").then(db => db.insertDBCandidate(c)).catch(err => console.error(err));
  }, []);

  const addCandidates = useCallback((newOnes: Candidate[]) => {
    setCandidatesRaw(prev => {
      const next = [...prev, ...newOnes];
      setRolesRaw(rPrev => computeRoleCounts(next, rPrev));
      return next;
    });
    import("@/lib/supabase").then(db => db.insertDBCandidates(newOnes)).catch(err => {
      console.error(err);
      alert("Failed to save candidate to database: " + (err?.message || JSON.stringify(err)));
    });
  }, []);

  const updateCandidate = useCallback((id: string, patch: Partial<Candidate>) => {
    setCandidatesRaw(prev => {
      const next = prev.map(c => c.id === id ? { ...c, ...patch } : c);
      if (patch.roleId !== undefined) {
        setRolesRaw(rPrev => computeRoleCounts(next, rPrev));
      }
      return next;
    });
    import("@/lib/supabase").then(db => db.updateDBCandidate(id, patch)).catch(err => console.error(err));
  }, []);

  const deleteCandidate = useCallback((id: string) => {
    setCandidatesRaw(prev => {
      const next = prev.filter(c => c.id !== id);
      setRolesRaw(rPrev => computeRoleCounts(next, rPrev));
      return next;
    });
    import("@/lib/supabase").then(db => db.deleteDBCandidate(id)).catch(err => console.error(err));
  }, []);

  const deleteCandidates = useCallback((ids: string[]) => {
    const idSet = new Set(ids);
    setCandidatesRaw(prev => {
      const next = prev.filter(c => !idSet.has(c.id));
      setRolesRaw(rPrev => computeRoleCounts(next, rPrev));
      return next;
    });
    setSelectedIds(new Set());
    import("@/lib/supabase").then(db => db.deleteDBCandidates(ids)).catch(err => console.error(err));
  }, []);

  const deleteBelowScore = useCallback((threshold: number) => {
    let deletedCount = 0;
    const toDeleteIds: string[] = [];
    setCandidatesRaw(prev => {
      const next = prev.filter(c => {
        if (c.score.total < threshold) { 
          deletedCount++; 
          toDeleteIds.push(c.id);
          return false; 
        }
        return true;
      });
      setRolesRaw(rPrev => computeRoleCounts(next, rPrev));
      return next;
    });
    if (toDeleteIds.length > 0) {
      import("@/lib/supabase").then(db => db.deleteDBCandidates(toDeleteIds)).catch(err => console.error(err));
    }
    return deletedCount;
  }, []);

  const addRole = useCallback((r: Role) => {
    setRolesRaw(prev => [...prev, r]);
    import("@/lib/supabase").then(db => db.insertDBRoles([r])).catch(console.error);
  }, []);

  const updateContract = useCallback((id: string, body: string) => {
    setContracts(prev => prev.map(c => c.id === id ? { ...c, body } : c));
    import("@/lib/supabase").then(db => db.updateDBContract(id, { body })).catch(console.error);
  }, []);

  const setFilters = useCallback(
    (f: Partial<Filters>) => setFiltersRaw(prev => ({ ...prev, ...f })),
    []
  );
  const clearFilters = useCallback(() => setFiltersRaw(DEFAULT_FILTERS), []);

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  const toggleSelectAll = useCallback((ids: string[]) => {
    setSelectedIds(prev => {
      const allSelected = ids.every(id => prev.has(id));
      const next = new Set(prev);
      if (allSelected) {
        ids.forEach(id => next.delete(id));
      } else {
        ids.forEach(id => next.add(id));
      }
      return next;
    });
  }, []);

  const clearSelection = useCallback(() => setSelectedIds(new Set()), []);

  const exportCSV = useCallback(() => {
    exportCandidatesToCSV(candidates);
  }, [candidates]);

  const addInterview = useCallback((i: Interview) => {
    setInterviews(prev => [...prev, i]);
    import("@/lib/supabase").then(db => db.insertDBInterview(i)).catch(console.error);
  }, []);

  const updateInterview = useCallback((id: string, patch: Partial<Interview>) => {
    setInterviews(prev => prev.map(i => i.id === id ? { ...i, ...patch } : i));
    import("@/lib/supabase").then(db => db.updateDBInterview(id, patch)).catch(console.error);
  }, []);

  const addOffer = useCallback((o: Offer) => {
    setOffers(prev => [...prev, o]);
    import("@/lib/supabase").then(db => db.insertDBOffer(o)).catch(console.error);
  }, []);

  const updateOffer = useCallback((id: string, patch: Partial<Offer>) => {
    setOffers(prev => prev.map(o => o.id === id ? { ...o, ...patch } : o));
    import("@/lib/supabase").then(db => db.updateDBOffer(id, patch)).catch(console.error);
  }, []);

  const updateDocument = useCallback((id: string, patch: Partial<CandidateDocument>) => {
    setDocuments(prev => prev.map(d => d.id === id ? { ...d, ...patch } : d));
    import("@/lib/supabase").then(db => db.updateDBCandidateDocument(id, patch)).catch(console.error);
  }, []);

  const addEmployee = useCallback((e: Employee) => {
    setEmployees(prev => [...prev, e]);
  }, []);

  const updateEmployee = useCallback((id: string, patch: Partial<Employee>) => {
    setEmployees(prev => prev.map(e => e.id === id ? { ...e, ...patch } : e));
  }, []);

  const updateEmployeeBond = useCallback((b: EmployeeBond) => {
    setEmployeeBonds(prev => {
      const idx = prev.findIndex(x => x.employeeId === b.employeeId);
      if (idx > -1) {
        const next = [...prev];
        next[idx] = b;
        return next;
      }
      return [...prev, b];
    });
  }, []);

  const addEmployeeResignation = useCallback((r: EmployeeResignation) => {
    setEmployeeResignations(prev => [...prev, r]);
  }, []);

  // ─── Stable context value (only recreated when slices change) ───────────────
  const value = useMemo<Store>(() => ({
    candidates, roles, contracts, filters, selectedIds,
    setCandidates, setRoles, addCandidate, addCandidates,
    updateCandidate, deleteCandidate, deleteCandidates, deleteBelowScore,
    addRole, updateContract, setFilters, clearFilters,
    toggleSelect, toggleSelectAll, clearSelection, exportCSV,
    interviews, setInterviews, addInterview, updateInterview, offers, addOffer, updateOffer,
    documents, updateDocument, employees, addEmployee, updateEmployee,
    employeeBonds, updateEmployeeBond, employeeResignations, addEmployeeResignation
  }), [
    candidates, roles, contracts, filters, selectedIds,
    setCandidates, setRoles, addCandidate, addCandidates,
    updateCandidate, deleteCandidate, deleteCandidates, deleteBelowScore,
    addRole, updateContract, setFilters, clearFilters,
    toggleSelect, toggleSelectAll, clearSelection, exportCSV,
    interviews, setInterviews, addInterview, updateInterview, offers, addOffer, updateOffer,
    documents, updateDocument, employees, addEmployee, updateEmployee,
    employeeBonds, updateEmployeeBond, employeeResignations, addEmployeeResignation
  ]);

  return <StoreCtx.Provider value={value}>{children}</StoreCtx.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreCtx);
  if (!ctx) throw new Error("useStore must be inside StoreProvider");
  return ctx;
}

// ─── Pre-parsed age range cache ──────────────────────────────────────────────
const ageRangeCache = new Map<string, [number, number]>();
function parseAgeRange(range: string): [number, number] {
  if (ageRangeCache.has(range)) return ageRangeCache.get(range)!;
  const result: [number, number] = range === "40+" ? [40, 99] : range.split("-").map(Number) as [number, number];
  ageRangeCache.set(range, result);
  return result;
}

function matchesStatus(candidateStatus?: string, filterStatus?: string): boolean {
  if (!filterStatus || filterStatus === "all") return true;
  if (!candidateStatus) return false;
  if (candidateStatus === filterStatus) return true;
  const cNorm = candidateStatus.toLowerCase().replace(/[^a-z0-9]/g, "");
  const fNorm = filterStatus.toLowerCase().replace(/[^a-z0-9]/g, "");
  if (cNorm === fNorm) return true;
  if ((cNorm === "review" || cNorm === "inreview") && (fNorm === "review" || fNorm === "inreview")) return true;
  if ((cNorm === "interview1" || cNorm === "interviewr1") && (fNorm === "interview1" || fNorm === "interviewr1")) return true;
  if ((cNorm === "interview2" || cNorm === "interviewr2") && (fNorm === "interview2" || fNorm === "interviewr2")) return true;
  if ((cNorm === "offer" || cNorm === "offerprep") && (fNorm === "offer" || fNorm === "offerprep")) return true;
  if ((cNorm === "onboardingrequested" || cNorm === "onboardingrequired") && (fNorm === "onboardingrequested" || fNorm === "onboardingrequired")) return true;
  if ((cNorm === "onboardingverified" || cNorm === "onboardingverification") && (fNorm === "onboardingverified" || fNorm === "onboardingverification")) return true;
  return false;
}

export function useFilteredCandidates() {
  const { candidates, filters } = useStore();

  return useMemo(() => {
    const { roleId, status, city, gender, exp, ageRange, search, sort } = filters;

    // Pre-compute search query once
    const q = search ? search.toLowerCase() : null;
    const [lo, hi] = ageRange !== "all" ? parseAgeRange(ageRange) : [0, 999];

    const filtered = candidates.filter(c => {
      if (roleId !== "all" && c.roleId !== roleId) return false;
      if (status !== "all" && !matchesStatus(c.status, status)) return false;
      if (city && c.city !== city) return false;
      if (gender !== "all" && c.gender !== gender) return false;
      if (exp !== "all" && c.exp !== exp) return false;
      if (ageRange !== "all" && (c.age < lo || c.age > hi)) return false;
      if (q && !c.name.toLowerCase().includes(q)
            && !c.email.toLowerCase().includes(q)
            && !c.roleName.toLowerCase().includes(q)) return false;
      return true;
    });

    // Apply sort
    return [...filtered].sort((a, b) => {
      switch (sort) {
        case "newest":
          // Fall back to array position (index) for old records without createdAt
          return (b.createdAt ?? "") > (a.createdAt ?? "") ? 1 : -1;
        case "oldest":
          return (a.createdAt ?? "") > (b.createdAt ?? "") ? 1 : -1;
        case "score-desc":
          return b.score.total - a.score.total;
        case "score-asc":
          return a.score.total - b.score.total;
        case "name-az":
          return a.name.localeCompare(b.name);
        default:
          return 0;
      }
    });
  }, [candidates, filters]);
}
