"use client";
import { useState, useRef, useCallback, useMemo, useEffect } from "react";
import { useStore } from "@/lib/store";
import { parseResumeFile } from "@/lib/parser";
import type { Candidate } from "@/types";
import { clsx } from "clsx";
import {
  UploadCloud,
  FileText,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Play,
  X,
  FolderOpen,
  Sparkles,
  Database,
} from "lucide-react";

interface QueueItem {
  file: File;
  status: "wait" | "parsing" | "done" | "error";
  result?: Candidate;
  errorMsg?: string;
}

type CloudStatus = "checking" | "connected" | "not_connected" | "error";

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

// ─── Static Constants for Information Cards ──────────────────────────────────
const HOW_IT_WORKS_STEPS = [
  {
    step: "01",
    title: "Resume Parsing",
    desc: "Extract candidate information from the uploaded PDF.",
    color: "text-sky-400",
    badgeBg: "bg-sky-500/10 border-sky-500/25",
  },
  {
    step: "02",
    title: "Smart Extraction",
    desc: "Identify name, email, phone, location, gender, experience, education, etc.",
    color: "text-amber-400",
    badgeBg: "bg-amber-500/10 border-amber-500/25",
  },
  {
    step: "03",
    title: "Role Matching",
    desc: "Match candidate information against the selected role and keywords.",
    color: "text-[#00D9FF]",
    badgeBg: "bg-[#00D9FF]/10 border-[#00D9FF]/25",
  },
  {
    step: "04",
    title: "ATS Scoring",
    desc: "Calculate the candidate's score using the existing scoring system.",
    color: "text-emerald-400",
    badgeBg: "bg-emerald-500/10 border-emerald-500/25",
  },
];

const ATS_WEIGHTS = [
  { label: "Skills", weight: "40%", pct: 40, barClass: "bg-[#00D9FF]", dotClass: "bg-[#00D9FF]" },
  { label: "Experience", weight: "25%", pct: 25, barClass: "bg-emerald-400", dotClass: "bg-emerald-400" },
  { label: "Education", weight: "20%", pct: 20, barClass: "bg-amber-400", dotClass: "bg-amber-400" },
  { label: "Profile Completeness", weight: "15%", pct: 15, barClass: "bg-purple-400", dotClass: "bg-purple-400" },
];

export default function UploadZone() {
  const { roles, addCandidates } = useStore();
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [isDrag, setIsDrag] = useState(false);
  const [processing, setProcessing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Cloud status state
  const [cloudStatus, setCloudStatus] = useState<CloudStatus>("checking");
  const [statusDetail, setStatusDetail] = useState<string>("Checking...");

  // Verify Supabase Cloud connection status on mount
  useEffect(() => {
    let isMounted = true;
    async function checkSupabase() {
      try {
        const { supabase } = await import("@/lib/supabase");
        const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
        if (!url || !key) {
          if (isMounted) {
            setCloudStatus("not_connected");
            setStatusDetail("Not connected");
          }
          return;
        }

        const { error } = await supabase.storage.from("resumes").list("", { limit: 1 });
        if (error) {
          if (isMounted) {
            setCloudStatus("error");
            setStatusDetail("Error");
          }
        } else {
          if (isMounted) {
            setCloudStatus("connected");
            setStatusDetail("Supabase Connected");
          }
        }
      } catch {
        if (isMounted) {
          setCloudStatus("error");
          setStatusDetail("Error");
        }
      }
    }
    checkSupabase();
    return () => {
      isMounted = false;
    };
  }, []);

  // ─── Single-pass queue stats ──────────────────────────────────────────────
  const { waitCount, doneCount } = useMemo(() => {
    let wait = 0,
      done = 0;
    for (const item of queue) {
      if (item.status === "wait") wait++;
      else if (item.status === "done") done++;
    }
    return { waitCount: wait, doneCount: done };
  }, [queue]);

  const addFiles = useCallback((files: FileList | File[]) => {
    const pdfs = Array.from(files).filter(f => f.name.toLowerCase().endsWith(".pdf"));
    if (!pdfs.length) {
      alert("Please upload PDF files only.");
      return;
    }
    setQueue(prev => [...prev, ...pdfs.map(f => ({ file: f, status: "wait" as const }))]);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDrag(false);
      addFiles(e.dataTransfer.files);
    },
    [addFiles]
  );

  const processAll = useCallback(async () => {
    if (!queue.some(q => q.status === "wait") || processing) return;
    setProcessing(true);

    const waitingIndices = queue
      .map((item, i) => (item.status === "wait" ? i : -1))
      .filter(i => i !== -1);

    // Mark all waiting as parsing in one state update
    setQueue(prev =>
      prev.map((q, i) =>
        waitingIndices.includes(i) ? { ...q, status: "parsing" as const } : q
      )
    );

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
          console.error(
            `Failed to upload PDF resume for ${candidate.name || "candidate"}:`,
            uploadError
          );
        }

        setQueue(prev =>
          prev.map((q, i) =>
            i === idx ? { ...q, status: "done" as const, result: candidate } : q
          )
        );
        return candidate;
      } catch {
        setQueue(prev =>
          prev.map((q, i) =>
            i === idx ? { ...q, status: "error" as const, errorMsg: "Could not parse" } : q
          )
        );
        return null;
      }
    });

    const results = await runConcurrent(tasks, 3);
    results.forEach(r => {
      if (r) collectedCandidates.push(r);
    });

    if (collectedCandidates.length) addCandidates(collectedCandidates);
    setProcessing(false);
  }, [queue, processing, roles, addCandidates]);

  const clearAll = useCallback(() => setQueue([]), []);
  const remove = useCallback(
    (i: number) => setQueue(prev => prev.filter((_, idx) => idx !== i)),
    []
  );

  return (
    <div className="w-full animate-fade-in">
      {/* Hidden file input — triggered via custom label / button */}
      <input
        ref={inputRef}
        id="resume-file-input"
        type="file"
        accept=".pdf,application/pdf"
        multiple
        className="hidden"
        onChange={e => e.target.files && addFiles(e.target.files)}
      />

      {/* Two-column layout: Left (Workflow ~66.6%) vs Right (Info ~33.3%) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-7 items-start">
        {/* ─── LEFT / PRIMARY AREA ─────────────────────────────────────── */}
        <div className="lg:col-span-8 flex flex-col gap-6 w-full min-w-0">
          {/* Upload Dropzone */}
          <div
            className={clsx(
              "rounded-2xl p-6 sm:p-8 lg:p-9 text-center transition-all duration-200 relative overflow-hidden border",
              isDrag
                ? "border-[#00D9FF] bg-[#00D9FF]/[0.04] shadow-[0_0_32px_rgba(0,217,255,0.12)] scale-[1.005]"
                : "border-[#24282F] bg-[#111316] hover:border-[#00D9FF]/40 hover:bg-[#131519] shadow-xl"
            )}
            onDragOver={e => {
              e.preventDefault();
              setIsDrag(true);
            }}
            onDragLeave={() => setIsDrag(false)}
            onDrop={handleDrop}
          >
            {/* Subtle background radial ambient glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-gradient-to-br from-[#00D9FF]/[0.03] to-transparent rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 flex flex-col items-center">
              {/* Visual Upload Icon */}
              <div
                className={clsx(
                  "w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center mb-4 transition-all duration-200 border shadow-inner",
                  isDrag
                    ? "bg-[#00D9FF]/10 text-[#00D9FF] border-[#00D9FF]/40 scale-110"
                    : "bg-[#16181D] text-[#00D9FF] border-[#292D35]"
                )}
              >
                <UploadCloud size={28} className="transition-transform duration-200" />
              </div>

              {/* Primary Text */}
              <h3 className="text-base sm:text-lg font-bold text-white tracking-tight mb-1.5">
                Drop resumes here
              </h3>

              {/* Secondary Text */}
              <p className="text-xs sm:text-sm text-[#9AA0AA] mb-3 max-w-md">
                Drag &amp; drop PDF resumes here, or browse your files
              </p>

              {/* Tertiary Information Pills */}
              <div className="inline-flex flex-wrap items-center justify-center gap-2 text-[11px] sm:text-xs text-[#7A808C] font-medium bg-[#16181C] px-3.5 py-1.5 rounded-full border border-[#242830] mb-6">
                <span>PDF files only</span>
                <span className="text-[#454B55]">•</span>
                <span>Multiple files supported</span>
                <span className="text-[#454B55]">•</span>
                <span>Automatic parsing</span>
              </div>

              {/* Primary Upload CTA Button */}
              <label
                htmlFor="resume-file-input"
                className="inline-flex items-center gap-2 cursor-pointer font-semibold text-xs sm:text-sm px-5 py-2.5 rounded-xl border bg-white hover:bg-[#F2F4F8] text-black border-white shadow-lg hover:shadow-white/10 active:scale-[0.98] transition-all duration-150 select-none"
              >
                <FolderOpen size={16} className="text-black" />
                <span>Browse / Upload Files</span>
              </label>
            </div>
          </div>

          {/* Uploaded File Queue Section */}
          {queue.length > 0 && (
            <div className="flex flex-col gap-3.5 pt-1 animate-fade-in">
              {/* Clean single-row header matching HireDesk visual density */}
              <div className="flex flex-wrap items-center justify-between gap-3 px-1">
                <div className="flex items-center gap-2.5">
                  <span className="w-2 h-2 rounded-full bg-[#00D9FF] shadow-[0_0_8px_rgba(0,217,255,0.6)]" />
                  <h2 className="text-sm sm:text-base font-bold text-white tracking-tight">
                    Uploaded Resumes
                  </h2>
                  <span className="text-xs font-mono font-medium px-2 py-0.5 rounded-md bg-[var(--glass-2)] text-[var(--text-2)] border border-[var(--border)]">
                    {queue.length} {queue.length === 1 ? "file" : "files"}
                  </span>
                  {doneCount > 0 && (
                    <span className="text-xs font-mono font-medium px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 flex items-center gap-1.5">
                      <CheckCircle2 size={12} />
                      {doneCount} parsed
                    </span>
                  )}
                </div>

                {/* Queue Actions */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={clearAll}
                    disabled={processing}
                    className="h-9 px-3.5 rounded-xl text-xs font-semibold uppercase tracking-wider text-[var(--text-2)] hover:text-white bg-[var(--glass-2)] hover:bg-[var(--glass-3)] border border-[var(--border)] hover:border-[var(--border-2)] transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed select-none"
                  >
                    Clear All
                  </button>

                  <button
                    type="button"
                    onClick={processAll}
                    disabled={processing || waitCount === 0}
                    className="h-9 inline-flex items-center gap-2 px-4 rounded-xl text-xs font-bold uppercase tracking-wider bg-white hover:bg-zinc-200 active:bg-zinc-300 text-black border border-white shadow-md hover:shadow-white/10 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98] select-none"
                  >
                    {processing ? (
                      <>
                        <Loader2 size={13} className="animate-spin text-black" />
                        <span>Parsing...</span>
                      </>
                    ) : (
                      <>
                        <Play size={12} className="fill-current text-black" />
                        <span>
                          Parse {waitCount} {waitCount === 1 ? "Resume" : "Resumes"}
                        </span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Single Clean Container for Resume Rows */}
              <div className="rounded-2xl border border-[#23272F] bg-[#111316] divide-y divide-[#1D2127] overflow-hidden shadow-lg">
                {queue.map((item, i) => (
                  <div
                    key={`${item.file.name}-${i}`}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 p-4 sm:p-5 hover:bg-[#13161B] hover:shadow-[inset_0_0_0_1px_rgba(0,217,255,0.18)] transition-all duration-200 group"
                  >
                    {/* Left: PDF Icon + Prominent Filename + Muted Metadata */}
                    <div className="flex items-start sm:items-center gap-4 min-w-0 flex-1">
                      <div className="w-11 h-11 rounded-xl bg-rose-500/[0.07] border border-rose-500/20 text-rose-400 flex items-center justify-center flex-shrink-0 group-hover:border-rose-500/35 group-hover:bg-rose-500/10 transition-colors">
                        <FileText size={20} className="text-rose-400/90 group-hover:text-rose-400 transition-colors" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div
                          className="text-[13.5px] sm:text-sm font-semibold text-white group-hover:text-white transition-colors truncate max-w-full"
                          title={item.file.name}
                        >
                          {item.file.name}
                        </div>

                        {/* Status detail string / Candidate result summary */}
                        {item.status === "wait" && (
                          <div className="text-xs text-[var(--text-3)] font-normal mt-1 flex items-center gap-1.5">
                            <span className="text-[var(--text-2)]">PDF document</span>
                            <span className="text-[#3A3F48]">•</span>
                            <span className="text-amber-400/80">Ready to parse</span>
                          </div>
                        )}

                        {item.status === "parsing" && (
                          <div className="text-xs text-amber-400 font-normal mt-1 flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                            <span>Extracting candidate text &amp; computing ATS score...</span>
                          </div>
                        )}

                        {item.status === "done" && item.result && (
                          <div className="text-xs text-[var(--text-2)] mt-1 flex flex-wrap items-center gap-2">
                            <span className="font-semibold text-[#E6E8EB]">
                              {item.result.name}
                            </span>
                            <span className="text-[#3A3F48]">•</span>
                            <span className="text-[var(--text-3)]">
                              {item.result.roleName}
                            </span>
                            <span className="text-[#3A3F48]">•</span>
                            <span
                              className={clsx(
                                "text-[11px] font-mono font-bold px-1.5 py-0.5 rounded-[5px] border inline-flex items-center justify-center",
                                item.result.score.total >= 70
                                  ? "score-hi"
                                  : item.result.score.total >= 45
                                  ? "score-mid"
                                  : "score-lo"
                              )}
                            >
                              Score {item.result.score.total}
                            </span>
                            {item.result.email && (
                              <>
                                <span className="text-[#3A3F48]">•</span>
                                <span className="text-[var(--text-3)] truncate max-w-[180px]">
                                  {item.result.email}
                                </span>
                              </>
                            )}
                          </div>
                        )}

                        {item.status === "error" && (
                          <div className="text-xs text-red-400 font-normal mt-1 flex items-center gap-1.5">
                            <AlertCircle size={13} />
                            <span>{item.errorMsg || "Could not parse candidate PDF"}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right: Badge Status + Remove Button */}
                    <div className="flex items-center justify-between sm:justify-end gap-3 flex-shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#1D2127]">
                      {item.status === "wait" && (
                        <span className="text-[10.5px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-[6px] bg-amber-500/[0.08] text-amber-300/90 border border-amber-500/25">
                          QUEUED
                        </span>
                      )}

                      {item.status === "parsing" && (
                        <span className="inline-flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-[6px] bg-amber-500/10 text-amber-400 border border-amber-500/25">
                          <Loader2 size={11} className="animate-spin" />
                          PROCESSING
                        </span>
                      )}

                      {item.status === "done" && (
                        <span className="inline-flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-[6px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/25">
                          <CheckCircle2 size={12} />
                          COMPLETED
                        </span>
                      )}

                      {item.status === "error" && (
                        <span className="inline-flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-[6px] bg-red-500/10 text-red-400 border border-red-500/25">
                          <AlertCircle size={12} />
                          FAILED
                        </span>
                      )}

                      <button
                        type="button"
                        onClick={() => remove(i)}
                        title="Remove file"
                        className="w-8 h-8 rounded-lg bg-[var(--glass-2)] hover:bg-rose-500/15 active:bg-rose-500/25 border border-[var(--border)] hover:border-rose-500/30 text-[var(--text-3)] hover:text-rose-400 flex items-center justify-center transition-all cursor-pointer"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Success Banner when files are completed */}
              {doneCount > 0 && (
                <div className="p-4 rounded-xl flex items-start sm:items-center gap-3.5 border border-emerald-500/25 bg-emerald-500/[0.05]">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 flex-shrink-0 mt-0.5 sm:mt-0">
                    <CheckCircle2 size={18} />
                  </div>
                  <div>
                    <div className="text-xs sm:text-sm font-semibold text-emerald-400">
                      {doneCount} {doneCount === 1 ? "resume" : "resumes"} successfully added to
                      the candidate pipeline
                    </div>
                    <div className="text-[11px] sm:text-xs text-[var(--text-2)] mt-0.5">
                      Review profile details, update hiring stages, and generate contracts in the
                      Candidates tab.
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ─── RIGHT / SECONDARY AREA ────────────────────────────────────── */}
        <div className="lg:col-span-4 flex flex-col gap-5 w-full">
          {/* How Parsing Works Card */}
          <div className="p-4 sm:p-5 rounded-2xl border border-[#24282E] bg-[#111316] flex flex-col gap-4 shadow-xl">
            <div className="flex items-center gap-2 pb-2.5 border-b border-[#20242A]">
              <Sparkles size={16} className="text-[#00D9FF]" />
              <h3 className="text-sm font-bold text-white tracking-tight">How parsing works</h3>
            </div>

            <div className="flex flex-col gap-3.5">
              {HOW_IT_WORKS_STEPS.map(item => (
                <div key={item.step} className="flex items-start gap-3">
                  <span
                    className={clsx(
                      "text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border flex-shrink-0 mt-0.5 select-none",
                      item.color,
                      item.badgeBg
                    )}
                  >
                    {item.step}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-semibold text-white tracking-tight">
                      {item.title}
                    </div>
                    <div className="text-[11px] text-[#8A909B] mt-0.5 leading-relaxed">
                      {item.desc}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ATS Scoring Breakdown Card */}
          <div className="p-4 sm:p-5 rounded-2xl border border-[#24282E] bg-[#111316] flex flex-col gap-3.5 shadow-xl">
            <div className="flex items-center justify-between pb-2 border-b border-[#20242A]">
              <div className="text-[11px] font-bold uppercase tracking-wider text-[#8A909B]">
                ATS Score
              </div>
              <span className="text-[10px] font-mono text-[#6A717E]">100% Total</span>
            </div>

            {/* Segmented multi-colored progress bar */}
            <div className="h-2 w-full rounded-full bg-[#17191E] overflow-hidden flex gap-0.5 p-0.5 border border-[#242830]">
              {ATS_WEIGHTS.map(w => (
                <div
                  key={w.label}
                  style={{ width: `${w.pct}%` }}
                  className={clsx("h-full rounded-sm transition-all duration-300", w.barClass)}
                  title={`${w.label}: ${w.weight}`}
                />
              ))}
            </div>

            {/* Compact Breakdown rows */}
            <div className="flex flex-col gap-2 pt-1">
              {ATS_WEIGHTS.map(w => (
                <div key={w.label} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 text-[#C4C9D3]">
                    <span className={clsx("w-2 h-2 rounded-full", w.dotClass)} />
                    <span className="text-xs font-medium text-[#B2B8C3]">{w.label}</span>
                  </div>
                  <span className="font-mono font-semibold text-white text-xs">{w.weight}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Cloud Integration Card */}
          <div className="p-4 sm:p-5 rounded-2xl border border-[#24282E] bg-[#111316] flex flex-col gap-3.5 shadow-xl">
            <div className="flex items-center justify-between pb-2 border-b border-[#20242A]">
              <div className="text-[11px] font-bold uppercase tracking-wider text-[#8A909B]">
                Cloud Integration
              </div>
              <Database size={14} className="text-[#6A717E]" />
            </div>

            <div>
              <div className="text-xs font-semibold text-white tracking-tight">
                Resume storage
              </div>
              <div className="text-xs text-[#8A909B] mt-1 leading-relaxed">
                Automatically stores parsed resumes in the configured Supabase Storage bucket.
              </div>
            </div>

            {/* Dynamic Status Pill */}
            <div
              className={clsx(
                "flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium border transition-colors select-none",
                cloudStatus === "connected" &&
                  "bg-emerald-500/10 border-emerald-500/25 text-emerald-400",
                cloudStatus === "checking" &&
                  "bg-[#17191E] border-[#252932] text-[#8A909B]",
                cloudStatus === "not_connected" &&
                  "bg-amber-500/10 border-amber-500/25 text-amber-400",
                cloudStatus === "error" &&
                  "bg-rose-500/10 border-rose-500/25 text-rose-400"
              )}
            >
              <span
                className={clsx(
                  "w-2 h-2 rounded-full",
                  cloudStatus === "connected" && "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]",
                  cloudStatus === "checking" && "bg-[#8A909B] animate-pulse",
                  cloudStatus === "not_connected" && "bg-amber-400",
                  cloudStatus === "error" && "bg-rose-400"
                )}
              />
              <span className="font-semibold text-[11.5px]">{statusDetail}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
