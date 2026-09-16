"use client";

import React, { useState, useEffect, useRef } from "react";
import { DocumentPreview } from "./DocumentPreview";
import { DocumentData, DOC_GROUPS } from "./documentGenerator";
import { Candidate, Employee, EmployeeBond, EmployeeResignation, Offer } from "@/types";
import { useStore } from "@/lib/store";
import { format } from "date-fns";
import { dialog, Select, Input } from "@/components/ui";
import { FilterSelect } from "@/components/candidates/FilterSelect";
import DateTimePicker from "@/components/ui/DateTimePicker";

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 sm:p-6 overflow-hidden animate-in fade-in duration-300">
      <div className="bg-zinc-950 rounded-2xl w-full max-w-[1400px] h-full max-h-[90vh] flex flex-col shadow-[0_0_50px_rgba(0,0,0,0.9)] border border-white/10 relative overflow-hidden">
        
        {/* Glow effect */}
        <div className="absolute top-0 left-1/4 right-1/4 h-[2px] bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent"></div>
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-[100px] bg-indigo-500/10 blur-[80px] pointer-events-none"></div>

        {/* Header */}
        <div className="flex items-center justify-between p-5 px-7 border-b border-white/10 bg-gradient-to-b from-white/[0.05] to-transparent relative z-10">
          <div className="flex flex-col gap-1">
            <h2 className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-zinc-400 tracking-tight">Document Studio</h2>
            <p className="text-xs text-zinc-400 font-medium">Generating for <span className="font-bold text-white">{candidate.name}</span></p>
          </div>
          <button onClick={onClose} className="w-9 h-9 rounded-full flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/10 transition-all hover:rotate-90">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex flex-1 overflow-hidden relative z-10">
          {/* Settings Sidebar */}
          <div className="w-[400px] bg-zinc-900/30 border-r border-white/5 flex flex-col overflow-y-auto custom-scrollbar">
            <div className="p-6 space-y-8">
              
              <div className="space-y-2.5">
                <label className="text-[10px] font-black uppercase tracking-[0.15em] text-zinc-400">Document Type</label>
                <FilterSelect
                  options={DOC_OPTIONS}
                  value={docType}
                  onChange={setDocType}
                  className="bg-black/40 border-white/10"
                />
              </div>

              <div className="space-y-8 pt-6 border-t border-white/5">
                {activeGroups.map((group: string) => (
                  <div key={group} className="space-y-4">
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.8)]"></span>
                      <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400/90">{group} Configuration</h3>
                    </div>
                    <div className="space-y-4">
                      {FIELD_GROUPS[group]?.map(field => {
                        const isDateField = field.key.toLowerCase().includes("date") || field.key === "lastWorkingDay";
                        
                        if (isDateField) {
                          return (
                            <div key={field.key} className="flex flex-col gap-1.5">
                              <label className="text-xs font-semibold text-[#A8A8A8] uppercase tracking-wider">{field.label}</label>
                              <DateTimePicker
                                value={(data as any)[field.key] || ""}
                                onChange={(val) => setData({ ...data, [field.key]: val })}
                                placeholder={`Select ${field.label.toLowerCase()}`}
                              />
                            </div>
                          );
                        }

                        return (
                          <Input
                            key={field.key}
                            label={field.label}
                            name={field.key}
                            value={(data as any)[field.key] || ""}
                            onChange={handleInputChange}
                            placeholder={`Enter ${field.label.toLowerCase()}`}
                          />
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

            </div>
          </div>

          {/* Preview Canvas */}
          <div className="flex-1 bg-black/80 overflow-y-auto p-8 relative flex flex-col items-center gap-6 shadow-[inset_0_0_40px_rgba(0,0,0,0.5)] custom-scrollbar">
             <div className="absolute top-4 left-6 flex items-center gap-2 text-xs font-medium text-zinc-500 bg-zinc-900/50 px-3 py-1.5 rounded-lg border border-white/5 backdrop-blur-md">
               <span className="relative flex h-2 w-2">
                 <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                 <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
               </span>
               Live Preview
             </div>
             <DocumentPreview documentType={docType} data={data} />
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 px-7 border-t border-white/10 bg-gradient-to-t from-black to-zinc-900/50 flex justify-between items-center shrink-0 relative z-10 backdrop-blur-md">
          <div className="text-[11px] font-medium text-zinc-500 flex items-center gap-2">
            <svg className="w-4 h-4 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            {DOC_OPTIONS.find(o => o.value === docType)?.label}
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={onClose} 
              className="px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-zinc-300 hover:text-white bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleDownload}
              disabled={isGenerating}
              className={`px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-white rounded-xl transition-all duration-300 flex items-center gap-2 shadow-[0_0_20px_rgba(99,102,241,0.2)] ${
                isGenerating 
                  ? "bg-indigo-600/50 cursor-wait" 
                  : "bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 hover:shadow-[0_0_30px_rgba(99,102,241,0.4)] hover:-translate-y-0.5"
              }`}
            >
              {isGenerating ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                  Generating...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                  Download PDF
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
