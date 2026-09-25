"use client";
import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from "react";
import type { Candidate, Role, Contract, Filters, Interview, Offer, CandidateDocument, Employee, EmployeeBond, EmployeeResignation } from "@/types";
import { DEFAULT_ROLES, generateSeedCandidates, getContractTemplates, calculateMatchScore } from "@/lib/data";
import { canSetStatus } from "@/lib/hiring-sop";
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
    return defaultList.map(c => {
      const savedBody = localStorage.getItem(`hd_contract_${c.id}_body`);
      return {
        ...c,
        body: savedBody || c.body,
        logoUrl: c.logoUrl || localStorage.getItem(`doc_${c.id}_logo`) || "",
        signUrl: c.signUrl || localStorage.getItem(`doc_${c.id}_sign`) || "",
      };
    });
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
          const storedBody = typeof window !== "undefined" ? localStorage.getItem(`hd_contract_${c.id}_body`) : "";
          return {
            ...c,
            body: storedBody || c.body,
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
        const defaultTemplates = getContractTemplates();
        const pristineExp = defaultTemplates.find(t => t.id === "exp_letter");

        // Self-heal exp_letter if it was accidentally overwritten with appointment letter
        const healedDbContracts = dbContracts.map(c => {
          if (
            c.id === "exp_letter" &&
            pristineExp &&
            (
              c.body.includes("Letter of Appointment") ||
              c.body.includes("Acceptance of Offer") ||
              c.body.includes('class="page cover"') ||
              c.body.includes("buildPage8") ||
              !c.body.includes("exp-cert-page") ||
              !c.body.includes("Experience Certificate") ||
              !c.body.includes("Shital Khulape") ||
              c.body.includes("translateX(-50%)") ||
              !c.body.includes("text-align:center") ||
              c.body.includes("height:48px") ||
              c.body.includes("height:50px") ||
              c.body.includes("margin-top:auto") ||
              c.body.includes(">Triple S</span>") ||
              c.body.includes("height:28px")
            )
          ) {
            import("@/lib/supabase").then(db => db.updateDBContract("exp_letter", { body: pristineExp.body, name: "Experience Letter" })).catch(console.error);
            return { ...c, body: pristineExp.body, name: "Experience Letter" };
          }
          return c;
        });

        if (dbContracts.length === 0) {
          const defaultContracts = attachDocAssets(defaultTemplates);
          setContracts(defaultContracts);
          insertDBContracts(defaultContracts).catch(err =>
            console.error("[HireDesk Store] Failed to seed default contracts to Supabase:", err)
          );
        } else {
          // Merge any default templates missing from DB (e.g. exp_letter or rel_letter if added after initial seed)
          const missing = defaultTemplates.filter(dt => !healedDbContracts.some(dc => dc.id === dt.id));
          const fullList = [...healedDbContracts, ...missing];
          if (missing.length > 0) {
            insertDBContracts(missing).catch(console.error);
          }
          setContracts(attachDocAssets(fullList));
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
        // Defensive deduplication in case of any duplicate rows
        const seenCandidateIds = new Set<string>();
        const uniqueEmps = dbEmps.filter(e => {
          const cid = e.candidateId || (e as any).candidate_id;
          if (!cid) return true;
          if (seenCandidateIds.has(cid)) return false;
          seenCandidateIds.add(cid);
          return true;
        });
        setEmployees(uniqueEmps);
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
          
          const attachDocAssets = (list: Contract[]) => {
            return list.map(c => {
              const storedLogo = typeof window !== "undefined" ? localStorage.getItem(`doc_${c.id}_logo`) : "";
              const storedSign = typeof window !== "undefined" ? localStorage.getItem(`doc_${c.id}_sign`) : "";
              const storedBody = typeof window !== "undefined" ? localStorage.getItem(`hd_contract_${c.id}_body`) : "";
              return {
                ...c,
                body: storedBody || c.body,
                logoUrl: c.logoUrl || storedLogo || "",
                signUrl: c.signUrl || storedSign || "",
              };
            });
          };
          setContracts(attachDocAssets(getContractTemplates()));
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
      const candidate = prev.find(c => c.id === id);
      if (!candidate) return prev;

      if (patch.status && patch.status !== candidate.status) {
        const check = canSetStatus(candidate.status, patch.status);
        if (!check.ok) {
          alert(check.reason);
          return prev;
        }
      }

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
    let updatedRole: Role | undefined;
    setRolesRaw(prev => {
      const next = prev.map(r => {
        if (r.id === id) {
          updatedRole = { ...r, ...patch };
          return updatedRole;
        }
        return r;
      });
      if (typeof window !== "undefined") {
        try { localStorage.setItem("hiredesk_custom_roles", JSON.stringify(next)); } catch (e) {}
      }
      return next;
    });
    
    let updatedCandidatesToSave: Candidate[] = [];
    if (patch.name || patch.keywords || patch.reqExp !== undefined || patch.reqEdu !== undefined) {
      setCandidatesRaw(prev => {
        const next = prev.map(c => {
          if (c.roleId === id && updatedRole) {
            const updatedC = { ...c };
            let changed = false;
            if (patch.name) {
              updatedC.roleName = patch.name;
              changed = true;
            }
            if (patch.keywords || patch.reqExp !== undefined || patch.reqEdu !== undefined) {
              updatedC.score = calculateMatchScore(c.resumeText || "", {
                keywords: updatedRole.keywords,
                exp: updatedRole.reqExp,
                education: updatedRole.reqEdu
              }, c);
              changed = true;
            }
            if (changed) {
              updatedCandidatesToSave.push(updatedC);
            }
            return updatedC;
          }
          return c;
        });
        return next;
      });
    }

    try {
      const db = await import("@/lib/supabase");
      await db.updateDBRole(id, patch);
      
      for (const c of updatedCandidatesToSave) {
        await db.updateDBCandidate(c.id, { score: c.score, roleName: c.roleName });
      }
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
    if (patch.body !== undefined && typeof window !== "undefined") {
      localStorage.setItem(`hd_contract_${id}_body`, patch.body);
    }
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
    const candidateId = e.candidateId || (e as any).candidate_id;
    setEmployees(prev => {
      if (prev.some(x => (x.id && x.id === e.id) || (candidateId && (x.candidateId === candidateId || (x as any).candidate_id === candidateId)))) {
        return prev.map(x => (x.id === e.id || ((x.candidateId || (x as any).candidate_id) === candidateId)) ? { ...x, ...e } : x);
      }
      return [...prev, e];
    });
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
      c => c.status === "hired" && !employees.some(e => (e.candidateId === c.id || (e as any).candidate_id === c.id)) && !syncingRef.current.has(c.id)
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
            const emp: Employee = {
              id: data.employee.id,
              candidateId: data.employee.candidateId || data.employee.candidate_id,
              offerId: data.employee.offerId || data.employee.offer_id,
              name: data.employee.name,
              email: data.employee.email,
              phone: data.employee.phone,
              employmentType: data.employee.employmentType || data.employee.employment_type,
              bondRequirement: data.employee.bondRequirement || data.employee.bond_requirement || "UNKNOWN",
              status: data.employee.status || "active",
              createdAt: data.employee.createdAt || data.employee.created_at,
            };
            // Only add if not already in state
            setEmployees(prev => {
              if (prev.some(e => (e.candidateId === c.id || (e as any).candidate_id === c.id || e.id === emp.id))) return prev;
              return [...prev, emp];
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

function normalizeStatusStr(s?: string) {
  return (s || "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

function matchesCandidateStatus(candStatus?: string, filterStatus?: string): boolean {
  if (!filterStatus || filterStatus === "all") return true;
  const cNorm = normalizeStatusStr(candStatus);
  const fNorm = normalizeStatusStr(filterStatus);
  if (cNorm === fNorm) return true;

  if (filterStatus === "screening") {
    return ["screening", "review", "in_review"].includes(cNorm);
  }
  if (filterStatus === "offer_sent") {
    return ["offer_sent", "offer"].includes(cNorm);
  }
  if (filterStatus === "offer_sent") {
    return ["offersent", "offer_sent"].includes(cNorm);
  }
  if (filterStatus === "offer_accepted") {
    return ["offeraccepted", "offer_accepted"].includes(cNorm);
  }
  if (filterStatus === "offer_rejected") {
    return ["offerrejected", "offer_rejected"].includes(cNorm);
  }
  if (filterStatus === "interview") {
    return ["interview", "interview_1"].includes(cNorm);
  }
  if (filterStatus === "final_discussion") {
    return ["final_discussion", "interview_2"].includes(cNorm);
  }
  if (filterStatus === "onboarding_requested") {
    return ["onboardingrequested", "onboardingrequired", "onboarding_requested", "onboarding_required"].includes(cNorm);
  }
  if (filterStatus === "onboarding_review") {
    return ["onboardingreview", "onboarding_review"].includes(cNorm);
  }
  if (filterStatus === "onboarding_verified") {
    return ["onboardingverified", "onboardingverification", "onboarding_verified", "onboarding_verification"].includes(cNorm);
  }
  if (filterStatus === "onboarding_rejected") {
    return ["onboardingrejected", "onboarding_rejected"].includes(cNorm);
  }
  if (filterStatus === "selected") {
    return ["selected", "approved"].includes(cNorm);
  }
  if (filterStatus === "rejected") {
    return ["rejected"].includes(cNorm);
  }
  if (filterStatus === "hired") {
    return false;
  }
  if (filterStatus === "new") {
    return ["new"].includes(cNorm);
  }
  if (filterStatus === "shortlisted") {
    return ["shortlisted"].includes(cNorm);
  }
  return false;
}

function matchesExp(candidateExp?: string, filterExp?: string): boolean {
  if (!filterExp || filterExp === "all") return true;
  if (!candidateExp) return false;
  const cExp = candidateExp.trim().toLowerCase();
  const fExp = filterExp.trim().toLowerCase();
  if (cExp === fExp) return true;

  if (fExp === "fresher") {
    return cExp.includes("fresh") || cExp.startsWith("0");
  }
  if (fExp === "1 yr" || fExp === "1 yrs" || fExp === "1 year") {
    return cExp.startsWith("1") || cExp.includes("1 yr") || cExp.includes("1 year");
  }
  if (fExp === "2 yrs" || fExp === "2 yr" || fExp === "2 years") {
    return cExp.startsWith("2") || cExp.includes("2 yr") || cExp.includes("2 year");
  }
  if (fExp === "3 yrs" || fExp === "3 yr" || fExp === "3 years") {
    return cExp.startsWith("3") || cExp.startsWith("4") || cExp.includes("3 yr") || cExp.includes("3 year");
  }
  if (fExp === "5+ yrs" || fExp === "5+ years" || fExp === "5+") {
    const num = parseInt(cExp, 10);
    return cExp.includes("5+") || (!isNaN(num) && num >= 5);
  }
  return cExp.includes(fExp);
}

export function useFilteredCandidates() {
  const { candidates, filters, roles, employees } = useStore();

  return useMemo(() => {
    const { roleId, status, city, gender, exp, ageRange, search, sort, employmentStatus } = filters;

    // Set of candidate IDs who have been added to employees list
    const hiredCandidateIds = new Set<string>();
    employees.forEach(e => {
      const cid = e.candidateId || (e as any).candidate_id;
      if (cid) hiredCandidateIds.add(cid);
    });

    // Pre-compute search query once
    const q = search ? search.trim().toLowerCase() : null;
    const cleanQ = q ? q.replace(/[^0-9a-z]/gi, "") : "";
    const [lo, hi] = (ageRange && ageRange !== "all") ? parseAgeRange(ageRange as string) : [0, 999];

    const filtered = candidates.filter(c => {
      // Exclude candidates who are hired or added to employees list
      if (c.status === "hired" || hiredCandidateIds.has(c.id)) {
        return false;
      }

      // 1. Role filter
      if (roleId && roleId !== "all") {
        const idMatch = c.roleId === roleId;
        const roleObj = roles.find(r => r.id === roleId);
        const nameMatch = roleObj && c.roleName
          ? c.roleName.trim().toLowerCase() === roleObj.name.trim().toLowerCase()
          : false;
        if (!idMatch && !nameMatch) return false;
      }

      // 2. Status filter (with smart normalization)
      if (status && status !== "all") {
        if (!matchesCandidateStatus(c.status, status)) return false;
      }

      // 3. City filter (case-insensitive)
      if (city && city !== "all" && city !== "") {
        const cCity = (c.city || "").trim().toLowerCase();
        const fCity = city.trim().toLowerCase();
        if (cCity !== fCity) return false;
      }

      // 4. Gender filter (case-insensitive)
      if (gender && gender !== "all") {
        const cGen = (c.gender || "").trim().toLowerCase();
        const fGen = gender.trim().toLowerCase();
        if (cGen !== fGen) return false;
      }

      // 5. Experience filter
      if (exp && exp !== "all") {
        if (!matchesExp(c.exp, exp)) return false;
      }

      // 6. Employment Status filter
      if (employmentStatus && employmentStatus !== "all") {
        if (c.employmentStatus !== employmentStatus) return false;
      }

      // 7. Age Range filter
      if (ageRange && ageRange !== "all") {
        const age = Number(c.age);
        if (isNaN(age) || age < lo || age > hi) return false;
      }

      // 8. Search query filter across multiple fields
      if (q) {
        const name = (c.name || "").toLowerCase();
        const email = (c.email || "").toLowerCase();
        const role = (c.roleName || "").toLowerCase();
        const cCity = (c.city || "").toLowerCase();
        const phone = (c.phone || "").replace(/[^0-9]/g, "");
        const skills = Array.isArray(c.skills) ? c.skills.join(" ").toLowerCase() : "";

        const matchesQuery =
          name.includes(q) ||
          email.includes(q) ||
          role.includes(q) ||
          cCity.includes(q) ||
          skills.includes(q) ||
          (cleanQ.length >= 3 && phone.includes(cleanQ));

        if (!matchesQuery) return false;
      }

      return true;
    });

    // 9. Apply sort safely
    return [...filtered].sort((a, b) => {
      switch (sort) {
        case "newest": {
          const timeA = new Date(a.createdAt || a.appliedAt || 0).getTime() || 0;
          const timeB = new Date(b.createdAt || b.appliedAt || 0).getTime() || 0;
          return timeB - timeA;
        }
        case "oldest": {
          const timeA = new Date(a.createdAt || a.appliedAt || 0).getTime() || 0;
          const timeB = new Date(b.createdAt || b.appliedAt || 0).getTime() || 0;
          return timeA - timeB;
        }
        case "score-desc":
          return (b.score?.total ?? 0) - (a.score?.total ?? 0);
        case "score-asc":
          return (a.score?.total ?? 0) - (b.score?.total ?? 0);
        case "name-az":
          return (a.name || "").localeCompare(b.name || "");
        default:
          return 0;
      }
    });
  }, [candidates, filters, roles, employees]);
}
