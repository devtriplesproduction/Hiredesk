const fs = require('fs');

function replaceInFile(path, oldText, newText) {
  let content = fs.readFileSync(path, 'utf8');
  content = content.split(oldText).join(newText);
  fs.writeFileSync(path, content, 'utf8');
}

// 1. CandidateDetail.tsx (add hired to STATUSES, remove "hired" from blocklist in FiltersBar)
replaceInFile(
  'E:\\Triple S Production\\Hiredesk-main\\src\\components\\candidates\\CandidateDetail.tsx',
  '"onboarding_rejected"];',
  '"onboarding_rejected", "hired"];'
);

// 2. FiltersBar.tsx
let fBar = fs.readFileSync('E:\\Triple S Production\\Hiredesk-main\\src\\components\\candidates\\FiltersBar.tsx', 'utf8');
// add hired
if (!fBar.includes('{ value: "hired"')) {
  fBar = fBar.replace(
    /\{ value: "onboarding_rejected", label: "Onboarding Rejected" \},/,
    '{ value: "onboarding_rejected", label: "Onboarding Rejected" },\n    { value: "hired", label: "Hired" },'
  );
}
// remove the blocklist for "hired"
fBar = fBar.replace(/if \(filters\.status === "hired"\) \{[^}]+}/g, '');
fs.writeFileSync('E:\\Triple S Production\\Hiredesk-main\\src\\components\\candidates\\FiltersBar.tsx', fBar, 'utf8');


// 3. modal-utils.ts
let mUtils = fs.readFileSync('E:\\Triple S Production\\Hiredesk-main\\src\\lib\\modal-utils.ts', 'utf8');
const oldDefault = mUtils.match(/export function getDefaultTemplateForStatus[^}]+}/)[0];
const newDefault = `export function getDefaultTemplateForStatus(status: string): string {
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
}`;
mUtils = mUtils.replace(oldDefault, newDefault);
fs.writeFileSync('E:\\Triple S Production\\Hiredesk-main\\src\\lib\\modal-utils.ts', mUtils, 'utf8');

// 4. Update status after send checkbox
['WhatsAppModal.tsx', 'EmailModal.tsx'].forEach(file => {
  let path = 'E:\\Triple S Production\\Hiredesk-main\\src\\components\\candidates\\' + file;
  let code = fs.readFileSync(path, 'utf8');
  if (!code.includes('const [updateStatusAfterSend, setUpdateStatusAfterSend] = useState(true);')) {
    code = code.replace(
      'const [template, setTemplate]', 
      'const [updateStatusAfterSend, setUpdateStatusAfterSend] = useState(true);\n  const [template, setTemplate]'
    );
    
    // Add checkbox before the Send button
    code = code.replace(
      /(<button[^>]+onClick=\{handleSend\}[^>]*>)/,
      `<div className="flex items-center gap-2 mr-auto">\n              <input type="checkbox" id="updateStatus\${c.id}" checked={updateStatusAfterSend} onChange={(e) => setUpdateStatusAfterSend(e.target.checked)} className="rounded border-[var(--border-2)] bg-[var(--glass-2)] cursor-pointer" />\n              <label htmlFor="updateStatus\${c.id}" className="text-xs text-[var(--text-2)] cursor-pointer select-none">Update status after send</label>\n            </div>\n            $1`
    );

    // Conditionally update status
    code = code.replace(
      /if \(newStatus && updateCandidate && candidate\.status !== newStatus\)/,
      `if (updateStatusAfterSend && newStatus && updateCandidate && candidate.status !== newStatus)`
    );
  }
  fs.writeFileSync(path, code, 'utf8');
});

console.log("Patched other files");
