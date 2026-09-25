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
  switch (status) {
    case "new": return "first_response";
    case "awaiting_details": return "follow_up";
    case "screening": return "details_resume_request";
    case "shortlisted": return "shortlist";
    case "task_sent": return "task_reminder";
    case "task_received": return "interview_invitation";
    case "interview": return "final_discussion";
    case "selected": return "offer_sent";
    case "offer_accepted": return "joining_confirmation";
    default: return "first_response";
  }
}
