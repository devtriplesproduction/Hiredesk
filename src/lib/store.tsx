"use client";
import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from "react";
import type { Candidate, Role, Contract, Filters, Interview, Offer, CandidateDocument, Employee, EmployeeBond, EmployeeResignation } from "@/types";
import { DEFAULT_ROLES, generateSeedCandidates, getContractTemplates } from "@/lib/data";
import { exportCandidatesToCSV } from "@/lib/utils/csv";
import { DialogProvider } from "@/lib/dialog";

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
  deleteCandidate: (id: string) => Promise<void>;
  deleteCandidates: (ids: string[]) => Promise<void>;
  deleteBelowScore: (threshold: number) => Promise<number>;
  addRole: (r: Role) => void;
  updateRole: (id: string, patch: Partial<Role>) => Promise<void>;
  deleteRole: (id: string) => Promise<void>;
  deleteRoles: (ids: string[]) => Promise<void>;
  updateContract: (id: string, update: string | Partial<Contract>) => void;
  globalBrandAssets: { logoUrl: string; signUrl: string };
  setGlobalBrandAsset: (type: "logo" | "sign", url: string) => void;
  deleteGlobalBrandAsset: (type: "logo" | "sign") => void;
  setContractAsset: (id: string, type: "logo" | "sign", url: string) => void;
  deleteContractAsset: (id: string, type: "logo" | "sign") => void;
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
  employmentStatus: "all", sort: "newest",
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
  const [contracts, setContracts] = useState<Contract[]>(() => {
    const defaultList = getContractTemplates();
    if (typeof window === "undefined") return defaultList;
    return defaultList.map(c => ({
      ...c,
      logoUrl: c.logoUrl || localStorage.getItem(`doc_${c.id}_logo`) || "",
      signUrl: c.signUrl || localStorage.getItem(`doc_${c.id}_sign`) || "",
    }));
  });
  const [globalBrandAssets, setGlobalBrandAssets] = useState<{ logoUrl: string; signUrl: string }>(() => {
    if (typeof window === "undefined") return { logoUrl: "", signUrl: "" };
    return {
      logoUrl: localStorage.getItem("tsp_logo") || "",
      signUrl: localStorage.getItem("tsp_sign") || "",
    };
  });
  const [filters, setFiltersRaw] = useState<Filters>(DEFAULT_FILTERS);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const initializedRef = useRef(false);

  // ─── Stable, Resilient State Hydration ───────────────────
  const loadInitialData = useCallback(async () => {
    try {
      const { getDBCandidates, getDBRoles, getDBContracts, getDBInterviews, getDBOffers, getDBCandidateDocuments, getDBEmployees, getDBEmployeeBonds, getDBEmployeeResignations, insertDBRoles, insertDBContracts, getBrandAssetUrl } = await import("@/lib/supabase");
      
      console.log("[HireDesk Store] Starting database hydration...");
      
      // Hydrate Global Brand Assets
      try {
        const gLogo = await getBrandAssetUrl("tsp_logo");
        const gSign = await getBrandAssetUrl("tsp_sign");
        setGlobalBrandAssets({
          logoUrl: gLogo || "",
          signUrl: gSign || "",
        });
      } catch (assetErr) {
        console.warn("[HireDesk Store] Failed to hydrate global brand assets:", assetErr);
      }

      // Helper to attach local document assets to contract list
      const attachDocAssets = (list: Contract[]) => {
        return list.map(c => {
          const storedLogo = typeof window !== "undefined" ? localStorage.getItem(`doc_${c.id}_logo`) : "";
          const storedSign = typeof window !== "undefined" ? localStorage.getItem(`doc_${c.id}_sign`) : "";
          return {
            ...c,
            logoUrl: c.logoUrl || storedLogo || "",
            signUrl: c.signUrl || storedSign || "",
          };
        });
      };

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
          const defaultContracts = attachDocAssets(getContractTemplates());
          setContracts(defaultContracts);
          insertDBContracts(defaultContracts).catch(err =>
            console.error("[HireDesk Store] Failed to seed default contracts to Supabase:", err)
          );
        } else {
          setContracts(attachDocAssets(dbContracts));
        }
      } else {
        setContracts(attachDocAssets(getContractTemplates()));
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

  const deleteCandidate = useCallback(async (id: string) => {
    setCandidatesRaw(prev => {
      const next = prev.filter(c => c.id !== id);
      setRolesRaw(rPrev => computeRoleCounts(next, rPrev));
      return next;
    });
    setSelectedIds(prev => {
      if (!prev.has(id)) return prev;
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
    try {
      const db = await import("@/lib/supabase");
      await db.deleteDBCandidate(id);
    } catch (err) {
      console.error("[HireDesk Store] Failed to delete candidate from Supabase:", err);
      throw err;
    }
  }, []);

  const deleteCandidates = useCallback(async (ids: string[]) => {
    const idSet = new Set(ids);
    setCandidatesRaw(prev => {
      const next = prev.filter(c => !idSet.has(c.id));
      setRolesRaw(rPrev => computeRoleCounts(next, rPrev));
      return next;
    });
    setSelectedIds(prev => {
      const next = new Set(prev);
      ids.forEach(id => next.delete(id));
      return next;
    });
    try {
      const db = await import("@/lib/supabase");
      await db.deleteDBCandidates(ids);
    } catch (err) {
      console.error("[HireDesk Store] Failed to delete candidates from Supabase:", err);
      throw err;
    }
  }, []);

  const deleteBelowScore = useCallback(async (threshold: number) => {
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
      try {
        const db = await import("@/lib/supabase");
        await db.deleteDBCandidates(toDeleteIds);
      } catch (err) {
        console.error("[HireDesk Store] Failed to delete below-score candidates from Supabase:", err);
      }
    }
    return deletedCount;
  }, []);

  const addRole = useCallback((r: Role) => {
    setRolesRaw(prev => {
      const next = [...prev, r];
      if (typeof window !== "undefined") {
        try { localStorage.setItem("hiredesk_custom_roles", JSON.stringify(next)); } catch (e) {}
      }
      return next;
    });
    import("@/lib/supabase").then(db => db.insertDBRoles([r])).catch(console.error);
  }, []);

  const updateRole = useCallback(async (id: string, patch: Partial<Role>) => {
    setRolesRaw(prev => {
      const next = prev.map(r => r.id === id ? { ...r, ...patch } : r);
      if (typeof window !== "undefined") {
        try { localStorage.setItem("hiredesk_custom_roles", JSON.stringify(next)); } catch (e) {}
      }
      return next;
    });
    if (patch.name) {
      setCandidatesRaw(prev => prev.map(c => c.roleId === id ? { ...c, roleName: patch.name! } : c));
    }
    try {
      const db = await import("@/lib/supabase");
      await db.updateDBRole(id, patch);
    } catch (err) {
      console.error("[HireDesk Store] Failed to update role in Supabase:", err);
    }
  }, []);

  const deleteRole = useCallback(async (id: string) => {
    setRolesRaw(prev => {
      const next = prev.filter(r => r.id !== id);
      if (typeof window !== "undefined") {
        try { localStorage.setItem("hiredesk_custom_roles", JSON.stringify(next)); } catch (e) {}
      }
      return next;
    });
    setFiltersRaw(prev => prev.roleId === id ? { ...prev, roleId: "" } : prev);
    try {
      const db = await import("@/lib/supabase");
      await db.deleteDBRole(id);
    } catch (err) {
      console.error("[HireDesk Store] Failed to delete role from Supabase:", err);
    }
  }, []);

  const deleteRoles = useCallback(async (ids: string[]) => {
    const idSet = new Set(ids);
    setRolesRaw(prev => {
      const next = prev.filter(r => !idSet.has(r.id));
      if (typeof window !== "undefined") {
        try { localStorage.setItem("hiredesk_custom_roles", JSON.stringify(next)); } catch (e) {}
      }
      return next;
    });
    setFiltersRaw(prev => idSet.has(prev.roleId) ? { ...prev, roleId: "" } : prev);
    try {
      const db = await import("@/lib/supabase");
      await db.deleteDBRoles(ids);
    } catch (err) {
      console.error("[HireDesk Store] Failed to delete roles from Supabase:", err);
    }
  }, []);

  const updateContract = useCallback((id: string, update: string | Partial<Contract>) => {
    const patch = typeof update === "string" ? { body: update } : update;
    setContracts(prev => prev.map(c => c.id === id ? { ...c, ...patch } : c));
    import("@/lib/supabase").then(db => db.updateDBContract(id, patch)).catch(console.error);
  }, []);

  const setGlobalBrandAsset = useCallback((type: "logo" | "sign", url: string) => {
    setGlobalBrandAssets(prev => ({
      ...prev,
      [type === "logo" ? "logoUrl" : "signUrl"]: url,
    }));
  }, []);

  const deleteGlobalBrandAsset = useCallback((type: "logo" | "sign") => {
    setGlobalBrandAssets(prev => ({
      ...prev,
      [type === "logo" ? "logoUrl" : "signUrl"]: "",
    }));
  }, []);

  const setContractAsset = useCallback((id: string, type: "logo" | "sign", url: string) => {
    const prop = type === "logo" ? "logoUrl" : "signUrl";
    setContracts(prev => prev.map(c => c.id === id ? { ...c, [prop]: url } : c));
    if (typeof window !== "undefined") {
      localStorage.setItem(`doc_${id}_${type}`, url);
    }
    import("@/lib/supabase").then(db => db.updateDBContract(id, { [prop]: url })).catch(console.error);
  }, []);

  const deleteContractAsset = useCallback((id: string, type: "logo" | "sign") => {
    const prop = type === "logo" ? "logoUrl" : "signUrl";
    setContracts(prev => prev.map(c => c.id === id ? { ...c, [prop]: "" } : c));
    if (typeof window !== "undefined") {
      localStorage.removeItem(`doc_${id}_${type}`);
    }
    import("@/lib/supabase").then(db => {
      db.deleteDocumentAsset(id, type).catch(console.error);
      db.updateDBContract(id, { [prop]: null }).catch(console.error);
    }).catch(console.error);
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
    addRole, updateRole, deleteRole, deleteRoles, updateContract,
    globalBrandAssets, setGlobalBrandAsset, deleteGlobalBrandAsset,
    setContractAsset, deleteContractAsset,
    setFilters, clearFilters,
    toggleSelect, toggleSelectAll, clearSelection, exportCSV,
    interviews, setInterviews, addInterview, updateInterview, offers, addOffer, updateOffer,
    documents, updateDocument, employees, addEmployee, updateEmployee,
    employeeBonds, updateEmployeeBond, employeeResignations, addEmployeeResignation
  }), [
    candidates, roles, contracts, filters, selectedIds,
    setCandidates, setRoles, addCandidate, addCandidates,
    updateCandidate, deleteCandidate, deleteCandidates, deleteBelowScore,
    addRole, updateRole, deleteRole, deleteRoles, updateContract,
    globalBrandAssets, setGlobalBrandAsset, deleteGlobalBrandAsset,
    setContractAsset, deleteContractAsset,
    setFilters, clearFilters,
    toggleSelect, toggleSelectAll, clearSelection, exportCSV,
    interviews, setInterviews, addInterview, updateInterview, offers, addOffer, updateOffer,
    documents, updateDocument, employees, addEmployee, updateEmployee,
    employeeBonds, updateEmployeeBond, employeeResignations, addEmployeeResignation
  ]);

  // ─── Auto-sync: create employee records for HIRED candidates without one ─────
  const syncingRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!initializedRef.current) return;

    const hiredWithoutEmployee = candidates.filter(
      c => c.status === "hired" && !employees.some(e => e.candidateId === c.id) && !syncingRef.current.has(c.id)
    );

    if (hiredWithoutEmployee.length === 0) return;

    hiredWithoutEmployee.forEach(c => {
      syncingRef.current.add(c.id);

      // Determine employment type from the role
      const role = roles.find(r => r.id === c.roleId);
      const employmentType = role?.type || "Full-time";

      fetch("/api/employees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          candidateId: c.id,
          offerId: offers.find(o => o.candidateId === c.id)?.id || null,
          name: c.name,
          email: c.email,
          phone: c.phone,
          employmentType,
        }),
      })
        .then(res => res.json())
        .then(data => {
          if (data.success && data.employee) {
            // Only add if not already in state
            setEmployees(prev => {
              if (prev.some(e => e.candidateId === c.id)) return prev;
              return [...prev, data.employee];
            });
          }
        })
        .catch(err => {
          console.error("[HireDesk Store] Auto-sync employee failed for", c.id, err);
        })
        .finally(() => {
          syncingRef.current.delete(c.id);
        });
    });
  }, [candidates, employees, roles, offers]);

  return <StoreCtx.Provider value={value}><DialogProvider>{children}</DialogProvider></StoreCtx.Provider>;
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

export function useFilteredCandidates() {
  const { candidates, filters } = useStore();

  return useMemo(() => {
    const { roleId, status, city, gender, exp, ageRange, search, sort, employmentStatus } = filters;

    // Pre-compute search query once
    const q = search ? search.toLowerCase() : null;
    const [lo, hi] = (ageRange && ageRange !== "all") ? parseAgeRange(ageRange as string) : [0, 999];

    const filtered = candidates.filter(c => {
      if (roleId !== "all" && c.roleId !== roleId) return false;
      if (status !== "all" && c.status !== status) return false;
      if (city && c.city !== city) return false;
      if (gender !== "all" && c.gender !== gender) return false;
      if (exp !== "all" && c.exp !== exp) return false;
      if (employmentStatus && employmentStatus !== "all" && c.employmentStatus !== employmentStatus) return false;
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
