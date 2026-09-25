const fs = require('fs');

let file = 'E:\\Triple S Production\\Hiredesk-main\\src\\lib\\hiring-sop.ts';
let content = fs.readFileSync(file, 'utf8');

// 1. Add canSetStatus helper
const canSetStatusHelper = `
export function canSetStatus(from: string, to: string): { ok: boolean; reason?: string } {
  if (to === "interview") {
    if (!["task_received", "interview", "final_discussion"].includes(from)) {
      return { ok: false, reason: "SOP: do not move to Interview before Task Review." };
    }
  }
  return { ok: true };
}
`;

if (!content.includes('canSetStatus(')) {
  content += canSetStatusHelper;
}

// 2. Update STATUS_UPDATE_MAP
if (!content.includes('"task_received": "task_received"')) {
  content = content.replace(
    /export const STATUS_UPDATE_MAP: Record<string, string> = {/,
    `export const STATUS_UPDATE_MAP: Record<string, string> = {\n  "task_received": "task_received",`
  );
}

// 3. Update COMMON_MESSAGES interview_invitation Mode
content = content.replace(/Mode: \[Mode\]/g, 'Mode: [In-person / Online]');

fs.writeFileSync(file, content, 'utf8');
console.log('Patched hiring-sop.ts');
