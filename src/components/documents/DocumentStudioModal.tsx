"use client";

import React, { useState, useEffect, useRef } from "react";
import { DocumentPreview } from "./DocumentPreview";
import { DocumentData, DOC_GROUPS } from "./documentGenerator";
import { Candidate, Employee, EmployeeBond, EmployeeResignation, Offer } from "@/types";
import { useStore } from "@/lib/store";
import { format } from "date-fns";
import { dialog } from "@/components/ui";
import { FileText, Download, X } from "lucide-react";

interface DocumentStudioModalProps {
  candidate: Candidate;
  offer?: Offer;
  employee?: Employee;
  employeeBond?: EmployeeBond;
  employeeResignation?: EmployeeResignation;
  onClose: () => void;
  defaultStage?: "offer" | "onboarding" | "exit";
  defaultDocType?: string;
}

const DOC_OPTIONS = [
  { value: "offer-fulltime", label: "Offer Letter (Full-Time)", stage: "offer" },
  { value: "offer-internship", label: "Offer Letter (Internship)", stage: "offer" },
  { value: "employee-agreement", label: "Employee Agreement", stage: "onboarding" },
  { value: "background-verification", label: "Background Verification Checklist", stage: "onboarding" },
  { value: "handbook-ack", label: "Handbook Acknowledgment", stage: "onboarding" },
  { value: "payroll-form", label: "Payroll Registration Form", stage: "onboarding" },
  { value: "bond-agreement", label: "Service Bond Agreement", stage: "onboarding" },
  { value: "relieving-letter", label: "Relieving Letter", stage: "exit" },
  { value: "internship-completion", label: "Internship Completion Letter", stage: "exit" },
  { value: "experience-letter", label: "Experience Certificate", stage: "exit" },
  { value: "internship-certificate", label: "Internship Certificate", stage: "exit" },
  { value: "continuing-obligation", label: "Continuing Obligation Reminder", stage: "exit" },
];

const FIELD_GROUPS: Record<string, { key: keyof DocumentData, label: string }[]> = {
  candidate: [
    { key: "candidateName", label: "Candidate Name" },
    { key: "designation", label: "Designation" },
    { key: "department", label: "Department" },
    { key: "officeLocation", label: "Office Location" },
    { key: "workingHours", label: "Working Hours" },
  ],
  joining: [
    { key: "dateOfJoining", label: "Date of Joining" },
    { key: "letterDate", label: "Letter Date" },
    { key: "offerValidityDate", label: "Offer Validity Date" },
    { key: "refNo", label: "Reference No" },
    { key: "probationPeriod", label: "Probation Period" },
    { key: "internshipEndDate", label: "Internship End Date" },
    { key: "noticePeriod", label: "Notice Period" },
  ],
  compensation: [
    { key: "probationSalary", label: "Probation Salary" },
    { key: "ctcAmount", label: "CTC Amount" },
    { key: "monthlyGross", label: "Monthly Gross" },
  ],
  bank: [
    { key: "bankName", label: "Bank Name" },
    { key: "accountNumber", label: "Account Number" },
    { key: "ifsc", label: "IFSC Code" },
    { key: "pan", label: "PAN" },
  ],
  bond: [
    { key: "bondAmount", label: "Bond Amount" },
    { key: "bondDurationMonths", label: "Bond Duration (Months)" },
    { key: "trainingDescription", label: "Training Description" },
  ],
  exit: [
    { key: "lastWorkingDay", label: "Last Working Day" },
    { key: "performanceNote", label: "Performance Note" },
    { key: "resignationDate", label: "Resignation Date" },
    { key: "keyResponsibilities", label: "Key Responsibilities" },
  ]
};

export const DocumentStudioModal: React.FC<DocumentStudioModalProps> = ({ candidate, offer, employee, employeeBond, employeeResignation, onClose, defaultStage, defaultDocType }) => {
  const { updateOffer } = useStore();
  const defaultOption = defaultDocType || DOC_OPTIONS.find(o => o.stage === defaultStage)?.value || "offer-fulltime";
  const [docType, setDocType] = useState<string>(defaultOption);
  const [isGenerating, setIsGenerating] = useState(false);

  const initialData: DocumentData = {
    candidateName: candidate.name || "",
    designation: candidate.roleName || "",
    department: "",
    officeLocation: candidate.city || "",
    workingHours: "",
    dateOfJoining: "",
    letterDate: format(new Date(), "dd MMM, yyyy"),
    offerValidityDate: "",
    refNo: "",
    probationPeriod: "",
    internshipEndDate: "",
    probationSalary: "",
    ctcAmount: "",
    monthlyGross: "",
    proprietorName: "",
    noticePeriod: "",
    officeAddress: "",
    hrEmail: "",
    hrPhone: candidate.phone || "",
    website: "",
    emergencyContact: "",
    bankName: "",
    accountNumber: "",
    ifsc: "",
    pan: "",
    bondAmount: employeeBond?.amount || "",
    bondDurationMonths: employeeBond?.duration || "",
    trainingDescription: "",
    lastWorkingDay: "",
    performanceNote: "",
    resignationDate: "",
    keyResponsibilities: ""
  };

  const [data, setData] = useState<DocumentData>(() => ({
    ...initialData,
    ...(offer?.documentData || {})
  }));

  useEffect(() => {
    if (!offer) return;
    const timer = setTimeout(() => {
      updateOffer(offer.id, { documentData: data });
    }, 1000);
    return () => clearTimeout(timer);
  }, [data, offer, updateOffer]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setData({
      ...data,
      [e.target.name]: e.target.value
    });
  };

  const handleDownload = async () => {
    setIsGenerating(true);
    try {
      const html2canvas = (await import("html2canvas")).default;
      const { jsPDF } = await import("jspdf");

      const printArea = document.querySelector(".document-studio-wrapper") as HTMLElement;
      if (!printArea) throw new Error("Document not found");

      const pages = printArea.querySelectorAll(".page");
      const pdf = new jsPDF("p", "mm", "a4");

      for (let i = 0; i < pages.length; i++) {
        const page = pages[i] as HTMLElement;
        const canvas = await html2canvas(page, { scale: 2, useCORS: true });
        const imgData = canvas.toDataURL("image/png");
        
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
        
        if (i > 0) pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      }
      
      pdf.save(`${candidate.name}_${docType}.pdf`);
    } catch (e) {
      console.error(e);
      dialog.error("Error generating PDF");
    } finally {
      setIsGenerating(false);
    }
  };

  const activeGroups = DOC_GROUPS[docType as keyof typeof DOC_GROUPS] || ["candidate"];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 overflow-hidden animate-fade-in"
      style={{ background: "rgba(0, 0, 0, 0.82)", backdropFilter: "blur(14px)" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="w-full max-w-[1440px] h-full max-h-[92vh] flex flex-col rounded-2xl overflow-hidden border shadow-2xl relative animate-scale-up"
        style={{ background: "#0D0E12", borderColor: "#24272D" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 px-6 border-b border-[#24272D] bg-[#111215] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/25 flex items-center justify-center text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.15)]">
              <FileText className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white tracking-tight leading-tight">
                  Document Studio
                </h2>
                <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-500/15 border border-blue-500/30 text-blue-400">
                  HireDesk Docs
                </span>
              </div>
              <p className="text-xs text-[#8B919C] mt-0.5">
                Generating for <span className="font-semibold text-white">{candidate.name}</span>
                {candidate.roleName && <span className="text-[#606060]"> · {candidate.roleName}</span>}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-[#8B919C] hover:text-white bg-white/[0.04] hover:bg-white/[0.10] border border-white/[0.08] hover:border-white/[0.20] transition-all cursor-pointer active:scale-95"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Main Content: Sidebar + Workspace */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left Form Panel */}
          <div className="w-[340px] sm:w-[380px] bg-[#111215] border-r border-[#24272D] flex flex-col z-10 overflow-y-auto shrink-0">
            <div className="p-4 sm:p-5 flex flex-col gap-5">
              {/* Document Type Selector */}
              <div className="p-3.5 rounded-xl bg-[#16171B] border border-[#24272D] flex flex-col gap-2">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-[#A78BFA] flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5" />
                  <span>Document Template</span>
                </label>
                <select
                  className="w-full bg-[#0E0F12] border border-[#2B2F38] hover:border-[#3D424E] focus:border-[#A78BFA] text-[#E6E8EB] text-xs font-semibold rounded-lg px-3 py-2.5 outline-none transition-all cursor-pointer"
                  value={docType}
                  onChange={e => setDocType(e.target.value)}
                >
                  <optgroup label="Offer Stage" className="bg-[#16171B] text-[#8B919C]">
                    {DOC_OPTIONS.filter(o => o.stage === "offer").map(o => (
                      <option key={o.value} value={o.value} className="bg-[#0E0F12] text-white">
                        {o.label}
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="Onboarding" className="bg-[#16171B] text-[#8B919C]">
                    {DOC_OPTIONS.filter(o => o.stage === "onboarding").map(o => (
                      <option key={o.value} value={o.value} className="bg-[#0E0F12] text-white">
                        {o.label}
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="Exit" className="bg-[#16171B] text-[#8B919C]">
                    {DOC_OPTIONS.filter(o => o.stage === "exit").map(o => (
                      <option key={o.value} value={o.value} className="bg-[#0E0F12] text-white">
                        {o.label}
                      </option>
                    ))}
                  </optgroup>
                </select>
              </div>

              {/* Form Fields Groups */}
              <div className="flex flex-col gap-4">
                {activeGroups.map((group: string) => (
                  <div
                    key={group}
                    className="p-3.5 rounded-xl bg-[#16171B] border border-[#24272D] flex flex-col gap-3"
                  >
                    <div className="flex items-center justify-between pb-1 border-b border-white/[0.06]">
                      <h3 className="text-xs font-bold text-[#E6E8EB] uppercase tracking-wider flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#A78BFA]"></span>
                        <span>{group} Details</span>
                      </h3>
                      <span className="text-[10px] font-mono text-[#606060]">
                        {FIELD_GROUPS[group]?.length || 0} fields
                      </span>
                    </div>

                    <div className="flex flex-col gap-2.5">
                      {FIELD_GROUPS[group]?.map(field => (
                        <div key={field.key} className="flex flex-col gap-1">
                          <label className="text-[11px] font-medium text-[#8B919C]">
                            {field.label}
                          </label>
                          <input
                            type="text"
                            name={field.key}
                            value={(data as any)[field.key] || ""}
                            onChange={handleInputChange}
                            placeholder={`Enter ${field.label.toLowerCase()}...`}
                            className="w-full bg-[#0E0F12] border border-[#24272D] hover:border-[#32363E] focus:border-[#A78BFA]/70 text-white text-xs rounded-lg px-3 py-2 outline-none transition-all placeholder:text-[#555] focus:bg-[#121317] focus:ring-1 focus:ring-[#A78BFA]/30"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Document Workspace (Preview Area) */}
          <div
            className="flex-1 overflow-y-auto p-6 sm:p-10 relative flex flex-col items-center gap-5 select-text"
            style={{
              background: "radial-gradient(rgba(255, 255, 255, 0.07) 1px, transparent 1px) 0 0 / 24px 24px, #08090B",
            }}
          >
            {/* Document Header Status Pill */}
            <div className="sticky top-0 z-20 flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-[#16171B]/90 border border-white/[0.10] backdrop-blur-md shadow-xl text-[11px] font-medium text-[#8B919C]">
              <FileText className="w-3.5 h-3.5 text-[#A78BFA]" />
              <span className="text-[#E6E8EB] font-semibold">{DOC_OPTIONS.find(o => o.value === docType)?.label}</span>
              <span className="w-1 h-1 rounded-full bg-[#70747D]"></span>
              <span className="font-mono text-[10px] text-[#70747D]">A4 · 210mm × 297mm</span>
              <span className="w-1 h-1 rounded-full bg-[#70747D]"></span>
              <span className="text-emerald-400 font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                Live Preview
              </span>
            </div>

            <DocumentPreview documentType={docType} data={data} />
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 px-6 border-t border-[#24272D] bg-[#111215] flex flex-col sm:flex-row justify-between items-center gap-3 shrink-0">
          <div className="flex items-center gap-2 text-xs text-[#8B919C]">
            <span className="text-[#606060]">Active Template:</span>
            <span className="font-semibold text-white px-2.5 py-1 rounded-md bg-white/[0.05] border border-white/[0.08]">
              {DOC_OPTIONS.find(o => o.value === docType)?.label}
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold text-[#D1D5DB] hover:text-white bg-white/[0.04] hover:bg-white/[0.09] border border-white/[0.10] hover:border-white/[0.20] rounded-xl active:scale-95 transition-all cursor-pointer"
            >
              Close
            </button>

            <button
              type="button"
              onClick={handleDownload}
              disabled={isGenerating}
              className="inline-flex items-center justify-center gap-2 px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 active:scale-95 border border-blue-400/30 rounded-xl transition-all shadow-[0_0_20px_rgba(37,99,235,0.35)] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {isGenerating ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Generating PDF...</span>
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5" />
                  <span>Download PDF</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
