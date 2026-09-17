import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Bypass RLS for secure server-side operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { candidateId, offerId, name, email, phone, employmentType } = body;

    if (!candidateId || !name || !email || !phone || !employmentType) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Verify candidate exists
    const { data: candidate } = await supabaseAdmin.from("candidates").select("id").eq("id", candidateId).single();
    if (!candidate) return NextResponse.json({ error: "Candidate not found" }, { status: 404 });

    // Check if employee already exists for this candidate (idempotent)
    const { data: existing } = await supabaseAdmin
      .from("employees")
      .select("*")
      .eq("candidate_id", candidateId)
      .maybeSingle();

    if (existing) {
      // Return existing employee — map snake_case to camelCase
      const mapped = {
        id: existing.id,
        candidateId: existing.candidate_id,
        offerId: existing.offer_id,
        name: existing.name,
        email: existing.email,
        phone: existing.phone,
        employmentType: existing.employment_type,
        bondRequirement: existing.bond_requirement,
        status: existing.status,
        createdAt: existing.created_at,
      };
      return NextResponse.json({ success: true, employee: mapped });
    }

    // Insert employee record
    const { data: employee, error: dbError } = await supabaseAdmin
      .from("employees")
      .insert({
        candidate_id: candidateId,
        offer_id: offerId || null,
        name: name,
        email: email,
        phone: phone,
        employment_type: employmentType,
        bond_requirement: "UNKNOWN",
        status: "active"
      })
      .select()
      .single();

    if (dbError) throw dbError;

    // Update candidate status to 'hired'
    await supabaseAdmin.from("candidates").update({ status: "hired" }).eq("id", candidateId);

    return NextResponse.json({ success: true, employee });

  } catch (err: any) {
    console.error("Employee Creation Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
