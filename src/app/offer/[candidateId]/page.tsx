"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Btn } from "@/components/ui";
import { DocumentPreview } from "@/components/documents/DocumentPreview";
import { DocumentData } from "@/components/documents/documentGenerator";
import { 
  Sparkles, 
  CheckCircle2, 
  FileText, 
  Briefcase, 
  Clock, 
  XCircle, 
  ShieldCheck, 
  ChevronRight,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Lock,
  Phone,
  AlertTriangle,
  ArrowRight,
  Loader2,
  Building2,
  HelpCircle
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
  const [verifyError, setVerifyError] = useState("");
  
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
      } else {
        setRequiresVerification(false);
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
    setVerifyError("");
    try {
      const res = await fetch(`/api/offers/${candidateId}/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: phoneInput })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Verification failed. Please check your mobile number.");
      }
      
      // Verification successful, reload data to get full offer
      setRequiresVerification(false);
      setLoading(true);
      await loadData();
    } catch (err: any) {
      console.error(err);
      setVerifyError(err.message || "Incorrect mobile number. Please try again.");
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

  // Reusable Site Header across all portal views
  const renderHeader = () => (
    <header className="w-full h-[60px] flex items-center justify-between px-4 sm:px-8 border-b border-[var(--border)] backdrop-blur-xl sticky top-0 z-50 bg-[#0a0a0a]/95">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl overflow-hidden flex items-center justify-center flex-shrink-0 border border-[var(--border)] bg-black/60 shadow-inner">
          <img src="/logo.png" alt="HireDesk Logo" className="w-full h-full object-cover" />
        </div>
        <div>
          <div className="text-sm sm:text-base font-bold tracking-tight leading-tight text-[var(--text)]">
            HireDesk
          </div>
          <div className="text-[16px] sm:text-[15px] text-[var(--text-3)] font-medium leading-tight">
            Triple S Production
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="hidden sm:flex items-center gap-1.5 text-xs text-[var(--text-2)] bg-[var(--glass)] px-3 py-1.5 rounded-full border border-[var(--border)]">
          <ShieldCheck size={13} className="text-[#00D9FF]" />
          <span>256-Bit SSL Encrypted</span>
        </div>
      </div>
    </header>
  );

  // Loading State
  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] flex flex-col relative overflow-hidden font-sans">
        {renderHeader()}
        <div className="flex-1 flex flex-col items-center justify-center p-4 relative z-10">
          <div className="w-full max-w-sm p-8 rounded-3xl bg-[var(--bg2)] border border-[var(--border)] backdrop-blur-2xl shadow-2xl text-center flex flex-col items-center gap-4">
            <div className="relative">
              <div className="w-14 h-14 rounded-2xl overflow-hidden border border-[var(--border)] flex items-center justify-center bg-black/40">
                <img src="/logo.png" alt="HireDesk Logo" className="w-full h-full object-cover" />
              </div>
              <div className="absolute -inset-1 rounded-2xl border border-[#00D9FF]/30 animate-ping opacity-25" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Loading Offer Portal</h3>
              <p className="text-xs text-[var(--text-2)] mt-1">Retrieving employment documentation securely...</p>
            </div>
            <Loader2 className="w-5 h-5 text-[#00D9FF] animate-spin mt-1" />
          </div>
        </div>
      </div>
    );
  }

  // Expired Link View
  if (isExpired) {
    return (
      <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] flex flex-col relative overflow-hidden font-sans">
        {/* Subtle Ambient Glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[350px] bg-amber-500/[0.03] blur-[140px] pointer-events-none -z-10" />

        {renderHeader()}

        <div className="flex-1 flex items-center justify-center p-4 relative z-10">
          <div className="max-w-md w-full bg-[var(--bg2)] border border-[var(--border)] rounded-3xl p-8 sm:p-10 shadow-[0_20px_60px_rgba(0,0,0,0.85)] text-center relative overflow-hidden backdrop-blur-2xl animate-fade-in">
            {/* Top Highlight */}
            <div className="absolute top-0 inset-x-0 h-[1.5px] bg-gradient-to-r from-transparent via-amber-500/30 to-transparent" />

            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto mb-5 shadow-inner">
              <Clock size={24} />
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-[15px] font-semibold text-amber-400 mb-3">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              Link Window Expired
            </div>

            <h1 className="text-2xl font-bold text-white mb-2">Offer Link Expired</h1>
            <p className="text-sm text-[var(--text-2)] mb-6 leading-relaxed">
              For security reasons, official offer letter links are valid for <span className="text-white font-medium">24 hours</span> from issuance. This link has now expired.
            </p>

            <div className="p-4 rounded-2xl bg-[var(--glass)] border border-[var(--border)] text-left mb-6">
              <div className="flex items-start gap-3">
                <HelpCircle size={18} className="text-[var(--text-3)] shrink-0 mt-0.5" />
                <div className="text-xs text-[var(--text-2)] leading-relaxed">
                  Please reach out to the <span className="text-white font-medium">Triple S Production HR Team</span> or reply to the message where you received this link to request an updated access link.
                </div>
              </div>
            </div>

            <div className="text-[15px] text-[var(--text-3)] font-medium">
              Triple S Production · Talent Acquisition Gateway
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Verification Screen (Matches screenshot prompt)
  if (requiresVerification) {
    return (
      <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] flex flex-col relative overflow-hidden font-sans">
        <style jsx global>{`
          @keyframes subtlePan {
            0% { background-position: 0px 0px; }
            100% { background-position: 24px 24px; }
          }
          .grid-animated {
            animation: subtlePan 20s linear infinite;
          }
        `}</style>

        {/* Background Dot Grid */}
        <div 
          className="absolute inset-0 grid-animated pointer-events-none opacity-40"
          style={{
            backgroundImage: "radial-gradient(rgba(255, 255, 255, 0.035) 1.2px, transparent 0)",
            backgroundSize: "24px 24px"
          }} 
        />

        {/* Ambient Glowing Orbs with subtle cyan hue */}
        <div className="absolute top-[10%] left-1/2 -translate-x-1/2 w-[600px] h-[360px] bg-gradient-to-b from-[#00D9FF]/[0.05] via-[#00D9FF]/[0.02] to-transparent blur-[140px] pointer-events-none" />
        <div className="absolute bottom-[10%] right-[15%] w-[400px] h-[400px] bg-white/[0.015] blur-[160px] pointer-events-none" />

        {renderHeader()}

        <div className="flex-1 flex items-center justify-center p-4 sm:p-6 relative z-10">
          <div className="max-w-[430px] w-full bg-[#111111]/90 border border-[var(--border)] rounded-3xl p-7 sm:p-9 shadow-[0_25px_60px_rgba(0,0,0,0.85)] relative overflow-hidden backdrop-blur-2xl animate-fade-in flex flex-col">
            
            {/* Top Cyan Highlight Line */}
            <div className="absolute top-0 inset-x-0 h-[1.5px] bg-gradient-to-r from-transparent via-[#00D9FF]/40 to-transparent" />

            {/* Header Lock Badge */}
            <div className="flex flex-col items-center text-center">
              <div className="w-13 h-13 rounded-2xl bg-[#00D9FF]/10 border border-[#00D9FF]/25 flex items-center justify-center text-[#00D9FF] shadow-[0_0_24px_rgba(0,217,255,0.18)] mb-4 p-3">
                <Lock size={22} className="stroke-[2.2]" />
              </div>

              {/* Pre-Employment Verification Badge matching screenshot */}
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--glass-2)] border border-[var(--border-2)] text-[15px] font-mono uppercase tracking-widest text-[#00D9FF] mb-3 shadow-sm">
                <Sparkles size={12} className="text-[#00D9FF]" />
                <span>Pre-Employment Verification</span>
              </div>

              <h1 className="text-2xl sm:text-[26px] font-extrabold text-white tracking-tight mb-2">
                Secure Offer Link
              </h1>

              {/* Personalized Greeting if candidate details are loaded */}
              {candidate?.name ? (
                <div className="text-sm text-zinc-200 mb-1">
                  Welcome, <span className="text-white font-bold">{candidate.name}</span>
                </div>
              ) : null}

              {candidate?.roleName && (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#00D9FF]/10 border border-[#00D9FF]/25 text-[#00D9FF] text-xs font-semibold mb-3.5">
                  <Briefcase size={13} className="text-[#00D9FF]" />
                  <span>{candidate.roleName}</span>
                </div>
              )}

              <p className="text-xs sm:text-[13.5px] text-zinc-300 leading-relaxed mb-4">
                This offer letter is confidential. To protect your compensation details, please verify your registered mobile number.
              </p>

              {/* Validity Notice */}
              <div className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-xs text-zinc-200 mb-6 shadow-sm">
                <Clock size={13} className="text-[#00D9FF] shrink-0" />
                <span>Link is valid for <strong className="text-white font-semibold">24 hours</strong> from generation</span>
              </div>
            </div>

            {/* Error Message Banner */}
            {verifyError && (
              <div className="mb-5 p-3.5 rounded-xl bg-red-500/15 border border-red-500/30 text-red-300 text-xs font-medium flex items-start gap-2.5 animate-fade-in">
                <AlertTriangle size={16} className="shrink-0 mt-0.5 text-red-400" />
                <span className="leading-snug">{verifyError}</span>
              </div>
            )}

            {/* Verification Form */}
            <form onSubmit={handleVerify} className="flex flex-col gap-4">
              <div>
                <label className="block text-[15px] font-bold text-zinc-200 uppercase tracking-wider mb-2">
                  Registered Mobile Number
                </label>
                
                <div className="relative flex items-center rounded-xl bg-[#161616] border border-white/[0.12] focus-within:border-[#00D9FF] focus-within:ring-1 focus-within:ring-[#00D9FF]/30 transition-all">
                  <div className="flex items-center gap-1.5 pl-3.5 pr-2.5 py-3 text-zinc-200 border-r border-white/[0.1] select-none text-xs font-semibold">
                    <Phone size={14} className="text-[#00D9FF]" />
                    <span>+91</span>
                  </div>

                  <input 
                    type="tel"
                    placeholder="Enter 10-digit mobile number"
                    value={phoneInput}
                    onChange={(e) => {
                      setPhoneInput(e.target.value);
                      if (verifyError) setVerifyError("");
                    }}
                    disabled={verifying}
                    maxLength={15}
                    className="w-full bg-transparent px-3 py-3 text-white text-sm placeholder:text-zinc-500 focus:outline-none font-mono tracking-wide"
                    required
                    autoFocus
                  />
                </div>
                <p className="text-[15px] text-zinc-400 mt-1.5 pl-1">
                  Enter the phone number associated with your application
                </p>
              </div>

              <button 
                type="submit" 
                disabled={verifying || !phoneInput.trim()}
                className="w-full py-3.5 rounded-xl bg-gradient-to-b from-[#FFFFFF] to-[#E9ECEF] text-[#0A0C10] font-extrabold text-xs tracking-wider uppercase transition-all duration-200 shadow-[0_2px_14px_rgba(255,255,255,0.15),inset_0_1px_0_rgba(255,255,255,0.95)] hover:shadow-[0_6px_26px_rgba(0,217,255,0.32),inset_0_1px_0_rgba(255,255,255,1)] hover:border-[#00D9FF] active:scale-[0.98] disabled:bg-[#202226] disabled:text-zinc-400 disabled:border-white/[0.08] disabled:shadow-none disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-1 border border-white/80 cursor-pointer">
                {verifying ? (
                  <>
                    <Loader2 size={16} className="animate-spin text-[#0A0C10]" />
                    <span>Verifying Identity...</span>
                  </>
                ) : (
                  <>
                    <span>Verify & View Offer</span>
                    <ArrowRight size={15} className={phoneInput.trim() ? "text-[#0A0C10]" : "text-zinc-400"} />
                  </>
                )}
              </button>
            </form>

            {/* Trust Footer */}
            <div className="mt-7 pt-4 border-t border-white/[0.08] flex items-center justify-between text-xs text-zinc-400">
              <span>Triple S Production</span>
              <span className="flex items-center gap-1.5 text-zinc-300">
                <Lock size={11} className="text-[#00D9FF]" />
                End-to-End Encrypted
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Not Found / Draft State
  if (!candidate || !offer || offer.status === "draft") {
    return (
      <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] flex flex-col relative overflow-hidden font-sans">
        {renderHeader()}
        <div className="flex-1 flex items-center justify-center p-4 relative z-10">
          <div className="max-w-md w-full bg-[var(--bg2)] border border-[var(--border)] rounded-3xl p-8 sm:p-10 shadow-2xl text-center backdrop-blur-2xl">
            <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center mx-auto mb-4">
              <XCircle size={24} />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Offer Not Available</h2>
            <p className="text-xs text-[var(--text-2)] leading-relaxed mb-6">
              The requested offer letter could not be found or is not currently available for viewing.
            </p>
            <div className="text-[15px] text-[var(--text-3)]">
              Please contact your recruiting coordinator for assistance.
            </div>
          </div>
        </div>
      </div>
    );
  }

  const documentData: DocumentData = offer.documentData || {};
  const docType = "offer-fulltime"; 
  const displayRole = documentData.designation || candidate.roleName;

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] flex flex-col items-center relative font-sans">
      {/* Top Global Header */}
      {renderHeader()}

      {/* Subtle ambient glow */}
      <div className="absolute top-[60px] left-1/2 -translate-x-1/2 w-[700px] h-[300px] bg-[#00D9FF]/[0.025] blur-3xl pointer-events-none -z-10" />

      <div className="max-w-5xl w-full flex flex-col gap-6 px-4 py-8 md:py-10">
        
        {/* Top Branding / Breadcrumb */}
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2 text-xs font-medium text-[var(--text-3)] tracking-wider uppercase">
            <span className="flex items-center gap-1.5 text-[#00D9FF]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00D9FF] shadow-[0_0_8px_rgba(0,217,255,0.8)]" />
              HireDesk
            </span>
            <ChevronRight size={13} className="text-[var(--text-3)]" />
            <span className="text-[var(--text)]">Official Offer Letter</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-[var(--text-2)] bg-[var(--glass)] px-3 py-1.5 rounded-full border border-[var(--border)]">
            <ShieldCheck size={13} className="text-[#00D9FF]" />
            <span>Verified Session</span>
          </div>
        </div>

        {/* Hero Card */}
        <div className="relative overflow-hidden bg-[var(--bg2)] border border-[var(--border)] rounded-3xl p-6 sm:p-10 shadow-2xl backdrop-blur-xl">
          {/* Subtle top inner highlight */}
          <div className="absolute inset-x-0 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-[#00D9FF]/30 to-transparent" />

          <div className="flex flex-col items-center text-center">
            {/* Pill Header matching user screenshot */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[var(--glass-2)] border border-[var(--border-2)] text-xs font-mono uppercase tracking-widest text-[#00D9FF] mb-4 shadow-sm">
              <Sparkles size={13} className="text-[#00D9FF]" />
              <span>Official Employment Offer</span>
            </div>

            {/* Main Title */}
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white mb-3">
              Letter of Appointment
            </h1>

            {/* Candidate Greeting & Role Badge */}
            <div className="max-w-xl text-sm sm:text-base text-zinc-300 leading-relaxed">
              Congratulations <span className="font-semibold text-white">{candidate.name}</span>! Triple S Production is excited to extend you an official employment offer for
              <div className="inline-flex items-center gap-1.5 mx-1.5 px-3 py-1 rounded-xl bg-[#00D9FF]/10 border border-[#00D9FF]/20 text-[#00D9FF] font-semibold text-sm">
                <Briefcase size={14} className="text-[#00D9FF] shrink-0" />
                <span>{displayRole}</span>
              </div>
            </div>

            {/* Offer Accepted Card */}
            {offer.status === "accepted" && (
              <div className="mt-8 w-full max-w-xl p-4 sm:p-5 rounded-2xl bg-emerald-950/20 border border-emerald-500/20 shadow-[0_4px_24px_rgba(16,185,129,0.06)] flex items-center gap-4 text-left transition-all">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0 text-2xl shadow-inner">
                  🎉
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2.5">
                    <h3 className="font-bold text-base text-emerald-400 tracking-tight">Offer Accepted!</h3>
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[15px] font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/20 shadow-sm">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      Confirmed
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-zinc-300 mt-1 font-normal leading-relaxed">
                    Your response has been confirmed. The onboarding team will reach out shortly with next steps.
                  </p>
                </div>
              </div>
            )}

            {/* Offer Rejected Card */}
            {offer.status === "rejected" && (
              <div className="mt-8 w-full max-w-xl p-4 sm:p-5 rounded-2xl bg-red-950/20 border border-red-500/20 shadow-[0_4px_24px_rgba(239,68,68,0.06)] flex items-center gap-4 text-left">
                <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center shrink-0 text-2xl">
                  🚫
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2.5">
                    <h3 className="font-bold text-base text-red-400 tracking-tight">Offer Declined</h3>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[15px] font-semibold bg-red-500/15 text-red-400 border border-red-500/20">
                      Declined
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-zinc-300 mt-1 font-normal leading-relaxed">
                    Thank you for your response. We wish you the very best in your career journey.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Document Workspace Container - Scrollable Document Viewer Box */}
        <div className="w-full flex flex-col rounded-3xl border border-[var(--border)] bg-[#0d0d0d] shadow-2xl overflow-hidden mt-2">
          {/* Document Header Bar */}
          <div className="px-4 sm:px-6 py-3.5 bg-[var(--bg2)] border-b border-[var(--border)] flex items-center justify-between gap-3 sticky top-0 z-20 backdrop-blur-md">
            <div className="flex items-center gap-2 text-xs font-semibold text-zinc-200 uppercase tracking-wider">
              <FileText size={15} className="text-[#00D9FF]" />
              <span>Document Viewer</span>
              <span className="hidden sm:inline text-[15px] font-normal normal-case text-zinc-400">· Official Appointment Letter</span>
            </div>

            <div className="flex items-center gap-3">
              {/* Scroll Hint Badge */}
              <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/[0.04] border border-white/[0.08] text-[15px] text-zinc-400">
                <span className="w-1.5 h-1.5 rounded-full bg-[#00D9FF] animate-pulse" />
                <span>Scroll box to read all pages</span>
              </div>

              {/* Zoom Controls */}
              <div className="flex items-center gap-1.5 bg-[var(--glass)] p-1 rounded-xl border border-[var(--border)]">
                <button 
                  onClick={() => setZoomScale(prev => Math.max(prev - 10, 60))}
                  title="Zoom out"
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-[var(--text-2)] hover:text-white hover:bg-[var(--glass-2)] transition-colors">
                  <ZoomOut size={14} />
                </button>
                <span className="text-[15px] font-mono px-2 text-[var(--text)] select-none">
                  {zoomScale}%
                </span>
                <button 
                  onClick={() => setZoomScale(prev => Math.min(prev + 10, 130))}
                  title="Zoom in"
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-[var(--text-2)] hover:text-white hover:bg-[var(--glass-2)] transition-colors">
                  <ZoomIn size={14} />
                </button>
                <button 
                  onClick={() => setZoomScale(100)}
                  title="Reset zoom"
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-[var(--text-3)] hover:text-white hover:bg-[var(--glass-2)] transition-colors ml-0.5">
                  <RotateCcw size={12} />
                </button>
              </div>
            </div>
          </div>

          {/* Document Viewing Area - Contained scrollable box */}
          <div className="w-full h-[580px] sm:h-[680px] max-h-[75vh] flex justify-center overflow-y-auto overflow-x-auto p-4 sm:p-8 md:p-10 bg-[#09090c] custom-scrollbar select-text relative">
            <div 
              style={{ transform: `scale(${zoomScale / 100})`, transformOrigin: "top center" }}
              className="w-max transition-transform duration-150 drop-shadow-[0_16px_40px_rgba(0,0,0,0.85)] my-2 pb-8 flex flex-col items-center">
              <DocumentPreview documentType={docType} data={documentData} />
            </div>
          </div>
        </div>

        {/* Actions for Pending Offer */}
        {offer.status === "sent" && (
          <div className="relative overflow-hidden bg-[#121418]/90 backdrop-blur-2xl border border-white/[0.08] rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-[0_20px_50px_rgba(0,0,0,0.85),0_0_1px_1px_rgba(255,255,255,0.05)] sticky bottom-4 z-50 flex flex-col items-center w-full">
            {/* Top Cyan Highlight Beam */}
            <div className="absolute top-0 inset-x-0 h-[1.5px] bg-gradient-to-r from-transparent via-[#00D9FF]/40 to-transparent" />

            {/* Prompt Label */}
            <div className="flex items-center gap-2 mb-4 text-xs sm:text-[13.5px] text-zinc-300 font-medium text-center">
              <Sparkles size={14} className="text-[#00D9FF] shrink-0" />
              <span>Please review the details in the appointment letter above and provide your decision:</span>
            </div>

            {/* Buttons Container */}
            <div className="flex flex-col sm:flex-row w-full max-w-2xl gap-3 sm:gap-4">
              {/* Accept Offer Button */}
              <button
                type="button"
                onClick={() => handleRespond("accepted")}
                disabled={submitting}
                className="group relative h-[48px] sm:h-[52px] px-6 rounded-xl sm:rounded-2xl text-[15px] sm:text-[16px] font-extrabold uppercase tracking-wider transition-all duration-200 flex-1 inline-flex items-center justify-center gap-2.5 bg-gradient-to-b from-[#FFFFFF] to-[#E9ECEF] text-[#0A0C10] shadow-[0_2px_14px_rgba(255,255,255,0.15),inset_0_1px_0_rgba(255,255,255,0.95)] hover:shadow-[0_6px_26px_rgba(0,217,255,0.32),inset_0_1px_0_rgba(255,255,255,1)] hover:from-white hover:to-white active:scale-[0.98] select-none cursor-pointer border border-white/80 hover:border-[#00D9FF] outline-none focus-visible:ring-2 focus-visible:ring-[#00D9FF]/50 disabled:opacity-50 disabled:cursor-not-allowed">
                {submitting ? (
                  <>
                    <Loader2 size={18} className="animate-spin text-[#0A0C10]" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={18} className="text-[#0A0C10] group-hover:scale-110 transition-transform duration-200" />
                    <span>Accept Offer</span>
                  </>
                )}
              </button>

              {/* Decline Offer Button */}
              <button
                type="button"
                onClick={() => handleRespond("rejected")}
                disabled={submitting}
                className="group relative h-[48px] sm:h-[52px] px-6 rounded-xl sm:rounded-2xl text-[15px] sm:text-[16px] font-semibold uppercase tracking-wider transition-all duration-200 flex-1 inline-flex items-center justify-center gap-2.5 bg-[#17191E]/90 hover:bg-[#1F2229] active:bg-[#131519] text-[#C4C9D4] hover:text-white border border-[#2B303A] hover:border-red-500/50 hover:shadow-[0_4px_22px_rgba(239,68,68,0.18)] active:scale-[0.98] select-none cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-red-500/30 disabled:opacity-50 disabled:cursor-not-allowed">
                <XCircle size={18} className="text-[#848B98] group-hover:text-red-400 group-hover:scale-110 transition-all duration-200" />
                <span className="group-hover:text-red-300 transition-colors">Decline Offer</span>
              </button>
            </div>
          </div>
        )}
        
      </div>
    </div>
  );
}
