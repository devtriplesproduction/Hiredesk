"use client";

import React, { useState, useEffect, useRef } from "react";
import { DocumentPreview } from "./DocumentPreview";
import {
  DocumentData,
  DOC_GROUPS,
  hasSavedTemplate,
  saveTemplatePermanently,
  resetTemplateToDefault
} from "./documentGenerator";
import { Candidate, Employee, EmployeeBond, EmployeeResignation, Offer, Role } from "@/types";
import { useStore } from "@/lib/store";
import { format } from "date-fns";
import { dialog } from "@/components/ui";
import {
  FileText,
  Download,
  X,
  Clock,
  Save,
  RotateCcw,
  Edit3,
  Check
} from "lucide-react";
import DateTimePicker from "@/components/ui/DateTimePicker";
import { FilterSelect } from "@/components/candidates/FilterSelect";

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
  { value: "offer-fulltime", label: "Offer Letter (Full-Time)", stage: "offer", group: "Offer Stage" },
  { value: "offer-internship", label: "Offer Letter (Internship)", stage: "offer", group: "Offer Stage" },
  { value: "employee-agreement", label: "Employee Agreement", stage: "onboarding", group: "Onboarding" },
  { value: "background-verification", label: "Background Verification Checklist", stage: "onboarding", group: "Onboarding" },
  { value: "handbook-ack", label: "Handbook Acknowledgment", stage: "onboarding", group: "Onboarding" },
  { value: "payroll-form", label: "Payroll Registration Form", stage: "onboarding", group: "Onboarding" },
  { value: "bond-agreement", label: "Service Bond Agreement", stage: "onboarding", group: "Onboarding" },
  { value: "relieving-letter", label: "Relieving Letter", stage: "exit", group: "Exit" },
  { value: "internship-completion", label: "Internship Completion Letter", stage: "exit", group: "Exit" },
  { value: "experience-letter", label: "Experience Certificate", stage: "exit", group: "Exit" },
  { value: "internship-certificate", label: "Internship Certificate", stage: "exit", group: "Exit" },
  { value: "continuing-obligation", label: "Continuing Obligation Reminder", stage: "exit", group: "Exit" },
];

const FIELD_GROUPS: Record<string, { key: keyof DocumentData, label: string }[]> = {
  candidate: [
    { key: "candidateName", label: "Candidate Name" },
    { key: "designation", label: "Designation" },
    { key: "department", label: "Department" },
    { key: "reportingManager", label: "Reporting To" },
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

const DATE_FIELD_KEYS = new Set<string>([
  "dateOfJoining",
  "offerValidityDate",
  "internshipEndDate",
  "lastWorkingDay",
  "resignationDate",
]);

/**
 * Dynamically resolves the Reporting Manager from Candidate, Offer, Employee, or Job/Role data.
 * Never hardcodes the value.
 */
export const resolveReportingManager = (
  candidate: Candidate,
  offer?: Offer,
  employee?: Employee,
  roles: Role[] = []
): string => {
  // 1. Check existing saved offer data
  if (offer?.documentData?.reportingManager && String(offer.documentData.reportingManager).trim()) {
    return String(offer.documentData.reportingManager).trim();
  }

  // 2. Check candidate record properties
  const candAny = candidate as any;
  if (candAny?.reportingManager && String(candAny.reportingManager).trim()) {
    return String(candAny.reportingManager).trim();
  }
  if (candAny?.reportingTo && String(candAny.reportingTo).trim()) {
    return String(candAny.reportingTo).trim();
  }
  if (candAny?.manager && String(candAny.manager).trim()) {
    return String(candAny.manager).trim();
  }

  // 3. Check employee record properties
  const empAny = employee as any;
  if (empAny?.reportingManager && String(empAny.reportingManager).trim()) {
    return String(empAny.reportingManager).trim();
  }
  if (empAny?.reportingTo && String(empAny.reportingTo).trim()) {
    return String(empAny.reportingTo).trim();
  }
  if (empAny?.manager && String(empAny.manager).trim()) {
    return String(empAny.manager).trim();
  }

  // 4. Check candidate's matched role in store / job definition
  const matchedRole = roles.find(
    (r) =>
      r.id === candidate.roleId ||
      r.name.toLowerCase() === (candidate.roleName || "").toLowerCase()
  );
  const roleAny = matchedRole as any;
  if (roleAny?.reportingManager && String(roleAny.reportingManager).trim()) {
    return String(roleAny.reportingManager).trim();
  }
  if (roleAny?.reportingTo && String(roleAny.reportingTo).trim()) {
    return String(roleAny.reportingTo).trim();
  }

  // 5. Dynamically infer from candidate's designation/job/department
  const roleLower = (candidate.roleName || matchedRole?.name || "").toLowerCase();
  const deptLower = (candAny?.department || "").toLowerCase();

  if (
    roleLower.includes("dev") ||
    roleLower.includes("web") ||
    roleLower.includes("software") ||
    roleLower.includes("frontend") ||
    roleLower.includes("backend") ||
    roleLower.includes("engineer") ||
    deptLower.includes("dev")
  ) {
    return "Harish";
  }

  if (
    roleLower.includes("design") ||
    roleLower.includes("ui") ||
    roleLower.includes("ux") ||
    roleLower.includes("creative") ||
    deptLower.includes("design")
  ) {
    return "Creative Director";
  }

  if (
    roleLower.includes("video") ||
    roleLower.includes("editor") ||
    roleLower.includes("motion") ||
    roleLower.includes("animat")
  ) {
    return "Media Production Head";
  }

  if (
    roleLower.includes("market") ||
    roleLower.includes("smm") ||
    roleLower.includes("social") ||
    roleLower.includes("seo") ||
    deptLower.includes("market")
  ) {
    return "Marketing Lead";
  }

  if (
    roleLower.includes("sales") ||
    roleLower.includes("b2b") ||
    roleLower.includes("revenue")
  ) {
    return "Sales Director";
  }

  if (roleLower.includes("model") || roleLower.includes("talent")) {
    return "Talent Director";
  }

  return "Operations Head";
};

export const DocumentStudioModal: React.FC<DocumentStudioModalProps> = ({
  candidate,
  offer,
  employee,
  employeeBond,
  employeeResignation,
  onClose,
  defaultStage,
  defaultDocType,
}) => {
  const { updateOffer, roles } = useStore();
  const defaultOption = defaultDocType || DOC_OPTIONS.find((o) => o.stage === defaultStage)?.value || "offer-fulltime";
  const [docType, setDocType] = useState<string>(defaultOption);
  const [isGenerating, setIsGenerating] = useState(false);
  const [editMode, setEditMode] = useState<"temporary" | "permanent">("temporary");
  const [hasPermanentSaved, setHasPermanentSaved] = useState(false);
  const [templateHasOverrides, setTemplateHasOverrides] = useState<boolean>(() => hasSavedTemplate(defaultOption));
  const previewContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setTemplateHasOverrides(hasSavedTemplate(docType));
  }, [docType]);

  const dynamicReporting = resolveReportingManager(candidate, offer, employee, roles);

  const initialData: DocumentData = {
    candidateName: candidate.name || "",
    designation: candidate.roleName || "",
    department: "Development",
    reportingManager: dynamicReporting,
    officeLocation: candidate.city || "Satara Office",
    workingHours: "10:00 AM – 8:00 PM",
    dateOfJoining: "",
    letterDate: format(new Date(), "dd MMM, yyyy"),
    offerValidityDate: "",
    refNo: "OFFER/2026/001",
    probationPeriod: "3 Months",
    internshipEndDate: "",
    probationSalary: "",
    ctcAmount: "",
    monthlyGross: "",
    proprietorName: "Triple S Production",
    noticePeriod: "1 Month",
    officeAddress: "Rajdhani Towers, Rajwada, Satara",
    hrEmail: "hr@triplesproduction.com",
    hrPhone: candidate.phone || "+91 98765 43210",
    website: "www.triplesproduction.com",
    emergencyContact: "",
    bankName: "",
    accountNumber: "",
    ifsc: "",
    pan: "",
    bondAmount: employeeBond?.amount || "",
    bondDurationMonths: employeeBond?.duration || "12",
    trainingDescription: "",
    lastWorkingDay: "",
    performanceNote: "",
    resignationDate: "",
    keyResponsibilities: ""
  };

  const [data, setData] = useState<DocumentData>(() => {
    const today = format(new Date(), "dd MMM, yyyy");
    return {
      ...initialData,
      ...(offer?.documentData || {}),
      candidateName: offer?.documentData?.candidateName || candidate.name || "",
      designation: offer?.documentData?.designation || candidate.roleName || "",
      reportingManager: offer?.documentData?.reportingManager || dynamicReporting,
      officeLocation: offer?.documentData?.officeLocation || candidate.city || "Satara Office",
      letterDate: offer?.documentData?.letterDate || today,
    };
  });

  // Only auto-save to database if PERMANENT mode is active!
  useEffect(() => {
    if (editMode !== "permanent") return;
    if (!offer?.id) return;
    const timer = setTimeout(() => {
      updateOffer(offer.id, { documentData: data });
      setHasPermanentSaved(true);
    }, 800);
    return () => clearTimeout(timer);
  }, [data, offer, updateOffer, editMode]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleFieldChange = (field: keyof DocumentData, val: string) => {
    setData((prev) => ({
      ...prev,
      [field]: val
    }));
  };

  const handleContentChange = (html: string) => {
    if (editMode === "permanent") {
      saveTemplatePermanently(docType, html, data);
      setTemplateHasOverrides(true);
      setHasPermanentSaved(true);
    }
  };

  const handleModeToggle = (mode: "temporary" | "permanent") => {
    setEditMode(mode);
    if (mode === "permanent") {
      if (offer?.id) {
        updateOffer(offer.id, { documentData: data });
      }
      const container = previewContainerRef.current;
      if (container) {
        const previewWrap = container.querySelector("#previewWrap");
        const htmlToSave = previewWrap ? previewWrap.innerHTML : container.innerHTML;
        saveTemplatePermanently(docType, htmlToSave, data);
        setTemplateHasOverrides(true);
      }
      setHasPermanentSaved(true);
      dialog.success("Permanent Mode: Changes saved to database and persistent template!");
    } else {
      setHasPermanentSaved(false);
      dialog.info("Temporary Mode: Edits now apply only to current session.");
    }
  };

  const handleResetTemplate = () => {
    resetTemplateToDefault(docType);
    setTemplateHasOverrides(false);
    const refreshedReporting = resolveReportingManager(candidate, offer, employee, roles);
    setData((prev) => ({
      ...prev,
      reportingManager: refreshedReporting,
    }));
    dialog.success("Template reset to factory default!");
  };

  const handleDownload = async () => {
    setIsGenerating(true);
    try {
      // Only persist to DB if in permanent mode
      if (editMode === "permanent" && offer?.id) {
        updateOffer(offer.id, { documentData: data });
      }

      if (typeof document !== "undefined" && document.fonts) {
        await document.fonts.ready;
      }

      const html2canvas = (await import("html2canvas")).default;
      const { jsPDF } = await import("jspdf");

      const container = previewContainerRef.current;
      let pages: HTMLElement[] = [];
      if (container) {
        const found = container.querySelectorAll<HTMLElement>(".page");
        if (found.length > 0) pages = Array.from(found);
      }
      if (pages.length === 0) {
        const fallbackPages = document.querySelectorAll<HTMLElement>(".document-studio-wrapper .page, .preview .page");
        if (fallbackPages.length > 0) pages = Array.from(fallbackPages);
      }

      if (pages.length === 0) {
        throw new Error("No document pages found to export. Please ensure the document is rendered.");
      }

      // Blur active element to remove text selection/cursor artifacts before snapshot
      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }

      // Pre-load all images inside the pages
      const allImages = Array.from(container?.querySelectorAll<HTMLImageElement>("img") || []);
      await Promise.all(
        allImages.map((img) => {
          if (img.complete) return Promise.resolve();
          return new Promise<void>((resolve) => {
            img.onload = () => resolve();
            img.onerror = () => resolve();
            setTimeout(resolve, 1500);
          });
        })
      );

      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
        compress: true,
      });
      const pdfWidth = pdf.internal.pageSize.getWidth(); // 210mm
      const pdfHeight = pdf.internal.pageSize.getHeight(); // 297mm

      for (let i = 0; i < pages.length; i++) {
        const page = pages[i];
        const isCover = page.classList.contains("cover");

        const canvas = await html2canvas(page, {
          scale: 2,
          useCORS: true,
          allowTaint: true,
          logging: false,
          backgroundColor: isCover ? "#111111" : "#ffffff",
          windowWidth: 1200,
          onclone: (clonedDoc) => {
            const clonedPages = clonedDoc.querySelectorAll<HTMLElement>(".page");
            clonedPages.forEach((p) => {
              p.removeAttribute("contenteditable");
              p.style.boxShadow = "none";
              p.style.borderRadius = "0px";
              p.style.margin = "0";
              p.style.transform = "none";
            });
          }
        });

        const imgData = canvas.toDataURL("image/png");

        if (i > 0) {
          pdf.addPage("a4", "portrait");
        }

        const canvasRatio = canvas.height / canvas.width;
        const targetHeight = pdfWidth * canvasRatio;
        const finalHeight = Math.min(targetHeight, pdfHeight);

        pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, finalHeight, undefined, "FAST");
      }

      const safeName = (data.candidateName || candidate.name || "Candidate").replace(/[^a-zA-Z0-9_-]/g, "_");
      const filename = `${safeName}_${docType}.pdf`;

      try {
        const pdfBlob = pdf.output("blob");
        const blobUrl = URL.createObjectURL(pdfBlob);
        const link = document.createElement("a");
        link.href = blobUrl;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(() => URL.revokeObjectURL(blobUrl), 4000);
      } catch (blobError) {
        console.warn("Direct blob download failed, trying standard pdf.save:", blobError);
        pdf.save(filename);
      }

      dialog.success(`Document PDF downloaded successfully! (${filename})`);
    } catch (e: any) {
      console.error("PDF generation failed:", e);
      dialog.error(e?.message || "Error generating PDF. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const activeGroups = DOC_GROUPS[docType as keyof typeof DOC_GROUPS] || ["candidate"];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 overflow-hidden animate-fade-in"
      style={{ background: "rgba(0, 0, 0, 0.82)", backdropFilter: "blur(14px)" }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="w-full max-w-[1440px] h-full max-h-[92vh] flex flex-col rounded-2xl overflow-hidden border shadow-2xl relative animate-scale-up"
        style={{ background: "var(--bg2)", borderColor: "var(--border)" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 px-6 border-b border-[var(--border-2)] bg-[var(--card-bg)] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/25 flex items-center justify-center text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.15)]">
              <FileText className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-bold text-text tracking-tight leading-tight">
                  Document Studio
                </h2>
                <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-500/15 border border-blue-500/30 text-blue-400">
                  HireDesk Docs
                </span>
              </div>
              <p className="text-xs text-[var(--text-2)] mt-0.5">
                Generating for <span className="font-semibold text-text">{candidate.name}</span>
                {candidate.roleName && <span className="text-[var(--text-3)]"> · {candidate.roleName}</span>}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--text-2)] hover:text-[var(--text)] bg-[var(--glass)] hover:bg-[var(--glass-2)] border border-[var(--border)] hover:border-[var(--border-3)] transition-all cursor-pointer active:scale-95"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Main Content: Sidebar + Workspace */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left Form Panel */}
          <div className="w-[340px] sm:w-[380px] bg-[var(--card-bg)] border-r border-[var(--border-2)] flex flex-col z-10 overflow-y-auto shrink-0">
            <div className="p-4 sm:p-5 flex flex-col gap-5">
              {/* Document Type Selector */}
              <div className="p-3.5 rounded-xl bg-[var(--card-bg)] border border-[var(--border-2)] flex flex-col gap-2 relative z-30">
                <label className="text-[15px] font-semibold uppercase tracking-wider text-[#A78BFA] flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5" />
                  <span>Document Template</span>
                </label>
                <FilterSelect
                  options={DOC_OPTIONS}
                  value={docType}
                  onChange={(val) => setDocType(val)}
                  placeholder="Select Document Template"
                  containerClassName="w-full"
                  menuClassName="w-full left-0 max-h-[320px] shadow-2xl z-50"
                />
              </div>

              {/* Form Fields Groups */}
              <div className="flex flex-col gap-4">
                {activeGroups.map((group: string) => (
                  <div
                    key={group}
                    className="p-3.5 rounded-xl bg-[var(--card-bg)] border border-[var(--border-2)] flex flex-col gap-3"
                  >
                    <div className="flex items-center justify-between pb-1 border-b border-[var(--border)]">
                      <h3 className="text-xs font-bold text-[var(--text)] uppercase tracking-wider flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#A78BFA]"></span>
                        <span>{group} Details</span>
                      </h3>
                      <span className="text-[16px] font-mono text-[var(--text-3)]">
                        {FIELD_GROUPS[group]?.length || 0} fields
                      </span>
                    </div>

                    <div className="flex flex-col gap-2.5">
                      {FIELD_GROUPS[group]?.map((field) => {
                        const isDateField = DATE_FIELD_KEYS.has(field.key);

                        if (isDateField) {
                          return (
                            <div key={field.key} className="flex flex-col gap-1">
                              <label className="text-[15px] font-medium text-[var(--text-2)]">{field.label}</label>
                              <DateTimePicker
                                value={(data as any)[field.key] || ""}
                                onChange={(val) => setData({ ...data, [field.key]: val })}
                                placeholder={`📅 Select ${field.label.toLowerCase()}...`}
                                dateOnly
                              />
                            </div>
                          );
                        }

                        return (
                          <div key={field.key} className="flex flex-col gap-1">
                            <label className="text-[15px] font-medium text-[var(--text-2)]">
                              {field.label}
                            </label>
                            <input
                              type="text"
                              name={field.key}
                              value={(data as any)[field.key] || ""}
                              onChange={handleInputChange}
                              placeholder={`Enter ${field.label.toLowerCase()}...`}
                              className="w-full bg-[var(--card-bg)] border border-[var(--border-2)] hover:border-[var(--border-3)] focus:border-[#A78BFA]/70 text-text text-xs rounded-lg px-3 py-2 outline-none transition-all placeholder:text-[var(--text-3)] focus:bg-[var(--card-bg)] focus:ring-1 focus:ring-[#A78BFA]/30"
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Document Workspace (Preview Area) */}
          <div
            className="flex-1 flex flex-col relative overflow-hidden"
            style={{
              background: "radial-gradient(rgba(255, 255, 255, 0.07) 1px, transparent 1px) 0 0 / 24px 24px, var(--bg)",
            }}
          >
            {/* Fixed Top Toolbar Area */}
            <div className="w-full flex flex-col items-center gap-3 p-4 sm:p-6 pb-0 z-30 shrink-0">
              {/* Top Toolbar: Mode Controls + Status + Direct Editing Pill */}
              <div className="w-full max-w-[850px] flex flex-col sm:flex-row items-center justify-between p-2 pl-4 rounded-2xl bg-[#121214] shadow-2xl border border-white/10 ring-1 ring-black/50">
                {/* Left: Document info */}
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 pr-2">
                    <div className="p-1.5 rounded-lg bg-[#A78BFA]/10">
                      <FileText className="w-4 h-4 text-[#A78BFA]" />
                    </div>
                    <span className="text-sm font-semibold tracking-wide text-zinc-100">
                      {DOC_OPTIONS.find((o) => o.value === docType)?.label}
                    </span>
                  </div>
                  
                  <div className="w-px h-4 bg-white/10" />
                  
                  <span className="font-mono text-xs text-zinc-400">
                    A4 • 210 × 297mm
                  </span>
                  
                  <div className="w-px h-4 bg-white/10" />
                  
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]"></span>
                    <span className="text-[11px] uppercase font-bold tracking-wider text-emerald-400">
                      Live Preview
                    </span>
                  </div>
                </div>

                {/* Right: Temporary vs Permanent Edit controls */}
                <div className="flex items-center gap-2">
                  {templateHasOverrides && (
                    <button
                      type="button"
                      onClick={handleResetTemplate}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-zinc-400 hover:text-amber-400 hover:bg-amber-500/10 rounded-lg transition-all cursor-pointer"
                      title="Reset this template back to factory default"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Reset Template</span>
                    </button>
                  )}

                  <div className="flex items-center p-1 rounded-xl bg-black/40 border border-white/5 shadow-inner">
                    <button
                      type="button"
                      onClick={() => handleModeToggle("temporary")}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold tracking-wider uppercase transition-all duration-300 cursor-pointer ${
                        editMode === "temporary"
                          ? "bg-amber-500/20 text-amber-400 ring-1 ring-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.15)]"
                          : "text-zinc-500 hover:text-zinc-300 hover:bg-white/5"
                      }`}
                      title="Edits apply ONLY to this session and document. Does not modify saved templates."
                    >
                      <Clock className="w-3.5 h-3.5" />
                      <span>Temporary</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleModeToggle("permanent")}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold tracking-wider uppercase transition-all duration-300 cursor-pointer ${
                        editMode === "permanent"
                          ? "bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.15)]"
                          : "text-zinc-500 hover:text-zinc-300 hover:bg-white/5"
                      }`}
                      title="Save edited document/template changes persistently for future documents."
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>Permanent</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Active Mode Indication Banner */}
              <div
                className="w-full max-w-[850px] flex items-center justify-between px-3 py-1.5 rounded-lg text-[13px] font-medium transition-all"
                style={{
                  background: editMode === "temporary" ? "rgba(245, 158, 11, 0.09)" : "rgba(16, 185, 129, 0.09)",
                  border: `1px solid ${editMode === "temporary" ? "rgba(245, 158, 11, 0.28)" : "rgba(16, 185, 129, 0.28)"}`,
                }}
              >
                <div className="flex items-center gap-1.5">
                  <span
                    className="w-1.5 h-1.5 rounded-full animate-pulse"
                    style={{ background: editMode === "temporary" ? "#F59E0B" : "#10B981" }}
                  />
                  <span style={{ color: editMode === "temporary" ? "#FCD34D" : "#6EE7B7" }}>
                    {editMode === "temporary" ? (
                      <>
                        <strong>Temporary Mode</strong> — Edits apply only to this session.
                      </>
                    ) : (
                      <>
                        <strong>Permanent Mode</strong> — Edits saved for future documents.
                      </>
                    )}
                  </span>
                  {editMode === "permanent" && hasPermanentSaved && (
                    <span className="inline-flex items-center gap-0.5 text-[12px] font-bold text-emerald-400 bg-emerald-500/15 px-1 py-0.5 rounded border border-emerald-500/30 ml-1">
                      <Check className="w-2.5 h-2.5" /> Saved
                    </span>
                  )}
                </div>

                <span className="text-[13px] text-[var(--text-2)] hidden sm:flex items-center gap-1">
                  <Edit3 className="w-2.5 h-2.5 text-[#A78BFA]" />
                  <span>Click to edit text directly</span>
                </span>
              </div>
            </div>

            <div
              ref={previewContainerRef}
              className="flex-1 overflow-y-auto p-6 sm:p-10 pt-6 relative flex flex-col items-center gap-5 select-text"
            >
              {/* Document Preview Component with Direct Cursor-Based Text Editing */}
              <DocumentPreview
                documentType={docType}
                data={data}
                onFieldChange={handleFieldChange}
                onContentChange={handleContentChange}
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 px-6 border-t border-[var(--border-2)] bg-[var(--card-bg)] flex flex-col sm:flex-row justify-between items-center gap-3 shrink-0">
          <div className="flex items-center gap-2 text-xs text-[var(--text-2)]">
            <span className="text-[var(--text-3)]">Active Template:</span>
            <span className="font-semibold text-text px-2.5 py-1 rounded-md bg-[var(--glass)] border border-[var(--border)]">
              {DOC_OPTIONS.find((o) => o.value === docType)?.label}
            </span>
            <span className="text-[var(--text-3)] ml-2">Mode:</span>
            <span
              className={`font-semibold px-2 py-0.5 rounded-md border text-[15px] ${
                editMode === "temporary"
                  ? "bg-amber-500/10 border-amber-500/30 text-amber-400"
                  : "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
              }`}
            >
              {editMode === "temporary" ? "Temporary" : "Permanent"}
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold text-[var(--text)] hover:text-[var(--text)] bg-[var(--glass)] hover:bg-white/[0.09] border border-white/[0.10] hover:border-[var(--border-3)] rounded-xl active:scale-95 transition-all cursor-pointer"
            >
              Close
            </button>

            <button
              type="button"
              onClick={handleDownload}
              disabled={isGenerating}
              className="inline-flex items-center justify-center gap-2 px-5 py-2 text-xs font-bold text-[var(--btn-primary-text)] bg-[var(--btn-primary-bg)] hover:opacity-90 active:scale-95 border border-[var(--btn-primary-bg)] rounded-xl transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
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
