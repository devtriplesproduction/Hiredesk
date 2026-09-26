import { SOP_ROLES, COMMON_MESSAGES, STATUS_UPDATE_MAP } from "@/lib/hiring-sop";
import type { Candidate, Role } from "@/types";

export interface TemplateDef {
  id: string;
  name: string;
  rawText: string;
}

export function getTemplatesForRole(roleId: string, status?: string, roles: Role[] = []): TemplateDef[] {
  const role = roles.find(r => r.id === roleId);
  const sopPack = role?.sopPack || "custom";
  const roleTemplates = role?.sopTemplates || {};
  
  const baseSOP = SOP_ROLES[sopPack] || SOP_ROLES[roleId] || {};
  const common = COMMON_MESSAGES;
  
  const templates: TemplateDef[] = [];
  
  const requiredKeys = ["first_response", "follow_up", "details_resume_request", "shortlist", "task", "task_reminder", "task_received"];
  
  requiredKeys.forEach(key => {
    const text = roleTemplates[key] || baseSOP[key];
    if (text) {
      templates.push({
        id: key,
        name: key.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
        rawText: text
      });
    }
  });
  
  const earlyStages = ["new", "awaiting_details", "follow_up", "screening", "awaiting_resume_portfolio", "shortlisted", "task_sent"];
  const isEarlyStage = status ? earlyStages.includes(status) : false;

  Object.keys(common).forEach(key => {
    if (isEarlyStage && !["hold", "not_selected"].includes(key)) return;
    
    templates.push({
      id: key,
      name: key.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
      rawText: roleTemplates[key] || common[key]
    });
  });
  
  if (templates.length === 0) {
    if (!["designer", "wp-dev", "editor-in", "dmark-in"].includes(roleId)) {
      templates.unshift({
        id: "first_response",
        name: "First Response",
        rawText: "Hi [Name],\nThank you for applying for the [Role] position at Triple S Production. Please share your location, experience, notice period, and expected CTC."
      });
    }
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
