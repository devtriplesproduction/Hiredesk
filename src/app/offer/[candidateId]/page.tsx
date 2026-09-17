"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Btn } from "@/components/ui";
import { DocumentPreview } from "@/components/documents/DocumentPreview";
import { DocumentData } from "@/components/documents/documentGenerator";
import { 
  Sparkles, 
  CheckCircle2, 
  FileText, 
  Briefcase, 
  Building2, 
  Clock, 
  XCircle, 
  ShieldCheck, 
  ChevronRight,
  ZoomIn,
  ZoomOut,
  RotateCcw
} from "lucide-react";

export default function CandidateOfferPage() {
  const params = useParams();
  const router = useRouter();
  const candidateId = params.candidateId as string;

  const [loading, setLoading] = useState(true);
  const [candidate, setCandidate] = useState<any>(null);
  const [offer, setOffer] = useState<any>(null);
  
  const [isExpired, setIsExpired] = useState(false);
  const [requiresVerification, setRequiresVerification] = useState(false);
  const [phoneInput, setPhoneInput] = useState("");
  const [verifying, setVerifying] = useState(false);
  
  const [submitting, setSubmitting] = useState(false);
  const [zoomScale, setZoomScale] = useState<number>(100);

  const loadData = async () => {
    try {
      const res = await fetch(`/api/offers/${candidateId}?t=${Date.now()}`);
      if (!res.ok) throw new Error("Failed to load");
      
      const data = await res.json();
      
      if (data.expired) {
        setIsExpired(true);
      } else if (data.requiresVerification) {
        setRequiresVerification(true);
      }
      
      if (data.candidate) setCandidate(data.candidate);
      if (data.offer) setOffer(data.offer);
    } catch (err) {
      console.error("Failed to load offer data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [candidateId]);

  // Ensure full page vertical scrolling on Candidate Offer portal (overrides global html/body overflow:hidden on desktop)
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

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneInput.trim()) return;

    setVerifying(true);
    try {
      const res = await fetch(`/api/offers/${candidateId}/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: phoneInput })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Verification failed");
      }
      
      // Verification successful, reload data to get full offer
      setRequiresVerification(false);
      setLoading(true);
      await loadData();
    } catch (err: any) {
      console.error(err);
      alert(err.message);
    } finally {
      setVerifying(false);
    }
  };

  const handleRespond = async (decision: "accepted" | "rejected") => {
    if (!offer) return;
    
    let reason = "";
    if (decision === "rejected") {
      const input = prompt("Please provide a reason for rejecting the offer:");
      if (input === null) return; // User cancelled
      if (!input.trim()) {
        alert("A reason is required to reject the offer.");
        return;
      }
      reason = input.trim();
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/offers/respond", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          offerId: offer.id,
          candidateId,
          decision,
          reason
        })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to submit response");
      }
      
      setOffer({ ...offer, status: decision });
    } catch (err: any) {
      console.error(err);
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-white bg-[#080808]">Loading offer...</div>;
  }

  if (isExpired) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-[#080808] text-white">
        <div className="max-w-lg w-full bg-[var(--glass)] border border-[var(--border)] rounded-2xl p-8 shadow-2xl text-center">
          <span className="text-4xl block mb-2">⏳</span>
          <h1 className="text-3xl font-bold mb-2">Link Expired</h1>
          <p className="text-[var(--text-3)] mb-4">This offer link was only valid for 24 hours and has now expired.</p>
          <p className="text-sm text-[var(--text-4)]">Please contact HR if you need a new offer link.</p>
        </div>
      </div>
    );
  }

  if (requiresVerification) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-[#080808] text-white">
        <div className="max-w-lg w-full bg-[var(--glass)] border border-[var(--border)] rounded-2xl p-8 shadow-2xl text-center animate-fade-in">
          <span className="text-4xl block mb-2">🔒</span>
          <h1 className="text-2xl font-bold mb-2">Secure Offer Link</h1>
          <p className="text-[var(--text-3)] mb-2">This offer link is valid for 24 hours.</p>
          <p className="text-sm text-[var(--text-4)] mb-8">To view your offer letter, enter your mobile number.</p>
          
          <form onSubmit={handleVerify} className="flex flex-col gap-4">
            <input 
              type="tel"
              placeholder="Enter your mobile number"
              value={phoneInput}
              onChange={(e) => setPhoneInput(e.target.value)}
              disabled={verifying}
              className="w-full bg-[#111111] border border-[var(--border)] rounded-xl px-4 py-3 text-white placeholder-[var(--text-4)] focus:outline-none focus:border-[var(--green)]"
              required
            />
            <Btn 
              type="submit" 
              disabled={verifying || !phoneInput.trim()}
              className="w-full py-3 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-500 disabled:opacity-50 transition-all">
              {verifying ? "Verifying..." : "Verify & View Offer"}
            </Btn>
          </form>
        </div>
      </div>
    );
  }

  if (!candidate || !offer || offer.status === "draft") {
    return <div className="min-h-screen flex items-center justify-center text-red-500 bg-[#080808]">Offer not found or not yet available.</div>;
  }

  const documentData: DocumentData = offer.documentData || {};
  const docType = "offer-fulltime"; 

  const displayRole = documentData.designation || candidate.roleName;

  return (
    <div className="min-h-screen bg-[#080808] text-white flex flex-col items-center relative selection:bg-emerald-500/20 selection:text-white">
      {/* Ambient background glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[350px] bg-gradient-to-b from-emerald-500/5 via-cyan-500/5 to-transparent blur-3xl pointer-events-none -z-10" />

      <div className="max-w-5xl w-full flex flex-col gap-6 px-4 py-8 md:py-12">
        
        {/* Top Branding / Breadcrumb */}
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2 text-xs font-medium text-[var(--text-3)] tracking-wider uppercase">
            <span className="flex items-center gap-1.5 text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]" />
              HireDesk
            </span>
            <ChevronRight size={13} className="text-white/20" />
            <span className="text-[var(--text-2)]">Offer Portal</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-[var(--text-3)] bg-white/[0.03] px-3 py-1 rounded-full border border-white/[0.06]">
            <ShieldCheck size={13} className="text-emerald-400" />
            <span>Secure Candidate Access</span>
          </div>
        </div>

        {/* Hero Card */}
        <div className="relative overflow-hidden bg-gradient-to-b from-[#141414] to-[#0d0d0d] border border-white/[0.08] rounded-3xl p-6 sm:p-10 shadow-2xl backdrop-blur-xl">
          {/* Subtle top inner highlight */}
          <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-emerald-500/40 to-transparent" />

          <div className="flex flex-col items-center text-center">
            {/* Pill Header */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] text-xs font-semibold uppercase tracking-wider text-emerald-400 mb-4 shadow-sm">
              <Sparkles size={13} className="text-emerald-400 animate-pulse" />
              <span>Official Employment Offer</span>
            </div>

            {/* Main Title */}
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white mb-3">
              Job Offer Letter
            </h1>

            {/* Candidate Greeting & Role Badge */}
            <div className="max-w-xl text-sm sm:text-base text-[var(--text-2)] leading-relaxed">
              Congratulations <span className="font-semibold text-white">{candidate.name}</span>! Triple S Production is excited to extend you an offer for
              <div className="inline-flex items-center gap-1.5 mx-1.5 px-2.5 py-0.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-white font-medium text-sm">
                <Briefcase size={13} className="text-emerald-400 shrink-0" />
                <span>{displayRole}</span>
              </div>
            </div>

            {/* Offer Accepted Card */}
            {offer.status === "accepted" && (
              <div className="mt-8 w-full max-w-xl p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-emerald-950/25 via-[#0e1713] to-emerald-950/20 border border-emerald-500/30 shadow-[0_4px_24px_rgba(16,185,129,0.08)] flex items-center gap-4 text-left transition-all">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center shrink-0 text-2xl shadow-inner">
                  🎉
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2.5">
                    <h3 className="font-bold text-base text-emerald-400 tracking-tight">Offer Accepted!</h3>
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 shadow-sm">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      Confirmed
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-[var(--text-2)] mt-1 font-normal leading-relaxed">
                    Your offer letter will be provided after you join the company.
                  </p>
                </div>
              </div>
            )}

            {/* Offer Rejected Card */}
            {offer.status === "rejected" && (
              <div className="mt-8 w-full max-w-xl p-4 sm:p-5 rounded-2xl bg-red-950/20 border border-red-500/30 shadow-[0_4px_24px_rgba(239,68,68,0.08)] flex items-center gap-4 text-left">
                <div className="w-12 h-12 rounded-xl bg-red-500/15 border border-red-500/30 flex items-center justify-center shrink-0 text-2xl">
                  🚫
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2.5">
                    <h3 className="font-bold text-base text-red-400 tracking-tight">Offer Rejected</h3>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-red-500/15 text-red-400 border border-red-500/25">
                      Declined
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-[var(--text-2)] mt-1 font-normal leading-relaxed">
                    Thank you for your time. We wish you the best in your future endeavors.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Document Workspace Container */}
        <div className="w-full flex flex-col rounded-3xl border border-white/[0.08] bg-[#0c0c0c] shadow-2xl overflow-hidden mt-2">
          {/* Document Header Bar */}
          <div className="px-5 py-3.5 bg-[#121212] border-b border-white/[0.06] flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-xs font-semibold text-[var(--text-2)] uppercase tracking-wider">
              <FileText size={15} className="text-emerald-400" />
              <span>Document Preview</span>
              <span className="text-[11px] font-normal normal-case text-[var(--text-3)]">· Letter of Appointment</span>
            </div>

            {/* Zoom Controls */}
            <div className="flex items-center gap-1.5 bg-white/[0.04] p-1 rounded-xl border border-white/[0.06]">
              <button 
                onClick={() => setZoomScale(prev => Math.max(prev - 10, 60))}
                title="Zoom out"
                className="w-7 h-7 rounded-lg flex items-center justify-center text-[var(--text-2)] hover:text-white hover:bg-white/10 transition-colors">
                <ZoomOut size={14} />
              </button>
              <span className="text-[11px] font-mono px-2 text-[var(--text-2)] select-none">
                {zoomScale}%
              </span>
              <button 
                onClick={() => setZoomScale(prev => Math.min(prev + 10, 130))}
                title="Zoom in"
                className="w-7 h-7 rounded-lg flex items-center justify-center text-[var(--text-2)] hover:text-white hover:bg-white/10 transition-colors">
                <ZoomIn size={14} />
              </button>
              <button 
                onClick={() => setZoomScale(100)}
                title="Reset zoom"
                className="w-7 h-7 rounded-lg flex items-center justify-center text-[var(--text-3)] hover:text-white hover:bg-white/10 transition-colors ml-0.5">
                <RotateCcw size={12} />
              </button>
            </div>
          </div>

          {/* Document Viewing Area - smoothly accessible with natural scroll and horizontal overflow when zoomed */}
          <div className="w-full flex justify-center overflow-x-auto p-4 sm:p-8 md:p-12 bg-[#090909] custom-scrollbar">
            <div 
              style={{ transform: `scale(${zoomScale / 100})`, transformOrigin: "top center" }}
              className="w-max transition-transform duration-150 drop-shadow-[0_16px_40px_rgba(0,0,0,0.85)] my-2">
              <DocumentPreview documentType={docType} data={documentData} />
            </div>
          </div>
        </div>

        {/* Actions for Pending Offer */}
        {offer.status === "sent" && (
          <div className="bg-[#111111]/95 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-[0_-10px_40px_rgba(0,0,0,0.8)] sticky bottom-4 z-50 flex flex-col items-center">
            <p className="text-sm text-gray-400 mb-4 font-medium">Please review the details above and provide your response below.</p>
            <div className="flex w-full md:w-3/4 gap-4">
              <Btn 
                onClick={() => handleRespond("accepted")}
                disabled={submitting}
                className="flex-1 py-4 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 text-white font-bold shadow-lg shadow-green-900/50 hover:shadow-green-500/30 hover:-translate-y-0.5 disabled:opacity-50 transition-all text-base tracking-wide border border-green-400/30">
                {submitting ? "Processing..." : "Accept Offer"}
              </Btn>
              <Btn 
                onClick={() => handleRespond("rejected")}
                disabled={submitting}
                className="flex-1 py-4 rounded-xl bg-[#1c1c1c] text-gray-300 font-bold hover:bg-[#252525] hover:text-white shadow-lg shadow-black/50 hover:shadow-red-900/20 hover:-translate-y-0.5 disabled:opacity-50 transition-all text-base tracking-wide border border-white/10 hover:border-red-500/40">
                Reject Offer
              </Btn>
            </div>
          </div>
        )}
        
      </div>
    </div>
  );
}
