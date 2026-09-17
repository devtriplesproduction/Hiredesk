import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Service role client bypasses RLS and handles cascading deletion across foreign keys
const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || "").trim();
const supabaseServiceKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "").trim();
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const ids: string[] = Array.isArray(body.ids)
      ? body.ids.filter((id: any) => typeof id === "string" && id.trim())
      : body.id
      ? [String(body.id)]
      : [];

    if (!ids.length) {
      return NextResponse.json({ error: "No candidate IDs provided for deletion" }, { status: 400 });
    }

    console.log(`[Candidate Delete API] Deleting ${ids.length} candidates:`, ids);

    // 1. Find any employees linked to these candidates to clean up bonds & resignations
    const { data: emps, error: empsErr } = await supabaseAdmin
      .from("employees")
      .select("id")
      .in("candidate_id", ids);

    if (empsErr) {
      console.warn("[Candidate Delete API] Error checking employees:", empsErr.message);
    }

    const empIds = (emps || []).map((e: any) => e.id);

    if (empIds.length > 0) {
      // 2. Delete employee resignations
      const { error: resErr } = await supabaseAdmin
        .from("employee_resignations")
        .delete()
        .in("employee_id", empIds);
      if (resErr) console.warn("[Candidate Delete API] Resignations delete warning:", resErr.message);

      // 3. Delete employee bonds
      const { error: bondErr } = await supabaseAdmin
        .from("employee_bonds")
        .delete()
        .in("employee_id", empIds);
      if (bondErr) console.warn("[Candidate Delete API] Bonds delete warning:", bondErr.message);

      // 4. Delete employees
      const { error: empDelErr } = await supabaseAdmin
        .from("employees")
        .delete()
        .in("id", empIds);
      if (empDelErr) console.warn("[Candidate Delete API] Employees delete warning:", empDelErr.message);
    }

    // 5. Delete candidate documents
    const { error: docErr } = await supabaseAdmin
      .from("candidate_documents")
      .delete()
      .in("candidateId", ids);
    if (docErr) console.warn("[Candidate Delete API] Documents delete warning:", docErr.message);

    // 6. Delete offers
    const { error: offErr } = await supabaseAdmin
      .from("offers")
      .delete()
      .in("candidateId", ids);
    if (offErr) console.warn("[Candidate Delete API] Offers delete warning:", offErr.message);

    // 7. Delete interviews
    const { error: intErr } = await supabaseAdmin
      .from("interviews")
      .delete()
      .in("candidateId", ids);
    if (intErr) console.warn("[Candidate Delete API] Interviews delete warning:", intErr.message);

    // 8. Delete candidates from persistent database
    const { error: candErr } = await supabaseAdmin
      .from("candidates")
      .delete()
      .in("id", ids);

    if (candErr) {
      console.error("[Candidate Delete API] Error deleting candidate records:", candErr);
      return NextResponse.json({ error: candErr.message, code: candErr.code }, { status: 500 });
    }

    // 9. Best-effort storage cleanup for resumes
    try {
      for (const id of ids) {
        const { data: files } = await supabaseAdmin.storage.from("resumes").list(id);
        if (files && files.length > 0) {
          const paths = files.map(f => `${id}/${f.name}`);
          await supabaseAdmin.storage.from("resumes").remove(paths);
        }
      }
    } catch (storageErr) {
      console.warn("[Candidate Delete API] Storage cleanup warning:", storageErr);
    }

    console.log(`[Candidate Delete API] Successfully deleted ${ids.length} candidates from database.`);
    return NextResponse.json({ success: true, count: ids.length, ids });
  } catch (err: any) {
    console.error("[Candidate Delete API] Fatal deletion error:", err);
    return NextResponse.json({ error: err?.message || "Internal server error during deletion" }, { status: 500 });
  }
}
