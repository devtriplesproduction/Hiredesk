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
  if (/\bclass=["'][^"']*\bpage(?=[\s"'])/i.test(content)) {
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
  const [editMode, setEditMode] = useState<"temporary" | "permanent">("temporary");
  const [hasPermanentSaved, setHasPermanentSaved] = useState(false);

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

  // Reset editor HTML when switching contracts or when self-healing corrupted templates
  useEffect(() => {
    if (!editorRef.current) return;

    // Self-heal exp_letter if DOM has header title, non-centered title, or old logo/sign sizes
    if (
      contract.id === "exp_letter" &&
      (!editorRef.current.innerHTML.includes("exp-cert-page") ||
        !editorRef.current.innerHTML.includes("Shital Khulape") ||
        editorRef.current.innerHTML.includes("translateX(-50%)") ||
        !editorRef.current.innerHTML.includes("text-align:center") ||
        editorRef.current.innerHTML.includes("height:48px") ||
        editorRef.current.innerHTML.includes("height: 48px") ||
        editorRef.current.innerHTML.includes("height:50px") ||
        editorRef.current.innerHTML.includes("margin-top:auto") ||
        editorRef.current.innerHTML.includes(">Triple S</span>") ||
        editorRef.current.innerHTML.includes("height:28px"))
    ) {
      import("@/lib/data").then(({ getContractTemplates }) => {
        const freshTpl = getContractTemplates().find(t => t.id === "exp_letter");
        if (freshTpl && editorRef.current) {
          const fresh = ensureA4Pages(ensureCurrentDate(freshTpl.body), "exp_letter");
          const rendered = renderContractHtml(fresh, resolvedAssets);
          editorRef.current.innerHTML = rendered;
          lastHtmlRef.current = rendered;
          savedRangeRef.current = null;
          updateContract("exp_letter", freshTpl.body);
        }
      });
      return;
    }

    if (currentLoadedIdRef.current !== contract.id) {
      currentLoadedIdRef.current = contract.id;
      const fresh = ensureA4Pages(ensureCurrentDate(currentContract.body), currentContract.id);
      const rendered = renderContractHtml(fresh, resolvedAssets);
      editorRef.current.innerHTML = rendered;
      lastHtmlRef.current = rendered;
      savedRangeRef.current = null;
    }
  }, [contract.id, currentContract.body, resolvedAssets, updateContract]);

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
      if (editMode === "permanent") {
        updateContract(contract.id, cleanStorageHtml);
      }
    }, 400);
  }, [contract.id, updateContract, saveSelection, editMode]);

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
      if (editMode === "permanent") {
        const cleanStorageHtml = stripContractAssetsForStorage(html);
        updateContract(contract.id, cleanStorageHtml);
      }
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2000);
    }
  }, [contract.id, updateContract, editMode]);

  const handleModeToggle = useCallback((mode: "temporary" | "permanent") => {
    setEditMode(mode);
    if (mode === "permanent") {
      if (editorRef.current) {
        const html = editorRef.current.innerHTML;
        lastHtmlRef.current = html;
        const cleanStorageHtml = stripContractAssetsForStorage(html);
        updateContract(contract.id, cleanStorageHtml);
      }
      setHasPermanentSaved(true);
      setTimeout(() => setHasPermanentSaved(false), 2000);
    } else {
      setHasPermanentSaved(false);
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
        .page.exp-cert-page { width: 210mm !important; height: 297mm !important; min-height: 297mm !important; padding: 14mm 24mm 16mm 24mm !important; display: flex !important; flex-direction: column !important; justify-content: space-between !important; background: #ffffff !important; color: #111111 !important; overflow: hidden !important; box-sizing: border-box !important; }
        .page.exp-cert-page .contract-sign-slot { height: 75px !important; min-height: 75px !important; max-height: 75px !important; margin-bottom: 6px !important; }
        .page.exp-cert-page .contract-sign-slot img { height: 70px !important; max-height: 70px !important; max-width: 220px !important; }
        .page.exp-cert-page .contract-sign-empty { height: 40px !important; min-height: 40px !important; }
        .page.exp-cert-page .header-logo { height: 58px !important; max-width: 280px !important; object-fit: contain !important; }
        @media print {
          @page { size: A4; margin: 0mm; }
          body { margin: 0 !important; padding: 0 !important; }
          .page { page-break-after: always; box-shadow: none !important; margin: 0 !important; width: 210mm !important; }
          .page:last-child { page-break-after: auto; }
          .page.a4-flow-page { padding: 20mm 25mm !important; }
          .page.a4-flow-page .a4-flow-content { width: 100% !important; }
          .page.exp-cert-page { width: 210mm !important; height: 297mm !important; padding: 14mm 24mm 16mm 24mm !important; page-break-after: always; }
          .no-print { display: none !important; }
        }
        ${DOCUMENT_STUDIO_CSS}
      </style>
    </head><body><div class="document-studio-wrapper">${finalContent}</div>
    <script>window.onload=()=>{setTimeout(()=>{window.print();},300);}<\/script>
    </body></html>`);
    win.document.close();
  }

  const handleResetToDefault = useCallback(async () => {
    if (confirm(`Reset "${contract.name}" to its official default system template? Any unsaved edits will be replaced.`)) {
      const { getContractTemplates } = await import("@/lib/data");
      const defaults = getContractTemplates();
      const defaultTpl = defaults.find(d => d.id === contract.id);
      if (defaultTpl) {
        const fresh = ensureA4Pages(ensureCurrentDate(defaultTpl.body), contract.id);
        const rendered = renderContractHtml(fresh, resolvedAssets);
        if (editorRef.current) {
          editorRef.current.innerHTML = rendered;
        }
        lastHtmlRef.current = rendered;
        updateContract(contract.id, defaultTpl.body);
        setIsSaved(true);
        setTimeout(() => setIsSaved(false), 2000);
      }
    }
  }, [contract.id, contract.name, resolvedAssets, updateContract]);

  const FIELDS = [
    "[CANDIDATE NAME]", "[ROLE]", "[START DATE]", "[END DATE]",
    "[LAST WORKING DAY]", "[AMOUNT ₹]", "[REF NO]", "[X months]",
    "[NOTICE PERIOD]", "[PROPRIETOR NAME]", "[DATE]",
  ];

  return (
    <div className="flex flex-col gap-5 relative isolation-auto w-full">
      {/* Editor Scoped CSS */}
      <style dangerouslySetInnerHTML={{
        __html: `
        ${DOCUMENT_STUDIO_CSS}

        /* ─── A4 Document Model & Editor Canvas ─────────────────── */
        .a4-editor-canvas {
          display: flex;
          flex-direction: column;
          align-items: center;
          width: 100%;
          counter-reset: a4page;
          position: relative;
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
          overflow: hidden;
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

        /* ─── Exact Experience Certificate Page (matches PDF 1-to-1) ── */
        .a4-editor-canvas .page.exp-cert-page {
          width: 210mm !important;
          height: 297mm !important;
          min-height: 297mm !important;
          padding: 14mm 24mm 16mm 24mm !important;
          display: flex !important;
          flex-direction: column !important;
          justify-content: space-between !important;
          background: #ffffff !important;
          color: #111111 !important;
          overflow: hidden !important;
          box-sizing: border-box !important;
        }

        .a4-editor-canvas .page.exp-cert-page .contract-sign-slot {
          height: 75px !important;
          min-height: 75px !important;
          max-height: 75px !important;
          margin-bottom: 6px !important;
        }

        .a4-editor-canvas .page.exp-cert-page .contract-sign-slot img {
          height: 70px !important;
          max-height: 70px !important;
          max-width: 220px !important;
        }

        .a4-editor-canvas .page.exp-cert-page .contract-sign-empty {
          height: 40px !important;
          min-height: 40px !important;
        }

        .a4-editor-canvas .page.exp-cert-page .header-logo {
          height: 58px !important;
          max-width: 280px !important;
          object-fit: contain !important;
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
      <div className="relative z-20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 mb-2 border-b border-[var(--border-2)]">
        <button
          type="button"
          onClick={onBack}
          className="group inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-300 border cursor-pointer select-none outline-none flex-shrink-0 bg-gradient-to-r from-[var(--card-bg)] to-[var(--bg)] hover:from-[var(--table-row-hover)] hover:to-[var(--card-bg)] text-[var(--text)] border-[var(--border-2)] hover:border-[#00D9FF]/50 shadow-sm hover:shadow-[0_0_15px_rgba(0,217,255,0.15)] active:scale-[0.97]"
        >
          <span className="text-sm leading-none text-[#00D9FF] group-hover:-translate-x-1 transition-transform duration-300">←</span>
          <span>BACK</span>
        </button>
        <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-xl bg-[var(--card-bg)]/60 backdrop-blur-md border border-[var(--border-2)] shadow-sm">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00D9FF] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#00D9FF] shadow-[0_0_10px_rgba(0,217,255,0.8)]"></span>
          </span>
          <span className="text-xs text-[var(--text-3)] font-semibold uppercase tracking-widest">Template</span>
          <span className="text-sm font-extrabold tracking-tight text-[var(--text)] bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">{contract.name}</span>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 items-start w-full">
        {/* Controls Sidebar - Glassmorphic Panel */}
        <div className="w-full lg:w-[320px] flex-shrink-0 lg:sticky lg:top-6 lg:max-h-[82vh] flex flex-col relative group">
          {/* Ambient Glow */}
          <div className="absolute -inset-0.5 bg-gradient-to-b from-[#00D9FF]/20 to-transparent rounded-[2rem] blur-xl opacity-50 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"></div>

          <div className="rounded-[2rem] border border-white/10 bg-black/40 backdrop-blur-2xl p-5 sm:p-6 flex flex-col gap-6 shadow-[0_16px_48px_rgba(0,0,0,0.5)] relative overflow-y-auto custom-scrollbar flex-1 z-10">
            {/* Subtle top glow */}
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#00D9FF]/60 to-transparent flex-shrink-0"></div>

            {/* Company Logo Upload */}
            <div>
              <div className="text-[11px] font-extrabold uppercase tracking-[0.15em] text-[var(--text-2)] mb-3 flex items-center justify-between">
                <span>Company Logo</span>
                {resolvedAssets.isSpecificLogo ? (
                  <span className="text-[9px] text-emerald-400 font-bold tracking-widest px-2 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/20 shadow-[0_0_8px_rgba(16,185,129,0.2)]">
                    DOC SPECIFIC
                  </span>
                ) : resolvedAssets.logoUrl ? (
                  <span className="text-[9px] text-[#00D9FF] font-bold tracking-widest px-2 py-1 rounded-md bg-[#00D9FF]/10 border border-[#00D9FF]/20 shadow-[0_0_8px_rgba(0,217,255,0.2)]">
                    INHERITED GLOBAL
                  </span>
                ) : (
                  <span className="text-[9px] text-[var(--text-3)] font-bold tracking-widest px-2 py-1 rounded-md bg-white/5 border border-white/10">
                    DEFAULT
                  </span>
                )}
              </div>
              {resolvedAssets.logoUrl ? (
                <div className="relative rounded-2xl border border-white/10 bg-white/5 p-3.5 shadow-[0_4px_24px_rgba(0,0,0,0.2)] group hover:border-[#00D9FF]/40 hover:bg-white/10 transition-all duration-300">
                  <div className="bg-white rounded-xl p-3 mb-3.5 flex items-center justify-center shadow-inner relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/40 to-transparent translate-x-[-150%] group-hover:translate-x-[150%] transition-transform duration-700 ease-in-out"></div>
                    <img src={resolvedAssets.logoUrl} alt="Logo" className="relative z-10 w-full h-12 object-contain filter drop-shadow-sm" />
                  </div>
                  {resolvedAssets.isSpecificLogo && (
                    <button
                      type="button"
                      onClick={handleClearDocLogo}
                      className="absolute top-2 right-2 w-7 h-7 rounded-lg bg-black/60 hover:bg-red-600 text-white text-xs flex items-center justify-center transition-colors cursor-pointer backdrop-blur-md border border-white/10 hover:border-red-500 shadow-sm"
                      title="Remove document-specific logo (falls back to global)"
                    >
                      ✕
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => logoRef.current?.click()}
                    className="w-full py-3 rounded-xl text-xs font-bold text-[var(--text)] hover:text-black bg-white/5 hover:bg-[#00D9FF] border border-white/10 hover:border-[#00D9FF] transition-all duration-300 text-center cursor-pointer shadow-[0_2px_8px_rgba(0,0,0,0.2)] hover:shadow-[0_0_15px_rgba(0,217,255,0.6)]"
                  >
                    {resolvedAssets.isSpecificLogo ? "Change Document Logo" : "Upload Custom for this Doc"}
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => logoRef.current?.click()}
                  className="group w-full py-5 rounded-2xl text-xs font-bold tracking-widest text-[var(--text-3)] hover:text-white transition-all text-center border-2 border-dashed border-white/10 hover:border-[#00D9FF]/60 bg-white/5 hover:bg-[#00D9FF]/10 cursor-pointer flex flex-col items-center gap-3 relative overflow-hidden shadow-inner"
                >
                  <div className="absolute inset-0 bg-gradient-to-b from-[#00D9FF]/0 to-[#00D9FF]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <span className="p-3.5 rounded-full bg-white/5 group-hover:bg-[#00D9FF]/20 text-[var(--text-3)] group-hover:text-[#00D9FF] transition-colors relative z-10 shadow-inner group-hover:shadow-[0_0_15px_rgba(0,217,255,0.3)]">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                  </span>
                  <span className="relative z-10">UPLOAD LOGO</span>
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
              <div className="text-[11px] font-extrabold uppercase tracking-[0.15em] text-[var(--text-2)] mb-3 flex items-center justify-between">
                <span>Authorized Signature</span>
                {resolvedAssets.isSpecificSign ? (
                  <span className="text-[9px] text-emerald-400 font-bold tracking-widest px-2 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/20 shadow-[0_0_8px_rgba(16,185,129,0.2)]">
                    DOC SPECIFIC
                  </span>
                ) : resolvedAssets.signUrl ? (
                  <span className="text-[9px] text-[#00D9FF] font-bold tracking-widest px-2 py-1 rounded-md bg-[#00D9FF]/10 border border-[#00D9FF]/20 shadow-[0_0_8px_rgba(0,217,255,0.2)]">
                    INHERITED GLOBAL
                  </span>
                ) : (
                  <span className="text-[9px] text-[var(--text-3)] font-bold tracking-widest px-2 py-1 rounded-md bg-white/5 border border-white/10">
                    EMPTY
                  </span>
                )}
              </div>
              {resolvedAssets.signUrl ? (
                <div className="relative rounded-2xl border border-white/10 bg-white/5 p-3.5 shadow-[0_4px_24px_rgba(0,0,0,0.2)] group hover:border-[#00D9FF]/40 hover:bg-white/10 transition-all duration-300">
                  <div className="bg-white rounded-xl p-3 mb-3.5 flex items-center justify-center shadow-inner relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/40 to-transparent translate-x-[-150%] group-hover:translate-x-[150%] transition-transform duration-700 ease-in-out"></div>
                    <img src={resolvedAssets.signUrl} alt="Sign" className="relative z-10 w-full h-12 object-contain filter drop-shadow-sm" />
                  </div>
                  {resolvedAssets.isSpecificSign && (
                    <button
                      type="button"
                      onClick={handleClearDocSign}
                      className="absolute top-2 right-2 w-7 h-7 rounded-lg bg-black/60 hover:bg-red-600 text-white text-xs flex items-center justify-center transition-colors cursor-pointer backdrop-blur-md border border-white/10 hover:border-red-500 shadow-sm"
                      title="Remove document-specific signature (falls back to global)"
                    >
                      ✕
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => signRef.current?.click()}
                    className="w-full py-3 rounded-xl text-xs font-bold text-[var(--text)] hover:text-black bg-white/5 hover:bg-[#00D9FF] border border-white/10 hover:border-[#00D9FF] transition-all duration-300 text-center cursor-pointer shadow-[0_2px_8px_rgba(0,0,0,0.2)] hover:shadow-[0_0_15px_rgba(0,217,255,0.6)]"
                  >
                    {resolvedAssets.isSpecificSign ? "Change Document Sign" : "Upload Custom for this Doc"}
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => signRef.current?.click()}
                  className="group w-full py-5 rounded-2xl text-xs font-bold tracking-widest text-[var(--text-3)] hover:text-white transition-all text-center border-2 border-dashed border-white/10 hover:border-[#00D9FF]/60 bg-white/5 hover:bg-[#00D9FF]/10 cursor-pointer flex flex-col items-center gap-3 relative overflow-hidden shadow-inner"
                >
                  <div className="absolute inset-0 bg-gradient-to-b from-[#00D9FF]/0 to-[#00D9FF]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <span className="p-3.5 rounded-full bg-white/5 group-hover:bg-[#00D9FF]/20 text-[var(--text-3)] group-hover:text-[#00D9FF] transition-colors relative z-10 shadow-inner group-hover:shadow-[0_0_15px_rgba(0,217,255,0.3)]">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                  </span>
                  <span className="relative z-10">UPLOAD SIGNATURE</span>
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

            {/* Insert Fields */}
            <div className="flex-1 flex flex-col min-h-0">
              <div className="flex items-center gap-2 text-[13px] font-extrabold uppercase tracking-widest text-[var(--text-3)] mb-3 border-b border-[var(--border-2)] pb-2">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#00D9FF]"><polyline points="4 7 4 4 20 4 20 7"/><line x1="9" y1="20" x2="15" y2="20"/><line x1="12" y1="4" x2="12" y2="20"/></svg>
                <span>Insert Field</span>
              </div>
              <div className="flex flex-col gap-2 max-h-[280px] overflow-y-auto pr-2 custom-scrollbar">
                {FIELDS.map(f => (
                  <button
                    key={f}
                    type="button"
                    onMouseDown={e => e.preventDefault()}
                    onClick={() => insertField(f)}
                    className="relative text-left text-[11.5px] font-mono px-3 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-[var(--text)] hover:text-[#00D9FF] border border-white/5 hover:border-[#00D9FF]/50 transition-all duration-300 flex items-center justify-between group cursor-pointer hover:shadow-[0_4px_15px_rgba(0,217,255,0.15)] active:scale-[0.97] overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-[#00D9FF]/0 via-[#00D9FF]/10 to-[#00D9FF]/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 translate-x-[-100%] group-hover:translate-x-[100%]"></div>
                    <span className="relative z-10 tracking-tight">{f}</span>
                    <span className="relative z-10 w-5 h-5 rounded-md bg-black/40 group-hover:bg-[#00D9FF] text-[var(--text-3)] group-hover:text-black flex items-center justify-center text-sm font-bold transition-all duration-300 shadow-inner group-hover:shadow-[0_0_8px_rgba(0,217,255,0.8)]">+</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Edit Mode Toggle */}
            <div className="pt-6 border-t border-white/10 flex flex-col gap-4">
              <div className="text-[11px] font-extrabold uppercase tracking-[0.15em] text-[var(--text-2)]">
                Edit Mode
              </div>
              <div className="flex rounded-xl bg-black/40 border border-white/10 p-1.5 shadow-inner">
                <button
                  type="button"
                  onClick={() => handleModeToggle("temporary")}
                  className={`flex-1 py-2.5 text-[11px] font-bold uppercase tracking-wider rounded-lg transition-all duration-300 ${
                    editMode === "temporary"
                      ? "bg-amber-500/20 text-amber-400 shadow-[0_2px_10px_rgba(245,158,11,0.2)] border border-amber-500/30"
                      : "text-[var(--text-3)] hover:text-[var(--text)] hover:bg-white/5"
                  }`}
                >
                  Temporary
                </button>
                <button
                  type="button"
                  onClick={() => handleModeToggle("permanent")}
                  className={`flex-1 py-2.5 text-[11px] font-bold uppercase tracking-wider rounded-lg transition-all duration-300 ${
                    editMode === "permanent"
                      ? "bg-emerald-500/20 text-emerald-400 shadow-[0_2px_10px_rgba(16,185,129,0.2)] border border-emerald-500/30"
                      : "text-[var(--text-3)] hover:text-[var(--text)] hover:bg-white/5"
                  }`}
                >
                  Permanent
                </button>
              </div>
              <div className="text-[10.5px] font-medium px-2">
                {editMode === "temporary" ? (
                  <span className="text-amber-500/90 tracking-wide">Session only — not saved to system template</span>
                ) : (
                  <span className="text-emerald-500/90 tracking-wide">Permanent — changes saved to system</span>
                )}
              </div>
            </div>

            {/* Action buttons (Print / PDF & Save) */}
            <div className="pt-6 border-t border-white/10 flex flex-col gap-4">
              <button
                type="button"
                onClick={handlePrint}
                className="group relative w-full py-4 px-4 rounded-xl text-[13px] font-extrabold uppercase tracking-widest bg-gradient-to-r from-gray-100 to-white hover:from-white hover:to-white text-black shadow-[0_4px_20px_rgba(255,255,255,0.15)] hover:shadow-[0_8px_25px_rgba(255,255,255,0.3)] transition-all duration-300 text-center flex items-center justify-center gap-3 cursor-pointer active:scale-[0.97] overflow-hidden border border-white/50"
              >
                <div className="absolute inset-0 bg-gradient-to-b from-white/40 to-transparent translate-y-[-100%] group-hover:translate-y-0 transition-transform duration-300 ease-out"></div>
                <svg className="relative z-10" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
                <span className="relative z-10">PRINT / PDF</span>
              </button>
              <button
                type="button"
                onClick={handleSave}
                className={`group relative w-full py-4 px-4 rounded-xl text-[13px] font-extrabold uppercase tracking-widest border transition-all duration-300 text-center flex items-center justify-center gap-3 cursor-pointer active:scale-[0.97] overflow-hidden ${
                  (isSaved && editMode === "temporary")
                    ? "bg-amber-500/20 text-amber-400 border-amber-500/50 shadow-[0_0_20px_rgba(245,158,11,0.3)]"
                  : (isSaved || hasPermanentSaved)
                    ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/50 shadow-[0_0_20px_rgba(16,185,129,0.3)]"
                    : editMode === "temporary" 
                      ? "bg-black/40 hover:bg-amber-500/10 text-white hover:text-amber-400 border-white/10 hover:border-amber-500/50 shadow-[0_4px_16px_rgba(0,0,0,0.3)] hover:shadow-[0_0_20px_rgba(245,158,11,0.2)]"
                      : "bg-black/40 hover:bg-[#00D9FF]/10 text-white hover:text-[#00D9FF] border-white/10 hover:border-[#00D9FF]/50 shadow-[0_4px_16px_rgba(0,0,0,0.3)] hover:shadow-[0_0_20px_rgba(0,217,255,0.2)]"
                  }`}
              >
                <div className={`absolute inset-0 bg-gradient-to-t from-transparent to-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300`}></div>
                <div className="relative z-10 flex items-center gap-2">
                  {isSaved || hasPermanentSaved ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
                  )}
                  <span>
                    {isSaved || hasPermanentSaved 
                      ? (editMode === "temporary" ? "SESSION ONLY" : "SAVED TO SYSTEM") 
                      : (editMode === "temporary" ? "APPLY (TEMPORARY)" : "SAVE PERMANENTLY")}
                  </span>
                </div>
              </button>
              <button
                type="button"
                onClick={handleResetToDefault}
                className="group w-full py-2.5 px-3 mt-1 rounded-xl text-[11px] font-bold uppercase tracking-wider text-[var(--text-3)] hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/30 transition-all duration-300 text-center flex items-center justify-center gap-2 cursor-pointer active:scale-[0.97]"
                title="Revert this template to the factory default"
              >
                <svg className="group-hover:-rotate-180 transition-transform duration-500" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
                <span>Reset to Default</span>
              </button>
            </div>
          </div>
        </div>

        {/* Professional A4 Paper Editor Canvas */}
        <div className="flex-1 min-w-0 flex flex-col w-full">


          {/* Paper container with chrome window bar */}
          <div className="rounded-3xl overflow-hidden shadow-[0_12px_40px_rgba(0,0,0,0.4)] flex flex-col border border-[var(--border-2)] bg-[var(--bg)] ring-1 ring-white/5 relative">
            {/* Paper chrome bar */}
            <div className="px-5 py-3.5 flex items-center justify-between bg-[var(--card-bg)]/80 backdrop-blur-md border-b border-[var(--border-2)] z-20">
              <div className="flex items-center gap-2">
                <div className="flex gap-1.5 mr-3">
                  <div className="w-3 h-3 rounded-full bg-[#EF4444] shadow-sm hover:opacity-80 cursor-pointer transition-opacity" />
                  <div className="w-3 h-3 rounded-full bg-[#F5C542] shadow-sm hover:opacity-80 cursor-pointer transition-opacity" />
                  <div className="w-3 h-3 rounded-full bg-[#22C55E] shadow-sm hover:opacity-80 cursor-pointer transition-opacity" />
                </div>
                <div className="h-4 w-px bg-[var(--border-2)] mr-2"></div>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--text-3)]"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
                <span className="text-[12.5px] font-medium text-[var(--text-2)] tracking-wide ml-1">
                  A4 <span className="mx-1 text-[var(--text-3)]">·</span> 210mm × 297mm <span className="mx-1 text-[var(--text-3)]">·</span> <span className="text-[var(--text)] font-semibold">{contract.name}</span>
                </span>
              </div>
              <div className="text-[10.5px] font-mono font-bold uppercase tracking-widest text-[#00D9FF] bg-[#00D9FF]/10 px-3 py-1 rounded-full border border-[#00D9FF]/20">
                {Math.round(zoom * 100)}% SCALE
              </div>
            </div>

            {/* Dark Workspace Desk with centered A4 pages */}
            <div
              ref={workspaceRef}
              className="w-full overflow-x-auto overflow-y-auto p-6 sm:p-10 flex flex-col items-center custom-scrollbar relative shadow-[inset_0_0_100px_rgba(0,0,0,0.5)]"
              style={{
                backgroundColor: "#0A0A0A",
                backgroundImage: `
                  radial-gradient(circle at 50% 0%, rgba(0, 217, 255, 0.08) 0%, transparent 50%),
                  radial-gradient(circle at 100% 100%, rgba(34, 197, 94, 0.05) 0%, transparent 50%),
                  linear-gradient(to right, rgba(255, 255, 255, 0.02) 1px, transparent 1px),
                  linear-gradient(to bottom, rgba(255, 255, 255, 0.02) 1px, transparent 1px)
                `,
                backgroundSize: "100% 100%, 100% 100%, 40px 40px, 40px 40px",
                backgroundPosition: "0 0, 0 0, -1px -1px, -1px -1px",
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
            <div className="mt-3 text-xs text-[var(--text-3)] font-medium px-1 flex items-center gap-2">
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

