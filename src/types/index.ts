export type Status = "new" | "awaiting_details" | "follow_up" | "screening" | "awaiting_resume_portfolio" | "shortlisted" | "task_sent" | "task_received" | "interview" | "final_discussion" | "selected" | "hold" | "rejected" | "joining_confirmed" | "offer_sent" | "offer_accepted" | "offer_rejected" | "onboarding_requested" | "onboarding_review" | "onboarding_verified" | "onboarding_rejected" | "hired";

export interface Employee {
  id: string;
  candidateId: string;
  offerId: string | null;
  name: string;
  email: string;
  phone: string;
  employmentType: string;
  bondRequirement: string;
  status: "active" | "terminated" | "on_leave";
  createdAt: string;
}

export interface EmployeeBond {
  id: string;
  employeeId: string;
  isRequired: boolean;
  amount: string;
  duration: string;
  penalty: string;
  compensationFormula: string;
  breachConditions: string;
  legalRules: string;
  createdAt: string;
}

export interface EmployeeResignation {
  id: string;
  employeeId: string;
  resignationReason: string;
  isBreach: boolean;
  breachReason: string | null;
  createdAt: string;
}

export interface CandidateDocument {
  id: string;
  candidateId: string;
  fileName: string;
  filePath: string;
  type: string;
  status: "pending" | "verified" | "rejected";
  createdAt: string;
  updatedAt: string;
}

export interface Offer {
  id: string;
  candidateId: string;
  contractTemplateId: string | null;
  status: "draft" | "sent" | "accepted" | "rejected";
  sentAt: string | null;
  respondedAt: string | null;
  createdAt: string;
  documentData?: any;
}

export interface Interview {
  id: string;
  candidateId: string;
  round: number; // 1 or 2
  scheduledAt: string | null;
  status: "scheduled" | "completed" | "cancelled";
  notes: string;
  decision: "select" | "reject" | "round2_required" | null;
  createdAt: string;
}
export interface ScoreBreakdown {
  skills: number;
  exp: number;
  edu: number;
  completeness: number;
  total: number;
  matchedSkills?: string[];
  missingSkills?: string[];
}

export type EmploymentStatus = "CURRENTLY_WORKING" | "STUDENT_FRESHER" | "NOT_CURRENTLY_WORKING" | "UNKNOWN";

export interface Candidate {
  id: string;
  name: string;
  email: string;
  phone: string;
  roleId: string;
  roleName: string;
  score: ScoreBreakdown;
  status: Status;
  city: string;
  gender: string;
  age: number | null;
  employmentStatus?: EmploymentStatus;
  employmentStatusConfidence?: number;
  currentCompany?: string;
  currentRole?: string;
  employmentStartDate?: string;
  employmentEndDate?: string;
  employmentStatusSource?: string;
  exp: string;
  education: string;
  skills: string[];
  resumeFile: string;
  resumeUrl?: string;   // Public URL to the uploaded PDF on Supabase Storage
  resumeText?: string;  // Raw extracted text for resume preview
  appliedAt: string;
  createdAt: string;
  note: string;
  extractionSource?: string;
  extractionConfidence?: number;
  extractionMetadata?: {
    sourceRankings: Array<{ source: string; name: string; confidence: number }>;
    ocrUsed: boolean;
    transformations?: string[];
    rejectedCandidates?: Array<{ name: string; source: string; reason: string }>;
    firstPageLines?: Array<{
      text: string;
      fontSize: number;
      y: number;
      x: number;
      width: number;
      height?: number;
      fontFamily?: string;
      isBold?: boolean;
    }>;
  };
}

export interface Role {
  id: string;
  name: string;
  type: "Full-time" | "Intern" | "Freelance";
  keywords: string[];
  count: number;
  isActive: boolean;
  reqExp?: string;
  reqEdu?: string;
  sopPack?: string;
  sopTemplates?: Partial<Record<string, string>>;
}

export interface Contract {
  id: string;
  name: string;
  icon: string;
  desc: string;
  type: string;
  body: string;
  logoUrl?: string | null;
  signUrl?: string | null;
}

export type SortKey = "newest" | "oldest" | "score-desc" | "score-asc" | "name-az";

export interface Filters {
  search: string;
  roleId: string;
  status: string;
  city: string;
  gender: string;
  employmentStatus: string;
  ageRange?: string;
  exp: string;
  sort: SortKey;
}
