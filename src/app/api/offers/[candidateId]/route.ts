import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export async function GET(req: NextRequest, { params }: { params: { candidateId: string } }) {
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error("Server misconfiguration: missing Supabase URL or Service Role Key");
    return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
  }

  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

  const candidateId = params.candidateId;
  if (!candidateId) return NextResponse.json({ error: "Missing candidateId" }, { status: 400 });

  // Fetch Candidate
  const { data: candidate, error: candidateError } = await supabaseAdmin
    .from("candidates")
    .select("id, name, roleName, status")
    .eq("id", candidateId)
    .single();

  if (candidateError || !candidate) {
    return NextResponse.json({ error: "Candidate not found" }, { status: 404 });
  }

  // Fetch latest non-draft Offer for candidate
  const { data: offer, error: offerError } = await supabaseAdmin
    .from("offers")
    .select("*")
    .eq("candidateId", candidateId)
    .neq("status", "draft")
    .order("createdAt", { ascending: false })
    .limit(1)
    .single();

  if (offerError && offerError.code !== "PGRST116") {
    return NextResponse.json({ error: offerError.message }, { status: 500 });
  }

  if (!offer) {
    return NextResponse.json({ error: "Offer not found or not yet available" }, { status: 404 });
  }

  if (offer.candidateId !== candidate.id) {
    return NextResponse.json({ error: "Offer does not belong to this candidate" }, { status: 403 });
  }

  return NextResponse.json({ candidate, offer });
}
