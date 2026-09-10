import React, { useState, useRef } from "react";
import { DocumentPreview } from "./DocumentPreview";
import { DocumentData } from "./documentGenerator";
import { Candidate } from "@/types";
import { format } from "date-fns";

interface DocumentStudioModalProps {
  candidate: Candidate;
  onClose: () => void;
  // Based on the workflow stage, pre-select the appropriate document group
  defaultStage?: "offer" | "onboarding" | "exit";
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

export const DocumentStudioModal: React.FC<DocumentStudioModalProps> = ({ candidate, onClose, defaultStage }) => {
  // Try to default to the first matching stage
  const defaultOption = DOC_OPTIONS.find(o => o.stage === defaultStage)?.value || "offer-fulltime";
  const [docType, setDocType] = useState<string>(defaultOption);
  const [isGenerating, setIsGenerating] = useState(false);

  // Parse fields from candidate
  const initialData: DocumentData = {
    candidateName: candidate.name,
    designation: candidate.roleName || "[DESIGNATION]",
    department: "[DEPARTMENT]",
    officeLocation: "Satara Office",
    workingHours: "10:00 AM – 8:00 PM",
    dateOfJoining: "[DATE OF JOINING]",
    letterDate: format(new Date(), "dd MMM, yyyy"),
    offerValidityDate: "[OFFER VALIDITY DATE]",
    refNo: `OFFER/${new Date().getFullYear()}/001`,
    probationPeriod: "3 Months",
    internshipEndDate: "[INTERNSHIP END DATE]",
    probationSalary: "[PROBATION MONTHLY SALARY]",
    ctcAmount: "[CTC AMOUNT]",
    monthlyGross: "[MONTHLY GROSS]",
    proprietorName: "[PROPRIETOR NAME]",
    noticePeriod: "1 Month",
    officeAddress: "Rajdhani Towers, Rajwada, Satara",
    hrEmail: "hr@triplesproduction.com",
    hrPhone: "[HR PHONE]",
    website: "www.triplesproduction.com",
    emergencyContact: "[EMERGENCY CONTACT]",
    bankName: "[BANK NAME]",
    accountNumber: "[ACCOUNT NUMBER]",
    ifsc: "[IFSC CODE]",
    pan: "[PAN]",
    bondAmount: "[BOND AMOUNT]",
    bondDurationMonths: "12",
    trainingDescription: "[TRAINING / INVESTMENT PROVIDED]",
    lastWorkingDay: "[LAST WORKING DAY]",
    performanceNote: "performance was satisfactory",
    resignationDate: "[RESIGNATION LETTER DATE]",
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
      // In a real scenario we'd use jspdf/html2canvas, but since they are browser globals
      // in tool.html, we just call window.print for now or implement the pdf logic natively
      alert("Please use the 'Print' dialog and Save as PDF for now, ensuring Background Graphics are checked.");
      window.print();
    } catch (e) {
      console.error(e);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 sm:p-6 overflow-hidden">
      <div className="bg-white rounded-2xl w-full max-w-[1400px] h-full max-h-[90vh] flex flex-col shadow-2xl border border-gray-100/50">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 px-6 border-b border-gray-100 bg-white/50 backdrop-blur-sm">
          <div className="flex flex-col">
            <h2 className="text-xl font-semibold tracking-tight text-gray-900">Document Studio</h2>
            <p className="text-sm text-gray-500">Generating for <span className="font-medium text-gray-700">{candidate.name}</span></p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Layout */}
        <div className="flex flex-1 overflow-hidden">
          
          {/* Sidebar */}
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

              <div className="space-y-4 pt-4 border-t border-gray-200">
                <h3 className="text-sm font-medium text-gray-900">Fields</h3>
                
                {Object.keys(data).map(key => {
                   // simple mapping to form
                   return (
                     <div key={key} className="space-y-1">
                       <label className="text-xs font-medium text-gray-600 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</label>
                       <input 
                         type="text" 
                         name={key} 
                         value={(data as any)[key]} 
                         onChange={handleInputChange}
                         className="w-full bg-white border border-gray-200 text-sm rounded-md px-3 py-2 focus:ring-1 focus:ring-blue-500 outline-none"
                       />
                     </div>
                   );
                })}
              </div>

            </div>
          </div>

          {/* Preview Area */}
          <div className="flex-1 bg-gray-100 overflow-y-auto p-8 relative flex justify-center">
             {/* Note: The preview scales to fit visually, but generates correctly */}
             <div className="bg-white shadow-xl ring-1 ring-black/5" style={{ minWidth: "210mm", minHeight: "297mm", padding: "0" }}>
               <DocumentPreview documentType={docType} data={data} />
             </div>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="p-4 px-6 border-t border-gray-100 bg-white flex justify-between items-center shrink-0">
          <div className="text-xs text-gray-500">
            Previewing: {DOC_OPTIONS.find(o => o.value === docType)?.label}
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-200"
            >
              Close
            </button>
            <button
              onClick={handleDownload}
              disabled={isGenerating}
              className="px-5 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isGenerating ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                  Generating...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                  Print PDF
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
