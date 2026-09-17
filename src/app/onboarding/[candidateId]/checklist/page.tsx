import React from "react";
import { createClient } from "@supabase/supabase-js";
import { notFound } from "next/navigation";
import { ChecklistClient } from "./ChecklistClient";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export default async function ChecklistPage({ params }: { params: { candidateId: string } }) {
  const { candidateId } = params;

  const { data: candidate } = await supabaseAdmin
    .from("candidates")
    .select("*")
    .eq("id", candidateId)
    .single();

  if (!candidate) {
    return notFound();
  }

  const { data: offer } = await supabaseAdmin
    .from("offers")
    .select("*")
    .eq("candidateId", candidateId)
    .neq("status", "draft")
    .order("createdAt", { ascending: false })
    .limit(1)
    .single();

  const documentData = {
    candidateName: candidate.name,
    designation: offer?.documentData?.designation || candidate.roleName || "",
    department: offer?.documentData?.department || "",
    officeLocation: offer?.documentData?.officeLocation || "",
    companyName: offer?.documentData?.companyName || "Triple S Production",
    proprietorName: offer?.documentData?.proprietorName || "Ashabuddin",
    letterDate: offer?.documentData?.letterDate || new Date().toISOString().split("T")[0],
    ...offer?.documentData
  };

  return (
    <ChecklistClient
      candidateId={candidateId}
      candidate={candidate}
      offer={offer}
      documentData={documentData}
    />
  );
}
