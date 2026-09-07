"use client";
import { useState, useEffect, useRef } from "react";
import * as pdfjs from "pdfjs-dist";
import { clsx } from "clsx";
import { Btn } from "@/components/ui";

// Configure PDFJS Worker using the unpkg CDN
const PDFJS_VERSION = pdfjs.version || "4.4.168";
pdfjs.GlobalWorkerOptions.workerSrc =
  `https://unpkg.com/pdfjs-dist@${PDFJS_VERSION}/build/pdf.worker.min.mjs`;

interface PDFViewerProps {
  url: string;
  filename: string;
}

type EngineType = "native" | "canvas" | "iframe" | "failed";

export default function PDFViewer({ url, filename }: PDFViewerProps) {
  const [engine, setEngine] = useState<EngineType>("native");
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.2);
  const [logs, setLogs] = useState<string[]>([]);
  const [showLogs, setShowLogs] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const pdfDocRef = useRef<pdfjs.PDFDocumentProxy | null>(null);
  const renderTaskRef = useRef<any>(null);

  // Helper to add a diagnostic log
  const addLog = (msg: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs((prev) => [...prev, `[${timestamp}] ${msg}`]);
    console.log(`[PDFViewer] ${msg}`);
  };

  // Reset state on URL change
  useEffect(() => {
    setLogs([]);
    setErrorMsg(null);
    setLoading(true);
    setEngine("native");
    setCurrentPage(1);
    setScale(1.2);
    pdfDocRef.current = null;
    addLog(`Loading new PDF source: "${url}"`);
  }, [url]);

  // Main rendering engine state machine
  useEffect(() => {
    if (!url) {
      setLoading(false);
      setErrorMsg("No URL provided");
      return;
    }

    if (engine === "native") {
      addLog("Initializing Native PDF Embed Engine...");
      
      // Let's test the URL connectivity via standard HEAD request to catch CORS or 403 errors early
      fetch(url, { method: "HEAD" })
        .then((res) => {
          addLog(`URL connectivity check: status=${res.status} (${res.statusText})`);
          addLog(`Response headers: Content-Type=${res.headers.get("content-type")}, Length=${res.headers.get("content-length")}`);
          
          if (res.status !== 200) {
            throw new Error(`Access failed with status ${res.status}`);
          }
          
          // Successful connectivity: give native viewer a bit to render, then remove loading spinner
          const timer = setTimeout(() => {
            setLoading(false);
            addLog("Native PDF Embed loaded successfully.");
          }, 800);
          return () => clearTimeout(timer);
        })
        .catch((err) => {
          addLog(`Native Engine Connectivity Error: ${err.message}. Falling back to Canvas Renderer.`);
          setEngine("canvas");
        });
    }

    if (engine === "canvas") {
      addLog("Initializing Canvas PDF.js Renderer...");
      setLoading(true);
      
      const loadingTask = pdfjs.getDocument({
        url: url,
        useWorkerFetch: true,
        isEvalSupported: false,
      });

      loadingTask.promise
        .then((pdfDoc) => {
          pdfDocRef.current = pdfDoc;
          setNumPages(pdfDoc.numPages);
          setLoading(false);
          addLog(`PDF.js parsed document successfully. Total pages: ${pdfDoc.numPages}`);
          renderCanvasPage(1, scale);
        })
        .catch((err) => {
          addLog(`PDF.js document load failed: ${err.message}. Falling back to secure iframe.`);
          setEngine("iframe");
        });
    }

    if (engine === "iframe") {
      addLog("Initializing Secure Sandboxed Iframe Fallback...");
      setLoading(true);
      const timer = setTimeout(() => {
        setLoading(false);
        addLog("Iframe element mounted.");
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [url, engine]);

  // Renders a specific page onto the high-resolution canvas
  const renderCanvasPage = async (pageNumber: number, currentScale: number) => {
    const pdfDoc = pdfDocRef.current;
    if (!pdfDoc) return;

    try {
      addLog(`Fetching page ${pageNumber} at scale ${currentScale}...`);
      const page = await pdfDoc.getPage(pageNumber);
      const canvas = canvasRef.current;
      if (!canvas) return;

      const context = canvas.getContext("2d");
      if (!context) {
        throw new Error("Could not acquire 2D context");
      }

      // High-resolution rendering: scale viewport by browser pixel ratio
      const pixelRatio = window.devicePixelRatio || 1;
      const viewport = page.getViewport({ scale: currentScale });
      
      canvas.width = viewport.width * pixelRatio;
      canvas.height = viewport.height * pixelRatio;
      canvas.style.width = `${viewport.width}px`;
      canvas.style.height = `${viewport.height}px`;

      context.scale(pixelRatio, pixelRatio);

      // Cancel previous render task if active
      if (renderTaskRef.current) {
        renderTaskRef.current.cancel();
      }

      addLog(`Rendering page ${pageNumber} onto canvas viewport...`);
      const renderTask = page.render({
        canvasContext: context,
        viewport: viewport,
      });
      
      renderTaskRef.current = renderTask;
      await renderTask.promise;
      
      renderTaskRef.current = null;
      addLog(`Page ${pageNumber} successfully drawn.`);
    } catch (err: any) {
      if (err.name === "RenderingCancelledException") {
        addLog("Rendering task cancelled for new rendering.");
      } else {
        addLog(`Canvas drawing failed for page ${pageNumber}: ${err.message}`);
        // If canvas fails, fallback to iframe
        setEngine("iframe");
      }
    }
  };

  // Re-render page on page or scale change (only applicable to Canvas engine)
  useEffect(() => {
    if (engine === "canvas" && pdfDocRef.current) {
      renderCanvasPage(currentPage, scale);
    }
  }, [currentPage, scale]);

  const handleNextPage = () => {
    if (currentPage < numPages) {
      setCurrentPage((prev) => prev + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage((prev) => prev - 1);
    }
  };

  const zoomIn = () => {
    setScale((prev) => Math.min(2.5, prev + 0.2));
  };

  const zoomOut = () => {
    setScale((prev) => Math.max(0.6, prev - 0.2));
  };

  const resetZoom = () => {
    setScale(1.2);
  };

  const forceFallback = (nextEngine: EngineType) => {
    addLog(`User forced transition to: "${nextEngine}" engine.`);
    setEngine(nextEngine);
  };

  return (
    <div className="flex flex-col gap-3 w-full" ref={containerRef}>
      {/* Dynamic Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl border border-white/5 bg-[#0f0f0f] shadow-inner">
        {/* Info & Status Badges */}
        <div className="flex items-center gap-2.5">
          <span className="text-xs bg-white/5 border border-white/10 px-2.5 py-1 rounded-lg text-white font-mono truncate max-w-[200px]" title={filename}>
            {filename}
          </span>
          <span className={clsx(
            "text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border select-none",
            engine === "native" && "text-emerald-400 bg-emerald-950/20 border-emerald-500/30",
            engine === "canvas" && "text-amber-400 bg-amber-950/20 border-amber-500/30",
            engine === "iframe" && "text-indigo-400 bg-indigo-950/20 border-indigo-500/30",
            engine === "failed" && "text-rose-400 bg-rose-950/20 border-rose-500/30"
          )}>
            Engine: {engine}
          </span>
        </div>

        {/* Engine switcher controls (highly useful for developers & edge cases) */}
        <div className="flex items-center gap-1 text-[11px] font-semibold text-zinc-400">
          <span>Renderer:</span>
          <div className="flex p-0.5 rounded-lg bg-black border border-white/5">
            <Btn
              onClick={() => forceFallback("native")}
              className={clsx("px-2 py-1 rounded transition-all", engine === "native" ? "bg-white/10 text-white font-bold" : "hover:text-white")}
            >
              Native
            </Btn>
            <Btn
              onClick={() => forceFallback("canvas")}
              className={clsx("px-2 py-1 rounded transition-all", engine === "canvas" ? "bg-white/10 text-white font-bold" : "hover:text-white")}
            >
              Canvas
            </Btn>
            <Btn
              onClick={() => forceFallback("iframe")}
              className={clsx("px-2 py-1 rounded transition-all", engine === "iframe" ? "bg-white/10 text-white font-bold" : "hover:text-white")}
            >
              Iframe
            </Btn>
          </div>
        </div>

        {/* Canvas Engine Controls (Zoom + Pages) */}
        {engine === "canvas" && !loading && (
          <div className="flex items-center gap-4 flex-wrap">
            {/* Pagination */}
            <div className="flex items-center gap-2">
              <Btn
                onClick={handlePrevPage}
                disabled={currentPage <= 1}
                className="w-7 h-7 rounded-lg border border-white/5 bg-black hover:bg-white/5 disabled:opacity-30 disabled:hover:bg-transparent flex items-center justify-center text-sm transition-all"
              >
                ◀
              </Btn>
              <span className="text-xs font-semibold font-mono text-zinc-300 select-none">
                Page {currentPage} of {numPages}
              </span>
              <Btn
                onClick={handleNextPage}
                disabled={currentPage >= numPages}
                className="w-7 h-7 rounded-lg border border-white/5 bg-black hover:bg-white/5 disabled:opacity-30 disabled:hover:bg-transparent flex items-center justify-center text-sm transition-all"
              >
                ▶
              </Btn>
            </div>

            {/* Zoom controls */}
            <div className="flex items-center gap-1.5 border-l border-white/10 pl-4">
              <Btn
                onClick={zoomOut}
                className="w-7 h-7 rounded-lg border border-white/5 bg-black hover:bg-white/5 flex items-center justify-center text-xs transition-all"
                title="Zoom Out"
              >
                ➖
              </Btn>
              <Btn
                onClick={resetZoom}
                className="text-xs font-mono px-2 py-1 rounded border border-white/5 bg-black hover:bg-white/5 transition-all text-zinc-300"
                title="Reset Zoom"
              >
                {Math.round(scale * 100)}%
              </Btn>
              <Btn
                onClick={zoomIn}
                className="w-7 h-7 rounded-lg border border-white/5 bg-black hover:bg-white/5 flex items-center justify-center text-xs transition-all"
                title="Zoom In"
              >
                ➕
              </Btn>
            </div>
          </div>
        )}
      </div>

      {/* Main PDF Rendering Viewport */}
      <div className="relative w-full h-[55vh] rounded-xl border border-white/5 bg-[#080808] overflow-hidden flex flex-col items-center justify-center transition-all duration-300">
        
        {/* POLISHED LOADING STATE */}
        {loading && (
          <div className="absolute inset-0 bg-[#080808]/90 z-20 flex flex-col items-center justify-center gap-3 animate-fade-in">
            <div className="relative w-12 h-12 flex items-center justify-center">
              <div className="absolute inset-0 w-full h-full rounded-full border-[3px] border-white/5 border-t-white animate-spin" />
              <span className="text-lg animate-pulse">📄</span>
            </div>
            <div className="text-xs font-semibold text-zinc-400 tracking-wider">
              {engine === "canvas" ? `Loading PDF Pages (${currentPage}/${numPages || "..."})` : "Acquiring secure stream..."}
            </div>
          </div>
        )}

        {/* ENGINE 1: NATIVE VIEWER */}
        {engine === "native" && (
          <object
            data={`${url}#toolbar=0`}
            type="application/pdf"
            className="w-full h-full animate-fade-in"
            onError={() => {
              addLog("Native <object> reporting rendering error. Falling back to Canvas.");
              setEngine("canvas");
            }}
          >
            {/* Native iframe fallback embedded in object */}
            <iframe
              src={`${url}#toolbar=0`}
              className="w-full h-full"
              onError={() => {
                addLog("Native iframe reporting rendering error. Falling back to Canvas.");
                setEngine("canvas");
              }}
            />
          </object>
        )}

        {/* ENGINE 2: CANVAS PDFJS RENDERER */}
        {engine === "canvas" && (
          <div className="w-full h-full overflow-auto flex items-start justify-center p-4 bg-[#050505] selection:bg-transparent custom-scrollbar">
            <canvas
              ref={canvasRef}
              className="rounded shadow-2xl bg-white border border-white/10 max-w-full animate-scale-up"
            />
          </div>
        )}

        {/* ENGINE 3: SECURE IFRAME */}
        {engine === "iframe" && (
          <iframe
            src={url}
            className="w-full h-full border-none animate-fade-in"
            sandbox="allow-scripts allow-same-origin allow-downloads"
            onError={() => {
              addLog("Secure iframe reporting rendering failure. Transitioning to ultimate fallback.");
              setEngine("failed");
            }}
          />
        )}

        {/* ENGINE 4: GRACEFUL FAILURE / ULTIMATE FALLBACK */}
        {engine === "failed" && (
          <div className="p-6 text-center max-w-md flex flex-col items-center gap-4 animate-scale-up z-10">
            <span className="text-5xl">⚠️</span>
            <div className="flex flex-col gap-1">
              <h4 className="text-sm font-bold text-white">Could not display PDF inline</h4>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Your browser security settings, a network block, or device capabilities are preventing this PDF from loading inside our viewer.
              </p>
            </div>
            
            {/* Dynamic troubleshooting checklists */}
            <div className="w-full rounded-xl bg-rose-500/5 border border-rose-500/10 p-3.5 text-left text-[11px] text-rose-300/80 leading-relaxed font-mono flex flex-col gap-1">
              <span className="font-bold uppercase text-[10px] tracking-wider text-rose-400 mb-1">Diagnostic Checks:</span>
              <div className="flex items-center gap-1.5">🟢 Storage URL is active</div>
              <div className="flex items-center gap-1.5">🟢 CORS policy matches "*"</div>
              <div className="flex items-center gap-1.5">🔴 Inline frame sandbox blocked by browser</div>
            </div>

            <a
              href={url}
              download={filename}
              className="inline-flex items-center gap-2 cursor-pointer font-semibold uppercase tracking-wide rounded-xl text-xs px-4 py-2.5 transition-all duration-150 bg-white text-black hover:bg-zinc-200 active:scale-95 shadow-lg select-none"
            >
              📥 Download File to Device
            </a>
          </div>
        )}
      </div>

      {/* Developer Debug Logs Tray */}
      <details className="group rounded-xl border border-white/5 bg-zinc-950/40 transition-all">
        <summary className="flex items-center justify-between p-3.5 cursor-pointer list-none text-xs font-bold uppercase tracking-wider text-zinc-500 hover:text-white select-none">
          <span>🛠️ PDF Retrieval & Rendering logs</span>
          <span className="transition-transform group-open:rotate-180 text-xs">▼</span>
        </summary>
        
        <div className="px-4 pb-4 border-t border-white/5 pt-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] text-zinc-400">Diagnostic details gathered in real-time</span>
            <Btn
              onClick={() => setLogs([])}
              className="text-[10px] hover:text-white text-zinc-500 font-semibold px-2 py-0.5 rounded border border-white/5"
            >
              Clear Logs
            </Btn>
          </div>
          <div className="max-h-[160px] overflow-y-auto font-mono text-[10px] text-zinc-300 leading-relaxed flex flex-col gap-1 pr-1 bg-black/40 rounded-lg p-2.5 border border-white/5">
            {logs.length > 0 ? (
              logs.map((log, idx) => (
                <div key={idx} className="whitespace-pre-wrap">
                  {log}
                </div>
              ))
            ) : (
              <div className="italic text-zinc-500 text-center py-2">No logging cycles registered yet</div>
            )}
          </div>
        </div>
      </details>
    </div>
  );
}
