"use client";
import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { useStore } from "@/lib/store";
import type { Contract } from "@/types";
import { compressImage } from "@/lib/utils/image";
import { Btn } from "@/components/ui";
import { DOCUMENT_STUDIO_CSS } from "@/lib/document-utils";
import {
  resolveContractAssets,
  renderContractHtml,
  stripContractAssetsForStorage,
  updateEditorDomAssets,
  type ResolvedAssets,
} from "@/lib/contract-assets";

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

/**
 * Resolves a DOM Range from screen coordinates across browsers (WebKit/Blink and Gecko).
 */
function getCaretRangeFromPoint(x: number, y: number): Range | null {
  if (typeof document === "undefined") return null;

  if (document.caretRangeFromPoint) {
    return document.caretRangeFromPoint(x, y);
  }

  if ((document as any).caretPositionFromPoint) {
    const pos = (document as any).caretPositionFromPoint(x, y);
    if (pos && pos.offsetNode) {
      const range = document.createRange();
      range.setStart(pos.offsetNode, pos.offset);
      range.collapse(true);
      return range;
    }
  }

  return null;
}

/**
 * Formats the current local date in standard document format, e.g. "16 September 2026".
 */
export function getLocalCurrentDate(): string {
  return new Date().toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/**
 * Ensures document Date fields display today's current date by default,
 * while strictly preserving any manually entered or edited dates.
 */
export function ensureCurrentDate(content: string): string {
  if (!content) return "";
  if (content.includes('data-manual-date="true"')) {
    return content;
  }

  const todayStr = getLocalCurrentDate();

  // 1. Replace header Date: field (e.g. "Date: 15 September 2026", "Date: [DATE]", etc.)
  let updated = content.replace(
    /(Date:\s*)(?:<span[^>]*class="[^"]*contract-date[^"]*"[^>]*>)?([0-9]{1,2}\s+[A-Za-z]+\s+[0-9]{4}|[A-Za-z]+\s+[0-9]{1,2},?\s+[0-9]{4}|\[DATE\]|\[TODAY\])(?:<\/span>)?/gi,
    (match, prefix) => {
      if (match.includes('data-manual-date="true"')) return match;
      return `${prefix}<span class="contract-date" data-default-date="true">${todayStr}</span>`;
    }
  );

  // 2. Replace preamble Date: "as of <strong>15 September 2026</strong>"
  updated = updated.replace(
    /(as of\s*<strong>)(?:<span[^>]*class="[^"]*contract-date[^"]*"[^>]*>)?([0-9]{1,2}\s+[A-Za-z]+\s+[0-9]{4}|[A-Za-z]+\s+[0-9]{1,2},?\s+[0-9]{4}|\[DATE\])(?:<\/span>)?(<\/strong>)/gi,
    (match, prefix, oldDate, suffix) => {
      if (match.includes('data-manual-date="true"')) return match;
      return `${prefix}<span class="contract-date" data-default-date="true">${todayStr}</span>${suffix}`;
    }
  );

  return updated;
}

export default function ContractEditor({ contract, onBack }: Props) {
  const { contracts, updateContract, globalBrandAssets, setContractAsset, deleteContractAsset } = useStore();
  const currentContract = contracts.find(c => c.id === contract.id) || contract;

  const [zoom, setZoom] = useState<number>(1);
  const [isSaved, setIsSaved] = useState(false);

  // Asset priority: Specific document asset → Global Brand Asset → none ("")
  const specificLogo = currentContract.logoUrl || (typeof window !== "undefined" ? localStorage.getItem(`doc_${contract.id}_logo`) : "") || "";
  const specificSign = currentContract.signUrl || (typeof window !== "undefined" ? localStorage.getItem(`doc_${contract.id}_sign`) : "") || "";
  const globalLogo = globalBrandAssets?.logoUrl || "";
  const globalSign = globalBrandAssets?.signUrl || "";

  const resolvedAssets: ResolvedAssets = useMemo(() => {
    return resolveContractAssets(
      { id: contract.id, logoUrl: specificLogo, signUrl: specificSign },
      globalLogo,
      globalSign
    );
  }, [contract.id, specificLogo, specificSign, globalLogo, globalSign]);

  // Initial HTML with A4 normalization, current date, and injected resolved assets.
  // Memoized strictly per contract.id so typing updates never cause React to overwrite innerHTML!
  const initialHtml = useMemo(() => {
    const fresh = ensureA4Pages(ensureCurrentDate(currentContract.body), currentContract.id);
    return renderContractHtml(fresh, resolvedAssets);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contract.id]);

  const lastHtmlRef = useRef<string>(initialHtml);
  const savedRangeRef = useRef<Range | null>(null);
  const editorRef = useRef<HTMLDivElement>(null);
  const workspaceRef = useRef<HTMLDivElement>(null);
  const logoRef = useRef<HTMLInputElement>(null);
  const signRef = useRef<HTMLInputElement>(null);
  const syncTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const currentLoadedIdRef = useRef<string>(contract.id);

  // Save the user's active cursor/selection Range within editorRef
  const saveSelection = useCallback(() => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0 && editorRef.current) {
      const range = sel.getRangeAt(0);
      if (editorRef.current.contains(range.commonAncestorContainer)) {
        savedRangeRef.current = range.cloneRange();
      }
    }
  }, []);

  // Listen to document selectionchange so we always have the freshest cursor position
  useEffect(() => {
    const handleSelectionChange = () => {
      const sel = window.getSelection();
      if (sel && sel.rangeCount > 0 && editorRef.current) {
        const range = sel.getRangeAt(0);
        if (editorRef.current.contains(range.commonAncestorContainer)) {
          savedRangeRef.current = range.cloneRange();
        }
      }
    };
    document.addEventListener("selectionchange", handleSelectionChange);
    return () => document.removeEventListener("selectionchange", handleSelectionChange);
  }, []);

  // Reset editor HTML ONLY when switching to a different contract.
  // Never reset while editing the current contract, which would destroy the user's cursor!
  useEffect(() => {
    if (!editorRef.current) return;
    if (currentLoadedIdRef.current !== contract.id) {
      currentLoadedIdRef.current = contract.id;
      const fresh = ensureA4Pages(ensureCurrentDate(currentContract.body), currentContract.id);
      const rendered = renderContractHtml(fresh, resolvedAssets);
      editorRef.current.innerHTML = rendered;
      lastHtmlRef.current = rendered;
      savedRangeRef.current = null;
    }
  }, [contract.id, currentContract.body, resolvedAssets]);

  // Dynamically update DOM asset slots when resolved assets change
  useEffect(() => {
    if (editorRef.current) {
      updateEditorDomAssets(editorRef.current, resolvedAssets);
    }
  }, [resolvedAssets]);

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

  async function handleUploadDocLogo(file: File) {
    try {
      const { compressImage } = await import("@/lib/utils/image");
      const compressed = await compressImage(file, 400, 150);
      const { uploadDocumentAsset } = await import("@/lib/supabase");
      const url = await uploadDocumentAsset(contract.id, compressed, "logo");
      setContractAsset(contract.id, "logo", url);
    } catch (err) {
      console.error("Document logo upload failed, falling back to raw data URL", err);
      const reader = new FileReader();
      reader.onload = async e => {
        const rawUrl = e.target?.result as string;
        try {
          const { uploadDocumentAsset } = await import("@/lib/supabase");
          const publicUrl = await uploadDocumentAsset(contract.id, rawUrl, "logo");
          setContractAsset(contract.id, "logo", publicUrl);
        } catch (uploadErr) {
          console.error("Raw document logo upload failed:", uploadErr);
        }
      };
      reader.readAsDataURL(file);
    }
  }

  async function handleClearDocLogo() {
    deleteContractAsset(contract.id, "logo");
  }

  async function handleUploadDocSign(file: File) {
    try {
      const { compressImage } = await import("@/lib/utils/image");
      const compressed = await compressImage(file, 400, 150);
      const { uploadDocumentAsset } = await import("@/lib/supabase");
      const url = await uploadDocumentAsset(contract.id, compressed, "sign");
      setContractAsset(contract.id, "sign", url);
    } catch (err) {
      console.error("Document signature upload failed, falling back to raw data URL", err);
      const reader = new FileReader();
      reader.onload = async e => {
        const rawUrl = e.target?.result as string;
        try {
          const { uploadDocumentAsset } = await import("@/lib/supabase");
          const publicUrl = await uploadDocumentAsset(contract.id, rawUrl, "sign");
          setContractAsset(contract.id, "sign", publicUrl);
        } catch (uploadErr) {
          console.error("Raw document signature upload failed:", uploadErr);
        }
      };
      reader.readAsDataURL(file);
    }
  }

  async function handleClearDocSign() {
    deleteContractAsset(contract.id, "sign");
  }

  // Input handler that preserves cursor position and syncs to store without re-rendering DOM
  const handleInput = useCallback(() => {
    if (!editorRef.current) return;
    saveSelection();

    // Check if user manually modified the date field
    const todayStr = getLocalCurrentDate();
    const dateEls = editorRef.current.querySelectorAll(".contract-date");
    dateEls.forEach(el => {
      const text = el.textContent?.trim();
      if (text && text !== todayStr) {
        el.setAttribute("data-manual-date", "true");
        el.removeAttribute("data-default-date");
      }
    });

    const html = editorRef.current.innerHTML;
    lastHtmlRef.current = html;
    const cleanStorageHtml = stripContractAssetsForStorage(html);

    if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
    syncTimerRef.current = setTimeout(() => {
      updateContract(contract.id, cleanStorageHtml);
    }, 400);
  }, [contract.id, updateContract, saveSelection]);

  // Accurate mouse-position handling so clicking anywhere sets caret right at that position
  const handleEditorMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;

    // Ignore clicks on explicit form buttons or file inputs
    if (target.closest("button") || target.closest("input")) return;

    // Protected slots (logo / signature images) should not accept text caret
    if (target.closest(".contract-logo-slot, .contract-sign-slot")) {
      e.preventDefault();
      return;
    }

    // Try resolving exact caret position from click point
    const range = getCaretRangeFromPoint(e.clientX, e.clientY);
    if (range && editorRef.current && editorRef.current.contains(range.commonAncestorContainer)) {
      const container = range.commonAncestorContainer;
      const el = container.nodeType === Node.ELEMENT_NODE ? (container as HTMLElement) : container.parentElement;
      if (el?.closest(".contract-logo-slot, .contract-sign-slot")) {
        return;
      }

      const sel = window.getSelection();
      if (sel) {
        sel.removeAllRanges();
        sel.addRange(range);
        savedRangeRef.current = range.cloneRange();
      }
    }
  }, []);

  const handleEditorMouseUp = useCallback(() => {
    saveSelection();
  }, [saveSelection]);

  const handleEditorClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    if (target.closest("button") || target.closest("input")) return;

    // If target is inside protected slots, ignore
    if (target.closest(".contract-logo-slot, .contract-sign-slot")) {
      return;
    }

    // Verify selection after click. If browser defaulted selection to root container at offset 0,
    // rectify it to target element or nearest caret
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0 && editorRef.current) {
      const anchor = sel.anchorNode;
      // If anchor is the editor root or .page container at offset 0 (the top-left header bug),
      // redirect to the exact clicked element or point
      if (
        anchor === editorRef.current ||
        (anchor && anchor.nodeType === Node.ELEMENT_NODE && (anchor as HTMLElement).classList.contains("page") && sel.anchorOffset === 0)
      ) {
        const range = getCaretRangeFromPoint(e.clientX, e.clientY);
        if (range && editorRef.current.contains(range.commonAncestorContainer)) {
          sel.removeAllRanges();
          sel.addRange(range);
          savedRangeRef.current = range.cloneRange();
        } else if (target && editorRef.current.contains(target) && target !== editorRef.current) {
          const r = document.createRange();
          r.selectNodeContents(target);
          r.collapse(false);
          sel.removeAllRanges();
          sel.addRange(r);
          savedRangeRef.current = r.cloneRange();
        }
      } else {
        saveSelection();
      }
    }
  }, [saveSelection]);

  const handleEditorKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
    // If the selection is accidentally placed at editor root at offset 0,
    // restore savedRangeRef if valid, so typing doesn't dump into header!
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0 && editorRef.current) {
      const anchor = sel.anchorNode;
      if (anchor === editorRef.current && sel.anchorOffset === 0) {
        if (savedRangeRef.current && editorRef.current.contains(savedRangeRef.current.commonAncestorContainer)) {
          sel.removeAllRanges();
          sel.addRange(savedRangeRef.current);
        }
      }
    }
  }, []);

  // Formatting helper (B, I, U) preserving selection
  const fmt = useCallback((cmd: string) => {
    if (!editorRef.current) return;
    const sel = window.getSelection();
    const isInside = sel && sel.rangeCount > 0 && editorRef.current.contains(sel.getRangeAt(0).commonAncestorContainer);
    if (!isInside && savedRangeRef.current) {
      sel?.removeAllRanges();
      sel?.addRange(savedRangeRef.current);
    }
    document.execCommand(cmd, false, undefined);
    saveSelection();
    handleInput();
  }, [saveSelection, handleInput]);

  // Insert field at EXACT cursor position
  const insertField = useCallback((text: string) => {
    if (!editorRef.current) return;

    let range: Range | null = null;
    const sel = window.getSelection();

    // 1. Check live selection
    if (sel && sel.rangeCount > 0) {
      const r = sel.getRangeAt(0);
      if (editorRef.current.contains(r.commonAncestorContainer)) {
        range = r;
      }
    }

    // 2. Fall back to savedRangeRef if selection was blurred
    if (!range && savedRangeRef.current && editorRef.current.contains(savedRangeRef.current.commonAncestorContainer)) {
      if (sel) {
        sel.removeAllRanges();
        sel.addRange(savedRangeRef.current);
        range = savedRangeRef.current;
      }
    }

    if (range && sel) {
      range.deleteContents();
      const textNode = document.createTextNode(text);
      range.insertNode(textNode);

      // Move caret directly after the inserted text
      const nextRange = document.createRange();
      nextRange.setStartAfter(textNode);
      nextRange.setEndAfter(textNode);
      sel.removeAllRanges();
      sel.addRange(nextRange);
      savedRangeRef.current = nextRange.cloneRange();

      editorRef.current.focus();
      handleInput();
    } else {
      editorRef.current.focus();
      document.execCommand("insertText", false, text);
      saveSelection();
      handleInput();
    }
  }, [handleInput, saveSelection]);

  // Save template explicitly
  const handleSave = useCallback(() => {
    if (editorRef.current) {
      const html = editorRef.current.innerHTML;
      lastHtmlRef.current = html;
      const cleanStorageHtml = stripContractAssetsForStorage(html);
      updateContract(contract.id, cleanStorageHtml);
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2000);
    }
  }, [contract.id, updateContract]);

  function handleFitZoom() {
    if (workspaceRef.current) {
      const avail = workspaceRef.current.clientWidth - 48;
      const fit = Math.min(1.15, Math.max(0.45, avail / 830));
      setZoom(Number(fit.toFixed(2)));
    }
  }

  function handlePrint() {
    const rawContent = editorRef.current?.innerHTML ?? lastHtmlRef.current ?? initialHtml;
    const finalContent = renderContractHtml(rawContent, resolvedAssets);

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
        .contract-logo-slot { height: 56px !important; max-height: 56px !important; display: flex !important; align-items: center !important; justify-content: flex-start !important; margin-bottom: 8px !important; }
        .contract-logo-slot img { height: 56px !important; max-width: 240px !important; object-fit: contain !important; display: block !important; }
        .contract-sign-slot { height: 96px !important; min-height: 96px !important; max-height: 96px !important; display: flex !important; align-items: flex-end !important; justify-content: flex-start !important; margin-bottom: 8px !important; }
        .contract-sign-slot img { height: 86px !important; max-height: 86px !important; max-width: 200px !important; object-fit: contain !important; display: block !important; }
        .page { width: 210mm; min-height: 297mm; position: relative; margin: 0 auto; box-sizing: border-box; background: #fff; }
        .page.a4-flow-page { padding: 20mm 25mm; height: auto; min-height: 297mm; box-sizing: border-box; }
        .page.a4-flow-page .a4-flow-content { width: 100%; box-sizing: border-box; }
        @media print {
          @page { size: A4; margin: 0mm; }
          body { margin: 0 !important; padding: 0 !important; }
          .page { page-break-after: always; box-shadow: none !important; margin: 0 !important; width: 210mm !important; }
          .page:last-child { page-break-after: auto; }
          .page.a4-flow-page { padding: 20mm 25mm !important; }
          .page.a4-flow-page .a4-flow-content { width: 100% !important; }
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
          cursor: text !important;
          width: 210mm !important;
          min-height: 297mm !important;
          position: relative !important;
          background: #ffffff !important;
          color: #111111;
          box-shadow: 0 16px 48px -8px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(255, 255, 255, 0.12) !important;
          border-radius: 2px;
          margin: 0 auto 36px auto !important;
          box-sizing: border-box !important;
          flex-shrink: 0 !important;
          counter-increment: a4page;
        }

        .a4-editor-canvas .page::after {
          content: "PAGE " counter(a4page);
          position: absolute;
          top: -22px;
          right: 4px;
          font-size: 10px;
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.5);
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
          box-sizing: border-box !important;
        }

        .a4-editor-canvas .page.a4-flow-page .a4-flow-content {
          width: 100% !important;
          box-sizing: border-box !important;
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
          width: 100%;
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

        /* ─── Contract Assets Fixed Placement ─────────────────────── */
        .a4-editor-canvas .contract-logo-slot,
        .document-studio-wrapper .contract-logo-slot {
          height: 56px !important;
          max-height: 56px !important;
          display: flex !important;
          align-items: center !important;
          justify-content: flex-start !important;
          margin-bottom: 8px !important;
          user-select: none !important;
          -webkit-user-select: none !important;
        }

        .a4-editor-canvas .contract-logo-slot img,
        .document-studio-wrapper .contract-logo-slot img {
          height: 56px !important;
          max-width: 240px !important;
          object-fit: contain !important;
          display: block !important;
          pointer-events: none !important;
        }

        .a4-editor-canvas .contract-sign-slot,
        .document-studio-wrapper .contract-sign-slot {
          height: 96px !important;
          min-height: 96px !important;
          max-height: 96px !important;
          display: flex !important;
          align-items: flex-end !important;
          justify-content: flex-start !important;
          margin-bottom: 8px !important;
          user-select: none !important;
          -webkit-user-select: none !important;
        }

        .a4-editor-canvas .contract-sign-slot img,
        .document-studio-wrapper .contract-sign-slot img {
          height: 86px !important;
          max-height: 86px !important;
          max-width: 200px !important;
          object-fit: contain !important;
          display: block !important;
          pointer-events: none !important;
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
      <div className="flex items-center justify-between gap-4 pb-2 border-b border-white/[0.06]">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all duration-150 border cursor-pointer select-none outline-none flex-shrink-0 bg-[#14161A] hover:bg-[#1D2128] active:bg-[#16181F] text-[#E8EAED] hover:text-white active:text-white border-[#2A2E36] hover:border-[#00D9FF]/60 focus-visible:border-[#00D9FF] focus-visible:ring-1 focus-visible:ring-[#00D9FF]/30 active:scale-[0.98]"
        >
          <span className="text-sm leading-none text-[#00D9FF]">←</span>
          <span>BACK</span>
        </button>
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#121418] border border-[#23272F]">
          <span className="w-2 h-2 rounded-full bg-[#00D9FF] shadow-[0_0_8px_rgba(0,217,255,0.6)]" />
          <span className="text-xs text-[#8E95A2] font-semibold uppercase tracking-wider">Template:</span>
          <span className="text-sm font-bold tracking-tight text-white">{contract.name}</span>
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
                {resolvedAssets.isSpecificLogo ? (
                  <span className="text-[10px] text-emerald-400 font-semibold tracking-normal px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">
                    Doc Specific
                  </span>
                ) : resolvedAssets.logoUrl ? (
                  <span className="text-[10px] text-[#00D9FF] font-semibold tracking-normal px-1.5 py-0.5 rounded bg-[#00D9FF]/10 border border-[#00D9FF]/20">
                    Inherited Global
                  </span>
                ) : (
                  <span className="text-[10px] text-[#8E95A2] font-semibold tracking-normal">
                    Default
                  </span>
                )}
              </div>
              {resolvedAssets.logoUrl ? (
                <div className="relative rounded-xl overflow-hidden border border-[#2A2F37] bg-white p-2.5 shadow-sm">
                  <img src={resolvedAssets.logoUrl} alt="Logo" className="w-full h-14 object-contain" />
                  {resolvedAssets.isSpecificLogo && (
                    <button
                      type="button"
                      onClick={handleClearDocLogo}
                      className="absolute top-1.5 right-1.5 w-6 h-6 rounded-lg bg-black/80 hover:bg-red-600 text-white text-xs flex items-center justify-center transition-colors cursor-pointer"
                      title="Remove document-specific logo (falls back to global)"
                    >
                      ✕
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => logoRef.current?.click()}
                    className="mt-2 w-full py-1.5 rounded-lg text-[11px] font-semibold text-[#8E949E] hover:text-white bg-[#15171B] hover:bg-[#1f2229] border border-[#2A2F37] transition-all text-center cursor-pointer"
                  >
                    {resolvedAssets.isSpecificLogo ? "Change Document Logo" : "Upload Custom for this Doc"}
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
                onChange={e => e.target.files?.[0] && handleUploadDocLogo(e.target.files[0])}
              />
            </div>

            {/* Authorized Signature Upload */}
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-[#8A909B] mb-2.5 flex items-center justify-between">
                <span>Authorized Signature</span>
                {resolvedAssets.isSpecificSign ? (
                  <span className="text-[10px] text-emerald-400 font-semibold tracking-normal px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">
                    Doc Specific
                  </span>
                ) : resolvedAssets.signUrl ? (
                  <span className="text-[10px] text-[#00D9FF] font-semibold tracking-normal px-1.5 py-0.5 rounded bg-[#00D9FF]/10 border border-[#00D9FF]/20">
                    Inherited Global
                  </span>
                ) : (
                  <span className="text-[10px] text-[#8E95A2] font-semibold tracking-normal">
                    Empty
                  </span>
                )}
              </div>
              {resolvedAssets.signUrl ? (
                <div className="relative rounded-xl overflow-hidden border border-[#2A2F37] bg-white p-2.5 shadow-sm">
                  <img src={resolvedAssets.signUrl} alt="Sign" className="w-full h-12 object-contain" />
                  {resolvedAssets.isSpecificSign && (
                    <button
                      type="button"
                      onClick={handleClearDocSign}
                      className="absolute top-1.5 right-1.5 w-6 h-6 rounded-lg bg-black/80 hover:bg-red-600 text-white text-xs flex items-center justify-center transition-colors cursor-pointer"
                      title="Remove document-specific signature (falls back to global)"
                    >
                      ✕
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => signRef.current?.click()}
                    className="mt-2 w-full py-1.5 rounded-lg text-[11px] font-semibold text-[#8E949E] hover:text-white bg-[#15171B] hover:bg-[#1f2229] border border-[#2A2F37] transition-all text-center cursor-pointer"
                  >
                    {resolvedAssets.isSpecificSign ? "Change Document Sign" : "Upload Custom for this Doc"}
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
                onChange={e => e.target.files?.[0] && handleUploadDocSign(e.target.files[0])}
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
                    onMouseDown={e => e.preventDefault()}
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
                    onMouseDown={e => e.preventDefault()}
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
                onClick={handleSave}
                className={`w-full py-2.5 px-4 rounded-xl text-xs font-semibold uppercase tracking-wider border transition-all text-center flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98] ${
                  isSaved
                    ? "bg-emerald-600/20 text-emerald-400 border-emerald-500/50"
                    : "bg-[#17191D] hover:bg-[#20242C] text-[#E8EAED] hover:text-white border-[#2A2F37] hover:border-[#00D9FF]"
                }`}
              >
                <span>{isSaved ? "✅" : "💾"}</span>
                <span>{isSaved ? "SAVED TO SYSTEM" : "SAVE TEMPLATE"}</span>
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
          <div className="rounded-2xl overflow-hidden shadow-2xl flex flex-col border border-[#232730] bg-[#0A0B0E]">
            {/* Paper chrome bar */}
            <div className="px-4 py-3 flex items-center justify-between bg-[#111317] border-b border-[#1F232B]">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-[#EF4444]/80" />
                <div className="w-2.5 h-2.5 rounded-full bg-[#F59E0B]/80" />
                <div className="w-2.5 h-2.5 rounded-full bg-[#10B981]/80" />
                <span className="ml-2 text-xs font-medium text-[#A0A6B2]">
                  A4 · 210mm × 297mm · {contract.name}
                </span>
              </div>
              <div className="text-xs font-mono text-[#8E949E] bg-[#0B0D10] px-2.5 py-0.5 rounded-md border border-[#1F232B]">
                {Math.round(zoom * 100)}% scale
              </div>
            </div>

            {/* Dark Workspace Desk with centered A4 pages */}
            <div
              ref={workspaceRef}
              className="w-full overflow-x-auto overflow-y-auto p-6 sm:p-10 flex flex-col items-center custom-scrollbar"
              style={{
                backgroundColor: "#07080A",
                backgroundImage: `radial-gradient(circle at 50% 25%, rgba(0, 217, 255, 0.02) 0%, transparent 60%),
                  radial-gradient(rgba(255, 255, 255, 0.035) 1px, transparent 1px)`,
                backgroundSize: "100% 100%, 28px 28px",
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
                  key={contract.id}
                  ref={editorRef}
                  contentEditable
                  suppressContentEditableWarning
                  className="document-studio-wrapper a4-editor-canvas outline-none"
                  dangerouslySetInnerHTML={{ __html: initialHtml }}
                  onMouseDown={handleEditorMouseDown}
                  onMouseUp={handleEditorMouseUp}
                  onClick={handleEditorClick}
                  onKeyDown={handleEditorKeyDown}
                  onInput={handleInput}
                  onKeyUp={saveSelection}
                  onSelect={saveSelection}
                  onBlur={saveSelection}
                />
              </div>
            </div>
          </div>

          {/* Logo/sign status */}
          {(resolvedAssets.logoUrl || resolvedAssets.signUrl) && (
            <div className="mt-3 text-xs text-[#8A909B] font-medium px-1 flex items-center gap-2">
              {resolvedAssets.logoUrl && (
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                  <span>
                    Company Logo ({resolvedAssets.isSpecificLogo ? "Document Specific" : "Inherited Global"})
                  </span>
                </span>
              )}
              {resolvedAssets.logoUrl && resolvedAssets.signUrl && <span>·</span>}
              {resolvedAssets.signUrl && (
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                  <span>
                    Authorized Signature ({resolvedAssets.isSpecificSign ? "Document Specific" : "Inherited Global"})
                  </span>
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

