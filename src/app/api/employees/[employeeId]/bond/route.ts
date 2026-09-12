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
    const { isRequired } = body;

    // Verify employee exists
    const { data: employee } = await supabaseAdmin.from("employees").select("id").eq("id", employeeId).single();
    if (!employee) return NextResponse.json({ error: "Employee not found" }, { status: 404 });

    // Upsert bond record
    const { data: bond, error: dbError } = await supabaseAdmin
      .from("employee_bonds")
      .upsert({
        employee_id: employeeId,
        is_required: !!isRequired,
        amount: "UNKNOWN",
        duration: "UNKNOWN",
        penalty: "UNKNOWN",
        compensation_formula: "UNKNOWN",
        breach_conditions: "UNKNOWN",
        legal_rules: "UNKNOWN"
      }, { onConflict: "employee_id" })
      .select()
      .single();

    if (dbError) throw dbError;

    // Sync bond requirement to employee record just to reflect it quickly if needed, though they are linked via FK
    await supabaseAdmin.from("employees").update({ bond_requirement: isRequired ? "Required" : "Not Required" }).eq("id", employeeId);

    return NextResponse.json({ success: true, bond });

  } catch (err: any) {
    console.error("Bond Update Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
