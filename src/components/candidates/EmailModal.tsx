"use client";
import React, { useState, useEffect, useMemo } from "react";
import { useStore } from "@/lib/store";
import { getPublicBaseUrl } from "@/lib/url";
import type { Candidate } from "@/types";
import { Btn } from "@/components/ui";

interface Props {
  candidate: Candidate;
  onClose: () => void;
}

interface Template {
  id: string;
  name: string;
  emoji: string;
  subject: string;
  rawText: string;
}

const TEMPLATES: Template[] = [
  {
    id: "initial",
    name: "Initial Outreach",
    emoji: "👋",
    subject: "Opportunities at Triple S Production for [Role Name]",
    rawText: "Hi [Candidate Name],\n\nWe are currently hiring for a [Role Name] role at Triple S Production and came across your profile/resume. If you're interested in exploring this opportunity, let us know and we can schedule an interview.\n\nBest,\nTriple S Production Team"
  },
  {
    id: "shortlist",
    name: "Shortlisted",
    emoji: "✨",
    subject: "Application Update: [Role Name]",
    rawText: "Hi [Candidate Name],\n\nHope you're having a great day! We have reviewed your application for the [Role Name] position at Triple S Production and you have been shortlisted for the next steps.\n\nBest,\nTriple S Production Team"
  },
  {
    id: "interview",
    name: "Schedule Interview",
    emoji: "📅",
    subject: "Interview Invitation: [Role Name] at Triple S Production",
    rawText: "Hi [Candidate Name],\n\nWe would like to invite you for an interview for the [Role Name] position. Please let us know your availability for a call in the coming days!\n\nBest,\nTriple S Production Team"
  },
  {
    id: "reject",
    name: "Rejection",
    emoji: "🚫",
    subject: "Update on your application for [Role Name]",
    rawText: "Hi [Candidate Name],\n\nThank you for your time during the interview process. Unfortunately, we will not be moving forward with your application for the [Role Name] position at this time. We wish you the best in your future endeavors.\n\nBest,\nTriple S Production Team"
  },
  {
    id: "next-round",
    name: "Selected for Next Round",
    emoji: "🎯",
    subject: "Next Steps: [Role Name] at Triple S Production",
    rawText: "Hi [Candidate Name],\n\nCongratulations! We are pleased to inform you that you have been selected for the next round of interviews for the [Role Name] position. We will be in touch shortly to schedule it.\n\nBest,\nTriple S Production Team"
  },
  {
    id: "offer",
    name: "Offer Letter",
    emoji: "🎉",
    subject: "Job Offer: [Role Name] at Triple S Production",
    rawText: "Hi [Candidate Name],\n\nWe are thrilled to offer you the [Role Name] position at Triple S Production! Please review and respond to your offer here: [Offer Link]\n\nBest,\nTriple S Production Team"
  },
  {
    id: "onboarding",
    name: "Onboarding & Documents",
    emoji: "📂",
    subject: "Welcome to Triple S Production! Next Steps",
    rawText: "Hi [Candidate Name],\n\nWelcome to the team! To get started, please upload your required onboarding documents here: [Onboarding Link]\n\nBest,\nTriple S Production Team"
  },
  {
    id: "doc-reject",
    name: "Document Resubmission",
    emoji: "⚠️",
    subject: "Action Required: Document Resubmission",
    rawText: "Hi [Candidate Name],\n\nThere was an issue with one or more of your uploaded documents. Please visit [Onboarding Link] to review the feedback and re-upload the required files.\n\nBest,\nTriple S Production Team"
  },
  {
    id: "doc-verified",
    name: "Documents Verified",
    emoji: "✅",
    subject: "Update: Documents Verified for [Role Name]",
    rawText: "Hi [Candidate Name],\n\nGreat news! Your onboarding documents for the [Role Name] position have been successfully verified. We will be in touch with your next steps shortly.\n\nBest,\nTriple S Production Team"
  },
  {
    id: "hired",
    name: "Hired / Employee Onboarded",
    emoji: "🤝",
    subject: "Welcome Aboard! Next Steps at Triple S Production",
    rawText: "Hi [Candidate Name],\n\nCongratulations! Your onboarding is complete and you are now officially an employee at Triple S Production as a [Role Name]. Welcome aboard!\n\nBest,\nTriple S Production Team"
  },
  {
    id: "custom",
    name: "Custom Message",
    emoji: "✍️",
    subject: "Application Update: [Role Name]",
    rawText: ""
  }
];

interface OutreachLog {
  timestamp: string;
  email: string;
  templateName: string;
  message: string;
}

const EmailIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
);

export default function EmailModal({ candidate, onClose }: Props) {
  const { updateCandidate } = useStore();

  const [emailInput, setEmailInput] = useState(candidate.email || "");
  const [roleInput, setRoleInput] = useState(candidate.roleName || "Digital Marketing");
  
  const defaultTemplate = useMemo(() => {
    if (candidate.status === "shortlisted") return "shortlist";
    if (candidate.status === "interview_1" || candidate.status === "interview_2") return "interview";
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
  
  const [messageSubject, setMessageSubject] = useState("");
  const [messageBody, setMessageBody] = useState("");
  const [isManualEdit, setIsManualEdit] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const [history, setHistory] = useState<OutreachLog[]>([]);

  useEffect(() => {
    const key = `hiredesk_email_history_${candidate.id}`;
    const stored = localStorage.getItem(key);
    if (stored) {
      try {
        setHistory(JSON.parse(stored));
      } catch (e) {}
    }
  }, [candidate.id]);

  useEffect(() => {
    if (!isManualEdit) {
      const template = TEMPLATES.find(t => t.id === selectedTemplate);
      if (template) {
        setMessageBody(
          template.rawText
            .replace(/\[Candidate Name\]/g, candidate.name || "Candidate")
            .replace(/\[Role Name\]/g, roleInput || "Digital Marketing")
            .replace(/\[Offer Link\]/g, `${getPublicBaseUrl()}/offer/${candidate.id}`)
            .replace(/\[Onboarding Link\]/g, `${getPublicBaseUrl()}/onboarding/${candidate.id}`)
        );
        setMessageSubject(
          template.subject
            .replace(/\[Role Name\]/g, roleInput || "Digital Marketing")
        );
      }
    }
  }, [selectedTemplate, candidate.name, roleInput, isManualEdit, candidate.id]);

  const resetToTemplate = () => {
    setIsManualEdit(false);
    const template = TEMPLATES.find(t => t.id === selectedTemplate);
    if (template) {
      setMessageBody(
        template.rawText
          .replace(/\[Candidate Name\]/g, candidate.name || "Candidate")
          .replace(/\[Role Name\]/g, roleInput || "Digital Marketing")
          .replace(/\[Offer Link\]/g, `${getPublicBaseUrl()}/offer/${candidate.id}`)
          .replace(/\[Onboarding Link\]/g, `${getPublicBaseUrl()}/onboarding/${candidate.id}`)
      );
      setMessageSubject(
        template.subject
          .replace(/\[Role Name\]/g, roleInput || "Digital Marketing")
      );
    }
  };

  const isEmailValid = useMemo(() => emailInput.trim().includes("@"), [emailInput]);
  const isEmailChanged = useMemo(() => emailInput.trim() !== (candidate.email || "").trim(), [emailInput, candidate.email]);

  const charCount = messageBody.length;
  const wordCount = messageBody.trim().split(/\s+/).filter(Boolean).length;

  const handleSend = async () => {
    if (!isEmailValid) {
      alert("Please enter a valid email before sending.");
      return;
    }

    if (isEmailChanged) {
      updateCandidate(candidate.id, { email: emailInput.trim() });
    }

    setIsSending(true);

    try {
      const response = await fetch("/api/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: emailInput.trim(),
          subject: messageSubject,
          text: messageBody,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to send email");
      }

      const newLog: OutreachLog = {
        timestamp: new Date().toISOString(),
        email: emailInput.trim(),
        templateName: TEMPLATES.find(t => t.id === selectedTemplate)?.name || "Custom Message",
        message: messageBody
      };

      const updatedHistory = [newLog, ...history];
      setHistory(updatedHistory);
      localStorage.setItem(`hiredesk_email_history_${candidate.id}`, JSON.stringify(updatedHistory));

      const dateStr = new Date().toLocaleDateString(undefined, {
        month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit"
      });
      const systemNote = `📧 Email Outreach: Sent "${newLog.templateName}" to ${emailInput.trim()} on ${dateStr}`;
      const updatedNote = (candidate.note || "").trim() + (candidate.note ? "\n\n" : "") + systemNote;
      updateCandidate(candidate.id, { note: updatedNote });

      alert("Email sent successfully!");
    } catch (error: any) {
      console.error(error);
      alert("Failed to send email. Make sure GMAIL_APP_PASSWORD is set in .env.local.");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full max-w-lg bg-black/70 backdrop-blur-3xl border-l border-white/10 shadow-[0_0_40px_rgba(0,0,0,0.9)] flex flex-col animate-slide-in-right"
      style={{ boxShadow: "-20px 0 60px rgba(0,0,0,0.9)" }}>
      
      <div className="p-6 border-b border-white/10 flex items-center justify-between bg-gradient-to-b from-white/[0.08] to-transparent relative overflow-hidden">
        <div className="absolute top-0 left-10 right-10 h-[100px] bg-blue-500/20 blur-[60px] rounded-full pointer-events-none"></div>
        <div className="flex items-center gap-4 relative z-10">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500/20 to-blue-900/40 border border-blue-500/30 flex items-center justify-center text-blue-400 shadow-[0_0_20px_rgba(59,130,246,0.3)] backdrop-blur-md">
            <EmailIcon className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-zinc-400 tracking-tight leading-none">Email Outreach</h3>
            <span className="text-xs text-zinc-400 font-medium mt-1.5 block">Recipient: <span className="text-white font-bold">{candidate.name}</span></span>
          </div>
        </div>
        
        <Btn onClick={onClose}
          className="w-9 h-9 rounded-full flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/10 hover:rotate-90 transition-all duration-300 border border-transparent hover:border-white/20 relative z-10">
          ✕
        </Btn>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar relative">
        
        <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] flex flex-col gap-4 backdrop-blur-md transition-all hover:bg-white/[0.03]">
          <div className="text-[10px] uppercase font-black tracking-[0.2em] text-blue-500/80 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)]"></span>
            Configuration
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider flex items-center justify-between">
                <span>Email Address</span>
                {isEmailChanged && isEmailValid && (
                  <span className="text-[9px] text-amber-500 font-extrabold uppercase bg-amber-500/5 px-1.5 py-0.2 rounded border border-amber-500/10">Unsaved Change</span>
                )}
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={emailInput}
                  onChange={e => setEmailInput(e.target.value)}
                  className={`w-full bg-black/40 border rounded-xl px-4 py-2.5 text-xs font-semibold outline-none transition-all duration-300 shadow-[inset_0_2px_4px_rgba(0,0,0,0.5)] ${
                    isEmailValid ? "border-white/10 focus:border-blue-500/50 focus:shadow-[0_0_15px_rgba(59,130,246,0.15)] text-white" : "border-rose-500/40 focus:border-rose-500/60 text-rose-300 bg-rose-500/5"
                  }`}
                  placeholder="Enter Email Address"
                />
                <span className="absolute right-3.5 top-2.5 text-sm opacity-50"><EmailIcon className="w-4 h-4" /></span>
              </div>
              
              <div className="flex items-center justify-between mt-1 px-1">
                {!emailInput && (
                  <span className="text-[9px] text-rose-400 font-bold leading-none">⚠️ Missing Email</span>
                )}
                {emailInput && !isEmailValid && (
                  <span className="text-[9px] text-rose-400 font-bold leading-none">⚠️ Format invalid</span>
                )}
                {emailInput && isEmailValid && (
                  <span className="text-[9px] text-emerald-400 font-bold leading-none">✓ Normalization Ready</span>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Hiring Job Title</label>
                <input
                  type="text"
                  value={roleInput}
                  onChange={e => {
                    setRoleInput(e.target.value);
                    setIsManualEdit(false);
                  }}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-xs font-semibold text-white outline-none transition-all duration-300 shadow-[inset_0_2px_4px_rgba(0,0,0,0.5)] focus:border-blue-500/50 focus:shadow-[0_0_15px_rgba(59,130,246,0.15)]"
                  placeholder="e.g. Digital Marketing"
                />
                <span className="text-[9px] text-zinc-500 font-semibold px-1 mt-1 flex items-center gap-1"><span className="text-blue-500/70">✨</span> Replaces [Role Name] token</span>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">Message Template</label>
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
                      ? "border-blue-500/50 bg-blue-500/10 text-white shadow-[0_0_20px_rgba(59,130,246,0.1)] scale-[1.02]"
                      : "border-white/5 bg-white/[0.02] hover:bg-white/[0.06] hover:border-white/20 text-zinc-400"
                  }`}
                >
                  {active && <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-transparent pointer-events-none"></div>}
                  <span className={`text-base drop-shadow-md transition-transform duration-300 ${active ? "scale-110" : "group-hover:scale-110"}`}>{tmpl.emoji}</span>
                  <span className="text-xs font-bold leading-tight relative z-10">{tmpl.name}</span>
                </Btn>
              );
            })}
          </div>
        </div>

        <div className="space-y-2 flex flex-col">
          <div className="flex justify-between items-center">
            <label className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Email Subject</label>
          </div>
          <input
            type="text"
            value={messageSubject}
            onChange={e => {
              setMessageSubject(e.target.value);
              setIsManualEdit(true);
            }}
            className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-xs font-semibold text-zinc-200 outline-none transition-all duration-300 shadow-[inset_0_2px_4px_rgba(0,0,0,0.5)] focus:border-blue-500/50 focus:shadow-[0_0_15px_rgba(59,130,246,0.15)]"
            placeholder="Subject..."
          />
        </div>

        <div className="space-y-2 flex flex-col">
          <div className="flex justify-between items-center">
            <label className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Email Body</label>
            
            {isManualEdit && (
              <Btn
                onClick={resetToTemplate}
                className="text-[9px] text-amber-500 font-bold hover:text-amber-400 bg-amber-500/5 px-2 py-0.5 rounded border border-amber-500/20 transition-all"
              >
                🔄 Reset to Template
              </Btn>
            )}
          </div>
          
          <div className="relative rounded-2xl border border-white/10 bg-black/50 overflow-hidden flex flex-col shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)] focus-within:border-blue-500/40 focus-within:shadow-[0_0_20px_rgba(59,130,246,0.1)] transition-all duration-300">
            <textarea
              rows={6}
              value={messageBody}
              onChange={e => {
                setMessageBody(e.target.value);
                setIsManualEdit(true);
              }}
              placeholder="Type your email body here..."
              className="w-full bg-transparent resize-none p-5 text-sm font-medium text-zinc-200 outline-none leading-relaxed custom-scrollbar"
            />
            
            <div className="px-4 py-2 border-t border-zinc-900 bg-zinc-950/80 flex items-center justify-between text-[10px] text-zinc-500 font-medium">
              <div className="flex gap-2">
                <span className={`px-1.5 py-0.2 rounded font-bold ${messageBody.includes(candidate.name) ? "text-blue-400 bg-blue-500/10" : "text-zinc-600 bg-zinc-900"}`}>
                  Name Replaced
                </span>
                <span className={`px-1.5 py-0.2 rounded font-bold ${messageBody.includes(roleInput) ? "text-blue-400 bg-blue-500/10" : "text-zinc-600 bg-zinc-900"}`}>
                  Role Replaced
                </span>
              </div>
              
              <span className="font-mono text-[9.5px]">
                {charCount} chars · {wordCount} words
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-blue-500/5 border border-blue-500/20 text-xs text-zinc-400 font-medium">
          <EmailIcon className="w-4 h-4 text-blue-400 flex-shrink-0" />
          <span>Email will be sent silently from <strong className="text-white font-bold">developer.triplesproduction@gmail.com</strong> directly to the candidate.</span>
        </div>

        <div className="space-y-3">
          <div className="text-[10px] uppercase font-bold tracking-widest text-zinc-500">Outreach History Audit</div>
          
          {history.length === 0 ? (
            <div className="text-center py-6 bg-zinc-950/10 border border-dashed border-zinc-900 rounded-2xl text-[11px] text-zinc-600">
              No Email outreach records tracked for this candidate.
            </div>
          ) : (
            <div className="space-y-3 max-h-[160px] overflow-y-auto pr-1">
              {history.map((log, index) => {
                const date = new Date(log.timestamp).toLocaleString(undefined, {
                  month: "short", day: "numeric", hour: "2-digit", minute: "2-digit"
                });
                return (
                  <div key={index} className="p-3 bg-zinc-950/50 border border-zinc-900/60 rounded-xl space-y-1.5 text-[11px]">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-white uppercase tracking-wider text-[9px] bg-zinc-900 px-1.5 py-0.2 rounded border border-zinc-800">
                        {log.templateName}
                      </span>
                      <span className="text-[9px] text-zinc-500 font-mono font-medium">{date}</span>
                    </div>
                    <p className="text-zinc-400 font-medium leading-relaxed italic truncate" title={log.message}>
                      "{log.message}"
                    </p>
                    <div className="text-[9px] text-zinc-500 font-mono">
                      Sent to: <span className="text-zinc-300 font-semibold">{log.email}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>

      <div className="p-5 border-t border-white/5 bg-gradient-to-t from-black to-white/[0.02] flex items-center justify-end gap-3 backdrop-blur-md">
        <Btn variant="outline" size="md" onClick={onClose} className="rounded-xl border-white/10 hover:bg-white/5 text-zinc-300 font-bold transition-all">
          Cancel
        </Btn>
        
        <Btn
          onClick={handleSend}
          disabled={!isEmailValid || isSending}
          className={`inline-flex items-center gap-2.5 font-bold uppercase tracking-wider rounded-xl text-xs px-6 py-3 transition-all duration-300 select-none ${
            isEmailValid && !isSending
              ? "bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white shadow-[0_0_20px_rgba(59,130,246,0.3)] hover:shadow-[0_0_30px_rgba(59,130,246,0.5)] active:scale-95 hover:-translate-y-0.5 border-none"
              : "bg-white/5 text-zinc-600 border border-white/5 cursor-not-allowed"
          }`}
        >
          {isSending ? (
            <div className="w-4 h-4 border-2 border-zinc-600 border-t-white rounded-full animate-spin"></div>
          ) : (
            <EmailIcon className="w-4 h-4 text-white drop-shadow-md" />          )}
          <span>{isSending ? "Sending..." : "Send via Email"}</span>
        </Btn>
      </div>

    </div>
  );
}
