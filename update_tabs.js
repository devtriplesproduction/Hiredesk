const fs = require('fs');
const file = 'src/components/candidates/CandidateDetail.tsx';
let c = fs.readFileSync(file, 'utf8');

// Replace Document Studio button classes
c = c.replace(/text-blue-300 hover:text-blue-200 bg-blue-600\/15 hover:bg-blue-600\/25 border border-blue-500\/30 hover:border-blue-500\/50/g, 'text-[var(--btn-doc-text)] bg-[var(--btn-doc-bg)] hover:bg-[var(--btn-doc-hover-bg)] border border-[var(--btn-doc-border)] hover:border-[var(--btn-doc-hover-border)]');
c = c.replace(/text-blue-400/g, 'text-[var(--btn-doc-icon)]');

// Replace Tabs
c = c.replace(/"rgba\(167, 139, 250, 0.10\)"/g, '"var(--tab-purple-bg)"');
c = c.replace(/"rgba\(167, 139, 250, 0.45\)"/g, '"var(--tab-purple-border)"');
c = c.replace(/"rgba\(167, 139, 250, 0.16\)"/g, '"var(--tab-purple-hover-bg)"');
c = c.replace(/"rgba\(167, 139, 250, 0.30\)"/g, '"var(--tab-purple-hover-border)"');
c = c.replace(/"#A78BFA"/g, '"var(--tab-purple-text)"');

c = c.replace(/"rgba\(0, 217, 255, 0.10\)"/g, '"var(--tab-cyan-bg)"');
c = c.replace(/"rgba\(0, 217, 255, 0.45\)"/g, '"var(--tab-cyan-border)"');
c = c.replace(/"rgba\(0, 217, 255, 0.16\)"/g, '"var(--tab-cyan-hover-bg)"');
c = c.replace(/"rgba\(0, 217, 255, 0.30\)"/g, '"var(--tab-cyan-hover-border)"');
c = c.replace(/"#00D9FF"/g, '"var(--tab-cyan-text)"');

fs.writeFileSync(file, c);
console.log('CandidateDetail.tsx updated!');
