const fs = require('fs');

let file1 = 'E:\\Triple S Production\\Hiredesk-main\\src\\lib\\store.tsx';
let content = fs.readFileSync(file1, 'utf8');

content = content.replace(/filterStatus === "review" \|\| filterStatus === "in_review"/g, 'filterStatus === "screening"');
content = content.replace(/\["review", "inreview", "in_review"\]/g, '["screening", "review", "in_review"]');

content = content.replace(/filterStatus === "offer" \|\| filterStatus === "offer_prep"/g, 'filterStatus === "offer_sent"');
content = content.replace(/\["offer", "offerprep", "offer_prep"\]/g, '["offer_sent", "offer"]');

content = content.replace(/filterStatus === "interview_1"/g, 'filterStatus === "interview"');
content = content.replace(/\["interview1", "interviewr1", "interview_1", "interview_r1"\]/g, '["interview", "interview_1"]');

content = content.replace(/filterStatus === "interview_2"/g, 'filterStatus === "final_discussion"');
content = content.replace(/\["interview2", "interviewr2", "interview_2", "interview_r2"\]/g, '["final_discussion", "interview_2"]');

content = content.replace(/filterStatus === "approved"/g, 'filterStatus === "selected"');
content = content.replace(/\["approved"\]/g, '["selected", "approved"]');

fs.writeFileSync(file1, content, 'utf8');

let file2 = 'E:\\Triple S Production\\Hiredesk-main\\src\\components\\layout\\Sidebar.tsx';
let content2 = fs.readFileSync(file2, 'utf8');

content2 = content2.replace(/key: "review", label: "In Review"/g, 'key: "screening", label: "Screening"');
content2 = content2.replace(/key: "interview_1", label: "Interview R1"/g, 'key: "interview", label: "Interview"');
content2 = content2.replace(/key: "interview_2", label: "Interview R2"/g, 'key: "final_discussion", label: "Final Discussion"');
content2 = content2.replace(/key: "offer", label: "Offer Prep"/g, 'key: "offer_sent", label: "Offer Sent"');

fs.writeFileSync(file2, content2, 'utf8');

let file3 = 'E:\\Triple S Production\\Hiredesk-main\\src\\components\\candidates\\CandidateDetail.tsx';
let content3 = fs.readFileSync(file3, 'utf8');

content3 = content3.replace(/\["offer", "offer_sent", "offer_accepted", "offer_rejected"\]\.includes/g, '["offer_sent", "offer_accepted", "offer_rejected"].includes');
content3 = content3.replace(/\["interview_1", "interview_2"\]\.includes/g, '["interview", "final_discussion"].includes');
content3 = content3.replace(/\["interview_1", "interview_2", "shortlisted"\]\.includes/g, '["interview", "final_discussion", "shortlisted"].includes');
content3 = content3.replace(/\["new", "review", "shortlisted", "interview_1", "interview_2", "approved", "rejected", "offer", "offer_sent", "offer_accepted", "offer_rejected", "hired"\]/g, '["new", "awaiting_details", "follow_up", "screening", "awaiting_resume_portfolio", "shortlisted", "task_sent", "task_received", "interview", "final_discussion", "selected", "hold", "rejected", "joining_confirmed", "offer_sent", "offer_accepted", "offer_rejected", "onboarding_requested", "onboarding_review", "onboarding_verified", "onboarding_rejected", "hired"]');

fs.writeFileSync(file3, content3, 'utf8');
