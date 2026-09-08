"use client";
import { useState, useEffect } from "react";
import { Btn } from "@/components/ui";

export default function OnboardingPage({ params }: { params: { candidateId: string } }) {
  const { candidateId } = params;
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [docType, setDocType] = useState("ID / Passport");

  useEffect(() => {
    fetchDocuments();
  }, [candidateId]);

  async function fetchDocuments() {
    setLoading(true);
    try {
      const res = await fetch(`/api/onboarding/${candidateId}`);
      if (res.ok) {
        const data = await res.json();
        setDocuments(data.documents || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files || !e.target.files[0]) return;
    const file = e.target.files[0];

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("type", docType);

    try {
      const res = await fetch(`/api/onboarding/${candidateId}`, {
        method: "POST",
        body: formData,
      });
      if (res.ok) {
        await fetchDocuments();
      } else {
        alert("Upload failed. Please try again.");
      }
    } catch (err) {
      alert("Network error.");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  return (
    <div className="min-h-screen p-6 sm:p-12 bg-[#020202] text-[var(--text)] flex flex-col items-center">
      <div className="w-full max-w-2xl">
        <h1 className="text-3xl font-bold mb-2">Candidate Onboarding</h1>
        <p className="text-[var(--text-2)] mb-8">Please securely upload your requested onboarding documents.</p>

        <div className="bg-[var(--glass)] border border-[var(--border)] rounded-2xl p-6 mb-8">
          <h2 className="text-lg font-semibold mb-4">Upload New Document</h2>
          <div className="flex flex-col gap-4">
            <div>
              <label className="text-xs text-[var(--text-2)] uppercase font-semibold mb-1 block">Document Type</label>
              <select 
                value={docType} onChange={e => setDocType(e.target.value)}
                className="w-full bg-[var(--glass-2)] border border-[var(--border)] rounded-lg p-3 text-sm outline-none"
              >
                <option>ID / Passport</option>
                <option>Degree / Certificate</option>
                <option>Signed Contract</option>
                <option>Tax Form</option>
                <option>Other</option>
              </select>
            </div>
            
            <div className="relative">
              <input 
                type="file" 
                onChange={handleUpload} 
                disabled={uploading}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <div className="border-2 border-dashed border-[var(--border-2)] hover:border-white/30 hover:bg-[var(--glass-2)] rounded-lg p-8 text-center transition-all bg-[var(--glass)]">
                {uploading ? (
                  <div className="animate-pulse font-bold text-[var(--primary)]">Uploading securely...</div>
                ) : (
                  <div>
                    <div className="text-3xl mb-2">📄</div>
                    <div className="font-bold">Tap or drag to upload</div>
                    <div className="text-xs text-[var(--text-3)] mt-1">PDF, JPG, or PNG (Max 5MB)</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-4">Your Uploaded Documents</h2>
          {loading ? (
            <div className="text-[var(--text-3)] text-sm animate-pulse">Loading...</div>
          ) : documents.length === 0 ? (
            <div className="text-[var(--text-3)] text-sm italic">No documents uploaded yet.</div>
          ) : (
            <div className="flex flex-col gap-3">
              {documents.map(doc => (
                <div key={doc.id} className="flex items-center justify-between bg-[var(--glass)] border border-[var(--border)] rounded-lg p-4">
                  <div>
                    <div className="font-medium text-sm">{doc.fileName}</div>
                    <div className="text-xs text-[var(--text-2)] mt-0.5">{doc.type}</div>
                  </div>
                  <div>
                    {doc.status === "pending" && <span className="text-xs font-bold text-[#ffab40] bg-[#ffab40]/10 px-2 py-1 rounded border border-[#ffab40]/20">In Review</span>}
                    {doc.status === "verified" && <span className="text-xs font-bold text-[#00e676] bg-[#00e676]/10 px-2 py-1 rounded border border-[#00e676]/20">Verified</span>}
                    {doc.status === "rejected" && <span className="text-xs font-bold text-[#ff3d00] bg-[#ff3d00]/10 px-2 py-1 rounded border border-[#ff3d00]/20">Rejected</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
