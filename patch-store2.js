const fs = require('fs');

let file = 'E:\\Triple S Production\\Hiredesk-main\\src\\lib\\store.tsx';
let content = fs.readFileSync(file, 'utf8');

if (!content.includes('import { canSetStatus }')) {
  content = content.replace(
    /import { getEmploymentStatusMeta, computeRoleCounts } from "@\/lib\/data";/,
    `import { getEmploymentStatusMeta, computeRoleCounts } from "@/lib/data";\nimport { canSetStatus } from "@/lib/hiring-sop";`
  );
}

content = content.replace(
  /if \(patch\.status && patch\.status !== candidate\.status\) \{\s*if \(patch\.status === "interview"\) \{\s*if \(!\["shortlisted", "task_received", "task_sent", "screening", "awaiting_resume_portfolio"\]\.includes\(candidate\.status\)\) \{\s*console\.warn\("SOP Violation: Cannot jump directly to interview\."\);\s*return prev; \s*\}\s*\}\s*\}/,
  `if (patch.status && patch.status !== candidate.status) {\n        const check = canSetStatus(candidate.status, patch.status);\n        if (!check.ok) {\n          alert(check.reason);\n          return prev;\n        }\n      }`
);

fs.writeFileSync(file, content, 'utf8');
console.log('Patched store.tsx');
