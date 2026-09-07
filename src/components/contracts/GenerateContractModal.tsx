"use client";
import { useState, useEffect } from "react";
import { useStore } from "@/lib/store";
import type { Contract } from "@/types";
import { Btn } from "@/components/ui";

interface Props {
  contract: Contract;
  preselectedCandidateId?: string;
  onClose: () => void;
  onEdit: (c: Contract) => void;
}

export default function GenerateContractModal({ contract, preselectedCandidateId = "", onClose, onEdit }: Props) {
  const { candidates, roles, updateContract } = useStore();

  const [step, setStep] = useState<"details" | "preview">("details");
  const [form, setForm] = useState({
    candidateName: "",
    candidateId: "",
    role: "",
    employmentType: "Full-time",
    startDate: "",
    endDate: "",
    salary: "",
    refNo: `TSP/${new Date().getFullYear()}/${Math.floor(Math.random() * 9000 + 1000)}`,
    noticePeriod: "30 days",
    probation: "90 days",
    location: "Satara",
    additionalTerms: "",
  });

  function set(k: string, v: string) { setForm(prev => ({ ...prev, [k]: v })); }

  // When a candidate is selected, pre-fill fields
  function selectCandidate(id: string) {
    const c = candidates.find(x => x.id === id);
    if (!c) { set("candidateName", ""); set("candidateId", ""); set("role", ""); return; }
    setForm(prev => ({
      ...prev,
      candidateId: id,
      candidateName: c.name,
      role: c.roleName,
      employmentType: c.roleId.includes("in") ? "Intern" : c.roleId.includes("model") || c.roleId.includes("camera") ? "Freelance" : "Full-time",
    }));
  }

  // Auto-fill when a candidate ID is pre-supplied (e.g. from candidate profile)
  useEffect(() => {
    if (preselectedCandidateId) {
      selectCandidate(preselectedCandidateId);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preselectedCandidateId]);

  function generateAndPreview() {
    // Fill the template with form values
    const today = new Date().toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" });
    const logoHtml = "<!--LOGO-->";
    const signHtml = "<!--SIGN-->";

    const filled = contract.body
      .replace(/\[CANDIDATE NAME\]/g, form.candidateName || "[CANDIDATE NAME]")
      .replace(/\[ROLE\]/g, form.role || "[ROLE]")
      .replace(/\[START DATE\]/g, form.startDate ? new Date(form.startDate).toLocaleDateString("en-IN", { year:"numeric", month:"long", day:"numeric" }) : "[START DATE]")
      .replace(/\[END DATE\]/g, form.endDate ? new Date(form.endDate).toLocaleDateString("en-IN", { year:"numeric", month:"long", day:"numeric" }) : "[END DATE]")
      .replace(/\[AMOUNT ₹\]/g, form.salary ? `₹${form.salary}` : "[AMOUNT ₹]")
      .replace(/\[REF NO\]/g, form.refNo)
      .replace(/\[X months\]/g, form.endDate && form.startDate
        ? `${Math.round((new Date(form.endDate).getTime() - new Date(form.startDate).getTime()) / (1000 * 60 * 60 * 24 * 30))} months`
        : "[X months]")
      .replace(/\[NOTICE PERIOD\]/g, form.noticePeriod);

    // Save filled version back to the contract store so editor shows it
    updateContract(contract.id, filled);
    onEdit({ ...contract, body: filled });
  }

  const inputCls = "w-full rounded-xl text-sm px-3.5 py-2.5 outline-none transition-colors placeholder:text-[var(--text-3)]";
  const inputStyle = { background: "var(--glass)", border: "1px solid var(--border)", color: "var(--text)" };
  const labelCls = "block text-xs font-semibold text-[var(--text-3)] uppercase tracking-widest mb-1.5";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.8)", backdropFilter: "blur(8px)" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>

      <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl animate-fade-in"
        style={{ background: "#131313", border: "1px solid var(--border-2)" }}>

        {/* Header */}
        <div className="flex items-center justify-between p-6 pb-4" style={{ borderBottom: "1px solid var(--border)" }}>
          <div>
            <div className="text-xs font-semibold text-[var(--text-3)] uppercase tracking-widest mb-1">Generate Contract</div>
            <div className="text-lg font-bold tracking-tight">{contract.name}</div>
          </div>
          <Btn onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--text-3)] hover:text-white transition-colors"
            style={{ background: "var(--glass-2)", border: "1px solid var(--border)" }}>✕</Btn>
        </div>

        <div className="p-6 flex flex-col gap-4">
          {/* Pick from existing candidates or type manually */}
          <div>
            <label className={labelCls}>Pick from existing candidates (optional)</label>
            <select
              className={inputCls}
              style={{ ...inputStyle, appearance: "none" }}
              value={form.candidateId}
              onChange={e => selectCandidate(e.target.value)}
            >
              <option value="">— Type manually below —</option>
              {candidates.map(c => (
                <option key={c.id} value={c.id}>{c.name} · {c.roleName}</option>
              ))}
            </select>
          </div>

          <div className="h-px" style={{ background: "var(--border)" }} />

          {/* Two columns */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Candidate Full Name *</label>
              <input className={inputCls} style={inputStyle} placeholder="e.g. Priya Sharma"
                value={form.candidateName} onChange={e => set("candidateName", e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>Role / Designation *</label>
              <input className={inputCls} style={inputStyle} placeholder="e.g. Graphic Designer"
                value={form.role} onChange={e => set("role", e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>Employment Type *</label>
              <select className={inputCls} style={{ ...inputStyle, appearance: "none" }}
                value={form.employmentType} onChange={e => set("employmentType", e.target.value)}>
                <option>Full-time</option>
                <option>Part-time</option>
                <option>Intern</option>
                <option>Freelance</option>
                <option>Contract</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>Monthly Salary / Stipend (₹)</label>
              <input className={inputCls} style={inputStyle} placeholder="e.g. 25000"
                value={form.salary} onChange={e => set("salary", e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>Start Date *</label>
              <input type="date" className={inputCls} style={inputStyle}
                value={form.startDate} onChange={e => set("startDate", e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>End Date (if applicable)</label>
              <input type="date" className={inputCls} style={inputStyle}
                value={form.endDate} onChange={e => set("endDate", e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>Notice Period</label>
              <select className={inputCls} style={{ ...inputStyle, appearance: "none" }}
                value={form.noticePeriod} onChange={e => set("noticePeriod", e.target.value)}>
                <option>15 days</option>
                <option>30 days</option>
                <option>45 days</option>
                <option>60 days</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>Work Location</label>
              <input className={inputCls} style={inputStyle} placeholder="e.g. Satara / Remote"
                value={form.location} onChange={e => set("location", e.target.value)} />
            </div>
          </div>

          <div>
            <label className={labelCls}>Reference Number</label>
            <input className={inputCls} style={inputStyle}
              value={form.refNo} onChange={e => set("refNo", e.target.value)} />
          </div>

          <div>
            <label className={labelCls}>Additional Terms (optional)</label>
            <textarea rows={2} className={inputCls} style={inputStyle}
              placeholder="Any specific clauses or additional terms…"
              value={form.additionalTerms} onChange={e => set("additionalTerms", e.target.value)} />
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-6 pt-0">
          <Btn onClick={onClose}
            className="flex-1 py-3 rounded-xl text-sm font-semibold transition-all"
            style={{ background: "var(--glass-2)", border: "1px solid var(--border-2)", color: "var(--text-2)" }}>
            Cancel
          </Btn>
          <Btn
            onClick={generateAndPreview}
            disabled={!form.candidateName.trim() || !form.role.trim() || !form.startDate}
            className="flex-1 py-3 rounded-xl text-sm font-semibold bg-white text-black hover:bg-white/90 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Generate & Edit →
          </Btn>
        </div>
      </div>
    </div>
  );
}
