"use client";
import { useState, useRef, useCallback, useEffect } from "react";
import { useStore } from "@/lib/store";
import { uploadBrandAsset, getBrandAssetUrl, deleteBrandAsset } from "@/lib/supabase";
import type { Contract } from "@/types";
import { compressImage } from "@/lib/utils/image";
import { Btn } from "@/components/ui";

interface Props { contract: Contract; onBack: () => void; }

export default function ContractEditor({ contract, onBack }: Props) {
  const { updateContract } = useStore();
  const [body, setBody] = useState(contract.body);
  // Initialize as empty — populated after mount to avoid SSR crash (localStorage is client-only)
  const [logoUrl, setLogoUrl] = useState<string>("");
  const [signUrl, setSignUrl] = useState<string>("");

  // Load saved logo/sign from Supabase/localStorage on mount (and whenever contract changes)
  useEffect(() => {
    async function loadAssets() {
      const logo = await getBrandAssetUrl("tsp_logo");
      const sign = await getBrandAssetUrl("tsp_sign");
      setLogoUrl(logo);
      setSignUrl(sign);
    }
    loadAssets();
  }, [contract.id]);
  const logoRef = useRef<HTMLInputElement>(null);
  const signRef = useRef<HTMLInputElement>(null);
  const editorRef = useRef<HTMLDivElement>(null);

  async function uploadImage(file: File, key: "tsp_logo" | "tsp_sign", setter: (s: string) => void) {
    try {
      const compressed = await compressImage(file, 400, 150);
      const url = await uploadBrandAsset(compressed, key);
      setter(url);
    } catch (err) {
      console.error("Image compression or upload failed, falling back to raw data URL", err);
      const reader = new FileReader();
      reader.onload = async e => {
        const url = e.target?.result as string;
        try {
          const publicUrl = await uploadBrandAsset(url, key);
          setter(publicUrl);
        } catch (uploadErr) {
          console.error("Raw upload failed:", uploadErr);
        }
      };
      reader.readAsDataURL(file);
    }
  }

  async function clearImage(key: "tsp_logo" | "tsp_sign", setter: (s: string) => void) {
    await deleteBrandAsset(key);
    setter("");
  }

  // ─── Debounced sync: persist only after 400ms of no typing ──────────────────
  const syncTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const syncBody = useCallback(() => {
    if (!editorRef.current) return;
    const html = editorRef.current.innerHTML;
    setBody(html);
    if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
    syncTimerRef.current = setTimeout(() => {
      updateContract(contract.id, html);
    }, 400);
  }, [contract.id, updateContract]);

  const fmt = useCallback((cmd: string) => {
    document.execCommand(cmd, false, undefined);
    syncBody();
  }, [syncBody]);

  const insertField = useCallback((text: string) => {
    if (editorRef.current) {
      editorRef.current.focus();
      document.execCommand("insertText", false, text);
      syncBody();
    }
  }, [syncBody]);

  function handlePrint() {
    const logo = logoUrl
      ? `<img src="${logoUrl}" style="height:56px;object-fit:contain;" alt="Logo"/>`
      : `<div style="font-family:Arial,sans-serif;font-size:22pt;font-weight:800;letter-spacing:-0.5px;color:#111;line-height:1">Triple S Production</div><div style="font-family:Arial,sans-serif;font-size:8pt;color:#666;text-transform:uppercase;letter-spacing:2px;margin-top:4px">Production · Marketing · Digital</div>`;
    const sign = signUrl ? `<img src="${signUrl}" style="height:96px;object-fit:contain;" alt="Signature"/>` : "";
    const content = editorRef.current?.innerHTML ?? body;

    const finalContent = content
      .replace("<!--LOGO-->", logo)
      .replace("<!--SIGN-->", sign);

    const win = window.open("", "_blank", "width=900,height=700");
    if (!win) return;
    win.document.write(`<!DOCTYPE html><html><head>
      <meta charset="UTF-8"/>
      <title>${contract.name} — Triple S Production</title>
      <style>
        * { box-sizing: border-box; }
        body { font-family: Arial, Helvetica, sans-serif; max-width: 210mm; margin: 0 auto; padding: 20mm 25mm; color: #111; font-size: 11pt; line-height: 1.85; }
        h1,h2,h3 { font-family: Arial, Helvetica, sans-serif; }
        h2 { font-size: 14pt; border-bottom: 2px solid #111; padding-bottom: 6px; margin: 18px 0 12px; }
        h3 { font-size: 11pt; margin: 14px 0 6px; }
        p { margin-bottom: 10px; text-align: justify; }
        .letterhead { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #111; padding-bottom: 16px; margin-bottom: 24px; }
        .sig-block { display: grid; grid-template-columns: 1fr 1fr; gap: 60px; margin-top: 48px; }
        .sig-line { border-top: 1px solid #333; padding-top: 6px; font-size: 10pt; }
        @media print {
          @page { size: A4; margin: 0mm; }
          body { margin: 0; padding: 20mm 25mm; }
          .no-print { display: none !important; }
        }
      </style>
    </head><body>${finalContent}
    <script>window.onload=()=>{setTimeout(()=>{window.print();},300);}<\/script>
    </body></html>`);
    win.document.close();
  }

  const FIELDS = [
    "[CANDIDATE NAME]", "[ROLE]", "[START DATE]", "[END DATE]",
    "[AMOUNT ₹]", "[REF NO]", "[X months]", "[NOTICE PERIOD]",
  ];

  return (
    <div className="flex flex-col gap-5">
      {/* Back + title */}
      <div className="flex items-center justify-between gap-3">
        <Btn onClick={onBack} className="flex items-center gap-2 text-sm text-[var(--text-3)] hover:text-white transition-colors font-medium flex-shrink-0">
          ← Back
        </Btn>
        <div className="text-sm sm:text-base font-bold tracking-tight leading-tight truncate">{contract.name}</div>
      </div>

      <div className="flex flex-col lg:flex-row gap-5">
        {/* Controls — horizontally scrollable strip on mobile, vertical sidebar on desktop */}
        <div className="w-full lg:w-64 flex-shrink-0">
          <div className="flex lg:flex-col gap-3 overflow-x-auto lg:overflow-x-visible pb-2 lg:pb-0">

            {/* Logo upload */}
            <div className="min-w-[160px] lg:min-w-0 flex-shrink-0 lg:flex-auto">
              <div className="text-xs font-semibold text-[var(--text-3)] uppercase tracking-widest mb-2">Company Logo</div>
              {logoUrl
                ? <div className="relative rounded-xl overflow-hidden" style={{ border: "1px solid var(--border-2)" }}>
                    <img src={logoUrl} alt="Logo" className="w-full h-14 object-contain p-2 bg-white" />
                    <Btn onClick={() => clearImage("tsp_logo", setLogoUrl)}
                      className="absolute top-1 right-1 w-5 h-5 rounded bg-black/70 text-white text-xs flex items-center justify-center">✕</Btn>
                  </div>
                : <Btn onClick={() => logoRef.current?.click()}
                    className="w-full py-2.5 rounded-xl text-sm text-[var(--text-3)] hover:text-[var(--text-2)] transition-colors text-center border-2 border-dashed"
                    style={{ borderColor: "var(--border-2)" }}>
                    + Logo
                  </Btn>
              }
              <input ref={logoRef} type="file" accept="image/*" className="hidden"
                onChange={e => e.target.files?.[0] && uploadImage(e.target.files[0], "tsp_logo", setLogoUrl)} />
            </div>

            {/* Signature upload */}
            <div className="min-w-[160px] lg:min-w-0 flex-shrink-0 lg:flex-auto">
              <div className="text-xs font-semibold text-[var(--text-3)] uppercase tracking-widest mb-2">Signature</div>
              {signUrl
                ? <div className="relative rounded-xl overflow-hidden" style={{ border: "1px solid var(--border-2)" }}>
                    <img src={signUrl} alt="Sign" className="w-full h-12 object-contain p-2 bg-white" />
                    <Btn onClick={() => clearImage("tsp_sign", setSignUrl)}
                      className="absolute top-1 right-1 w-5 h-5 rounded bg-black/70 text-white text-xs flex items-center justify-center">✕</Btn>
                  </div>
                : <Btn onClick={() => signRef.current?.click()}
                    className="w-full py-2.5 rounded-xl text-sm text-[var(--text-3)] hover:text-[var(--text-2)] transition-colors text-center border-2 border-dashed"
                    style={{ borderColor: "var(--border-2)" }}>
                    + Signature
                  </Btn>
              }
              <input ref={signRef} type="file" accept="image/*" className="hidden"
                onChange={e => e.target.files?.[0] && uploadImage(e.target.files[0], "tsp_sign", setSignUrl)} />
            </div>

            {/* Format toolbar */}
            <div className="min-w-[140px] lg:min-w-0 flex-shrink-0 lg:flex-auto">
              <div className="text-xs font-semibold text-[var(--text-3)] uppercase tracking-widest mb-2">Format</div>
              <div className="flex gap-2">
                {[["B","bold"],["I","italic"],["U","underline"]].map(([l,c]) => (
                  <Btn key={c} onClick={() => fmt(c)}
                    className="w-9 h-9 rounded-lg text-sm font-bold text-[var(--text-2)] hover:text-white transition-colors"
                    style={{ background: "var(--glass-2)", border: "1px solid var(--border)" }}>{l}</Btn>
                ))}
              </div>
            </div>

            {/* Insert fields */}
            <div className="min-w-[200px] lg:min-w-0 flex-shrink-0 lg:flex-auto">
              <div className="text-xs font-semibold text-[var(--text-3)] uppercase tracking-widest mb-2">Insert Field</div>
              <div className="flex lg:flex-col gap-1 flex-wrap">
                {FIELDS.map(f => (
                  <Btn key={f} onClick={() => insertField(f)}
                    className="text-left text-xs px-2.5 py-1.5 rounded-lg text-[var(--text-3)] hover:text-[var(--text-2)] hover:bg-[var(--glass-2)] transition-colors font-mono border border-transparent hover:border-[var(--border)]">
                    {f}
                  </Btn>
                ))}
              </div>
            </div>

            {/* Action buttons */}
            <div className="min-w-[160px] lg:min-w-0 flex-shrink-0 lg:flex-auto flex lg:flex-col gap-2">
              <Btn onClick={handlePrint}
                className="flex-1 lg:flex-none py-2.5 rounded-xl text-sm font-semibold bg-white text-black hover:bg-white/90 transition-all whitespace-nowrap px-3">
                🖨 Print / PDF
              </Btn>
              <Btn onClick={syncBody}
                className="flex-1 lg:flex-none py-2 rounded-xl text-sm font-medium text-[var(--text-2)] hover:text-white transition-colors px-3"
                style={{ background: "var(--glass-2)", border: "1px solid var(--border)" }}>
                💾 Save
              </Btn>
            </div>
          </div>
        </div>

        {/* Paper editor — scrollable on mobile */}
        <div className="flex-1 min-w-0">
          <div className="text-xs text-[var(--text-3)] font-medium mb-3 uppercase tracking-widest">Paper Preview — Click to Edit</div>

          {/* A4 paper */}
          <div className="rounded-2xl overflow-hidden shadow-2xl" style={{ border: "1px solid rgba(255,255,255,0.1)" }}>
            {/* Paper chrome bar */}
            <div className="px-4 py-2 flex items-center gap-2" style={{ background: "#1a1a1a", borderBottom: "1px solid var(--border)" }}>
              <div className="w-3 h-3 rounded-full bg-red-500/60" />
              <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
              <div className="w-3 h-3 rounded-full bg-green-500/60" />
              <span className="ml-2 text-xs text-[var(--text-3)]">A4 · {contract.name}</span>
            </div>

            {/* White paper */}
            <div
              ref={editorRef}
              contentEditable
              suppressContentEditableWarning
              className="outline-none px-4 py-5 sm:px-10 sm:py-12 md:px-16 md:py-20"
              style={{
                background: "#fff",
                color: "#111",
                fontFamily: "Arial, Helvetica, sans-serif",
                fontSize: "11pt",
                lineHeight: "1.85",
                minHeight: "297mm",
              }}
              dangerouslySetInnerHTML={{ __html: body }}
              onInput={syncBody}
            />
          </div>

          {/* Logo/sign status */}
          {(logoUrl || signUrl) && (
            <div className="mt-3 text-xs text-[var(--text-3)] font-medium px-1">
              {logoUrl && "✅ Logo will appear on printed document · "}
              {signUrl && "✅ Signature will appear on printed document"}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
