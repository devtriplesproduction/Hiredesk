"use client";
import { useStore } from "@/lib/store";
import { getDocumentSignedUrl } from "@/lib/supabase";
import { Btn, ScoreBadge, StatusBadge, SkillTag, dialog } from "@/components/ui";
import type { Candidate, EmploymentStatus, Employee } from "@/types";
import { getEmploymentStatusMeta, scoreCandidateFromText } from "@/lib/data";
import { clsx } from "clsx";
import { useRouter } from "next/navigation";
import { getPublicBaseUrl } from "@/lib/url";
import { useState, useEffect, useMemo } from "react";
import PDFViewer from "@/components/candidates/PDFViewer";
import WhatsAppModal from "@/components/candidates/WhatsAppModal";
import EmailModal from "@/components/candidates/EmailModal";
import { DocumentStudioModal } from "@/components/documents/DocumentStudioModal";
import DateTimePicker from "@/components/ui/DateTimePicker";
import { Check, X, User, BarChart2, FileText, CheckCircle2, Clock, Calendar, Briefcase, GitBranch, ExternalLink, Copy, AlertCircle, Lock, ArrowRight, UserCheck, Loader2, Activity, Sparkles, Send, Edit3, MessageSquare, History, CheckCheck, Award, Mail, Phone as PhoneIcon, MapPin, GraduationCap, Building2, ChevronRight, ChevronDown, ChevronUp, LayoutGrid } from "lucide-react";

interface Props { candidate: Candidate; onClose: () => void; }

const STATUSES: Candidate["status"][] = ["new", "review", "shortlisted", "interview_1", "interview_2", "approved", "offer", "offer_sent", "offer_accepted", "offer_rejected", "onboarding_requested", "onboarding_review", "onboarding_verified", "onboarding_rejected", "hired", "rejected"];

export default function CandidateDetail({ candidate: c, onClose }: Props) {
  const { updateCandidate, deleteCandidate, interviews, addInterview, updateInterview, offers, addOffer, updateOffer, documents, updateDocument, employees, addEmployee, updateEmployee, employeeBonds, updateEmployeeBond, employeeResignations, addEmployeeResignation, roles } = useStore();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"profile" | "pipeline" | "score" | "resume">("profile");
  const [resumeMode, setResumeMode] = useState<"pdf" | "text">(c.resumeUrl ? "pdf" : "text");
  const [isWhatsAppOpen, setIsWhatsAppOpen] = useState(false);
  const [isEmailOpen, setIsEmailOpen] = useState(false);
  const [isDocStudioOpen, setIsDocStudioOpen] = useState(false);
  const [docStudioType, setDocStudioType] = useState<string | undefined>();
  const [copiedUploadLink, setCopiedUploadLink] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const copyToClipboard = (text: string, fieldName: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

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

  // Cleaned and filtered skills (excluding dates and noise)
  const cleanSkills = useMemo(() => {
    if (!c.skills || !Array.isArray(c.skills)) return [];
    return c.skills.filter(s => {
      if (!s || typeof s !== "string") return false;
      const trimmed = s.trim();
      if (trimmed.length < 2) return false;
      // Exclude date ranges like "July2025 - July2026", "2024-2025", etc.
      if (/(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|\d{4})\s*[-–—to]\s*(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|\d{4}|present)/i.test(trimmed)) {
        return false;
      }
      if (/^[\d\s\-.,/]+$/.test(trimmed)) return false;
      return true;
    });
  }, [c.skills]);

  // Timeline Tab state ("all" | "timeline" | "notes")
  const [timelineTab, setTimelineTab] = useState<"all" | "timeline" | "notes">("all");
  // Collapsible Activity & Notes state (collapsed by default)
  const [isActivityOpen, setIsActivityOpen] = useState(false);
  // Profile Sub-tab state ("overview" | "skills" | "activity" | "stage" | "all")
  const [profileSubTab, setProfileSubTab] = useState<"overview" | "skills" | "activity" | "stage" | "all">("overview");

  // Safe date parser for DD/MM/YYYY or standard dates
  function parseSafeDate(dateStr?: string | null): Date | null {
    if (!dateStr) return null;
    const str = String(dateStr).trim();
    const dmy = str.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
    if (dmy) {
      const [, d, m, y] = dmy;
      const date = new Date(Number(y), Number(m) - 1, Number(d));
      if (!isNaN(date.getTime())) return date;
    }
    const date = new Date(str);
    if (!isNaN(date.getTime())) return date;
    return null;
  }

  // Computed Candidate Activity Events
  const timelineEvents = useMemo(() => {
    interface TimelineEvent {
      id: string;
      title: string;
      description: string;
      timestamp: string | null;
      icon: string;
      color: string;
      sortTime: number;
    }

    const events: TimelineEvent[] = [];

    // 1. Application Received & Resume parsed
    if (c.appliedAt || c.createdAt) {
      const appTime = c.appliedAt || c.createdAt;
      const d = parseSafeDate(appTime);
      events.push({
        id: `app-received-${c.id}`,
        title: "Application Received",
        description: `Candidate profile created for ${c.roleName || "open role"}${c.city ? ` in ${c.city}` : ""}.`,
        timestamp: appTime,
        icon: "📥",
        color: "#60A5FA", // blue
        sortTime: d ? d.getTime() : 0,
      });
    }

    if (c.resumeFile) {
      const parseTime = c.createdAt || c.appliedAt;
      events.push({
        id: `resume-parsed-${c.id}`,
        title: "Resume Uploaded & Parsed",
        description: `Uploaded "${c.resumeFile}" (Score: ${c.score?.total ?? 0}/100, Skills: ${c.skills?.length || 0} detected).`,
        timestamp: parseTime,
        icon: "📄",
        color: "var(--tab-purple-text)", // purple
        sortTime: (new Date(parseTime).getTime() || 0) + 1000,
      });
    }

    // 2. Shortlisted & Screening status changes
    if (["shortlisted", "interview_1", "interview_2", "approved", "offer", "offer_sent", "offer_accepted", "offer_rejected", "onboarding_requested", "onboarding_review", "onboarding_verified", "onboarding_rejected", "hired"].includes(c.status)) {
      const shortlistTime = r1?.createdAt || c.createdAt;
      events.push({
        id: `candidate-shortlisted-${c.id}`,
        title: "Candidate Shortlisted",
        description: "Candidate screening approved and marked eligible for technical evaluation.",
        timestamp: shortlistTime,
        icon: "⭐",
        color: "var(--tab-cyan-text)", // cyan
        sortTime: (new Date(shortlistTime).getTime() || 0) + 2000,
      });
    }

    // 3. Round 1 Interviews
    if (r1) {
      if (r1.scheduledAt) {
        events.push({
          id: `r1-scheduled-${r1.id}`,
          title: "Round 1 Scheduled",
          description: `Technical evaluation round scheduled for ${new Date(r1.scheduledAt).toLocaleString()}.`,
          timestamp: r1.createdAt || r1.scheduledAt,
          icon: "📅",
          color: "#818CF8", // indigo
          sortTime: new Date(r1.createdAt || r1.scheduledAt).getTime() || 0,
        });
      }

      if (r1.status === "completed") {
        const isPassed = r1.decision === "select";
        events.push({
          id: `r1-completed-${r1.id}`,
          title: isPassed ? "Round 1 Completed · Selected" : "Round 1 Completed · Rejected",
          description: isPassed
            ? `Candidate passed Round 1 evaluation.${r1.notes ? ` Notes: "${r1.notes}"` : ""}`
            : `Candidate was rejected in Round 1.${r1.notes ? ` Notes: "${r1.notes}"` : ""}`,
          timestamp: r1.scheduledAt || r1.createdAt,
          icon: isPassed ? "✅" : "❌",
          color: isPassed ? "#22C55E" : "#EF4444",
          sortTime: (new Date(r1.scheduledAt || r1.createdAt).getTime() || 0) + 3600000,
        });
      }
    }

    // 4. Round 2 Interviews
    if (r2) {
      if (r2.scheduledAt) {
        events.push({
          id: `r2-scheduled-${r2.id}`,
          title: "Round 2 Scheduled",
          description: `Final interview round scheduled for ${new Date(r2.scheduledAt).toLocaleString()}.`,
          timestamp: r2.createdAt || r2.scheduledAt,
          icon: "📅",
          color: "#C084FC", // violet
          sortTime: new Date(r2.createdAt || r2.scheduledAt).getTime() || 0,
        });
      }

      if (r2.status === "completed") {
        const isPassed = r2.decision === "select";
        events.push({
          id: `r2-completed-${r2.id}`,
          title: isPassed ? "Round 2 Completed · Approved" : "Round 2 Completed · Rejected",
          description: isPassed
            ? `Candidate approved in final interview.${r2.notes ? ` Notes: "${r2.notes}"` : ""}`
            : `Candidate was rejected in Round 2.${r2.notes ? ` Notes: "${r2.notes}"` : ""}`,
          timestamp: r2.scheduledAt || r2.createdAt,
          icon: isPassed ? "🎉" : "❌",
          color: isPassed ? "#22C55E" : "#EF4444",
          sortTime: (new Date(r2.scheduledAt || r2.createdAt).getTime() || 0) + 3600000,
        });
      }
    }

    // 5. Offer Management
    if (candidateOffer) {
      events.push({
        id: `offer-draft-${candidateOffer.id}`,
        title: "Offer Letter Generated",
        description: `Official offer package drafted for ${c.name} (${c.roleName || "Position"}).`,
        timestamp: candidateOffer.createdAt,
        icon: "📝",
        color: "#F59E0B", // amber
        sortTime: new Date(candidateOffer.createdAt).getTime() || 0,
      });

      if (candidateOffer.sentAt || candidateOffer.status === "sent" || c.status === "offer_sent") {
        events.push({
          id: `offer-sent-${candidateOffer.id}`,
          title: "Offer Dispatched to Candidate",
          description: "Candidate offer link generated and dispatched for electronic review & acceptance.",
          timestamp: candidateOffer.sentAt || candidateOffer.createdAt,
          icon: "📤",
          color: "var(--tab-cyan-text)", // cyan
          sortTime: new Date(candidateOffer.sentAt || candidateOffer.createdAt).getTime() || 0,
        });
      }

      if (candidateOffer.status === "accepted" || c.status === "offer_accepted") {
        events.push({
          id: `offer-accepted-${candidateOffer.id}`,
          title: "Offer Accepted by Candidate",
          description: `Candidate accepted employment terms.${candidateOffer.respondedAt ? ` Verified at ${new Date(candidateOffer.respondedAt).toLocaleString()}.` : ""}`,
          timestamp: candidateOffer.respondedAt || candidateOffer.sentAt || candidateOffer.createdAt,
          icon: "🤝",
          color: "#22C55E", // green
          sortTime: new Date(candidateOffer.respondedAt || candidateOffer.sentAt || candidateOffer.createdAt).getTime() || 0,
        });
      }

      if (candidateOffer.status === "rejected" || c.status === "offer_rejected") {
        events.push({
          id: `offer-rejected-${candidateOffer.id}`,
          title: "Offer Declined by Candidate",
          description: `Candidate declined the extended offer.${candidateOffer.respondedAt ? ` Logged at ${new Date(candidateOffer.respondedAt).toLocaleString()}.` : ""}`,
          timestamp: candidateOffer.respondedAt || candidateOffer.sentAt || candidateOffer.createdAt,
          icon: "⚠️",
          color: "#EF4444", // red
          sortTime: new Date(candidateOffer.respondedAt || candidateOffer.sentAt || candidateOffer.createdAt).getTime() || 0,
        });
      }
    }

    // 6. Onboarding Lifecycle & Documents
    if (c.status.startsWith("onboarding_") || candidateDocs.length > 0 || c.status === "hired") {
      events.push({
        id: `onboarding-initiated-${c.id}`,
        title: "Onboarding Initiated",
        description: "Document collection upload portal opened for candidate submission.",
        timestamp: candidateDocs[0]?.createdAt || candidateOffer?.respondedAt || c.createdAt,
        icon: "🚀",
        color: "var(--tab-purple-text)",
        sortTime: new Date(candidateDocs[0]?.createdAt || candidateOffer?.respondedAt || c.createdAt).getTime() || 0,
      });
    }

    // Documents Uploaded / Verified / Rejected
    candidateDocs.forEach(doc => {
      // Document Uploaded
      events.push({
        id: `doc-uploaded-${doc.id}`,
        title: `Document Uploaded: ${doc.type || "File"}`,
        description: `Uploaded file "${doc.fileName}" submitted by candidate.`,
        timestamp: doc.createdAt,
        icon: "📎",
        color: "#38BDF8", // sky
        sortTime: new Date(doc.createdAt).getTime() || 0,
      });

      // Verification / Rejection status
      if (doc.status === "verified") {
        events.push({
          id: `doc-verified-${doc.id}`,
          title: `Document Verified: ${doc.type || doc.fileName}`,
          description: `Admin successfully inspected and verified compliance for "${doc.fileName}".`,
          timestamp: doc.updatedAt || doc.createdAt,
          icon: "✅",
          color: "#22C55E",
          sortTime: (new Date(doc.updatedAt || doc.createdAt).getTime() || 0) + 1000,
        });
      } else if (doc.status === "rejected") {
        events.push({
          id: `doc-rejected-${doc.id}`,
          title: `Document Rejected: ${doc.type || doc.fileName}`,
          description: `Compliance rejected for "${doc.fileName}". Candidate must re-submit.`,
          timestamp: doc.updatedAt || doc.createdAt,
          icon: "❌",
          color: "#EF4444",
          sortTime: (new Date(doc.updatedAt || doc.createdAt).getTime() || 0) + 1000,
        });
      }
    });

    // 7. Converted to Employee / Hired
    if (candidateEmployee || c.status === "hired") {
      const hireTime = candidateEmployee?.createdAt || new Date().toISOString();
      events.push({
        id: `employee-converted-${c.id}`,
        title: "Converted to Employee",
        description: `Candidate successfully onboarded as official employee (${candidateEmployee?.employmentType || "Full-time"}).`,
        timestamp: hireTime,
        icon: "🎓",
        color: "#10B981", // emerald
        sortTime: new Date(hireTime).getTime() || 0,
      });
    }

    // 8. Resignation / Separation
    if (employeeResignation) {
      events.push({
        id: `employee-resigned-${employeeResignation.id}`,
        title: employeeResignation.isBreach ? "Employee Separation · Bond Breach" : "Employee Resignation Processed",
        description: `Reason: ${employeeResignation.resignationReason}${employeeResignation.breachReason ? ` · Breach: ${employeeResignation.breachReason}` : ""}`,
        timestamp: employeeResignation.createdAt,
        icon: "⚠️",
        color: "#EF4444",
        sortTime: new Date(employeeResignation.createdAt).getTime() || 0,
      });
    }

    // Sort chronologically descending (newest event first)
    return events.sort((a, b) => b.sortTime - a.sortTime);
  }, [c, r1, r2, candidateOffer, candidateDocs, candidateEmployee, employeeResignation]);

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
      
      if (data.employee) {
        const emp: Employee = {
          id: data.employee.id,
          candidateId: data.employee.candidateId || (data.employee as any).candidate_id,
          offerId: data.employee.offerId || (data.employee as any).offer_id,
          name: data.employee.name,
          email: data.employee.email,
          phone: data.employee.phone,
          employmentType: data.employee.employmentType || (data.employee as any).employment_type,
          bondRequirement: data.employee.bondRequirement || (data.employee as any).bond_requirement || "UNKNOWN",
          status: data.employee.status || "active",
          createdAt: data.employee.createdAt || (data.employee as any).created_at,
        };
        addEmployee(emp);
      }
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
        style={{ background: "var(--bg2)" }}
        onClick={() => {
          if (isWhatsAppOpen) setIsWhatsAppOpen(false);
          if (isEmailOpen) setIsEmailOpen(false);
          if (isDocStudioOpen) setIsDocStudioOpen(false);
        }}>

        {/* Top strip */}
        <div className="flex flex-col xl:flex-row xl:items-center justify-between p-6 sm:p-8 pb-5 gap-5" style={{ borderBottom: "1px solid var(--border)", background: "linear-gradient(to bottom, var(--glass-2), transparent)" }}>
          <div className="flex items-center gap-5 flex-1">
            {/* Avatar */}
            <div className={clsx(
              "w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center text-lg sm:text-xl font-bold flex-shrink-0 border transition-colors duration-300",
              isLowConfidence 
                ? "border-amber-500/30 bg-amber-500/5 text-amber-500" 
                : "border-[var(--border-2)] bg-[var(--glass-2)] text-text"
            )}>
              {(editState.name?.[0] ?? c.name?.[0] ?? "?").toUpperCase()}
            </div>
            
            <div className="flex-1 min-w-0">
              {isEditing ? (
                <input
                  type="text"
                  value={editState.name || ""}
                  onChange={e => setEditState(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full max-w-sm bg-[var(--glass-2)] border border-border rounded-xl px-3 py-1.5 text-base font-bold text-text outline-none focus:border-[var(--border-2)]"
                  placeholder="Candidate Name"
                />
              ) : isLowConfidence ? (
                /* Instant low confidence fallback form field directly in the header */
                <div className="flex flex-col gap-1.5">
                  <div className="text-[16px] uppercase font-bold tracking-widest text-amber-500/80">Suggested Candidate Name</div>
                  <input
                    type="text"
                    value={editState.name || ""}
                    onChange={e => handleInstantNameCorrection(e.target.value)}
                    className="w-full max-w-sm bg-amber-500/5 border border-amber-500/30 hover:border-amber-500/50 focus:border-amber-500 rounded-xl px-3 py-1 text-sm font-bold text-amber-100 outline-none transition-all"
                    placeholder="Enter Candidate Name"
                  />
                </div>
              ) : (
                <div className="text-lg sm:text-xl font-bold tracking-tight text-text truncate">
                  {c.name || "Unknown Candidate"}
                </div>
              )}
              
              <div className="text-xs sm:text-sm text-[var(--text-3)] font-medium mt-1 flex gap-2 items-center">
                {isEditing ? (
                  <select 
                    value={editState.roleId || c.roleId} 
                    onChange={e => {
                      const role = roles.find(r => r.id === e.target.value);
                      if (role) {
                        const newScore = scoreCandidateFromText(c.resumeText || "", role.keywords, {
                          name: c.name,
                          email: c.email,
                          phone: c.phone,
                          city: c.city,
                          education: c.education,
                          exp: c.exp,
                          skills: c.skills
                        });
                        setEditState(prev => ({ ...prev, roleId: role.id, roleName: role.name, score: newScore }));
                      }
                    }}
                    className="bg-[var(--glass-2)] border border-border rounded-lg px-2 py-1 outline-none focus:border-[var(--border-2)] text-text"
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

          {/* Single-line toolbar: Actions + Tabs + Cancel */}
          <div className="flex items-center gap-2 flex-wrap lg:flex-nowrap overflow-x-auto no-scrollbar self-start lg:self-center flex-shrink-0">
            {/* 1. Edit Profile / Save */}
            {isEditing ? (
              <Btn
                onClick={handleSave}
                className="h-[38px] text-xs font-semibold px-4 rounded-[10px] transition-all text-[var(--bg2)] bg-[var(--text)] hover:bg-[var(--text-2)] active:scale-95 shadow-lg inline-flex items-center gap-1.5 flex-shrink-0"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Save</span>
              </Btn>
            ) : !isLowConfidence && (
              <Btn
                onClick={() => setIsEditing(true)}
                className="h-[38px] text-xs font-semibold px-3.5 rounded-[10px] transition-all text-text hover:text-[var(--text)] bg-[var(--card-bg)] hover:bg-[var(--table-row-hover)] border border-[var(--border-2)] hover:border-[var(--border-3)] active:scale-95 inline-flex items-center gap-1.5 flex-shrink-0"
              >
                <Edit3 className="w-3.5 h-3.5 text-text-2" />
                <span>Edit Profile</span>
              </Btn>
            )}

            {/* 2. Document Studio */}
            <Btn
              onClick={() => setIsDocStudioOpen(true)}
              className="h-[38px] text-xs font-semibold px-3.5 rounded-[10px] transition-all text-[var(--btn-doc-text)] bg-[var(--btn-doc-bg)] hover:bg-[var(--btn-doc-hover-bg)] border border-[var(--btn-doc-border)] hover:border-[var(--btn-doc-hover-border)] active:scale-95 inline-flex items-center gap-1.5 flex-shrink-0"
            >
              <FileText className="w-3.5 h-3.5 text-[var(--btn-doc-icon)]" />
              <span>Document Studio</span>
            </Btn>

            {/* Divider */}
            <div className="w-[1px] h-6 bg-[var(--glass-3)] mx-0.5 hidden sm:block flex-shrink-0" />

            {/* 3. Profile / Pipeline / Score / Resume Tabs */}
            <div className="flex items-center gap-[5px] flex-shrink-0 select-none">
              {([
                { id: "profile", label: "Profile", icon: User, accent: "var(--tab-purple-text)", activeBg: "var(--tab-purple-bg)", activeBorder: "var(--tab-purple-border)", activeHoverBg: "var(--tab-purple-hover-bg)", hoverBorder: "var(--tab-purple-hover-border)" },
                { id: "pipeline", label: "Pipeline", icon: GitBranch, accent: "var(--tab-cyan-text)", activeBg: "var(--tab-cyan-bg)", activeBorder: "var(--tab-cyan-border)", activeHoverBg: "var(--tab-cyan-hover-bg)", hoverBorder: "var(--tab-cyan-hover-border)" },
                { id: "score", label: "Score", icon: BarChart2, accent: "var(--tab-purple-text)", activeBg: "var(--tab-purple-bg)", activeBorder: "var(--tab-purple-border)", activeHoverBg: "var(--tab-purple-hover-bg)", hoverBorder: "var(--tab-purple-hover-border)" },
                { id: "resume", label: "Resume", icon: FileText, accent: "var(--tab-cyan-text)", activeBg: "var(--tab-cyan-bg)", activeBorder: "var(--tab-cyan-border)", activeHoverBg: "var(--tab-cyan-hover-bg)", hoverBorder: "var(--tab-cyan-hover-border)" },
              ] as const).map(t => {
                const isActive = activeTab === t.id;
                const IconComponent = t.icon;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setActiveTab(t.id)}
                    className="inline-flex items-center justify-center gap-[6px] h-[38px] px-3 sm:px-4 rounded-[10px] text-[15px] font-semibold tracking-normal flex-shrink-0 cursor-pointer outline-none select-none transition-all"
                    style={{
                      background: isActive ? t.activeBg : "var(--card-bg)",
                      border: isActive ? `1px solid ${t.activeBorder}` : "1px solid var(--border-2)",
                      color: isActive ? t.accent : "var(--text-3)",
                    }}
                    onMouseEnter={e => {
                      if (isActive) {
                        e.currentTarget.style.background = t.activeHoverBg;
                      } else {
                        e.currentTarget.style.background = "var(--table-row-hover)";
                        e.currentTarget.style.borderColor = t.hoverBorder;
                        e.currentTarget.style.color = "var(--text-2)";
                      }
                    }}
                    onMouseLeave={e => {
                      if (isActive) {
                        e.currentTarget.style.background = t.activeBg;
                        e.currentTarget.style.borderColor = t.activeBorder;
                        e.currentTarget.style.color = t.accent;
                      } else {
                        e.currentTarget.style.background = "var(--card-bg)";
                        e.currentTarget.style.borderColor = "var(--border-2)";
                        e.currentTarget.style.color = "var(--text-3)";
                      }
                    }}
                  >
                    <IconComponent className="w-[14px] h-[14px]" style={{ color: "inherit" }} />
                    <span>{t.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Divider */}
            <div className="w-[1px] h-6 bg-[var(--glass-3)] mx-0.5 hidden sm:block flex-shrink-0" />

            {/* 4. Clearly visible Close / Cancel button */}
            <button
              type="button"
              onClick={onClose}
              className="h-[38px] px-3 rounded-[10px] flex items-center justify-center gap-1.5 text-xs font-semibold text-text-2 hover:text-[var(--text)] bg-[var(--card-bg)] hover:bg-[var(--table-row-hover)] border border-[var(--border-2)] hover:border-[var(--border-3)] active:scale-95 transition-all cursor-pointer flex-shrink-0 shadow-sm"
              title="Close (Cancel)"
              aria-label="Cancel and close"
            >
              <X className="w-4 h-4 text-text-2 hover:text-[var(--text)]" strokeWidth={2.2} />
              <span className="hidden sm:inline text-text-2">Close</span>
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 sm:p-8 pt-6 custom-scrollbar">
          {activeTab === "profile" && (
            <div className="flex flex-col gap-6 w-full">

              {/* Low Confidence Name Banner (if applicable) */}
              {isLowConfidence && (
                <div className="w-full flex items-start gap-3 p-4 rounded-xl text-xs font-semibold leading-relaxed border"
                  style={{ background: "rgba(245,158,11,0.06)", borderColor: "rgba(245,158,11,0.28)", color: "#f59e0b" }}>
                  <span className="text-base leading-none mt-0.5">⚠️</span>
                  <div className="flex-1">
                    <div className="font-extrabold text-[16px] uppercase tracking-wide">Please Verify Candidate Name ({c.extractionConfidence}% Confidence)</div>
                    <div className="text-text-2 mt-0.5 leading-normal font-medium">
                      The parser detected this name with lower confidence. You can quickly edit the name using the form above.
                    </div>
                  </div>
                </div>
              )}

              {/* Sub-Tabs Navigation for Profile Details */}
              <div className="flex items-center justify-between gap-3 flex-wrap border-b border-[var(--border-2)] pb-3.5">
                <div className="flex items-center gap-1.5 p-1 bg-[var(--card-bg)] border border-[var(--border-2)] rounded-xl overflow-x-auto no-scrollbar shadow-sm">
                  {([
                    { id: "overview", label: "Overview", icon: User, count: undefined, color: "text-purple-400" },
                    { id: "skills", label: "Skills", icon: Sparkles, count: cleanSkills.length, color: "text-cyan-400" },
                    { id: "activity", label: "Activity & Notes", icon: Activity, count: timelineEvents.length, color: "text-amber-400" },
                    { id: "stage", label: "Hiring Stage", icon: GitBranch, count: undefined, color: "text-emerald-400" },
                    { id: "all", label: "View All", icon: LayoutGrid, count: undefined, color: "text-text-2" },
                  ] as const).map(tab => {
                    const isCurrent = profileSubTab === tab.id;
                    const Icon = tab.icon;
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => {
                          setProfileSubTab(tab.id);
                          if (tab.id === "activity") setIsActivityOpen(true);
                        }}
                        className={clsx(
                          "inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer select-none flex-shrink-0",
                          isCurrent
                            ? "bg-[var(--glass-2)] text-text border border-[var(--border-2)] shadow-sm"
                            : "text-text-2 hover:text-text hover:bg-[var(--glass-2)] border border-transparent"
                        )}
                      >
                        <Icon className={clsx("w-3.5 h-3.5", isCurrent ? tab.color : "text-text-3")} />
                        <span>{tab.label}</span>
                        {tab.count !== undefined && (
                          <span className={clsx(
                            "text-[16px] font-mono px-1.5 py-0.2 rounded-full",
                            isCurrent ? "bg-[var(--glass-3)] text-text" : "bg-[var(--glass-2)] text-text-3"
                          )}>
                            {tab.count}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 1. Unified Candidate Overview Card */}
              {(profileSubTab === "overview" || profileSubTab === "all") && (
                <div className="rounded-2xl border border-[var(--border-2)] bg-[var(--card-bg)] p-4 sm:p-5 flex flex-col gap-4 shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
                {/* Header Strip */}
                <div className="flex items-center justify-between border-b border-[var(--border-2)] pb-3 flex-wrap gap-2.5">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400 shadow-sm">
                      <User className="w-4 h-4" />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-text">Candidate Overview</span>
                      <span className="hidden sm:inline-block text-[11px] text-text-3 font-medium">· Extracted Profile Details</span>
                    </div>
                  </div>
                  
                  {/* Quick Resume Link pill */}
                  {(c.resumeFile || c.resumeUrl || c.resumeText) && (
                    <button
                      type="button"
                      onClick={() => setActiveTab("resume")}
                      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold text-cyan-300 hover:text-text bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/25 hover:border-cyan-400/50 transition-all cursor-pointer select-none active:scale-95 shadow-sm group"
                      title="Preview candidate's resume"
                    >
                      <FileText className="w-3.5 h-3.5 text-cyan-400 group-hover:scale-110 transition-transform" />
                      <span className="truncate max-w-[180px] sm:max-w-[240px] font-medium">{c.resumeFile || "View Resume"}</span>
                      <ArrowRight className="w-3 h-3 text-cyan-400/70 group-hover:translate-x-0.5 transition-transform" />
                    </button>
                  )}
                </div>

                {/* Enhanced & High-Contrast Property Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {/* 1. Email */}
                  <div className="flex flex-col justify-between p-3.5 rounded-xl bg-[var(--glass-2)] hover:bg-[var(--glass-2)] border border-[var(--border-2)] hover:border-[var(--border-2)] transition-all min-h-[76px] group shadow-sm">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-[11px] font-bold text-sky-400 uppercase tracking-wider">
                        <Mail className="w-3.5 h-3.5 text-sky-400" />
                        <span>Email</span>
                      </div>
                      {!isEditing && c.email && (
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => copyToClipboard(c.email, "email")}
                            className="p-1 rounded text-text-2 hover:text-text hover:bg-[var(--glass-2)] transition-colors cursor-pointer"
                            title="Copy email"
                          >
                            {copiedField === "email" ? (
                              <Check className="w-3.5 h-3.5 text-emerald-400 animate-in zoom-in-75 duration-150" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setIsEmailOpen(true);
                            }}
                            className="p-1 rounded text-sky-400 hover:text-sky-300 hover:bg-sky-500/10 transition-colors cursor-pointer"
                            title="Send email"
                          >
                            <Send className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                    {isEditing ? (
                      <input
                        type="email"
                        value={editState.email || ""}
                        onChange={e => setEditState(prev => ({ ...prev, email: e.target.value }))}
                        className="w-full bg-[var(--glass-2)] border border-border-2 rounded-lg px-2.5 py-1 text-sm text-text outline-none focus:border-purple-500 mt-1.5"
                        placeholder="email@example.com"
                      />
                    ) : (
                      <div className="text-[14px] font-semibold text-[var(--text)] select-all break-all leading-snug mt-1.5" title={c.email || undefined}>
                        {c.email || <span className="text-text-3 font-normal italic text-xs">Not provided</span>}
                      </div>
                    )}
                  </div>

                  {/* 2. Phone */}
                  <div className="flex flex-col justify-between p-3.5 rounded-xl bg-[var(--glass-2)] hover:bg-[var(--glass-2)] border border-[var(--border-2)] hover:border-[var(--border-2)] transition-all min-h-[76px] group shadow-sm">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-400 uppercase tracking-wider">
                        <PhoneIcon className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Phone</span>
                      </div>
                      {!isEditing && c.phone && (
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => copyToClipboard(c.phone, "phone")}
                            className="p-1 rounded text-text-2 hover:text-text hover:bg-[var(--glass-2)] transition-colors cursor-pointer"
                            title="Copy phone number"
                          >
                            {copiedField === "phone" ? (
                              <Check className="w-3.5 h-3.5 text-emerald-400 animate-in zoom-in-75 duration-150" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() => setIsWhatsAppOpen(true)}
                            className="p-1 rounded text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 transition-colors cursor-pointer"
                            title="Chat on WhatsApp"
                          >
                            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.458 5.705 1.459h.008c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                            </svg>
                          </button>
                        </div>
                      )}
                    </div>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editState.phone || ""}
                        onChange={e => setEditState(prev => ({ ...prev, phone: e.target.value }))}
                        className="w-full bg-[var(--glass-2)] border border-border-2 rounded-lg px-2.5 py-1 text-sm text-text outline-none focus:border-purple-500 mt-1.5"
                        placeholder="+91..."
                      />
                    ) : (
                      <div className="text-[14px] font-semibold text-[var(--text)] select-all leading-snug mt-1.5 tracking-wide" title={c.phone || undefined}>
                        {c.phone || <span className="text-text-3 font-normal italic text-xs">Not provided</span>}
                      </div>
                    )}
                  </div>

                  {/* 3. Location */}
                  <div className="flex flex-col justify-between p-3.5 rounded-xl bg-[var(--glass-2)] hover:bg-[var(--glass-2)] border border-[var(--border-2)] hover:border-[var(--border-2)] transition-all min-h-[76px] shadow-sm">
                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-rose-400 uppercase tracking-wider">
                      <MapPin className="w-3.5 h-3.5 text-rose-400" />
                      <span>Location</span>
                    </div>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editState.city || ""}
                        onChange={e => setEditState(prev => ({ ...prev, city: e.target.value }))}
                        className="w-full bg-[var(--glass-2)] border border-border-2 rounded-lg px-2.5 py-1 text-sm text-text outline-none focus:border-purple-500 mt-1.5"
                        placeholder="City, Country"
                      />
                    ) : (
                      <div className="text-[14px] font-semibold text-[var(--text)] leading-snug mt-1.5">
                        {c.city || <span className="text-text-3 font-normal italic text-xs">Not specified</span>}
                      </div>
                    )}
                  </div>

                  {/* 4. Applied Date */}
                  <div className="flex flex-col justify-between p-3.5 rounded-xl bg-[var(--glass-2)] hover:bg-[var(--glass-2)] border border-[var(--border-2)] hover:border-[var(--border-2)] transition-all min-h-[76px] shadow-sm">
                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-indigo-400 uppercase tracking-wider">
                      <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Applied Date</span>
                    </div>
                    <div className="text-[14px] font-semibold text-[var(--text)] leading-snug mt-1.5">
                      {(() => {
                        if (!c.appliedAt) return <span className="text-text-3 font-normal text-xs">—</span>;
                        const str = String(c.appliedAt).trim();
                        const dmy = str.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
                        if (dmy) {
                          const [, d, m, y] = dmy;
                          const date = new Date(Number(y), Number(m) - 1, Number(d));
                          if (!isNaN(date.getTime())) {
                            return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
                          }
                        }
                        const date = new Date(str);
                        if (!isNaN(date.getTime())) {
                          return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
                        }
                        return str;
                      })()}
                    </div>
                  </div>

                  {/* 5. Employment Status */}
                  <div className="flex flex-col justify-between p-3.5 rounded-xl bg-[var(--glass-2)] hover:bg-[var(--glass-2)] border border-[var(--border-2)] hover:border-[var(--border-2)] transition-all min-h-[76px] shadow-sm">
                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-amber-400 uppercase tracking-wider">
                      <Building2 className="w-3.5 h-3.5 text-amber-400" />
                      <span>Employment Status</span>
                    </div>
                    {isEditing ? (
                      <select
                        value={String(editState.employmentStatus || "UNKNOWN")}
                        onChange={e => setEditState(prev => ({ ...prev, employmentStatus: e.target.value as EmploymentStatus }))}
                        className="w-full bg-[var(--glass-2)] border border-border-2 text-text rounded-lg px-2.5 py-1 text-xs outline-none focus:border-purple-500 mt-1.5"
                      >
                        <option value="CURRENTLY_WORKING">🟢 Currently Working</option>
                        <option value="STUDENT_FRESHER">🔵 Student / Fresher</option>
                        <option value="NOT_CURRENTLY_WORKING">⚪ Not Currently Working</option>
                        <option value="UNKNOWN">🟡 Status Unknown</option>
                      </select>
                    ) : (
                      <div className="flex flex-col gap-0.5 mt-1.5">
                        {(() => {
                          const sm = getEmploymentStatusMeta(c.employmentStatus);
                          const hasValidCompany = c.currentCompany && !/linkedin|github|leetcode/i.test(c.currentCompany);
                          const hasValidRole = c.currentRole && !/linkedin|github|leetcode/i.test(c.currentRole);
                          return (
                            <>
                              <div className="inline-flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: sm.color, boxShadow: `0 0 6px ${sm.color}90` }} />
                                <span className="text-[14px] font-bold" style={{ color: sm.color }}>{sm.label}</span>
                              </div>
                              {(hasValidRole || hasValidCompany) && (
                                <span className="text-xs text-text-2 font-medium truncate" title={[c.currentRole, c.currentCompany].filter(Boolean).join(" · ")}>
                                  {[c.currentRole, c.currentCompany].filter(Boolean).join(" at ")}
                                </span>
                              )}
                            </>
                          );
                        })()}
                      </div>
                    )}
                  </div>

                  {/* 6. Experience */}
                  <div className="flex flex-col justify-between p-3.5 rounded-xl bg-[var(--glass-2)] hover:bg-[var(--glass-2)] border border-[var(--border-2)] hover:border-[var(--border-2)] transition-all min-h-[76px] shadow-sm">
                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-purple-400 uppercase tracking-wider">
                      <Briefcase className="w-3.5 h-3.5 text-purple-400" />
                      <span>Experience</span>
                    </div>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editState.exp !== undefined ? String(editState.exp) : ""}
                        onChange={e => setEditState(prev => ({ ...prev, exp: e.target.value }))}
                        className="w-full bg-[var(--glass-2)] border border-border-2 rounded-lg px-2.5 py-1 text-sm text-text outline-none focus:border-purple-500 mt-1.5"
                        placeholder="e.g. 2 yrs or Intern (6 months)"
                      />
                    ) : (
                      <div className="text-[14px] font-semibold text-[var(--text)] leading-snug mt-1.5">
                        {(() => {
                          if (!c.exp) return <span className="text-text-3 font-normal text-xs">—</span>;
                          const s = String(c.exp).trim();
                          if (/\b(?:intern|month|fresher|trainee|none|na)\b/i.test(s)) return s;
                          if (/\byrs?$/i.test(s)) return s;
                          if (/^\d+(\.\d+)?$/.test(s)) return `${s} yrs`;
                          return s;
                        })()}
                      </div>
                    )}
                  </div>

                  {/* 7. Education */}
                  <div className="flex flex-col justify-between p-3.5 rounded-xl bg-[var(--glass-2)] hover:bg-[var(--glass-2)] border border-[var(--border-2)] hover:border-[var(--border-2)] transition-all min-h-[76px] shadow-sm">
                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-teal-400 uppercase tracking-wider">
                      <GraduationCap className="w-3.5 h-3.5 text-teal-400" />
                      <span>Education</span>
                    </div>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editState.education || ""}
                        onChange={e => setEditState(prev => ({ ...prev, education: e.target.value }))}
                        className="w-full bg-[var(--glass-2)] border border-border-2 rounded-lg px-2.5 py-1 text-sm text-text outline-none focus:border-purple-500 mt-1.5"
                        placeholder="e.g. Bachelor of Engineering"
                      />
                    ) : (
                      <div className="text-[13px] sm:text-[14px] font-semibold text-[var(--text)] leading-snug line-clamp-2 break-words mt-1.5" title={c.education || undefined}>
                        {c.education || <span className="text-text-3 font-normal italic text-xs">Not specified</span>}
                      </div>
                    )}
                  </div>

                  {/* 8. Gender */}
                  <div className="flex flex-col justify-between p-3.5 rounded-xl bg-[var(--glass-2)] hover:bg-[var(--glass-2)] border border-[var(--border-2)] hover:border-[var(--border-2)] transition-all min-h-[76px] shadow-sm">
                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-pink-400 uppercase tracking-wider">
                      <User className="w-3.5 h-3.5 text-pink-400" />
                      <span>Gender</span>
                    </div>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editState.gender || ""}
                        onChange={e => setEditState(prev => ({ ...prev, gender: e.target.value }))}
                        className="w-full bg-[var(--glass-2)] border border-border-2 rounded-lg px-2.5 py-1 text-sm text-text outline-none focus:border-purple-500 mt-1.5"
                        placeholder="Female / Male / Other"
                      />
                    ) : (
                      <div className="text-[14px] font-semibold text-[var(--text)] leading-snug mt-1.5">
                        {c.gender || <span className="text-text-3 font-normal italic text-xs">Not specified</span>}
                      </div>
                    )}
                  </div>
                </div>

                {/* Detected Links & Social Profiles */}
                {(() => {
                  const text = (c.resumeText || "") + " " + (c.note || "");
                  const links: { type: string; label: string; url: string; badgeClass: string }[] = [];
                  const seen = new Set<string>();

                  const urlMatches = text.match(/https?:\/\/[^\s\)\],>"']+/g) || [];
                  for (const url of urlMatches) {
                    const clean = url.replace(/[.,;:]+$/, "");
                    if (seen.has(clean)) continue;
                    seen.add(clean);

                    if (/linkedin\.com\/in\//i.test(clean)) {
                      links.push({ type: "linkedin", label: "LinkedIn", url: clean, badgeClass: "text-[#0A66C2] bg-[#0A66C2]/10 border-[#0A66C2]/30 hover:bg-[#0A66C2]/20" });
                    } else if (/github\.com\/[a-zA-Z0-9_-]+/i.test(clean) && !/github\.com\/[a-zA-Z0-9_-]+\/[a-zA-Z0-9_-]+/i.test(clean)) {
                      links.push({ type: "github", label: "GitHub", url: clean, badgeClass: "text-purple-300 bg-purple-500/10 border-purple-500/30 hover:bg-purple-500/20" });
                    } else if (/leetcode\.com\//i.test(clean)) {
                      links.push({ type: "leetcode", label: "LeetCode", url: clean, badgeClass: "text-amber-400 bg-amber-500/10 border-amber-500/30 hover:bg-amber-500/20" });
                    }
                  }

                  if (links.length === 0) return null;

                  return (
                    <div className="flex items-center gap-2 pt-2 border-t border-[var(--border-2)] flex-wrap">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-text-2">Profiles:</span>
                      {links.map((lk) => (
                        <a
                          key={lk.url}
                          href={lk.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={clsx(
                            "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all cursor-pointer select-none active:scale-95",
                            lk.badgeClass
                          )}
                        >
                          <span>{lk.label}</span>
                          <ExternalLink className="w-3 h-3 opacity-70" />
                        </a>
                      ))}
                    </div>
                  );
                })()}
              </div>
              )}

              {/* 2. Detected Skills & Role Match */}
              {(profileSubTab === "skills" || profileSubTab === "all") && (
                <div className="rounded-2xl border border-[var(--border-2)] bg-[var(--card-bg)] p-5 sm:p-6 flex flex-col gap-4 shadow-[0_4px_24px_rgba(0,0,0,0.35)]">
                
                {/* Matched Skills */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-xs font-bold uppercase tracking-wider text-text-2 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-emerald-400" />
                      <span>Matched Skills ({c.score?.matchedSkills?.length || 0})</span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {(c.score?.matchedSkills && c.score.matchedSkills.length > 0) ? (
                      c.score.matchedSkills.map(s => (
                        <span
                          key={s}
                          className="px-3 py-1 rounded-lg text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:border-emerald-400/60 transition-colors"
                        >
                          {s}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-text-3 italic">No matched skills</span>
                    )}
                  </div>
                </div>

                {/* Missing Skills */}
                {c.score?.missingSkills && c.score.missingSkills.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-xs font-bold uppercase tracking-wider text-text-2 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-red-400" />
                      <span>Missing Skills ({c.score.missingSkills.length})</span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {c.score.missingSkills.map(s => (
                      <span
                        key={s}
                        className="px-3 py-1 rounded-lg text-xs font-medium bg-red-500/10 text-red-400/80 border border-red-500/20 hover:border-red-400/50 transition-colors"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
                )}

                {/* All Detected Skills from Resume */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-xs font-bold uppercase tracking-wider text-text-2 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-cyan-400" />
                      <span>Detected Skills ({cleanSkills.length})</span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {cleanSkills.length > 0 ? (
                      cleanSkills.map(s => (
                        <span
                          key={s}
                          className="px-3 py-1 rounded-lg text-xs font-medium bg-[var(--glass-2)] text-text border border-[var(--border-2)] hover:border-cyan-500/40 hover:text-cyan-300 transition-colors"
                        >
                          {s}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-text-3 italic">No skills detected</span>
                    )}
                  </div>
                </div>

              </div>
              )}

              {/* 3. Hiring Pipeline Summary Card */}
              {(profileSubTab === "stage" || profileSubTab === "all") && (
                <div className="rounded-2xl border border-[var(--border-2)] bg-[var(--card-bg)] p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-[0_4px_24px_rgba(0,0,0,0.35)]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 flex-shrink-0">
                    <GitBranch className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold uppercase tracking-wider text-text-2">Current Hiring Stage</div>
                    <div className="flex items-center gap-2 mt-1">
                      <StatusBadge status={c.status} />
                      <span className="text-xs text-text-2">
                        {c.status === "hired" ? "Candidate successfully hired" :
                         ["offer", "offer_sent", "offer_accepted", "offer_rejected"].includes(c.status) ? "Active offer stage" :
                         c.status === "approved" ? "Approved for offer extension" :
                         ["interview_1", "interview_2"].includes(c.status) ? "Interview evaluations in progress" :
                         c.status === "shortlisted" ? "Shortlisted for technical rounds" : "Under review"}
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setActiveTab("pipeline")}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 transition-all cursor-pointer self-start sm:self-auto active:scale-95"
                >
                  <span>Open Pipeline Workflow</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
              )}

              {/* 4. Candidate Activity Timeline & Admin Note (Collapsible) */}
              {(profileSubTab === "activity" || profileSubTab === "all") && (() => {
                const isDetailsVisible = isActivityOpen || profileSubTab === "activity";
                return (
                  <div className="bg-[var(--card-bg)] rounded-2xl border border-[var(--border-2)] shadow-[0_4px_24px_rgba(0,0,0,0.35)] overflow-hidden transition-all">
                    {/* Header (Always visible, toggleable) */}
                    <div
                      onClick={() => setIsActivityOpen(!isDetailsVisible)}
                  className="flex items-center justify-between p-4 sm:p-5 cursor-pointer select-none hover:bg-[var(--glass-2)] transition-colors gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 flex-shrink-0">
                      <Activity className="w-4 h-4" />
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2.5 min-w-0">
                      <div className="text-sm font-bold text-text tracking-tight flex items-center gap-2">
                        <span>Candidate Activity & Notes</span>
                        <span className="text-[16px] font-mono px-2 py-0.5 rounded-full bg-[var(--glass-2)] text-[var(--text)] border border-[var(--border-2)]">
                          {timelineEvents.length} events
                        </span>
                      </div>
                      {!isActivityOpen && (
                        <span className="text-xs text-[var(--text)] truncate max-w-sm hidden sm:inline">
                          {c.note ? `Note: "${c.note.slice(0, 45)}${c.note.length > 45 ? '…' : ''}"` : "Private admin notes & audit history"}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 flex-shrink-0">
                    {/* View Filter Switcher (Visible when expanded) */}
                    {isActivityOpen && (
                      <div
                        onClick={e => e.stopPropagation()}
                        className="hidden sm:flex items-center gap-1 bg-[var(--card-bg)] p-1 rounded-lg border border-[var(--border-2)]"
                      >
                        {(["all", "timeline", "notes"] as const).map(tabKey => (
                          <button
                            key={tabKey}
                            type="button"
                            onClick={() => setTimelineTab(tabKey)}
                            className={clsx(
                              "px-2.5 py-1 rounded-md text-xs font-semibold capitalize transition-all cursor-pointer",
                              timelineTab === tabKey
                                ? "bg-purple-600/20 text-purple-300 border border-purple-500/30 shadow-sm"
                                : "text-[var(--text)] hover:text-[var(--text)] hover:bg-[var(--glass-2)] border border-transparent"
                            )}
                          >
                            {tabKey === "all" ? "All Activity" : tabKey === "timeline" ? "Timeline" : "Notes Only"}
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Expand / Collapse Button */}
                    <button
                      type="button"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-text-2 hover:text-[var(--text)] bg-[var(--glass-2)] hover:bg-[var(--glass-2)] border border-[var(--border-2)] transition-all cursor-pointer"
                    >
                      <span>{isDetailsVisible ? "Hide Details" : "View Details"}</span>
                      {isDetailsVisible ? (
                        <ChevronUp className="w-3.5 h-3.5 text-text-2" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5 text-text-2" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Collapsible Content */}
                {isDetailsVisible && (
                  <div className="p-5 sm:p-6 pt-0 border-t border-[var(--border-2)] mt-2 animate-fade-in flex flex-col gap-5">
                    {/* Mobile Switcher */}
                    <div className="flex sm:hidden items-center gap-1 bg-[var(--card-bg)] p-1 rounded-lg border border-[var(--border-2)] self-start mt-3">
                      {(["all", "timeline", "notes"] as const).map(tabKey => (
                        <button
                          key={tabKey}
                          type="button"
                          onClick={() => setTimelineTab(tabKey)}
                          className={clsx(
                            "px-2.5 py-1 rounded-md text-xs font-semibold capitalize transition-all cursor-pointer",
                            timelineTab === tabKey
                              ? "bg-purple-600/20 text-purple-300 border border-purple-500/30 shadow-sm"
                              : "text-[var(--text)] hover:text-[var(--text)] hover:bg-[var(--glass-2)] border border-transparent"
                          )}
                        >
                          {tabKey === "all" ? "All Activity" : tabKey === "timeline" ? "Timeline" : "Notes Only"}
                        </button>
                      ))}
                    </div>

                    {/* Main Content Layout */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 mt-2">
                      {/* Left Column: Interactive Timeline List */}
                      {(timelineTab === "all" || timelineTab === "timeline") && (
                        <div className={clsx(
                          "flex flex-col gap-3.5",
                          timelineTab === "timeline" ? "lg:col-span-12" : "lg:col-span-7"
                        )}>
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold uppercase tracking-wider text-[var(--text)] flex items-center gap-1.5">
                              <History className="w-3.5 h-3.5 text-purple-400" />
                              <span>Activity Timeline ({timelineEvents.length})</span>
                            </span>
                            <span className="text-[15px] text-[var(--text-3)]">Auto-recorded</span>
                          </div>

                          <div className="flex flex-col gap-0 relative pl-4 sm:pl-5 before:absolute before:left-[11px] sm:before:left-[15px] before:top-2 before:bottom-2 before:w-[2px] before:bg-[var(--glass-2)] max-h-[380px] overflow-y-auto pr-1 custom-scrollbar">
                            {timelineEvents.length === 0 ? (
                              <div className="py-8 text-center text-xs text-[var(--text-3)] bg-[var(--card-bg)] rounded-xl border border-dashed border-[var(--border-2)] my-2">
                                No workflow activity recorded yet.
                              </div>
                            ) : (
                              timelineEvents.map((evt) => {
                                const pd = parseSafeDate(evt.timestamp);
                                const timeStr = pd ? pd.toLocaleString(undefined, {
                                  month: "short",
                                  day: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit"
                                }) : "Recorded";

                                return (
                                  <div key={evt.id} className="relative flex items-start gap-3.5 py-3 group">
                                    {/* Dot / Icon */}
                                    <div
                                      className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 z-10 text-[15px] transition-transform group-hover:scale-110"
                                      style={{
                                        background: evt.color ? `${evt.color}20` : "rgba(167, 139, 250, 0.15)",
                                        border: `1px solid ${evt.color ? `${evt.color}55` : "rgba(167, 139, 250, 0.4)"}`,
                                        color: evt.color || "var(--tab-purple-text)",
                                        boxShadow: `0 0 8px ${evt.color ? `${evt.color}30` : "rgba(167, 139, 250, 0.2)"}`
                                      }}
                                    >
                                      {evt.icon || "•"}
                                    </div>

                                    {/* Card Content */}
                                    <div className="flex-1 bg-[var(--card-bg)] hover:bg-[var(--table-row-hover)] border border-[var(--border-2)] rounded-xl p-3 transition-colors flex flex-col gap-1">
                                      <div className="flex items-center justify-between gap-2 flex-wrap">
                                        <span className="text-xs font-semibold text-[var(--text)] tracking-tight">
                                          {evt.title}
                                        </span>
                                        <span className="text-[16px] font-mono text-[var(--text)]">
                                          {timeStr}
                                        </span>
                                      </div>
                                      <p className="text-[15px] text-[var(--text)] leading-relaxed">
                                        {evt.description}
                                      </p>
                                    </div>
                                  </div>
                                );
                              })
                            )}
                          </div>
                        </div>
                      )}

                      {/* Right Column: Admin Note (Editable) */}
                      {(timelineTab === "all" || timelineTab === "notes") && (
                        <div className={clsx(
                          "flex flex-col gap-3.5",
                          timelineTab === "notes" ? "lg:col-span-12" : "lg:col-span-5"
                        )}>
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold uppercase tracking-wider text-[var(--text)] flex items-center gap-1.5">
                              <Edit3 className="w-3.5 h-3.5 text-[var(--btn-doc-icon)]" />
                              <span>Admin Private Note</span>
                            </span>
                            <span className="text-[16px] font-mono text-emerald-400/80 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                              Auto-saved
                            </span>
                          </div>

                          <div className="flex flex-col gap-2.5">
                            <textarea
                              rows={timelineTab === "notes" ? 8 : 6}
                              placeholder="Add private feedback, interviewer comments, or notes about this candidate… (Preserved automatically)"
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
                              className="w-full rounded-xl text-xs sm:text-sm p-4 resize-none outline-none transition-all duration-200 bg-[var(--card-bg)] border border-[var(--border-2)] text-text focus:border-purple-500/60 focus:shadow-[0_0_15px_rgba(167,139,250,0.12)] custom-scrollbar placeholder:text-[var(--text-3)] leading-relaxed"
                            />
                            <div className="flex items-center justify-between text-[15px] text-[var(--text-3)] px-1">
                              <span>💡 Stored in candidate profile record</span>
                              <span>{(isEditing ? (editState.note || "") : (c.note || "")).length} chars</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
                );
              })()}

              {/* Collapsible Diagnostic Panel */}
              {c.extractionMetadata && (profileSubTab === "overview" || profileSubTab === "all") && (
                <details className="group rounded-xl border border-border bg-[var(--card-bg)]/40 p-4 transition-all mt-1">
                  <summary className="flex items-center justify-between cursor-pointer list-none text-xs font-bold uppercase tracking-wider text-[var(--text-3)] hover:text-[var(--text)] select-none">
                    <span>🛠️ Parser Diagnostic Metadata</span>
                    <span className="transition-transform group-open:rotate-180 text-xs">▼</span>
                  </summary>
                  
                  <div className="mt-4 flex flex-col gap-4 text-xs leading-relaxed border-t border-border pt-4">
                    <div className="flex justify-between items-center bg-[var(--glass-2)] p-2.5 rounded-lg border border-border">
                      <span className="text-[var(--text-3)] font-medium">OCR Fallback Engine:</span>
                      <span className={clsx("font-bold px-2 py-0.5 rounded", c.extractionMetadata.ocrUsed ? "text-[var(--yellow)] bg-[var(--yellow)]/10" : "text-text-3 bg-[var(--card-bg)]")}>
                        {c.extractionMetadata.ocrUsed ? "Active (Scanned PDF)" : "Inactive (Native PDF Text)"}
                      </span>
                    </div>
                    
                    {/* Multi-Source Candidates list */}
                    <div>
                      <span className="text-[var(--text-3)] font-bold block mb-2.5 uppercase tracking-wide text-[16px]">Multi-Source Name Rankings:</span>
                      <div className="flex flex-col gap-2 max-h-[180px] overflow-y-auto pr-1">
                        {c.extractionMetadata.sourceRankings && c.extractionMetadata.sourceRankings.length > 0 ? (
                          c.extractionMetadata.sourceRankings.map((rank, idx) => (
                            <div key={idx} className="flex items-center justify-between p-2.5 rounded-xl bg-glass-2 border border-border">
                              <div className="flex flex-col gap-0.5">
                                <span className="font-bold text-text text-[16px]">{rank.name}</span>
                                <span className="text-[9px] text-[var(--text-3)] font-medium">{rank.source}</span>
                              </div>
                              <span className={clsx(
                                "font-bold text-[16px] px-2 py-0.5 rounded",
                                rank.confidence >= 70 ? "text-[var(--green)] bg-[var(--green)]/10" : rank.confidence >= 40 ? "text-[var(--yellow)] bg-[var(--yellow)]/10" : "text-[var(--red)] bg-[var(--red)]/10"
                              )}>
                                {rank.confidence}% Score
                              </span>
                            </div>
                          ))
                        ) : (
                          <div className="text-[var(--text-3)] italic text-center py-2 bg-[var(--glass-2)] rounded-xl border border-dashed border-border">No candidates extracted</div>
                        )}
                      </div>
                    </div>

                    {/* Applied Normalizations & Splits */}
                    {c.extractionMetadata.transformations && c.extractionMetadata.transformations.length > 0 && (
                      <div>
                        <span className="text-[var(--text-3)] font-bold block mb-2.5 uppercase tracking-wide text-[16px]">Applied Normalizations:</span>
                        <div className="flex flex-col gap-1.5 max-h-[120px] overflow-y-auto pr-1 font-mono text-[9px] text-text-2">
                          {c.extractionMetadata.transformations.map((t, idx) => (
                            <div key={idx} className="p-2 rounded bg-glass-2 border border-border leading-normal">
                              {t}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Rejected Candidates */}
                    {c.extractionMetadata.rejectedCandidates && c.extractionMetadata.rejectedCandidates.length > 0 && (
                      <div>
                        <span className="text-[var(--text-3)] font-bold block mb-2.5 uppercase tracking-wide text-[16px]">Rejected Candidates:</span>
                        <div className="flex flex-col gap-2 max-h-[150px] overflow-y-auto pr-1">
                          {c.extractionMetadata.rejectedCandidates.map((rc, idx) => (
                            <div key={idx} className="flex items-center justify-between p-2.5 rounded-xl bg-glass-2 border border-border">
                              <div className="flex flex-col gap-0.5">
                                <span className="font-bold text-text-2 line-through text-[16px]">{rc.name}</span>
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
                        <span className="text-[var(--text-3)] font-bold block mb-2.5 uppercase tracking-wide text-[16px]">PDF Layout Bounding Boxes (Page 1):</span>
                        <div className="flex flex-col gap-1.5 max-h-[180px] overflow-y-auto pr-1">
                          <div className="grid grid-cols-5 gap-1 text-[9px] font-bold text-[var(--text-3)] pb-1.5 border-b border-border uppercase tracking-wide">
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
                                  : "bg-[var(--glass-2)] border-border text-text-2 font-mono"
                              )} title={tooltip}>
                                <span className="col-span-2 truncate flex items-center gap-1">
                                  {isBold && <span className="text-[16px] text-amber-400 font-bold select-none" title="Bold styling detected">★</span>}
                                  <span className={clsx(isBold && "font-bold text-text")}>{line.text}</span>
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
              <div className="flex flex-col gap-3 animate-fade-in max-w-5xl w-full mx-auto flex-1 min-h-0">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="text-xs font-semibold text-[var(--text-3)] uppercase tracking-widest flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#00D9FF] shadow-[0_0_8px_#00D9FF]" />
                    <span>{resumeMode === "pdf" ? "Original PDF Resume" : "Extracted Resume Text"}</span>
                  </div>
                  {c.resumeText && (
                    <div className="inline-flex items-center p-1 rounded-xl bg-[var(--card-bg)] border border-[var(--border-2)] select-none shadow-sm">
                      <button
                        type="button"
                        onClick={() => setResumeMode("pdf")}
                        className={clsx(
                          "inline-flex items-center justify-center gap-2 h-8 px-3.5 rounded-lg text-xs font-semibold transition-all duration-150 cursor-pointer",
                          resumeMode === "pdf"
                            ? "bg-[rgba(0,217,255,0.12)] text-[#00D9FF] border border-[rgba(0,217,255,0.4)] shadow-[0_0_12px_rgba(0,217,255,0.1)]"
                            : "text-text-2 hover:text-text border border-transparent"
                        )}
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>PDF View</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setResumeMode("text")}
                        className={clsx(
                          "inline-flex items-center justify-center gap-2 h-8 px-3.5 rounded-lg text-xs font-semibold transition-all duration-150 cursor-pointer",
                          resumeMode === "text"
                            ? "bg-[rgba(0,217,255,0.12)] text-[#00D9FF] border border-[rgba(0,217,255,0.4)] shadow-[0_0_12px_rgba(0,217,255,0.1)]"
                            : "text-text-2 hover:text-text border border-transparent"
                        )}
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>Text View</span>
                      </button>
                    </div>
                  )}
                </div>

                {resumeMode === "pdf" ? (
                  <PDFViewer
                    url={c.resumeUrl}
                    filename={c.resumeFile || `${c.name || "Candidate"}_Resume.pdf`}
                  />
                ) : (
                  <div className="flex flex-col gap-2 w-full flex-1 min-h-0 h-[calc(98vh-220px)] min-h-[600px]">
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={() => {
                          if (c.resumeText) {
                            navigator.clipboard.writeText(c.resumeText);
                            dialog.alert("Resume text copied to clipboard!");
                          }
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[var(--glass-2)] hover:bg-glass-2 text-text-2 hover:text-[var(--text)] border border-border transition-colors"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Text</span>
                      </button>
                    </div>
                    <div
                      className="w-full flex-1 rounded-xl text-xs font-mono p-5 overflow-y-auto whitespace-pre-wrap leading-relaxed select-text animate-fade-in custom-scrollbar"
                      style={{ background: "var(--bg2)", border: "1px solid var(--border)", color: "var(--text-2)" }}
                    >
                      {c.resumeText}
                    </div>
                  </div>
                )}
              </div>
            ) : c.resumeText ? (
              <div className="flex flex-col gap-3 animate-fade-in max-w-5xl w-full mx-auto flex-1 min-h-0 h-[calc(98vh-220px)] min-h-[600px]">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-semibold text-[var(--text-3)] uppercase tracking-widest flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_8px_#f59e0b]" />
                    <span>Extracted Resume Text</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (c.resumeText) {
                        navigator.clipboard.writeText(c.resumeText);
                        dialog.alert("Resume text copied to clipboard!");
                      }
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[var(--glass-2)] hover:bg-glass-2 text-text-2 hover:text-[var(--text)] border border-border transition-colors"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Text</span>
                  </button>
                </div>
                <div
                  className="w-full flex-1 rounded-xl text-xs font-mono p-5 overflow-y-auto whitespace-pre-wrap leading-relaxed select-text custom-scrollbar"
                  style={{ background: "var(--bg2)", border: "1px solid var(--border)", color: "var(--text-2)" }}
                >
                  {c.resumeText}
                </div>
              </div>
            ) : (
              <div
                className="flex flex-col items-center justify-center py-16 px-4 text-center rounded-xl animate-fade-in max-w-5xl w-full mx-auto"
                style={{ background: "var(--glass)", border: "1px solid var(--border)" }}
              >
                <span className="text-4xl mb-3">📄</span>
                <div className="text-sm font-semibold mb-1 text-text">No original resume document available</div>
                <div className="text-xs text-[var(--text-3)] max-w-sm">
                  This candidate does not have an attached PDF or parsed text. Newly uploaded resumes will display their full original PDF document here.
                </div>
              </div>
            )
          )}

          {/* Pipeline Workflow Management */}
          {activeTab === "pipeline" && (
            <div className="flex flex-col gap-6 animate-fade-in w-full pt-1">
              {/* Visual Pipeline Lifecycle Stepper */}
              <div className="rounded-2xl border border-[var(--border-2)] bg-[var(--card-bg)] p-4 sm:p-5 shadow-[0_4px_24px_rgba(0,0,0,0.35)]">
                <div className="flex items-center justify-between gap-3 overflow-x-auto no-scrollbar py-0.5">
                  {/* Step 1: Interviews */}
                  <div className="flex items-center gap-3 flex-1 min-w-[200px]">
                    <div className={clsx(
                      "w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs flex-shrink-0 transition-all",
                      isR2Completed || isR1Passed
                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 shadow-[0_0_12px_rgba(34,197,94,0.15)]"
                        : ["interview_1", "interview_2", "shortlisted"].includes(c.status)
                        ? "bg-purple-500/15 text-purple-300 border border-purple-500/40 shadow-[0_0_12px_rgba(167,139,250,0.2)]"
                        : "bg-[var(--glass-2)] text-text-3 border border-[var(--border-2)]"
                    )}>
                      {isR2Completed ? <Check className="w-4 h-4" /> : "1"}
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-bold text-text tracking-tight">Interview Evaluations</span>
                      <span className="text-[15px] text-text-2 truncate">
                        {isR2Completed ? "R1 & R2 Completed" : isR1Passed ? "R1 Cleared · R2 Next" : isR1Scheduled ? "R1 Scheduled" : "Screening & Rounds"}
                      </span>
                    </div>
                  </div>

                  {/* Step Connector 1 */}
                  <div className={clsx(
                    "hidden sm:block flex-1 h-[2px] rounded-full mx-2 transition-all",
                    isR2Completed ? "bg-emerald-500/40" : "bg-[var(--glass-2)]"
                  )} />

                  {/* Step 2: Offer Extended */}
                  <div className="flex items-center gap-3 flex-1 min-w-[200px]">
                    <div className={clsx(
                      "w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs flex-shrink-0 transition-all",
                      candidateOffer?.status === "accepted"
                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 shadow-[0_0_12px_rgba(34,197,94,0.15)]"
                        : ["approved", "offer", "offer_sent"].includes(c.status)
                        ? "bg-amber-500/15 text-amber-300 border border-amber-500/40 shadow-[0_0_12px_rgba(245,158,11,0.2)]"
                        : "bg-[var(--glass-2)] text-text-3 border border-[var(--border-2)]"
                    )}>
                      {candidateOffer?.status === "accepted" ? <Check className="w-4 h-4" /> : "2"}
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-bold text-text tracking-tight">Offer Extension</span>
                      <span className="text-[15px] text-text-2 truncate">
                        {candidateOffer?.status === "accepted" ? "Offer Accepted" : candidateOffer?.status === "sent" ? "Offer Sent · Awaiting Response" : candidateOffer ? "Offer Draft Prepared" : "Draft & Extension"}
                      </span>
                    </div>
                  </div>

                  {/* Step Connector 2 */}
                  <div className={clsx(
                    "hidden sm:block flex-1 h-[2px] rounded-full mx-2 transition-all",
                    c.status === "hired" || candidateOffer?.status === "accepted" ? "bg-emerald-500/40" : "bg-[var(--glass-2)]"
                  )} />

                  {/* Step 3: Onboarding & Hire */}
                  <div className="flex items-center gap-3 flex-1 min-w-[200px]">
                    <div className={clsx(
                      "w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs flex-shrink-0 transition-all",
                      c.status === "hired" || candidateEmployee
                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 shadow-[0_0_12px_rgba(34,197,94,0.15)]"
                        : c.status.startsWith("onboarding_")
                        ? "bg-cyan-500/15 text-cyan-300 border border-cyan-500/40 shadow-[0_0_12px_rgba(0,217,255,0.2)]"
                        : "bg-[var(--glass-2)] text-text-3 border border-[var(--border-2)]"
                    )}>
                      {c.status === "hired" || candidateEmployee ? <Check className="w-4 h-4" /> : "3"}
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-bold text-text tracking-tight">Onboarding & Hire</span>
                      <span className="text-[15px] text-text-2 truncate">
                        {c.status === "hired" || candidateEmployee ? "Official Employee" : `${candidateDocs.filter(d => d.status === "verified").length}/${candidateDocs.length || 0} Docs Verified`}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {["new", "review", "shortlisted", "interview_1", "interview_2", "approved", "rejected", "offer", "offer_sent", "offer_accepted", "offer_rejected", "hired"].includes(c.status) && (
                <div className="rounded-2xl border border-[var(--border-2)] bg-[var(--card-bg)] p-5 sm:p-6 shadow-[0_4px_24px_rgba(0,0,0,0.35)] flex flex-col gap-4">
                  {/* Section Header */}
                  <div className="flex items-center justify-between border-b border-[var(--border-2)] pb-3.5 flex-wrap gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-purple-500/10 border border-purple-500/25 flex items-center justify-center text-purple-400">
                        <GitBranch className="w-3.5 h-3.5" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs font-bold uppercase tracking-wider text-text-2">
                          Interview Evaluations
                        </span>
                        <span className="text-[16px] text-text-3">
                          Screening & Technical Rounds Progression
                        </span>
                      </div>
                    </div>
                    <span className="text-[15px] font-mono px-2.5 py-0.5 rounded-full bg-[var(--glass-2)] border border-[var(--border-2)] text-text-2">
                      {isR2Completed ? "All Rounds Completed" : isR1Passed ? "Round 1 Cleared" : isR1Scheduled ? "Round 1 Scheduled" : "Progression Active"}
                    </span>
                  </div>
                  
                  <div className="flex flex-col gap-3">
                    {/* Shortlist Action Banner */}
                    {(c.status === "new" || c.status === "review") && (
                      <div
                        className="p-4 rounded-xl flex items-center justify-between flex-wrap gap-3 bg-[var(--glass-2)] border border-[var(--border-2)]"
                      >
                        <div>
                          <div className="font-semibold text-sm text-text">Shortlist Candidate</div>
                          <div className="text-xs text-text-2 mt-0.5">Move candidate to the shortlisted stage to begin interview scheduling.</div>
                        </div>
                        <Btn
                          className="text-xs font-bold px-4 py-2 rounded-lg active:scale-95 transition-all text-cyan-300 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 cursor-pointer"
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
                          className={clsx(
                            "w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 shadow-md",
                            isR1Passed
                              ? "bg-[var(--card-bg)] border border-emerald-500/40 text-emerald-400 shadow-[0_0_12px_rgba(34,197,94,0.25)]"
                              : "bg-[var(--card-bg)] border border-border text-text-3"
                          )}
                        >
                          <ArrowRight className="w-4 h-4" />
                        </div>
                      </div>

                  {/* ================= ROUND 1 CARD ================= */}
                  <div
                    className="p-4 sm:p-5 rounded-2xl flex flex-col justify-between gap-3.5 transition-all shadow-sm"
                    style={{
                      background: "var(--card-bg)",
                      border: isR1Passed
                        ? "1px solid rgba(34, 197, 94, 0.35)"
                        : isR1Rejected
                        ? "1px solid rgba(239, 68, 68, 0.35)"
                        : "1px solid var(--border)",
                    }}
                  >
                    <div>
                      {/* Header */}
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <div className="flex items-center gap-2.5">
                          <div className={clsx(
                            "w-8 h-8 rounded-xl flex items-center justify-center transition-all",
                            isR1Passed ? "bg-emerald-500/10 border border-emerald-500/25 text-emerald-400" :
                            isR1Rejected ? "bg-red-500/10 border border-red-500/25 text-red-400" :
                            isR1Scheduled ? "bg-purple-500/10 border border-purple-500/25 text-purple-400" :
                            "bg-[var(--glass-2)] border border-[var(--border-2)] text-text-2"
                          )}>
                            {isR1Passed ? <CheckCircle2 className="w-4 h-4" /> : <Calendar className="w-4 h-4" />}
                          </div>
                          <div>
                            <div className="font-bold text-xs sm:text-sm text-[var(--text)]">Round 1</div>
                            <div className="text-[16px] text-text-3">Screening & Technical</div>
                          </div>
                        </div>

                        {/* Status Badges */}
                        {isR1Passed && (
                          <span className="text-[10.5px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full inline-flex items-center gap-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 shadow-[0_0_10px_rgba(34,197,94,0.15)]">
                            <Check className="w-3 h-3" />
                            <span>Completed</span>
                          </span>
                        )}
                        {isR1Rejected && (
                          <span className="text-[10.5px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full inline-flex items-center gap-1 bg-red-500/10 border border-red-500/30 text-red-400">
                            <X className="w-3 h-3" />
                            <span>Rejected</span>
                          </span>
                        )}
                        {isR1Scheduled && (
                          <span className="text-[10.5px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full inline-flex items-center gap-1 bg-purple-500/10 border border-purple-500/30 text-purple-300">
                            <Calendar className="w-3 h-3" />
                            <span>Scheduled</span>
                          </span>
                        )}
                        {!r1 && !isR1Passed && !isR1Rejected && (
                          (c.status === "new" || c.status === "review") ? (
                            <span className="text-[10.5px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/25 text-amber-400">
                              Pending Shortlist
                            </span>
                          ) : (
                            <span className="text-[10.5px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full inline-flex items-center gap-1 bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
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
                            <p className="text-xs text-[var(--text)]">
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
                            <div className="text-xs text-[var(--text)]">Ready to schedule Round 1 interview.</div>
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
                                  color: "var(--tab-purple-text)",
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
                              <div className="text-[15px] font-mono text-red-400 mt-0.5 px-0.5">
                                ⚠ {scheduleR1Error}
                              </div>
                            )}
                          </div>
                        )
                      )}

                      {r1 && (
                        <div className="flex flex-col gap-3">
                          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[var(--glass-2)] border border-[var(--border-2)] text-xs text-text-2 flex-wrap">
                            <Calendar className="w-3.5 h-3.5 text-purple-400 flex-shrink-0" />
                            <span className="font-mono text-[15px] text-text-3">Scheduled:</span>
                            <span className="font-medium text-text">{r1.scheduledAt ? new Date(r1.scheduledAt).toLocaleString() : "Date not set"}</span>
                          </div>

                          {/* Scheduled State Actions */}
                          {isR1Scheduled && (
                            <div className="flex flex-col gap-2.5 mt-0.5">
                              <textarea
                                placeholder="Add interview feedback and notes here..."
                                value={r1Notes}
                                onChange={e => setR1Notes(e.target.value)}
                                className="w-full bg-[var(--card-bg)] text-text text-xs border border-[var(--border-2)] rounded-xl p-3 outline-none h-20 focus:border-purple-400/60 focus:ring-1 focus:ring-purple-400/30 transition-all placeholder:text-[var(--text-3)]"
                              />
                              <div className="flex flex-wrap items-center gap-2 pt-1">
                                <button
                                  type="button"
                                  onClick={() => {
                                    updateInterview(r1.id, { status: "completed", decision: "select", notes: r1Notes });
                                    updateCandidate(c.id, { status: "interview_2" });
                                  }}
                                  className="inline-flex items-center justify-center gap-1.5 h-10 px-4 rounded-xl text-xs font-semibold tracking-normal transition-all cursor-pointer select-none active:scale-[0.98] flex-1 min-w-[150px] text-text bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 shadow-[0_0_15px_rgba(147,51,234,0.25)] border border-purple-400/30"
                                >
                                  <Check className="w-3.5 h-3.5 text-text" />
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
                                  className="inline-flex items-center justify-center gap-1.5 h-10 px-4 rounded-xl text-xs font-semibold tracking-normal transition-all cursor-pointer select-none active:scale-[0.98] text-red-400 hover:text-red-300 bg-red-500/[0.08] hover:bg-red-500/[0.16] border border-red-500/30 hover:border-red-500/50"
                                >
                                  <X className="w-3.5 h-3.5 text-red-400" />
                                  <span>Reject</span>
                                </button>
                              </div>
                            </div>
                          )}

                          {/* Completed / Selected State Details */}
                          {isR1Passed && (
                            <div className="flex flex-col gap-2.5">
                              <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-500/[0.08] border border-emerald-500/25">
                                <div className="flex items-center gap-2.5">
                                  <div className="w-6 h-6 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400 flex-shrink-0">
                                    <Check className="w-3.5 h-3.5" />
                                  </div>
                                  <div>
                                    <div className="text-[16px] uppercase font-bold tracking-wider text-emerald-400/80">Evaluation Outcome</div>
                                    <div className="text-xs font-semibold text-emerald-300">Selected for Next Round</div>
                                  </div>
                                </div>
                                <span className="text-[16px] font-mono font-bold px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                  PASSED
                                </span>
                              </div>
                              {r1.notes && (
                                <div className="text-xs text-text-2 bg-[var(--card-bg)] p-3 rounded-xl border border-[var(--border-2)]">
                                  <span className="text-[16px] font-semibold text-text-3 uppercase tracking-wider block mb-1">Interview Notes:</span>
                                  <p className="leading-relaxed text-text-2">{r1.notes}</p>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Rejected State Details */}
                          {isR1Rejected && (
                            <div className="flex flex-col gap-2.5">
                              <div className="flex items-center justify-between p-3 rounded-xl bg-red-500/[0.08] border border-red-500/25">
                                <div className="flex items-center gap-2.5">
                                  <div className="w-6 h-6 rounded-lg bg-red-500/20 flex items-center justify-center text-red-400 flex-shrink-0">
                                    <X className="w-3.5 h-3.5" />
                                  </div>
                                  <div>
                                    <div className="text-[16px] uppercase font-bold tracking-wider text-red-400/80">Evaluation Outcome</div>
                                    <div className="text-xs font-semibold text-red-300">Candidate Rejected</div>
                                  </div>
                                </div>
                                <span className="text-[16px] font-mono font-bold px-2 py-0.5 rounded-md bg-red-500/20 text-red-300 border border-red-500/30">
                                  DECLINED
                                </span>
                              </div>
                              {r1.notes && (
                                <div className="text-xs text-text-2 bg-[var(--card-bg)] p-3 rounded-xl border border-[var(--border-2)]">
                                  <span className="text-[16px] font-semibold text-text-3 uppercase tracking-wider block mb-1">Notes:</span>
                                  <p className="leading-relaxed text-text-2">{r1.notes}</p>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Fallback when stage is past R1 without explicit r1 record */}
                      {!r1 && isR1Passed && (
                        <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-500/[0.08] border border-emerald-500/25">
                          <div className="flex items-center gap-2.5">
                            <div className="w-6 h-6 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400 flex-shrink-0">
                              <Check className="w-3.5 h-3.5" />
                            </div>
                            <div>
                              <div className="text-[16px] uppercase font-bold tracking-wider text-emerald-400/80">Evaluation Outcome</div>
                              <div className="text-xs font-semibold text-emerald-300">Selected (Stage: {c.status})</div>
                            </div>
                          </div>
                          <span className="text-[16px] font-mono font-bold px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            PASSED
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* ================= ROUND 2 CARD ================= */}
                  <div
                    className={clsx(
                      "p-5 rounded-2xl flex flex-col justify-between gap-4 transition-all duration-200 shadow-sm",
                      isR2Locked && "opacity-75"
                    )}
                    style={{
                      background: isR2Locked ? "var(--glass-2)" : "var(--card-bg)",
                      border: isR2Locked
                        ? "1px dashed var(--border-2)"
                        : isR2Completed
                        ? "1px solid rgba(34, 197, 94, 0.30)"
                        : isR2Rejected
                        ? "1px solid rgba(239, 68, 68, 0.30)"
                        : isR2Scheduled
                        ? "1px solid rgba(167, 139, 250, 0.30)"
                        : "1px solid var(--border)",
                    }}
                  >
                    <div>
                      {/* Header */}
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <div className="flex items-center gap-2.5">
                          <div className={clsx(
                            "w-8 h-8 rounded-xl flex items-center justify-center transition-all",
                            isR2Locked ? "bg-[var(--glass-2)] border border-[var(--border-2)] text-text-3" :
                            isR2Completed ? "bg-emerald-500/10 border border-emerald-500/25 text-emerald-400" :
                            isR2Rejected ? "bg-red-500/10 border border-red-500/25 text-red-400" :
                            isR2Scheduled ? "bg-purple-500/10 border border-purple-500/25 text-purple-400" :
                            "bg-cyan-500/10 border border-cyan-500/25 text-cyan-400"
                          )}>
                            {isR2Locked ? (
                              <Lock className="w-4 h-4" />
                            ) : isR2Completed ? (
                              <CheckCircle2 className="w-4 h-4" />
                            ) : isR2Rejected ? (
                              <AlertCircle className="w-4 h-4" />
                            ) : isR2Scheduled ? (
                              <Calendar className="w-4 h-4" />
                            ) : (
                              <Clock className="w-4 h-4" />
                            )}
                          </div>
                          <div>
                            <div className={clsx("font-bold text-xs sm:text-sm", isR2Locked ? "text-text-3" : "text-[var(--text)]")}>
                              Round 2
                            </div>
                            <div className="text-[16px] text-text-3">Technical & Leadership</div>
                          </div>
                        </div>

                        {/* Status Badges */}
                        {isR2Locked && (
                          <span className="text-[10.5px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full inline-flex items-center gap-1 bg-[var(--glass-2)] border border-[var(--border-2)] text-text-2">
                            <Lock className="w-3 h-3" />
                            <span>Locked</span>
                          </span>
                        )}
                        {isR2Available && (
                          <span className="text-[10.5px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full inline-flex items-center gap-1 bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
                            <Clock className="w-3 h-3" />
                            <span>Available</span>
                          </span>
                        )}
                        {isR2Scheduled && (
                          <span className="text-[10.5px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full inline-flex items-center gap-1 bg-purple-500/10 border border-purple-500/30 text-purple-300">
                            <Calendar className="w-3 h-3" />
                            <span>Scheduled</span>
                          </span>
                        )}
                        {isR2Completed && (
                          <span className="text-[10.5px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full inline-flex items-center gap-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 shadow-[0_0_10px_rgba(34,197,94,0.15)]">
                            <Check className="w-3 h-3" />
                            <span>Completed</span>
                          </span>
                        )}
                        {isR2Rejected && (
                          <span className="text-[10.5px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full inline-flex items-center gap-1 bg-red-500/10 border border-red-500/30 text-red-400">
                            <X className="w-3 h-3" />
                            <span>Rejected</span>
                          </span>
                        )}
                      </div>

                      {/* Body Content */}
                      {isR2Locked && (
                        <div className="flex flex-col items-center justify-center text-center py-6 gap-2 my-auto">
                          <div className={clsx(
                            "w-9 h-9 rounded-xl flex items-center justify-center",
                            isR1Rejected ? "bg-red-500/10 border border-red-500/20 text-red-400" : "bg-[var(--glass-2)] border border-[var(--border-2)] text-text-3"
                          )}>
                            <Lock className="w-4 h-4" />
                          </div>
                          <div className="text-xs font-semibold text-text-2">
                            {isR1Rejected ? "Process Stopped" : "Round 2 Locked"}
                          </div>
                          <div className="text-[15px] text-text-3 max-w-[220px]">
                            {isR1Rejected
                              ? "Candidate was rejected in Round 1. Round 2 is not available."
                              : "Complete and select candidate in Round 1 first."}
                          </div>
                        </div>
                      )}

                      {isR2Available && (
                        <div className="flex flex-col gap-2 mt-1">
                          <div className="text-xs text-text-2">
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
                                color: "var(--tab-purple-text)",
                              }}
                              onMouseEnter={e => {
                                if (scheduleR2) e.currentTarget.style.background = "var(--tab-purple-hover-bg)";
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
                            <div className="text-[15px] font-mono text-red-400 mt-0.5 px-0.5">
                              ⚠ {scheduleR2Error}
                            </div>
                          )}
                        </div>
                      )}

                      {r2 && (
                        <div className="flex flex-col gap-3">
                          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[var(--glass-2)] border border-[var(--border-2)] text-xs text-text-2 flex-wrap">
                            <Calendar className="w-3.5 h-3.5 text-purple-400 flex-shrink-0" />
                            <span className="font-mono text-[15px] text-text-3">Scheduled:</span>
                            <span className="font-medium text-text">{r2.scheduledAt ? new Date(r2.scheduledAt).toLocaleString() : "Date not set"}</span>
                          </div>

                          {/* Scheduled State Actions */}
                          {isR2Scheduled && (
                            <div className="flex flex-col gap-2.5 mt-0.5">
                              <textarea
                                placeholder="Add interview feedback and notes here..."
                                value={r2Notes}
                                onChange={e => setR2Notes(e.target.value)}
                                className="w-full bg-[var(--card-bg)] text-text text-xs border border-[var(--border-2)] rounded-xl p-3 outline-none h-20 focus:border-purple-400/60 focus:ring-1 focus:ring-purple-400/30 transition-all placeholder:text-[var(--text-3)]"
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
                                  className="inline-flex items-center justify-center gap-1.5 h-10 px-4 rounded-xl text-xs font-semibold tracking-normal transition-all cursor-pointer select-none active:scale-[0.98] flex-1 min-w-[130px] text-text bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-[0_0_15px_rgba(16,185,129,0.25)] border border-emerald-400/30"
                                >
                                  <Check className="w-3.5 h-3.5 text-text" />
                                  <span>Approve & Move to Offer</span>
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
                                  className="inline-flex items-center justify-center gap-1.5 h-10 px-4 rounded-xl text-xs font-semibold tracking-normal transition-all cursor-pointer select-none active:scale-[0.98] text-red-400 hover:text-red-300 bg-red-500/[0.08] hover:bg-red-500/[0.16] border border-red-500/30 hover:border-red-500/50"
                                >
                                  <X className="w-3.5 h-3.5 text-red-400" />
                                  <span>Reject</span>
                                </button>
                              </div>
                            </div>
                          )}

                          {/* Completed State Details */}
                          {isR2Completed && (
                            <div className="flex flex-col gap-2.5">
                              <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-500/[0.08] border border-emerald-500/25">
                                <div className="flex items-center gap-2.5">
                                  <div className="w-6 h-6 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400 flex-shrink-0">
                                    <Check className="w-3.5 h-3.5" />
                                  </div>
                                  <div>
                                    <div className="text-[16px] uppercase font-bold tracking-wider text-emerald-400/80">Evaluation Outcome</div>
                                    <div className="text-xs font-semibold text-emerald-300">Selected / Approved for Offer</div>
                                  </div>
                                </div>
                                <span className="text-[16px] font-mono font-bold px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                  APPROVED
                                </span>
                              </div>
                              {r2.notes && (
                                <div className="text-xs text-text-2 bg-[var(--card-bg)] p-3 rounded-xl border border-[var(--border-2)]">
                                  <span className="text-[16px] font-semibold text-text-3 uppercase tracking-wider block mb-1">Interview Notes:</span>
                                  <p className="leading-relaxed text-text-2">{r2.notes}</p>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Rejected State Details */}
                          {isR2Rejected && (
                            <div className="flex flex-col gap-2.5">
                              <div className="flex items-center justify-between p-3 rounded-xl bg-red-500/[0.08] border border-red-500/25">
                                <div className="flex items-center gap-2.5">
                                  <div className="w-6 h-6 rounded-lg bg-red-500/20 flex items-center justify-center text-red-400 flex-shrink-0">
                                    <X className="w-3.5 h-3.5" />
                                  </div>
                                  <div>
                                    <div className="text-[16px] uppercase font-bold tracking-wider text-red-400/80">Evaluation Outcome</div>
                                    <div className="text-xs font-semibold text-red-300">Candidate Rejected</div>
                                  </div>
                                </div>
                                <span className="text-[16px] font-mono font-bold px-2 py-0.5 rounded-md bg-red-500/20 text-red-300 border border-red-500/30">
                                  DECLINED
                                </span>
                              </div>
                              {r2.notes && (
                                <div className="text-xs text-text-2 bg-[var(--card-bg)] p-3 rounded-xl border border-[var(--border-2)]">
                                  <span className="text-[16px] font-semibold text-text-3 uppercase tracking-wider block mb-1">Notes:</span>
                                  <p className="leading-relaxed text-text-2">{r2.notes}</p>
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

          {/* Offer & Onboarding Row */}
          <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-5 items-stretch">
            {/* Offer Management */}
            {["approved", "offer", "offer_sent", "offer_accepted", "offer_rejected", "onboarding_requested", "onboarding_review", "onboarding_verified", "onboarding_rejected", "hired"].includes(c.status) ? (
              <div
                className="flex flex-col justify-between gap-4 rounded-2xl p-5 shadow-sm transition-all duration-200"
                style={{
                  background: "var(--card-bg)",
                  border: candidateOffer?.status === "accepted"
                    ? "1px solid rgba(34, 197, 94, 0.30)"
                    : candidateOffer?.status === "sent"
                    ? "1px solid rgba(0, 217, 255, 0.30)"
                    : candidateOffer?.status === "rejected"
                    ? "1px solid rgba(239, 68, 68, 0.30)"
                    : "1px solid var(--border)",
                }}
              >
                <div>
                  {/* Section Header */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className={clsx(
                        "w-8 h-8 rounded-xl flex items-center justify-center transition-all",
                        candidateOffer?.status === "accepted" ? "bg-emerald-500/10 border border-emerald-500/25 text-emerald-400" :
                        candidateOffer?.status === "sent" ? "bg-cyan-500/10 border border-cyan-500/25 text-cyan-400" :
                        candidateOffer?.status === "rejected" ? "bg-red-500/10 border border-red-500/25 text-red-400" :
                        "bg-purple-500/10 border border-purple-500/25 text-purple-400"
                      )}>
                        <Briefcase className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-bold text-xs sm:text-sm text-[var(--text)]">Offer Extension</div>
                        <div className="text-[16px] text-text-3">Contracts & Acceptance Portal</div>
                      </div>
                    </div>

                    {/* Status Badge */}
                    {candidateOffer ? (
                      <span
                        className={clsx(
                          "text-[10.5px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full inline-flex items-center gap-1.5",
                          candidateOffer.status === "accepted" ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 shadow-[0_0_10px_rgba(34,197,94,0.15)]" :
                          candidateOffer.status === "sent" ? "bg-cyan-500/10 border border-cyan-500/30 text-cyan-400" :
                          candidateOffer.status === "rejected" ? "bg-red-500/10 border border-red-500/30 text-red-400" :
                          "bg-amber-500/10 border border-amber-500/30 text-amber-400"
                        )}
                      >
                        <span className={clsx(
                          "w-1.5 h-1.5 rounded-full",
                          candidateOffer.status === "accepted" ? "bg-emerald-400 animate-pulse" :
                          candidateOffer.status === "sent" ? "bg-cyan-400 animate-pulse" :
                          candidateOffer.status === "rejected" ? "bg-red-400" :
                          "bg-amber-400"
                        )} />
                        <span>{candidateOffer.status === "accepted" ? "Offer Accepted" : candidateOffer.status === "sent" ? "Offer Sent" : candidateOffer.status === "rejected" ? "Offer Rejected" : "Offer Draft"}</span>
                      </span>
                    ) : (
                      <span className="text-[10.5px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-[var(--glass-2)] border border-[var(--border-2)] text-text-2">
                        Ready to Draft
                      </span>
                    )}
                  </div>

                  <div className="p-4 rounded-xl flex flex-col gap-3.5 bg-[var(--card-bg)] border border-[var(--border-2)]">
                    {!candidateOffer ? (
                      c.status === "approved" ? (
                        <div className="flex flex-col gap-3 py-1">
                          <div className="text-xs text-text-2 leading-relaxed">
                            Candidate has cleared all interview stages! Prepare an offer letter and share the acceptance link.
                          </div>
                          <button
                            type="button"
                            className="inline-flex items-center justify-center gap-2 h-10 px-4 rounded-xl text-xs font-semibold text-text bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 shadow-[0_0_15px_rgba(147,51,234,0.25)] border border-purple-400/30 active:scale-[0.98] transition-all cursor-pointer self-start"
                            onClick={() => {
                              addOffer({
                                id: crypto.randomUUID(), candidateId: c.id, contractTemplateId: null,
                                status: "draft", sentAt: null, respondedAt: null, createdAt: new Date().toISOString()
                              });
                              updateCandidate(c.id, { status: "offer" });
                            }}
                          >
                            <Briefcase className="w-3.5 h-3.5" />
                            <span>Prepare Offer Letter</span>
                          </button>
                        </div>
                      ) : (
                        <div className="text-xs text-text-3 py-3 text-center">No offer prepared yet.</div>
                      )
                    ) : (
                      <div className="flex flex-col gap-3">
                        <div className="flex items-center justify-between flex-wrap gap-2 text-xs">
                          <div className="flex items-center gap-2 text-text-2">
                            <FileText className="w-4 h-4 text-purple-400" />
                            <span className="text-text-3">Letter Status:</span>
                            <span className="font-semibold text-[var(--text)] uppercase tracking-wide">{candidateOffer.status}</span>
                          </div>
                          {candidateOffer.sentAt && (
                            <span className="text-[15px] font-mono text-text-3">
                              Sent: {new Date(candidateOffer.sentAt).toLocaleDateString()}
                            </span>
                          )}
                        </div>

                        {candidateOffer.status === "draft" && c.status === "offer" && (
                          <div className="flex flex-col sm:flex-row gap-2 mt-1">
                            <button
                              type="button"
                              className="inline-flex items-center justify-center gap-2 h-10 px-4 rounded-xl text-xs font-semibold text-text bg-[var(--glass-2)] hover:bg-[var(--glass-2)] border border-[var(--border-2)] hover:border-[var(--border-2)] active:scale-[0.98] transition-all cursor-pointer flex-1"
                              onClick={() => {
                                updateOffer(candidateOffer.id, { status: "sent", sentAt: new Date().toISOString() });
                                updateCandidate(c.id, { status: "offer_sent" });
                              }}
                            >
                              <Check className="w-3.5 h-3.5 text-text-2" />
                              <span>Mark as Sent</span>
                            </button>
                            <button
                              type="button"
                              className="inline-flex items-center justify-center gap-2 h-10 px-4 rounded-xl text-xs font-semibold text-text bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-[0_0_15px_rgba(59,130,246,0.25)] border border-blue-400/30 active:scale-[0.98] transition-all cursor-pointer flex-1"
                              onClick={() => {
                                setDocStudioType(c.roleName?.toLowerCase().includes("intern") ? "offer-internship" : "offer-fulltime");
                                setIsDocStudioOpen(true);
                              }}
                            >
                              <FileText className="w-3.5 h-3.5" />
                              <span>Studio Offer</span>
                            </button>
                          </div>
                        )}

                        {candidateOffer.status === "sent" && c.status === "offer_sent" && (
                          <div className="p-3.5 rounded-xl bg-cyan-500/[0.08] border border-cyan-500/20 text-xs text-cyan-200 flex flex-col gap-2 mt-1">
                            <div className="flex items-center gap-2 font-medium">
                              <Clock className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
                              <span>Waiting for candidate response. Portal link is active.</span>
                            </div>
                            <a
                              href={`/offer/${c.id}`}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1.5 text-cyan-400 hover:text-cyan-300 font-semibold underline underline-offset-2 transition-colors self-start"
                            >
                              <span>Open Candidate Offer Page</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                        )}

                        {(candidateOffer.status === "accepted" || candidateOffer.status === "rejected") && (
                          <div className="flex flex-col gap-2.5 mt-1">
                            <div className="flex items-center gap-2 text-xs text-text-2">
                              <Calendar className="w-3.5 h-3.5 text-text-3" />
                              <span>Responded at: {candidateOffer.respondedAt ? new Date(candidateOffer.respondedAt).toLocaleString() : "Recently"}</span>
                            </div>
                            {candidateOffer.status === "accepted" && (
                              <button
                                type="button"
                                className="inline-flex items-center justify-center gap-2 h-10 px-4 rounded-xl text-xs font-semibold text-text bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-[0_0_15px_rgba(16,185,129,0.25)] border border-emerald-400/30 active:scale-[0.98] transition-all cursor-pointer self-start"
                                onClick={() => {
                                  setDocStudioType(c.roleName?.toLowerCase().includes("intern") ? "offer-internship" : "offer-fulltime");
                                  setIsDocStudioOpen(true);
                                }}
                              >
                                <FileText className="w-3.5 h-3.5" />
                                <span>Download / View Signed Offer</span>
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div
                className="flex flex-col justify-between gap-4 rounded-2xl p-5 shadow-sm transition-all duration-200"
                style={{
                  background: "var(--card-bg)",
                  border: "1px solid var(--border-2)",
                }}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-[var(--glass-2)] border border-[var(--border-2)] flex items-center justify-center text-text-3">
                        <Briefcase className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-bold text-xs sm:text-sm text-text-2">Offer Extension</div>
                        <div className="text-[16px] text-text-3">Contracts & Acceptance Portal</div>
                      </div>
                    </div>
                    <span className="text-[10.5px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-[var(--glass-2)] border border-[var(--border-2)] text-text-3">
                      Pending Interviews
                    </span>
                  </div>
                  <div className="p-6 rounded-xl flex flex-col items-center justify-center text-center gap-2 bg-[var(--card-bg)] border border-dashed border-[var(--border-2)]">
                    <div className="w-9 h-9 rounded-xl bg-[var(--glass-2)] border border-[var(--border-2)] flex items-center justify-center text-text-3">
                      <Briefcase className="w-4 h-4" />
                    </div>
                    <div className="text-xs font-semibold text-text-2">Candidate not yet in offer stage</div>
                    <div className="text-[15px] text-text-3 max-w-[260px]">
                      Complete Round 1 & Round 2 evaluations to unlock offer letter drafting and dispatch.
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Onboarding Management */}
            <div
              className="flex flex-col justify-between gap-4 rounded-2xl p-5 shadow-sm transition-all duration-200"
              style={{
                background: "var(--card-bg)",
                border: candidateEmployee
                  ? "1px solid rgba(34, 197, 94, 0.30)"
                  : "1px solid var(--border)",
              }}
            >
              <div className="flex flex-col gap-3.5">
                {/* Header */}
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-indigo-500/10 border border-indigo-500/25 flex items-center justify-center text-indigo-400">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs sm:text-sm text-[var(--text)]">Onboarding & Compliance</span>
                        {candidateDocs.length > 0 && (
                          <span className="text-[16px] font-mono font-bold px-2 py-0.5 rounded-full bg-[var(--glass-2)] border border-[var(--border-2)] text-text-2">
                            {candidateDocs.filter(d => d.status === "verified").length}/{candidateDocs.length} Verified
                          </span>
                        )}
                      </div>
                      <div className="text-[16px] text-text-3">Candidate Documents & Verification</div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(`${getPublicBaseUrl()}/onboarding/${c.id}`);
                      setCopiedUploadLink(true);
                      setTimeout(() => setCopiedUploadLink(false), 2000);
                      dialog.success("Candidate upload link copied to clipboard.");
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-text-2 hover:text-[var(--text)] bg-[var(--glass-2)] hover:bg-[var(--glass-2)] border border-[var(--border-2)] hover:border-[var(--border-2)] active:scale-95 transition-all cursor-pointer"
                  >
                    {copiedUploadLink ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5 text-text-2" />
                    )}
                    <span>{copiedUploadLink ? "Link Copied!" : "Copy Upload Link"}</span>
                  </button>
                </div>

                {/* Documents List */}
                {candidateDocs.length === 0 ? (
                  <div className="p-6 rounded-xl flex flex-col items-center justify-center text-center gap-2 bg-[var(--card-bg)] border border-dashed border-[var(--border-2)]">
                    <div className="w-9 h-9 rounded-xl bg-[var(--glass-2)] border border-[var(--border-2)] flex items-center justify-center text-text-3">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div className="text-xs font-semibold text-text-2">No documents uploaded yet</div>
                    <div className="text-[15px] text-text-3 max-w-[280px]">
                      Share the upload link above to collect candidate onboarding and identity documents.
                    </div>
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
                          className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 sm:px-4 sm:py-3 rounded-xl transition-all duration-150 group bg-[var(--card-bg)] hover:bg-[var(--card-bg)] border border-[var(--border-2)]"
                        >
                          {/* File Details */}
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <div className="w-8 h-8 rounded-lg bg-[var(--glass-2)] border border-[var(--border-2)] flex items-center justify-center flex-shrink-0 text-indigo-400 group-hover:border-border-2 transition-all">
                              <FileText className="w-4 h-4" />
                            </div>

                            <div className="flex flex-col min-w-0 flex-1 gap-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span
                                  className="text-xs sm:text-[15px] font-semibold text-[var(--text)] truncate max-w-[220px] sm:max-w-[340px]"
                                  title={doc.fileName}
                                >
                                  {doc.fileName}
                                </span>

                                <span className="text-[16px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md bg-[var(--glass-2)] border border-[var(--border-2)] text-text-2">
                                  {doc.type || "Document"}
                                </span>
                              </div>

                              <div className="flex items-center gap-2 text-[15px]">
                                {isPending && (
                                  <span className="inline-flex items-center gap-1 font-medium text-amber-400">
                                    <Clock className="w-3 h-3 text-amber-400" />
                                    <span>Pending verification</span>
                                  </span>
                                )}
                                {isVerified && (
                                  <span className="inline-flex items-center gap-1 font-medium text-emerald-400">
                                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                                    <span>Verified</span>
                                  </span>
                                )}
                                {isRejected && (
                                  <span className="inline-flex items-center gap-1 font-medium text-red-400">
                                    <AlertCircle className="w-3 h-3 text-red-400" />
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
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-text-2 hover:text-[var(--text)] bg-[var(--glass-2)] hover:bg-[var(--glass-2)] border border-[var(--border-2)] hover:border-[var(--border-2)] active:scale-95 transition-all cursor-pointer"
                              title="View document in new tab"
                            >
                              <ExternalLink className="w-3.5 h-3.5 text-text-2" />
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
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 hover:border-emerald-500/50 active:scale-95 transition-all cursor-pointer"
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
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 hover:border-red-500/50 active:scale-95 transition-all cursor-pointer"
                                >
                                  <X className="w-3.5 h-3.5" />
                                  <span>Reject</span>
                                </button>
                              </div>
                            ) : (
                              <span
                                className={clsx(
                                  "text-[10.5px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full inline-flex items-center gap-1",
                                  isVerified ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-400" : "bg-red-500/10 border border-red-500/30 text-red-400"
                                )}
                              >
                                {isVerified ? (
                                  <>
                                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                                    <span>Verified</span>
                                  </>
                                ) : (
                                  <>
                                    <AlertCircle className="w-3 h-3 text-red-400" />
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
                <button
                  type="button"
                  onClick={() => {
                    handleConvertToEmployee();
                  }}
                  disabled={convertingToEmployee || candidateDocs.length === 0 || !candidateDocs.every(d => d.status === "verified")}
                  className="w-full h-11 px-4 rounded-xl font-semibold text-sm inline-flex items-center justify-center gap-2.5 text-text bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 active:scale-[0.99] border border-emerald-400/30 hover:border-emerald-300/50 shadow-[0_0_20px_rgba(16,185,129,0.22)] hover:shadow-[0_0_25px_rgba(16,185,129,0.35)] focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/70 disabled:opacity-40 disabled:pointer-events-none disabled:shadow-none transition-all duration-150 cursor-pointer mt-2"
                >
                  {convertingToEmployee ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-emerald-100" />
                      <span className="tracking-wide">Converting to Employee...</span>
                    </>
                  ) : (
                    <>
                      <UserCheck className="w-4 h-4 text-emerald-200" />
                      <span className="tracking-wide">Convert to Employee</span>
                    </>
                  )}
                </button>
              )}

              {candidateEmployee && (
                <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/[0.08] mt-2">
                  <div className="text-sm font-bold text-emerald-400 flex items-center gap-2 mb-1.5">
                    <span>🎉</span>
                    <span>Hired as Organization Employee</span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-text-2 flex-wrap">
                    <div>Type: <span className="font-semibold text-[var(--text)]">{candidateEmployee.employmentType}</span></div>
                    <div>Bond Req: <span className="font-semibold text-[var(--text)]">{candidateEmployee.bondRequirement}</span></div>
                  </div>
                  
                  {/* Bond Management */}
                  <div className="mt-3 pt-3 border-t border-emerald-500/20">
                    <div className="flex justify-between items-center mb-2">
                      <div className="text-xs font-semibold text-text">Bond Status</div>
                      <button
                        type="button"
                        className="text-[16px] font-semibold px-2.5 py-1 rounded-md bg-[var(--glass-2)] hover:bg-[var(--glass-2)] text-text border border-[var(--border-2)] transition-all cursor-pointer"
                        onClick={() => handleToggleBond(employeeBond?.isRequired || false)}>
                        Toggle
                      </button>
                    </div>
                    {employeeBond?.isRequired ? (
                      <div className="text-[15px] bg-amber-500/10 text-amber-400 border border-amber-500/25 p-2.5 rounded-lg">
                        <strong>Required.</strong> (Amount: {employeeBond.amount}, Duration: {employeeBond.duration})
                      </div>
                    ) : (
                      <div className="text-[15px] text-text-3">No bond required.</div>
                    )}
                  </div>

                  {/* Resignation Management */}
                  <div className="mt-3 pt-3 border-t border-emerald-500/20">
                    {employeeResignation ? (
                      <div className="bg-red-500/10 border border-red-500/20 p-2.5 rounded-lg">
                        <div className="text-xs font-bold text-red-400">Resigned / Terminated</div>
                        <div className="text-[15px] text-text-2 mt-1">Reason: {employeeResignation.resignationReason}</div>
                        {employeeResignation.isBreach && (
                          <div className="text-[15px] text-red-400 font-semibold mt-1">⚠️ BREACH: {employeeResignation.breachReason}</div>
                        )}
                        <div className="mt-3 flex flex-col gap-2">
                          <button
                            type="button"
                            className="w-full text-xs py-2 rounded-lg bg-[var(--glass-2)] hover:bg-[var(--glass-2)] text-text border border-[var(--border-2)] transition-all cursor-pointer font-semibold"
                            onClick={() => {
                               setDocStudioType('experience-letter');
                               setIsDocStudioOpen(true);
                            }}>
                            Generate Experience Letter
                          </button>
                          <button
                            type="button"
                            className="w-full text-xs py-2 rounded-lg bg-[var(--glass-2)] hover:bg-[var(--glass-2)] text-text border border-[var(--border-2)] transition-all cursor-pointer font-semibold"
                            onClick={() => {
                               setDocStudioType('relieving-letter');
                               setIsDocStudioOpen(true);
                            }}>
                            Generate Relieving Letter
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <button
                          type="button"
                          className="w-full text-xs py-2 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-all font-semibold cursor-pointer"
                          onClick={() => setShowResignationForm(!showResignationForm)}>
                          Process Resignation
                        </button>
                        {showResignationForm && (
                          <div className="mt-2.5 flex flex-col gap-2.5 p-3 rounded-xl bg-glass-2 border border-red-500/20">
                            <textarea
                              value={resignationReason}
                              onChange={e => setResignationReason(e.target.value)}
                              placeholder="Resignation / Termination Reason..."
                              className="w-full bg-[var(--card-bg)] border border-[var(--border-2)] rounded-lg p-2.5 text-xs text-text outline-none focus:border-red-400/50"
                            />
                            <label className="flex items-center gap-2 text-xs text-text-2 cursor-pointer">
                              <input type="checkbox" checked={isBreach} onChange={e => setIsBreach(e.target.checked)} className="rounded accent-red-500" />
                              <span>Classify as Bond Breach</span>
                            </label>
                            {isBreach && (
                              <textarea
                                value={breachReason}
                                onChange={e => setBreachReason(e.target.value)}
                                placeholder="Details of breach..."
                                className="w-full bg-[var(--card-bg)] border border-red-500/40 rounded-lg p-2.5 text-xs text-text outline-none"
                              />
                            )}
                            <button
                              type="button"
                              className="bg-red-600 hover:bg-red-500 text-text font-bold py-2 rounded-lg text-xs mt-1 transition-all cursor-pointer"
                              onClick={handleSubmitResignation}
                              disabled={processingResignation}>
                              Confirm Separation
                            </button>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
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
              onClick={(e) => {
                e.stopPropagation();
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
              <svg className="w-4 h-4 text-[var(--btn-doc-icon)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2} style={{ flexShrink: 0 }}>
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
          offer={candidateOffer}
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
