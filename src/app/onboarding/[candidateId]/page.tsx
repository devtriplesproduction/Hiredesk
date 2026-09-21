"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { FilterSelect, type FilterOption } from "@/components/candidates/FilterSelect";
import {
  UploadCloud,
  FileText,
  CheckCircle2,
  Clock,
  AlertCircle,
  ShieldCheck,
  Lock,
  ExternalLink,
  Sparkles,
  FileCheck,
  Loader2,
  RefreshCw,
  Info,
} from "lucide-react";

interface CandidateInfo {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  roleName?: string;
  status?: string;
}

interface UploadedDoc {
  id: string;
  fileName: string;
  filePath?: string;
  type: string;
  status: "pending" | "verified" | "rejected";
  createdAt: string;
  previewUrl?: string | null;
}

const REQUIRED_DOC_TYPES = [
  "Aadhaar Card",
  "PAN Card",
  "Most Recent Resume",
  "Latest Experience Letter (if applicable)",
  "Relieving Letter from Previous Employer (if applicable)",
  "Most Recent Education Certificate",
  "GitHub / Portfolio Profile Link",
];

const DOC_TYPE_OPTIONS: FilterOption[] = [
  { value: "Aadhaar Card", label: "Aadhaar Card (Front & Back)" },
  { value: "PAN Card", label: "PAN Card" },
  { value: "Most Recent Resume", label: "Most Recent Resume / CV" },
  { value: "Latest Experience Letter (if applicable)", label: "Latest Experience Letter" },
  { value: "Relieving Letter from Previous Employer (if applicable)", label: "Relieving Letter from Previous Employer" },
  { value: "Most Recent Education Certificate", label: "Most Recent Education Certificate" },
  { value: "GitHub / Portfolio Profile Link", label: "GitHub / Portfolio Profile Link" },
  { value: "Cancelled Cheque / Bank Passbook", label: "Cancelled Cheque / Bank Passbook (for Payroll)" },
  { value: "Other Document", label: "Other Supporting Document" },
];

export default function OnboardingPage({ params }: { params: { candidateId: string } }) {
  const { candidateId } = params;
  const [candidate, setCandidate] = useState<CandidateInfo | null>(null);
  const [documents, setDocuments] = useState<UploadedDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [docType, setDocType] = useState("Aadhaar Card");
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  useEffect(() => {
    fetchData();
  }, [candidateId]);

  async function fetchData() {
    setLoading(true);
    try {
      const res = await fetch(`/api/onboarding/${candidateId}`);
      if (res.ok) {
        const data = await res.json();
        setDocuments(data.documents || []);
        if (data.candidate) {
          setCandidate(data.candidate);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function processUpload(file: File) {
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setUploadError("File exceeds the maximum 5MB size limit. Please upload a smaller file.");
      setTimeout(() => setUploadError(null), 5000);
      return;
    }

    setUploading(true);
    setUploadError(null);
    setUploadSuccess(null);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("type", docType);

    try {
      const res = await fetch(`/api/onboarding/${candidateId}`, {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        setUploadSuccess(`"${file.name}" uploaded successfully! Our HR team will review it.`);
        setTimeout(() => setUploadSuccess(null), 6000);
        await fetchData();

        // Advance docType to the next un-uploaded document for convenience
        const currentUploadedTypes = new Set(documents.map(d => d.type));
        currentUploadedTypes.add(docType);
        const nextMissing = REQUIRED_DOC_TYPES.find(t => !currentUploadedTypes.has(t));
        if (nextMissing) {
          setDocType(nextMissing);
        }
      } else {
        const data = await res.json().catch(() => ({}));
        setUploadError(data.error || "Upload failed. Please verify your file and try again.");
      }
    } catch (err) {
      setUploadError("A network error occurred while uploading. Please check your connection.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }

  function handleFileInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files || !e.target.files[0]) return;
    processUpload(e.target.files[0]);
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processUpload(e.dataTransfer.files[0]);
    }
  }

  // Calculate completion statistics
  const uploadedDocTypeSet = new Set(documents.map(d => d.type));
  const verifiedCount = documents.filter(d => d.status === "verified").length;
  const inReviewCount = documents.filter(d => d.status === "pending").length;
  const rejectedCount = documents.filter(d => d.status === "rejected").length;

  return (
    <div className="min-h-screen bg-[var(--card-bg)] text-[var(--text)] flex flex-col items-center relative selection:bg-[#00D9FF]/20 selection:text-text font-sans">
      {/* Background ambient lighting effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-[20%] left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-gradient-to-b from-[#00D9FF]/[0.08] via-indigo-600/[0.04] to-transparent rounded-full blur-3xl" />
        <div className="absolute top-[40%] -left-[10%] w-[500px] h-[400px] bg-[#00D9FF]/[0.03] rounded-full blur-3xl" />
        <div className="absolute top-[60%] -right-[10%] w-[500px] h-[400px] bg-purple-600/[0.03] rounded-full blur-3xl" />
      </div>

      {/* Website Navigation Header matching HireDesk & TopBar */}
      <header
        className="w-full h-[62px] flex items-center justify-between px-4 sm:px-8 border-b border-[var(--border)] backdrop-blur-xl sticky top-0 z-40"
        style={{ background: "rgba(10, 11, 14, 0.88)" }}
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl overflow-hidden flex items-center justify-center flex-shrink-0 border border-[var(--border-2)] bg-glass-3 shadow-inner">
            <img src="/logo.png" alt="HireDesk Logo" className="w-full h-full object-cover" />
          </div>
          <div>
            <div className="text-sm sm:text-base font-bold tracking-tight leading-tight text-text">
              HireDesk
            </div>
            <div className="text-[16px] sm:text-[15px] text-[var(--text-3)] font-medium leading-tight">
              Triple S Production
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {/* Quick link to verification checklist */}
          <Link
            href={`/onboarding/${candidateId}/checklist`}
            className="hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold text-text-2 hover:text-text px-3.5 py-2 rounded-xl bg-[var(--glass)] hover:bg-[var(--glass-2)] border border-[var(--border-2)] transition-all"
          >
            <FileCheck size={14} className="text-[#00D9FF]" />
            <span>Verification Checklist</span>
          </Link>

          {/* Security SSL Badge */}
          <div className="inline-flex items-center gap-1.5 text-[15px] font-medium text-emerald-400/90 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1.5 rounded-xl">
            <ShieldCheck size={13} className="text-emerald-400" />
            <span className="hidden xs:inline">256-Bit SSL Encrypted</span>
            <span className="xs:hidden">Secure</span>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="w-full max-w-4xl px-4 sm:px-6 py-8 sm:py-10 z-10 flex flex-col gap-8">
        
        {/* Candidate Welcome Hero */}
        <section className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#00D9FF] bg-[#00D9FF]/10 border border-[#00D9FF]/20 px-2.5 py-1 rounded-full flex items-center gap-1.5">
                <Sparkles size={12} />
                Candidate Onboarding
              </span>
              {candidate?.roleName && (
                <span className="text-xs font-medium text-text-2 bg-[var(--glass)] border border-[var(--border)] px-2.5 py-1 rounded-full">
                  Role: <strong className="text-text">{candidate.roleName}</strong>
                </span>
              )}
            </div>

            {/* Overall status badge */}
            <div>
              {verifiedCount > 0 && verifiedCount === documents.length ? (
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full">
                  <CheckCircle2 size={13} />
                  Documents Verified
                </span>
              ) : inReviewCount > 0 ? (
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-full">
                  <Clock size={13} />
                  Review in Progress
                </span>
              ) : documents.length > 0 ? (
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#00D9FF] bg-[#00D9FF]/10 border border-[#00D9FF]/20 px-3 py-1 rounded-full">
                  <Info size={13} />
                  {documents.length} Submitted
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-text-2 bg-[var(--glass)] border border-[var(--border)] px-3 py-1 rounded-full">
                  Action Required
                </span>
              )}
            </div>
          </div>

          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-text">
            {candidate?.name ? (
              <>
                Welcome, <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-zinc-200 to-zinc-400">{candidate.name}</span>
              </>
            ) : (
              "Candidate Document Onboarding"
            )}
          </h1>
          <p className="text-sm sm:text-base text-text-2 max-w-2xl leading-relaxed">
            Please securely submit your requested verification and identity documents to complete your onboarding with{" "}
            <strong className="text-text font-semibold">Triple S Production</strong>.
          </p>
        </section>


        {/* Upload Form Card */}
        <section className="bg-[var(--card-bg)]/95 border border-[var(--border-2)] rounded-2xl p-6 sm:p-8 backdrop-blur-xl shadow-2xl relative overflow-hidden flex flex-col gap-6">
          {/* Subtle top card glow line */}
          <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-[#00D9FF]/40 to-transparent" />

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-lg font-bold text-text tracking-tight flex items-center gap-2">
                <UploadCloud size={20} className="text-[#00D9FF]" />
                Upload New Document
              </h2>
              <p className="text-xs sm:text-sm text-text-2 mt-1">
                Choose the document category and drag or browse your file to upload.
              </p>
            </div>
            <div className="text-xs font-mono text-text-3 bg-[var(--glass)] border border-[var(--border)] px-3 py-1 rounded-lg self-start sm:self-auto">
              Max 5MB • PDF, JPG, PNG
            </div>
          </div>

          {/* Feedback messages */}
          {uploadSuccess && (
            <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-300 text-xs sm:text-sm flex items-center gap-2.5 animate-fade-in">
              <CheckCircle2 size={16} className="text-emerald-400 flex-shrink-0" />
              <span>{uploadSuccess}</span>
            </div>
          )}
          {uploadError && (
            <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/25 text-red-300 text-xs sm:text-sm flex items-center gap-2.5 animate-fade-in">
              <AlertCircle size={16} className="text-red-400 flex-shrink-0" />
              <span>{uploadError}</span>
            </div>
          )}

          <div className="flex flex-col gap-5">
            {/* Document Type Dropdown */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-text-2 uppercase tracking-wider flex items-center justify-between">
                <span>Select Document Type</span>
                <span className="text-[15px] font-normal text-text-3 lowercase">select before uploading</span>
              </label>
              <FilterSelect
                options={DOC_TYPE_OPTIONS}
                value={docType}
                onChange={(val) => setDocType(val)}
                placeholder="Choose document type..."
                containerClassName="w-full"
                menuClassName="w-full max-w-none"
              />
            </div>

            {/* Interactive Drag & Drop Area */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => {
                if (!uploading && fileInputRef.current) {
                  fileInputRef.current.click();
                }
              }}
              className={`relative rounded-2xl p-8 sm:p-12 text-center transition-all duration-200 cursor-pointer border-2 border-dashed flex flex-col items-center justify-center gap-3 ${
                isDragOver
                  ? "border-[#00D9FF] bg-[#00D9FF]/[0.08] shadow-[0_0_24px_rgba(0,217,255,0.15)] scale-[1.01]"
                  : "border-[var(--border-2)] hover:border-white/30 bg-glass-2 hover:bg-white/[0.02]"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleFileInputChange}
                disabled={uploading}
                className="hidden"
                id="candidate-file-input"
              />

              {uploading ? (
                <div className="flex flex-col items-center justify-center gap-3 py-4">
                  <div className="w-12 h-12 rounded-2xl bg-[#00D9FF]/10 border border-[#00D9FF]/30 flex items-center justify-center text-[#00D9FF] animate-spin">
                    <Loader2 size={24} />
                  </div>
                  <div className="font-semibold text-sm sm:text-base text-text">
                    Encrypting & Uploading Document...
                  </div>
                  <div className="text-xs text-text-3 max-w-xs">
                    Please wait while your file is securely transferred to HireDesk cloud storage.
                  </div>
                </div>
              ) : (
                <>
                  <div
                    className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-200 ${
                      isDragOver
                        ? "bg-[#00D9FF]/20 text-[#00D9FF] border border-[#00D9FF]/40 scale-110"
                        : "bg-[var(--glass)] text-text-2 border border-[var(--border)] group-hover:text-text"
                    }`}
                  >
                    <UploadCloud size={28} />
                  </div>

                  <div className="flex flex-col items-center gap-1">
                    <div className="font-bold text-base sm:text-lg text-text">
                      {isDragOver ? "Drop your file here to upload" : "Click to browse or drag and drop"}
                    </div>
                    <div className="text-xs sm:text-sm text-text-2">
                      Uploading as: <span className="text-[#00D9FF] font-semibold">{docType}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-[15px] font-medium text-text-3 bg-[var(--glass)] border border-[var(--border)] px-2.5 py-1 rounded-md">
                      PDF, JPG, PNG
                    </span>
                    <span className="text-[15px] font-medium text-text-3 bg-[var(--glass)] border border-[var(--border)] px-2.5 py-1 rounded-md">
                      Up to 5MB
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>
        </section>

        {/* Uploaded Documents List */}
        <section className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base sm:text-lg font-bold text-text flex items-center gap-2">
              <FileText size={18} className="text-[#00D9FF]" />
              Your Uploaded Documents
              <span className="text-xs font-semibold text-text-2 bg-[var(--glass-2)] border border-[var(--border-2)] px-2 py-0.5 rounded-full">
                {documents.length}
              </span>
            </h2>

            <button
              type="button"
              onClick={fetchData}
              disabled={loading}
              className="inline-flex items-center gap-1.5 text-xs text-text-2 hover:text-text px-2.5 py-1 rounded-lg bg-[var(--glass)] hover:bg-[var(--glass-2)] border border-[var(--border)] transition-all"
              title="Refresh document status"
            >
              <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
              <span className="hidden xs:inline">Refresh</span>
            </button>
          </div>

          {loading ? (
            <div className="p-8 rounded-2xl bg-[var(--card-bg)]/60 border border-[var(--border)] flex items-center justify-center gap-3 text-text-2 text-sm">
              <Loader2 size={18} className="animate-spin text-[#00D9FF]" />
              <span>Fetching your documents...</span>
            </div>
          ) : documents.length === 0 ? (
            <div className="p-10 sm:p-12 rounded-2xl bg-[var(--card-bg)]/60 border border-dashed border-[var(--border-2)] flex flex-col items-center justify-center text-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-[var(--glass)] border border-[var(--border)] flex items-center justify-center text-text-3">
                <FileText size={22} />
              </div>
              <div className="font-semibold text-sm text-text-2">No documents uploaded yet</div>
              <div className="text-xs text-text-3 max-w-sm">
                Select your document type above and drop or browse files to start your onboarding verification.
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {documents.map((doc) => {
                const isPending = doc.status === "pending";
                const isVerified = doc.status === "verified";
                const isRejected = doc.status === "rejected";

                const formattedDate = doc.createdAt
                  ? new Date(doc.createdAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : null;

                return (
                  <div
                    key={doc.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 sm:px-5 sm:py-4 rounded-xl bg-[var(--card-bg)]/90 hover:bg-[var(--table-row-hover)] border border-[var(--border)] hover:border-white/[0.15] transition-all duration-150 shadow-sm group"
                  >
                    {/* Document Details */}
                    <div className="flex items-center gap-3.5 min-w-0 flex-1">
                      <div className="w-10 h-10 rounded-xl bg-[var(--glass)] border border-[var(--border)] flex items-center justify-center flex-shrink-0 text-indigo-400 group-hover:text-[#00D9FF] group-hover:border-[#00D9FF]/30 transition-all shadow-inner">
                        <FileText size={18} />
                      </div>

                      <div className="flex flex-col min-w-0 flex-1 gap-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className="text-sm font-semibold text-zinc-100 truncate max-w-[240px] sm:max-w-[360px]"
                            title={doc.fileName}
                          >
                            {doc.fileName}
                          </span>
                          <span className="text-[16px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md bg-[var(--glass-2)] border border-[var(--border)] text-text-2">
                            {doc.type}
                          </span>
                        </div>

                        <div className="flex items-center gap-3 text-xs text-text-3">
                          {formattedDate && <span>Uploaded {formattedDate}</span>}
                        </div>
                      </div>
                    </div>

                    {/* Status & View Actions */}
                    <div className="flex items-center gap-3 flex-shrink-0 self-end sm:self-center">
                      {/* Status Badges */}
                      <div>
                        {isPending && (
                          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-400 bg-amber-500/10 border border-amber-500/25 px-2.5 py-1 rounded-lg">
                            <Clock size={13} className="text-amber-400" />
                            <span>In Review</span>
                          </span>
                        )}
                        {isVerified && (
                          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/25 px-2.5 py-1 rounded-lg">
                            <CheckCircle2 size={13} className="text-emerald-400" />
                            <span>Verified</span>
                          </span>
                        )}
                        {isRejected && (
                          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-400 bg-red-500/10 border border-red-500/25 px-2.5 py-1 rounded-lg">
                            <AlertCircle size={13} className="text-red-400" />
                            <span>Re-upload Needed</span>
                          </span>
                        )}
                      </div>

                      {/* View Action */}
                      {doc.previewUrl && (
                        <a
                          href={doc.previewUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs font-semibold text-text-2 hover:text-text px-3 py-1.5 rounded-lg bg-[var(--glass)] hover:bg-white/[0.10] border border-[var(--border-2)] hover:border-white/[0.20] transition-all cursor-pointer"
                          title="Open document in new tab"
                        >
                          <ExternalLink size={13} className="text-text-2 group-hover:text-text" />
                          <span>View</span>
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Trust & Security Footer Banner */}
        <footer className="mt-4 pt-6 border-t border-[var(--border)] flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs text-text-3">
          <div className="flex items-center gap-2">
            <Lock size={14} className="text-emerald-400/80 flex-shrink-0" />
            <span>
              End-to-End Encrypted • All documents strictly restricted to authorized Triple S Production HR staff.
            </span>
          </div>

          <div className="flex items-center gap-4">
            <Link
              href={`/onboarding/${candidateId}/checklist`}
              className="text-[#00D9FF] hover:underline flex items-center gap-1 font-medium"
            >
              <span>Background Checklist</span>
              <ExternalLink size={12} />
            </Link>
          </div>
        </footer>

      </main>
    </div>
  );
}
