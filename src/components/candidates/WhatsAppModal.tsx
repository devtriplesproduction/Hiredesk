"use client";
import React, { useState, useEffect, useMemo } from "react";
import { useStore } from "@/lib/store";
import type { Candidate } from "@/types";
import { normalizePhoneNumber, validatePhoneNumber } from "@/lib/utils/phone";
import { getPublicBaseUrl } from "@/lib/url";
import { dialog } from "@/components/ui";
import { Btn, Input, Select } from "@/components/ui";
import { DocumentPreview } from "@/components/documents/DocumentPreview";

interface Props {
  candidate: Candidate;
  onClose: () => void;
}

interface Template {
  id: string;
  name: string;
  emoji: string;
  rawText: string;
}

const TEMPLATES: Template[] = [
  {
    id: "initial",
    name: "Initial Outreach",
    emoji: "👋",
    rawText: "Hi [Candidate Name], we are currently hiring for a [Role Name] role at Triple S Production and came across your profile/resume. If you're interested in exploring this opportunity, let us know and we can schedule an interview."
  },
  {
    id: "shortlist",
    name: "Shortlisted",
    emoji: "✨",
    rawText: "Hi [Candidate Name], hope you're having a great day! We have reviewed your application for the [Role Name] position at Triple S Production and you have been shortlisted for the next steps."
  },
  {
    id: "interview",
    name: "Schedule Interview",
    emoji: "📅",
    rawText: "Hi [Candidate Name], we would like to invite you for an interview for the [Role Name] position. Please let us know your availability for a call in the coming days!"
  },
  {
    id: "reject",
    name: "Rejection",
    emoji: "🚫",
    rawText: "Hi [Candidate Name], thank you for your time during the interview process. Unfortunately, we will not be moving forward with your application for the [Role Name] position at this time. We wish you the best in your future endeavors."
  },
  {
    id: "next-round",
    name: "Selected for Next Round",
    emoji: "🎯",
    rawText: "Hi [Candidate Name], congratulations! We are pleased to inform you that you have been selected for the next round of interviews for the [Role Name] position. We will be in touch shortly to schedule it."
  },
  {
    id: "offer",
    name: "Offer Letter",
    emoji: "🎉",
    rawText: "Hi [Candidate Name], we are thrilled to offer you the [Role Name] position at Triple S Production! Please review and respond to your offer here: [Offer Link]"
  },
  {
    id: "onboarding",
    name: "Onboarding & Documents",
    emoji: "📂",
    rawText: "Hi [Candidate Name], welcome to the team! To get started, please upload your required onboarding documents here: [Onboarding Link]\n\nYou can view your Background Verification Checklist here: [Checklist Link]"
  },
  {
    id: "doc-reject",
    name: "Document Resubmission",
    emoji: "⚠️",
    rawText: "Hi [Candidate Name], there was an issue with one or more of your uploaded documents. Please visit [Onboarding Link] to review the feedback and re-upload the required files."
  },
  {
    id: "doc-verified",
    name: "Documents Verified",
    emoji: "✅",
    rawText: "Hi [Candidate Name], great news! Your onboarding documents for the [Role Name] position have been successfully verified. We will be in touch with your next steps shortly."
  },
  {
    id: "hired",
    name: "Hired / Employee Onboarded",
    emoji: "🤝",
    rawText: "Hi [Candidate Name], congratulations! Your onboarding is complete and you are now officially an employee at Triple S Production as a [Role Name]. Welcome aboard!"
  },
  {
    id: "custom",
    name: "Custom Message",
    emoji: "✍️",
    rawText: ""
  }
];

interface OutreachLog {
  timestamp: string;
  phone: string;
  templateName: string;
  message: string;
}

const WhatsAppIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.458 5.705 1.459h.008c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
);

export default function WhatsAppModal({ candidate, onClose }: Props) {
  const { updateCandidate, offers } = useStore();
  const offer = offers.find(o => o.candidateId === candidate.id);

  // State managers
  const [phoneInput, setPhoneInput] = useState(candidate.phone || "");
  const [roleInput, setRoleInput] = useState(offer?.documentData?.designation || candidate.roleName || "Digital Marketing");
  
  const defaultTemplate = useMemo(() => {
    if (candidate.status === "shortlisted") return "shortlist";
    if (candidate.status === "interview_1") return "interview";
    if (candidate.status === "interview_2") return "next-round";
    if (candidate.status === "rejected") return "reject";
    if (candidate.status === "approved") return "next-round";
    if (candidate.status === "offer" || candidate.status === "offer_sent") return "offer";
    if (candidate.status === "offer_accepted" || candidate.status === "onboarding_requested") return "onboarding";
    if (candidate.status === "onboarding_rejected") return "doc-reject";
    if (candidate.status === "onboarding_verified") return "doc-verified";
    if (candidate.status === "hired") return "hired";
    return "initial";
  }, [candidate.status]);

  const [selectedTemplate, setSelectedTemplate] = useState(defaultTemplate);
  
  // Custom edited message body or prefilled template body
  const [messageBody, setMessageBody] = useState("");
  const [isManualEdit, setIsManualEdit] = useState(false);

  // Outreach log history
  const [history, setHistory] = useState<OutreachLog[]>([]);

  // Fetch log history from localStorage
  useEffect(() => {
    const key = `hiredesk_outreach_history_${candidate.id}`;
    const stored = localStorage.getItem(key);
    if (stored) {
      try {
        setHistory(JSON.parse(stored));
      } catch (e) {
        console.error("Failed to parse outreach history", e);
      }
    }
  }, [candidate.id]);

  // Handle template selection and pre-filling
  useEffect(() => {
    if (!isManualEdit) {
      const template = TEMPLATES.find(t => t.id === selectedTemplate);
      if (template) {
        let text = template.rawText;
        // Perform replacement for dynamic preview
        text = text
          .replace(/\[Candidate Name\]/g, candidate.name || "Candidate")
          .replace(/\[Role Name\]/g, roleInput || "Digital Marketing")
          .replace(/\[Offer Link\]/g, `${getPublicBaseUrl()}/offer/${candidate.id}`)
          .replace(/\[Onboarding Link\]/g, `${getPublicBaseUrl()}/onboarding/${candidate.id}`)
          .replace(/\[Checklist Link\]/g, `${getPublicBaseUrl()}/onboarding/${candidate.id}/checklist`);
        setMessageBody(text);
      }
    }
  }, [selectedTemplate, candidate.name, roleInput, isManualEdit, candidate.id]);

  // Recalculate message if name/role changes, but only if user hasn't heavily customized manually
  const resetToTemplate = () => {
    setIsManualEdit(false);
    const template = TEMPLATES.find(t => t.id === selectedTemplate);
    if (template) {
      let text = template.rawText;
      text = text
        .replace(/\[Candidate Name\]/g, candidate.name || "Candidate")
        .replace(/\[Role Name\]/g, roleInput || "Digital Marketing")
        .replace(/\[Offer Link\]/g, `${getPublicBaseUrl()}/offer/${candidate.id}`)
        .replace(/\[Onboarding Link\]/g, `${getPublicBaseUrl()}/onboarding/${candidate.id}`)
        .replace(/\[Checklist Link\]/g, `${getPublicBaseUrl()}/onboarding/${candidate.id}/checklist`);
      setMessageBody(text);
    }
  };

  // Normalization preview
  const normalizedPhone = useMemo(() => normalizePhoneNumber(phoneInput), [phoneInput]);
  const isPhoneValid = useMemo(() => validatePhoneNumber(phoneInput), [phoneInput]);
  const isPhoneChanged = useMemo(() => phoneInput.trim() !== (candidate.phone || "").trim(), [phoneInput, candidate.phone]);

  // Character and Word Counter
  const charCount = messageBody.length;
  const wordCount = messageBody.trim().split(/\s+/).filter(Boolean).length;

  const handleSend = () => {
    if (!isPhoneValid) {
      dialog.warning("Please enter a valid phone number before sending.");
      return;
    }

    // Save updated phone to Supabase if it was changed
    if (isPhoneChanged) {
      updateCandidate(candidate.id, { phone: phoneInput.trim() });
    }

    // Generate wa.me deep link — opens installed WhatsApp app on both mobile and desktop
    const encodedMessage = encodeURIComponent(messageBody);
    const urlPhone = normalizedPhone.replace("+", ""); // wa.me expects digits only, no plus
    const destUrl = `https://wa.me/${urlPhone}?text=${encodedMessage}`;

    // Register log in local storage
    const newLog: OutreachLog = {
      timestamp: new Date().toISOString(),
      phone: normalizedPhone,
      templateName: TEMPLATES.find(t => t.id === selectedTemplate)?.name || "Custom Message",
      message: messageBody
    };

    const updatedHistory = [newLog, ...history];
    setHistory(updatedHistory);
    localStorage.setItem(`hiredesk_outreach_history_${candidate.id}`, JSON.stringify(updatedHistory));

    // Register log in candidate persistent Notes (Supabase!)
    const dateStr = new Date().toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
    const systemNote = `💬 WhatsApp Outreach: Sent "${newLog.templateName}" to ${normalizedPhone} on ${dateStr}`;
    const updatedNote = (candidate.note || "").trim() + (candidate.note ? "\n\n" : "") + systemNote;
    updateCandidate(candidate.id, { note: updatedNote });

    // Open WhatsApp
    window.open(destUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full max-w-lg bg-[var(--glass-2)] backdrop-blur-3xl border-l border-border shadow-[0_0_40px_rgba(0,0,0,0.9)] flex flex-col animate-slide-in-right"
      style={{ boxShadow: "-20px 0 60px rgba(0,0,0,0.9)" }}>
      
      {/* Workspace Header */}
      <div className="p-6 border-b border-border flex items-center justify-between bg-gradient-to-b from-[var(--text)]/[0.08] to-transparent relative overflow-hidden">
        <div className="absolute top-0 left-10 right-10 h-[100px] bg-emerald-500/20 blur-[60px] rounded-full pointer-events-none"></div>
        <div className="flex items-center gap-4 relative z-10">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-emerald-900/40 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.3)] backdrop-blur-md">
            <WhatsAppIcon className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-black text-transparent bg-clip-text bg-gradient-to-r from-[var(--text)] to-[var(--text-3)] tracking-tight leading-none">WhatsApp Outreach</h3>
            <span className="text-xs text-text-2 font-medium mt-1.5 block">Recipient: <span className="text-text font-bold">{candidate.name}</span></span>
          </div>
        </div>
        
        <Btn onClick={onClose}
          className="w-9 h-9 rounded-full flex items-center justify-center text-text-2 hover:text-[var(--text)] hover:bg-glass-2 hover:rotate-90 transition-all duration-300 border border-transparent hover:border-border-2 relative z-10">
          ✕
        </Btn>
      </div>

      {/* Workspace Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar relative">
        
        {/* Recipient Details Card */}
        <div className="p-5 rounded-2xl bg-[var(--glass-2)] border border-border shadow-[inset_0_1px_1px_var(--glass-2)] flex flex-col gap-4 backdrop-blur-md transition-all hover:bg-[var(--glass-2)]">
          <div className="text-[16px] uppercase font-black tracking-[0.2em] text-emerald-500/80 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]"></span>
            Configuration
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Phone Number Field */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[16px] text-text-2 font-bold uppercase tracking-wider flex items-center justify-between">
                <span>Phone Number</span>
                {isPhoneChanged && isPhoneValid && (
                  <span className="text-[9px] text-amber-500 font-extrabold uppercase bg-amber-500/5 px-1.5 py-0.2 rounded border border-amber-500/10">Unsaved Change</span>
                )}
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={phoneInput}
                  onChange={e => setPhoneInput(e.target.value)}
                  className={`w-full bg-glass-2 border rounded-xl px-4 py-2.5 text-xs font-semibold outline-none transition-all duration-300 shadow-[inset_0_2px_4px_rgba(0,0,0,0.5)] ${
                    isPhoneValid ? "border-border focus:border-emerald-500/50 focus:shadow-[0_0_15px_rgba(16,185,129,0.15)] text-text" : "border-rose-500/40 focus:border-rose-500/60 text-rose-300 bg-rose-500/5"
                  }`}
                  placeholder="Enter Phone Number"
                />
                <span className="absolute right-3.5 top-2.5 text-sm opacity-50">📞</span>
              </div>
              
              {/* Phone Normalization Preview Indicator */}
              <div className="flex items-center justify-between mt-1 px-1">
                <span className="text-[9px] text-text-3 font-semibold leading-none">
                  Normalized: <strong className="font-mono text-text-2">{normalizedPhone || "—"}</strong>
                </span>
                {!phoneInput && (
                  <span className="text-[9px] text-rose-400 font-bold leading-none">⚠️ Missing Phone</span>
                )}
                {phoneInput && !isPhoneValid && (
                  <span className="text-[9px] text-rose-400 font-bold leading-none">⚠️ Format invalid</span>
                )}
                {phoneInput && isPhoneValid && (
                  <span className="text-[9px] text-emerald-400 font-bold leading-none">✓ Normalization Ready</span>
                )}
              </div>
            </div>

            {/* Hiring Role Override */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[16px] text-text-2 font-bold uppercase tracking-wider">Hiring Job Title</label>
              <input
                type="text"
                value={roleInput}
                onChange={e => {
                  setRoleInput(e.target.value);
                  setIsManualEdit(false); // allow re-triggering auto-fills
                }}
                className="w-full bg-glass-2 border border-border rounded-xl px-4 py-2.5 text-xs font-semibold text-text outline-none transition-all duration-300 shadow-[inset_0_2px_4px_rgba(0,0,0,0.5)] focus:border-emerald-500/50 focus:shadow-[0_0_15px_rgba(16,185,129,0.15)]"
                placeholder="e.g. Digital Marketing"
              />
              <span className="text-[9px] text-text-3 font-semibold px-1 mt-1 flex items-center gap-1"><span className="text-emerald-500/70">✨</span> Replaces [Role Name] token</span>
            </div>
          </div>
        </div>

        {/* Template Chooser */}
        <div className="space-y-2">
          <label className="text-[16px] text-text-2 font-bold uppercase tracking-wider block">Message Template</label>
          <div className="grid grid-cols-2 gap-2.5">
            {TEMPLATES.map(tmpl => {
              const active = selectedTemplate === tmpl.id;
              return (
                <Btn
                  key={tmpl.id}
                  onClick={() => {
                    setSelectedTemplate(tmpl.id);
                    setIsManualEdit(false);
                  }}
                  className={`p-3.5 rounded-xl border text-left transition-all duration-300 flex flex-col gap-2 relative overflow-hidden group ${
                    active
                      ? "border-emerald-500/50 bg-emerald-500/10 text-text shadow-[0_0_20px_rgba(16,185,129,0.1)] scale-[1.02]"
                      : "border-border bg-[var(--glass-2)] hover:bg-[var(--glass-2)] hover:border-border-2 text-text-2"
                  }`}
                >
                  {active && <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/20 to-transparent pointer-events-none"></div>}
                  <span className={`text-base drop-shadow-md transition-transform duration-300 ${active ? "scale-110" : "group-hover:scale-110"}`}>{tmpl.emoji}</span>
                  <span className="text-xs font-bold leading-tight relative z-10">{tmpl.name}</span>
                </Btn>
              );
            })}
          </div>
        </div>

        {/* Main Message Body & Live Preview */}
        <div className="space-y-2 flex flex-col">
          <div className="flex justify-between items-center">
            <label className="text-[16px] text-text-2 font-bold uppercase tracking-wider">Hiring Message Composer</label>
            
            {isManualEdit && (
              <Btn
                onClick={resetToTemplate}
                className="text-[9px] text-amber-500 font-bold hover:text-amber-400 bg-amber-500/5 px-2 py-0.5 rounded border border-amber-500/20 transition-all"
              >
                🔄 Reset to Template
              </Btn>
            )}
          </div>
          
          <div className="relative rounded-2xl border border-border bg-glass-3 overflow-hidden flex flex-col shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)] focus-within:border-emerald-500/40 focus-within:shadow-[0_0_20px_rgba(16,185,129,0.1)] transition-all duration-300">
            <textarea
              rows={6}
              value={messageBody}
              onChange={e => {
                setMessageBody(e.target.value);
                setIsManualEdit(true);
              }}
              placeholder="Type your message body here..."
              className="w-full bg-transparent resize-none p-5 text-sm font-medium text-text outline-none leading-relaxed custom-scrollbar"
            />
            
            {/* Tokens replacement details strip */}
            <div className="px-4 py-2 border-t border-[var(--border-2)] bg-[var(--card-bg)]/80 flex items-center justify-between text-[16px] text-text-3 font-medium">
              <div className="flex gap-2">
                <span className={`px-1.5 py-0.2 rounded font-bold ${messageBody.includes(candidate.name) ? "text-emerald-400 bg-emerald-500/10" : "text-[var(--text-3)] bg-[var(--card-bg)]"}`}>
                  Name Replaced
                </span>
                <span className={`px-1.5 py-0.2 rounded font-bold ${messageBody.includes(roleInput) ? "text-emerald-400 bg-emerald-500/10" : "text-[var(--text-3)] bg-[var(--card-bg)]"}`}>
                  Role Replaced
                </span>
              </div>
              
              <span className="font-mono text-[9.5px]">
                {charCount} chars · {wordCount} words
              </span>
            </div>
          </div>
        </div>

        {/* Info strip */}
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20 text-xs text-text-2 font-medium">
          <WhatsAppIcon className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>Will open the <strong className="text-text font-bold">WhatsApp app</strong> directly on your device</span>
        </div>

        {/* Outreach History timeline */}
        <div className="space-y-3">
          <div className="text-[16px] uppercase font-bold tracking-widest text-text-3">Outreach History Audit</div>
          
          {history.length === 0 ? (
            <div className="text-center py-6 bg-[var(--card-bg)]/10 border border-dashed border-[var(--border-2)] rounded-2xl text-[15px] text-[var(--text-3)]">
              No WhatsApp outreach records tracked for this candidate.
            </div>
          ) : (
            <div className="space-y-3 max-h-[160px] overflow-y-auto pr-1">
              {history.map((log, index) => {
                const date = new Date(log.timestamp).toLocaleString(undefined, {
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit"
                });
                return (
                  <div key={index} className="p-3 bg-[var(--card-bg)]/50 border border-[var(--border)] rounded-xl space-y-1.5 text-[15px]">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-text uppercase tracking-wider text-[9px] bg-[var(--card-bg)] px-1.5 py-0.2 rounded border border-[var(--border-2)]">
                        {log.templateName}
                      </span>
                      <span className="text-[9px] text-text-3 font-mono font-medium">{date}</span>
                    </div>
                    <p className="text-text-2 font-medium leading-relaxed italic truncate" title={log.message}>
                      "{log.message}"
                    </p>
                    <div className="text-[9px] text-text-3 font-mono">
                      Sent to: <span className="text-text-2 font-semibold">{log.phone}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>

      {/* Action Footer */}
      <div className="p-5 border-t border-border bg-gradient-to-t from-black to-white/[0.02] flex items-center justify-end gap-3 backdrop-blur-md">
        <Btn variant="outline" size="md" onClick={onClose} className="rounded-xl border-border hover:bg-[var(--glass-2)] text-text-2 font-bold transition-all">
          Cancel
        </Btn>
        
        <Btn
          onClick={handleSend}
          disabled={!isPhoneValid}
          className={`inline-flex items-center gap-2.5 font-bold uppercase tracking-wider rounded-xl text-xs px-6 py-3 transition-all duration-300 select-none ${
            isPhoneValid
              ? "bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-text shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_30px_rgba(16,185,129,0.5)] active:scale-95 hover:-translate-y-0.5 border-none"
              : "bg-[var(--glass-2)] text-[var(--text-3)] border border-border cursor-not-allowed"
          }`}
        >
          <WhatsAppIcon className="w-4 h-4 text-text drop-shadow-md" />
          <span>Send via WhatsApp</span>
        </Btn>
      </div>

    </div>
  );
}
