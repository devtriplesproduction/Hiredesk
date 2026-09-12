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

    // Basic normalization for comparison (remove spaces, dashes)
    const normalizedInput = phone.replace(/\D/g, "");
    const normalizedDB = candidate.phone.replace(/\D/g, "");

    // Allow match if they are exact, or if one ends with the other (e.g. missing country code)
    if (normalizedInput === normalizedDB || normalizedDB.endsWith(normalizedInput) || normalizedInput.endsWith(normalizedDB)) {
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
