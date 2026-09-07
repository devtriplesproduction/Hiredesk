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
    if (candidateId && contracts.length > 0) {
      setPreselectedCandidateId(candidateId);
      setGenerating(contracts[0]);
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

        <div className="flex flex-col gap-4">
          <div className="p-5 rounded-2xl flex flex-col" style={{ background: "var(--glass)", border: "1px solid var(--border)" }}>
            <div className="flex items-start gap-3">
              <span className="text-xl flex-shrink-0">⚖️</span>
              <div>
                <div className="text-sm font-semibold mb-1.5">Legal Disclaimer</div>
                <div className="text-xs text-[var(--text-3)] leading-relaxed">
                  These templates are tailored for an Indian agency under standard Indian employment and commercial law.
                  All fields in <strong className="text-[var(--text-2)]">[BRACKETS]</strong> must be filled before use.
                  We recommend having these reviewed by a qualified legal professional before signing.
                </div>
              </div>
            </div>
          </div>

          <div className="p-5 rounded-2xl flex flex-col" style={{ background: "var(--glass)", border: "1px solid var(--border)" }}>
            <div className="text-xs font-semibold text-[var(--text-3)] uppercase tracking-widest mb-3">Global Brand Assets</div>
            <div className="flex flex-col gap-4">
              <div className="p-3 rounded-xl border border-[var(--border)] flex flex-col items-center justify-center text-center">
                {hasLogo 
                  ? <div className="text-xs text-[var(--green)]">✅ Logo Uploaded</div>
                  : <div className="text-[10px] text-[var(--yellow)]">⚠️ Missing Logo</div>}
                <div className="flex gap-2 w-full mt-2">
                  <Btn variant="outline" size="sm" onClick={() => logoRef.current?.click()} className="flex-1">
                    {hasLogo ? "Update Logo" : "Upload Logo"}
                  </Btn>
                  {hasLogo && (
                    <Btn variant="ghost" size="sm" onClick={() => handleClear("tsp_logo", setHasLogo)}>Clear</Btn>
                  )}
                </div>
                <input ref={logoRef} type="file" accept="image/*" className="hidden"
                  onChange={e => e.target.files?.[0] && handleUpload(e.target.files[0], "tsp_logo", setHasLogo)} />
              </div>

              <div className="p-3 rounded-xl border border-[var(--border)] flex flex-col items-center justify-center text-center">
                {hasSign 
                  ? <div className="text-xs text-[var(--green)]">✅ Sign Uploaded</div>
                  : <div className="text-[10px] text-[var(--yellow)]">⚠️ Missing Signature</div>}
                <div className="flex gap-2 w-full mt-2">
                  <Btn variant="outline" size="sm" onClick={() => signRef.current?.click()} className="flex-1">
                    {hasSign ? "Update Sign" : "Upload Sign"}
                  </Btn>
                  {hasSign && (
                    <Btn variant="ghost" size="sm" onClick={() => handleClear("tsp_sign", setHasSign)}>Clear</Btn>
                  )}
                </div>
                <input ref={signRef} type="file" accept="image/*" className="hidden"
                  onChange={e => e.target.files?.[0] && handleUpload(e.target.files[0], "tsp_sign", setHasSign)} />
              </div>
            </div>
            <div className="text-[10px] text-[var(--text-3)] mt-3.5 leading-relaxed">
              * Uploading assets here automatically configures the brand design across all legal templates and contracts.
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
