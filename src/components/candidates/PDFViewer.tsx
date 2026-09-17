"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import * as pdfjs from "pdfjs-dist";
import { clsx } from "clsx";
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  Download,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  FileText,
  AlertCircle,
  Loader2,
  Layers,
  Monitor,
} from "lucide-react";

// Configure PDFJS Worker using the unpkg CDN
const PDFJS_VERSION = pdfjs.version || "4.4.168";
pdfjs.GlobalWorkerOptions.workerSrc =
  `https://unpkg.com/pdfjs-dist@${PDFJS_VERSION}/build/pdf.worker.min.mjs`;

interface PDFViewerProps {
  url: string;
  filename?: string;
}

type ViewMode = "canvas" | "native";

export default function PDFViewer({ url, filename = "Resume.pdf" }: PDFViewerProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("canvas");
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.0);
  const [isFitWidth, setIsFitWidth] = useState<boolean>(true);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const pageRefs = useRef<{ [key: number]: HTMLDivElement | null }>({});
  const canvasRefs = useRef<{ [key: number]: HTMLCanvasElement | null }>({});
  const pdfDocRef = useRef<pdfjs.PDFDocumentProxy | null>(null);
  const activeRenderTasksRef = useRef<any[]>([]);

  // Calculate and apply optimal fit-to-width scale
  const computeFitWidth = useCallback(async (doc: pdfjs.PDFDocumentProxy) => {
    try {
      const page1 = await doc.getPage(1);
      const unscaled = page1.getViewport({ scale: 1.0 });
      const containerWidth =
        scrollContainerRef.current?.clientWidth ||
        containerRef.current?.clientWidth ||
        800;
      // Subtract margins/padding (e.g. 48px)
      const availableWidth = Math.max(containerWidth - 56, 300);
      const fitScale =
        Math.round((availableWidth / unscaled.width) * 100) / 100;
      return Math.min(Math.max(fitScale, 0.5), 2.2);
    } catch {
      return 1.0;
    }
  }, []);

  // Main document loading
  useEffect(() => {
    if (!url) {
      setLoading(false);
      setErrorMsg("No document URL provided");
      return;
    }

    let isCancelled = false;
    setLoading(true);
    setErrorMsg(null);
    setNumPages(0);
    setCurrentPage(1);

    const loadingTask = pdfjs.getDocument({
      url: url,
      useWorkerFetch: true,
      isEvalSupported: false,
    });

    loadingTask.promise
      .then(async (pdfDoc) => {
        if (isCancelled) return;
        pdfDocRef.current = pdfDoc;
        setNumPages(pdfDoc.numPages);
        setLoading(false);

        // Auto fit width on initial load
        const optimalScale = await computeFitWidth(pdfDoc);
        if (!isCancelled) {
          setScale(optimalScale);
          setIsFitWidth(true);
        }
      })
      .catch((err) => {
        if (isCancelled) return;
        console.error("[PDFViewer] PDF.js load error:", err);
        setErrorMsg(err.message || "Failed to load document via canvas renderer");
        setLoading(false);
        // Fall back to native browser viewer if PDF.js fails
        setViewMode("native");
      });

    return () => {
      isCancelled = true;
      try {
        loadingTask.destroy();
      } catch {}
    };
  }, [url, computeFitWidth]);

  // Handle window resizing when fit-width is active
  useEffect(() => {
    const handleResize = async () => {
      if (isFitWidth && viewMode === "canvas" && pdfDocRef.current) {
        const fitScale = await computeFitWidth(pdfDocRef.current);
        setScale(fitScale);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [isFitWidth, viewMode, computeFitWidth]);

  // Render all pages when pdfDoc, numPages, or scale changes
  useEffect(() => {
    if (viewMode !== "canvas" || !pdfDocRef.current || numPages === 0) return;

    // Cancel any ongoing render tasks
    activeRenderTasksRef.current.forEach((task) => {
      try {
        task.cancel();
      } catch {}
    });
    activeRenderTasksRef.current = [];

    const pdfDoc = pdfDocRef.current;
    let isCancelled = false;

    const renderPages = async () => {
      for (let p = 1; p <= numPages; p++) {
        if (isCancelled) break;
        try {
          const page = await pdfDoc.getPage(p);
          const canvas = canvasRefs.current[p];
          if (!canvas || isCancelled) continue;

          const context = canvas.getContext("2d");
          if (!context) continue;

          const pixelRatio = window.devicePixelRatio || 1;
          const viewport = page.getViewport({ scale });

          canvas.width = Math.floor(viewport.width * pixelRatio);
          canvas.height = Math.floor(viewport.height * pixelRatio);
          canvas.style.width = `${viewport.width}px`;
          canvas.style.height = `${viewport.height}px`;

          context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

          const renderTask = page.render({
            canvasContext: context,
            viewport: viewport,
          });

          activeRenderTasksRef.current.push(renderTask);
          await renderTask.promise;
        } catch (err: any) {
          if (err?.name !== "RenderingCancelledException") {
            console.error(`[PDFViewer] Error rendering page ${p}:`, err);
          }
        }
      }
    };

    renderPages();

    return () => {
      isCancelled = true;
      activeRenderTasksRef.current.forEach((task) => {
        try {
          task.cancel();
        } catch {}
      });
      activeRenderTasksRef.current = [];
    };
  }, [numPages, scale, viewMode]);

  // Track active page as user scrolls through the document
  const handleScroll = () => {
    const container = scrollContainerRef.current;
    if (!container || numPages <= 1) return;

    const containerTop = container.getBoundingClientRect().top;
    let closestPage = 1;
    let minDistance = Infinity;

    for (let p = 1; p <= numPages; p++) {
      const el = pageRefs.current[p];
      if (!el) continue;
      const rect = el.getBoundingClientRect();
      const distance = Math.abs(rect.top - containerTop);
      if (distance < minDistance) {
        minDistance = distance;
        closestPage = p;
      }
    }
    setCurrentPage(closestPage);
  };

  // Smooth scroll to specific page
  const scrollToPage = (pageNum: number) => {
    const target = Math.max(1, Math.min(numPages, pageNum));
    const el = pageRefs.current[target];
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      setCurrentPage(target);
    }
  };

  const handleZoomIn = () => {
    setScale((prev) => Math.min(2.5, Math.round((prev + 0.15) * 100) / 100));
    setIsFitWidth(false);
  };

  const handleZoomOut = () => {
    setScale((prev) => Math.max(0.4, Math.round((prev - 0.15) * 100) / 100));
    setIsFitWidth(false);
  };

  const handleResetZoom = () => {
    setScale(1.0);
    setIsFitWidth(false);
  };

  const handleFitWidthClick = async () => {
    if (!pdfDocRef.current) return;
    const fitScale = await computeFitWidth(pdfDocRef.current);
    setScale(fitScale);
    setIsFitWidth(true);
  };

  const handleFitPageClick = async () => {
    if (!pdfDocRef.current) return;
    try {
      const page1 = await pdfDocRef.current.getPage(currentPage || 1);
      const unscaled = page1.getViewport({ scale: 1.0 });
      const containerHeight = scrollContainerRef.current?.clientHeight || 600;
      const availableHeight = Math.max(containerHeight - 56, 300);
      const fitScale =
        Math.min(
          Math.max(
            Math.round((availableHeight / unscaled.height) * 100) / 100,
            0.4
          ),
          2.2
        );
      setScale(fitScale);
      setIsFitWidth(false);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div
      ref={containerRef}
      className={clsx(
        "flex flex-col gap-2.5 w-full transition-all duration-200",
        isFullscreen
          ? "fixed inset-3 z-50 bg-[#0a0a0b]/98 backdrop-blur-2xl p-4 rounded-2xl border border-white/15 shadow-[0_0_60px_rgba(0,0,0,0.8)]"
          : "flex-1 min-h-0 h-[calc(98vh-220px)] min-h-[600px]"
      )}
    >
      {/* Modern High-Performance Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 px-3.5 py-2 rounded-xl border border-[#23262D] bg-[#111214] shadow-md select-none flex-shrink-0">
        {/* Left Section: Document Title & Pagination */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 max-w-[240px] sm:max-w-[320px]">
            <FileText className="w-4 h-4 text-[#00D9FF] flex-shrink-0" />
            <span
              className="text-xs font-semibold text-white truncate"
              title={filename}
            >
              {filename}
            </span>
          </div>

          {numPages > 1 && viewMode === "canvas" && (
            <div className="flex items-center gap-1 pl-3 border-l border-white/10">
              <button
                type="button"
                onClick={() => scrollToPage(currentPage - 1)}
                disabled={currentPage <= 1}
                className="w-6 h-6 rounded-md bg-black/40 hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent flex items-center justify-center text-zinc-300 transition-colors"
                title="Previous Page"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <span className="text-xs font-mono font-medium text-zinc-300 px-1">
                {currentPage} / {numPages}
              </span>
              <button
                type="button"
                onClick={() => scrollToPage(currentPage + 1)}
                disabled={currentPage >= numPages}
                className="w-6 h-6 rounded-md bg-black/40 hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent flex items-center justify-center text-zinc-300 transition-colors"
                title="Next Page"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Center Section: Zoom & Scale Controls (Canvas Mode) */}
        {viewMode === "canvas" && !loading && (
          <div className="flex items-center gap-1.5 flex-wrap">
            <div className="flex items-center gap-1 bg-black/40 border border-white/5 rounded-lg p-0.5">
              <button
                type="button"
                onClick={handleZoomOut}
                className="w-6 h-6 rounded flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
                title="Zoom Out"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={handleResetZoom}
                className="text-[11px] font-mono text-zinc-300 hover:text-white px-2 py-0.5 rounded transition-colors"
                title="Reset Zoom (100%)"
              >
                {Math.round(scale * 100)}%
              </button>
              <button
                type="button"
                onClick={handleZoomIn}
                className="w-6 h-6 rounded flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
                title="Zoom In"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
            </div>

            <button
              type="button"
              onClick={handleFitWidthClick}
              className={clsx(
                "px-2.5 py-1 rounded-lg text-xs font-medium transition-all duration-150",
                isFitWidth
                  ? "bg-[rgba(0,217,255,0.12)] text-[#00D9FF] border border-[rgba(0,217,255,0.35)] shadow-[0_0_10px_rgba(0,217,255,0.1)]"
                  : "text-zinc-400 hover:text-white bg-black/40 border border-white/5 hover:border-white/15"
              )}
              title="Fit to Width"
            >
              Fit Width
            </button>

            <button
              type="button"
              onClick={handleFitPageClick}
              className="px-2.5 py-1 rounded-lg text-xs font-medium text-zinc-400 hover:text-white bg-black/40 border border-white/5 hover:border-white/15 transition-all duration-150"
              title="Fit Page to Screen"
            >
              Fit Page
            </button>
          </div>
        )}

        {/* Right Section: Mode Switcher, Actions & Tools */}
        <div className="flex items-center gap-2">
          {/* Renderer Selector (Document vs Native Browser) */}
          <div className="inline-flex items-center p-0.5 rounded-lg bg-black/50 border border-white/10">
            <button
              type="button"
              onClick={() => setViewMode("canvas")}
              className={clsx(
                "px-2.5 py-1 rounded-md text-xs font-semibold transition-all",
                viewMode === "canvas"
                  ? "bg-[rgba(0,217,255,0.15)] text-[#00D9FF] border border-[rgba(0,217,255,0.3)] shadow-sm"
                  : "text-zinc-400 hover:text-zinc-200 border border-transparent"
              )}
              title="Document View (Multi-Page Canvas)"
            >
              Document
            </button>
            <button
              type="button"
              onClick={() => setViewMode("native")}
              className={clsx(
                "px-2.5 py-1 rounded-md text-xs font-semibold transition-all",
                viewMode === "native"
                  ? "bg-[rgba(0,217,255,0.15)] text-[#00D9FF] border border-[rgba(0,217,255,0.3)] shadow-sm"
                  : "text-zinc-400 hover:text-zinc-200 border border-transparent"
              )}
              title="Native Browser PDF Viewer"
            >
              Browser
            </button>
          </div>

          {/* Fullscreen Toggle */}
          <button
            type="button"
            onClick={() => setIsFullscreen((prev) => !prev)}
            className="w-7 h-7 rounded-lg bg-[#181a20] hover:bg-white/10 border border-white/10 flex items-center justify-center text-zinc-300 hover:text-white transition-colors"
            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen Preview"}
          >
            {isFullscreen ? (
              <Minimize2 className="w-3.5 h-3.5" />
            ) : (
              <Maximize2 className="w-3.5 h-3.5" />
            )}
          </button>

          {/* Open in New Tab */}
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="w-7 h-7 rounded-lg bg-[#181a20] hover:bg-white/10 border border-white/10 flex items-center justify-center text-zinc-300 hover:text-white transition-colors"
            title="Open PDF in new browser tab"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </a>

          {/* Direct Download Button */}
          <a
            href={url}
            download={filename}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 h-7 px-3 rounded-lg text-xs font-semibold bg-white/10 hover:bg-white/20 text-white border border-white/10 transition-all active:scale-95"
            title="Download PDF file"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Download</span>
          </a>
        </div>
      </div>

      {/* Main Viewport Container */}
      <div className="relative w-full flex-1 min-h-0 rounded-xl border border-[#23262D] bg-[#070809] overflow-hidden flex flex-col items-center justify-center shadow-inner">
        {/* Loading Spinner */}
        {loading && (
          <div className="absolute inset-0 bg-[#070809]/90 z-20 flex flex-col items-center justify-center gap-3 animate-fade-in">
            <Loader2 className="w-8 h-8 text-[#00D9FF] animate-spin" />
            <div className="text-xs font-semibold text-zinc-400 tracking-wider">
              Rendering document pages...
            </div>
          </div>
        )}

        {/* MODE 1: MULTI-PAGE CONTINUOUS CANVAS VIEWER */}
        {viewMode === "canvas" && (
          <div
            ref={scrollContainerRef}
            onScroll={handleScroll}
            className="w-full h-full overflow-y-auto overflow-x-auto p-4 sm:p-6 bg-[#060708] custom-scrollbar flex flex-col items-center"
          >
            {numPages > 0 ? (
              <div className="flex flex-col items-center gap-6 py-2">
                {Array.from({ length: numPages }, (_, i) => i + 1).map(
                  (pageNum) => (
                    <div
                      key={pageNum}
                      ref={(el) => {
                        pageRefs.current[pageNum] = el;
                      }}
                      className="relative flex flex-col items-center"
                    >
                      {/* Paper Document Card with Elevation */}
                      <div className="relative shadow-[0_10px_35px_rgba(0,0,0,0.6)] rounded-sm bg-white overflow-hidden border border-white/10">
                        <canvas
                          ref={(el) => {
                            canvasRefs.current[pageNum] = el;
                          }}
                          className="block max-w-none"
                        />
                      </div>

                      {/* Subtle Page Footer Label */}
                      {numPages > 1 && (
                        <div className="mt-2 text-[11px] font-mono text-zinc-500 select-none">
                          Page {pageNum} of {numPages}
                        </div>
                      )}
                    </div>
                  )
                )}
              </div>
            ) : (
              !loading && (
                <div className="flex flex-col items-center justify-center h-full text-center p-6 gap-3">
                  <AlertCircle className="w-10 h-10 text-amber-400" />
                  <div className="text-sm font-semibold text-white">
                    {errorMsg || "Unable to display document in canvas"}
                  </div>
                  <div className="text-xs text-zinc-400 max-w-sm">
                    Switch to the Native browser viewer or download the file directly.
                  </div>
                  <button
                    type="button"
                    onClick={() => setViewMode("native")}
                    className="mt-2 px-4 py-2 rounded-lg bg-[rgba(0,217,255,0.12)] text-[#00D9FF] border border-[rgba(0,217,255,0.35)] text-xs font-semibold transition-all hover:bg-[rgba(0,217,255,0.2)]"
                  >
                    Switch to Native Browser Viewer
                  </button>
                </div>
              )
            )}
          </div>
        )}

        {/* MODE 2: NATIVE BROWSER EMBED (NO CORS/HEAD BLOCK) */}
        {viewMode === "native" && (
          <div className="w-full h-full relative bg-[#1c1d22]">
            <iframe
              src={`${url}#toolbar=1&navpanes=0&view=FitH`}
              className="w-full h-full border-none rounded-xl"
              title={filename}
            />
          </div>
        )}
      </div>
    </div>
  );
}

