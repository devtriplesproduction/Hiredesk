import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Bypass RLS for secure server-side operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

function mapEmployeeToCamelCase(emp: any) {
  return {
    id: emp.id,
    candidateId: emp.candidate_id,
    offerId: emp.offer_id,
    name: emp.name,
    email: emp.email,
    phone: emp.phone,
    employmentType: emp.employment_type,
    bondRequirement: emp.bond_requirement,
    status: emp.status,
    createdAt: emp.created_at,
  };
}

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

    // Check if employee already exists for this candidate (idempotent, resilient against duplicate rows)
    const { data: existingList } = await supabaseAdmin
      .from("employees")
      .select("*")
      .eq("candidate_id", candidateId)
      .order("created_at", { ascending: true })
      .limit(1);

    if (existingList && existingList.length > 0) {
      return NextResponse.json({ success: true, employee: mapEmployeeToCamelCase(existingList[0]) });
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

    if (dbError) {
      // If concurrent insert caused unique conflict, fetch and return the created record
      if (dbError.code === "23505") {
        const { data: retryList } = await supabaseAdmin
          .from("employees")
          .select("*")
          .eq("candidate_id", candidateId)
          .order("created_at", { ascending: true })
          .limit(1);
        if (retryList && retryList.length > 0) {
          return NextResponse.json({ success: true, employee: mapEmployeeToCamelCase(retryList[0]) });
        }
      }
      throw dbError;
    }

    // Update candidate status to 'hired'
    await supabaseAdmin.from("candidates").update({ status: "hired" }).eq("id", candidateId);

    return NextResponse.json({ success: true, employee: mapEmployeeToCamelCase(employee) });

  } catch (err: any) {
    console.error("Employee Creation Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
