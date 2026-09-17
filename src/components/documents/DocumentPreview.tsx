"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { generateDocument, DocumentData } from "./documentGenerator";
import { getBrandAssetUrl } from "@/lib/supabase";

interface DocumentPreviewProps {
  documentType: string;
  data: DocumentData;
  onFieldChange?: (field: keyof DocumentData, value: string) => void;
  onContentChange?: (html: string) => void;
}

export const DocumentPreview: React.FC<DocumentPreviewProps> = ({
  documentType,
  data,
  onFieldChange,
  onContentChange,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const prevDocTypeRef = useRef<string>("");
  const isInternalUpdateRef = useRef<boolean>(false);
  const [logoUrl, setLogoUrl] = useState<string>("/logo.png");

  useEffect(() => {
    async function fetchAssets() {
      try {
        const logo = await getBrandAssetUrl("tsp_logo");
        if (logo) setLogoUrl(logo);
      } catch (e) {
        console.error("Failed to load logo", e);
      }
    }
    fetchAssets();
  }, []);

  const makePagesEditable = useCallback((container: HTMLElement) => {
    const pages = container.querySelectorAll<HTMLElement>(".page");
    pages.forEach((page) => {
      page.setAttribute("contenteditable", "true");
      page.setAttribute("spellcheck", "false");
    });

    // Make non-text elements non-editable to prevent accidental deletion or corruption
    const nonEditable = container.querySelectorAll<HTMLElement>(
      "img, svg, .badge, .page-wm, .wm, .hd-logo-img, .arrow, .sig-line, .strip .cell .lbl, .infocard2 .hd2"
    );
    nonEditable.forEach((el) => {
      el.setAttribute("contenteditable", "false");
    });
  }, []);

  // Handle initial render or template type change
  useEffect(() => {
    if (!containerRef.current) return;

    if (prevDocTypeRef.current !== documentType) {
      prevDocTypeRef.current = documentType;
      const activeLogo = logoUrl || "/logo.png";
      const html = generateDocument(
        documentType,
        data,
        activeLogo,
        activeLogo,
        activeLogo
      );
      containerRef.current.innerHTML = html;
      makePagesEditable(containerRef.current);
    }
  }, [documentType, logoUrl, makePagesEditable]);

  // Sync external data changes (e.g. from the left-side form) into preview DOM
  useEffect(() => {
    if (!containerRef.current) return;

    // If change was triggered from within the preview itself, avoid mutating focused element to preserve cursor
    if (isInternalUpdateRef.current) {
      isInternalUpdateRef.current = false;
      return;
    }

    const activeEl = document.activeElement;
    const isFocusedInPreview = containerRef.current.contains(activeEl);

    Object.keys(data).forEach((key) => {
      const fieldKey = key as keyof DocumentData;
      const val = data[fieldKey];
      if (val === undefined || val === null) return;

      const matchingEls = containerRef.current?.querySelectorAll<HTMLElement>(`[data-field="${fieldKey}"]`);
      matchingEls?.forEach((el) => {
        // If this specific element is currently focused by the user's cursor, don't clobber it
        if (isFocusedInPreview && (activeEl === el || el.contains(activeEl))) {
          return;
        }
        const stringVal = String(val);
        if (el.innerText !== stringVal) {
          el.innerText = stringVal;
        }
      });
    });
  }, [data]);

  // Handle direct cursor editing on the document preview
  const handleInput = (e: React.FormEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement | null;
    if (!target) return;

    isInternalUpdateRef.current = true;

    // Check if target is or is within a registered data-field
    const fieldEl = target.closest<HTMLElement>("[data-field]");
    if (fieldEl) {
      const fieldKey = fieldEl.getAttribute("data-field") as keyof DocumentData;
      const newVal = fieldEl.innerText;
      if (fieldKey && onFieldChange) {
        onFieldChange(fieldKey, newVal);
      }
    }

    if (onContentChange && containerRef.current) {
      onContentChange(containerRef.current.innerHTML);
    }
  };

  return (
    <div className="document-studio-wrapper w-full flex flex-col items-center">
      <div
        id="previewWrap"
        className="preview cursor-text"
        ref={containerRef}
        onInput={handleInput}
      />
    </div>
  );
};
