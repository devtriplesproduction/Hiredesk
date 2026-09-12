"use client";

import React, { useState, useRef } from "react";
import { DocumentPreview } from "./DocumentPreview";
import { DocumentData, DOC_GROUPS } from "./documentGenerator";
import { Candidate, Employee, EmployeeBond, EmployeeResignation } from "@/types";
import { format } from "date-fns";

interface DocumentStudioModalProps {
  candidate: Candidate;
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

export const DocumentStudioModal: React.FC<DocumentStudioModalProps> = ({ candidate, employee, employeeBond, employeeResignation, onClose, defaultStage, defaultDocType }) => {
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

  const [data, setData] = useState<DocumentData>(initialData);

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
      alert("Error generating PDF");
    } finally {
      setIsGenerating(false);
    }
  };

  const activeGroups = DOC_GROUPS[docType as keyof typeof DOC_GROUPS] || ["candidate"];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 sm:p-6 overflow-hidden">
      <div className="bg-white rounded-2xl w-full max-w-[1400px] h-full max-h-[90vh] flex flex-col shadow-2xl border border-gray-100/50">
        
        <div className="flex items-center justify-between p-4 px-6 border-b border-gray-100 bg-white/50 backdrop-blur-sm">
          <div className="flex flex-col">
            <h2 className="text-xl font-semibold tracking-tight text-gray-900">Document Studio</h2>
            <p className="text-sm text-gray-500">Generating for <span className="font-medium text-gray-700">{candidate.name}</span></p>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          <div className="w-[380px] bg-gray-50 border-r border-gray-200 flex flex-col z-10 overflow-y-auto">
            <div className="p-5 space-y-6">
              
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-gray-500">Document Type</label>
                <select 
                  className="w-full bg-white border border-gray-200 text-sm rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all shadow-sm"
                  value={docType}
                  onChange={(e) => setDocType(e.target.value)}
                >
                  <optgroup label="Offer Stage">
                    {DOC_OPTIONS.filter(o => o.stage === "offer").map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </optgroup>
                  <optgroup label="Onboarding">
                    {DOC_OPTIONS.filter(o => o.stage === "onboarding").map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </optgroup>
                  <optgroup label="Exit">
                    {DOC_OPTIONS.filter(o => o.stage === "exit").map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </optgroup>
                </select>
              </div>

              <div className="space-y-6 pt-4 border-t border-gray-200">
                {activeGroups.map((group: string) => (
                  <div key={group} className="space-y-3">
                    <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">{group}</h3>
                    <div className="space-y-3">
                      {FIELD_GROUPS[group]?.map(field => (
                        <div key={field.key} className="space-y-1">
                          <label className="text-xs font-medium text-gray-600">{field.label}</label>
                          <input 
                            type="text" 
                            name={field.key} 
                            value={(data as any)[field.key] || ""} 
                            onChange={handleInputChange}
                            className="w-full bg-white border border-gray-200 text-sm rounded-md px-3 py-2 focus:ring-1 focus:ring-blue-500 outline-none"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

            </div>
          </div>

          <div className="flex-1 bg-gray-200 overflow-y-auto p-8 relative flex flex-col items-center gap-4">
             <DocumentPreview documentType={docType} data={data} />
          </div>
        </div>

        <div className="p-4 px-6 border-t border-gray-100 bg-white flex justify-between items-center shrink-0">
          <div className="text-xs text-gray-500">
            Previewing: {DOC_OPTIONS.find(o => o.value === docType)?.label}
          </div>
          <div className="flex items-center gap-3">
            <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
              Close
            </button>
            <button
              onClick={handleDownload}
              disabled={isGenerating}
              className="px-5 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 disabled:opacity-70 flex items-center gap-2"
            >
              {isGenerating ? "Generating PDF..." : "Download PDF"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
