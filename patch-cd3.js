const fs = require('fs');

let file = 'E:\\Triple S Production\\Hiredesk-main\\src\\components\\candidates\\CandidateDetail.tsx';
let content = fs.readFileSync(file, 'utf8');

if (!content.includes('import { SOP_STATUS_HELPER }')) {
  content = content.replace(
    /import \{ getEmploymentStatusMeta \} from "@\/lib\/data";/,
    `import { getEmploymentStatusMeta } from "@/lib/data";\nimport { SOP_STATUS_HELPER } from "@/lib/hiring-sop";`
  );
}

if (!content.includes('SOP_STATUS_HELPER[c.status]')) {
  content = content.replace(
    /<StatusBadge status=\{c\.status\} \/>/,
    `<StatusBadge status={c.status} />\n                <span className="text-xs font-semibold text-[var(--text-3)] ml-2">Next: {SOP_STATUS_HELPER[c.status] || ""}</span>`
  );
}

fs.writeFileSync(file, content, 'utf8');
console.log('Patched CandidateDetail.tsx');
