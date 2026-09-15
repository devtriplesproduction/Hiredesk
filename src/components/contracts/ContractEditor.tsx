"use client";
import { useState, useRef, useCallback, useEffect } from "react";
import { useStore } from "@/lib/store";
import { uploadBrandAsset, getBrandAssetUrl, deleteBrandAsset } from "@/lib/supabase";
import type { Contract } from "@/types";
import { compressImage } from "@/lib/utils/image";
import { Btn } from "@/components/ui";
import { DOCUMENT_STUDIO_CSS } from "@/lib/document-utils";

interface Props {
  contract: Contract;
  onBack: () => void;
}

/**
 * Normalizes template content into A4 page containers.
 * Preserves all content, clauses, placeholders, tables, and signatures.
 */
function ensureA4Pages(content: string, contractId?: string): string {
  if (!content) return "";

  // If already structured with .page elements, preserve as is
  if (content.includes('class="page') || content.includes("class='page'")) {
    return content;
  }

  // Full-Time Employment Agreement naturally spans 2 A4 pages.
  // Split at Clause 7 so Page 1 contains clauses 1-6 and Page 2 contains clauses 7-10 + signatures.
  if (contractId === "emp-ft") {
    const clause7Idx = content.search(/<p[^>]*><strong[^>]*>7\.\s*Intellectual Property/i);
    if (clause7Idx !== -1) {
      const p1 = content.substring(0, clause7Idx).trim();
      const p2 = content.substring(clause7Idx).trim();
      return `<div class="page a4-flow-page" data-page="1"><div class="a4-flow-content">${p1}</div></div>\n<div class="page a4-flow-page" data-page="2"><div class="a4-flow-content">${p2}</div></div>`;
    }
  }

  // Support explicit page break comment if present
  if (content.includes("<!--PAGEBREAK-->")) {
    const parts = content.split("<!--PAGEBREAK-->");
    return parts
      .map((p, i) => `<div class="page a4-flow-page" data-page="${i + 1}"><div class="a4-flow-content">${p.trim()}</div></div>`)
      .join("\n");
  }

  // Standard single A4 page
  return `<div class="page a4-flow-page" data-page="1"><div class="a4-flow-content">${content}</div></div>`;
}

export default function ContractEditor({ contract, onBack }: Props) {
  const { updateContract } = useStore();
  const [body, setBody] = useState(() => ensureA4Pages(contract.body, contract.id));
  const [zoom, setZoom] = useState<number>(1);
  const [logoUrl, setLogoUrl] = useState<string>("");
  const [signUrl, setSignUrl] = useState<string>("");

  // Load saved logo/sign on mount
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
  const workspaceRef = useRef<HTMLDivElement>(null);

  // Auto-fit zoom on initial load if screen is narrow
  useEffect(() => {
    if (workspaceRef.current) {
      const availWidth = workspaceRef.current.clientWidth - 48;
      // 210mm at standard 96dpi is ~794px
      if (availWidth < 820) {
        const fit = Math.min(1, Math.max(0.48, availWidth / 830));
        setZoom(Number(fit.toFixed(2)));
      }
    }
  }, []);

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

  // Debounced sync: persist only after 400ms of inactivity
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

  function handleFitZoom() {
    if (workspaceRef.current) {
      const avail = workspaceRef.current.clientWidth - 48;
      const fit = Math.min(1.15, Math.max(0.45, avail / 830));
      setZoom(Number(fit.toFixed(2)));
    }
  }

  function handlePrint() {
    const logo = logoUrl
      ? `<img src="${logoUrl}" style="height:56px;object-fit:contain;" alt="Logo"/>`
      : `<div style="font-family:Arial,sans-serif;font-size:22pt;font-weight:800;letter-spacing:-0.5px;color:#111;line-height:1">Triple S Production</div><div style="font-family:Arial,sans-serif;font-size:8pt;color:#666;text-transform:uppercase;letter-spacing:2px;margin-top:4px">Production · Marketing · Digital</div>`;
    const sign = signUrl ? `<img src="${signUrl}" style="height:96px;object-fit:contain;" alt="Signature"/>` : "";
    const content = editorRef.current?.innerHTML ?? body;

    const finalContent = content
      .replaceAll("<!--LOGO-->", logo)
      .replaceAll("<!--SIGN-->", sign);

    const win = window.open("", "_blank", "width=920,height=720");
    if (!win) return;
    win.document.write(`<!DOCTYPE html><html><head>
      <meta charset="UTF-8"/>
      <title>${contract.name} — Triple S Production</title>
      <style>
        * { box-sizing: border-box; }
        body { margin: 0; padding: 0; background: #fff; color: #111; font-family: Arial, Helvetica, sans-serif; font-size: 11pt; line-height: 1.85; }
        h1,h2,h3 { font-family: Arial, Helvetica, sans-serif; }
        h2 { font-size: 14pt; border-bottom: 2px solid #111; padding-bottom: 6px; margin: 18px 0 12px; }
        h3 { font-size: 11pt; margin: 14px 0 6px; }
        p { margin-bottom: 10px; text-align: justify; }
        .letterhead { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2.5px solid #111; padding-bottom: 16px; margin-bottom: 24px; }
        .sig-block { display: grid; grid-template-columns: 1fr 1fr; gap: 60px; margin-top: 48px; }
        .sig-line { border-top: 1.5px solid #333; padding-top: 8px; font-size: 10pt; }
        .page { width: 210mm; min-height: 297mm; position: relative; margin: 0 auto; box-sizing: border-box; background: #fff; }
        .page.a4-flow-page { padding: 20mm 25mm; height: auto; min-height: 297mm; }
        @media print {
          @page { size: A4; margin: 0mm; }
          body { margin: 0 !important; padding: 0 !important; }
          .page { page-break-after: always; box-shadow: none !important; margin: 0 !important; width: 210mm !important; }
          .page:last-child { page-break-after: auto; }
          .page.a4-flow-page { padding: 20mm 25mm !important; }
          .no-print { display: none !important; }
        }
        ${DOCUMENT_STUDIO_CSS}
      </style>
    </head><body><div class="document-studio-wrapper">${finalContent}</div>
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
      {/* Editor Scoped CSS */}
      <style dangerouslySetInnerHTML={{ __html: `
        ${DOCUMENT_STUDIO_CSS}

        /* ─── A4 Document Model & Editor Canvas ─────────────────── */
        .a4-editor-canvas {
          display: flex;
          flex-direction: column;
          align-items: center;
          width: 100%;
          counter-reset: a4page;
        }

        .a4-editor-canvas .page {
          width: 210mm !important;
          min-height: 297mm !important;
          position: relative !important;
          background: #ffffff !important;
          color: #111111;
          box-shadow: 0 4px 24px rgba(0, 0, 0, 0.45), 0 0 0 1px rgba(255, 255, 255, 0.08) !important;
          border-radius: 2px;
          margin: 0 auto 36px auto !important;
          box-sizing: border-box !important;
          flex-shrink: 0 !important;
          counter-increment: a4page;
        }

        .a4-editor-canvas .page::after {
          content: "PAGE " counter(a4page);
          position: absolute;
          top: -20px;
          right: 4px;
          font-size: 10px;
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.65);
          letter-spacing: 1.5px;
          pointer-events: none;
        }

        .a4-editor-canvas .page.cover {
          background: #111111 !important;
          color: #ffffff !important;
        }

        .a4-editor-canvas .page.cover .wm {
          position: absolute;
          left: 20mm;
          top: 63.5mm;
          width: 170mm;
          height: 170mm;
          opacity: 0.06;
          pointer-events: none;
        }

        .a4-editor-canvas .page.cover .innerc {
          position: relative;
          z-index: 1;
          height: 100%;
          padding: 18mm;
          display: flex;
          flex-direction: column;
          box-sizing: border-box;
        }

        /* ─── Standard Flowing Contract Page ─────────────────────── */
        .a4-editor-canvas .page.a4-flow-page {
          height: auto !important;
          min-height: 297mm !important;
          padding: 20mm 25mm !important;
          font-family: Arial, Helvetica, sans-serif !important;
          font-size: 11pt !important;
          line-height: 1.85 !important;
          overflow: visible !important;
        }

        .a4-editor-canvas .page.a4-flow-page p {
          margin: 0 0 10px 0;
          text-align: justify;
          overflow-wrap: break-word;
        }

        .a4-editor-canvas .page.a4-flow-page h2 {
          font-family: Arial, Helvetica, sans-serif;
          font-size: 14pt;
          font-weight: 800;
          letter-spacing: 0.5px;
          text-transform: uppercase;
          text-align: center;
          margin: 0 0 24px 0;
          padding-bottom: 10px;
          border-bottom: 1px solid #e0e0e0;
        }

        .a4-editor-canvas .page.a4-flow-page .letterhead {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          border-bottom: 2.5px solid #111;
          padding-bottom: 16px;
          margin-bottom: 24px;
          box-sizing: border-box;
        }

        .a4-editor-canvas .page.a4-flow-page .sig-block {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 60px;
          margin-top: 48px;
          padding-top: 24px;
          border-top: 1px solid #ddd;
          box-sizing: border-box;
          width: 100%;
        }

        .a4-editor-canvas .page.a4-flow-page .sig-line {
          border-top: 1.5px solid #333;
          padding-top: 8px;
          font-size: 10pt;
        }

        /* ─── Robust Table, Column & Grid Wrapping ──────────────── */
        .a4-editor-canvas * {
          box-sizing: border-box !important;
        }

        .a4-editor-canvas table {
          width: 100% !important;
          max-width: 100% !important;
          table-layout: fixed !important;
          border-collapse: collapse !important;
          box-sizing: border-box !important;
        }

        .a4-editor-canvas th,
        .a4-editor-canvas td {
          box-sizing: border-box !important;
          word-break: break-word !important;
          overflow-wrap: break-word !important;
        }

        .a4-editor-canvas .strip {
          display: flex !important;
          box-sizing: border-box !important;
          width: 100% !important;
        }

        .a4-editor-canvas .strip .cell {
          flex: 1 1 0% !important;
          min-width: 0 !important;
          box-sizing: border-box !important;
          overflow-wrap: break-word !important;
        }

        .a4-editor-canvas .infocard2 .row2 {
          width: 50% !important;
          box-sizing: border-box !important;
          min-width: 0 !important;
          word-break: break-word !important;
          overflow-wrap: break-word !important;
        }

        .a4-editor-canvas .lgrid {
          display: grid !important;
          grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
          gap: 10px !important;
          box-sizing: border-box !important;
          width: 100% !important;
        }

        .a4-editor-canvas .lcard {
          min-width: 0 !important;
          box-sizing: border-box !important;
          overflow-wrap: break-word !important;
        }

        .a4-editor-canvas .payflow {
          display: flex !important;
          box-sizing: border-box !important;
          width: 100% !important;
        }

        .a4-editor-canvas .payflow .panel {
          flex: 1 1 0% !important;
          min-width: 0 !important;
          box-sizing: border-box !important;
          overflow-wrap: break-word !important;
        }
      `}} />

      {/* Back + title */}
      <div className="flex items-center justify-between gap-4 pb-1">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all duration-150 border cursor-pointer select-none outline-none flex-shrink-0 bg-[#151719] hover:bg-[#202328] active:bg-[#181B1F] text-[#E8EAED] hover:text-white active:text-white border-[#2E333B] hover:border-[#00D9FF] focus-visible:border-[#00D9FF] focus-visible:ring-1 focus-visible:ring-[#00D9FF]/30 active:scale-[0.98]"
        >
          <span className="text-sm leading-none">←</span>
          <span>BACK</span>
        </button>
        <div className="text-base sm:text-lg font-bold tracking-tight leading-tight truncate text-[#FFFFFF]">
          {contract.name}
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 items-start w-full">
        {/* Controls Sidebar - Solid Dark Panel */}
        <div className="w-full lg:w-72 flex-shrink-0">
          <div className="rounded-2xl border border-[#24282E] bg-[#111316] p-4 sm:p-5 flex flex-col gap-5 shadow-2xl">

            {/* Company Logo Upload */}
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-[#8A909B] mb-2.5 flex items-center justify-between">
                <span>Company Logo</span>
                {logoUrl && <span className="text-[10px] text-emerald-400 font-semibold tracking-normal">Loaded</span>}
              </div>
              {logoUrl ? (
                <div className="relative rounded-xl overflow-hidden border border-[#2A2F37] bg-white p-2.5 shadow-sm">
                  <img src={logoUrl} alt="Logo" className="w-full h-14 object-contain" />
                  <button
                    type="button"
                    onClick={() => clearImage("tsp_logo", setLogoUrl)}
                    className="absolute top-1.5 right-1.5 w-6 h-6 rounded-lg bg-black/80 hover:bg-black text-white text-xs flex items-center justify-center transition-colors cursor-pointer"
                    title="Remove Logo"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => logoRef.current?.click()}
                  className="w-full py-3 rounded-xl text-xs font-semibold text-[#9AA0AA] hover:text-white transition-all text-center border-2 border-dashed border-[#2B3038] hover:border-[#00D9FF]/60 bg-[#15171B] hover:bg-[#1A1D23] cursor-pointer"
                >
                  + UPLOAD LOGO
                </button>
              )}
              <input
                ref={logoRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={e => e.target.files?.[0] && uploadImage(e.target.files[0], "tsp_logo", setLogoUrl)}
              />
            </div>

            {/* Authorized Signature Upload */}
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-[#8A909B] mb-2.5 flex items-center justify-between">
                <span>Authorized Signature</span>
                {signUrl && <span className="text-[10px] text-emerald-400 font-semibold tracking-normal">Loaded</span>}
              </div>
              {signUrl ? (
                <div className="relative rounded-xl overflow-hidden border border-[#2A2F37] bg-white p-2.5 shadow-sm">
                  <img src={signUrl} alt="Sign" className="w-full h-12 object-contain" />
                  <button
                    type="button"
                    onClick={() => clearImage("tsp_sign", setSignUrl)}
                    className="absolute top-1.5 right-1.5 w-6 h-6 rounded-lg bg-black/80 hover:bg-black text-white text-xs flex items-center justify-center transition-colors cursor-pointer"
                    title="Remove Signature"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => signRef.current?.click()}
                  className="w-full py-3 rounded-xl text-xs font-semibold text-[#9AA0AA] hover:text-white transition-all text-center border-2 border-dashed border-[#2B3038] hover:border-[#00D9FF]/60 bg-[#15171B] hover:bg-[#1A1D23] cursor-pointer"
                >
                  + UPLOAD SIGNATURE
                </button>
              )}
              <input
                ref={signRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={e => e.target.files?.[0] && uploadImage(e.target.files[0], "tsp_sign", setSignUrl)}
              />
            </div>

            {/* Format Toolbar */}
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-[#8A909B] mb-2.5">
                Format
              </div>
              <div className="flex gap-2">
                {[
                  { label: "B", cmd: "bold", title: "Bold" },
                  { label: "I", cmd: "italic", title: "Italic" },
                  { label: "U", cmd: "underline", title: "Underline" },
                ].map(({ label, cmd, title }) => (
                  <button
                    key={cmd}
                    type="button"
                    onClick={() => fmt(cmd)}
                    title={title}
                    className="w-10 h-10 rounded-xl bg-[#17191D] hover:bg-[#20242C] active:bg-[#131518] border border-[#2A2F37] hover:border-[#00D9FF]/50 text-[#E8EAED] hover:text-white transition-all font-bold text-sm flex items-center justify-center cursor-pointer active:scale-95 shadow-sm"
                  >
                    <span className={cmd === "italic" ? "italic" : cmd === "underline" ? "underline" : ""}>
                      {label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Insert Fields */}
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-[#8A909B] mb-2.5">
                Insert Field
              </div>
              <div className="flex flex-col gap-1.5 max-h-[220px] overflow-y-auto pr-1 custom-scrollbar">
                {FIELDS.map(f => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => insertField(f)}
                    className="text-left text-[11.5px] font-mono px-3 py-2 rounded-lg bg-[#16181C] hover:bg-[#1E222A] text-[#A6ADB8] hover:text-[#00D9FF] border border-[#262A32] hover:border-[#00D9FF]/40 transition-all duration-150 flex items-center justify-between group cursor-pointer"
                  >
                    <span>{f}</span>
                    <span className="text-[10px] text-[#636A75] group-hover:text-[#00D9FF] transition-colors">+</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Action buttons (Print / PDF & Save) */}
            <div className="pt-3 border-t border-[#22262C] flex flex-col gap-2.5">
              <button
                type="button"
                onClick={handlePrint}
                className="w-full py-2.5 px-4 rounded-xl text-xs font-bold uppercase tracking-wider bg-white hover:bg-zinc-200 text-black shadow-lg hover:shadow-white/10 transition-all text-center flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
              >
                <span>🖨</span>
                <span>PRINT / PDF</span>
              </button>
              <button
                type="button"
                onClick={syncBody}
                className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold uppercase tracking-wider bg-[#17191D] hover:bg-[#20242C] text-[#E8EAED] hover:text-white border border-[#2A2F37] hover:border-[#00D9FF] transition-all text-center flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
              >
                <span>💾</span>
                <span>SAVE TEMPLATE</span>
              </button>
            </div>
          </div>
        </div>

        {/* Professional A4 Paper Editor Canvas */}
        <div className="flex-1 min-w-0 flex flex-col w-full">
          <div className="flex items-center justify-between gap-3 mb-3.5">
            <div className="text-xs text-[#9AA0AA] font-semibold uppercase tracking-wider flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span>A4 Document Editor — Click Paper to Edit</span>
            </div>

            {/* Visual Zoom Controls */}
            <div className="flex items-center gap-1 bg-[#121417] px-2.5 py-1.5 rounded-xl border border-[#24282E]">
              <span className="text-[11px] font-semibold text-[#8A909B] mr-1">Zoom:</span>
              <button
                type="button"
                onClick={handleFitZoom}
                className="text-[11.5px] px-2.5 py-1 rounded-lg text-[#9AA0AA] hover:text-white hover:bg-white/10 font-medium transition-all cursor-pointer"
                title="Fit Document to Window Width"
              >
                Fit
              </button>
              {[0.75, 0.9, 1].map(z => (
                <button
                  key={z}
                  type="button"
                  onClick={() => setZoom(z)}
                  className={`text-[11.5px] px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                    zoom === z
                      ? "bg-white text-black font-bold shadow-sm"
                      : "text-[#9AA0AA] hover:text-white hover:bg-white/10"
                  }`}
                >
                  {Math.round(z * 100)}%
                </button>
              ))}
            </div>
          </div>

          {/* Paper container with chrome window bar */}
          <div className="rounded-2xl overflow-hidden shadow-2xl flex flex-col border border-[#262B33] bg-[#0E1013]">
            {/* Paper chrome bar */}
            <div className="px-4 py-3 flex items-center justify-between bg-[#14161A] border-b border-[#22262C]">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-[#EF4444]/70" />
                <div className="w-2.5 h-2.5 rounded-full bg-[#F59E0B]/70" />
                <div className="w-2.5 h-2.5 rounded-full bg-[#10B981]/70" />
                <span className="ml-2 text-xs font-medium text-[#A0A6B2]">
                  A4 · 210mm × 297mm · {contract.name}
                </span>
              </div>
              <div className="text-xs font-mono text-[#8E949E] bg-[#0D0E11] px-2.5 py-0.5 rounded-md border border-[#22262C]">
                {Math.round(zoom * 100)}% scale
              </div>
            </div>

            {/* Dark Workspace Desk with centered A4 pages */}
            <div
              ref={workspaceRef}
              className="w-full overflow-x-auto overflow-y-auto p-6 sm:p-10 flex flex-col items-center custom-scrollbar"
              style={{
                background: "#090A0C",
                minHeight: "750px",
                maxHeight: "82vh",
              }}
            >
              {/* Document Scaling Wrapper — preserves exact A4 coordinates */}
              <div
                style={{
                  width: "210mm",
                  zoom: zoom,
                  transformOrigin: "top center",
                }}
              >
                {/* Editable A4 Document Root */}
                <div
                  ref={editorRef}
                  contentEditable
                  suppressContentEditableWarning
                  className="document-studio-wrapper a4-editor-canvas outline-none"
                  dangerouslySetInnerHTML={{ __html: body }}
                  onInput={syncBody}
                />
              </div>
            </div>
          </div>

          {/* Logo/sign status */}
          {(logoUrl || signUrl) && (
            <div className="mt-3 text-xs text-[#8A909B] font-medium px-1 flex items-center gap-2">
              {logoUrl && <span>✅ Company Logo loaded</span>}
              {logoUrl && signUrl && <span>·</span>}
              {signUrl && <span>✅ Authorized Signature loaded</span>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

