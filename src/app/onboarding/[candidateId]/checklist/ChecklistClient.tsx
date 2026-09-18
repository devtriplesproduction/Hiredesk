"use client";

import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { DocumentPreview } from "@/components/documents/DocumentPreview";
import { DocumentData } from "@/components/documents/documentGenerator";
import {
  FileText,
  Download,
  Printer,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Sparkles,
  UploadCloud,
  ChevronRight,
  Building2,
  Briefcase,
  Calendar,
  Loader2,
} from "lucide-react";

interface ChecklistClientProps {
  candidateId: string;
  candidate: {
    id: string;
    name: string;
    email?: string;
    phone?: string;
    roleName?: string;
  };
  offer?: any;
  documentData: DocumentData;
}

export function ChecklistClient({
  candidateId,
  candidate,
  offer,
  documentData,
}: ChecklistClientProps) {
  const [zoomScale, setZoomScale] = useState<number>(100);
  const [downloading, setDownloading] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);

  // Enable vertical scrolling on desktop, overriding global app shell overflow:hidden
  useEffect(() => {
    const origHtmlOverflow = document.documentElement.style.overflow;
    const origBodyOverflow = document.body.style.overflow;
    const origHtmlHeight = document.documentElement.style.height;
    const origBodyHeight = document.body.style.height;

    document.documentElement.style.overflow = "auto";
    document.documentElement.style.overflowX = "hidden";
    document.documentElement.style.height = "auto";
    document.body.style.overflow = "auto";
    document.body.style.overflowX = "hidden";
    document.body.style.height = "auto";

    return () => {
      document.documentElement.style.overflow = origHtmlOverflow;
      document.documentElement.style.overflowX = "";
      document.documentElement.style.height = origHtmlHeight;
      document.body.style.overflow = origBodyOverflow;
      document.body.style.overflowX = "";
      document.body.style.height = origBodyHeight;
    };
  }, []);

  // Generate PDF blob from document DOM
  const generatePdfBlob = async (): Promise<Blob | null> => {
    try {
      if (typeof document !== "undefined" && document.fonts) {
        await document.fonts.ready;
      }

      const html2canvas = (await import("html2canvas")).default;
      const { jsPDF } = await import("jspdf");

      const container = previewRef.current || document.querySelector(".document-studio-wrapper");
      if (!container) return null;

      let pages: HTMLElement[] = [];
      const found = container.querySelectorAll<HTMLElement>(".page");
      if (found.length > 0) pages = Array.from(found);

      if (pages.length === 0) {
        const fallback = document.querySelectorAll<HTMLElement>(".document-studio-wrapper .page, .preview .page");
        if (fallback.length > 0) pages = Array.from(fallback);
      }

      if (pages.length === 0) {
        throw new Error("No document page found to render.");
      }

      // Pre-load all images
      const images = Array.from(container.querySelectorAll<HTMLImageElement>("img"));
      await Promise.all(
        images.map((img) => {
          if (img.complete) return Promise.resolve();
          return new Promise<void>((resolve) => {
            img.onload = () => resolve();
            img.onerror = () => resolve();
            setTimeout(resolve, 1200);
          });
        })
      );

      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
        compress: true,
      });
      const pdfWidth = pdf.internal.pageSize.getWidth(); // 210mm
      const pdfHeight = pdf.internal.pageSize.getHeight(); // 297mm

      for (let i = 0; i < pages.length; i++) {
        const page = pages[i];
        const isCover = page.classList.contains("cover");

        const canvas = await html2canvas(page, {
          scale: 2,
          useCORS: true,
          allowTaint: true,
          logging: false,
          backgroundColor: isCover ? "#111111" : "#ffffff",
          windowWidth: 1200,
          onclone: (clonedDoc) => {
            const clonedPages = clonedDoc.querySelectorAll<HTMLElement>(".page");
            clonedPages.forEach((p) => {
              p.removeAttribute("contenteditable");
              p.style.boxShadow = "none";
              p.style.borderRadius = "0px";
              p.style.margin = "0";
              p.style.transform = "none";
            });
          },
        });

        const imgData = canvas.toDataURL("image/png");
        if (i > 0) pdf.addPage("a4", "portrait");

        const canvasRatio = canvas.height / canvas.width;
        const targetHeight = pdfWidth * canvasRatio;
        const finalHeight = Math.min(targetHeight, pdfHeight);

        pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, finalHeight, undefined, "FAST");
      }

      return pdf.output("blob");
    } catch (err) {
      console.error("Failed to generate PDF:", err);
      return null;
    }
  };

  // Direct PDF Download
  const handleDownloadPdf = async () => {
    setDownloading(true);
    try {
      const blob = await generatePdfBlob();
      if (!blob) throw new Error("Could not generate PDF");

      const safeName = (candidate.name || "Candidate").replace(/[^a-zA-Z0-9_-]/g, "_");
      const filename = `${safeName}_Background_Verification_Checklist.pdf`;

      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 4000);
    } catch (e) {
      console.error("Download failed:", e);
      window.print();
    } finally {
      setDownloading(false);
    }
  };

  const displayRole = documentData.designation || candidate.roleName || "Candidate";
  const displayDepartment = documentData.department || "Development";

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] flex flex-col items-center relative selection:bg-white/15 selection:text-white">
      {/* Embedded print stylesheet */}
      <style jsx global>{`
        @media print {
          body, html {
            background: #ffffff !important;
            color: #000000 !important;
            overflow: visible !important;
          }
          .print-hide {
            display: none !important;
          }
          .document-studio-wrapper {
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          .document-studio-wrapper .page {
            box-shadow: none !important;
            border-radius: 0 !important;
            margin: 0 !important;
            transform: none !important;
          }
        }
      `}</style>

      {/* Website Navigation Header matching TopBar */}
      <header
        className="w-full h-[58px] sm:h-[60px] flex items-center justify-between px-4 sm:px-8 border-b border-[var(--border)] backdrop-blur-md sticky top-0 z-40 print-hide"
        style={{ background: "rgba(10,10,10,0.92)" }}
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl overflow-hidden flex items-center justify-center flex-shrink-0 border border-[var(--border)] bg-black/40">
            <img src="/logo.png" alt="HireDesk Logo" className="w-full h-full object-cover" />
          </div>
          <div>
            <div className="text-sm sm:text-base font-bold tracking-tight leading-tight text-white">
              HireDesk
            </div>
            <div className="text-[16px] sm:text-[15px] text-[var(--text-3)] font-medium leading-tight">
              Triple S Production
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href={`/onboarding/${candidateId}`}
            className="inline-flex items-center gap-1.5 font-semibold text-xs sm:text-sm px-3.5 py-2 rounded-xl bg-white text-black hover:bg-white/90 transition-all border border-white shadow-sm"
          >
            <UploadCloud size={15} />
            <span>Upload Documents</span>
          </Link>
        </div>
      </header>

      <div className="max-w-5xl w-full flex flex-col gap-6 px-4 py-8 md:py-10">
        {/* Breadcrumb Bar */}
        <div className="flex items-center gap-2 text-xs font-medium text-[var(--text-3)] tracking-wider uppercase px-1 print-hide">
          <Link href={`/onboarding/${candidateId}`} className="hover:text-white transition-colors">
            HireDesk
          </Link>
          <ChevronRight size={13} className="text-[var(--text-3)]" />
          <Link href={`/onboarding/${candidateId}`} className="hover:text-white transition-colors">
            Onboarding
          </Link>
          <ChevronRight size={13} className="text-[var(--text-3)]" />
          <span className="text-[var(--text-2)] font-semibold">Verification Checklist</span>
        </div>

        {/* Hero Card matching HireDesk glass card design */}
        <div className="bg-[var(--glass)] border border-[var(--border)] rounded-2xl p-6 sm:p-8 backdrop-blur-xl shadow-xl flex flex-col items-center text-center animate-fade-in print-hide">
          {/* Pill Header */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--glass-2)] border border-[var(--border-2)] text-[15px] font-mono uppercase tracking-widest text-[#00D9FF] mb-3">
            <Sparkles size={12} className="text-[#00D9FF]" />
            <span>Pre-Employment Verification</span>
          </div>

          {/* Main Title */}
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white mb-2">
            Document Verification Checklist
          </h1>

          {/* Candidate Subtitle */}
          <p className="max-w-2xl text-xs sm:text-sm text-[var(--text-2)] leading-relaxed mb-5">
            Official verification checklist for{" "}
            <span className="font-semibold text-white">{candidate.name}</span>. Please review the
            required pre-employment documents and submit authentic copies prior to your joining date.
          </p>

          {/* Info Badges Row */}
          <div className="flex flex-wrap items-center justify-center gap-2.5">
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[var(--glass)] border border-[var(--border)] text-xs text-[var(--text-2)] font-medium">
              <Briefcase size={13} className="text-[var(--text-3)]" />
              <span>{displayRole}</span>
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[var(--glass)] border border-[var(--border)] text-xs text-[var(--text-2)] font-medium">
              <Building2 size={13} className="text-[var(--text-3)]" />
              <span>{displayDepartment}</span>
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[var(--glass)] border border-[var(--border)] text-xs text-[var(--text-2)] font-medium">
              <Calendar size={13} className="text-[var(--text-3)]" />
              <span>{documentData.letterDate || "Current"}</span>
            </div>
          </div>
        </div>

        {/* Document Studio Workspace */}
        <div className="w-full flex flex-col rounded-2xl border border-[var(--border)] bg-[var(--bg2)] shadow-2xl overflow-hidden print:border-none print:shadow-none print:bg-white">
          {/* Top Control Bar */}
          <div className="px-4 sm:px-6 py-3 bg-[var(--bg3)] border-b border-[var(--border)] flex items-center justify-between gap-3 print-hide">
            {/* Left: Document Title */}
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[var(--text-2)]">
              <FileText size={14} className="text-[#00D9FF]" />
              <span className="hidden sm:inline">Verification Checklist</span>
              <span className="text-[15px] font-normal normal-case text-[var(--text-3)]">· A4</span>
            </div>

            {/* Right: Zoom controls, Download, and Print */}
            <div className="flex items-center gap-2">
              {/* Zoom Controls */}
              <div className="flex items-center gap-1 bg-[var(--glass)] p-1 rounded-xl border border-[var(--border)]">
                <button
                  onClick={() => setZoomScale((prev) => Math.max(prev - 10, 60))}
                  title="Zoom out"
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-[var(--text-2)] hover:text-white hover:bg-[var(--glass-2)] transition-colors"
                >
                  <ZoomOut size={14} />
                </button>
                <span className="text-xs font-mono px-2 text-[var(--text-2)] select-none min-w-[42px] text-center">
                  {zoomScale}%
                </span>
                <button
                  onClick={() => setZoomScale((prev) => Math.min(prev + 10, 130))}
                  title="Zoom in"
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-[var(--text-2)] hover:text-white hover:bg-[var(--glass-2)] transition-colors"
                >
                  <ZoomIn size={14} />
                </button>
                <button
                  onClick={() => setZoomScale(100)}
                  title="Reset zoom"
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-[var(--text-3)] hover:text-white hover:bg-[var(--glass-2)] transition-colors ml-0.5"
                >
                  <RotateCcw size={12} />
                </button>
              </div>

              {/* Download PDF Button */}
              <button
                onClick={handleDownloadPdf}
                disabled={downloading}
                title="Download PDF"
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[var(--glass-2)] hover:bg-[var(--glass-3)] text-xs font-semibold text-white border border-[var(--border-2)] transition-all disabled:opacity-50"
              >
                {downloading ? (
                  <Loader2 size={13} className="animate-spin text-white" />
                ) : (
                  <Download size={13} className="text-white" />
                )}
                <span className="hidden sm:inline">Download</span>
              </button>

              {/* Print Button */}
              <button
                onClick={() => window.print()}
                title="Print or Save PDF"
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[var(--glass-2)] hover:bg-[var(--glass-3)] text-xs font-semibold text-[var(--text)] border border-[var(--border-2)] transition-all"
              >
                <Printer size={13} />
                <span className="hidden sm:inline">Print</span>
              </button>
            </div>
          </div>

          {/* Viewport Area */}
          <div className="w-full bg-[#0c0c0c] print:bg-white">
            <div
              ref={previewRef}
              className="w-full flex justify-center overflow-x-auto p-4 sm:p-8 md:p-12 custom-scrollbar print:p-0"
            >
              <div
                style={{
                  transform: `scale(${zoomScale / 100})`,
                  transformOrigin: "top center",
                }}
                className="w-max transition-transform duration-150 drop-shadow-[0_16px_40px_rgba(0,0,0,0.85)] my-2 print:my-0 print:drop-shadow-none"
              >
                <DocumentPreview
                  documentType="background-verification"
                  data={documentData}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer Note */}
        <div className="flex items-center justify-between text-xs text-[var(--text-3)] px-2 py-4 print-hide">
          <span>Triple S Production · Candidate Verification Services</span>
          <span>HireDesk Platform</span>
        </div>
      </div>
    </div>
  );
}
