const fs = require('fs');

const cssPath = 'src/app/globals.css';
let css = fs.readFileSync(cssPath, 'utf8');

const lightBadgeOverrides = `
/* Light Theme Badge Overrides */
[data-theme="light"] .score-hi { background: rgba(22, 163, 74, 0.1); color: #16A34A; border-color: rgba(22, 163, 74, 0.3); }
[data-theme="light"] .score-mid { background: rgba(217, 119, 6, 0.1); color: #D97706; border-color: rgba(217, 119, 6, 0.3); }
[data-theme="light"] .score-lo { background: rgba(220, 38, 38, 0.1); color: #DC2626; border-color: rgba(220, 38, 38, 0.3); }

[data-theme="light"] .status-new { background: rgba(2, 132, 199, 0.1); color: #0284C7; border-color: rgba(2, 132, 199, 0.3); }
[data-theme="light"] .status-review { background: rgba(217, 119, 6, 0.1); color: #D97706; border-color: rgba(217, 119, 6, 0.3); }
[data-theme="light"] .status-shortlisted { background: rgba(2, 132, 199, 0.1); color: #0284C7; border-color: rgba(2, 132, 199, 0.3); }
[data-theme="light"] .status-interview_1 { background: rgba(124, 58, 237, 0.1); color: #7C3AED; border-color: rgba(124, 58, 237, 0.3); }
[data-theme="light"] .status-interview_2 { background: rgba(109, 40, 217, 0.1); color: #6D28D9; border-color: rgba(109, 40, 217, 0.3); }
[data-theme="light"] .status-approved { background: rgba(22, 163, 74, 0.1); color: #16A34A; border-color: rgba(22, 163, 74, 0.3); }
[data-theme="light"] .status-offer { background: rgba(234, 88, 12, 0.1); color: #EA580C; border-color: rgba(234, 88, 12, 0.3); }
[data-theme="light"] .status-offer_sent { background: rgba(37, 99, 235, 0.1); color: #2563EB; border-color: rgba(37, 99, 235, 0.3); }
[data-theme="light"] .status-offer_accepted { background: rgba(22, 163, 74, 0.1); color: #16A34A; border-color: rgba(22, 163, 74, 0.3); }
[data-theme="light"] .status-offer_rejected { background: rgba(220, 38, 38, 0.1); color: #DC2626; border-color: rgba(220, 38, 38, 0.3); }
[data-theme="light"] .status-onboarding_requested { background: rgba(202, 138, 4, 0.1); color: #CA8A04; border-color: rgba(202, 138, 4, 0.3); }
[data-theme="light"] .status-onboarding_review { background: rgba(202, 138, 4, 0.1); color: #CA8A04; border-color: rgba(202, 138, 4, 0.3); }
[data-theme="light"] .status-onboarding_verified { background: rgba(22, 163, 74, 0.1); color: #16A34A; border-color: rgba(22, 163, 74, 0.3); }
[data-theme="light"] .status-onboarding_rejected { background: rgba(220, 38, 38, 0.1); color: #DC2626; border-color: rgba(220, 38, 38, 0.3); }
[data-theme="light"] .status-hired { background: rgba(22, 163, 74, 0.1); color: #16A34A; border-color: rgba(22, 163, 74, 0.3); }
[data-theme="light"] .status-rejected { background: rgba(220, 38, 38, 0.1); color: #DC2626; border-color: rgba(220, 38, 38, 0.3); }
`;

if (!css.includes('Light Theme Badge Overrides')) {
  css += lightBadgeOverrides;
}

// Add variables for tabs and doc studio button
const themeVars = `
:root {
  --tab-purple-text: #A78BFA;
  --tab-purple-bg: rgba(167, 139, 250, 0.10);
  --tab-purple-border: rgba(167, 139, 250, 0.45);
  --tab-purple-hover-bg: rgba(167, 139, 250, 0.16);
  --tab-purple-hover-border: rgba(167, 139, 250, 0.30);

  --tab-cyan-text: #00D9FF;
  --tab-cyan-bg: rgba(0, 217, 255, 0.10);
  --tab-cyan-border: rgba(0, 217, 255, 0.45);
  --tab-cyan-hover-bg: rgba(0, 217, 255, 0.16);
  --tab-cyan-hover-border: rgba(0, 217, 255, 0.30);
  
  --btn-doc-text: #93C5FD;
  --btn-doc-icon: #60A5FA;
  --btn-doc-bg: rgba(37, 99, 235, 0.15);
  --btn-doc-border: rgba(59, 130, 246, 0.3);
  --btn-doc-hover-bg: rgba(37, 99, 235, 0.25);
  --btn-doc-hover-border: rgba(59, 130, 246, 0.5);
}

[data-theme="light"] {
  --tab-purple-text: #7C3AED;
  --tab-purple-bg: rgba(124, 58, 237, 0.10);
  --tab-purple-border: rgba(124, 58, 237, 0.45);
  --tab-purple-hover-bg: rgba(124, 58, 237, 0.16);
  --tab-purple-hover-border: rgba(124, 58, 237, 0.30);

  --tab-cyan-text: #0284C7;
  --tab-cyan-bg: rgba(2, 132, 199, 0.10);
  --tab-cyan-border: rgba(2, 132, 199, 0.45);
  --tab-cyan-hover-bg: rgba(2, 132, 199, 0.16);
  --tab-cyan-hover-border: rgba(2, 132, 199, 0.30);
  
  --btn-doc-text: #2563EB;
  --btn-doc-icon: #2563EB;
  --btn-doc-bg: rgba(37, 99, 235, 0.10);
  --btn-doc-border: rgba(59, 130, 246, 0.3);
  --btn-doc-hover-bg: rgba(37, 99, 235, 0.20);
  --btn-doc-hover-border: rgba(59, 130, 246, 0.5);
}
`;

if (!css.includes('--tab-purple-text')) {
  css = css.replace(':root {', themeVars.split('[data-theme="light"] {')[0]);
  css = css.replace('[data-theme="light"] {', '[data-theme="light"] {' + themeVars.split('[data-theme="light"] {')[1].replace('}\n', ''));
}
fs.writeFileSync(cssPath, css);
console.log('globals.css updated');
