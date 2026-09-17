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
import { AlertTriangle, CheckCircle2, Upload, FileEdit, Sparkles, Building2, PenLine, Trash2 } from "lucide-react";

const CONTRACT_META: Record<string, { color: string; roles: string[] }> = {
  "emp-ft":    { color: "#4ade80", roles: ["All Full-time roles"] },
  "intern":    { color: "#facc15", roles: ["Dev Intern", "Any Intern"] },
  "freelance": { color: "#60a5fa", roles: ["Model", "Cameraman", "Freelance"] },
  "nda":       { color: "#c084fc", roles: ["All roles — recommended"] },
  "ip":        { color: "#fb923c", roles: ["Dev", "Designer", "Content", "Marketing"] },
  "model":     { color: "#f472b6", roles: ["Model (Male)", "Model (Female)"] },
};

export default function ContractsList() {
  const { contracts, globalBrandAssets, setGlobalBrandAsset, deleteGlobalBrandAsset } = useStore();
  const [editing, setEditing] = useState<Contract | null>(null);
  const [generating, setGenerating] = useState<Contract | null>(null);
  const [preselectedCandidateId, setPreselectedCandidateId] = useState<string>("");

  const hasLogo = !!globalBrandAssets?.logoUrl;
  const hasSign = !!globalBrandAssets?.signUrl;

  const logoRef = useRef<HTMLInputElement>(null);
  const signRef = useRef<HTMLInputElement>(null);

  async function handleUpload(file: File, key: "tsp_logo" | "tsp_sign") {
    try {
      const { compressImage } = await import("@/lib/utils/image");
      const compressed = await compressImage(file, 400, 150);
      const url = await uploadBrandAsset(compressed, key);
      if (key === "tsp_logo") setGlobalBrandAsset("logo", url);
      else setGlobalBrandAsset("sign", url);
    } catch (err) {
      console.error("Compression or upload failed, falling back to raw data URL", err);
      const reader = new FileReader();
      reader.onload = async e => {
        const url = e.target?.result as string;
        try {
          const publicUrl = await uploadBrandAsset(url, key);
          if (key === "tsp_logo") setGlobalBrandAsset("logo", publicUrl);
          else setGlobalBrandAsset("sign", publicUrl);
        } catch (uploadErr) {
          console.error("Raw upload failed:", uploadErr);
        }
      };
      reader.readAsDataURL(file);
    }
  }

  async function handleClear(key: "tsp_logo" | "tsp_sign") {
    await deleteBrandAsset(key);
    if (key === "tsp_logo") deleteGlobalBrandAsset("logo");
    else deleteGlobalBrandAsset("sign");
  }

  const searchParams = useSearchParams();
  const router = useRouter();

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
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-7 items-start">
        {/* Left Column: Contracts List */}
        <div className="lg:col-span-8 flex flex-col gap-3.5">
          <div className="flex items-center justify-between px-1 mb-0.5">
            <span className="text-xs font-bold uppercase tracking-wider text-[#8B919C]">Legal Templates</span>
            <span className="text-[11px] text-[#636A75] font-mono">Select a template to generate or edit</span>
          </div>

          {contracts.map(c => {
            const meta = CONTRACT_META[c.id] ?? { color: "#a0a0a0", roles: [] };
            return (
              <div
                key={c.id}
                className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4.5 sm:p-5 rounded-2xl transition-all duration-200 bg-[#131417] hover:bg-[#181a1f] border border-[#262930] hover:border-[#383d47] hover:shadow-lg hover:shadow-black/25 group"
              >
                <div className="flex items-start sm:items-center gap-4 flex-1 min-w-0">
                  {/* Icon Box */}
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center text-xl flex-shrink-0 bg-[#1a1c22] border border-[#2d313b] group-hover:border-[#3f4554] group-hover:bg-[#1f222a] transition-all shadow-sm">
                    {c.icon}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <h3 className="text-[15px] sm:text-[15.5px] font-bold tracking-tight text-[#E8ECF2] group-hover:text-white transition-colors">
                        {c.name}
                      </h3>
                      <span
                        className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded uppercase tracking-wider"
                        style={{
                          background: meta.color + "14",
                          color: meta.color,
                          border: `1px solid ${meta.color}28`,
                        }}
                      >
                        {c.id.toUpperCase()}
                      </span>
                    </div>

                    <p className="text-[12.5px] text-[#9AA0AC] mt-1 leading-snug font-normal line-clamp-2 sm:line-clamp-1">
                      {c.desc}
                    </p>

                    {/* Role Badges */}
                    <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
                      <span className="text-[10.5px] text-[#686F7C] font-medium mr-0.5">Applies to:</span>
                      {meta.roles.map(r => (
                        <span
                          key={r}
                          className="text-[10.5px] font-medium px-2 py-0.5 rounded-md transition-colors"
                          style={{
                            background: meta.color + "12",
                            color: meta.color,
                            border: `1px solid ${meta.color}26`,
                          }}
                        >
                          {r}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2.5 w-full sm:w-auto flex-shrink-0 mt-3 sm:mt-0 pt-3 sm:pt-0 border-t border-white/[0.06] sm:border-t-0 justify-end">
                  <button
                    type="button"
                    onClick={() => { setPreselectedCandidateId(""); setGenerating(c); }}
                    className="group/gen relative h-[38px] px-4 rounded-xl text-[12.5px] font-bold uppercase tracking-wider transition-all duration-200 flex-1 sm:flex-none inline-flex items-center justify-center gap-2 bg-gradient-to-b from-[#FFFFFF] to-[#E9ECEF] text-[#0A0C10] shadow-[0_2px_12px_rgba(255,255,255,0.12),inset_0_1px_0_rgba(255,255,255,0.9)] hover:shadow-[0_4px_18px_rgba(0,217,255,0.28),inset_0_1px_0_rgba(255,255,255,1)] hover:from-white hover:to-white active:scale-[0.97] select-none cursor-pointer border border-white/60 hover:border-[#00D9FF]/80 outline-none focus-visible:ring-2 focus-visible:ring-[#00D9FF]/40"
                  >
                    <Sparkles size={13.5} className="text-[#0A0C10] group-hover/gen:text-[#00B4D8] transition-colors duration-200 group-hover/gen:rotate-12" />
                    <span className="leading-none">Generate</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setEditing(c)}
                    className="group/edit relative h-[38px] px-3.5 rounded-xl text-[12px] font-semibold uppercase tracking-wider transition-all duration-200 flex-1 sm:flex-none inline-flex items-center justify-center gap-2 bg-[#16181D]/90 hover:bg-[#1D2128] active:bg-[#121417] text-[#C4C9D4] hover:text-white border border-[#2B303A] hover:border-[#00D9FF]/40 hover:shadow-[0_2px_12px_rgba(0,0,0,0.4),0_0_12px_rgba(0,217,255,0.06)] active:scale-[0.97] select-none cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-[#00D9FF]/30"
                  >
                    <FileEdit size={13.5} className="text-[#848B98] group-hover/edit:text-[#00D9FF] transition-colors duration-200" />
                    <span className="leading-none">Edit Template</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right-Side Panel: Legal Disclaimer & Global Brand Assets */}
        <div className="lg:col-span-4 flex flex-col gap-6 lg:gap-7">
          {/* Section 1: Legal & Brand Settings (Legal Disclaimer) */}
          <div className="flex flex-col gap-3.5">
            <div className="flex items-center justify-between px-1 mb-0.5">
              <span className="text-xs font-bold uppercase tracking-wider text-[#8B919C]">Legal &amp; Brand Settings</span>
              <span className="text-[11px] text-[#636A75] font-mono">Global Configuration</span>
            </div>

            {/* 1. Legal Disclaimer Card */}
            <div className="p-5 sm:p-5.5 rounded-2xl bg-[#131417] border border-[#262930] flex flex-col shadow-sm">
              <div className="flex items-center gap-2.5 mb-3">
                <div className="w-8 h-8 rounded-lg bg-[#F5C542]/10 border border-[#F5C542]/25 flex items-center justify-center text-sm flex-shrink-0">
                  ⚖️
                </div>
                <div>
                  <h2 className="text-[14.5px] font-bold text-[#EDEDED] tracking-tight">Legal Disclaimer</h2>
                  <p className="text-[11px] text-[#717886] font-mono uppercase tracking-wider">Indian Jurisdiction</p>
                </div>
              </div>

              <p className="text-[12.5px] text-[#9DA3AE] leading-[1.65]">
                These templates are drafted under standard Indian employment &amp; commercial law.
                All bracketed fields such as{" "}
                <code className="text-[#F5C542] bg-[#F5C542]/10 px-1.5 py-0.5 rounded text-[11px] font-mono font-semibold border border-[#F5C542]/20">
                  [BRACKETS]
                </code>{" "}
                must be filled and customized before issuing to candidates.
              </p>

              <div className="mt-4 pt-3.5 border-t border-white/[0.06] flex items-center gap-2 text-[11.5px] text-[#808794]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E] flex-shrink-0" />
                <span>Recommended: Review with legal counsel prior to formal execution</span>
              </div>
            </div>
          </div>

          {/* 2. Global Brand Assets Card */}
          <div className="p-5 sm:p-5.5 rounded-2xl bg-[#131417] border border-[#262930] flex flex-col shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="text-[11.5px] font-bold text-[#8E95A2] uppercase tracking-[0.1em]">
                Global Brand Assets
              </div>
              <span className="text-[10.5px] font-mono text-[#636A75] bg-white/[0.04] px-2 py-0.5 rounded-md border border-white/[0.06]">
                Auto-Applied
              </span>
            </div>

            <div className="flex flex-col gap-3.5">
              {/* Asset 1: Company Logo */}
              <div className="p-4 rounded-xl bg-[#181a1f] border border-[#282c33] flex flex-col gap-3 transition-colors hover:border-[#353943]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-md bg-[#22252c] border border-[#333742] flex items-center justify-center text-xs text-[#9DA3AE]">
                      <Building2 size={13} />
                    </div>
                    <span className="text-[13px] font-semibold text-[#D8DCE3]">Company Logo</span>
                  </div>
                  {hasLogo ? (
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[rgba(34,197,94,0.1)] border border-[rgba(34,197,94,0.3)] text-[#22C55E] select-none">
                      <CheckCircle2 size={11} className="text-[#22C55E]" />
                      <span>Configured</span>
                    </div>
                  ) : (
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[rgba(245,197,66,0.1)] border border-[rgba(245,197,66,0.3)] text-[#F5C542] select-none">
                      <AlertTriangle size={11} className="text-[#F5C542]" />
                      <span>Missing</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 w-full pt-0.5">
                  <button
                    type="button"
                    onClick={() => logoRef.current?.click()}
                    className="flex-1 h-[38px] px-3 rounded-lg text-[12.5px] font-semibold uppercase tracking-wider transition-all duration-150 border cursor-pointer inline-flex items-center justify-center gap-1.5 select-none outline-none bg-[#22252b] hover:bg-[#2a2e36] active:bg-[#1a1c20] text-[#D8DCE3] hover:text-white border-[#343842] hover:border-[#00D9FF]/50 focus-visible:border-[#00D9FF] focus-visible:ring-1 focus-visible:ring-[#00D9FF]/30 active:scale-[0.98]"
                  >
                    <Upload size={13} className="text-[#8B919C]" />
                    <span>{hasLogo ? "Update Logo" : "Upload Logo"}</span>
                  </button>

                  {hasLogo && (
                    <button
                      type="button"
                      onClick={() => handleClear("tsp_logo")}
                      className="h-[38px] px-3 rounded-lg text-[12px] font-semibold uppercase tracking-wider transition-all duration-150 border cursor-pointer inline-flex items-center justify-center gap-1 select-none outline-none bg-[#22252b] hover:bg-red-500/10 active:bg-[#1a1c20] text-[#8E949E] hover:text-[#EF4444] border-[#343842] hover:border-[#EF4444]/40 focus-visible:ring-1 focus-visible:ring-[#EF4444]/30 active:scale-[0.98]"
                      title="Remove uploaded logo"
                    >
                      <Trash2 size={12} />
                      <span>Clear</span>
                    </button>
                  )}
                </div>

                <input
                  ref={logoRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={e => e.target.files?.[0] && handleUpload(e.target.files[0], "tsp_logo")}
                />
              </div>

              {/* Asset 2: Company Signature */}
              <div className="p-4 rounded-xl bg-[#181a1f] border border-[#282c33] flex flex-col gap-3 transition-colors hover:border-[#353943]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-md bg-[#22252c] border border-[#333742] flex items-center justify-center text-xs text-[#9DA3AE]">
                      <PenLine size={13} />
                    </div>
                    <span className="text-[13px] font-semibold text-[#D8DCE3]">Authorized Signature</span>
                  </div>
                  {hasSign ? (
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[rgba(34,197,94,0.1)] border border-[rgba(34,197,94,0.3)] text-[#22C55E] select-none">
                      <CheckCircle2 size={11} className="text-[#22C55E]" />
                      <span>Configured</span>
                    </div>
                  ) : (
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[rgba(245,197,66,0.1)] border border-[rgba(245,197,66,0.3)] text-[#F5C542] select-none">
                      <AlertTriangle size={11} className="text-[#F5C542]" />
                      <span>Missing</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 w-full pt-0.5">
                  <button
                    type="button"
                    onClick={() => signRef.current?.click()}
                    className="flex-1 h-[38px] px-3 rounded-lg text-[12.5px] font-semibold uppercase tracking-wider transition-all duration-150 border cursor-pointer inline-flex items-center justify-center gap-1.5 select-none outline-none bg-[#22252b] hover:bg-[#2a2e36] active:bg-[#1a1c20] text-[#D8DCE3] hover:text-white border-[#343842] hover:border-[#00D9FF]/50 focus-visible:border-[#00D9FF] focus-visible:ring-1 focus-visible:ring-[#00D9FF]/30 active:scale-[0.98]"
                  >
                    <Upload size={13} className="text-[#8B919C]" />
                    <span>{hasSign ? "Update Sign" : "Upload Sign"}</span>
                  </button>

                  {hasSign && (
                    <button
                      type="button"
                      onClick={() => handleClear("tsp_sign")}
                      className="h-[38px] px-3 rounded-lg text-[12px] font-semibold uppercase tracking-wider transition-all duration-150 border cursor-pointer inline-flex items-center justify-center gap-1 select-none outline-none bg-[#22252b] hover:bg-red-500/10 active:bg-[#1a1c20] text-[#8E949E] hover:text-[#EF4444] border-[#343842] hover:border-[#EF4444]/40 focus-visible:ring-1 focus-visible:ring-[#EF4444]/30 active:scale-[0.98]"
                      title="Remove uploaded signature"
                    >
                      <Trash2 size={12} />
                      <span>Clear</span>
                    </button>
                  )}
                </div>

                <input
                  ref={signRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={e => e.target.files?.[0] && handleUpload(e.target.files[0], "tsp_sign")}
                />
              </div>
            </div>

            {/* Footnote */}
            <div className="mt-4 pt-3.5 border-t border-white/[0.06] flex items-start gap-2 text-[11.5px] text-[#828996] leading-relaxed">
              <span className="text-[#00D9FF] select-none text-xs leading-none mt-0.5">✦</span>
              <span>Brand assets automatically sync to headers, watermarks, and signature footers across all generated contracts.</span>
            </div>
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
