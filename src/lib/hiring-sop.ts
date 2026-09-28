export const SOP_ROLES: Record<string, Record<string, string>> = {
  "designer": {
    "first_response": `Hi [Name],\nThank you for applying for the Graphic Designer position at Triple S Production.`
  }
};

export const COMMON_MESSAGES: Record<string, string> = {};
export const SOP_STATUS_HELPER: Record<string, string> = {};
export const STATUS_UPDATE_MAP: Record<string, string> = {
  "first_response": "awaiting_details",
  "task": "task_sent",
  "interview_invitation": "interview",
  "selected": "selected",
  "not_selected": "rejected",
  "hold": "hold",
  "offer_sent": "offer_sent",
  "joining_confirmation": "joining_confirmed"
};

export function canSetStatus(from: string, to: string, hasInterview: boolean = false): { ok: boolean; reason?: string } {
  if (to === "interview") {
    if (!["task_received", "interview", "final_discussion"].includes(from)) {
      return { ok: false, reason: "SOP: do not move to Interview before Task Review." };
    }
  }
  if (to === "offer_sent" || to === "selected") {
    if (!hasInterview) {
      return { ok: false, reason: "SOP: schedule and complete interview before sending an offer." };
    }
    if (["new", "awaiting_details", "follow_up", "screening", "awaiting_resume_portfolio", "shortlisted", "task_sent", "task_received"].includes(from)) {
      return { ok: false, reason: "SOP: schedule and complete interview before sending an offer." };
    }
  }
  const early = ["new", "awaiting_details", "follow_up", "screening", "awaiting_resume_portfolio", "shortlisted", "task_sent", "task_received"];
  if (["joining_confirmed", "offer_accepted", "hired", "onboarding_requested", "onboarding_review", "onboarding_verified"].includes(to)) {
    if (early.includes(from) || from === "rejected" || from === "hold") {
      return { ok: false, reason: "SOP: complete interview and selection before joining or hire." };
    }
  }
  return { ok: true };
}
