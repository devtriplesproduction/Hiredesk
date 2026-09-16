"use client";
import { useStore } from "@/lib/store";
import { getDocumentSignedUrl } from "@/lib/supabase";
import { Btn, ScoreBadge, StatusBadge, SkillTag, dialog } from "@/components/ui";
import type { Candidate, EmploymentStatus } from "@/types";
import { getEmploymentStatusMeta } from "@/lib/data";
import { clsx } from "clsx";
import { useRouter } from "next/navigation";
import { getPublicBaseUrl } from "@/lib/url";
import { useState, useEffect } from "react";
import PDFViewer from "@/components/candidates/PDFViewer";
import WhatsAppModal from "@/components/candidates/WhatsAppModal";
import EmailModal from "@/components/candidates/EmailModal";
import { DocumentStudioModal } from "@/components/documents/DocumentStudioModal";
import DateTimePicker from "@/components/ui/DateTimePicker";
import { Check, X, User, BarChart2, FileText, CheckCircle2, Clock, Calendar, Briefcase, GitBranch, ExternalLink, Copy, AlertCircle, Lock, ArrowRight } from "lucide-react";

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
  { key: "employmentStatus", label: "Employment Status", icon: "💼" },
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
  const [copiedUploadLink, setCopiedUploadLink] = useState(false);

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
  const [scheduleR1Error, setScheduleR1Error] = useState("");
  const [scheduleR2, setScheduleR2] = useState("");
  const [scheduleR2Error, setScheduleR2Error] = useState("");
  const [r1Notes, setR1Notes] = useState("");
  const [r2Notes, setR2Notes] = useState("");

  useEffect(() => {
    setR1Notes(r1?.notes || "");
  }, [c.id, r1?.id, r1?.notes]);

  useEffect(() => {
    setR2Notes(r2?.notes || "");
  }, [c.id, r2?.id, r2?.notes]);

  // Derived Sequential Workflow Statuses
  const isR1Rejected = r1?.status === "completed" && r1?.decision === "reject";
  const isR1Completed = r1?.status === "completed" && r1?.decision === "select";
  const isR1Scheduled = r1?.status === "scheduled";
  const isR1Passed = !isR1Rejected && (
    isR1Completed ||
    Boolean(r2) ||
    ["interview_2", "approved", "offer", "offer_sent", "offer_accepted", "offer_rejected", "onboarding_requested", "onboarding_review", "onboarding_verified", "onboarding_rejected", "hired"].includes(c.status)
  );

  const isR2Rejected = r2?.status === "completed" && r2?.decision === "reject";
  const isR2Completed = r2?.status === "completed" && r2?.decision !== "reject";
  const isR2Scheduled = r2?.status === "scheduled";
  const isR2Available = isR1Passed && !r2 && c.status !== "rejected";
  const isR2Locked = !isR1Passed;

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
      employmentStatus: c.employmentStatus ?? "UNKNOWN",
      currentCompany: c.currentCompany,
      currentRole: c.currentRole,
      exp: c.exp,
      education: c.education,
      note: c.note,
      roleId: c.roleId,
      roleName: c.roleName,
    });
  }, [c]);

  const [convertingToEmployee, setConvertingToEmployee] = useState(false);

  async function handleConvertToEmployee() {
    if (!candidateRole) return dialog.warning("Role details missing");
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
      dialog.success("Successfully converted to Employee!");
    } catch (err: any) {
      dialog.error("Failed to convert to Employee: " + err.message);
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
      dialog.error("Failed to update bond: " + err.message);
    }
  }

  async function handleSubmitResignation() {
    if (!candidateEmployee || !resignationReason) return dialog.warning("Reason is required");
    if (isBreach && !breachReason) return dialog.warning("Breach reason is required");
    
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
      dialog.error("Failed to process resignation: " + err.message);
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

  const [isDeleting, setIsDeleting] = useState(false);

  async function handleDelete() {
    if (isDeleting) return;
    const confirmed = await dialog.confirm({
      title: "Delete Candidate Profile",
      message: `Are you sure you want to delete ${c.name}'s profile? This cannot be undone.`,
      confirmText: "DELETE PROFILE",
      cancelText: "CANCEL",
      isDestructive: true,
    });
    if (!confirmed) return;

    setIsDeleting(true);
    try {
      await deleteCandidate(c.id);
      onClose();
      dialog.success({
        title: "Candidate Deleted",
        message: `${c.name}'s profile has been permanently deleted from the database.`,
      });
    } catch (err: any) {
      console.error("[CandidateDetail] Delete error:", err);
      dialog.error({
        title: "Candidate Deletion Failed",
        message: `Failed to delete candidate: ${err?.message || "Database error"}. The record was not removed.`,
      });
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    // Backdrop
    <div className={clsx(
      "fixed inset-0 z-50 flex items-center p-4 sm:p-8 animate-fade-in transition-all duration-500",
      (isWhatsAppOpen || isEmailOpen || isDocStudioOpen) ? "justify-start pl-[5%] sm:pl-[10%]" : "justify-center"
    )}
      style={{ background: "rgba(0,0,0,0.82)", backdropFilter: "blur(14px)" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>

      {/* Card */}
      <div className={clsx(
        "w-[98vw] max-w-[1800px] h-[98vh] flex flex-col overflow-hidden animate-scale-up transition-all duration-500 relative z-10",
        (isWhatsAppOpen || isEmailOpen || isDocStudioOpen) ? "opacity-40 hover:opacity-100 scale-95 hover:scale-100 cursor-pointer" : ""
      )}
        style={{ background: "#0a0a0a" }}
        onClick={() => {
          if (isWhatsAppOpen) setIsWhatsAppOpen(false);
          if (isEmailOpen) setIsEmailOpen(false);
          if (isDocStudioOpen) setIsDocStudioOpen(false);
        }}>

        {/* Top strip */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between p-6 sm:p-8 pb-5 gap-6" style={{ borderBottom: "1px solid var(--border)", background: "linear-gradient(to bottom, rgba(255,255,255,0.03), transparent)" }}>
          <div className="flex items-center gap-5 flex-1">
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
              
              <div className="text-xs sm:text-sm text-[var(--text-3)] font-medium mt-1 flex gap-2 items-center">
                {isEditing ? (
                  <select 
                    value={editState.roleId || c.roleId} 
                    onChange={e => {
                      const role = roles.find(r => r.id === e.target.value);
                      setEditState(prev => ({ ...prev, roleId: role?.id, roleName: role?.name }));
                    }}
                    className="bg-black/60 border border-white/10 rounded-lg px-2 py-1 outline-none focus:border-white/30 text-white"
                  >
                    {roles.map(r => (
                      <option key={r.id} value={r.id}>{r.name}</option>
                    ))}
                  </select>
                ) : (
                  <>{c.roleName}</>
                )}
                {c.city ? `· ${c.city}` : ""}
              </div>
              
              <div className="flex items-center gap-2 mt-2">
                <StatusBadge status={c.status} />
                <ScoreBadge score={c.score.total} />
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:items-end gap-3 self-end sm:self-center flex-shrink-0">
            <div className="flex items-center gap-2">
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

            {/* Profile / Score / Resume Tabs */}
            <div className="flex items-center gap-[6px] overflow-x-auto no-scrollbar select-none">
              {([
                { id: "profile", label: "Profile", icon: User, accent: "#A78BFA", activeBg: "rgba(167, 139, 250, 0.10)", activeBorder: "rgba(167, 139, 250, 0.45)", activeHoverBg: "rgba(167, 139, 250, 0.16)", hoverBorder: "rgba(167, 139, 250, 0.30)" },
                { id: "score", label: "Score", icon: BarChart2, accent: "#A78BFA", activeBg: "rgba(167, 139, 250, 0.10)", activeBorder: "rgba(167, 139, 250, 0.45)", activeHoverBg: "rgba(167, 139, 250, 0.16)", hoverBorder: "rgba(167, 139, 250, 0.30)" },
                { id: "resume", label: "Resume", icon: FileText, accent: "#00D9FF", activeBg: "rgba(0, 217, 255, 0.10)", activeBorder: "rgba(0, 217, 255, 0.45)", activeHoverBg: "rgba(0, 217, 255, 0.16)", hoverBorder: "rgba(0, 217, 255, 0.30)" },
              ] as const).map(t => {
                const isActive = activeTab === t.id;
                const IconComponent = t.icon;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setActiveTab(t.id)}
                    className="inline-flex items-center justify-center gap-[6px] h-[40px] px-5 rounded-[10px] text-[13px] font-semibold tracking-normal flex-shrink-0 cursor-pointer outline-none select-none"
                    style={{
                      background: isActive ? t.activeBg : "#181818",
                      border: isActive ? `1px solid ${t.activeBorder}` : "1px solid #2D2D2D",
                      color: isActive ? t.accent : "#8F939D",
                      transition: "background-color 160ms ease, border-color 160ms ease, color 160ms ease",
                    }}
                    onMouseEnter={e => {
                      if (isActive) {
                        e.currentTarget.style.background = t.activeHoverBg;
                      } else {
                        e.currentTarget.style.background = "#202020";
                        e.currentTarget.style.borderColor = t.hoverBorder;
                        e.currentTarget.style.color = "#C4C7D0";
                      }
                    }}
                    onMouseLeave={e => {
                      if (isActive) {
                        e.currentTarget.style.background = t.activeBg;
                        e.currentTarget.style.borderColor = t.activeBorder;
                        e.currentTarget.style.color = t.accent;
                      } else {
                        e.currentTarget.style.background = "#181818";
                        e.currentTarget.style.borderColor = "#2D2D2D";
                        e.currentTarget.style.color = "#8F939D";
                      }
                    }}
                  >
                    <IconComponent className="w-[15px] h-[15px]" style={{ color: "inherit" }} />
                    <span>{t.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 sm:p-8 pt-6 custom-scrollbar">
          {activeTab === "profile" && (
            <div className="flex flex-col gap-6 w-full">

              {/* Extraction & Employment Diagnostics */}
              {(c.extractionConfidence !== undefined || c.employmentStatusSource) && (
                <div className="w-full flex flex-col gap-3">
                  {/* Alert panel for Low Confidence */}
                  {isLowConfidence && (
                    <div className="w-full flex items-start gap-3 p-4 rounded-2xl text-xs font-semibold leading-relaxed border"
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
                  <div className="w-full flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 px-4 py-3 rounded-xl text-xs font-medium"
                    style={{ background: "var(--glass)", border: "1px solid var(--border)" }}>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                      {c.extractionSource && (
                        <span className="text-[var(--text-3)] font-semibold flex items-center gap-1.5">
                          🔍 Name Method: <strong className="text-zinc-300 font-bold">{c.extractionSource}</strong>
                        </span>
                      )}
                      {c.employmentStatusSource && (
                        <span className="text-[var(--text-3)] font-semibold flex items-center gap-1.5">
                          💼 Employment: <strong className="text-zinc-300 font-bold">{c.employmentStatusSource}</strong>
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      {c.employmentStatusConfidence !== undefined && (
                        <span
                          className="px-2.5 py-0.5 rounded font-bold tracking-wide text-[11px]"
                          style={{
                            color: getEmploymentStatusMeta(c.employmentStatus).color,
                            background: getEmploymentStatusMeta(c.employmentStatus).bg,
                            border: `1px solid ${getEmploymentStatusMeta(c.employmentStatus).border}`,
                          }}
                        >
                          {getEmploymentStatusMeta(c.employmentStatus).icon} {c.employmentStatusConfidence}% Confidence
                        </span>
                      )}
                      {c.extractionConfidence !== undefined && (
                        <span className={clsx(
                          "px-2.5 py-0.5 rounded font-bold tracking-wide",
                          c.extractionConfidence >= 70 ? "text-[var(--green)] bg-[var(--green)]/10" : "text-amber-500 bg-amber-500/10"
                        )}>
                          {c.extractionConfidence}% Name
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Info grid - 4 equal columns across 2 rows */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
                {INFO_FIELDS.map(({ key, label, icon, suffix = "" }) => {
                  const val = isEditing ? editState[key as keyof Candidate] : c[key as keyof Candidate];
                  const display = val ? `${val}${suffix}` : "—";
                  const statusMeta = getEmploymentStatusMeta(c.employmentStatus);
                  
                  return (
                    <div key={key} className="flex items-center gap-3.5 p-4 sm:p-5 rounded-2xl transition-all hover:bg-white/[0.02] min-h-[84px]"
                      style={{ background: "var(--glass)", border: "1px solid var(--border)", boxShadow: "inset 0 1px 1px rgba(255,255,255,0.02)" }}>
                      <span className="text-2xl flex-shrink-0 w-8 flex items-center justify-center drop-shadow-sm">
                        {key === "employmentStatus" ? statusMeta.icon : icon}
                      </span>
                      
                      <div className="flex-1 min-w-0">
                        <div className="text-xs text-zinc-500 font-bold uppercase tracking-widest mb-1">{label}</div>
                        {isEditing && key !== "appliedAt" ? (
                          key === "employmentStatus" ? (
                            <select
                              value={String(editState.employmentStatus || "UNKNOWN")}
                              onChange={e => setEditState(prev => ({ ...prev, employmentStatus: e.target.value as EmploymentStatus }))}
                              className="w-full bg-[#14171B] border border-[#2D333B] text-white rounded-lg px-2 py-1 text-xs outline-none focus:border-[#00D9FF]"
                            >
                              <option value="CURRENTLY_WORKING">🟢 Currently Working</option>
                              <option value="STUDENT_FRESHER">🔵 Student / Fresher</option>
                              <option value="NOT_CURRENTLY_WORKING">⚪ Not Currently Working</option>
                              <option value="UNKNOWN">🟡 Status Unknown</option>
                            </select>
                          ) : (
                            <input
                              type="text"
                              value={val === undefined ? "" : String(val)}
                              onChange={e => setEditState(prev => ({ ...prev, [key]: e.target.value }))}
                              className="w-full bg-black/40 border border-white/5 rounded-lg px-2 py-1 text-xs text-white outline-none focus:border-white/20"
                              placeholder={`Enter ${label}`}
                            />
                          )
                        ) : key === "employmentStatus" ? (
                          <div className="flex flex-col justify-center min-h-[28px]">
                            <div className="text-sm font-bold truncate flex items-center gap-1.5" style={{ color: statusMeta.color }}>
                              <span>{statusMeta.label}</span>
                            </div>
                            {(c.currentRole || c.currentCompany) ? (
                              <div
                                className="text-[11.5px] text-[#8E949E] font-medium truncate mt-0.5"
                                title={[c.currentRole, c.currentCompany].filter(Boolean).join(" · ")}
                              >
                                {[c.currentRole, c.currentCompany].filter(Boolean).join(" · ")}
                              </div>
                            ) : null}
                          </div>
                        ) : (
                          <div className="flex items-center justify-between gap-2 min-h-[28px]">
                            <div className="text-sm font-bold text-white truncate" title={String(val)}>{display}</div>
                            {key === "phone" && (
                              <Btn
                                onClick={() => {
                                  if (c.phone) {
                                    setIsWhatsAppOpen(true);
                                  } else {
                                    dialog.info("Phone number is unavailable.");
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
                                    dialog.info("Email address is unavailable.");
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
              <div className="bg-zinc-900/40 p-6 rounded-2xl border border-white/5 shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)]">
                <div className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                  <span>📝</span> Admin Note
                </div>
                <textarea rows={4} placeholder="Add a private note about this candidate…" 
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
                  className="w-full rounded-xl text-sm px-5 py-4 resize-none outline-none transition-all duration-300 bg-black/50 border border-white/10 text-zinc-200 focus:border-zinc-500 focus:shadow-[0_0_15px_rgba(255,255,255,0.05)] custom-scrollbar"
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
              <div className="flex flex-col gap-4 animate-fade-in max-w-[820px] w-full mx-auto">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-semibold text-[var(--text-3)] uppercase tracking-widest">
                    {resumeMode === "pdf" ? "Original PDF Resume" : "Extracted Resume Text"}
                  </div>
                  {c.resumeText && (
                    <div className="inline-flex items-center gap-2 select-none">
                      <button
                        type="button"
                        onClick={() => setResumeMode("pdf")}
                        className="inline-flex items-center justify-center gap-2 h-[44px] px-5 rounded-[10px] text-[13px] font-semibold tracking-normal transition-all duration-150 cursor-pointer active:scale-[0.98]"
                        style={{
                          background: resumeMode === "pdf" ? "rgba(167, 139, 250, 0.14)" : "#191919",
                          border: resumeMode === "pdf" ? "1px solid rgba(167, 139, 250, 0.45)" : "1px solid #303030",
                          color: resumeMode === "pdf" ? "#A78BFA" : "#A7AAB3",
                          boxShadow: resumeMode === "pdf" ? "0 0 14px rgba(167, 139, 250, 0.15)" : "none",
                        }}
                        onMouseEnter={(e) => {
                          if (resumeMode === "pdf") {
                            e.currentTarget.style.background = "rgba(167, 139, 250, 0.20)";
                            e.currentTarget.style.borderColor = "rgba(167, 139, 250, 0.60)";
                          } else {
                            e.currentTarget.style.background = "#222222";
                            e.currentTarget.style.borderColor = "rgba(167, 139, 250, 0.30)";
                            e.currentTarget.style.color = "#E2E8F0";
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (resumeMode === "pdf") {
                            e.currentTarget.style.background = "rgba(167, 139, 250, 0.14)";
                            e.currentTarget.style.borderColor = "rgba(167, 139, 250, 0.45)";
                            e.currentTarget.style.color = "#A78BFA";
                          } else {
                            e.currentTarget.style.background = "#191919";
                            e.currentTarget.style.borderColor = "#303030";
                            e.currentTarget.style.color = "#A7AAB3";
                          }
                        }}
                      >
                        <span className="text-base leading-none">📄</span>
                        <span>PDF View</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setResumeMode("text")}
                        className="inline-flex items-center justify-center gap-2 h-[44px] px-5 rounded-[10px] text-[13px] font-semibold tracking-normal transition-all duration-150 cursor-pointer active:scale-[0.98]"
                        style={{
                          background: resumeMode === "text" ? "rgba(167, 139, 250, 0.14)" : "#191919",
                          border: resumeMode === "text" ? "1px solid rgba(167, 139, 250, 0.45)" : "1px solid #303030",
                          color: resumeMode === "text" ? "#A78BFA" : "#A7AAB3",
                          boxShadow: resumeMode === "text" ? "0 0 14px rgba(167, 139, 250, 0.15)" : "none",
                        }}
                        onMouseEnter={(e) => {
                          if (resumeMode === "text") {
                            e.currentTarget.style.background = "rgba(167, 139, 250, 0.20)";
                            e.currentTarget.style.borderColor = "rgba(167, 139, 250, 0.60)";
                          } else {
                            e.currentTarget.style.background = "#222222";
                            e.currentTarget.style.borderColor = "rgba(167, 139, 250, 0.30)";
                            e.currentTarget.style.color = "#E2E8F0";
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (resumeMode === "text") {
                            e.currentTarget.style.background = "rgba(167, 139, 250, 0.14)";
                            e.currentTarget.style.borderColor = "rgba(167, 139, 250, 0.45)";
                            e.currentTarget.style.color = "#A78BFA";
                          } else {
                            e.currentTarget.style.background = "#191919";
                            e.currentTarget.style.borderColor = "#303030";
                            e.currentTarget.style.color = "#A7AAB3";
                          }
                        }}
                      >
                        <span className="text-base leading-none">📝</span>
                        <span>Text View</span>
                      </button>
                    </div>
                  )}
                </div>

                {resumeMode === "pdf" ? (
                  <PDFViewer
                    url={c.resumeUrl}
                    filename={c.resumeFile}
                  />
                ) : (
                  <div className="w-full rounded-xl text-xs font-mono p-5 overflow-y-auto h-[540px] sm:h-[580px] lg:h-[600px] max-h-[75vh] whitespace-pre-wrap leading-relaxed select-text animate-fade-in"
                    style={{ background: "#080808", border: "1px solid var(--border)", color: "var(--text-2)" }}>
                    {c.resumeText}
                  </div>
                )}
              </div>
            ) : c.resumeText ? (
              <div className="flex flex-col gap-4 animate-fade-in max-w-[820px] w-full mx-auto">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-semibold text-[var(--text-3)] uppercase tracking-widest">
                    Original Extracted Resume Content
                  </div>
                  <div className="text-xs text-[var(--text-3)] bg-[var(--glass-2)] px-2.5 py-1 rounded border border-[var(--border)]">
                    PDF Document Text
                  </div>
                </div>
                <div className="w-full rounded-xl text-xs font-mono p-5 overflow-y-auto h-[540px] sm:h-[580px] lg:h-[600px] max-h-[75vh] whitespace-pre-wrap leading-relaxed select-text"
                  style={{ background: "#080808", border: "1px solid var(--border)", color: "var(--text-2)" }}>
                  {c.resumeText}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 px-4 text-center rounded-xl animate-fade-in max-w-[820px] w-full mx-auto"
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
            <div
              className="mt-6 flex flex-col gap-3.5 rounded-[12px] p-5"
              style={{
                background: "#111214",
                border: "1px solid #24272D",
              }}
            >
              {/* Section Header */}
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <GitBranch className="w-3.5 h-3.5 text-[#A78BFA]" />
                  <span
                    className="text-[12px] font-semibold uppercase tracking-[0.08em]"
                    style={{ color: "#A78BFA" }}
                  >
                    Workflow Actions
                  </span>
                </div>
                <span className="text-[11px] font-mono font-medium text-[#70747D] uppercase tracking-wider">
                  Interview Progression
                </span>
              </div>
              
              <div className="flex flex-col gap-3">
                {/* Shortlist Action Banner */}
                {(c.status === "new" || c.status === "review") && (
                  <div
                    className="p-4 rounded-[10px] flex items-center justify-between flex-wrap gap-3"
                    style={{ background: "#16171B", border: "1px solid #24272D" }}
                  >
                    <div>
                      <div className="font-semibold text-sm text-[#E7E9ED]">Shortlist Candidate</div>
                      <div className="text-xs text-[#9A9DA6] mt-0.5">Move candidate to the shortlisted stage to begin interview scheduling.</div>
                    </div>
                    <Btn
                      className="text-xs font-bold px-4 py-2 rounded-lg active:scale-95 transition-all"
                      style={{
                        background: "rgba(0, 217, 255, 0.08)",
                        border: "1px solid rgba(0, 217, 255, 0.35)",
                        color: "#00D9FF",
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.background = "rgba(0, 217, 255, 0.15)";
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.background = "rgba(0, 217, 255, 0.08)";
                      }}
                      onClick={() => updateCandidate(c.id, { status: "shortlisted" })}>
                      Shortlist
                    </Btn>
                  </div>
                )}

                {/* Horizontal Interview Progression Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-stretch relative">
                  {/* Subtle Visual Connector Arrow */}
                  <div className="hidden md:flex items-center justify-center absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none">
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center transition-all duration-200"
                      style={{
                        background: "#16171B",
                        border: isR1Passed ? "1px solid rgba(34, 197, 94, 0.40)" : "1px solid #2B2F38",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.5)",
                      }}
                    >
                      <ArrowRight
                        className="w-3.5 h-3.5 transition-colors"
                        style={{ color: isR1Passed ? "#22C55E" : "#70747D" }}
                      />
                    </div>
                  </div>

                  {/* ================= ROUND 1 CARD ================= */}
                  <div
                    className="p-4 sm:p-5 rounded-[10px] flex flex-col justify-between gap-3 min-h-[190px] transition-all"
                    style={{
                      background: "#16171B",
                      border: isR1Passed
                        ? "1px solid rgba(34, 197, 94, 0.30)"
                        : isR1Rejected
                        ? "1px solid rgba(239, 68, 68, 0.30)"
                        : "1px solid #24272D",
                    }}
                  >
                    <div>
                      {/* Header */}
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <div className="flex items-center gap-2">
                          {isR1Passed ? (
                            <CheckCircle2 className="w-4 h-4 text-[#22C55E]" />
                          ) : isR1Rejected ? (
                            <AlertCircle className="w-4 h-4 text-[#EF4444]" />
                          ) : isR1Scheduled ? (
                            <Calendar className="w-4 h-4 text-[#A78BFA]" />
                          ) : (
                            <Calendar className="w-4 h-4 text-[#70747D]" />
                          )}
                          <span className="font-semibold text-sm text-[#E7E9ED]">Round 1</span>
                        </div>

                        {/* Status Badges */}
                        {isR1Passed && (
                          <span
                            className="text-[10.5px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-[6px] inline-flex items-center gap-1"
                            style={{
                              background: "rgba(34, 197, 94, 0.08)",
                              border: "1px solid rgba(34, 197, 94, 0.30)",
                              color: "#22C55E",
                            }}
                          >
                            <Check className="w-3 h-3" />
                            <span>Completed</span>
                          </span>
                        )}
                        {isR1Rejected && (
                          <span
                            className="text-[10.5px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-[6px] inline-flex items-center gap-1"
                            style={{
                              background: "rgba(239, 68, 68, 0.08)",
                              border: "1px solid rgba(239, 68, 68, 0.30)",
                              color: "#EF4444",
                            }}
                          >
                            <X className="w-3 h-3" />
                            <span>Rejected</span>
                          </span>
                        )}
                        {isR1Scheduled && (
                          <span
                            className="text-[10.5px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-[6px] inline-flex items-center gap-1"
                            style={{
                              background: "rgba(167, 139, 250, 0.08)",
                              border: "1px solid rgba(167, 139, 250, 0.30)",
                              color: "#A78BFA",
                            }}
                          >
                            <Calendar className="w-3 h-3" />
                            <span>Scheduled</span>
                          </span>
                        )}
                        {!r1 && !isR1Passed && !isR1Rejected && (
                          (c.status === "new" || c.status === "review") ? (
                            <span
                              className="text-[10.5px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-[6px]"
                              style={{
                                background: "rgba(245, 197, 66, 0.08)",
                                border: "1px solid rgba(245, 197, 66, 0.25)",
                                color: "#F5C542",
                              }}
                            >
                              Pending Shortlist
                            </span>
                          ) : (
                            <span
                              className="text-[10.5px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-[6px] inline-flex items-center gap-1"
                              style={{
                                background: "rgba(0, 217, 255, 0.08)",
                                border: "1px solid rgba(0, 217, 255, 0.30)",
                                color: "#00D9FF",
                              }}
                            >
                              <Clock className="w-3 h-3" />
                              <span>Available</span>
                            </span>
                          )
                        )}
                      </div>

                      {/* Body Content */}
                      {!r1 && !isR1Passed && !isR1Rejected && (
                        (c.status === "new" || c.status === "review") ? (
                          <div className="flex flex-col gap-2.5 py-2">
                            <p className="text-xs text-[#9A9DA6]">
                              Candidate must be shortlisted before scheduling Round 1.
                            </p>
                            <button
                              type="button"
                              onClick={() => updateCandidate(c.id, { status: "shortlisted" })}
                              className="self-start text-xs font-semibold px-3 py-1.5 rounded-lg text-[#00D9FF] bg-[rgba(0,217,255,0.08)] border border-[rgba(0,217,255,0.30)] hover:bg-[rgba(0,217,255,0.15)] transition-all active:scale-95 cursor-pointer"
                            >
                              Shortlist Now
                            </button>
                          </div>
                        ) : (
                          <div className="flex flex-col gap-2 mt-1">
                            <div className="text-xs text-[#9A9DA6]">Ready to schedule Round 1 interview.</div>
                            <div className="flex flex-col sm:flex-row gap-2 sm:items-center mt-1">
                              <DateTimePicker
                                value={scheduleR1}
                                onChange={val => {
                                  setScheduleR1(val);
                                  if (scheduleR1Error) setScheduleR1Error("");
                                }}
                                hasError={Boolean(scheduleR1Error)}
                                placeholder="📅 Select date & time..."
                              />
                              <Btn
                                className={clsx(
                                  "text-xs font-bold px-4 py-2 rounded-lg transition-all flex-shrink-0 text-center h-[42px]",
                                  scheduleR1 ? "active:scale-95 cursor-pointer" : "cursor-not-allowed opacity-50"
                                )}
                                style={{
                                  background: scheduleR1 ? "rgba(167, 139, 250, 0.08)" : "rgba(167, 139, 250, 0.03)",
                                  border: scheduleR1 ? "1px solid rgba(167, 139, 250, 0.35)" : "1px solid rgba(167, 139, 250, 0.15)",
                                  color: "#A78BFA",
                                }}
                                onMouseEnter={e => {
                                  if (scheduleR1) e.currentTarget.style.background = "rgba(167, 139, 250, 0.15)";
                                }}
                                onMouseLeave={e => {
                                  if (scheduleR1) e.currentTarget.style.background = "rgba(167, 139, 250, 0.08)";
                                }}
                                onClick={() => {
                                  if (!scheduleR1 || isNaN(new Date(scheduleR1).getTime())) {
                                    setScheduleR1Error("Please select a valid date and time before scheduling.");
                                    return;
                                  }
                                  addInterview({
                                    id: crypto.randomUUID(),
                                    candidateId: c.id,
                                    round: 1,
                                    scheduledAt: new Date(scheduleR1).toISOString(),
                                    status: "scheduled",
                                    notes: "",
                                    decision: null,
                                    createdAt: new Date().toISOString()
                                  });
                                  updateCandidate(c.id, { status: "interview_1" });
                                  setScheduleR1("");
                                  setScheduleR1Error("");
                                }}>
                                Schedule R1
                              </Btn>
                            </div>
                            {scheduleR1Error && (
                              <div className="text-[11px] font-mono text-red-400 mt-0.5 px-0.5">
                                ⚠ {scheduleR1Error}
                              </div>
                            )}
                          </div>
                        )
                      )}

                      {r1 && (
                        <div className="flex flex-col gap-2.5">
                          <div className="text-xs text-[#9A9DA6] flex items-center gap-1.5 flex-wrap">
                            <Calendar className="w-3.5 h-3.5 text-[#70747D]" />
                            <span>Scheduled: {r1.scheduledAt ? new Date(r1.scheduledAt).toLocaleString() : "Date not set"}</span>
                          </div>

                          {/* Scheduled State Actions */}
                          {isR1Scheduled && (
                            <div className="flex flex-col gap-2 mt-0.5">
                              <textarea
                                placeholder="Interview Notes..."
                                value={r1Notes}
                                onChange={e => setR1Notes(e.target.value)}
                                className="w-full bg-[#0E0F12] text-[var(--text)] text-xs border border-[#24272D] rounded-lg p-2.5 outline-none h-16 focus:border-[#A78BFA]/50 transition-colors"
                              />
                              <div className="flex flex-wrap items-center gap-2 pt-1">
                                <button
                                  type="button"
                                  onClick={() => {
                                    updateInterview(r1.id, { status: "completed", decision: "select", notes: r1Notes });
                                    updateCandidate(c.id, { status: "interview_2" });
                                  }}
                                  className="inline-flex items-center justify-center gap-1.5 h-[38px] px-3.5 rounded-[8px] text-xs font-semibold tracking-normal transition-all cursor-pointer select-none active:scale-[0.98] flex-1 min-w-[140px]"
                                  style={{
                                    background: "rgba(167, 139, 250, 0.10)",
                                    border: "1px solid rgba(167, 139, 250, 0.35)",
                                    color: "#A78BFA",
                                  }}
                                  onMouseEnter={e => {
                                    e.currentTarget.style.background = "rgba(167, 139, 250, 0.18)";
                                    e.currentTarget.style.borderColor = "rgba(167, 139, 250, 0.55)";
                                  }}
                                  onMouseLeave={e => {
                                    e.currentTarget.style.background = "rgba(167, 139, 250, 0.10)";
                                    e.currentTarget.style.borderColor = "rgba(167, 139, 250, 0.35)";
                                  }}
                                >
                                  <Check className="w-3.5 h-3.5 text-[#A78BFA]" />
                                  <span>Select for Next Round</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => {
                                    const reason = prompt("Reason for rejection:");
                                    if (reason !== null) {
                                      const note = r1Notes + (reason ? `\nRejection Reason: ${reason}` : "");
                                      updateInterview(r1.id, { status: "completed", decision: "reject", notes: note });
                                      updateCandidate(c.id, { status: "rejected", note: (c.note || "") + `\nRejected in R1: ${reason}` });
                                    }
                                  }}
                                  className="inline-flex items-center justify-center gap-1.5 h-[38px] px-3.5 rounded-[8px] text-xs font-semibold tracking-normal transition-all cursor-pointer select-none active:scale-[0.98]"
                                  style={{
                                    background: "rgba(239, 68, 68, 0.08)",
                                    border: "1px solid rgba(239, 68, 68, 0.35)",
                                    color: "#EF4444",
                                  }}
                                  onMouseEnter={e => {
                                    e.currentTarget.style.background = "rgba(239, 68, 68, 0.15)";
                                    e.currentTarget.style.borderColor = "rgba(239, 68, 68, 0.55)";
                                  }}
                                  onMouseLeave={e => {
                                    e.currentTarget.style.background = "rgba(239, 68, 68, 0.08)";
                                    e.currentTarget.style.borderColor = "rgba(239, 68, 68, 0.35)";
                                  }}
                                >
                                  <X className="w-3.5 h-3.5 text-[#EF4444]" />
                                  <span>Reject</span>
                                </button>
                              </div>
                            </div>
                          )}

                          {/* Completed / Selected State Details */}
                          {isR1Passed && (
                            <div className="flex flex-col gap-1.5 text-xs text-[#70747D]">
                              <div className="flex items-center gap-1.5">
                                <span className="text-[#9A9DA6]">Decision:</span>
                                <span className="font-semibold text-[#22C55E]">Selected for Next Round</span>
                              </div>
                              {r1.notes && (
                                <div className="text-xs text-[#8B919C] bg-[#0E0F12] p-2 rounded-lg border border-[#24272D]">
                                  <span className="text-[#606060] font-medium block text-[11px] mb-0.5">Interview Notes:</span>
                                  {r1.notes}
                                </div>
                              )}
                            </div>
                          )}

                          {/* Rejected State Details */}
                          {isR1Rejected && (
                            <div className="flex flex-col gap-1.5 text-xs text-[#70747D]">
                              <div className="flex items-center gap-1.5">
                                <span className="text-[#9A9DA6]">Decision:</span>
                                <span className="font-semibold text-[#EF4444]">Rejected</span>
                              </div>
                              {r1.notes && (
                                <div className="text-xs text-[#8B919C] bg-[#0E0F12] p-2 rounded-lg border border-[#24272D]">
                                  <span className="text-[#606060] font-medium block text-[11px] mb-0.5">Notes:</span>
                                  {r1.notes}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Fallback when stage is past R1 without explicit r1 record */}
                      {!r1 && isR1Passed && (
                        <div className="flex flex-col gap-1 text-xs text-[#70747D] py-1">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[#9A9DA6]">Decision:</span>
                            <span className="font-semibold text-[#22C55E]">Selected (Stage: {c.status})</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* ================= ROUND 2 CARD ================= */}
                  <div
                    className={clsx(
                      "p-4 sm:p-5 rounded-[10px] flex flex-col justify-between gap-3 min-h-[190px] transition-all",
                      isR2Locked && "opacity-60 select-none"
                    )}
                    style={{
                      background: isR2Locked ? "#121316" : "#16171B",
                      border: isR2Locked
                        ? "1px dashed #24272D"
                        : isR2Completed
                        ? "1px solid rgba(34, 197, 94, 0.30)"
                        : isR2Rejected
                        ? "1px solid rgba(239, 68, 68, 0.30)"
                        : "1px solid #24272D",
                    }}
                  >
                    <div>
                      {/* Header */}
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <div className="flex items-center gap-2">
                          {isR2Locked ? (
                            <Lock className="w-4 h-4 text-[#70747D]" />
                          ) : isR2Completed ? (
                            <CheckCircle2 className="w-4 h-4 text-[#22C55E]" />
                          ) : isR2Rejected ? (
                            <AlertCircle className="w-4 h-4 text-[#EF4444]" />
                          ) : isR2Scheduled ? (
                            <Calendar className="w-4 h-4 text-[#A78BFA]" />
                          ) : (
                            <Clock className="w-4 h-4 text-[#00D9FF]" />
                          )}
                          <span className={clsx("font-semibold text-sm", isR2Locked ? "text-[#70747D]" : "text-[#E7E9ED]")}>
                            Round 2
                          </span>
                        </div>

                        {/* Status Badges */}
                        {isR2Locked && (
                          <span
                            className="text-[10.5px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-[6px] inline-flex items-center gap-1"
                            style={{
                              background: "rgba(255, 255, 255, 0.04)",
                              border: "1px solid rgba(255, 255, 255, 0.10)",
                              color: "#8B919C",
                            }}
                          >
                            <Lock className="w-3 h-3" />
                            <span>Locked</span>
                          </span>
                        )}
                        {isR2Available && (
                          <span
                            className="text-[10.5px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-[6px] inline-flex items-center gap-1"
                            style={{
                              background: "rgba(0, 217, 255, 0.08)",
                              border: "1px solid rgba(0, 217, 255, 0.30)",
                              color: "#00D9FF",
                            }}
                          >
                            <Clock className="w-3 h-3" />
                            <span>Available</span>
                          </span>
                        )}
                        {isR2Scheduled && (
                          <span
                            className="text-[10.5px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-[6px] inline-flex items-center gap-1"
                            style={{
                              background: "rgba(167, 139, 250, 0.08)",
                              border: "1px solid rgba(167, 139, 250, 0.30)",
                              color: "#A78BFA",
                            }}
                          >
                            <Calendar className="w-3 h-3" />
                            <span>Scheduled</span>
                          </span>
                        )}
                        {isR2Completed && (
                          <span
                            className="text-[10.5px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-[6px] inline-flex items-center gap-1"
                            style={{
                              background: "rgba(34, 197, 94, 0.08)",
                              border: "1px solid rgba(34, 197, 94, 0.30)",
                              color: "#22C55E",
                            }}
                          >
                            <Check className="w-3 h-3" />
                            <span>Completed</span>
                          </span>
                        )}
                        {isR2Rejected && (
                          <span
                            className="text-[10.5px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-[6px] inline-flex items-center gap-1"
                            style={{
                              background: "rgba(239, 68, 68, 0.08)",
                              border: "1px solid rgba(239, 68, 68, 0.30)",
                              color: "#EF4444",
                            }}
                          >
                            <X className="w-3 h-3" />
                            <span>Rejected</span>
                          </span>
                        )}
                      </div>

                      {/* Body Content */}
                      {isR2Locked && (
                        <div className="flex flex-col items-center justify-center text-center py-6 gap-2 my-auto">
                          <div className={clsx(
                            "w-8 h-8 rounded-full flex items-center justify-center",
                            isR1Rejected ? "bg-red-500/10 border border-red-500/20 text-red-400" : "bg-white/[0.03] border border-white/[0.08] text-[#70747D]"
                          )}>
                            <Lock className="w-4 h-4" />
                          </div>
                          <div className="text-xs font-semibold text-[#8B919C]">
                            {isR1Rejected ? "Process Stopped" : "Round 2 Locked"}
                          </div>
                          <div className="text-[11px] text-[#606060] max-w-[210px]">
                            {isR1Rejected
                              ? "Candidate was rejected in Round 1. Round 2 is not available."
                              : "Complete and select candidate in Round 1 first."}
                          </div>
                        </div>
                      )}

                      {isR2Available && (
                        <div className="flex flex-col gap-2 mt-1">
                          <div className="text-xs text-[#9A9DA6]">
                            Round 1 passed! Ready to schedule Round 2.
                          </div>
                          <div className="flex flex-col sm:flex-row gap-2 sm:items-center mt-1">
                            <DateTimePicker
                              value={scheduleR2}
                              onChange={val => {
                                setScheduleR2(val);
                                if (scheduleR2Error) setScheduleR2Error("");
                              }}
                              hasError={Boolean(scheduleR2Error)}
                              placeholder="📅 Select date & time..."
                            />
                            <Btn
                              className={clsx(
                                "text-xs font-bold px-4 py-2 rounded-lg transition-all flex-shrink-0 text-center h-[42px]",
                                scheduleR2 ? "active:scale-95 cursor-pointer" : "cursor-not-allowed opacity-50"
                              )}
                              style={{
                                background: scheduleR2 ? "rgba(167, 139, 250, 0.08)" : "rgba(167, 139, 250, 0.03)",
                                border: scheduleR2 ? "1px solid rgba(167, 139, 250, 0.40)" : "1px solid rgba(167, 139, 250, 0.15)",
                                color: "#A78BFA",
                              }}
                              onMouseEnter={e => {
                                if (scheduleR2) e.currentTarget.style.background = "rgba(167, 139, 250, 0.16)";
                              }}
                              onMouseLeave={e => {
                                if (scheduleR2) e.currentTarget.style.background = "rgba(167, 139, 250, 0.08)";
                              }}
                              onClick={() => {
                                if (!scheduleR2 || isNaN(new Date(scheduleR2).getTime())) {
                                  setScheduleR2Error("Please select a valid date and time before scheduling.");
                                  return;
                                }
                                addInterview({
                                  id: crypto.randomUUID(),
                                  candidateId: c.id,
                                  round: 2,
                                  scheduledAt: new Date(scheduleR2).toISOString(),
                                  status: "scheduled",
                                  notes: "",
                                  decision: null,
                                  createdAt: new Date().toISOString()
                                });
                                updateCandidate(c.id, { status: "interview_2" });
                                setScheduleR2("");
                                setScheduleR2Error("");
                              }}>
                              Schedule R2
                            </Btn>
                          </div>
                          {scheduleR2Error && (
                            <div className="text-[11px] font-mono text-red-400 mt-0.5 px-0.5">
                              ⚠ {scheduleR2Error}
                            </div>
                          )}
                        </div>
                      )}

                      {r2 && (
                        <div className="flex flex-col gap-2.5">
                          <div className="text-xs text-[#9A9DA6] flex items-center gap-1.5 flex-wrap">
                            <Calendar className="w-3.5 h-3.5 text-[#70747D]" />
                            <span>Scheduled: {r2.scheduledAt ? new Date(r2.scheduledAt).toLocaleString() : "Date not set"}</span>
                          </div>

                          {/* Scheduled State Actions */}
                          {isR2Scheduled && (
                            <div className="flex flex-col gap-2 mt-0.5">
                              <textarea
                                placeholder="Interview Notes..."
                                value={r2Notes}
                                onChange={e => setR2Notes(e.target.value)}
                                className="w-full bg-[#0E0F12] text-[var(--text)] text-xs border border-[#24272D] rounded-lg p-2.5 outline-none h-16 focus:border-[#A78BFA]/50 transition-colors"
                              />
                              <div className="flex flex-wrap items-center gap-2 pt-1">
                                <button
                                  type="button"
                                  onClick={() => {
                                    updateInterview(r2.id, { status: "completed", decision: "select", notes: r2Notes });
                                    updateCandidate(c.id, { status: "offer" });
                                    addOffer({
                                      id: crypto.randomUUID(), candidateId: c.id, contractTemplateId: null,
                                      status: "draft", sentAt: null, respondedAt: null, createdAt: new Date().toISOString()
                                    });
                                  }}
                                  className="inline-flex items-center justify-center gap-1.5 h-[38px] px-3.5 rounded-[8px] text-xs font-semibold tracking-normal transition-all cursor-pointer select-none active:scale-[0.98] flex-1 min-w-[110px]"
                                  style={{
                                    background: "rgba(34, 197, 94, 0.08)",
                                    border: "1px solid rgba(34, 197, 94, 0.35)",
                                    color: "#22C55E",
                                  }}
                                  onMouseEnter={e => {
                                    e.currentTarget.style.background = "rgba(34, 197, 94, 0.15)";
                                    e.currentTarget.style.borderColor = "rgba(34, 197, 94, 0.55)";
                                  }}
                                  onMouseLeave={e => {
                                    e.currentTarget.style.background = "rgba(34, 197, 94, 0.08)";
                                    e.currentTarget.style.borderColor = "rgba(34, 197, 94, 0.35)";
                                  }}
                                >
                                  <Check className="w-3.5 h-3.5 text-[#22C55E]" />
                                  <span>Approve</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => {
                                    const reason = prompt("Reason for rejection:");
                                    if (reason !== null) {
                                      const note = r2Notes + (reason ? `\nRejection Reason: ${reason}` : "");
                                      updateInterview(r2.id, { status: "completed", decision: "reject", notes: note });
                                      updateCandidate(c.id, { status: "rejected", note: (c.note || "") + `\nRejected in R2: ${reason}` });
                                    }
                                  }}
                                  className="inline-flex items-center justify-center gap-1.5 h-[38px] px-3.5 rounded-[8px] text-xs font-semibold tracking-normal transition-all cursor-pointer select-none active:scale-[0.98]"
                                  style={{
                                    background: "rgba(239, 68, 68, 0.08)",
                                    border: "1px solid rgba(239, 68, 68, 0.35)",
                                    color: "#EF4444",
                                  }}
                                  onMouseEnter={e => {
                                    e.currentTarget.style.background = "rgba(239, 68, 68, 0.15)";
                                    e.currentTarget.style.borderColor = "rgba(239, 68, 68, 0.55)";
                                  }}
                                  onMouseLeave={e => {
                                    e.currentTarget.style.background = "rgba(239, 68, 68, 0.08)";
                                    e.currentTarget.style.borderColor = "rgba(239, 68, 68, 0.35)";
                                  }}
                                >
                                  <X className="w-3.5 h-3.5 text-[#EF4444]" />
                                  <span>Reject</span>
                                </button>
                              </div>
                            </div>
                          )}

                          {/* Completed State Details */}
                          {isR2Completed && (
                            <div className="flex flex-col gap-1.5 text-xs text-[#70747D]">
                              <div className="flex items-center gap-1.5">
                                <span className="text-[#9A9DA6]">Decision:</span>
                                <span className="font-semibold text-[#22C55E]">Selected / Approved</span>
                              </div>
                              {r2.notes && (
                                <div className="text-xs text-[#8B919C] bg-[#0E0F12] p-2 rounded-lg border border-[#24272D]">
                                  <span className="text-[#606060] font-medium block text-[11px] mb-0.5">Interview Notes:</span>
                                  {r2.notes}
                                </div>
                              )}
                            </div>
                          )}

                          {/* Rejected State Details */}
                          {isR2Rejected && (
                            <div className="flex flex-col gap-1.5 text-xs text-[#70747D]">
                              <div className="flex items-center gap-1.5">
                                <span className="text-[#9A9DA6]">Decision:</span>
                                <span className="font-semibold text-[#EF4444]">Rejected</span>
                              </div>
                              {r2.notes && (
                                <div className="text-xs text-[#8B919C] bg-[#0E0F12] p-2 rounded-lg border border-[#24272D]">
                                  <span className="text-[#606060] font-medium block text-[11px] mb-0.5">Notes:</span>
                                  {r2.notes}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Offer Management */}
          {["approved", "offer", "offer_sent", "offer_accepted", "offer_rejected", "onboarding_requested", "onboarding_review", "onboarding_verified", "onboarding_rejected", "hired"].includes(c.status) && (
            <div
              className="mt-6 flex flex-col gap-3.5 rounded-[12px] p-5"
              style={{
                background: "#111214",
                border: "1px solid #24272D",
              }}
            >
              {/* Section Header */}
              <div className="flex items-center gap-2">
                <Briefcase
                  className="w-3.5 h-3.5"
                  style={{ color: candidateOffer?.status === "accepted" ? "#22C55E" : "#A78BFA" }}
                />
                <span
                  className="text-[12px] font-semibold uppercase tracking-[0.08em]"
                  style={{ color: candidateOffer?.status === "accepted" ? "#22C55E" : "#A78BFA" }}
                >
                  Offer Management
                </span>
              </div>
              
              <div
                className="p-4 rounded-[10px] flex flex-col gap-3"
                style={{ background: "#16171B", border: "1px solid #24272D" }}
              >
                {!candidateOffer ? (
                  c.status === "approved" ? (
                  <div className="flex flex-col gap-2">
                    <div className="text-xs text-[#9A9DA6] mb-1">Ready to extend an offer? You can generate a contract first or proceed directly.</div>
                    <Btn className="bg-[var(--primary)] text-black text-xs font-bold px-4 py-2 rounded-lg self-start"
                      onClick={() => {
                        addOffer({
                          id: crypto.randomUUID(), candidateId: c.id, contractTemplateId: null,
                          status: "draft", sentAt: null, respondedAt: null, createdAt: new Date().toISOString()
                        });
                        updateCandidate(c.id, { status: "offer" });
                      }}>Prepare Offer</Btn>
                  </div>
                  ) : (
                    <div className="text-xs text-[#777B84]">No offer prepared.</div>
                  )
                ) : (
                  <div className="flex flex-col gap-2.5">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-[#9A9DA6]" />
                        <span className="font-semibold text-sm text-[#E7E9ED]">
                          Offer Status: <span className="uppercase" style={{
                            color: candidateOffer.status === "accepted" ? "#22C55E"
                              : candidateOffer.status === "sent" ? "#00D9FF"
                              : candidateOffer.status === "rejected" ? "#EF4444"
                              : "#F5C542"
                          }}>{candidateOffer.status}</span>
                        </span>
                      </div>
                      <span
                        className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-[6px]"
                        style={{
                          background: candidateOffer.status === "accepted" ? "rgba(34, 197, 94, 0.08)"
                            : candidateOffer.status === "sent" ? "rgba(0, 217, 255, 0.08)"
                            : candidateOffer.status === "rejected" ? "rgba(239, 68, 68, 0.08)"
                            : "rgba(245, 197, 66, 0.08)",
                          border: candidateOffer.status === "accepted" ? "1px solid rgba(34, 197, 94, 0.30)"
                            : candidateOffer.status === "sent" ? "1px solid rgba(0, 217, 255, 0.30)"
                            : candidateOffer.status === "rejected" ? "1px solid rgba(239, 68, 68, 0.30)"
                            : "1px solid rgba(245, 197, 66, 0.30)",
                          color: candidateOffer.status === "accepted" ? "#22C55E"
                            : candidateOffer.status === "sent" ? "#00D9FF"
                            : candidateOffer.status === "rejected" ? "#EF4444"
                            : "#F5C542",
                        }}
                      >
                        {candidateOffer.status === "accepted" ? "Offer Accepted"
                          : candidateOffer.status === "sent" ? "Offer Sent"
                          : candidateOffer.status === "rejected" ? "Offer Rejected"
                          : "Offer Draft"}
                      </span>
                    </div>

                    {candidateOffer.status === "draft" && c.status === "offer" && (
                      <div className="flex gap-2 mt-1">
                        <Btn className="bg-[var(--glass-3)] text-white text-xs font-semibold px-4 py-2 rounded-lg flex-1 border border-[var(--border)] hover:bg-[var(--glass-4)] transition-all" 
                          onClick={() => {
                            updateOffer(candidateOffer.id, { status: "sent", sentAt: new Date().toISOString() });
                            updateCandidate(c.id, { status: "offer_sent" });
                          }}>Mark as Sent</Btn>
                        <Btn className="bg-[var(--glass-3)] text-[var(--primary)] text-xs font-semibold px-4 py-2 rounded-lg flex-1 border border-[var(--primary)] hover:bg-[var(--glass-4)] transition-all" 
                          onClick={() => {
                            setDocStudioType(c.roleName?.toLowerCase().includes("intern") ? "offer-internship" : "offer-fulltime");
                            setIsDocStudioOpen(true);
                          }}>📄 Studio Offer</Btn>
                      </div>
                    )}
                    {candidateOffer.status === "sent" && c.status === "offer_sent" && (
                      <div className="text-xs text-[#9A9DA6] p-3 bg-[#0E0F12] rounded-lg border border-[#24272D] mt-1">
                        <p>Waiting for candidate response. The candidate can review and respond via:</p>
                        <a href={`/offer/${c.id}`} target="_blank" rel="noreferrer" className="text-[#00D9FF] underline block mt-1.5 font-semibold hover:text-[#00D9FF]/80">Open Candidate Offer Page</a>
                      </div>
                    )}
                    {(candidateOffer.status === "accepted" || candidateOffer.status === "rejected") && (
                      <div className="flex flex-col gap-2 mt-1">
                        <div className="text-xs text-[#777B84]">
                          Responded at: {new Date(candidateOffer.respondedAt!).toLocaleString()}
                        </div>
                        {candidateOffer.status === "accepted" && (
                          <div className="flex gap-2">
                            <Btn className="bg-[var(--glass-3)] text-white text-xs font-semibold px-4 py-2 rounded-lg border border-[var(--border)] hover:bg-[var(--glass-4)] transition-all" 
                              onClick={() => {
                                setDocStudioType(c.roleName?.toLowerCase().includes("intern") ? "offer-internship" : "offer-fulltime");
                                setIsDocStudioOpen(true);
                              }}>📄 Download / View Offer</Btn>
                          </div>
                        )}
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
              
              <div
                className="rounded-[12px] p-4 sm:p-5 flex flex-col gap-3.5 transition-all"
                style={{
                  background: "#111214",
                  border: "1px solid #24272D",
                }}
              >
                {/* Header */}
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-[#A1A7B3]">
                      <FileText className="w-3.5 h-3.5" />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-white tracking-tight">Documents</span>
                      {candidateDocs.length > 0 && (
                        <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-white/[0.05] border border-white/[0.08] text-[var(--text-2)]">
                          {candidateDocs.filter(d => d.status === "verified").length}/{candidateDocs.length} Verified
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setDocStudioType("employee-agreement");
                        setIsDocStudioOpen(true);
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-blue-600/20 hover:bg-blue-600/35 border border-blue-500/30 hover:border-blue-500/50 active:scale-95 transition-all cursor-pointer shadow-[0_0_12px_rgba(59,130,246,0.12)]"
                    >
                      <FileText className="w-3.5 h-3.5 text-blue-400" />
                      <span>Generate Docs</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(`${getPublicBaseUrl()}/onboarding/${c.id}`);
                        setCopiedUploadLink(true);
                        setTimeout(() => setCopiedUploadLink(false), 2000);
                        dialog.success("Candidate upload link copied to clipboard.");
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-[#D1D5DB] hover:text-white bg-white/[0.04] hover:bg-white/[0.09] border border-white/[0.10] hover:border-white/[0.20] active:scale-95 transition-all cursor-pointer"
                    >
                      {copiedUploadLink ? (
                        <Check className="w-3.5 h-3.5 text-[#22C55E]" />
                      ) : (
                        <Copy className="w-3.5 h-3.5 text-[#9A9DA6]" />
                      )}
                      <span>{copiedUploadLink ? "Copied Link" : "Copy Upload Link"}</span>
                    </button>
                  </div>
                </div>

                {/* Documents List */}
                {candidateDocs.length === 0 ? (
                  <div
                    className="p-6 rounded-[10px] flex flex-col items-center justify-center text-center gap-1.5"
                    style={{ background: "#16171B", border: "1px dashed #24272D" }}
                  >
                    <FileText className="w-6 h-6 text-white/20 mb-1" />
                    <div className="text-xs font-medium text-[#9A9DA6]">No documents uploaded yet.</div>
                    <div className="text-[11px] text-[var(--text-3)]">Share the upload link above to collect candidate onboarding documents.</div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    {candidateDocs.map(doc => {
                      const isPending = doc.status === "pending";
                      const isVerified = doc.status === "verified";
                      const isRejected = doc.status === "rejected";

                      return (
                        <div
                          key={doc.id}
                          className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 sm:px-4 sm:py-2.5 rounded-[10px] transition-all duration-150 group"
                          style={{
                            background: "#16171B",
                            border: "1px solid #24272D",
                          }}
                        >
                          {/* File Details */}
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <div className="w-8 h-8 rounded-lg bg-white/[0.04] border border-white/[0.08] flex items-center justify-center flex-shrink-0 text-[#9A9DA6] group-hover:text-white group-hover:border-white/20 transition-all">
                              <FileText className="w-4 h-4 text-[#A78BFA]" />
                            </div>

                            <div className="flex flex-col min-w-0 flex-1 gap-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span
                                  className="text-xs sm:text-[13px] font-semibold text-[#F1F3F5] truncate max-w-[220px] sm:max-w-[340px]"
                                  title={doc.fileName}
                                >
                                  {doc.fileName}
                                </span>

                                <span
                                  className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-[5px]"
                                  style={{
                                    background: "rgba(255, 255, 255, 0.05)",
                                    border: "1px solid rgba(255, 255, 255, 0.10)",
                                    color: "#A1A7B3",
                                  }}
                                >
                                  {doc.type || "Document"}
                                </span>
                              </div>

                              <div className="flex items-center gap-2 text-[11px]">
                                {isPending && (
                                  <span className="inline-flex items-center gap-1 font-medium text-amber-400/90">
                                    <Clock className="w-3 h-3 text-amber-400" />
                                    <span>Pending verification</span>
                                  </span>
                                )}
                                {isVerified && (
                                  <span className="inline-flex items-center gap-1 font-medium text-[#22C55E]">
                                    <CheckCircle2 className="w-3 h-3 text-[#22C55E]" />
                                    <span>Verified</span>
                                  </span>
                                )}
                                {isRejected && (
                                  <span className="inline-flex items-center gap-1 font-medium text-[#EF4444]">
                                    <AlertCircle className="w-3 h-3 text-[#EF4444]" />
                                    <span>Rejected</span>
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-2 flex-shrink-0 self-end sm:self-center">
                            <button
                              type="button"
                              onClick={async () => {
                                const url = await getDocumentSignedUrl(doc.filePath);
                                if (url) window.open(url, '_blank');
                                else dialog.error("Failed to open document securely.");
                              }}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-[#D1D5DB] hover:text-white bg-white/[0.04] hover:bg-white/[0.09] border border-white/[0.10] hover:border-white/[0.20] active:scale-95 transition-all cursor-pointer"
                              title="View document in new tab"
                            >
                              <ExternalLink className="w-3.5 h-3.5 text-[#9A9DA6]" />
                              <span>View</span>
                            </button>

                            {isPending ? (
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => {
                                    updateDocument(doc.id, { status: "verified" });
                                    const allOtherVerified = candidateDocs.filter(d => d.id !== doc.id).every(d => d.status === "verified");
                                    if (allOtherVerified) {
                                      updateCandidate(c.id, { status: "onboarding_verified" });
                                    } else {
                                      updateCandidate(c.id, { status: "onboarding_review" });
                                    }
                                  }}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-[#22C55E] hover:text-[#4ADE80] transition-all cursor-pointer active:scale-95"
                                  style={{
                                    background: "rgba(34, 197, 94, 0.10)",
                                    border: "1px solid rgba(34, 197, 94, 0.35)",
                                    boxShadow: "0 0 12px rgba(34, 197, 94, 0.10)",
                                  }}
                                  onMouseEnter={e => {
                                    e.currentTarget.style.background = "rgba(34, 197, 94, 0.18)";
                                    e.currentTarget.style.borderColor = "rgba(34, 197, 94, 0.60)";
                                  }}
                                  onMouseLeave={e => {
                                    e.currentTarget.style.background = "rgba(34, 197, 94, 0.10)";
                                    e.currentTarget.style.borderColor = "rgba(34, 197, 94, 0.35)";
                                  }}
                                >
                                  <Check className="w-3.5 h-3.5" />
                                  <span>Verify</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => {
                                    updateDocument(doc.id, { status: "rejected" });
                                    updateCandidate(c.id, { status: "onboarding_rejected" });
                                  }}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-[#EF4444] hover:text-[#F87171] transition-all cursor-pointer active:scale-95"
                                  style={{
                                    background: "rgba(239, 68, 68, 0.10)",
                                    border: "1px solid rgba(239, 68, 68, 0.35)",
                                  }}
                                  onMouseEnter={e => {
                                    e.currentTarget.style.background = "rgba(239, 68, 68, 0.18)";
                                    e.currentTarget.style.borderColor = "rgba(239, 68, 68, 0.60)";
                                  }}
                                  onMouseLeave={e => {
                                    e.currentTarget.style.background = "rgba(239, 68, 68, 0.10)";
                                    e.currentTarget.style.borderColor = "rgba(239, 68, 68, 0.35)";
                                  }}
                                >
                                  <X className="w-3.5 h-3.5" />
                                  <span>Reject</span>
                                </button>
                              </div>
                            ) : (
                              <span
                                className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-[6px] inline-flex items-center gap-1.5"
                                style={{
                                  background: isVerified ? "rgba(34, 197, 94, 0.08)" : "rgba(239, 68, 68, 0.08)",
                                  border: isVerified ? "1px solid rgba(34, 197, 94, 0.30)" : "1px solid rgba(239, 68, 68, 0.30)",
                                  color: isVerified ? "#22C55E" : "#EF4444",
                                }}
                              >
                                {isVerified ? (
                                  <>
                                    <CheckCircle2 className="w-3 h-3 text-[#22C55E]" />
                                    <span>Verified</span>
                                  </>
                                ) : (
                                  <>
                                    <AlertCircle className="w-3 h-3 text-[#EF4444]" />
                                    <span>Rejected</span>
                                  </>
                                )}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
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
                  dialog.info("Email address is unavailable for this candidate.");
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
                  dialog.info("Phone number is unavailable for this candidate.");
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
              disabled={isDeleting}
              className="text-sm font-semibold px-5 py-2.5 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ background: "rgba(255,68,68,0.08)", border: "1px solid rgba(255,68,68,0.2)", color: "var(--red)" }}>
              {isDeleting ? "Deleting..." : "Delete"}
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
