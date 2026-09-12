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
          color: rgba(255, 255, 255, 0.4);
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
      <div className="flex items-center justify-between gap-3">
        <Btn onClick={onBack} className="flex items-center gap-2 text-sm text-[var(--text-3)] hover:text-white transition-colors font-medium flex-shrink-0">
          ← Back
        </Btn>
        <div className="text-sm sm:text-base font-bold tracking-tight leading-tight truncate">{contract.name}</div>
      </div>

      <div className="flex flex-col lg:flex-row gap-5 items-start">
        {/* Controls Sidebar */}
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
                className="flex-1 lg:flex-none py-2.5 rounded-xl text-sm font-semibold bg-white text-black hover:bg-white/90 transition-all whitespace-nowrap px-3 text-center">
                🖨 Print / PDF
              </Btn>
              <Btn onClick={syncBody}
                className="flex-1 lg:flex-none py-2 rounded-xl text-sm font-medium text-[var(--text-2)] hover:text-white transition-colors px-3 text-center"
                style={{ background: "var(--glass-2)", border: "1px solid var(--border)" }}>
                💾 Save
              </Btn>
            </div>
          </div>
        </div>

        {/* Professional A4 Paper Editor Canvas */}
        <div className="flex-1 min-w-0 flex flex-col">
          <div className="flex items-center justify-between gap-2 mb-3">
            <div className="text-xs text-[var(--text-3)] font-medium uppercase tracking-widest">
              A4 Document Editor — Click Paper to Edit
            </div>

            {/* Visual Zoom Controls */}
            <div className="flex items-center gap-1 bg-[#1a1a1d] px-2 py-1 rounded-lg border border-[var(--border)]">
              <span className="text-[11px] text-[var(--text-3)] font-medium mr-1">Zoom:</span>
              <button
                type="button"
                onClick={handleFitZoom}
                className="text-[11px] px-1.5 py-0.5 rounded text-[var(--text-2)] hover:text-white hover:bg-white/10 transition-colors"
                title="Fit Document to Window Width"
              >
                Fit
              </button>
              {[0.75, 0.9, 1].map(z => (
                <button
                  key={z}
                  type="button"
                  onClick={() => setZoom(z)}
                  className={`text-[11px] px-1.5 py-0.5 rounded transition-colors ${
                    zoom === z ? "bg-white text-black font-semibold" : "text-[var(--text-3)] hover:text-white"
                  }`}
                >
                  {Math.round(z * 100)}%
                </button>
              ))}
            </div>
          </div>

          {/* Paper container with chrome window bar */}
          <div className="rounded-2xl overflow-hidden shadow-2xl flex flex-col" style={{ border: "1px solid rgba(255,255,255,0.12)" }}>
            {/* Paper chrome bar */}
            <div className="px-4 py-2.5 flex items-center justify-between" style={{ background: "#18181b", borderBottom: "1px solid var(--border)" }}>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500/60" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
                <div className="w-3 h-3 rounded-full bg-green-500/60" />
                <span className="ml-2 text-xs font-medium text-[var(--text-2)]">
                  A4 · 210mm × 297mm · {contract.name}
                </span>
              </div>
              <div className="text-xs text-[var(--text-3)] font-mono">
                {Math.round(zoom * 100)}% scale
              </div>
            </div>

            {/* Dark Workspace Desk with centered A4 pages */}
            <div
              ref={workspaceRef}
              className="w-full overflow-x-auto overflow-y-auto p-6 sm:p-10 flex flex-col items-center"
              style={{
                background: "#0c0c0e",
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
            <div className="mt-3 text-xs text-[var(--text-3)] font-medium px-1">
              {logoUrl && "✅ Company Logo loaded · "}
              {signUrl && "✅ Authorized Signature loaded"}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
