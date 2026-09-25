const fs = require('fs');

const path = 'E:\\Triple S Production\\Hiredesk-main\\src\\components\\candidates\\CandidateDetail.tsx';
let content = fs.readFileSync(path, 'utf8');

// Replace STATUSES array
content = content.replace(
  /const STATUSES: Candidate\["status"\]\[\] = \[[^\]]+\];/,
  `const STATUSES: Candidate["status"][] = ["new", "awaiting_details", "follow_up", "screening", "awaiting_resume_portfolio", "shortlisted", "task_sent", "task_received", "interview", "final_discussion", "selected", "hold", "rejected", "joining_confirmed", "offer_sent", "offer_accepted", "offer_rejected", "onboarding_requested", "onboarding_review", "onboarding_verified", "onboarding_rejected"];`
);

// Replace ["shortlisted", "interview_1", "interview_2", "approved", "offer", ... ] with new ones
content = content.replace(
  /\["shortlisted", "interview_1", "interview_2", "approved", "offer", "offer_sent", "offer_accepted", "offer_rejected", "onboarding_requested", "onboarding_review", "onboarding_verified", "onboarding_rejected", "hired"\]/g,
  `["shortlisted", "task_sent", "task_received", "interview", "final_discussion", "selected", "hold", "joining_confirmed", "offer_sent", "offer_accepted", "offer_rejected", "onboarding_requested", "onboarding_review", "onboarding_verified", "onboarding_rejected"]`
);

content = content.replace(
  /\["interview_2", "approved", "offer", "offer_sent", "offer_accepted", "offer_rejected", "onboarding_requested", "onboarding_review", "onboarding_verified", "onboarding_rejected", "hired"\]/g,
  `["final_discussion", "selected", "joining_confirmed", "offer_sent", "offer_accepted", "offer_rejected", "onboarding_requested", "onboarding_review", "onboarding_verified", "onboarding_rejected"]`
);

content = content.replace(
  /\["approved", "offer", "offer_sent"\]/g,
  `["selected", "offer_sent"]`
);

content = content.replace(
  /\["new", "review", "shortlisted", "interview_1", "interview_2", "approved", "rejected", "offer", "offer_sent", "offer_accepted", "offer_rejected"\]/g,
  `["new", "awaiting_details", "follow_up", "screening", "awaiting_resume_portfolio", "shortlisted", "task_sent", "task_received", "interview", "final_discussion", "selected", "hold", "rejected", "joining_confirmed", "offer_sent", "offer_accepted", "offer_rejected"]`
);

content = content.replace(
  /\["approved", "offer", "offer_sent", "offer_accepted", "offer_rejected", "onboarding_requested", "onboarding_review", "onboarding_verified", "onboarding_rejected", "hired"\]/g,
  `["selected", "joining_confirmed", "offer_sent", "offer_accepted", "offer_rejected", "onboarding_requested", "onboarding_review", "onboarding_verified", "onboarding_rejected"]`
);

content = content.replace(/c\.status === "review"/g, `c.status === "screening"`);
content = content.replace(/c\.status === "approved"/g, `c.status === "selected"`);
content = content.replace(/c\.status === "offer"/g, `c.status === "offer_sent"`);
content = content.replace(/c\.status === "interview_1"/g, `c.status === "interview"`);
content = content.replace(/c\.status === "interview_2"/g, `c.status === "final_discussion"`);

// "Candidate must be shortlisted before scheduling Round 1."
content = content.replace(
  /status: "interview_1"/g,
  `status: "interview"`
);

content = content.replace(
  /status: "interview_2"/g,
  `status: "final_discussion"`
);

content = content.replace(
  /status: "approved"/g,
  `status: "selected"`
);

content = content.replace(
  /status: "offer"/g,
  `status: "offer_sent"`
);


fs.writeFileSync(path, content, 'utf8');
console.log('Patched CandidateDetail.tsx');
