"use client";
import React, { useState, useEffect, useMemo } from "react";
import { useStore } from "@/lib/store";
import { getPublicBaseUrl } from "@/lib/url";
import type { Candidate } from "@/types";
import { Btn, dialog } from "@/components/ui";
import { DocumentPreview } from "@/components/documents/DocumentPreview";
import { getTemplatesForRole, getDefaultTemplateForStatus } from "@/lib/modal-utils";
import { STATUS_UPDATE_MAP } from "@/lib/hiring-sop";

interface Props {
  candidate: Candidate;
  onClose: () => void;
}

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
  const { updateCandidate, offers } = useStore();
  const offer = offers.find(o => o.candidateId === candidate.id);

  const TEMPLATES = useMemo(() => getTemplatesForRole(candidate.roleId, candidate.status), [candidate.roleId, candidate.status]);

  const [emailInput, setEmailInput] = useState(candidate.email || "");
  const [roleInput, setRoleInput] = useState(offer?.documentData?.designation || candidate.roleName || "Digital Marketing");
  
  const defaultTemplate = useMemo(() => getDefaultTemplateForStatus(candidate.status), [candidate.status]);
  
  const [selectedTemplate, setSelectedTemplate] = useState(defaultTemplate);
  
  const [messageSubject, setMessageSubject] = useState("");
  const [messageBody, setMessageBody] = useState("");
  const [isManualEdit, setIsManualEdit] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [autoUpdateStatus, setAutoUpdateStatus] = useState(true);

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
      const template = TEMPLATES.find(t => t.id === selectedTemplate) || TEMPLATES[0];
      if (template) {
        let text = template.rawText;
        text = text
          .replace(/\[Name\]/g, candidate.name || "Candidate")
          .replace(/\[Role\]/g, roleInput || "Digital Marketing");
        setMessageBody(text);
        
        let subject = `Application Update: ${roleInput}`;
        if (template.id === 'first_response' || template.id === 'follow_up' || template.id === 'details_resume_request') {
           subject = `Action Required: Application for ${roleInput}`;
        } else if (template.id === 'shortlist') {
           subject = `Update: Shortlisted for ${roleInput}`;
        } else if (template.id === 'task' || template.id === 'task_reminder') {
           subject = `Practical Assignment: ${roleInput}`;
        } else if (template.id === 'interview_invitation' || template.id === 'interview_confirmation' || template.id === 'interview_reminder') {
           subject = `Interview Details: ${roleInput}`;
        } else if (template.id === 'selected' || template.id === 'offer_sent') {
           subject = `Job Offer: ${roleInput}`;
        }
        setMessageSubject(subject);
      }
    }
  }, [selectedTemplate, candidate.name, roleInput, isManualEdit, candidate.id, TEMPLATES]);

  const resetToTemplate = () => {
    setIsManualEdit(false);
    const template = TEMPLATES.find(t => t.id === selectedTemplate) || TEMPLATES[0];
    if (template) {
      let text = template.rawText;
      text = text
        .replace(/\[Name\]/g, candidate.name || "Candidate")
        .replace(/\[Role\]/g, roleInput || "Digital Marketing");
      setMessageBody(text);
      
      let subject = `Application Update: ${roleInput}`;
      setMessageSubject(subject);
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
      let attachments: any[] = [];
      
      if (autoUpdateStatus) {
        const nextStatus = STATUS_UPDATE_MAP[selectedTemplate];
        if (nextStatus) {
          const invalidTransitions = ["new", "awaiting_details", "follow_up", "screening", "awaiting_resume_portfolio", "shortlisted", "task_sent"];
          if (nextStatus === "interview" && invalidTransitions.includes(candidate.status)) {
             dialog.warning("SOP Rule: Cannot auto-jump to interview from current status.");
             setIsSending(false);
             return;
          }
          updateCandidate(candidate.id, { status: nextStatus as any });
        }
      }

      const response = await fetch("/api/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: emailInput.trim(),
          subject: messageSubject,
          text: messageBody,
          attachments,
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
      onClose();
    } catch (error: any) {
      console.error(error);
      alert("Failed to send email. Make sure GMAIL_APP_PASSWORD is set in .env.local.");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full max-w-lg bg-[var(--glass-2)] backdrop-blur-3xl border-l border-border shadow-[0_0_40px_rgba(0,0,0,0.9)] flex flex-col animate-slide-in-right"
      style={{ boxShadow: "-20px 0 60px rgba(0,0,0,0.9)" }}>
      
      <div className="p-6 border-b border-border flex items-center justify-between bg-gradient-to-b from-[var(--text)]/[0.08] to-transparent relative overflow-hidden">
        <div className="absolute top-0 left-10 right-10 h-[100px] bg-blue-500/20 blur-[60px] rounded-full pointer-events-none"></div>
        <div className="flex items-center gap-4 relative z-10">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500/20 to-blue-900/40 border border-blue-500/30 flex items-center justify-center text-blue-400 shadow-[0_0_20px_rgba(59,130,246,0.3)] backdrop-blur-md">
            <EmailIcon className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-black text-transparent bg-clip-text bg-gradient-to-r from-[var(--text)] to-[var(--text-3)] tracking-tight leading-none">Email Outreach</h3>
            <span className="text-xs text-text-2 font-medium mt-1.5 block">Recipient: <span className="text-text font-bold">{candidate.name}</span></span>
          </div>
        </div>
        
        <Btn onClick={onClose}
          className="w-9 h-9 rounded-full flex items-center justify-center text-text-2 hover:text-[var(--text)] hover:bg-glass-2 hover:rotate-90 transition-all duration-300 border border-transparent hover:border-border-2 relative z-10">
          ✕
        </Btn>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar relative">
        
        <div className="p-5 rounded-2xl bg-[var(--glass-2)] border border-border shadow-[inset_0_1px_1px_var(--glass-2)] flex flex-col gap-4 backdrop-blur-md transition-all hover:bg-[var(--glass-2)]">
          <div className="text-[16px] uppercase font-black tracking-[0.2em] text-blue-500/80 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)]"></span>
            Configuration
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="flex flex-col gap-1.5">
              <label className="text-[16px] text-text-2 font-bold uppercase tracking-wider flex items-center justify-between">
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
                  className={`w-full bg-glass-2 border rounded-xl px-4 py-2.5 text-xs font-semibold outline-none transition-all duration-300 shadow-[inset_0_2px_4px_rgba(0,0,0,0.5)] \${
                    isEmailValid ? "border-border focus:border-blue-500/50 focus:shadow-[0_0_15px_rgba(59,130,246,0.15)] text-text" : "border-rose-500/40 focus:border-rose-500/60 text-rose-300 bg-rose-500/5"
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
              <label className="text-[16px] text-text-2 font-bold uppercase tracking-wider">Hiring Job Title</label>
                <input
                  type="text"
                  value={roleInput}
                  onChange={e => {
                    setRoleInput(e.target.value);
                    setIsManualEdit(false);
                  }}
                  className="w-full bg-glass-2 border border-border rounded-xl px-4 py-2.5 text-xs font-semibold text-text outline-none transition-all duration-300 shadow-[inset_0_2px_4px_rgba(0,0,0,0.5)] focus:border-blue-500/50 focus:shadow-[0_0_15px_rgba(59,130,246,0.15)]"
                  placeholder="e.g. Digital Marketing"
                />
                <span className="text-[9px] text-text-3 font-semibold px-1 mt-1 flex items-center gap-1"><span className="text-blue-500/70">✨</span> Replaces [Role] token</span>
            </div>
          </div>
        </div>

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
                      ? "border-blue-500/50 bg-blue-500/10 text-text shadow-[0_0_20px_rgba(59,130,246,0.1)] scale-[1.02]"
                      : "border-border bg-[var(--glass-2)] hover:bg-[var(--glass-2)] hover:border-border-2 text-text-2"
                  }`}
                >
                  {active && <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-transparent pointer-events-none"></div>}
                  <span className="text-xs font-bold leading-tight relative z-10">{tmpl.name}</span>
                </Btn>
              );
            })}
          </div>
        </div>

        <div className="space-y-2 flex flex-col">
          <div className="flex justify-between items-center">
            <label className="text-[16px] text-text-2 font-bold uppercase tracking-wider">Email Subject</label>
          </div>
          <input
            type="text"
            value={messageSubject}
            onChange={e => {
              setMessageSubject(e.target.value);
              setIsManualEdit(true);
            }}
            className="w-full bg-glass-3 border border-border rounded-xl px-4 py-3 text-xs font-semibold text-text outline-none transition-all duration-300 shadow-[inset_0_2px_4px_rgba(0,0,0,0.5)] focus:border-blue-500/50 focus:shadow-[0_0_15px_rgba(59,130,246,0.15)]"
            placeholder="Subject..."
          />
        </div>

        <div className="space-y-2 flex flex-col">
          <div className="flex justify-between items-center">
            <label className="text-[16px] text-text-2 font-bold uppercase tracking-wider">Email Body</label>
            
            {isManualEdit && (
              <Btn
                onClick={resetToTemplate}
                className="text-[9px] text-amber-500 font-bold hover:text-amber-400 bg-amber-500/5 px-2 py-0.5 rounded border border-amber-500/20 transition-all"
              >
                🔄 Reset to Template
              </Btn>
            )}
          </div>
          
          <div className="relative rounded-2xl border border-border bg-glass-3 overflow-hidden flex flex-col shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)] focus-within:border-blue-500/40 focus-within:shadow-[0_0_20px_rgba(59,130,246,0.1)] transition-all duration-300">
            <textarea
              rows={12}
              value={messageBody}
              onChange={e => {
                setMessageBody(e.target.value);
                setIsManualEdit(true);
              }}
              placeholder="Type your email body here..."
              className="w-full bg-transparent resize-none p-5 text-sm font-medium text-text outline-none leading-relaxed custom-scrollbar"
            />
            
            <div className="px-4 py-2 border-t border-[var(--border-2)] bg-[var(--card-bg)]/80 flex items-center justify-between text-[16px] text-text-3 font-medium">
              <div className="flex gap-2">
                <span className={`px-1.5 py-0.2 rounded font-bold ${messageBody.includes(candidate.name) ? "text-blue-400 bg-blue-500/10" : "text-[var(--text-3)] bg-[var(--card-bg)]"}`}>
                  Name Replaced
                </span>
                <span className={`px-1.5 py-0.2 rounded font-bold ${messageBody.includes(roleInput) ? "text-blue-400 bg-blue-500/10" : "text-[var(--text-3)] bg-[var(--card-bg)]"}`}>
                  Role Replaced
                </span>
              </div>
              
              <span className="font-mono text-[9.5px]">
                {charCount} chars · {wordCount} words
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-blue-500/5 border border-blue-500/20 text-xs text-text-2 font-medium">
          <EmailIcon className="w-4 h-4 text-blue-400 flex-shrink-0" />
          <span>Email will be sent silently from <strong className="text-text font-bold">developer.triplesproduction@gmail.com</strong> directly to the candidate.</span>
        </div>
        
        <div className="flex items-center gap-2 mt-2">
          <input 
            type="checkbox" 
            id="autoUpdateStatusEmail" 
            checked={autoUpdateStatus} 
            onChange={e => setAutoUpdateStatus(e.target.checked)} 
          />
          <label htmlFor="autoUpdateStatusEmail" className="text-sm font-medium text-text-2 cursor-pointer">
            Update status after send (if applicable)
          </label>
        </div>

        <div className="space-y-3">
          <div className="text-[16px] uppercase font-bold tracking-widest text-text-3">Outreach History Audit</div>
          
          {history.length === 0 ? (
            <div className="text-center py-6 bg-[var(--card-bg)]/10 border border-dashed border-[var(--border-2)] rounded-2xl text-[15px] text-[var(--text-3)]">
              No Email outreach records tracked for this candidate.
            </div>
          ) : (
            <div className="space-y-3 max-h-[160px] overflow-y-auto pr-1">
              {history.map((log, index) => {
                const date = new Date(log.timestamp).toLocaleString(undefined, {
                  month: "short", day: "numeric", hour: "2-digit", minute: "2-digit"
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
                      Sent to: <span className="text-text-2 font-semibold">{log.email}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>

      <div className="p-5 border-t border-border bg-gradient-to-t from-black to-white/[0.02] flex items-center justify-end gap-3 backdrop-blur-md">
        <Btn variant="outline" size="md" onClick={onClose} className="rounded-xl border-border hover:bg-[var(--glass-2)] text-text-2 font-bold transition-all">
          Cancel
        </Btn>
        
        <Btn
          onClick={handleSend}
          disabled={!isEmailValid || isSending}
          className={`inline-flex items-center gap-2.5 font-bold uppercase tracking-wider rounded-xl text-xs px-6 py-3 transition-all duration-300 select-none ${
            isEmailValid && !isSending
              ? "bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-text shadow-[0_0_20px_rgba(59,130,246,0.3)] hover:shadow-[0_0_30px_rgba(59,130,246,0.5)] active:scale-95 hover:-translate-y-0.5 border-none"
              : "bg-[var(--glass-2)] text-[var(--text-3)] border border-border cursor-not-allowed"
          }`}
        >
          {isSending ? (
            <div className="w-4 h-4 border-2 border-[var(--border-3)] border-t-[var(--text)] rounded-full animate-spin"></div>
          ) : (
            <EmailIcon className="w-4 h-4 text-text drop-shadow-md" />          )}
          <span>{isSending ? "Sending..." : "Send via Email"}</span>
        </Btn>
      </div>
    </div>
  );
}
