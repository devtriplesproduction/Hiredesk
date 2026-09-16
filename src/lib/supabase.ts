import { createClient } from "@supabase/supabase-js";
import type { Candidate, Interview } from "@/types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    "Supabase credentials missing. Make sure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set in your .env.local file."
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Helper functions for candidate database sync
export async function getDBCandidates(): Promise<Candidate[]> {
  const { data, error } = await supabase
    .from("candidates")
    .select("*")
    .order("createdAt", { ascending: false });

  if (error) {
    console.error("Error fetching candidates from Supabase:", error);
    throw error;
  }
  return (data || []) as Candidate[];
}

/**
 * Recursively removes unsupported Postgres null characters (\u0000) from string properties
 * in candidates or patches to prevent the 'unsupported Unicode escape sequence' database error.
 */
export function cleanNullBytes<T>(obj: T): T {
  if (obj === null || obj === undefined) return obj;
  
  if (typeof obj === "string") {
    return obj.replace(/\u0000/g, "") as unknown as T;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(cleanNullBytes) as unknown as T;
  }
  
  if (typeof obj === "object") {
    const cleaned: any = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        cleaned[key] = cleanNullBytes((obj as any)[key]);
      }
    }
    return cleaned as T;
  }
  
  return obj;
}

export async function insertDBCandidate(c: Candidate): Promise<void> {
  const cleaned = cleanNullBytes(c);
  const { error } = await supabase.from("candidates").insert(cleaned);
  if (error) {
    // If it's a missing column error (Postgres code 42703), retry without extraction fields
    if (error.code === "42703" || error.message?.includes("column")) {
      console.warn("[Supabase Sync] Database is missing name extraction columns. Retrying candidate insert without them...");
      const { extractionSource, extractionConfidence, extractionMetadata, ...sanitized } = cleaned as any;
      const { error: retryError } = await supabase.from("candidates").insert(sanitized);
      if (retryError) throw retryError;
    } else {
      console.error("Error inserting candidate to Supabase:", error);
      throw error;
    }
  }
}

export async function insertDBCandidates(candidates: Candidate[]): Promise<void> {
  const cleaned = candidates.map(c => cleanNullBytes(c));
  const { error } = await supabase.from("candidates").insert(cleaned);
  if (error) {
    if (error.code === "42703" || error.message?.includes("column")) {
      console.warn("[Supabase Sync] Database is missing name extraction columns. Retrying bulk insert without them...");
      const sanitizedCandidates = cleaned.map(c => {
        const { extractionSource, extractionConfidence, extractionMetadata, ...rest } = c as any;
        return rest;
      });
      const { error: retryError } = await supabase.from("candidates").insert(sanitizedCandidates);
      if (retryError) throw retryError;
    } else {
      console.error("Error inserting bulk candidates to Supabase:", error);
      throw error;
    }
  }
}

export async function updateDBCandidate(id: string, patch: Partial<Candidate>): Promise<void> {
  const cleaned = cleanNullBytes(patch);
  const { error } = await supabase.from("candidates").update(cleaned).eq("id", id);
  if (error) {
    if (error.code === "42703" || error.message?.includes("column")) {
      console.warn("[Supabase Sync] Database is missing name extraction columns. Retrying candidate update without them...");
      const { extractionSource, extractionConfidence, extractionMetadata, ...sanitizedPatch } = cleaned as any;
      const { error: retryError } = await supabase.from("candidates").update(sanitizedPatch).eq("id", id);
      if (retryError) throw retryError;
    } else {
      console.error("Error updating candidate in Supabase:", error);
      throw error;
    }
  }
}

export async function deleteDBCandidate(id: string): Promise<void> {
  const { error } = await supabase.from("candidates").delete().eq("id", id);
  if (error) {
    console.error("Error deleting candidate from Supabase:", error);
    throw error;
  }
}

export async function deleteDBCandidates(ids: string[]): Promise<void> {
  const { error } = await supabase.from("candidates").delete().in("id", ids);
  if (error) {
    console.error("Error deleting bulk candidates from Supabase:", error);
    throw error;
  }
}

/**
 * Clean and normalize file name to prevent space-encoding, duplicate extension,
 * and special character issues.
 */
export function sanitizeFilename(name: string): string {
  // Extract basename
  let clean = name.split(/[/\\]/).pop() || name;
  
  // Separate name and extension
  const parts = clean.split(".");
  let ext = parts.pop()?.toLowerCase() || "pdf";
  let base = parts.join(".");
  
  // Strip duplicate extensions like .pdf.pdf
  while (base.toLowerCase().endsWith(".pdf")) {
    base = base.slice(0, -4);
  }
  
  // Normalize characters: keep letters, numbers, hyphens, and underscores. Convert spaces to underscores.
  base = base
    .replace(/\s+/g, "_")
    .replace(/[^a-zA-Z0-9\-_]/g, "")
    .replace(/_+/g, "_")
    .trim();
    
  if (!base) base = "resume_" + Date.now();
  
  return `${base}.${ext}`;
}

export async function uploadResumeFile(file: File, candidateId: string): Promise<string> {
  const sanitizedName = sanitizeFilename(file.name);
  const fileExt = sanitizedName.split(".").pop() || "pdf";
  const fileTimestamp = Date.now();
  const filePath = `${candidateId}/${fileTimestamp}.${fileExt}`;
  
  console.log(`[Supabase Storage] Preparing upload:`, {
    rawName: file.name,
    sanitizedName,
    sizeBytes: file.size,
    mimeType: file.type,
    storagePath: filePath
  });

  const { data: uploadData, error } = await supabase.storage
    .from("resumes")
    .upload(filePath, file, {
      contentType: "application/pdf",
      cacheControl: "3600",
      upsert: false
    });

  if (error) {
    console.error("[Supabase Storage] Upload error details:", error);
    throw error;
  }

  console.log("[Supabase Storage] Upload succeeded. Response:", uploadData);

  const { data } = supabase.storage.from("resumes").getPublicUrl(filePath);
  
  console.log(`[Supabase Storage] Generated Public URL: "${data.publicUrl}"`);
  return data.publicUrl;
}

// ─── Brand Asset Storage (Logo & Signature) ─────────────────────────────────
// Stores the company logo and authorized signature in Supabase Storage so they
// persist across all devices, browsers, and sessions. Uses upsert=true so
// uploading a new file always replaces the old one at the same fixed path.

const BRAND_BUCKET = "brand-assets";

/**
 * Upload a brand asset (logo or signature) to Supabase Storage.
 * @param dataUrl  Base64 data URL of the image
 * @param key      "tsp_logo" | "tsp_sign"
 * @returns        Public URL of the uploaded asset
 */
export async function uploadBrandAsset(dataUrl: string, key: "tsp_logo" | "tsp_sign"): Promise<string> {
  // Always cache in localStorage immediately for resilient instant access
  if (typeof window !== "undefined") {
    localStorage.setItem(key, dataUrl);
  }

  try {
    const res = await fetch(dataUrl);
    const blob = await res.blob();
    const mimeType = blob.type || "image/png";
    const ext = mimeType.split("/")[1]?.split("+")[0] || "png";
    const filePath = `${key}.${ext}`;

    const { error } = await supabase.storage
      .from(BRAND_BUCKET)
      .upload(filePath, blob, {
        contentType: mimeType,
        cacheControl: "0",   // No cache — always fetch latest
        upsert: true,        // Replace existing file
      });

    if (error) {
      console.warn(`Supabase upload failed for ${key}, using local cache:`, error);
      return dataUrl;
    }

    const { data } = supabase.storage.from(BRAND_BUCKET).getPublicUrl(filePath);
    const publicUrl = `${data.publicUrl}?t=${Date.now()}`;
    if (typeof window !== "undefined") {
      localStorage.setItem(key, publicUrl);
    }
    return publicUrl;
  } catch (err) {
    console.warn(`Exception during brand asset upload for ${key}:`, err);
    return dataUrl;
  }
}

/**
 * Fetch the latest brand asset URL from Supabase Storage.
 * Falls back to localStorage cache if Supabase fails or asset doesn't exist.
 * @param key  "tsp_logo" | "tsp_sign"
 * @returns    Public URL string or empty string if not uploaded yet
 */
export async function getBrandAssetUrl(key: "tsp_logo" | "tsp_sign"): Promise<string> {
  // Fast path: localStorage
  if (typeof window !== "undefined") {
    const local = localStorage.getItem(key);
    if (local) return local;
  }

  // Try both .png and .jpg extensions
  for (const ext of ["png", "jpg", "jpeg", "webp"]) {
    const filePath = `${key}.${ext}`;
    const { data } = supabase.storage.from(BRAND_BUCKET).getPublicUrl(filePath);
    
    // Check if the file actually exists by doing a listing check
    try {
      const { data: listData } = await supabase.storage
        .from(BRAND_BUCKET)
        .list("", { search: `${key}.${ext}` });
      
      if (listData && listData.length > 0) {
        const url = `${data.publicUrl}?t=${Date.now()}`;
        if (typeof window !== "undefined") {
          localStorage.setItem(key, url);
        }
        return url;
      }
    } catch {
      // Ignore listing errors
    }
  }
  
  if (typeof window !== "undefined") {
    return localStorage.getItem(key) ?? "";
  }
  return "";
}

/**
 * Delete a brand asset from Supabase Storage and localStorage.
 */
export async function deleteBrandAsset(key: "tsp_logo" | "tsp_sign"): Promise<void> {
  if (typeof window !== "undefined") {
    localStorage.removeItem(key);
  }
  try {
    for (const ext of ["png", "jpg", "jpeg", "webp"]) {
      await supabase.storage.from(BRAND_BUCKET).remove([`${key}.${ext}`]);
    }
  } catch {
    // Ignore storage removal errors
  }
}

/**
 * Upload a document-specific asset (scoped strictly to contractId).
 * Does NOT affect global brand assets (tsp_logo / tsp_sign).
 */
export async function uploadDocumentAsset(contractId: string, dataUrl: string, type: "logo" | "sign"): Promise<string> {
  const localKey = `doc_${contractId}_${type}`;
  if (typeof window !== "undefined") {
    localStorage.setItem(localKey, dataUrl);
  }

  try {
    const res = await fetch(dataUrl);
    const blob = await res.blob();
    const mimeType = blob.type || "image/png";
    const ext = mimeType.split("/")[1]?.split("+")[0] || "png";
    const filePath = `contracts/${contractId}/${type}.${ext}`;

    const { error } = await supabase.storage
      .from(BRAND_BUCKET)
      .upload(filePath, blob, {
        contentType: mimeType,
        cacheControl: "0",
        upsert: true,
      });

    if (error) {
      console.warn(`Supabase upload failed for document asset ${localKey}, using local storage:`, error);
      return dataUrl;
    }

    const { data } = supabase.storage.from(BRAND_BUCKET).getPublicUrl(filePath);
    const publicUrl = `${data.publicUrl}?t=${Date.now()}`;
    if (typeof window !== "undefined") {
      localStorage.setItem(localKey, publicUrl);
    }
    return publicUrl;
  } catch (err) {
    console.warn(`Exception during document asset upload for ${localKey}:`, err);
    return dataUrl;
  }
}

/**
 * Fetch a document-specific asset URL (scoped strictly to contractId).
 */
export async function getDocumentAssetUrl(contractId: string, type: "logo" | "sign"): Promise<string> {
  const localKey = `doc_${contractId}_${type}`;
  if (typeof window !== "undefined") {
    const local = localStorage.getItem(localKey);
    if (local) return local;
  }

  try {
    for (const ext of ["png", "jpg", "jpeg", "webp"]) {
      const filePath = `contracts/${contractId}/${type}.${ext}`;
      const { data: listData } = await supabase.storage
        .from(BRAND_BUCKET)
        .list(`contracts/${contractId}`, { search: `${type}.${ext}` });

      if (listData && listData.length > 0) {
        const { data } = supabase.storage.from(BRAND_BUCKET).getPublicUrl(filePath);
        const url = `${data.publicUrl}?t=${Date.now()}`;
        if (typeof window !== "undefined") {
          localStorage.setItem(localKey, url);
        }
        return url;
      }
    }
  } catch {
    // Ignore storage check errors
  }

  if (typeof window !== "undefined") {
    return localStorage.getItem(localKey) ?? "";
  }
  return "";
}

/**
 * Delete a document-specific asset from Supabase Storage and localStorage.
 */
export async function deleteDocumentAsset(contractId: string, type: "logo" | "sign"): Promise<void> {
  const localKey = `doc_${contractId}_${type}`;
  if (typeof window !== "undefined") {
    localStorage.removeItem(localKey);
  }
  try {
    for (const ext of ["png", "jpg", "jpeg", "webp"]) {
      await supabase.storage.from(BRAND_BUCKET).remove([`contracts/${contractId}/${type}.${ext}`]);
    }
  } catch {
    // Ignore storage deletion errors
  }
}

// ─── ROLES DB ───────────────────────────────────────────────────────────────
export async function getDBRoles(): Promise<any[]> {
  const { data, error } = await supabase.from("roles").select("*").order("name", { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function insertDBRoles(roles: any[]): Promise<void> {
  if (roles.length === 0) return;
  const { error } = await supabase.from("roles").upsert(roles);
  if (error) throw error;
}

export async function updateDBRole(id: string, patch: any): Promise<void> {
  const { error } = await supabase.from("roles").update(patch).eq("id", id);
  if (error) throw error;
}

export async function deleteDBRole(id: string): Promise<void> {
  const { error } = await supabase.from("roles").delete().eq("id", id);
  if (error) throw error;
}

// ─── CONTRACTS DB ───────────────────────────────────────────────────────────
export async function getDBContracts(): Promise<any[]> {
  const { data, error } = await supabase.from("contracts").select("*").order("name", { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function insertDBContracts(contracts: any[]): Promise<void> {
  if (contracts.length === 0) return;
  const { error } = await supabase.from("contracts").upsert(contracts);
  if (error) throw error;
}

export async function updateDBContract(id: string, patch: any): Promise<void> {
  const { error } = await supabase.from("contracts").update(patch).eq("id", id);
  if (error) throw error;
}

export async function deleteDBContract(id: string): Promise<void> {
  const { error } = await supabase.from("contracts").delete().eq("id", id);
  if (error) throw error;
}

// ─── INTERVIEWS ─────────────────────────────────────────────────────────────
export async function getDBInterviews(): Promise<Interview[]> {
  const { data, error } = await supabase
    .from("interviews")
    .select("*")
    .order("createdAt", { ascending: false });

  if (error) {
    console.error("Error fetching interviews from Supabase:", error);
    throw error;
  }
  return (data || []) as Interview[];
}

export async function insertDBInterview(interview: Interview): Promise<void> {
  const cleaned = cleanNullBytes(interview);
  const { error } = await supabase.from("interviews").insert(cleaned);
  if (error) {
    console.error("Error inserting interview to Supabase:", error);
    throw error;
  }
}

export async function updateDBInterview(id: string, patch: Partial<Interview>): Promise<void> {
  const cleaned = cleanNullBytes(patch);
  const { error } = await supabase.from("interviews").update(cleaned).eq("id", id);
  if (error) {
    console.error("Error updating interview in Supabase:", error);
    throw error;
  }
}

// ─── OFFERS ─────────────────────────────────────────────────────────────────
import type { Offer } from "@/types";

export async function getDBOffers(): Promise<Offer[]> {
  const { data, error } = await supabase
    .from("offers")
    .select("*")
    .order("createdAt", { ascending: false });

  if (error) {
    console.error("Error fetching offers from Supabase:", error);
    throw error;
  }
  return (data || []) as Offer[];
}

export async function insertDBOffer(offer: Offer): Promise<void> {
  const cleaned = cleanNullBytes(offer);
  const { error } = await supabase.from("offers").insert(cleaned);
  if (error) {
    console.error("Error inserting offer to Supabase:", error);
    throw error;
  }
}

export async function updateDBOffer(id: string, patch: Partial<Offer>): Promise<void> {
  const cleaned = cleanNullBytes(patch);
  const { error } = await supabase.from("offers").update(cleaned).eq("id", id);
  if (error) {
    console.error("Error updating offer in Supabase:", error);
    throw error;
  }
}

// ─── CANDIDATE DOCUMENTS ──────────────────────────────────────────────────────
import type { CandidateDocument } from "@/types";

export async function getDBCandidateDocuments(): Promise<CandidateDocument[]> {
  const { data, error } = await supabase
    .from("candidate_documents")
    .select("*")
    .order("createdAt", { ascending: false });

  if (error) {
    console.error("Error fetching candidate documents:", error);
    throw error;
  }
  return (data || []) as CandidateDocument[];
}

export async function updateDBCandidateDocument(id: string, patch: Partial<CandidateDocument>): Promise<void> {
  const cleaned = cleanNullBytes(patch);
  const { error } = await supabase.from("candidate_documents").update(cleaned).eq("id", id);
  if (error) {
    console.error("Error updating candidate document:", error);
    throw error;
  }
}

export async function getDocumentSignedUrl(filePath: string): Promise<string | null> {
  const { data, error } = await supabase.storage.from("onboarding-docs").createSignedUrl(filePath, 60 * 60);
  if (error) {
    console.error("Error creating signed URL:", error);
    return null;
  }
  return data?.signedUrl || null;
}

// ─── EMPLOYEES ──────────────────────────────────────────────────────────────
import type { Employee, EmployeeBond, EmployeeResignation } from "@/types";

export async function getDBEmployees(): Promise<Employee[]> {
  const { data, error } = await supabase
    .from("employees")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching employees:", error);
    throw error;
  }
  
  // Map snake_case to camelCase
  return (data || []).map(emp => ({
    id: emp.id,
    candidateId: emp.candidate_id,
    offerId: emp.offer_id,
    name: emp.name,
    email: emp.email,
    phone: emp.phone,
    employmentType: emp.employment_type,
    bondRequirement: emp.bond_requirement,
    status: emp.status,
    createdAt: emp.created_at
  })) as Employee[];
}

export async function getDBEmployeeBonds(): Promise<EmployeeBond[]> {
  const { data, error } = await supabase.from("employee_bonds").select("*");
  if (error) throw error;
  return (data || []).map(b => ({
    id: b.id,
    employeeId: b.employee_id,
    isRequired: b.is_required,
    amount: b.amount,
    duration: b.duration,
    penalty: b.penalty,
    compensationFormula: b.compensation_formula,
    breachConditions: b.breach_conditions,
    legalRules: b.legal_rules,
    createdAt: b.created_at
  }));
}

export async function getDBEmployeeResignations(): Promise<EmployeeResignation[]> {
  const { data, error } = await supabase.from("employee_resignations").select("*");
  if (error) throw error;
  return (data || []).map(r => ({
    id: r.id,
    employeeId: r.employee_id,
    resignationReason: r.resignation_reason,
    isBreach: r.is_breach,
    breachReason: r.breach_reason,
    createdAt: r.created_at
  }));
}
