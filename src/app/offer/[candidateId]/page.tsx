"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Btn, dialog } from "@/components/ui";

export default function CandidateOfferPage() {
  const params = useParams();
  const router = useRouter();
  const candidateId = params.candidateId as string;

  const [loading, setLoading] = useState(true);
  const [candidate, setCandidate] = useState<any>(null);
  const [offer, setOffer] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch(`/api/offers/${candidateId}?t=${Date.now()}`);
        if (!res.ok) throw new Error("Failed to load");
        
        const data = await res.json();
        if (data.candidate) setCandidate(data.candidate);
        if (data.offer) setOffer(data.offer);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    if (candidateId) loadData();
  }, [candidateId]);

  const handleRespond = async (decision: "accepted" | "rejected") => {
    let reason = "";
    if (decision === "rejected") {
      const input = prompt("Please provide a reason for rejecting the offer:");
      if (input === null) return; // User cancelled
      if (!input.trim()) {
        dialog.warning("A reason is required to reject the offer.");
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

      const { status } = await res.json();
      
      await dialog.success(`Offer ${decision} successfully!`);
      
      // Update local state to reflect UI change
      setOffer({ ...offer, status: decision });
      
      if (decision === "accepted") {
        router.push(`/onboarding/${candidateId}`);
      } else {
        window.location.reload();
      }
    } catch (err: any) {
      console.error(err);
      dialog.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-white bg-[#080808]">Loading offer...</div>;
  }

  if (!candidate || !offer || offer.status === "draft") {
    return <div className="min-h-screen flex items-center justify-center text-red-500 bg-[#080808]">Offer not found or not yet available.</div>;
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#080808] text-white">
      <div className="max-w-lg w-full bg-[var(--glass)] border border-[var(--border)] rounded-2xl p-8 shadow-2xl animate-fade-in text-center">
        <h1 className="text-3xl font-bold mb-2">Job Offer</h1>
        <div className="text-lg text-[var(--text-2)] mb-8">
          Congratulations {candidate.name}! Triple S Production has extended you an offer for the <strong className="text-white">{candidate.roleName}</strong> position.
        </div>

        {offer.status === "sent" ? (
          <div className="flex flex-col gap-4">
            <p className="text-sm text-[var(--text-3)] mb-4">Please review the details communicated to you and provide your response below.</p>
            <div className="flex gap-4">
              <Btn 
                onClick={() => handleRespond("accepted")}
                disabled={submitting}
                className="flex-1 py-3 rounded-xl bg-[var(--green)] text-black font-bold hover:brightness-110 disabled:opacity-50 transition-all">
                {submitting ? "Processing..." : "Accept Offer"}
              </Btn>
              <Btn 
                onClick={() => handleRespond("rejected")}
                disabled={submitting}
                className="flex-1 py-3 rounded-xl bg-[var(--red)] text-white font-bold hover:brightness-110 disabled:opacity-50 transition-all">
                Reject Offer
              </Btn>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            {offer.status === "accepted" ? (
              <div className="w-full p-6 rounded-xl bg-[var(--green)]/10 border border-[var(--green)]/20 text-[var(--green)]">
                <span className="text-4xl block mb-2">🎉</span>
                <h3 className="font-bold text-lg">Offer Accepted!</h3>
                <p className="text-sm mt-2 opacity-80">Welcome to the team. You can now proceed to onboarding.</p>
                <Btn 
                  onClick={() => router.push(`/onboarding/${candidateId}`)}
                  className="mt-4 px-4 py-2 bg-[var(--green)] text-black rounded font-bold">
                  Go to Onboarding
                </Btn>
              </div>
            ) : (
              <div className="w-full p-6 rounded-xl bg-[var(--red)]/10 border border-[var(--red)]/20 text-[var(--red)]">
                <span className="text-4xl block mb-2">🚫</span>
                <h3 className="font-bold text-lg">Offer Rejected</h3>
                <p className="text-sm mt-2 opacity-80">Thank you for your time. We wish you the best in your future endeavors.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
