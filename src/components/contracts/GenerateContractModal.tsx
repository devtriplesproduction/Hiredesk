"use client";
import { useState, useEffect } from "react";
import { useStore } from "@/lib/store";
import type { Contract } from "@/types";
import { Btn } from "@/components/ui";
import { builders } from "@/lib/document-templates";

interface Props {
  contract: Contract;
  preselectedCandidateId?: string;
  onClose: () => void;
  onEdit: (c: Contract) => void;
}

const DOC_TITLES: Record<string, string> = {
  "offer-fulltime": "Offer Letter (Full-Time)", "offer-internship": "Offer Letter (Internship)",
  "employee-agreement": "Employee Agreement", "background-verification": "Background Verification Checklist",
  "handbook-ack": "Handbook Acknowledgment", "payroll-form": "Payroll Registration Form",
  "bond-agreement": "Service Bond Agreement", "relieving-letter": "Relieving Letter",
  "internship-completion": "Internship Completion Letter", "experience-letter": "Experience Certificate",
  "internship-certificate": "Internship Certificate", "continuing-obligation": "Continuing Obligation Reminder"
};

const DOC_GROUPS: Record<string, string[]> = {
  "offer-fulltime": ["candidate", "joining", "compensation"],
  "offer-internship": ["candidate", "joining", "compensation"],
  "employee-agreement": ["candidate", "joining", "compensation"],
  "background-verification": ["candidate"],
  "handbook-ack": ["candidate"],
  "payroll-form": ["candidate", "bank"],
  "bond-agreement": ["candidate", "joining", "bond"],
  "relieving-letter": ["candidate", "exit"],
  "internship-completion": ["candidate", "exit"],
  "experience-letter": ["candidate", "exit"],
  "internship-certificate": ["candidate", "exit"],
  "continuing-obligation": ["candidate"]
};

const CONTRACT_TO_DOCTYPE: Record<string, string> = {
  "exp_letter": "experience-letter",
  "rel_letter": "relieving-letter",
  "emp-ft": "offer-fulltime",
  "intern": "offer-internship",
  "freelance": "employee-agreement",
};

export default function GenerateContractModal({ contract, preselectedCandidateId = "", onClose, onEdit }: Props) {
  const { candidates } = useStore();

  const [form, setForm] = useState({
    docType: CONTRACT_TO_DOCTYPE[contract.id] || "offer-fulltime",
    candidateId: "",
    candidateName: "",
    designation: "",
    hrEmail: "hr@triplesproduction.com",
    hrPhone: "",
    website: "www.triplesproduction.com",
    emergencyContact: "",
    department: "Development",
    reportingManager: "",
    officeLocation: "Satara Office",
    workingHours: "10:00 AM – 8:00 PM",
    letterDate: new Date().toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" }),
    refNo: `TSP/${new Date().getFullYear()}/${Math.floor(Math.random() * 9000 + 1000)}`,
    dateOfJoining: "",
    offerValidityDate: "",
    probationPeriod: "3 Months",
    internshipEndDate: "",
    probationSalary: "",
    ctcAmount: "",
    monthlyGross: "",
    bankName: "",
    accountNumber: "",
    ifsc: "",
    pan: "",
    trainingDescription: "",
    bondAmount: "",
    bondDurationMonths: "12",
    resignationDate: "",
    lastWorkingDay: "[LAST WORKING DAY]",
    keyResponsibilities: "software development, code review, and quality assurance tasks",
    performanceNote: "was diligent, professional, and a valued member of the team",
    proprietorName: "",
    noticePeriod: "1 Month",
    officeAddress: "Rajdhani Towers, Rajwada, Satara"
  });

  function set(k: string, v: string) { setForm(prev => ({ ...prev, [k]: v })); }

  function selectCandidate(id: string) {
    const c = candidates.find(x => x.id === id);
    if (!c) { set("candidateName", ""); set("candidateId", ""); set("designation", ""); return; }
    const isDev = (c.roleName || "").toLowerCase().includes("dev");
    const isContent = (c.roleName || "").toLowerCase().includes("content");
    const defaultResp = isDev
      ? "software development, code review, and quality assurance tasks"
      : isContent
      ? "content creation, design, and campaign execution tasks"
      : "assigned tasks and responsibilities";

    setForm(prev => ({
      ...prev,
      candidateId: id,
      candidateName: c.name,
      designation: c.roleName || prev.designation,
      department: isDev ? "Development" : isContent ? "Content" : prev.department,
      keyResponsibilities: defaultResp,
      performanceNote: "was diligent, professional, and a valued member of the team",
      lastWorkingDay: prev.lastWorkingDay || "[LAST WORKING DAY]",
    }));
  }

  useEffect(() => {
    if (preselectedCandidateId) {
      selectCandidate(preselectedCandidateId);
    }
  }, [preselectedCandidateId]);

  function generateAndPreview() {
    const builder = (builders as any)[form.docType];
    const filled = builder ? builder(form) : contract.body;
    onEdit({
      ...contract,
      body: filled,
      name: `${DOC_TITLES[form.docType] || contract.name}${form.candidateName ? ` — ${form.candidateName}` : ""}`,
    });
  }

  const activeGroups = DOC_GROUPS[form.docType] || [];
  const showGroup = (grp: string) => activeGroups.includes(grp);

  const inputCls = "w-full rounded-xl text-sm px-3.5 py-2.5 outline-none transition-colors placeholder:text-[var(--text-3)]";
  const inputStyle = { background: "var(--glass)", border: "1px solid var(--border)", color: "var(--text)" };
  const labelCls = "block text-xs font-semibold text-[var(--text-3)] uppercase tracking-widest mb-1.5 mt-3";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.8)", backdropFilter: "blur(8px)" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>

      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl animate-fade-in"
        style={{ background: "#131313", border: "1px solid var(--border-2)" }}>

        <div className="flex items-center justify-between p-6 pb-4" style={{ borderBottom: "1px solid var(--border)" }}>
          <div>
            <div className="text-xs font-semibold text-[var(--text-3)] uppercase tracking-widest mb-1">Generate Contract</div>
            <div className="text-lg font-bold tracking-tight">Document Studio</div>
          </div>
          <Btn onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--text-3)] hover:text-[var(--text)] transition-colors"
            style={{ background: "var(--glass-2)", border: "1px solid var(--border)" }}>✕</Btn>
        </div>

        <div className="p-6 flex flex-col gap-4">
          <div>
            <label className={labelCls}>Document Type</label>
            <select className={inputCls} style={{ ...inputStyle, appearance: "none" }}
              value={form.docType} onChange={e => set("docType", e.target.value)}>
              {Object.entries(DOC_TITLES).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelCls}>Pick from existing candidates (optional)</label>
            <select className={inputCls} style={{ ...inputStyle, appearance: "none" }}
              value={form.candidateId} onChange={e => selectCandidate(e.target.value)}>
              <option value="">— Type manually below —</option>
              {candidates.map(c => (
                <option key={c.id} value={c.id}>{c.name} · {c.roleName}</option>
              ))}
            </select>
          </div>

          <div className="h-px my-2" style={{ background: "var(--border)" }} />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
            {showGroup("candidate") && <>
              <div><label className={labelCls}>Candidate Name</label><input className={inputCls} style={inputStyle} value={form.candidateName} onChange={e => set("candidateName", e.target.value)} /></div>
              <div><label className={labelCls}>Designation</label><input className={inputCls} style={inputStyle} value={form.designation} onChange={e => set("designation", e.target.value)} /></div>
              <div><label className={labelCls}>Department</label>
                <select className={inputCls} style={{ ...inputStyle, appearance: "none" }} value={form.department} onChange={e => set("department", e.target.value)}>
                  <option value="Development">Development</option>
                  <option value="Content">Content</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div><label className={labelCls}>Reporting Manager</label><input className={inputCls} style={inputStyle} value={form.reportingManager} onChange={e => set("reportingManager", e.target.value)} /></div>
              <div><label className={labelCls}>Office Location</label><input className={inputCls} style={inputStyle} value={form.officeLocation} onChange={e => set("officeLocation", e.target.value)} /></div>
              <div><label className={labelCls}>Working Hours</label><input className={inputCls} style={inputStyle} value={form.workingHours} onChange={e => set("workingHours", e.target.value)} /></div>
              <div><label className={labelCls}>Letter Date</label><input className={inputCls} style={inputStyle} value={form.letterDate} onChange={e => set("letterDate", e.target.value)} /></div>
              <div><label className={labelCls}>Reference No.</label><input className={inputCls} style={inputStyle} value={form.refNo} onChange={e => set("refNo", e.target.value)} /></div>
              <div><label className={labelCls}>Proprietor Name</label><input className={inputCls} style={inputStyle} value={form.proprietorName} onChange={e => set("proprietorName", e.target.value)} /></div>
              <div><label className={labelCls}>Notice Period</label><input className={inputCls} style={inputStyle} value={form.noticePeriod} onChange={e => set("noticePeriod", e.target.value)} /></div>
            </>}

            {showGroup("joining") && <>
              <div><label className={labelCls}>Date of Joining</label><input className={inputCls} style={inputStyle} value={form.dateOfJoining} onChange={e => set("dateOfJoining", e.target.value)} /></div>
              <div><label className={labelCls}>Offer Validity Date</label><input className={inputCls} style={inputStyle} value={form.offerValidityDate} onChange={e => set("offerValidityDate", e.target.value)} /></div>
              <div><label className={labelCls}>Probation Period</label><input className={inputCls} style={inputStyle} value={form.probationPeriod} onChange={e => set("probationPeriod", e.target.value)} /></div>
              {form.docType === "offer-internship" && <div><label className={labelCls}>Internship End Date</label><input className={inputCls} style={inputStyle} value={form.internshipEndDate} onChange={e => set("internshipEndDate", e.target.value)} /></div>}
            </>}

            {showGroup("compensation") && <>
              <div><label className={labelCls}>Probation Salary (₹/Unpaid)</label><input className={inputCls} style={inputStyle} value={form.probationSalary} onChange={e => set("probationSalary", e.target.value)} /></div>
              <div><label className={labelCls}>Annual CTC (₹)</label><input className={inputCls} style={inputStyle} value={form.ctcAmount} onChange={e => set("ctcAmount", e.target.value)} /></div>
              <div><label className={labelCls}>Monthly Gross (₹)</label><input className={inputCls} style={inputStyle} value={form.monthlyGross} onChange={e => set("monthlyGross", e.target.value)} /></div>
            </>}

            {showGroup("bank") && <>
              <div><label className={labelCls}>Bank Name</label><input className={inputCls} style={inputStyle} value={form.bankName} onChange={e => set("bankName", e.target.value)} /></div>
              <div><label className={labelCls}>Account Number</label><input className={inputCls} style={inputStyle} value={form.accountNumber} onChange={e => set("accountNumber", e.target.value)} /></div>
              <div><label className={labelCls}>IFSC Code</label><input className={inputCls} style={inputStyle} value={form.ifsc} onChange={e => set("ifsc", e.target.value)} /></div>
              <div><label className={labelCls}>PAN</label><input className={inputCls} style={inputStyle} value={form.pan} onChange={e => set("pan", e.target.value)} /></div>
            </>}

            {showGroup("bond") && <>
              <div className="col-span-1 sm:col-span-2"><label className={labelCls}>Training Description</label><input className={inputCls} style={inputStyle} value={form.trainingDescription} onChange={e => set("trainingDescription", e.target.value)} /></div>
              <div><label className={labelCls}>Bond Amount (₹)</label><input className={inputCls} style={inputStyle} value={form.bondAmount} onChange={e => set("bondAmount", e.target.value)} /></div>
              <div><label className={labelCls}>Bond Duration (Months)</label><input className={inputCls} style={inputStyle} value={form.bondDurationMonths} onChange={e => set("bondDurationMonths", e.target.value)} /></div>
            </>}

            {showGroup("exit") && <>
              <div><label className={labelCls}>Resignation Date</label><input className={inputCls} style={inputStyle} value={form.resignationDate} onChange={e => set("resignationDate", e.target.value)} /></div>
              <div><label className={labelCls}>Last Working Day</label><input className={inputCls} style={inputStyle} value={form.lastWorkingDay} onChange={e => set("lastWorkingDay", e.target.value)} /></div>
              <div className="col-span-1 sm:col-span-2"><label className={labelCls}>Key Responsibilities</label><input className={inputCls} style={inputStyle} value={form.keyResponsibilities} onChange={e => set("keyResponsibilities", e.target.value)} /></div>
              <div className="col-span-1 sm:col-span-2"><label className={labelCls}>Performance Note</label><input className={inputCls} style={inputStyle} value={form.performanceNote} onChange={e => set("performanceNote", e.target.value)} /></div>
            </>}
          </div>

        </div>

        <div className="flex gap-3 p-6 pt-0">
          <Btn onClick={onClose}
            className="flex-1 py-3 rounded-xl text-sm font-semibold transition-all"
            style={{ background: "var(--glass-2)", border: "1px solid var(--border-2)", color: "var(--text-2)" }}>
            Cancel
          </Btn>
          <Btn
            onClick={generateAndPreview}
            disabled={!form.candidateName.trim()}
            className="flex-1 py-3 rounded-xl text-sm font-semibold bg-accent text-bg2 hover:bg-white/90 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Generate & Edit →
          </Btn>
        </div>
      </div>
    </div>
  );
}
