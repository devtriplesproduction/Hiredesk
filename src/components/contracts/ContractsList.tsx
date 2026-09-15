"use client";
import { useState, useEffect, useRef } from "react";
import { useStore } from "@/lib/store";
import { useSearchParams, useRouter } from "next/navigation";
import { uploadBrandAsset, getBrandAssetUrl, deleteBrandAsset } from "@/lib/supabase";
import ContractEditor from "./ContractEditor";
import GenerateContractModal from "./GenerateContractModal";
import type { Contract } from "@/types";
import { clsx } from "clsx";
import { Btn } from "@/components/ui";
import { AlertTriangle, CheckCircle2, Upload } from "lucide-react";

const CONTRACT_META: Record<string, { color: string; roles: string[] }> = {
  "emp-ft":    { color: "#4ade80", roles: ["All Full-time roles"] },
  "intern":    { color: "#facc15", roles: ["Dev Intern", "Any Intern"] },
  "freelance": { color: "#60a5fa", roles: ["Model", "Cameraman", "Freelance"] },
  "nda":       { color: "#c084fc", roles: ["All roles — recommended"] },
  "ip":        { color: "#fb923c", roles: ["Dev", "Designer", "Content", "Marketing"] },
  "model":     { color: "#f472b6", roles: ["Model (Male)", "Model (Female)"] },
};

export default function ContractsList() {
  const { contracts } = useStore();
  const [editing, setEditing] = useState<Contract | null>(null);
  const [generating, setGenerating] = useState<Contract | null>(null);
  const [preselectedCandidateId, setPreselectedCandidateId] = useState<string>("");
  const [hasLogo, setHasLogo] = useState(false);
  const [hasSign, setHasSign] = useState(false);

  const logoRef = useRef<HTMLInputElement>(null);
  const signRef = useRef<HTMLInputElement>(null);

  async function handleUpload(file: File, key: string, setter: (b: boolean) => void) {
    try {
      const { compressImage } = await import("@/lib/utils/image");
      const compressed = await compressImage(file, 400, 150);
      await uploadBrandAsset(compressed, key as "tsp_logo" | "tsp_sign");
      setter(true);
    } catch (err) {
      console.error("Compression or upload failed, falling back to raw data URL", err);
      const reader = new FileReader();
      reader.onload = async e => {
        const url = e.target?.result as string;
        try {
          await uploadBrandAsset(url, key as "tsp_logo" | "tsp_sign");
          setter(true);
        } catch (uploadErr) {
          console.error("Raw upload failed:", uploadErr);
        }
      };
      reader.readAsDataURL(file);
    }
  }

  async function handleClear(key: string, setter: (b: boolean) => void) {
    await deleteBrandAsset(key as "tsp_logo" | "tsp_sign");
    setter(false);
  }

  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    async function loadAssets() {
      const logo = await getBrandAssetUrl("tsp_logo");
      const sign = await getBrandAssetUrl("tsp_sign");
      setHasLogo(!!logo);
      setHasSign(!!sign);
    }
    loadAssets();
  }, []);

  useEffect(() => {
    const candidateId = searchParams.get("candidateId");
    const templateId = searchParams.get("templateId");
    if (candidateId && contracts.length > 0) {
      setPreselectedCandidateId(candidateId);
      const targetTemplate = templateId ? contracts.find(c => c.id === templateId) : null;
      setGenerating(targetTemplate || contracts[0]);
      router.replace("/contracts");
    }
  }, [contracts, searchParams, router]);

  if (editing) {
    return (
      <div className="h-full animate-fade-in">
        <ContractEditor contract={editing} onBack={() => setEditing(null)} />
      </div>
    );
  }

  return (
    <div className="w-full animate-fade-in">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <div className="lg:col-span-2 flex flex-col gap-3">
          {contracts.map(c => {
            const meta = CONTRACT_META[c.id] ?? { color: "#a0a0a0", roles: [] };
            return (
              <div key={c.id}
                className="flex flex-col sm:flex-row items-start sm:items-center gap-4 px-4 py-4 sm:px-5 sm:py-4 rounded-2xl transition-all duration-200 hover:bg-[var(--glass-2)]"
                style={{ background: "var(--glass)", border: "1px solid var(--border)" }}>

                <div className="w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                  style={{ background: "var(--glass-3)", border: "1px solid var(--border-2)" }}>
                  {c.icon}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="text-[15px] font-semibold tracking-tight">{c.name}</div>
                  <div className="text-xs text-[var(--text-3)] mt-0.5 font-medium">{c.desc}</div>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {meta.roles.map(r => (
                      <span key={r} className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                        style={{ background: meta.color + "18", color: meta.color, border: `1px solid ${meta.color}30` }}>
                        {r}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2 w-full sm:w-auto flex-shrink-0 mt-3 sm:mt-0 pt-3 sm:pt-0 border-t border-white/[0.03] sm:border-t-0 justify-end">
                  <Btn
                    onClick={() => { setPreselectedCandidateId(""); setGenerating(c); }}
                    className="text-sm font-semibold px-4 py-2 rounded-xl transition-all flex-1 sm:flex-none text-center"
                    style={{ background: "white", color: "black" }}>
                    Generate
                  </Btn>
                  <Btn onClick={() => setEditing(c)}
                    className="text-sm font-medium px-4 py-2 rounded-xl transition-all flex-1 sm:flex-none text-center"
                    style={{ background: "var(--glass-2)", border: "1px solid var(--border-2)", color: "var(--text)" }}>
                    Edit Template
                  </Btn>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right-Side Panel: Legal Disclaimer & Global Brand Assets */}
        <div className="flex flex-col gap-4">
          {/* 1. Legal Disclaimer Card */}
          <div className="p-5 sm:p-6 rounded-[14px] bg-[#151617] border border-[#292C31] flex flex-col">
            <div className="flex items-center gap-2.5 mb-3.5">
              <span className="text-[17px] leading-none text-[#F5C542] select-none">⚖️</span>
              <h2 className="text-[15px] font-semibold text-[#E8E8E8] tracking-tight">Legal Disclaimer</h2>
            </div>
            <p className="text-[13px] text-[#9DA3AE] leading-[1.6]">
              These templates are tailored for an Indian agency under standard Indian employment and commercial law.
              All fields in <strong className="text-[#F3F4F6] font-semibold">[BRACKETS]</strong> must be filled before use.
              We recommend having these reviewed by a qualified legal professional before signing.
            </p>
          </div>

          {/* 2. Global Brand Assets Card */}
          <div className="p-5 sm:p-6 rounded-[14px] bg-[#151617] border border-[#292C31] flex flex-col">
            <div className="text-[12px] font-semibold text-[#8B919C] uppercase tracking-[0.08em] mb-4">
              Global Brand Assets
            </div>

            <div className="flex flex-col gap-3.5">
              {/* Asset 1: Company Logo */}
              <div className="p-4 rounded-xl bg-[#191B1E] border border-[#2B2E34] flex flex-col items-center justify-center gap-3">
                {hasLogo ? (
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11.5px] font-semibold bg-[rgba(34,197,94,0.08)] border border-[rgba(34,197,94,0.25)] text-[#22C55E] select-none">
                    <CheckCircle2 size={12} className="text-[#22C55E]" />
                    <span>Logo Uploaded</span>
                  </div>
                ) : (
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11.5px] font-semibold bg-[rgba(245,197,66,0.08)] border border-[rgba(245,197,66,0.25)] text-[#F5C542] select-none">
                    <AlertTriangle size={12} className="text-[#F5C542]" />
                    <span>Missing Logo</span>
                  </div>
                )}

                <div className="flex items-center gap-2 w-full">
                  <button
                    type="button"
                    onClick={() => logoRef.current?.click()}
                    className="flex-1 h-[40px] px-3 rounded-lg text-[13px] font-semibold uppercase tracking-wider transition-all duration-150 border cursor-pointer inline-flex items-center justify-center gap-1.5 select-none outline-none bg-[#202328] hover:bg-[#262A30] active:bg-[#1A1C20] text-[#D8DCE3] hover:text-white border-[#33373E] hover:border-[#00D9FF] focus-visible:border-[#00D9FF] focus-visible:ring-1 focus-visible:ring-[#00D9FF]/30 active:scale-[0.98]"
                  >
                    <Upload size={13} className="text-[#8B919C] group-hover:text-white" />
                    <span>{hasLogo ? "Update Logo" : "Upload Logo"}</span>
                  </button>

                  {hasLogo && (
                    <button
                      type="button"
                      onClick={() => handleClear("tsp_logo", setHasLogo)}
                      className="h-[40px] px-3 rounded-lg text-[12px] font-semibold uppercase tracking-wider transition-all duration-150 border cursor-pointer inline-flex items-center justify-center select-none outline-none bg-[#202328] hover:bg-[#262A30] active:bg-[#1A1C20] text-[#8E949E] hover:text-[#EF4444] border-[#33373E] hover:border-[#EF4444]/40 focus-visible:ring-1 focus-visible:ring-[#EF4444]/30 active:scale-[0.98]"
                      title="Remove uploaded logo"
                    >
                      Clear
                    </button>
                  )}
                </div>

                <input
                  ref={logoRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={e => e.target.files?.[0] && handleUpload(e.target.files[0], "tsp_logo", setHasLogo)}
                />
              </div>

              {/* Asset 2: Company Signature */}
              <div className="p-4 rounded-xl bg-[#191B1E] border border-[#2B2E34] flex flex-col items-center justify-center gap-3">
                {hasSign ? (
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11.5px] font-semibold bg-[rgba(34,197,94,0.08)] border border-[rgba(34,197,94,0.25)] text-[#22C55E] select-none">
                    <CheckCircle2 size={12} className="text-[#22C55E]" />
                    <span>Sign Uploaded</span>
                  </div>
                ) : (
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11.5px] font-semibold bg-[rgba(245,197,66,0.08)] border border-[rgba(245,197,66,0.25)] text-[#F5C542] select-none">
                    <AlertTriangle size={12} className="text-[#F5C542]" />
                    <span>Missing Signature</span>
                  </div>
                )}

                <div className="flex items-center gap-2 w-full">
                  <button
                    type="button"
                    onClick={() => signRef.current?.click()}
                    className="flex-1 h-[40px] px-3 rounded-lg text-[13px] font-semibold uppercase tracking-wider transition-all duration-150 border cursor-pointer inline-flex items-center justify-center gap-1.5 select-none outline-none bg-[#202328] hover:bg-[#262A30] active:bg-[#1A1C20] text-[#D8DCE3] hover:text-white border-[#33373E] hover:border-[#00D9FF] focus-visible:border-[#00D9FF] focus-visible:ring-1 focus-visible:ring-[#00D9FF]/30 active:scale-[0.98]"
                  >
                    <Upload size={13} className="text-[#8B919C] group-hover:text-white" />
                    <span>{hasSign ? "Update Sign" : "Upload Sign"}</span>
                  </button>

                  {hasSign && (
                    <button
                      type="button"
                      onClick={() => handleClear("tsp_sign", setHasSign)}
                      className="h-[40px] px-3 rounded-lg text-[12px] font-semibold uppercase tracking-wider transition-all duration-150 border cursor-pointer inline-flex items-center justify-center select-none outline-none bg-[#202328] hover:bg-[#262A30] active:bg-[#1A1C20] text-[#8E949E] hover:text-[#EF4444] border-[#33373E] hover:border-[#EF4444]/40 focus-visible:ring-1 focus-visible:ring-[#EF4444]/30 active:scale-[0.98]"
                      title="Remove uploaded signature"
                    >
                      Clear
                    </button>
                  )}
                </div>

                <input
                  ref={signRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={e => e.target.files?.[0] && handleUpload(e.target.files[0], "tsp_sign", setHasSign)}
                />
              </div>
            </div>

            {/* Footnote */}
            <p className="text-[12px] text-[#8B919C] mt-4 leading-relaxed">
              * Uploading assets here automatically configures the brand design across all legal templates and contracts.
            </p>
          </div>
        </div>
      </div>

      {/* Generate modal */}
      {generating && (
        <GenerateContractModal
          contract={generating}
          preselectedCandidateId={preselectedCandidateId}
          onClose={() => { setGenerating(null); setPreselectedCandidateId(""); }}
          onEdit={(c) => { setGenerating(null); setPreselectedCandidateId(""); setEditing(c); }}
        />
      )}
    </div>
  );
}
