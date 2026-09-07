"use client";
import React, { useState, useEffect, useMemo } from "react";
import { useStore } from "@/lib/store";
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
    id: "interview",
    name: "Schedule Interview",
    emoji: "📅",
    subject: "Interview Invitation: [Role Name] at Triple S Production",
    rawText: "Hi [Candidate Name],\n\nThank you for showing interest in the [Role Name] position at Triple S Production. Please let us know your availability for a call in the coming days!\n\nBest,\nTriple S Production Team"
  },
  {
    id: "followup",
    name: "Shortlist Follow-up",
    emoji: "✨",
    subject: "Application Update: [Role Name]",
    rawText: "Hi [Candidate Name],\n\nHope you're having a great day! We recently reached out regarding the [Role Name] position at Triple S Production. We are finalizing our shortlist and would love to connect. Let us know if you're still interested.\n\nBest,\nTriple S Production Team"
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
  const [selectedTemplate, setSelectedTemplate] = useState("initial");
  
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
        );
        setMessageSubject(
          template.subject
            .replace(/\[Role Name\]/g, roleInput || "Digital Marketing")
        );
      }
    }
  }, [selectedTemplate, candidate.name, roleInput, isManualEdit]);

  const resetToTemplate = () => {
    setIsManualEdit(false);
    const template = TEMPLATES.find(t => t.id === selectedTemplate);
    if (template) {
      setMessageBody(
        template.rawText
          .replace(/\[Candidate Name\]/g, candidate.name || "Candidate")
          .replace(/\[Role Name\]/g, roleInput || "Digital Marketing")
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
    <div className="fixed inset-y-0 right-0 z-50 w-full max-w-lg bg-[#0c0c0c] border-l border-zinc-800/80 shadow-2xl flex flex-col animate-slide-in-right"
      style={{ boxShadow: "-10px 0 30px rgba(0,0,0,0.85)" }}>
      
      <div className="p-5 border-b border-zinc-800/60 flex items-center justify-between bg-[#080808]">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
            <EmailIcon className="w-5.5 h-5.5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white leading-none">Email Outreach</h3>
            <span className="text-xs text-zinc-500 font-semibold mt-1 block">Recipient: {candidate.name}</span>
          </div>
        </div>
        
        <Btn onClick={onClose}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-500 hover:text-white hover:bg-zinc-800/50 transition-all border border-zinc-800/30">
          ✕
        </Btn>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-5 custom-scrollbar">
        
        <div className="p-4 rounded-2xl bg-zinc-950/40 border border-zinc-900 flex flex-col gap-3.5">
          <div className="text-[10px] uppercase font-bold tracking-widest text-zinc-500">Outreach Recipient Configuration</div>
          
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
                  className={`w-full bg-black/40 border rounded-xl px-3 py-2 text-xs font-semibold outline-none transition-colors ${
                    isEmailValid ? "border-zinc-800 focus:border-zinc-600 text-white" : "border-rose-500/30 text-rose-300 bg-rose-500/5"
                  }`}
                  placeholder="Enter Email Address"
                />
                <span className="absolute right-3 top-2 text-xs opacity-60"><EmailIcon className="w-4 h-4" /></span>
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
                className="w-full bg-black/40 border border-zinc-800 rounded-xl px-3 py-2 text-xs font-semibold text-white outline-none focus:border-zinc-600"
                placeholder="e.g. Digital Marketing"
              />
              <span className="text-[9px] text-zinc-500 font-semibold px-1 mt-1">Replaces [Role Name] token</span>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">Message Template</label>
          <div className="grid grid-cols-2 gap-2">
            {TEMPLATES.map(tmpl => {
              const active = selectedTemplate === tmpl.id;
              return (
                <Btn
                  key={tmpl.id}
                  onClick={() => {
                    setSelectedTemplate(tmpl.id);
                    setIsManualEdit(false);
                  }}
                  className={`p-3 rounded-xl border text-left transition-all duration-150 flex flex-col gap-1.5 ${
                    active
                      ? "border-blue-500/30 bg-blue-500/5 text-white"
                      : "border-zinc-800/80 bg-zinc-950/20 hover:bg-zinc-900/40 text-zinc-400"
                  }`}
                >
                  <span className="text-sm">{tmpl.emoji}</span>
                  <span className="text-xs font-bold leading-tight">{tmpl.name}</span>
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
            className="w-full bg-black/60 border border-zinc-800 rounded-xl px-4 py-2.5 text-xs font-semibold text-zinc-200 outline-none focus:border-zinc-600"
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
          
          <div className="relative rounded-2xl border border-zinc-800 bg-black/60 overflow-hidden flex flex-col">
            <textarea
              rows={6}
              value={messageBody}
              onChange={e => {
                setMessageBody(e.target.value);
                setIsManualEdit(true);
              }}
              placeholder="Type your email body here..."
              className="w-full bg-transparent resize-none p-4 text-xs font-semibold text-zinc-200 outline-none leading-relaxed"
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

        <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-zinc-950/40 border border-zinc-900 text-[11px] text-zinc-500 font-medium">
          <EmailIcon className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
          <span>Email will be sent silently from <strong className="text-zinc-300">developer.triplesproduction@gmail.com</strong> directly to the candidate.</span>
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

      <div className="p-5 border-t border-zinc-800/60 bg-[#080808] flex items-center justify-end gap-3">
        <Btn variant="outline" size="md" onClick={onClose}>
          Cancel
        </Btn>
        
        <Btn
          onClick={handleSend}
          disabled={!isEmailValid || isSending}
          className={`inline-flex items-center gap-2 font-semibold uppercase tracking-wide rounded-xl text-xs px-5 py-2.5 transition-all duration-150 select-none border ${
            isEmailValid && !isSending
              ? "bg-white/8 hover:bg-white/12 text-white border-white/14 hover:border-white/22 cursor-pointer shadow-sm active:scale-95"
              : "bg-zinc-900/30 text-zinc-600 border-zinc-800/40 cursor-not-allowed opacity-50"
          }`}
        >
          {isSending ? (
            <div className="w-4 h-4 border-2 border-zinc-600 border-t-white rounded-full animate-spin"></div>
          ) : (
            <EmailIcon className="w-4 h-4 text-blue-400" />
          )}
          <span>{isSending ? "Sending..." : "Send via Email"}</span>
        </Btn>
      </div>

    </div>
  );
}
