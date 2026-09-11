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

    // Update Offer Status
    const { error: offerError } = await supabase
      .from("offers")
      .update({
        status: decision,
        responded_at: new Date().toISOString()
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
