"use client";
import { useStore } from "@/lib/store";
import { getDocumentSignedUrl } from "@/lib/supabase";
import { Btn,  ScoreBadge, StatusBadge, SkillTag } from "@/components/ui";
import type { Candidate } from "@/types";
import { clsx } from "clsx";
import { useRouter } from "next/navigation";
import { getPublicBaseUrl } from "@/lib/url";
import { useState, useEffect } from "react";
import PDFViewer from "@/components/candidates/PDFViewer";
import WhatsAppModal from "@/components/candidates/WhatsAppModal";
import EmailModal from "@/components/candidates/EmailModal";
import { DocumentStudioModal } from "@/components/documents/DocumentStudioModal";

interface Props { candidate: Candidate; onClose: () => void; }

const STATUSES: Candidate["status"][] = ["new", "review", "shortlisted", "interview_1", "interview_2", "approved", "offer", "offer_sent", "offer_accepted", "offer_rejected", "onboarding_requested", "onboarding_review", "onboarding_verified", "onboarding_rejected", "hired", "rejected"];

interface InfoField {
  key: keyof Candidate;
  label: string;
  icon: string;
  suffix?: string;
}

const INFO_FIELDS: InfoField[] = [
  { key: "email", label: "Email", icon: "✉" },
  { key: "phone", label: "Phone", icon: "📞" },
  { key: "city", label: "City", icon: "📍" },
  { key: "gender", label: "Gender", icon: "👤" },
  { key: "age", label: "Age", icon: "🎂", suffix: " yrs" },
  { key: "exp", label: "Experience", icon: "💼" },
  { key: "education", label: "Education", icon: "🎓" },
  { key: "appliedAt", label: "Applied", icon: "📅" },
];

export default function CandidateDetail({ candidate: c, onClose }: Props) {
  const { updateCandidate, deleteCandidate, interviews, addInterview, updateInterview, offers, addOffer, updateOffer, documents, updateDocument, employees, addEmployee, updateEmployee, employeeBonds, updateEmployeeBond, employeeResignations, addEmployeeResignation, roles } = useStore();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"profile" | "score" | "resume">("profile");
  const [resumeMode, setResumeMode] = useState<"pdf" | "text">(c.resumeUrl ? "pdf" : "text");
  const [isWhatsAppOpen, setIsWhatsAppOpen] = useState(false);
  const [isEmailOpen, setIsEmailOpen] = useState(false);
  const [isDocStudioOpen, setIsDocStudioOpen] = useState(false);
  const [docStudioType, setDocStudioType] = useState<string | undefined>();

  const candidateOffer = offers.find(o => o.candidateId === c.id);
  const candidateDocs = documents.filter(d => d.candidateId === c.id);
  const candidateEmployee = employees.find(e => e.candidateId === c.id);
  const candidateRole = roles.find(r => r.id === c.roleId);
  const employeeBond = candidateEmployee ? employeeBonds.find(b => b.employeeId === candidateEmployee.id) : null;
  const employeeResignation = candidateEmployee ? employeeResignations.find(r => r.employeeId === candidateEmployee.id) : null;

  const candidateInterviews = interviews.filter(i => i.candidateId === c.id);
  const r1 = candidateInterviews.find(i => i.round === 1);
  const r2 = candidateInterviews.find(i => i.round === 2);
  
  const [scheduleR1, setScheduleR1] = useState("");
  const [scheduleR2, setScheduleR2] = useState("");
  const [r1Notes, setR1Notes] = useState("");
  const [r2Notes, setR2Notes] = useState("");

  // Inline Editing States
  const [isEditing, setIsEditing] = useState(false);
  const [editState, setEditState] = useState<Partial<Candidate>>({});

  // Initialize/sync editState with candidate changes
  useEffect(() => {
    setEditState({
      name: c.name,
      email: c.email,
      phone: c.phone,
      city: c.city,
      gender: c.gender,
      age: c.age,
      exp: c.exp,
      education: c.education,
      note: c.note,
    });
  }, [c]);

  const [convertingToEmployee, setConvertingToEmployee] = useState(false);

  async function handleConvertToEmployee() {
    if (!candidateRole) return alert("Role details missing");
    setConvertingToEmployee(true);
    try {
      const res = await fetch("/api/employees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          candidateId: c.id,
          offerId: candidateOffer?.id || null,
          name: c.name,
          email: c.email,
          phone: c.phone,
          employmentType: candidateRole.type
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      addEmployee(data.employee);
      updateCandidate(c.id, { status: "hired" });
      alert("Successfully converted to Employee!");
    } catch (err: any) {
      alert("Failed to convert to Employee: " + err.message);
    } finally {
      setConvertingToEmployee(false);
    }
  }

  // Resignation UI states
  const [showResignationForm, setShowResignationForm] = useState(false);
  const [resignationReason, setResignationReason] = useState("");
  const [isBreach, setIsBreach] = useState(false);
  const [breachReason, setBreachReason] = useState("");
  const [processingResignation, setProcessingResignation] = useState(false);

  async function handleToggleBond(current: boolean) {
    if (!candidateEmployee) return;
    try {
      const res = await fetch(`/api/employees/${candidateEmployee.id}/bond`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isRequired: !current })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      updateEmployeeBond(data.bond);
      updateEmployee(candidateEmployee.id, { bondRequirement: !current ? "Required" : "Not Required" });
    } catch (err: any) {
      alert("Failed to update bond: " + err.message);
    }
  }

  async function handleSubmitResignation() {
    if (!candidateEmployee || !resignationReason) return alert("Reason is required");
    if (isBreach && !breachReason) return alert("Breach reason is required");
    
    setProcessingResignation(true);
    try {
      const res = await fetch(`/api/employees/${candidateEmployee.id}/resign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resignationReason,
          isBreach,
          breachReason: isBreach ? breachReason : null
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      addEmployeeResignation(data.resignation);
      updateEmployee(candidateEmployee.id, { status: "terminated" });
      setShowResignationForm(false);
    } catch (err: any) {
      alert("Failed to process resignation: " + err.message);
    } finally {
      setProcessingResignation(false);
    }
  }

  // Is the name parser confidence low? (< 70)
  const isLowConfidence = c.extractionConfidence !== undefined && c.extractionConfidence < 70;

  function handleSave() {
    updateCandidate(c.id, editState);
    setIsEditing(false);
  }

  function handleInstantNameCorrection(name: string) {
    setEditState(prev => ({ ...prev, name }));
    updateCandidate(c.id, { name });
  }

  function handleDelete() {
    if (confirm(`Delete ${c.name}'s profile? This cannot be undone.`)) {
      deleteCandidate(c.id);
      onClose();
    }
  }

  return (
    // Backdrop
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in"
      style={{ background: "rgba(0,0,0,0.82)", backdropFilter: "blur(14px)" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>

      {/* Card */}
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl animate-scale-up"
        style={{ background: "#0a0a0a", border: "1px solid var(--border-2)", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.5)" }}>

        {/* Top strip */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between p-5 sm:p-6 pb-4 gap-4" style={{ borderBottom: "1px solid var(--border)" }}>
          <div className="flex items-center gap-4 flex-1">
            {/* Avatar */}
            <div className={clsx(
              "w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center text-lg sm:text-xl font-bold flex-shrink-0 border transition-colors duration-300",
              isLowConfidence 
                ? "border-amber-500/30 bg-amber-500/5 text-amber-500" 
                : "border-[var(--border-2)] bg-white/5 text-white"
            )}>
              {(editState.name?.[0] ?? c.name?.[0] ?? "?").toUpperCase()}
            </div>
            
            <div className="flex-1 min-w-0">
              {isEditing ? (
                <input
                  type="text"
                  value={editState.name || ""}
                  onChange={e => setEditState(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full max-w-sm bg-black/60 border border-white/10 rounded-xl px-3 py-1.5 text-base font-bold text-white outline-none focus:border-white/30"
                  placeholder="Candidate Name"
                />
              ) : isLowConfidence ? (
                /* Instant low confidence fallback form field directly in the header */
                <div className="flex flex-col gap-1.5">
                  <div className="text-[10px] uppercase font-bold tracking-widest text-amber-500/80">Suggested Candidate Name</div>
                  <input
                    type="text"
                    value={editState.name || ""}
                    onChange={e => handleInstantNameCorrection(e.target.value)}
                    className="w-full max-w-sm bg-amber-500/5 border border-amber-500/30 hover:border-amber-500/50 focus:border-amber-500 rounded-xl px-3 py-1 text-sm font-bold text-amber-100 outline-none transition-all"
                    placeholder="Enter Candidate Name"
                  />
                </div>
              ) : (
                <div className="text-lg sm:text-xl font-bold tracking-tight text-white truncate">
                  {c.name || "Unknown Candidate"}
                </div>
              )}
              
              <div className="text-xs sm:text-sm text-[var(--text-3)] font-medium mt-1">
                {c.roleName} {c.city ? `· ${c.city}` : ""}
              </div>
              
              <div className="flex items-center gap-2 mt-2">
                <StatusBadge status={c.status} />
                <ScoreBadge score={c.score.total} />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-start">
            {isEditing ? (
              <Btn
                onClick={handleSave}
                className="text-xs font-semibold px-4 py-2 rounded-lg transition-all text-black bg-white hover:bg-zinc-200 active:scale-95 shadow-lg"
              >
                💾 Save
              </Btn>
            ) : !isLowConfidence && (
              <Btn
                onClick={() => setIsEditing(true)}
                className="text-xs font-semibold px-4 py-2 rounded-lg transition-all text-white bg-[var(--glass-2)] hover:bg-[var(--glass-3)] border border-[var(--border)] active:scale-95"
              >
                ✍️ Edit Profile
              </Btn>
            )}

            <Btn
              onClick={() => setIsDocStudioOpen(true)}
              className="text-xs font-semibold px-4 py-2 rounded-lg transition-all text-white bg-blue-600/20 hover:bg-blue-600/40 border border-blue-500/30 active:scale-95"
            >
              📄 Document Studio
            </Btn>

            <Btn onClick={onClose}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--text-3)] hover:text-white transition-colors"
              style={{ background: "var(--glass-2)", border: "1px solid var(--border)" }}>
              ✕
            </Btn>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 overflow-x-auto no-scrollbar px-5 sm:px-6 pt-4 pb-1">
          {(["profile", "score", "resume"] as const).map(tab => (
            <Btn key={tab} onClick={() => setActiveTab(tab)}
              className={clsx("text-sm font-medium px-4 py-2 rounded-lg transition-all capitalize border flex-shrink-0",
                activeTab === tab
                  ? "text-white border-[var(--border-2)] bg-[var(--glass-3)]"
                  : "text-[var(--text-3)] border-transparent hover:text-[var(--text-2)]"
              )}>{tab}</Btn>
          ))}
        </div>

        <div className="p-5 sm:p-6 pt-4">
          {activeTab === "profile" && (
            <div className="flex flex-col gap-5">

              {/* Extraction Confidence Indicators */}
              {c.extractionConfidence !== undefined && (
                <div className="flex flex-col gap-3">
                  {/* Alert panel for Low Confidence */}
                  {isLowConfidence && (
                    <div className="flex items-start gap-3 p-4 rounded-2xl text-xs font-semibold leading-relaxed border"
                      style={{ background: "rgba(245,158,11,0.06)", borderColor: "rgba(245,158,11,0.28)", color: "#f59e0b" }}>
                      <span className="text-lg leading-none mt-0.5">⚠️</span>
                      <div className="flex-1">
                        <div className="font-extrabold text-[13px] uppercase tracking-wide">Low Confidence Name Detection ({c.extractionConfidence}%)</div>
                        <div className="text-zinc-400 mt-1 leading-normal font-medium">
                          The parser resolved this suggested name via <strong>{c.extractionSource}</strong> with low confidence. Please verify or correct the candidate name using the form input field above.
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Diagnostic Badge Strip */}
                  <div className="flex items-center justify-between px-4 py-3 rounded-xl text-xs font-medium"
                    style={{ background: "var(--glass)", border: "1px solid var(--border)" }}>
                    <span className="text-[var(--text-3)] font-semibold flex items-center gap-1.5">
                      🔍 Extraction Method: <strong className="text-zinc-300 font-bold">{c.extractionSource}</strong>
                    </span>
                    <span className={clsx(
                      "px-2.5 py-0.5 rounded font-bold tracking-wide",
                      c.extractionConfidence >= 70 ? "text-[var(--green)] bg-[var(--green)]/10" : "text-amber-500 bg-amber-500/10"
                    )}>
                      {c.extractionConfidence}% Confidence
                    </span>
                  </div>
                </div>
              )}

              {/* Info grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {INFO_FIELDS.map(({ key, label, icon, suffix = "" }) => {
                  const val = isEditing ? editState[key as keyof Candidate] : c[key as keyof Candidate];
                  const display = val ? `${val}${suffix}` : "—";
                  
                  return (
                    <div key={key} className="flex items-start gap-3 p-3.5 rounded-xl transition-all"
                      style={{ background: "var(--glass)", border: "1px solid var(--border)" }}>
                      <span className="text-lg flex-shrink-0 mt-0.5">{icon}</span>
                      
                      <div className="flex-1 min-w-0">
                        <div className="text-xs text-[var(--text-3)] font-semibold mb-1">{label}</div>
                        {isEditing && key !== "appliedAt" ? (
                          <input
                            type={key === "age" ? "number" : "text"}
                            value={val === undefined ? "" : String(val)}
                            onChange={e => setEditState(prev => ({ ...prev, [key]: key === "age" ? Number(e.target.value) : e.target.value }))}
                            className="w-full bg-black/40 border border-white/5 rounded-lg px-2 py-1 text-xs text-white outline-none focus:border-white/20"
                            placeholder={`Enter ${label}`}
                          />
                        ) : (
                          <div className="flex items-center justify-between gap-2">
                            <div className="text-sm font-bold text-white truncate" title={String(val)}>{display}</div>
                            {key === "phone" && (
                              <Btn
                                onClick={() => {
                                  if (c.phone) {
                                    setIsWhatsAppOpen(true);
                                  } else {
                                    alert("Phone number is unavailable.");
                                  }
                                }}
                                disabled={!c.phone}
                                className={clsx(
                                  "p-1.5 rounded-lg transition-all border flex-shrink-0",
                                  c.phone
                                    ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 hover:border-emerald-500/40 active:scale-95 cursor-pointer"
                                    : "border-zinc-800 bg-zinc-900/20 text-zinc-600 cursor-not-allowed opacity-40"
                                )}
                                title={c.phone ? "Message candidate on WhatsApp" : "Phone number unavailable"}
                              >
                                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.458 5.705 1.459h.008c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                                </svg>
                              </Btn>
                            )}
                            {key === "email" && (
                              <Btn
                                onClick={() => {
                                  if (c.email) {
                                    setIsEmailOpen(true);
                                  } else {
                                    alert("Email address is unavailable.");
                                  }
                                }}
                                disabled={!c.email}
                                className={clsx(
                                  "p-1.5 rounded-lg transition-all border flex-shrink-0",
                                  c.email
                                    ? "border-blue-500/20 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 hover:border-blue-500/40 active:scale-95 cursor-pointer"
                                    : "border-zinc-800 bg-zinc-900/20 text-zinc-600 cursor-not-allowed opacity-40"
                                )}
                                title={c.email ? "Send Email to candidate" : "Email unavailable"}
                              >
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                              </Btn>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Skills */}
              <div>
                <div className="text-xs font-semibold text-[var(--text-3)] uppercase tracking-widest mb-2">Detected Skills</div>
                <div className="flex flex-wrap gap-1.5">
                  {c.skills.length > 0
                    ? c.skills.map(s => <SkillTag key={s} label={s} />)
                    : <span className="text-sm text-[var(--text-3)]">No skills detected</span>}
                </div>
              </div>

              {/* Resume file */}
              <div>
                <div className="text-xs font-semibold text-[var(--text-3)] uppercase tracking-widest mb-2">Resume File</div>
                <div className="flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium"
                  style={{ background: "var(--glass)", border: "1px solid var(--border)" }}>
                  <div className="flex items-center gap-2.5">
                    <span>📄</span> {c.resumeFile || "Not uploaded"}
                  </div>
                  {(c.resumeUrl || c.resumeText) && (
                    <Btn 
                      onClick={() => setActiveTab("resume")}
                      className="text-xs font-bold px-3 py-1.5 rounded-lg bg-[var(--glass-3)] text-white hover:bg-white/20 transition-all"
                    >
                      View
                    </Btn>
                  )}
                </div>
              </div>

              {/* Note */}
              <div>
                <div className="text-xs font-semibold text-[var(--text-3)] uppercase tracking-widest mb-2">Admin Note</div>
                <textarea rows={2} placeholder="Add a private note…" 
                  value={isEditing ? (editState.note || "") : (c.note || "")}
                  onChange={e => {
                    if (isEditing) {
                      setEditState(prev => ({ ...prev, note: e.target.value }));
                    } else {
                      updateCandidate(c.id, { note: e.target.value });
                    }
                  }}
                  onBlur={e => {
                    if (!isEditing) {
                      updateCandidate(c.id, { note: e.target.value });
                    }
                  }}
                  className="w-full rounded-xl text-sm px-4 py-3 resize-none outline-none transition-colors"
                  style={{ background: "var(--glass)", border: "1px solid var(--border)", color: "var(--text)" }}
                  onFocus={e => e.target.style.borderColor = "var(--border-3)"}
                />
              </div>

              {/* Collapsible Diagnostic Panel */}
              {c.extractionMetadata && (
                <details className="group rounded-xl border border-white/5 bg-zinc-950/40 p-4 transition-all mt-1">
                  <summary className="flex items-center justify-between cursor-pointer list-none text-xs font-bold uppercase tracking-wider text-[var(--text-3)] hover:text-white select-none">
                    <span>🛠️ Parser Diagnostic Metadata</span>
                    <span className="transition-transform group-open:rotate-180 text-xs">▼</span>
                  </summary>
                  
                  <div className="mt-4 flex flex-col gap-4 text-xs leading-relaxed border-t border-white/5 pt-4">
                    <div className="flex justify-between items-center bg-black/20 p-2.5 rounded-lg border border-white/5">
                      <span className="text-[var(--text-3)] font-medium">OCR Fallback Engine:</span>
                      <span className={clsx("font-bold px-2 py-0.5 rounded", c.extractionMetadata.ocrUsed ? "text-[var(--yellow)] bg-[var(--yellow)]/10" : "text-zinc-500 bg-zinc-900")}>
                        {c.extractionMetadata.ocrUsed ? "Active (Scanned PDF)" : "Inactive (Native PDF Text)"}
                      </span>
                    </div>
                    
                    {/* Multi-Source Candidates list */}
                    <div>
                      <span className="text-[var(--text-3)] font-bold block mb-2.5 uppercase tracking-wide text-[10px]">Multi-Source Name Rankings:</span>
                      <div className="flex flex-col gap-2 max-h-[180px] overflow-y-auto pr-1">
                        {c.extractionMetadata.sourceRankings && c.extractionMetadata.sourceRankings.length > 0 ? (
                          c.extractionMetadata.sourceRankings.map((rank, idx) => (
                            <div key={idx} className="flex items-center justify-between p-2.5 rounded-xl bg-black/40 border border-white/5">
                              <div className="flex flex-col gap-0.5">
                                <span className="font-bold text-white text-[12px]">{rank.name}</span>
                                <span className="text-[9px] text-[var(--text-3)] font-medium">{rank.source}</span>
                              </div>
                              <span className={clsx(
                                "font-bold text-[10px] px-2 py-0.5 rounded",
                                rank.confidence >= 70 ? "text-[var(--green)] bg-[var(--green)]/10" : rank.confidence >= 40 ? "text-[var(--yellow)] bg-[var(--yellow)]/10" : "text-[var(--red)] bg-[var(--red)]/10"
                              )}>
                                {rank.confidence}% Score
                              </span>
                            </div>
                          ))
                        ) : (
                          <div className="text-[var(--text-3)] italic text-center py-2 bg-black/20 rounded-xl border border-dashed border-white/5">No candidates extracted</div>
                        )}
                      </div>
                    </div>

                    {/* Applied Normalizations & Splits */}
                    {c.extractionMetadata.transformations && c.extractionMetadata.transformations.length > 0 && (
                      <div>
                        <span className="text-[var(--text-3)] font-bold block mb-2.5 uppercase tracking-wide text-[10px]">Applied Normalizations:</span>
                        <div className="flex flex-col gap-1.5 max-h-[120px] overflow-y-auto pr-1 font-mono text-[9px] text-zinc-300">
                          {c.extractionMetadata.transformations.map((t, idx) => (
                            <div key={idx} className="p-2 rounded bg-black/40 border border-white/5 leading-normal">
                              {t}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Rejected Candidates */}
                    {c.extractionMetadata.rejectedCandidates && c.extractionMetadata.rejectedCandidates.length > 0 && (
                      <div>
                        <span className="text-[var(--text-3)] font-bold block mb-2.5 uppercase tracking-wide text-[10px]">Rejected Candidates:</span>
                        <div className="flex flex-col gap-2 max-h-[150px] overflow-y-auto pr-1">
                          {c.extractionMetadata.rejectedCandidates.map((rc, idx) => (
                            <div key={idx} className="flex items-center justify-between p-2.5 rounded-xl bg-black/40 border border-white/5">
                              <div className="flex flex-col gap-0.5">
                                <span className="font-bold text-zinc-400 line-through text-[12px]">{rc.name}</span>
                                <span className="text-[9px] text-[var(--text-3)] font-medium">{rc.source}</span>
                              </div>
                              <span className="text-[9px] text-[var(--red)] font-semibold bg-[var(--red)]/10 px-2 py-0.5 rounded leading-none">
                                {rc.reason}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Visual Layout Bounding Box Inspector */}
                    {c.extractionMetadata.firstPageLines && c.extractionMetadata.firstPageLines.length > 0 && (
                      <div className="mt-3">
                        <span className="text-[var(--text-3)] font-bold block mb-2.5 uppercase tracking-wide text-[10px]">PDF Layout Bounding Boxes (Page 1):</span>
                        <div className="flex flex-col gap-1.5 max-h-[180px] overflow-y-auto pr-1">
                          <div className="grid grid-cols-5 gap-1 text-[9px] font-bold text-[var(--text-3)] pb-1.5 border-b border-white/5 uppercase tracking-wide">
                            <span className="col-span-2">Text Content</span>
                            <span className="text-right">Size</span>
                            <span className="text-right">Pos X</span>
                            <span className="text-right">Pos Y</span>
                          </div>
                          {c.extractionMetadata.firstPageLines.map((line, idx) => {
                            const isHeading = line.fontSize >= 12;
                            const isBold = !!line.isBold;
                            const tooltip = `${line.text}\nFont: ${line.fontFamily || "Unknown"}\nBold: ${isBold ? "Yes" : "No"}\nWidth: ${Math.round(line.width || 0)}px`;
                            return (
                              <div key={idx} className={clsx(
                                "grid grid-cols-5 gap-1 p-2 rounded-lg border text-[9.5px]",
                                isHeading 
                                  ? "bg-amber-500/5 border-amber-500/15 text-amber-100 font-semibold" 
                                  : "bg-black/30 border-white/5 text-zinc-300 font-mono"
                              )} title={tooltip}>
                                <span className="col-span-2 truncate flex items-center gap-1">
                                  {isBold && <span className="text-[10px] text-amber-400 font-bold select-none" title="Bold styling detected">★</span>}
                                  <span className={clsx(isBold && "font-bold text-white")}>{line.text}</span>
                                </span>
                                <span className="text-right">{Math.round(line.fontSize)}pt</span>
                                <span className="text-right">{Math.round(line.x)}</span>
                                <span className="text-right">{Math.round(line.y)}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </details>
              )}
            </div>
          )}

          {activeTab === "score" && (
            <div className="flex flex-col gap-4 animate-fade-in">
              {/* Big score */}
              <div className="flex items-center gap-6 p-5 rounded-2xl" style={{ background: "var(--glass-2)", border: "1px solid var(--border)" }}>
                <div className="text-center">
                  <div className={clsx("text-6xl font-extrabold tracking-tighter leading-none",
                    c.score.total >= 70 ? "text-[var(--green)]" : c.score.total >= 45 ? "text-[var(--yellow)]" : "text-[var(--red)]"
                  )}>{c.score.total}</div>
                  <div className="text-xs text-[var(--text-3)] mt-1.5 font-semibold uppercase tracking-widest">Overall</div>
                </div>
                <div className="flex-1">
                  {([
                    ["Skills Match", c.score.skills, "40%"],
                    ["Experience", c.score.exp, "25%"],
                    ["Education", c.score.edu, "20%"],
                    ["Completeness", c.score.completeness, "15%"],
                  ] as [string, number, string][]).map(([label, val, wt]) => (
                    <div key={label} className="flex items-center gap-3 mb-3 last:mb-0">
                      <div className="text-xs text-[var(--text-3)] w-28 font-medium">{label}</div>
                      <div className="flex-1 h-1.5 rounded-full" style={{ background: "var(--glass-3)" }}>
                        <div className="h-full rounded-full bg-white transition-all duration-700" style={{ width: `${val}%` }} />
                      </div>
                      <div className="text-xs font-bold w-7 text-right">{val}</div>
                      <div className="text-xs text-[var(--text-3)] w-8">{wt}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Score legend */}
              <div className="grid grid-cols-3 gap-2">
                {[["🟢 Strong", "70–100", "var(--green)"], ["🟡 Decent", "45–69", "var(--yellow)"], ["🔴 Weak", "0–44", "var(--red)"]].map(([label, range, color]) => (
                  <div key={label} className="p-3 rounded-xl text-center" style={{ background: "var(--glass)", border: "1px solid var(--border)" }}>
                    <div className="text-sm font-semibold" style={{ color }}>{label}</div>
                    <div className="text-xs text-[var(--text-3)] mt-0.5 font-medium">{range}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "resume" && (
            c.resumeUrl ? (
              <div className="flex flex-col gap-4 animate-fade-in">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-semibold text-[var(--text-3)] uppercase tracking-widest">
                    {resumeMode === "pdf" ? "Original PDF Resume" : "Extracted Resume Text"}
                  </div>
                  {c.resumeText && (
                    <div className="flex p-0.5 rounded-lg border border-[var(--border)] bg-[#0c0c0c] text-xs font-semibold select-none">
                      <Btn
                        onClick={() => setResumeMode("pdf")}
                        className={clsx(
                          "px-3 py-1 rounded-md transition-all duration-150",
                          resumeMode === "pdf"
                            ? "bg-[var(--glass-3)] text-white shadow-sm"
                            : "text-[var(--text-3)] hover:text-[var(--text-2)]"
                        )}
                      >
                        📄 PDF View
                      </Btn>
                      <Btn
                        onClick={() => setResumeMode("text")}
                        className={clsx(
                          "px-3 py-1 rounded-md transition-all duration-150",
                          resumeMode === "text"
                            ? "bg-[var(--glass-3)] text-white shadow-sm"
                            : "text-[var(--text-3)] hover:text-[var(--text-2)]"
                        )}
                      >
                        📝 Text View
                      </Btn>
                    </div>
                  )}
                </div>

                {resumeMode === "pdf" ? (
                  <PDFViewer
                    url={c.resumeUrl}
                    filename={c.resumeFile}
                  />
                ) : (
                  <div className="w-full rounded-xl text-xs font-mono p-5 overflow-y-auto max-h-[50vh] whitespace-pre-wrap leading-relaxed select-text animate-fade-in"
                    style={{ background: "#080808", border: "1px solid var(--border)", color: "var(--text-2)" }}>
                    {c.resumeText}
                  </div>
                )}
              </div>
            ) : c.resumeText ? (
              <div className="flex flex-col gap-4 animate-fade-in">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-semibold text-[var(--text-3)] uppercase tracking-widest">
                    Original Extracted Resume Content
                  </div>
                  <div className="text-xs text-[var(--text-3)] bg-[var(--glass-2)] px-2.5 py-1 rounded border border-[var(--border)]">
                    PDF Document Text
                  </div>
                </div>
                <div className="w-full rounded-xl text-xs font-mono p-5 overflow-y-auto max-h-[50vh] whitespace-pre-wrap leading-relaxed select-text"
                  style={{ background: "#080808", border: "1px solid var(--border)", color: "var(--text-2)" }}>
                  {c.resumeText}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 px-4 text-center rounded-xl animate-fade-in"
                style={{ background: "var(--glass)", border: "1px solid var(--border)" }}>
                <span className="text-4xl mb-3">📄</span>
                <div className="text-sm font-semibold mb-1">No original resume text available</div>
                <div className="text-xs text-[var(--text-3)] max-w-sm">
                  This candidate was seed-generated. Real parsed resumes uploaded via the PDF uploader will display their full original text here.
                </div>
              </div>
            )
          )}

          {/* Workflow Management */}
          {["new", "review", "shortlisted", "interview_1", "interview_2", "approved", "rejected", "offer", "offer_sent", "offer_accepted", "offer_rejected", "hired"].includes(c.status) && (
            <div className="mt-5 pt-4 flex flex-col gap-3" style={{ borderTop: "1px solid var(--border)" }}>
              <div className="text-xs font-semibold text-[var(--text-3)] uppercase tracking-widest">Workflow Actions</div>
              
              {/* Shortlist Action */}
              {(c.status === "new" || c.status === "review") && (
                <div className="p-3 rounded-lg border border-[var(--border)] bg-[var(--glass-2)] flex items-center justify-between">
                  <div>
                    <div className="font-bold text-sm text-[var(--text)]">Shortlist Candidate</div>
                    <div className="text-xs text-[var(--text-3)] mt-0.5">Move candidate to the shortlisted stage to begin interviews.</div>
                  </div>
                  <Btn className="bg-white text-black text-xs font-bold px-4 py-1.5 rounded active:scale-95 transition-transform"
                    onClick={() => updateCandidate(c.id, { status: "shortlisted" })}>
                    Shortlist
                  </Btn>
                </div>
              )}

              {/* Round 1 */}
              {(c.status !== "new" && c.status !== "review") && (
                <div className="p-3 rounded-lg border border-[var(--border)] bg-[var(--glass-2)]">
                  <div className="font-bold text-sm text-[var(--text)] mb-2">Round 1</div>
                {!r1 ? (
                  c.status === "shortlisted" ? (
                  <div className="flex gap-2">
                    <input type="datetime-local" value={scheduleR1} onChange={e => setScheduleR1(e.target.value)}
                      className="flex-1 bg-[var(--glass-3)] text-[var(--text)] text-xs border border-[var(--border)] rounded px-2 py-1 outline-none" />
                    <Btn className="bg-[var(--primary)] text-black text-xs font-bold px-3 py-1 rounded"
                      onClick={() => {
                        if (!scheduleR1) return alert("Select a date");
                        addInterview({
                          id: crypto.randomUUID(), candidateId: c.id, round: 1, scheduledAt: new Date(scheduleR1).toISOString(),
                          status: "scheduled", notes: "", decision: null, createdAt: new Date().toISOString()
                        });
                        updateCandidate(c.id, { status: "interview_1" });
                      }}>Schedule R1</Btn>
                  </div>
                  ) : (
                    <div className="text-xs text-[var(--text-3)]">No interview scheduled.</div>
                  )
                ) : (
                  <div className="flex flex-col gap-2">
                    <div className="text-xs text-[var(--text-2)]">Scheduled: {new Date(r1.scheduledAt!).toLocaleString()} ({r1.status})</div>
                    {r1.status === "scheduled" && c.status === "interview_1" && (
                      <>
                        <textarea placeholder="Interview Notes..." value={r1Notes} onChange={e => setR1Notes(e.target.value)}
                          className="w-full bg-[var(--glass-3)] text-[var(--text)] text-xs border border-[var(--border)] rounded p-2 outline-none h-16" />
                        <div className="flex gap-2 mt-1">
                          <Btn className="bg-[var(--green)] text-black text-[10px] font-bold px-2 py-1 rounded flex-1" onClick={() => {
                            updateInterview(r1.id, { status: "completed", decision: "select", notes: r1Notes });
                            updateCandidate(c.id, { status: "interview_2" });
                          }}>Select for Next Round</Btn>
                          <Btn className="bg-[var(--red)] text-white text-[10px] font-bold px-2 py-1 rounded flex-1" onClick={() => {
                            const reason = prompt("Reason for rejection:");
                            if (reason !== null) {
                              const note = r1Notes + (reason ? `\nRejection Reason: ${reason}` : "");
                              updateInterview(r1.id, { status: "completed", decision: "reject", notes: note });
                              updateCandidate(c.id, { status: "rejected", note: (c.note || "") + `\nRejected in R1: ${reason}` });
                            }
                          }}>Reject</Btn>
                        </div>
                      </>
                    )}
                    {r1.status === "completed" && (
                      <div className="text-xs text-[var(--text-3)]">Decision: {r1.decision} | Notes: {r1.notes}</div>
                    )}
                  </div>
                )}
              </div>
              )}

              {/* Round 2 */}
              {(r1?.decision === "select" || r2) && (
                <div className="p-3 rounded-lg border border-[var(--border)] bg-[var(--glass-2)]">
                  <div className="font-bold text-sm text-[var(--text)] mb-2">Round 2</div>
                  {!r2 ? (
                    c.status === "interview_2" ? (
                    <div className="flex gap-2">
                      <input type="datetime-local" value={scheduleR2} onChange={e => setScheduleR2(e.target.value)}
                        className="flex-1 bg-[var(--glass-3)] text-[var(--text)] text-xs border border-[var(--border)] rounded px-2 py-1 outline-none" />
                      <Btn className="bg-[var(--primary)] text-black text-xs font-bold px-3 py-1 rounded"
                        onClick={() => {
                          if (!scheduleR2) return alert("Select a date");
                          addInterview({
                            id: crypto.randomUUID(), candidateId: c.id, round: 2, scheduledAt: new Date(scheduleR2).toISOString(),
                            status: "scheduled", notes: "", decision: null, createdAt: new Date().toISOString()
                          });
                        }}>Schedule R2</Btn>
                    </div>
                    ) : (
                      <div className="text-xs text-[var(--text-3)]">No interview scheduled.</div>
                    )
                  ) : (
                    <div className="flex flex-col gap-2">
                      <div className="text-xs text-[var(--text-2)]">Scheduled: {new Date(r2.scheduledAt!).toLocaleString()} ({r2.status})</div>
                      {r2.status === "scheduled" && c.status === "interview_2" && (
                        <>
                          <textarea placeholder="Interview Notes..." value={r2Notes} onChange={e => setR2Notes(e.target.value)}
                            className="w-full bg-[var(--glass-3)] text-[var(--text)] text-xs border border-[var(--border)] rounded p-2 outline-none h-16" />
                          <div className="flex gap-2 mt-1">
                            <Btn className="bg-[var(--green)] text-black text-[10px] font-bold px-2 py-1 rounded flex-1" onClick={() => {
                              updateInterview(r2.id, { status: "completed", decision: "select", notes: r2Notes });
                              updateCandidate(c.id, { status: "approved" });
                            }}>Approve</Btn>
                            <Btn className="bg-[var(--red)] text-white text-[10px] font-bold px-2 py-1 rounded flex-1" onClick={() => {
                              const reason = prompt("Reason for rejection:");
                              if (reason !== null) {
                                const note = r2Notes + (reason ? `\nRejection Reason: ${reason}` : "");
                                updateInterview(r2.id, { status: "completed", decision: "reject", notes: note });
                                updateCandidate(c.id, { status: "rejected", note: (c.note || "") + `\nRejected in R2: ${reason}` });
                              }
                            }}>Reject</Btn>
                          </div>
                        </>
                      )}
                      {r2.status === "completed" && (
                        <div className="text-xs text-[var(--text-3)]">Decision: {r2.decision} | Notes: {r2.notes}</div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Offer Management */}
          {["approved", "offer", "offer_sent", "offer_accepted", "offer_rejected", "onboarding_requested", "onboarding_review", "onboarding_verified", "onboarding_rejected", "hired"].includes(c.status) && (
            <div className="mt-5 pt-4 flex flex-col gap-3" style={{ borderTop: "1px solid var(--border)" }}>
              <div className="text-xs font-semibold text-[var(--text-3)] uppercase tracking-widest">Offer Management</div>
              
              <div className="p-3 rounded-lg border border-[var(--border)] bg-[var(--glass-2)]">
                {!candidateOffer ? (
                  c.status === "approved" ? (
                  <div className="flex flex-col gap-2">
                    <div className="text-xs text-[var(--text-2)] mb-2">Ready to extend an offer? You can generate a contract first or proceed directly.</div>
                    <Btn className="bg-[var(--primary)] text-black text-xs font-bold px-3 py-2 rounded"
                      onClick={() => {
                        addOffer({
                          id: crypto.randomUUID(), candidateId: c.id, contractTemplateId: null,
                          status: "draft", sentAt: null, respondedAt: null, createdAt: new Date().toISOString()
                        });
                        updateCandidate(c.id, { status: "offer" });
                      }}>Prepare Offer</Btn>
                  </div>
                  ) : (
                    <div className="text-xs text-[var(--text-3)]">No offer prepared.</div>
                  )
                ) : (
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-bold">Offer Status: <span className="uppercase text-[var(--primary)]">{candidateOffer.status}</span></div>
                    </div>
                    {candidateOffer.status === "draft" && c.status === "offer" && (
                      <div className="flex gap-2">
                        <Btn className="bg-[var(--glass-3)] text-white text-[10px] font-bold px-3 py-2 rounded flex-1 border border-[var(--border)] hover:bg-[var(--glass-4)]" 
                          onClick={() => {
                            updateOffer(candidateOffer.id, { status: "sent", sentAt: new Date().toISOString() });
                            updateCandidate(c.id, { status: "offer_sent" });
                          }}>Mark as Sent</Btn>
                        <Btn className="bg-[var(--glass-3)] text-[var(--primary)] text-[10px] font-bold px-3 py-2 rounded flex-1 border border-[var(--primary)] hover:bg-[var(--glass-4)]" 
                          onClick={() => {
                            setDocStudioType(c.roleName?.toLowerCase().includes("intern") ? "offer-internship" : "offer-fulltime");
                            setIsDocStudioOpen(true);
                          }}>📄 Studio Offer</Btn>
                      </div>
                    )}
                    {candidateOffer.status === "sent" && c.status === "offer_sent" && (
                      <div className="text-xs text-[var(--text-2)] mb-2 p-2 bg-[var(--glass-3)] rounded border border-[var(--border)]">
                        <p>Waiting for candidate response. The candidate can review and respond via:</p>
                        <a href={`/offer/${c.id}`} target="_blank" rel="noreferrer" className="text-[var(--primary)] underline block mt-1 font-semibold">Open Candidate Offer Page</a>
                      </div>
                    )}
                    {(candidateOffer.status === "accepted" || candidateOffer.status === "rejected") && (
                      <div className="text-xs text-[var(--text-3)]">
                        Responded at: {new Date(candidateOffer.respondedAt!).toLocaleString()}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Onboarding Management */}
          {(c.status === "offer_accepted" || c.status.startsWith("onboarding_")) && (
            <div className="mt-5 pt-4 flex flex-col gap-3" style={{ borderTop: "1px solid var(--border)" }}>
              <div className="text-xs font-semibold text-[var(--text-3)] uppercase tracking-widest">Onboarding Management</div>
              
              <div className="p-3 rounded-lg border border-[var(--border)] bg-[var(--glass-2)]">
                <div className="flex justify-between items-center mb-3">
                  <div className="text-sm font-bold">Documents</div>
                  <div className="flex gap-2">
                    <Btn className="text-[10px] bg-[var(--primary)] text-black px-2 py-1 rounded font-bold"
                      onClick={() => {
                        setDocStudioType("employee-agreement");
                        setIsDocStudioOpen(true);
                      }}
                    >📄 Generate Docs</Btn>
                    <Btn className="text-[10px] bg-[var(--glass-3)] px-2 py-1 rounded"
                      onClick={() => {
                        navigator.clipboard.writeText(`${getPublicBaseUrl()}/onboarding/${c.id}`);
                        alert("Candidate upload link copied to clipboard.");
                      }}
                    >Copy Upload Link</Btn>
                  </div>
                </div>
                
                {candidateDocs.length === 0 ? (
                  <div className="text-xs text-[var(--text-3)] italic">No documents uploaded yet.</div>
                ) : (
                  <div className="flex flex-col gap-2">
                    {candidateDocs.map(doc => (
                      <div key={doc.id} className="flex flex-col gap-2 p-2 bg-[var(--glass)] border border-[var(--border-2)] rounded">
                        <div className="flex justify-between items-center">
                          <div className="text-xs font-medium truncate" title={doc.fileName}>{doc.fileName}</div>
                          <div className="text-[10px] uppercase text-[var(--text-3)]">{doc.type}</div>
                        </div>
                        <div className="flex gap-2 items-center justify-between">
                          <div className="flex gap-1">
                            <Btn className="text-[10px] px-2 py-0.5 rounded bg-[var(--glass-4)] hover:bg-white/20 text-white"
                              onClick={async () => {
                                const url = await getDocumentSignedUrl(doc.filePath);
                                if (url) window.open(url, '_blank');
                                else alert("Failed to open document securely.");
                              }}>View</Btn>
                          </div>
                          {doc.status === "pending" ? (
                            <div className="flex gap-1">
                              <Btn className="text-[10px] px-2 py-0.5 rounded bg-[var(--green)] text-black font-bold"
                                onClick={() => {
                                  updateDocument(doc.id, { status: "verified" });
                                  const allOtherVerified = candidateDocs.filter(d => d.id !== doc.id).every(d => d.status === "verified");
                                  if (allOtherVerified) {
                                    updateCandidate(c.id, { status: "onboarding_verified" });
                                  } else {
                                    updateCandidate(c.id, { status: "onboarding_review" });
                                  }
                                }}>Verify</Btn>
                              <Btn className="text-[10px] px-2 py-0.5 rounded bg-[var(--red)] text-white font-bold"
                                onClick={() => {
                                  updateDocument(doc.id, { status: "rejected" });
                                  updateCandidate(c.id, { status: "onboarding_rejected" });
                                }}>Reject</Btn>
                            </div>
                          ) : (
                            <div className={clsx("text-[10px] font-bold uppercase", doc.status === "verified" ? "text-[var(--green)]" : "text-[var(--red)]")}>
                              {doc.status}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              {!candidateEmployee && (
                <Btn className="w-full py-2 rounded font-bold text-sm bg-[var(--primary)] text-black disabled:opacity-50 disabled:cursor-not-allowed disabled:grayscale"
                  onClick={() => {
                    handleConvertToEmployee();
                    updateCandidate(c.id, { status: "hired" });
                  }}
                  disabled={convertingToEmployee || candidateDocs.length === 0 || !candidateDocs.every(d => d.status === "verified")}>
                  {convertingToEmployee ? "Converting..." : "🎉 Convert to Employee"}
                </Btn>
              )}
              {candidateEmployee && (
                <div className="p-3 rounded-lg border border-[var(--green)] bg-[var(--green)]/10">
                  <div className="text-sm font-bold text-[var(--green)] mb-1">🎉 Hired as Employee</div>
                  <div className="text-xs text-[var(--text-2)]">Type: {candidateEmployee.employmentType}</div>
                  <div className="text-xs text-[var(--text-2)]">Bond Req: {candidateEmployee.bondRequirement}</div>
                  
                  {/* Bond Management */}
                  <div className="mt-3 pt-3 border-t border-[var(--green)]/20">
                    <div className="flex justify-between items-center mb-2">
                      <div className="text-xs font-semibold">Bond Status</div>
                      <Btn className="text-[10px] px-2 py-1 rounded bg-[var(--glass-3)]"
                        onClick={() => handleToggleBond(employeeBond?.isRequired || false)}>
                        Toggle
                      </Btn>
                    </div>
                    {employeeBond?.isRequired ? (
                      <div className="text-[10px] bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 p-2 rounded">
                        <strong>Required.</strong> (Amount: {employeeBond.amount}, Duration: {employeeBond.duration})
                      </div>
                    ) : (
                      <div className="text-[10px] text-[var(--text-3)]">No bond required.</div>
                    )}
                  </div>

                  {/* Resignation Management */}
                  <div className="mt-3 pt-3 border-t border-[var(--green)]/20">
                    {employeeResignation ? (
                      <div className="bg-red-500/10 border border-red-500/20 p-2 rounded">
                        <div className="text-xs font-bold text-red-500">Resigned / Terminated</div>
                        <div className="text-[10px] text-[var(--text-2)] mt-1">Reason: {employeeResignation.resignationReason}</div>
                        {employeeResignation.isBreach && (
                          <div className="text-[10px] text-red-400 font-semibold mt-1">⚠️ BREACH: {employeeResignation.breachReason}</div>
                        )}
                        <div className="mt-3 flex flex-col gap-2">
                          <Btn className="w-full text-[10px] py-1 rounded bg-[var(--glass-4)] hover:bg-white/10 text-white"
                            onClick={() => {
                               setDocStudioType('experience-letter');
                               setIsDocStudioOpen(true);
                            }}>
                            Generate Experience Letter
                          </Btn>
                          <Btn className="w-full text-[10px] py-1 rounded bg-[var(--glass-4)] hover:bg-white/10 text-white"
                            onClick={() => {
                               setDocStudioType('relieving-letter');
                               setIsDocStudioOpen(true);
                            }}>
                            Generate Relieving Letter
                          </Btn>
                        </div>
                      </div>
                    ) : (
                      <>
                        <Btn className="w-full text-xs py-1.5 rounded border border-red-500/30 text-red-500 hover:bg-red-500/10"
                          onClick={() => setShowResignationForm(!showResignationForm)}>
                          Process Resignation
                        </Btn>
                        {showResignationForm && (
                          <div className="mt-2 flex flex-col gap-2">
                            <textarea
                              value={resignationReason}
                              onChange={e => setResignationReason(e.target.value)}
                              placeholder="Resignation / Termination Reason..."
                              className="w-full bg-[var(--glass-4)] border border-[var(--border)] rounded p-2 text-xs text-white"
                            />
                            <label className="flex items-center gap-2 text-xs">
                              <input type="checkbox" checked={isBreach} onChange={e => setIsBreach(e.target.checked)} />
                              Classify as Bond Breach
                            </label>
                            {isBreach && (
                              <textarea
                                value={breachReason}
                                onChange={e => setBreachReason(e.target.value)}
                                placeholder="Details of breach..."
                                className="w-full bg-[var(--glass-4)] border border-red-500/50 rounded p-2 text-xs text-white"
                              />
                            )}
                            <Btn className="bg-red-500 text-white font-bold py-1 rounded text-xs mt-1"
                              onClick={handleSubmitResignation}
                              disabled={processingResignation}>
                              Confirm Separation
                            </Btn>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Status row removed to enforce strict workflow */}

          {/* Actions */}
          <div className="flex gap-2 mt-4 pt-4" style={{ borderTop: "1px solid var(--border)" }}>
            <Btn onClick={() => { onClose(); router.push(`/contracts?candidateId=${c.id}`); }}
              className="flex-1 text-sm font-semibold py-2.5 rounded-xl transition-all"
              style={{ background: "var(--glass-2)", border: "1px solid var(--border-2)", color: "var(--text)" }}>
              📄 Generate Contract
            </Btn>
            
            <Btn
              onClick={() => {
                if (c.email) {
                  setIsEmailOpen(true);
                } else {
                  alert("Email address is unavailable for this candidate.");
                }
              }}
              disabled={!c.email}
              className="flex-1 text-sm font-semibold py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 select-none disabled:opacity-30 disabled:cursor-not-allowed active:scale-[0.98]"
              style={{ background: "var(--glass-2)", border: "1px solid var(--border-2)", color: "var(--text)" }}
              title={c.email ? "Send Email to candidate" : "Email unavailable"}
            >
              <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2} style={{ flexShrink: 0 }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              {c.email ? "Email" : "No Email"}
            </Btn>

            <Btn
              onClick={() => {
                if (c.phone) {
                  setIsWhatsAppOpen(true);
                } else {
                  alert("Phone number is unavailable for this candidate.");
                }
              }}
              disabled={!c.phone}
              className="flex-1 text-sm font-semibold py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 select-none disabled:opacity-30 disabled:cursor-not-allowed active:scale-[0.98]"
              style={{ background: "var(--glass-2)", border: "1px solid var(--border-2)", color: "var(--text)" }}
              title={c.phone ? "Message candidate on WhatsApp" : "Phone number unavailable"}
            >
              <svg className="w-4 h-4 text-emerald-400" fill="currentColor" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.458 5.705 1.459h.008c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              {c.phone ? "WhatsApp" : "No Phone"}
            </Btn>

            <Btn onClick={handleDelete}
              className="text-sm font-semibold px-5 py-2.5 rounded-xl transition-all"
              style={{ background: "rgba(255,68,68,0.08)", border: "1px solid rgba(255,68,68,0.2)", color: "var(--red)" }}>
              Delete
            </Btn>
          </div>
        </div>
      </div>

      {/* WhatsApp Outreach Drawer Workspace */}
      {isWhatsAppOpen && (
        <WhatsAppModal
          candidate={c}
          onClose={() => setIsWhatsAppOpen(false)}
        />
      )}

      {/* Email Outreach Drawer Workspace */}
      {isEmailOpen && (
        <EmailModal
          candidate={c}
          onClose={() => setIsEmailOpen(false)}
        />
      )}
      
      {isDocStudioOpen && (
        <DocumentStudioModal
          candidate={c}
          employee={candidateEmployee}
          employeeBond={employeeBond || undefined}
          employeeResignation={employeeResignation || undefined}
          onClose={() => setIsDocStudioOpen(false)}
          defaultStage={["approved", "offer", "offer_sent"].includes(c.status) ? "offer" : ["onboarding_requested", "onboarding_review", "hired"].includes(c.status) ? "onboarding" : "exit"}
          defaultDocType={docStudioType}
        />
      )}
    </div>
  );
}
