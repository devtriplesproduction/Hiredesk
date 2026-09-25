import { SOP_ROLES, COMMON_MESSAGES, STATUS_UPDATE_MAP } from "@/lib/hiring-sop";
import type { Candidate } from "@/types";

export interface TemplateDef {
  id: string;
  name: string;
  rawText: string;
}

export function getTemplatesForRole(roleId: string): TemplateDef[] {
  const roleTemplates = SOP_ROLES[roleId] || {};
  const common = COMMON_MESSAGES;
  
  const templates: TemplateDef[] = [];
  
  // Add role-specific templates if they exist
  Object.keys(roleTemplates).forEach(key => {
    templates.push({
      id: key,
      name: key.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
      rawText: roleTemplates[key]
    });
  });
  
  // Add common templates
  Object.keys(common).forEach(key => {
    templates.push({
      id: key,
      name: key.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
      rawText: common[key]
    });
  });
  
  if (Object.keys(roleTemplates).length === 0) {
    templates.push({
      id: "no_sop",
      name: "No SOP found",
      rawText: "No SOP first-response/task for this role."
    });
  }
  
  return templates;
}

export function getDefaultTemplateForStatus(status: string): string {
  const map: Record<string, string> = {
    new: "first_response",
    awaiting_details: "follow_up",
    follow_up: "follow_up",
    screening: "details_resume_request",
    awaiting_resume_portfolio: "details_resume_request",
    shortlisted: "shortlist",
    task_sent: "task",
    task_received: "task_received",
    interview: "interview_invitation",
    final_discussion: "final_discussion",
    selected: "selected",
    hold: "hold",
    rejected: "not_selected",
    offer_sent: "offer_sent",
    offer_accepted: "joining_confirmation",
    joining_confirmed: "joining_confirmation"
  };
  return map[status] || "first_response";
}
