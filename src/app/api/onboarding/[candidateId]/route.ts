import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Bypass RLS for uploads by candidates using Service Role Key
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export async function GET(req: NextRequest, { params }: { params: { candidateId: string } }) {
  const candidateId = params.candidateId;
  if (!candidateId) return NextResponse.json({ error: "Missing candidateId" }, { status: 400 });

  // Get candidate details
  const { data: candidate } = await supabaseAdmin
    .from("candidates")
    .select("id, name, email, phone, roleName, status")
    .eq("id", candidateId)
    .single();

  if (!candidate) return NextResponse.json({ error: "Candidate not found" }, { status: 404 });

  const { data: documents, error } = await supabaseAdmin
    .from("candidate_documents")
    .select("id, fileName, filePath, type, status, createdAt")
    .eq("candidateId", candidateId)
    .order("createdAt", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Generate temporary preview signed URLs for documents
  const docsWithSignedUrls = await Promise.all(
    (documents || []).map(async (doc) => {
      let previewUrl: string | null = null;
      if (doc.filePath) {
        try {
          const { data: signedData } = await supabaseAdmin.storage
            .from("onboarding-docs")
            .createSignedUrl(doc.filePath, 3600);
          previewUrl = signedData?.signedUrl || null;
        } catch {
          // Ignore signed URL failure
        }
      }
      return {
        ...doc,
        previewUrl,
      };
    })
  );

  return NextResponse.json({
    candidate,
    documents: docsWithSignedUrls,
  });
}

export async function POST(req: NextRequest, { params }: { params: { candidateId: string } }) {
  const candidateId = params.candidateId;
  if (!candidateId) return NextResponse.json({ error: "Missing candidateId" }, { status: 400 });

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const type = formData.get("type") as string || "Other";

    if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });

    const ext = file.name.split(".").pop();
    const fileName = `${candidateId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to Supabase Storage
    const { error: uploadError } = await supabaseAdmin.storage
      .from("onboarding-docs")
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: false
      });

    if (uploadError) throw uploadError;

    // Insert DB record
    const { data: docRecord, error: dbError } = await supabaseAdmin
      .from("candidate_documents")
      .insert({
        candidateId: candidateId,
        fileName: file.name,
        filePath: fileName,
        type: type,
        status: "pending"
      })
      .select()
      .single();

    if (dbError) throw dbError;

    // Auto-update candidate status to review if needed
    await supabaseAdmin.from("candidates").update({ status: "onboarding_review" }).eq("id", candidateId);

    return NextResponse.json({ success: true, document: docRecord });

  } catch (err: any) {
    console.error("Upload Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
