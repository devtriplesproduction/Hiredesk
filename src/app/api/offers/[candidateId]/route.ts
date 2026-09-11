import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Bypass RLS for retrieving specific candidate offer info securely
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export async function GET(req: NextRequest, { params }: { params: { candidateId: string } }) {
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

  // Fetch latest Offer for candidate
  const { data: offer, error: offerError } = await supabaseAdmin
    .from("offers")
    .select("*")
    .eq("candidateId", candidateId)
    .order("createdAt", { ascending: false })
    .limit(1)
    .single();

  if (offerError && offerError.code !== "PGRST116") {
    return NextResponse.json({ error: offerError.message }, { status: 500 });
  }

  return NextResponse.json({ candidate, offer: offer || null });
}
