import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json();
    const ids: string[] = Array.isArray(body.ids)
      ? body.ids.filter((id: any) => typeof id === "string" && id.trim())
      : body.id
      ? [String(body.id)]
      : [];

    if (!ids.length) {
      return NextResponse.json({ error: "No role IDs provided" }, { status: 400 });
    }

    const { error } = await supabaseAdmin.from("roles").delete().in("id", ids);
    if (error) {
      console.error("[Roles API] Delete error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, count: ids.length });
  } catch (err: any) {
    console.error("[Roles API] DELETE exception:", err);
    return NextResponse.json({ error: err?.message || "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, patch } = body;

    if (!id || !patch) {
      return NextResponse.json({ error: "Role ID and patch data required" }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from("roles")
      .update(patch)
      .eq("id", id)
      .select();

    if (error) {
      console.error("[Roles API] Update error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, role: data?.[0] });
  } catch (err: any) {
    console.error("[Roles API] PATCH exception:", err);
    return NextResponse.json({ error: err?.message || "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const roles = Array.isArray(body) ? body : [body];

    const { data, error } = await supabaseAdmin
      .from("roles")
      .upsert(roles)
      .select();

    if (error) {
      console.error("[Roles API] Upsert error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, roles: data });
  } catch (err: any) {
    console.error("[Roles API] POST exception:", err);
    return NextResponse.json({ error: err?.message || "Internal server error" }, { status: 500 });
  }
}
