import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    const { offerId, candidateId, decision, reason } = await request.json();

    if (!offerId || !candidateId || !decision) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (decision !== "accepted" && decision !== "rejected") {
      return NextResponse.json({ error: "Invalid decision" }, { status: 400 });
    }

    if (decision === "rejected" && (!reason || reason.trim() === "")) {
      return NextResponse.json({ error: "Rejection reason is required" }, { status: 400 });
    }

    // Fetch existing offer to verify ownership and current status
    const { data: existingOffer, error: fetchOfferError } = await supabase
      .from("offers")
      .select("*")
      .eq("id", offerId)
      .single();

    if (fetchOfferError || !existingOffer) {
      return NextResponse.json({ error: "Offer not found" }, { status: 404 });
    }

    if (existingOffer.candidateId !== candidateId) {
      return NextResponse.json({ error: "Unauthorized: Offer does not belong to this candidate" }, { status: 403 });
    }

    if (existingOffer.status !== "sent") {
      return NextResponse.json({ error: "Offer cannot be modified or has already been responded to" }, { status: 400 });
    }

    // Enforce 24-hour expiry on respond
    const sentAtTime = existingOffer.sentAt ? new Date(existingOffer.sentAt).getTime() : new Date(existingOffer.createdAt).getTime();
    if (Date.now() - sentAtTime > 24 * 60 * 60 * 1000) {
      return NextResponse.json({ error: "Offer link has expired (valid for 24 hours only)" }, { status: 403 });
    }

    // Require mobile verification
    const { cookies } = await import("next/headers");
    const isVerified = cookies().get(`verified_offer_${candidateId}`)?.value === "true";
    
    if (!isVerified) {
      return NextResponse.json({ error: "Mobile verification required to respond to this offer" }, { status: 403 });
    }

    // Update Offer Status
    const { error: offerError } = await supabase
      .from("offers")
      .update({
        status: decision,
        respondedAt: new Date().toISOString()
      })
      .eq("id", offerId);

    if (offerError) throw offerError;

    // Fetch Candidate to update notes if rejected
    const { data: candidate, error: candidateFetchError } = await supabase
      .from("candidates")
      .select("note")
      .eq("id", candidateId)
      .single();

    if (candidateFetchError) throw candidateFetchError;

    const updatedNote = decision === "rejected" && reason
      ? (candidate.note ? candidate.note + `\n\nOffer Rejected Reason: ${reason}` : `Offer Rejected Reason: ${reason}`)
      : candidate.note;

    // Update Candidate Status
    const newStatus = decision === "accepted" ? "offer_accepted" : "offer_rejected";

    const { error: candidateUpdateError } = await supabase
      .from("candidates")
      .update({
        status: newStatus,
        note: updatedNote
      })
      .eq("id", candidateId);

    if (candidateUpdateError) throw candidateUpdateError;

    return NextResponse.json({ success: true, status: newStatus });
  } catch (err: any) {
    console.error("Offer respond API error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
