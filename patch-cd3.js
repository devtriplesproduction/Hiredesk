const fs = require('fs');

const path = 'E:\\Triple S Production\\Hiredesk-main\\src\\components\\candidates\\CandidateDetail.tsx';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(
  /import { getEmploymentStatusMeta, scoreCandidateFromText, STATUS_MAP } from "@\/lib\/data";/,
  `import { getEmploymentStatusMeta, scoreCandidateFromText } from "@/lib/data";`
);

content = content.replace(
  /import { SOP_ROLES } from "@\/lib\/hiring-sop";/,
  `import { SOP_ROLES, SOP_STATUS_HELPER } from "@/lib/hiring-sop";`
);

content = content.replace(
  /const statusObj = STATUS_MAP.find\(s => s.id === c.status\);\s*if \(statusObj\) return statusObj.description;/,
  `const desc = SOP_STATUS_HELPER[c.status];\n                    if (desc) return desc;`
);

fs.writeFileSync(path, content, 'utf8');
console.log('Fixed CandidateDetail.tsx');
