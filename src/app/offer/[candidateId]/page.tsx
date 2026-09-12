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
  const [submitting, setSubmitting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch(`/api/offers/${candidateId}?t=${Date.now()}`);
        if (!res.ok) throw new Error("Failed to load");
        
        const data = await res.json();
        if (data.candidate) setCandidate(data.candidate);
        if (data.offer) setOffer(data.offer);
      } catch (err) {
        console.error("Failed to load offer data:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [candidateId]);

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
      
      alert(`Offer ${decision} successfully!`);
      
      // Update local state to reflect UI change
      setOffer({ ...offer, status: decision });
      
      if (decision === "accepted") {
        window.location.reload();
      } else {
        window.location.reload();
      }
    } catch (err: any) {
      console.error(err);
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDownload = async () => {
    if (!offer || !candidate) return;

    setIsGenerating(true);
    try {
      // Security Check: Verify with the server before downloading
      const res = await fetch(`/api/offers/${candidateId}?t=${Date.now()}`);
      if (!res.ok) throw new Error("Failed to verify offer status");
      
      const data = await res.json();
      if (data.offer?.status !== "accepted") {
        throw new Error("You can only download the offer letter after accepting it.");
      }

      // Generate PDF
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
    } catch (e: any) {
      console.error(e);
      alert(e.message || "Failed to generate PDF");
    } finally {
      setIsGenerating(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-white bg-[#080808]">Loading offer...</div>;
  }

  if (!candidate || !offer || offer.status === "draft") {
    return <div className="min-h-screen flex items-center justify-center text-red-500 bg-[#080808]">Offer not found or not yet available.</div>;
  }

  const documentData: DocumentData = offer.documentData || {};
  const docType = "offer-fulltime"; 

  return (
    <div className="min-h-screen p-4 bg-[#080808] text-white flex flex-col items-center">
      <div className="max-w-4xl w-full flex flex-col gap-8 py-8">
        
        {/* Header / Intro */}
        <div className="bg-[var(--glass)] border border-[var(--border)] rounded-2xl p-8 shadow-2xl animate-fade-in text-center">
          <h1 className="text-3xl font-bold mb-2">Job Offer</h1>
          <div className="text-lg text-[var(--text-2)]">
            Congratulations {candidate.name}! Triple S Production has extended you an offer for the <strong className="text-white">{candidate.roleName}</strong> position.
          </div>

          {offer.status === "accepted" && (
            <div className="mt-8 p-6 rounded-xl bg-[var(--green)]/10 border border-[var(--green)]/20 text-[var(--green)] flex flex-col items-center gap-4">
              <div>
                <span className="text-4xl block mb-2">🎉</span>
                <h3 className="font-bold text-lg">Offer Accepted!</h3>
                <p className="text-sm mt-2 opacity-80">Welcome to the team! You can download your offer letter below and proceed to onboarding.</p>
              </div>
              <div className="flex gap-4">
                <Btn 
                  onClick={handleDownload}
                  disabled={isGenerating}
                  className="px-6 py-3 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-500 disabled:opacity-50 transition-all flex items-center gap-2">
                  {isGenerating ? "Generating PDF..." : "Download Offer Letter"}
                </Btn>
                <Btn 
                  onClick={() => router.push(`/onboarding/${candidateId}`)}
                  className="px-6 py-3 bg-[var(--green)] text-black rounded-xl font-bold hover:brightness-110">
                  Go to Onboarding
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
        <div className="w-full flex justify-center overflow-x-auto p-4 rounded-xl border border-[var(--border)] bg-black/50">
          <div style={{ transform: "scale(0.8)", transformOrigin: "top center", marginBottom: "-10%" }}>
            <DocumentPreview documentType={docType} data={documentData} />
          </div>
        </div>

        {/* Actions for Pending Offer */}
        {offer.status === "sent" && (
          <div className="bg-[var(--glass)] border border-[var(--border)] rounded-2xl p-8 shadow-2xl animate-fade-in text-center sticky bottom-4">
            <p className="text-sm text-[var(--text-3)] mb-4">Please review the details above and provide your response below.</p>
            <div className="flex gap-4">
              <Btn 
                onClick={() => handleRespond("accepted")}
                disabled={submitting}
                className="flex-1 py-4 rounded-xl bg-[var(--green)] text-black font-bold hover:brightness-110 disabled:opacity-50 transition-all text-lg">
                {submitting ? "Processing..." : "Accept Offer"}
              </Btn>
              <Btn 
                onClick={() => handleRespond("rejected")}
                disabled={submitting}
                className="flex-1 py-4 rounded-xl bg-[var(--red)] text-white font-bold hover:brightness-110 disabled:opacity-50 transition-all text-lg">
                Reject Offer
              </Btn>
            </div>
          </div>
        )}
        
      </div>
    </div>
  );
}
