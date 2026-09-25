const fs = require('fs');

const path = 'E:\\Triple S Production\\Hiredesk-main\\src\\components\\candidates\\CandidateDetail.tsx';
let content = fs.readFileSync(path, 'utf8');

// I will insert a helper block at the top of the Pipeline tab or somewhere visible.
const importSop = `import { STATUS_MAP } from "@/lib/data";\nimport { SOP_ROLES } from "@/lib/hiring-sop";`;
if (!content.includes('STATUS_MAP')) {
  content = content.replace(`import { getEmploymentStatusMeta, scoreCandidateFromText } from "@/lib/data";`,
    `import { getEmploymentStatusMeta, scoreCandidateFromText, STATUS_MAP } from "@/lib/data";`);
}

const uiInjection = `
              {/* --- NEXT STEP HELPER --- */}
              <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-xl flex flex-col gap-1 mb-4">
                <div className="text-blue-400 font-bold text-sm">Next Step Guideline (SOP)</div>
                <div className="text-text-2 text-sm">
                  {(() => {
                    const statusObj = STATUS_MAP.find(s => s.id === c.status);
                    if (statusObj) return statusObj.description;
                    return "Follow SOP for next communication or task.";
                  })()}
                </div>
              </div>
`;

// Insert the UI block at the top of the Pipeline Tab content
content = content.replace(
  /\{activeTab === "pipeline" && \(\s*<div className="flex flex-col gap-6 w-full animate-fade-in-up">/,
  `{activeTab === "pipeline" && (\n            <div className="flex flex-col gap-6 w-full animate-fade-in-up">` + uiInjection
);

fs.writeFileSync(path, content, 'utf8');
console.log('Patched CandidateDetail.tsx with helper UI');
