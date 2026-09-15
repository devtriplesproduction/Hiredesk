"use client";
import { useState, useRef, useCallback, useMemo } from "react";
import { useStore } from "@/lib/store";
import { Btn, dialog } from "@/components/ui";
import { parseResumeFile } from "@/lib/parser";
import type { Candidate } from "@/types";
import { clsx } from "clsx";

interface QueueItem {
  file: File;
  status: "wait" | "parsing" | "done" | "error";
  result?: Candidate;
  errorMsg?: string;
}

// ─── Concurrency-limited async runner ────────────────────────────────────────
// Prevents browser from being overwhelmed by processing too many PDFs simultaneously
async function runConcurrent<T>(
  tasks: (() => Promise<T>)[],
  maxConcurrent: number
): Promise<(T | null)[]> {
  const results: (T | null)[] = new Array(tasks.length).fill(null);
  let i = 0;

  async function worker() {
    while (i < tasks.length) {
      const idx = i++;
      try {
        results[idx] = await tasks[idx]();
      } catch {
        results[idx] = null;
      }
    }
  }

  const workers = Array.from({ length: Math.min(maxConcurrent, tasks.length) }, worker);
  await Promise.all(workers);
  return results;
}

export default function UploadZone() {
  const { roles, addCandidates } = useStore();
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [isDrag, setIsDrag] = useState(false);
  const [processing, setProcessing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // ─── Single-pass queue stats ──────────────────────────────────────────────
  const { waitCount, doneCount } = useMemo(() => {
    let wait = 0, done = 0;
    for (const item of queue) {
      if (item.status === "wait") wait++;
      else if (item.status === "done") done++;
    }
    return { waitCount: wait, doneCount: done };
  }, [queue]);

  const addFiles = useCallback((files: FileList | File[]) => {
    const pdfs = Array.from(files).filter(f => f.name.toLowerCase().endsWith(".pdf"));
    if (!pdfs.length) { dialog.warning("Please upload PDF files only."); return; }
    setQueue(prev => [...prev, ...pdfs.map(f => ({ file: f, status: "wait" as const }))]);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDrag(false);
    addFiles(e.dataTransfer.files);
  }, [addFiles]);

  const processAll = useCallback(async () => {
    if (!queue.some(q => q.status === "wait") || processing) return;
    setProcessing(true);

    const waitingIndices = queue
      .map((item, i) => item.status === "wait" ? i : -1)
      .filter(i => i !== -1);

    // Mark all as parsing in one state update
    setQueue(prev => prev.map((q, i) =>
      waitingIndices.includes(i) ? { ...q, status: "parsing" as const } : q
    ));

    const collectedCandidates: Candidate[] = [];

    // Build tasks for concurrency runner (max 3 parallel PDF parses)
    const tasks = waitingIndices.map(idx => async () => {
      try {
        const file = queue[idx].file;
        const candidate = await parseResumeFile(file, roles);

        // Upload original PDF file to Supabase storage
        try {
          const db = await import("@/lib/supabase");
          const publicUrl = await db.uploadResumeFile(file, candidate.id);
          candidate.resumeUrl = publicUrl;
        } catch (uploadError) {
          console.error(`Failed to upload PDF resume for ${candidate.name || "candidate"}:`, uploadError);
        }

        setQueue(prev => prev.map((q, i) =>
          i === idx ? { ...q, status: "done" as const, result: candidate } : q
        ));
        return candidate;
      } catch {
        setQueue(prev => prev.map((q, i) =>
          i === idx ? { ...q, status: "error" as const, errorMsg: "Could not parse" } : q
        ));
        return null;
      }
    });

    const results = await runConcurrent(tasks, 3);
    results.forEach(r => { if (r) collectedCandidates.push(r); });

    if (collectedCandidates.length) addCandidates(collectedCandidates);
    setProcessing(false);
  }, [queue, processing, roles, addCandidates]);

  const clearAll = useCallback(() => setQueue([]), []);
  const remove = useCallback((i: number) => setQueue(prev => prev.filter((_, idx) => idx !== i)), []);

  return (
    <div className="w-full animate-fade-in">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">
        {/* Left Column: Dropzone and Queue */}
        <div className="lg:col-span-2 flex flex-col gap-4">

          {/* Hidden file input — linked via id so label can trigger it natively on mobile */}
          <input
            ref={inputRef}
            id="resume-file-input"
            type="file"
            accept=".pdf,application/pdf"
            multiple
            className="hidden"
            onChange={e => e.target.files && addFiles(e.target.files)}
          />

          {/* Drop zone — on desktop supports drag & drop, on mobile the label triggers native picker */}
          <div
            className={clsx(
              "border-2 border-dashed rounded-2xl p-6 sm:p-8 lg:p-12 text-center transition-all duration-200",
              isDrag ? "border-white/40 bg-[var(--glass-2)]" : "border-[var(--border-2)] bg-[var(--glass)] hover:border-white/30 hover:bg-[var(--glass-2)]"
            )}
            onDragOver={e => { e.preventDefault(); setIsDrag(true); }}
            onDragLeave={() => setIsDrag(false)}
            onDrop={handleDrop}
          >
            <div className="text-4xl sm:text-5xl mb-3 sm:mb-4 opacity-30">📄</div>
            <div className="text-base sm:text-lg font-bold mb-1">Drop resumes here</div>
            <div className="text-xs sm:text-sm text-[var(--text-3)] mb-5">PDF files only · Bulk upload supported · Instant parsing</div>

            {/* Label-based button — most reliable cross-platform file picker trigger */}
            <label
              htmlFor="resume-file-input"
              className="inline-flex items-center gap-2 cursor-pointer font-semibold uppercase tracking-wide rounded-xl border text-sm px-4 py-2.5 transition-all duration-150 bg-[var(--glass-2)] text-[var(--text)] border-[var(--border-2)] hover:bg-[var(--glass-3)] hover:border-[var(--border-3)] active:scale-95 select-none"
            >
              📁 Browse / Upload Files
            </label>
          </div>


          {/* Queue */}
          {queue.length > 0 && (
            <div className="mt-2">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                <span className="text-sm font-semibold text-[var(--text-2)]">
                  {queue.length} file{queue.length !== 1 ? "s" : ""}
                  {doneCount > 0 && <span className="text-[var(--green)] ml-2">· {doneCount} done</span>}
                </span>
                <div className="flex gap-2">
                  <Btn variant="outline" size="sm" onClick={clearAll}>Clear All</Btn>
                  {waitCount > 0 && (
                    <Btn variant="primary" size="sm" onClick={processAll} disabled={processing}>
                      {processing
                        ? <span className="flex items-center gap-2"><span className="w-3 h-3 border-2 border-black/30 border-t-black rounded-full animate-spin" />Parsing…</span>
                        : `▶ Parse ${waitCount}`}
                    </Btn>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-2">
                {queue.map((item, i) => (
                  <div key={`${item.file.name}-${i}`} className="flex items-center gap-3 px-4 py-3 rounded-xl"
                    style={{ background: "var(--glass-2)", border: "1px solid var(--border)" }}>
                    <span className="text-xl flex-shrink-0">
                      {item.status === "done" ? "✅" : item.status === "error" ? "❌" : item.status === "parsing" ? "⏳" : "📄"}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{item.file.name}</div>
                      {item.result && (
                        <div className="text-xs text-[var(--text-3)] mt-0.5 font-medium">
                          <span className="text-[var(--green)]">{item.result.name}</span>
                          {" · "}{item.result.roleName}
                          {" · Score: "}<span className={item.result.score.total >= 70 ? "text-[var(--green)]" : item.result.score.total >= 45 ? "text-[var(--yellow)]" : "text-[var(--red)]"}>{item.result.score.total}</span>
                          {item.result.email && <span className="ml-1">· {item.result.email}</span>}
                        </div>
                      )}
                      {item.errorMsg && <div className="text-xs text-[var(--red)] mt-0.5">{item.errorMsg}</div>}
                    </div>

                    {item.status === "parsing" && (
                      <div className="w-5 h-5 rounded-full border-2 border-[var(--border)] border-t-white animate-spin flex-shrink-0" />
                    )}

                    <span className={clsx("text-xs font-semibold uppercase tracking-wider flex-shrink-0",
                      item.status === "done" ? "text-[var(--green)]"
                        : item.status === "parsing" ? "text-[var(--yellow)]"
                          : item.status === "error" ? "text-[var(--red)]"
                            : "text-[var(--text-3)]"
                    )}>
                      {item.status === "done" ? "Done" : item.status === "parsing" ? "Parsing…" : item.status === "error" ? "Error" : "Queued"}
                    </span>

                    <Btn onClick={() => remove(i)}
                      className="text-[var(--text-3)] hover:text-[var(--text)] transition-colors text-sm flex-shrink-0">✕</Btn>
                  </div>
                ))}
              </div>

              {doneCount > 0 && (
                <div className="mt-4 p-4 rounded-xl flex items-center gap-3"
                  style={{ background: "rgba(68,255,136,0.06)", border: "1px solid rgba(68,255,136,0.2)" }}>
                  <span className="text-xl">✅</span>
                  <div>
                    <div className="text-sm font-semibold text-[var(--green)]">{doneCount} resume{doneCount !== 1 ? "s" : ""} added to candidates</div>
                    <div className="text-xs text-[var(--text-3)] mt-0.5">Go to Candidates tab to review and update details</div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Column: Sidebar Guidelines — full width on mobile, sidebar on desktop */}
        <div className="flex flex-col gap-4">
          {/* How it works */}
          <div className="p-4 sm:p-5 rounded-xl flex flex-col" style={{ background: "var(--glass)", border: "1px solid var(--border)" }}>
            <div className="text-sm sm:text-base font-semibold mb-3">How parsing works</div>
            <div className="flex flex-col gap-3 sm:gap-4">
              {[
                ["⚡", "Instant Processing", "All PDFs processed in parallel using client-side concurrency control."],
                ["🔍", "Smart Extraction", "Auto-detects candidate names, emails, phones, locations, gender, and experience levels."],
                ["🎯", "Keyword Role Match", "Correlates qualifications directly with role keyword settings for precision ranking."],
                ["📊", "ATS Scoring", "Skills (40%) + Exp (25%) + Edu (20%) + Completeness (15%) = Overall candidate score."],
              ].map(([icon, title, desc]) => (
                <div key={title} className="flex gap-3">
                  <span className="text-lg flex-shrink-0">{icon}</span>
                  <div>
                    <div className="text-xs sm:text-sm font-semibold text-white">{title}</div>
                    <div className="text-xs text-[var(--text-3)] mt-0.5 leading-relaxed">{desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Secure Cloud Storage */}
          <div className="p-4 sm:p-5 rounded-xl flex flex-col" style={{ background: "var(--glass)", border: "1px solid var(--border)" }}>
            <div className="text-xs font-semibold text-[var(--text-3)] uppercase tracking-widest mb-2">Cloud Integration</div>
            <div className="text-xs sm:text-sm text-[var(--text-2)] leading-relaxed mb-3">
              Parsed resumes are automatically uploaded directly to your Supabase Storage bucket <strong>resumes</strong>.
            </div>
            <div className="flex items-center gap-2 p-2.5 rounded-lg text-xs font-mono" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid var(--border)" }}>
              <span className="text-[var(--green)]">●</span> Supabase Bucket Active
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
