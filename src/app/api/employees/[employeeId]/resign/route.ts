import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Bypass RLS for secure server-side operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(req: NextRequest, { params }: { params: { employeeId: string } }) {
  const employeeId = params.employeeId;
  if (!employeeId) return NextResponse.json({ error: "Missing employeeId" }, { status: 400 });

  try {
    const body = await req.json();
    const { resignationReason, isBreach, breachReason } = body;

    if (!resignationReason) {
      return NextResponse.json({ error: "Resignation reason is required" }, { status: 400 });
    }
    if (isBreach && !breachReason) {
      return NextResponse.json({ error: "Breach reason is required if classified as a breach" }, { status: 400 });
    }

    // Verify employee exists
    const { data: employee } = await supabaseAdmin.from("employees").select("id").eq("id", employeeId).single();
    if (!employee) return NextResponse.json({ error: "Employee not found" }, { status: 404 });

    // Upsert resignation record
    const { data: resignation, error: dbError } = await supabaseAdmin
      .from("employee_resignations")
      .upsert({
        employee_id: employeeId,
        resignation_reason: resignationReason,
        is_breach: !!isBreach,
        breach_reason: isBreach ? breachReason : null
      }, { onConflict: "employee_id" })
      .select()
      .single();

    if (dbError) throw dbError;

    // Update employee status to 'terminated'
    await supabaseAdmin.from("employees").update({ status: "terminated" }).eq("id", employeeId);

    return NextResponse.json({ success: true, resignation });

  } catch (err: any) {
    console.error("Resignation Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
