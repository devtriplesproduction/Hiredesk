"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Btn } from "@/components/ui";
import { DocumentPreview } from "@/components/documents/DocumentPreview";
import { DocumentData } from "@/components/documents/documentGenerator";

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
    <div className="min-h-screen p-4 bg-[#080808] text-white flex flex-col items-center">
      <div className="max-w-4xl w-full flex flex-col gap-8 py-8">
        
        {/* Header / Intro */}
        <div className="bg-[var(--glass)] border border-[var(--border)] rounded-2xl p-8 shadow-2xl animate-fade-in text-center">
          <h1 className="text-3xl font-bold mb-2">Job Offer</h1>
          <div className="text-lg text-[var(--text-2)]">
            Congratulations {candidate.name}! Triple S Production has extended you an offer for the <strong className="text-white">{displayRole}</strong> position.
          </div>

          {offer.status === "accepted" && (
            <div className="mt-8 p-6 rounded-xl bg-[var(--green)]/10 border border-[var(--green)]/20 text-[var(--green)] flex flex-col items-center gap-4">
              <div>
                <span className="text-4xl block mb-2">🎉</span>
                <h3 className="font-bold text-lg">Offer Accepted!</h3>
                <p className="text-sm mt-2 opacity-80">Your offer letter will be provided after you join the company. You can also download a copy now.</p>
              </div>
              <div className="flex gap-4">
                <Btn 
                  onClick={() => router.push(`/onboarding/${candidateId}`)}
                  className="mt-2 px-6 py-3 bg-[var(--green)] text-black rounded-xl font-bold hover:brightness-110">
                  Go to Onboarding
                </Btn>
                <Btn 
                  onClick={async () => {
                    try {
                      const html2canvas = (await import("html2canvas")).default;
                      const { jsPDF } = await import("jspdf");

                      const printArea = document.querySelector(".document-studio-wrapper") as HTMLElement;
                      if (!printArea) throw new Error("Document not found");

                      const pages = printArea.querySelectorAll(".page");
                      const pdf = new jsPDF("p", "mm", "a4");

                      for (let i = 0; i < pages.length; i++) {
                        const page = pages[i] as HTMLElement;
                        const canvas = await html2canvas(page, { scale: 2, useCORS: true });
                        const imgData = canvas.toDataURL("image/png");
                        
                        const pdfWidth = pdf.internal.pageSize.getWidth();
                        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
                        
                        if (i > 0) pdf.addPage();
                        pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
                      }
                      
                      pdf.save(`${candidate.name}_Offer_Letter.pdf`);
                    } catch (e) {
                      console.error("Download error", e);
                      alert("Error generating PDF");
                    }
                  }}
                  className="mt-2 px-6 py-3 bg-white text-black rounded-xl font-bold hover:bg-gray-200">
                  Download Offer Letter
                </Btn>
              </div>
            </div>
          )}

          {offer.status === "rejected" && (
            <div className="mt-8 p-6 rounded-xl bg-[var(--red)]/10 border border-[var(--red)]/20 text-[var(--red)]">
              <span className="text-4xl block mb-2">🚫</span>
              <h3 className="font-bold text-lg">Offer Rejected</h3>
              <p className="text-sm mt-2 opacity-80">Thank you for your time. We wish you the best in your future endeavors.</p>
            </div>
          )}
        </div>

        {/* Offer Document Preview */}
        <div className="w-full flex justify-center overflow-auto p-4 md:p-8 rounded-2xl border border-white/10 bg-[#0a0a0a] shadow-inner max-h-[70vh] custom-scrollbar">
          <div className="w-max origin-top transform scale-75 sm:scale-90 md:scale-100 transition-transform">
            <DocumentPreview documentType={docType} data={documentData} />
          </div>
        </div>

        {/* Actions for Pending Offer */}
        {offer.status === "sent" && (
          <div className="bg-[#111111]/90 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-[0_-10px_40px_rgba(0,0,0,0.8)] sticky bottom-4 z-50 flex flex-col items-center">
            <p className="text-sm text-gray-400 mb-4 font-medium">Please review the details above and provide your response below.</p>
            <div className="flex w-full md:w-3/4 gap-4">
              <Btn 
                onClick={() => handleRespond("accepted")}
                disabled={submitting}
                className="flex-1 py-4 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 text-white font-bold shadow-lg shadow-green-900/50 hover:shadow-green-500/30 hover:-translate-y-1 disabled:opacity-50 transition-all text-base tracking-wide border border-green-400/30">
                {submitting ? "Processing..." : "Accept Offer"}
              </Btn>
              <Btn 
                onClick={() => handleRespond("rejected")}
                disabled={submitting}
                className="flex-1 py-4 rounded-xl bg-[#222222] text-gray-300 font-bold hover:bg-[#333333] hover:text-white shadow-lg shadow-black/50 hover:shadow-red-900/20 hover:-translate-y-1 disabled:opacity-50 transition-all text-base tracking-wide border border-gray-700 hover:border-red-500/50">
                Reject Offer
              </Btn>
            </div>
          </div>
        )}
        
      </div>
    </div>
  );
}
