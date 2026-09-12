import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export async function POST(req: NextRequest, { params }: { params: { candidateId: string } }) {
  if (!supabaseUrl || !supabaseServiceKey) {
    return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
  }

  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
  const candidateId = params.candidateId;

  if (!candidateId) return NextResponse.json({ error: "Missing candidateId" }, { status: 400 });

  try {
    const { phone } = await req.json();

    if (!phone) {
      return NextResponse.json({ error: "Phone number is required" }, { status: 400 });
    }

    // Fetch Candidate
    const { data: candidate, error: candidateError } = await supabaseAdmin
      .from("candidates")
      .select("phone")
      .eq("id", candidateId)
      .single();

    if (candidateError || !candidate) {
      return NextResponse.json({ error: "Candidate not found" }, { status: 404 });
    }

    // Fetch latest non-draft Offer for candidate
    const { data: offer, error: offerError } = await supabaseAdmin
      .from("offers")
      .select("status, sentAt, createdAt")
      .eq("candidateId", candidateId)
      .neq("status", "draft")
      .order("createdAt", { ascending: false })
      .limit(1)
      .single();

    if (offerError || !offer) {
      return NextResponse.json({ error: "No valid offer found" }, { status: 404 });
    }

    if (offer.status !== "sent") {
      return NextResponse.json({ error: "Offer is no longer pending" }, { status: 400 });
    }

    const sentAtTime = offer.sentAt ? new Date(offer.sentAt).getTime() : new Date(offer.createdAt).getTime();
    if (Date.now() - sentAtTime > 24 * 60 * 60 * 1000) {
      return NextResponse.json({ error: "Offer link has expired" }, { status: 403 });
    }

    // Exact normalized match for phone (last 10 digits as a robust way, or exact stripping)
    // The requirement says: "use an exact normalized mobile-number comparison. Remove the current endsWith matching. Normalize formatting/country-code consistently before comparison."
    
    // We will extract just the digits. If they provide country code, we compare just the last 10 digits as "normalized" (since Indian numbers are 10 digits), or we strictly remove non-digits and compare.
    // Wait, the safest strict normalized is stripping everything except digits. But users might enter `91...` and DB has `+91...` or just `...`.
    // Let's strip `+` and leading `0`s, or just take the last 10 digits if length >= 10.
    const normalizedInput = phone.replace(/\D/g, "").slice(-10);
    const normalizedDB = candidate.phone.replace(/\D/g, "").slice(-10);

    if (normalizedInput.length === 10 && normalizedInput === normalizedDB) {
      // Success! Set cookie
      cookies().set(`verified_offer_${candidateId}`, "true", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 60 * 60 * 24, // 24 hours
        path: "/",
        sameSite: "lax"
      });

      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ error: "Incorrect mobile number" }, { status: 401 });
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}
