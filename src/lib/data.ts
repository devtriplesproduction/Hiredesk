import type { Candidate, Role, Contract, ScoreBreakdown, EmploymentStatus } from "@/types";

export function getEmploymentStatusMeta(status?: EmploymentStatus) {
  switch (status) {
    case "CURRENTLY_WORKING":
      return {
        label: "Currently Working",
        badgeLabel: "Working",
        icon: "🟢",
        color: "#10B981",
        textColor: "text-emerald-400",
        bg: "rgba(16, 185, 129, 0.12)",
        border: "rgba(16, 185, 129, 0.3)",
      };
    case "STUDENT_FRESHER":
      return {
        label: "Student / Fresher",
        badgeLabel: "Student",
        icon: "🔵",
        color: "#06B6D4",
        textColor: "text-cyan-400",
        bg: "rgba(6, 182, 212, 0.12)",
        border: "rgba(6, 182, 212, 0.3)",
      };
    case "NOT_CURRENTLY_WORKING":
      return {
        label: "Not Currently Working",
        badgeLabel: "Not Working",
        icon: "⚪",
        color: "#9CA3AF",
        textColor: "text-text-2",
        bg: "rgba(156, 163, 175, 0.12)",
        border: "rgba(156, 163, 175, 0.3)",
      };
    case "UNKNOWN":
    default:
      return {
        label: "Status Unknown",
        badgeLabel: "Unknown",
        icon: "🟡",
        color: "#F59E0B",
        textColor: "text-amber-400",
        bg: "rgba(245, 158, 11, 0.12)",
        border: "rgba(245, 158, 11, 0.3)",
      };
  }
}

export const DEFAULT_ROLES: Role[] = [
  { id: "dev-ft", name: "Web/App Developer", type: "Full-time", count: 0, isActive: true, keywords: ["react", "node", "javascript", "typescript", "python", "flutter", "nextjs", "mongodb", "sql", "api", "git", "css", "html", "aws", "docker"], reqExp: "2", reqEdu: "B.Tech" },
  { id: "dev-in", name: "Dev Intern", type: "Intern", count: 0, isActive: true, keywords: ["javascript", "html", "css", "react", "python", "git", "basics", "intern"], reqExp: "fresher", reqEdu: "B.Tech" },
  { id: "designer", name: "Graphic Designer", type: "Full-time", count: 0, isActive: true, keywords: ["figma", "photoshop", "illustrator", "canva", "branding", "typography", "ui", "ux", "adobe", "design"], reqExp: "1", reqEdu: "Diploma" },
  { id: "editor", name: "Video Editor", type: "Full-time", count: 0, isActive: true, keywords: ["premiere", "after effects", "davinci", "final cut", "color grading", "motion graphics", "editing", "capcut", "video"], reqExp: "1", reqEdu: "Diploma" },
  { id: "dmarketer", name: "Digital Marketer", type: "Full-time", count: 0, isActive: true, keywords: ["seo", "sem", "google ads", "meta ads", "analytics", "email marketing", "hubspot", "campaigns", "digital"], reqExp: "2", reqEdu: "B.Com" },
  { id: "smm", name: "Social Media Manager", type: "Full-time", count: 0, isActive: true, keywords: ["instagram", "social media", "content creation", "reels", "scheduling", "analytics", "engagement", "tiktok", "facebook"], reqExp: "1", reqEdu: "B.A" },
  { id: "sales", name: "Sales Executive", type: "Full-time", count: 0, isActive: true, keywords: ["sales", "crm", "b2b", "b2c", "negotiation", "lead generation", "revenue", "target", "closing", "salesforce"], reqExp: "1", reqEdu: "Any" },
  { id: "perfmkt", name: "Performance Marketer", type: "Full-time", count: 0, isActive: true, keywords: ["google ads", "meta ads", "roas", "cpc", "cpm", "ppc", "remarketing", "a/b testing", "conversion", "performance"], reqExp: "3", reqEdu: "MBA" },
  { id: "content", name: "Content Strategist", type: "Full-time", count: 0, isActive: true, keywords: ["content strategy", "copywriting", "seo", "storytelling", "editorial", "blogging", "audience", "brand voice"], reqExp: "2", reqEdu: "B.A" },
  { id: "model-m", name: "Model (Male)", type: "Freelance", count: 0, isActive: true, keywords: ["modelling", "portfolio", "commercial", "editorial", "runway", "brand", "male model"] },
  { id: "model-f", name: "Model (Female)", type: "Freelance", count: 0, isActive: true, keywords: ["modelling", "portfolio", "commercial", "editorial", "runway", "brand", "female model"] },
  { id: "camera", name: "Cameraman", type: "Full-time", count: 0, isActive: true, keywords: ["cinematography", "camera", "lighting", "dslr", "video production", "shoot", "lens", "stabilizer", "drone"] },
];

export const SKILLS_POOL: Record<string, string[]> = {
  "dev-ft": ["React", "Node.js", "TypeScript", "MongoDB", "Python", "AWS", "Git", "REST APIs", "SQL", "Flutter"],
  "dev-in": ["JavaScript", "HTML/CSS", "React", "Python", "Git"],
  "designer": ["Figma", "Adobe XD", "Illustrator", "Photoshop", "Canva", "Branding", "Typography"],
  "editor": ["Premiere Pro", "After Effects", "DaVinci Resolve", "Motion Graphics", "Color Grading"],
  "dmarketer": ["SEO", "SEM", "Google Ads", "Meta Ads", "HubSpot", "Email Marketing", "Analytics"],
  "smm": ["Instagram", "TikTok", "Content Creation", "Reels", "Social Analytics", "Scheduling"],
  "sales": ["CRM", "B2B Sales", "Lead Generation", "Negotiation", "Salesforce", "Cold Calling"],
  "perfmkt": ["Google Ads", "Meta Ads", "ROAS", "PPC", "A/B Testing", "Conversion Optimization"],
  "content": ["Copywriting", "SEO", "Content Strategy", "Storytelling", "Brand Voice", "Editorial"],
  "model-m": ["Commercial", "Editorial", "Runway", "Fitness", "Brand Ambassadorship"],
  "model-f": ["Commercial", "Editorial", "Runway", "Fashion", "Brand Ambassadorship"],
  "camera": ["Cinematography", "DSLR", "Lighting", "Video Production", "Drone", "Stabilizer"],
};

export const CITIES = ["Mumbai", "Delhi", "Pune", "Bangalore", "Hyderabad", "Chennai", "Kolkata", "Ahmedabad", "Jaipur", "Surat", "Nashik", "Remote"];
export const GENDERS = ["Male", "Female", "Non-binary", "Prefer not to say"];
export const EXP_LEVELS = ["Fresher", "1 yr", "2 yrs", "3 yrs", "5+ yrs"];
export const EDU = ["B.Tech", "BCA", "MBA", "BDes", "B.Sc", "BA", "B.Com", "MCA", "M.Tech", "Diploma"];
const FIRSTNAMES = ["Aarav", "Priya", "Rohit", "Sneha", "Arjun", "Neha", "Vikram", "Ananya", "Raj", "Pooja", "Dev", "Ishaan", "Kavya", "Siddharth", "Riya", "Kiran", "Meera", "Aditya", "Shruti", "Manish", "Zara", "Omar", "Tanya", "Nikhil", "Ayesha", "Dhruv", "Ratan", "Simran", "Vivek", "Deepika"];
const LASTNAMES = ["Sharma", "Patel", "Singh", "Kumar", "Gupta", "Verma", "Mehta", "Shah", "Joshi", "Nair", "Iyer", "Reddy", "Bose", "Khanna", "Malhotra", "Kapoor", "Desai", "Pillai", "Rao", "Agarwal"];
const STATUSES: Candidate["status"][] = ["new", "new", "new", "review", "review", "approved", "rejected"];

function uid() { return typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2) + Date.now().toString(36); }
function pick<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }
function pickN<T>(arr: T[], n: number): T[] { return [...arr].sort(() => Math.random() - .5).slice(0, n); }

export interface MatchRequirements {
  keywords: string[];
  exp?: string;
  education?: string;
}

export function calculateMatchScore(text: string, reqs: MatchRequirements, info: Partial<Candidate> = {}): ScoreBreakdown {
  const lower = text.toLowerCase();

  // --- Skills: deterministic keyword matching ---
  const matchedSkills: string[] = [];
  const missingSkills: string[] = [];
  
  const checkSkillMatch = (kw: string, textLower: string) => {
    if (['basics', 'intern', 'knowledge', 'experience', 'fresher'].includes(kw.toLowerCase().trim())) {
      return null;
    }
    
    // Normalize textLower for common variations
    let normText = textLower;
    normText = normText.replace(/react\.js/g, 'react');
    normText = normText.replace(/next\.js/g, 'nextjs');
    normText = normText.replace(/node\.js/g, 'nodejs');
    normText = normText.replace(/vue\.js/g, 'vuejs');
    normText = normText.replace(/html5/g, 'html');
    normText = normText.replace(/css3/g, 'css');
    
    let normKw = kw.toLowerCase().trim();
    normKw = normKw.replace(/html5/g, 'html');
    normKw = normKw.replace(/css3/g, 'css');
    normKw = normKw.replace(/react\.js/g, 'react');
    normKw = normKw.replace(/next\.js/g, 'nextjs');
    normKw = normKw.replace(/node\.js/g, 'nodejs');
    normKw = normKw.replace(/vue\.js/g, 'vuejs');
    
    if (normKw === 'aws' && normText.includes('amazon web services')) return true;

    if (kw.includes('/')) {
      const parts = kw.split('/').map(p => p.toLowerCase().trim());
      if (parts.every(p => {
        const escaped = p.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
        return new RegExp(`\\b${escaped}\\b`, 'i').test(normText);
      })) return true;
    }
    
    const escaped = normKw.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    return new RegExp(`\\b${escaped}\\b`, 'i').test(normText);
  };

  let totalValidKeywords = 0;
  for (const kw of reqs.keywords) {
    const match = checkSkillMatch(kw, lower);
    if (match === true) {
      matchedSkills.push(kw);
      totalValidKeywords++;
    } else if (match === false) {
      missingSkills.push(kw);
      totalValidKeywords++;
    }
  }
  const skillsRaw = totalValidKeywords > 0 ? Math.round((matchedSkills.length / totalValidKeywords) * 100) : 0;

  // --- Experience: Score ONLY if explicitly required ---
  let expRaw = 0;
  let hasExpReq = false;
  if (reqs.exp && reqs.exp !== "all") {
    hasExpReq = true;
    const parseExp = (s?: string): number | null => {
      if (!s) return null;
      const str = s.toLowerCase();
      const match = str.match(/(\d+(?:\.\d+)?)/);
      if (match) {
        const val = parseFloat(match[1]);
        if (str.includes("month") || str.includes("mo")) return val / 12;
        return val;
      }
      if (str.includes("fresher") || str.includes("intern")) return 0;
      return null; // Unparsed
    };
    const candYrs = parseExp(info.exp);
    const reqYrs = parseExp(reqs.exp);
    
    if (candYrs === null) {
      expRaw = 0;
    } else if (reqYrs !== null && candYrs >= reqYrs) {
      expRaw = 100;
    } else if (reqYrs !== null && reqYrs > 0) {
      expRaw = Math.round((candYrs / reqYrs) * 100);
    } else {
      expRaw = 0;
    }
  }

  // --- Education: Score ONLY if explicitly required ---
  let eduRaw = 0;
  let hasEduReq = false;
  if (reqs.education && reqs.education !== "all") {
    hasEduReq = true;
    const eduTier = (s?: string) => {
      if (!s) return 0;
      const str = s.toLowerCase();
      if (/ph\.?d|doctorate/.test(str)) return 5;
      if (/m\.?tech|m\.?s\.?|m\.?sc|mba|mca|master/.test(str)) return 4;
      if (/b\.?tech|b\.?e\.?|b\.?sc|bca|b\.?com|b\.?a\.?|bdes|bachelor|degree/.test(str)) return 3;
      if (/diploma|associate/.test(str)) return 2;
      if (/12th|hsc|10th|ssc/.test(str)) return 1;
      return 0;
    };
    const candTier = eduTier(info.education);
    const reqTier = eduTier(reqs.education);
    if (candTier >= reqTier) eduRaw = 100;
    else if (reqTier > 0) eduRaw = Math.round((candTier / reqTier) * 100);
    else eduRaw = 0;
  }

  // --- Completeness (General resume quality) ---
  let compRaw = 0;
  if (info.name) compRaw += 20;
  if (info.email) compRaw += 20;
  if (info.phone) compRaw += 20;
  if (info.city && info.city !== "Not specified") compRaw += 20;
  if (info.skills && info.skills.length > 0) compRaw += 20;
  compRaw = Math.min(100, compRaw);

  const hasSkillsReq = totalValidKeywords > 0;

  // If role does not contain enough info to calculate a meaningful requirement match
  if (!hasSkillsReq && !hasExpReq && !hasEduReq) {
    return {
      skills: 100, exp: 100, edu: 100, completeness: compRaw, total: Math.round(compRaw * 0.15), matchedSkills: [], missingSkills: []
    };
  }

  const finalSkillsRaw = hasSkillsReq ? skillsRaw : 100;
  const finalExpRaw = hasExpReq ? expRaw : 100;
  const finalEduRaw = hasEduReq ? eduRaw : 100;

  const total = Math.min(100, Math.round(
    finalSkillsRaw * 0.40 +
    finalExpRaw * 0.25 +
    finalEduRaw * 0.20 +
    compRaw * 0.15
  ));

  return {
    skills: finalSkillsRaw,
    exp: finalExpRaw,
    edu: finalEduRaw,
    completeness: compRaw,
    total,
    matchedSkills,
    missingSkills,
  };
}

export function makeCandidate(roleId: string, overrides: Partial<Candidate> = {}): Candidate {
  const fn = pick(FIRSTNAMES); const ln = pick(LASTNAMES);
  const role = DEFAULT_ROLES.find(r => r.id === roleId) ?? DEFAULT_ROLES[0];
  const pool = SKILLS_POOL[roleId] ?? ["Communication", "Teamwork"];
  const seedOffset = Math.random() * 30 * 86400000; // random within last 30 days for seed data
  const baseCandidate = {
    id: uid(), name: `${fn} ${ln}`,
    email: `${fn.toLowerCase()}.${ln.toLowerCase()}@gmail.com`,
    phone: `+91 ${Math.floor(Math.random() * 9000000000 + 1000000000)}`,
    roleId, roleName: role.name,
    status: pick(STATUSES), city: pick(CITIES), gender: pick(GENDERS),
    age: Math.floor(Math.random() * 18) + 21, exp: pick(EXP_LEVELS), education: pick(EDU),
    skills: pickN(pool, Math.floor(Math.random() * 3) + 2),
    resumeFile: `${fn}_${ln}_Resume.pdf`,
    appliedAt: new Date(Date.now() - seedOffset).toLocaleDateString("en-IN"),
    createdAt: new Date(Date.now() - seedOffset).toISOString(),
    note: "", ...overrides,
  };
  const mockScore = calculateMatchScore(pickN(role.keywords, 4).join(" "), { keywords: role.keywords }, {
    exp: baseCandidate.exp,
    education: baseCandidate.education,
    name: baseCandidate.name,
    email: baseCandidate.email,
    phone: baseCandidate.phone,
    city: baseCandidate.city,
    skills: baseCandidate.skills
  });
  const finalScore = overrides.score ?? mockScore;
  return { ...baseCandidate, score: finalScore };
}


export function scoreCandidateFromText(text: string, reqs: MatchRequirements, info: Partial<Candidate> = {}): ScoreBreakdown {
  return calculateMatchScore(text, reqs, info);
}

export function extractInfoFromText(text: string): Partial<Candidate> {
  const emailMatch = text.match(/[\w.+-]+@[\w-]+\.[a-z]{2,}/i);
  const phoneMatch = text.match(/(\+91[\s-]?)?[6-9]\d{9}/);
  const nameMatch = text.match(/^([A-Z][a-z]+ [A-Z][a-z]+)/m);
  const expMatch = text.match(/(\d+)\+?\s*(?:year|yr)/i);
  const cityMatch = ["Mumbai", "Delhi", "Pune", "Bangalore", "Hyderabad", "Chennai", "Kolkata", "Nashik", "Ahmedabad", "Jaipur", "Surat"].find(c => text.includes(c));
  const eduMatch = ["B.Tech", "BCA", "MBA", "BDes", "B.Sc", "BA", "B.Com", "MCA", "M.Tech", "Diploma"].find(e => text.includes(e));
  
  // Basic skill extraction using a common pool
  const allSkills = new Set<string>();
  Object.values(SKILLS_POOL).forEach(skills => skills.forEach(s => allSkills.add(s)));
  
  let normText = text.toLowerCase();
  normText = normText.replace(/react\.js/g, 'react');
  normText = normText.replace(/next\.js/g, 'nextjs');
  normText = normText.replace(/node\.js/g, 'nodejs');
  normText = normText.replace(/vue\.js/g, 'vuejs');
  
  const foundSkills: string[] = [];
  Array.from(allSkills).forEach(skill => {
    let normKw = skill.toLowerCase().trim();
    normKw = normKw.replace(/react\.js/g, 'react');
    normKw = normKw.replace(/next\.js/g, 'nextjs');
    normKw = normKw.replace(/node\.js/g, 'nodejs');
    normKw = normKw.replace(/vue\.js/g, 'vuejs');
    
    const escaped = normKw.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    if (new RegExp(`\\b${escaped}\\b`, 'i').test(normText)) {
      foundSkills.push(skill);
    }
  });

  return {
    name: nameMatch?.[1] ?? "", email: emailMatch?.[0] ?? "", phone: phoneMatch?.[0] ?? "",
    city: cityMatch ?? "Not specified", education: eduMatch ?? "Not specified",
    exp: expMatch ? `${expMatch[1]} yr${Number(expMatch[1]) > 1 ? "s" : ""}` : "Not specified",
    skills: foundSkills,
  };
}

export function detectBestRole(text: string, roles: Role[]): string {
  let normText = text.toLowerCase();
  normText = normText.replace(/react\.js/g, 'react');
  normText = normText.replace(/next\.js/g, 'nextjs');
  normText = normText.replace(/node\.js/g, 'nodejs');
  normText = normText.replace(/vue\.js/g, 'vuejs');
  normText = normText.replace(/html5/g, 'html');
  normText = normText.replace(/css3/g, 'css');

  let best = { id: "dev-ft", score: 0 };
  for (const role of roles) {
    let score = 0;
    for (const kw of role.keywords) {
      let normKw = kw.toLowerCase().trim();
      normKw = normKw.replace(/html5/g, 'html');
      normKw = normKw.replace(/css3/g, 'css');
      normKw = normKw.replace(/react\.js/g, 'react');
      normKw = normKw.replace(/next\.js/g, 'nextjs');
      normKw = normKw.replace(/node\.js/g, 'nodejs');
      normKw = normKw.replace(/vue\.js/g, 'vuejs');

      const escaped = normKw.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
      if (new RegExp(`\\b${escaped}\\b`, 'i').test(normText)) {
        score++;
      } else if (normKw === 'aws' && normText.includes('amazon web services')) {
        score++;
      }
    }
    if (score > best.score) best = { id: role.id, score };
  }
  return best.id;
}

export function generateSeedCandidates(roles: Role[]): Candidate[] {
  const out: Candidate[] = [];
  roles.forEach(r => { const n = Math.floor(Math.random() * 10) + 3; for (let i = 0; i < n; i++) out.push(makeCandidate(r.id)); });
  return out;
}

// ── CONTRACT TEMPLATES ────────────────────────────────────────
const today = () => new Date().toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" });

const LH = (refSuffix: string) => `
<div class="letterhead" style="display:flex;justify-content:space-between;align-items:flex-start;border-bottom:2.5px solid #111;padding-bottom:16px;margin-bottom:28px">
  <div>
    <div class="contract-logo-slot" data-slot="logo" style="height:56px;display:flex;align-items:center;margin-bottom:8px"><!--LOGO--></div>
    <div style="font-family:Arial,sans-serif;font-size:7.5pt;color:#999;margin-top:2px">Rajdhani Towers, First floor, Rajwada, Satara · info@triplesproduction.com</div>
  </div>
  <div style="text-align:right;font-family:Arial,sans-serif;font-size:9pt;color:#555">
    <div style="font-weight:700;color:#111;font-size:10pt">Ref: TSP/${refSuffix}/[REF NO]</div>
    <div style="margin-top:4px">Date: ${today()}</div>
  </div>
</div>`;

const SIG = `
<div class="sig-block" style="display:grid;grid-template-columns:1fr 1fr;gap:60px;margin-top:48px;padding-top:24px;border-top:1px solid #ddd">
  <div>
    <div class="contract-sign-slot" data-slot="sign" style="height:96px;min-height:96px;display:flex;align-items:flex-end;margin-bottom:8px"><!--SIGN--></div>
    <div class="sig-line" style="border-top:1.5px solid #333;padding-top:8px">
      <div style="font-family:Arial,sans-serif;font-weight:700;font-size:10pt">Authorized Signatory</div>
      <div style="font-family:Arial,sans-serif;font-size:9pt;color:#555;margin-top:2px">Triple S Production</div>
    </div>
  </div>
  <div>
    <div style="height:96px;min-height:96px;display:flex;align-items:flex-end;margin-bottom:8px"></div>
    <div class="sig-line" style="border-top:1.5px solid #333;padding-top:8px">
      <div style="font-family:Arial,sans-serif;font-weight:700;font-size:10pt">Candidate Signature</div>
      <div style="font-family:Arial,sans-serif;font-size:9pt;color:#555;margin-top:2px">[CANDIDATE NAME]</div>
      <div style="font-family:Arial,sans-serif;font-size:8pt;color:#999;margin-top:2px">Date: _______________</div>
    </div>
  </div>
</div>`;

function clause(num: string, title: string, body: string) {
  return `<p style="margin:0 0 4px 0"><strong style="font-family:Arial,sans-serif;font-size:10.5pt">${num}. ${title}</strong></p><p style="margin:0 0 16px 0;font-family:Arial,sans-serif;font-size:10.5pt;text-align:justify">${body}</p>`;
}

function empTemplate() {
  return LH("EMP") + `
<h2 style="font-family:Arial,sans-serif;font-size:14pt;font-weight:800;letter-spacing:0.5px;text-transform:uppercase;text-align:center;margin:0 0 24px 0;padding-bottom:10px;border-bottom:1px solid #e0e0e0">Employment Agreement</h2>
<p style="font-family:Arial,sans-serif;font-size:10.5pt;margin-bottom:20px;text-align:justify">This Employment Agreement (<strong>"Agreement"</strong>) is entered into as of <strong>${today()}</strong>, between <strong>Triple S Production</strong>, a duly registered agency having its principal place of business in Satara, Maharashtra (<strong>"Company"</strong>), and <strong>[CANDIDATE NAME]</strong> (<strong>"Employee"</strong>), collectively referred to as the <strong>"Parties."</strong></p>
${clause("1", "Position & Duties", "The Employee is appointed to the position of <strong>[ROLE]</strong>. The Employee shall perform all duties as directed by management, report to the designated supervisor, and represent the Company professionally at all times.")}
${clause("2", "Commencement & Probation", "Employment commences on <strong>[START DATE]</strong>. The Employee shall be on probation for a period of <strong>[NOTICE PERIOD]</strong>. Confirmation of employment is subject to satisfactory performance and conduct during this period.")}
${clause("3", "Compensation", "The Employee shall receive a monthly gross salary of <strong>[AMOUNT ₹]</strong>, payable on or before the last working day of each month, subject to applicable TDS and statutory deductions. Salary revisions are at the Company's discretion and subject to annual performance review.")}
${clause("4", "Working Hours", "Standard working hours are Monday to Saturday, 10:00 AM to 7:00 PM (IST). Additional hours may be required based on project demands. No separate overtime compensation applies to exempt positions.")}
${clause("5", "Leave Entitlement", "The Employee is entitled to 12 days of earned leave, 6 days of casual leave, and applicable national and public holidays per calendar year, as per the Company's Leave Policy.")}
${clause("6", "Confidentiality", "The Employee agrees to hold in strict confidence all proprietary information, trade secrets, client data, strategies, creative assets, and financial information of the Company, both during and for a period of 2 years after termination of employment.")}
${clause("7", "Intellectual Property", "All work products, creative works, code, designs, content, and deliverables produced by the Employee in the course of employment shall be the exclusive property of Triple S Production. The Employee hereby assigns all such rights to the Company.")}
${clause("8", "Code of Conduct", "The Employee shall maintain professional standards of conduct, avoid conflicts of interest, and comply with all Company policies. Misconduct, including but not limited to dishonesty, insubordination, or breach of confidentiality, may result in disciplinary action including termination.")}
${clause("9", "Termination", "Either Party may terminate this Agreement with <strong>[NOTICE PERIOD]</strong> written notice. The Company reserves the right to terminate immediately in cases of gross misconduct, fraud, or material breach of this Agreement, without notice or compensation in lieu thereof.")}
${clause("10", "Governing Law", "This Agreement shall be governed by and construed in accordance with the laws of India. Any disputes arising hereunder shall be subject to the exclusive jurisdiction of courts in Satara, Maharashtra.")}
<p style="font-family:Arial,sans-serif;font-size:10pt;color:#555;margin-top:24px;text-align:justify"><em>This Agreement constitutes the entire agreement between the Parties and supersedes all prior understandings. Any amendments must be made in writing and signed by both Parties.</em></p>
${SIG}`;
}

function internTemplate() {
  return LH("INT") + `
<h2 style="font-family:Arial,sans-serif;font-size:14pt;font-weight:800;letter-spacing:0.5px;text-transform:uppercase;text-align:center;margin:0 0 24px 0;padding-bottom:10px;border-bottom:1px solid #e0e0e0">Internship Agreement</h2>
<p style="font-family:Arial,sans-serif;font-size:10.5pt;margin-bottom:20px;text-align:justify">This Internship Agreement is entered into between <strong>Triple S Production</strong> (<strong>"Company"</strong>) and <strong>[CANDIDATE NAME]</strong> (<strong>"Intern"</strong>) for the position of <strong>[ROLE]</strong>.</p>
${clause("1", "Duration", "This internship shall be for a period of <strong>[X months]</strong>, commencing on <strong>[START DATE]</strong> and concluding on <strong>[END DATE]</strong>, unless terminated earlier in accordance with this Agreement.")}
${clause("2", "Stipend", "The Intern shall receive a monthly stipend of <strong>[AMOUNT ₹]</strong>, payable at month-end, subject to a minimum attendance of 80% and satisfactory performance.")}
${clause("3", "Scope of Work", "The Intern will assist the team in projects related to <strong>[ROLE]</strong>, gaining practical industry experience under the supervision and guidance of the assigned team lead.")}
${clause("4", "Confidentiality", "The Intern agrees to maintain strict confidentiality of all information accessed during the internship and shall not disclose any proprietary, client, or business information to third parties.")}
${clause("5", "Intellectual Property", "All work produced during the internship is the property of Triple S Production. The Intern waives any claims of ownership over deliverables created in the course of the internship.")}
${clause("6", "Completion Certificate", "Upon successful completion of the internship, the Company shall issue an Internship Completion Certificate and, upon request, a Letter of Recommendation based on performance.")}
${clause("7", "Termination", "Either Party may terminate this Agreement with 7 days written notice. The Company may terminate immediately in cases of misconduct or breach.")}
${SIG}`;
}

function ndasTemplate() {
  return LH("NDA") + `
<h2 style="font-family:Arial,sans-serif;font-size:14pt;font-weight:800;letter-spacing:0.5px;text-transform:uppercase;text-align:center;margin:0 0 24px 0;padding-bottom:10px;border-bottom:1px solid #e0e0e0">Non-Disclosure Agreement</h2>
<p style="font-family:Arial,sans-serif;font-size:10.5pt;margin-bottom:20px;text-align:justify">This Non-Disclosure Agreement (<strong>"Agreement"</strong>) is entered into as of <strong>${today()}</strong>, between <strong>Triple S Production</strong> (<strong>"Disclosing Party"</strong>) and <strong>[CANDIDATE NAME]</strong> (<strong>"Receiving Party"</strong>).</p>
${clause("1", "Definition of Confidential Information", "\"Confidential Information\" means any non-public information disclosed by Triple S Production, including but not limited to: client identities and data, business strategies, pricing structures, creative briefs, campaign performance data, financial information, employee details, software, and internal processes.")}
${clause("2", "Obligations of Receiving Party", "The Receiving Party shall: (a) hold all Confidential Information in strict confidence; (b) not disclose it to any third party without prior written consent; (c) use it solely for the purpose of their engagement with the Company; and (d) apply the same degree of protection as applied to their own confidential information, but no less than reasonable care.")}
${clause("3", "Exclusions", "This Agreement does not apply to information that: (a) is or becomes publicly known through no breach of this Agreement; (b) was rightfully known before disclosure; or (c) is required to be disclosed by law or court order, provided prompt written notice is given to the Disclosing Party.")}
${clause("4", "Duration", "This Agreement shall remain in force for a period of <strong>2 (two) years</strong> from the date of signing and shall survive termination of any employment or contractual relationship between the Parties.")}
${clause("5", "Remedies", "The Receiving Party acknowledges that any breach of this Agreement may cause irreparable harm, entitling the Disclosing Party to seek equitable relief, including injunction, in addition to any other legal remedies available.")}
${clause("6", "Governing Law", "This Agreement shall be governed by the laws of India and subject to the jurisdiction of courts in Satara, Maharashtra.")}
${SIG}`;
}

function freelanceTemplate() {
  return LH("FRL") + `
<h2 style="font-family:Arial,sans-serif;font-size:14pt;font-weight:800;letter-spacing:0.5px;text-transform:uppercase;text-align:center;margin:0 0 24px 0;padding-bottom:10px;border-bottom:1px solid #e0e0e0">Freelance / Project Contract</h2>
<p style="font-family:Arial,sans-serif;font-size:10.5pt;margin-bottom:20px;text-align:justify">This Contract is entered into between <strong>Triple S Production</strong> (<strong>"Client"</strong>) and <strong>[CANDIDATE NAME]</strong> (<strong>"Contractor"</strong>) for services as <strong>[ROLE]</strong>, effective <strong>[START DATE]</strong>.</p>
${clause("1", "Scope of Work", "The Contractor agrees to provide the following services: [DESCRIBE DELIVERABLES]. The scope is defined in the attached project brief, which forms an integral part of this Contract.")}
${clause("2", "Payment Terms", "Total project fee: <strong>[AMOUNT ₹]</strong>. Payment schedule: 50% advance upon signing; 50% upon final delivery and approval. Payments shall be made via bank transfer within 7 working days of due date.")}
${clause("3", "Timeline & Milestones", "The project shall be completed within the agreed timeline from the date of advance receipt. Delays caused by the Client shall extend the timeline accordingly.")}
${clause("4", "Revisions", "Up to 2 rounds of revisions are included. Additional revision rounds will be charged at a mutually agreed rate per round.")}
${clause("5", "Intellectual Property", "All final deliverables, including but not limited to designs, footage, and content, become the exclusive property of Triple S Production upon receipt of full payment.")}
${clause("6", "Independent Contractor", "The Contractor is an independent contractor and not an employee of Triple S Production. The Contractor is responsible for all applicable taxes on income received under this Contract.")}
${clause("7", "Termination", "Either Party may terminate this Contract with 7 days written notice. In the event of termination by the Client, payment for work completed shall be made pro-rata.")}
${SIG}`;
}

function ipTemplate() {
  return LH("IPA") + `
<h2 style="font-family:Arial,sans-serif;font-size:14pt;font-weight:800;letter-spacing:0.5px;text-transform:uppercase;text-align:center;margin:0 0 24px 0;padding-bottom:10px;border-bottom:1px solid #e0e0e0">Intellectual Property Assignment Agreement</h2>
<p style="font-family:Arial,sans-serif;font-size:10.5pt;margin-bottom:20px;text-align:justify">This Agreement is entered into between <strong>Triple S Production</strong> (<strong>"Assignee"</strong>) and <strong>[CANDIDATE NAME]</strong> (<strong>"Assignor"</strong>) as of <strong>${today()}</strong>.</p>
${clause("1", "Assignment of Rights", "The Assignor hereby irrevocably assigns, transfers, and conveys to the Assignee all rights, title, and interest — worldwide and in perpetuity — in all intellectual property created in connection with their engagement, including creative works, software, designs, content, strategies, trademarks, and any other materials (<strong>'Works'</strong>).")}
${clause("2", "Moral Rights Waiver", "To the fullest extent permitted by applicable law, the Assignor irrevocably waives all moral rights in the Works, including the right of attribution and the right to object to modifications.")}
${clause("3", "Pre-existing Works", "Any intellectual property created by the Assignor prior to engagement and incorporated into deliverables is licensed (not assigned) to the Assignee on a royalty-free, perpetual, non-exclusive basis.")}
${clause("4", "Cooperation", "The Assignor agrees to execute any additional instruments and take all actions reasonably requested by the Assignee to effectuate, record, or perfect the rights granted herein.")}
${clause("5", "Consideration", "This assignment is made in consideration of the remuneration paid to the Assignor under their employment or freelance agreement with Triple S Production.")}
${clause("6", "Governing Law", "This Agreement is governed by Indian copyright law and the jurisdiction of courts in Satara, Maharashtra.")}
${SIG}`;
}

function modelTemplate() {
  return LH("MDL") + `
<h2 style="font-family:Arial,sans-serif;font-size:14pt;font-weight:800;letter-spacing:0.5px;text-transform:uppercase;text-align:center;margin:0 0 24px 0;padding-bottom:10px;border-bottom:1px solid #e0e0e0">Model Release & Usage Agreement</h2>
<p style="font-family:Arial,sans-serif;font-size:10.5pt;margin-bottom:20px;text-align:justify">This Agreement is entered into between <strong>Triple S Production</strong> (<strong>"Company"</strong>) and <strong>[CANDIDATE NAME]</strong> (<strong>"Model"</strong>) as of <strong>${today()}</strong>.</p>
${clause("1", "Grant of Rights", "The Model grants the Company and its clients a worldwide, royalty-free, irrevocable, perpetual licence to use the Model's name, image, likeness, voice, and performance in all photographs, videos, and multimedia content produced during the engagement, for commercial, editorial, advertising, digital, print, and social media purposes.")}
${clause("2", "Shoot Details", "Shoot Date: [START DATE] | Location: [WORK LOCATION] | Usage Category: Commercial/Editorial")}
${clause("3", "Compensation", "Agreed shoot fee: <strong>[AMOUNT ₹]</strong>, payable within 7 working days of shoot completion, subject to satisfactory delivery of contracted services.")}
${clause("4", "Exclusivity", "This agreement is [NON-EXCLUSIVE / EXCLUSIVE for X months] within the [CATEGORY] category. During an exclusivity period, the Model agrees not to appear in competing campaigns for brands in the same category.")}
${clause("5", "Model's Representations", "The Model represents that: (a) they are of legal age; (b) they have full capacity to enter this Agreement; (c) no prior commitments conflict with this Agreement; and (d) the Company has the right to use the content as described herein without additional consent or payment.")}
${clause("6", "Credits", "Model credits will be provided where editorially appropriate, at the Company's sole discretion.")}
${clause("7", "Governing Law", "This Agreement is governed by the laws of India, subject to the jurisdiction of courts in Satara, Maharashtra.")}
${SIG}`;
}

function expLetterTemplate() {
  return `<div class="page exp-cert-page" style="background:#ffffff !important;color:#111111 !important;width:210mm;height:297mm;min-height:297mm;position:relative;box-sizing:border-box;margin:0 auto;box-shadow:0 16px 48px -8px rgba(0,0,0,0.8),0 0 0 1px rgba(255,255,255,0.12);overflow:hidden;padding:14mm 24mm 16mm 24mm;display:flex;flex-direction:column;justify-content:space-between;">

  <!-- Center Watermark -->
  <div style="position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:130mm;height:130mm;pointer-events:none;opacity:0.045;z-index:0;display:flex;align-items:center;justify-content:center;">
    <img class="page-wm" src="<!--LOGO-->" alt="" style="width:100%;height:100%;object-fit:contain;filter:grayscale(100%);">
  </div>

  <!-- Top Header with divider line -->
  <div style="position:relative;z-index:1;border-bottom:1.5px solid #111111;padding-bottom:10px;display:flex;align-items:center;justify-content:space-between;box-sizing:border-box;width:100%;">
    <div style="display:flex;align-items:center;">
      <img class="header-logo" src="<!--LOGO-->" alt="Logo" style="height:58px;max-width:280px;object-fit:contain;display:block;">
    </div>
    <div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:400;color:#64748b;text-align:right;white-space:nowrap;">
      Page 1 of 1
    </div>
  </div>

  <!-- Main Body Content (centered title + 2-line spacing + prominent sign) -->
  <div style="position:relative;z-index:1;flex:1;display:flex;flex-direction:column;padding-top:18px;box-sizing:border-box;">
    <h1 style="font-family:Arial,Helvetica,sans-serif;font-size:32px;font-weight:800;color:#000000;text-align:center;margin:0 auto 34px auto;line-height:1.2;letter-spacing:-0.5px;">Experience Certificate</h1>
    <div style="font-family:Arial,Helvetica,sans-serif;font-size:16.5px;font-weight:700;color:#000000;margin:0 0 18px 0;text-decoration:underline;text-underline-offset:4px;">To Whomsoever It May Concern</div>

    <p style="font-family:Arial,Helvetica,sans-serif;font-size:15.5px;line-height:1.75;color:#1f2937;margin:0 0 14px 0;text-align:justify;">
      This is to certify that <strong>Shital Khulape</strong> was employed with Triple S Production as Dev from 13/11/2026 to <span style="color:#b45309;font-weight:600;">[LAST WORKING DAY]</span>.
    </p>

    <p style="font-family:Arial,Helvetica,sans-serif;font-size:15.5px;line-height:1.75;color:#1f2937;margin:0 0 14px 0;text-align:justify;">
      During this tenure, Shital Khulape was responsible for software development, code review, and quality assurance tasks as Dev.
    </p>

    <p style="font-family:Arial,Helvetica,sans-serif;font-size:15.5px;line-height:1.75;color:#1f2937;margin:0 0 14px 0;text-align:justify;">
      Throughout the tenure, Shital Khulape was diligent, professional, and a valued member of the team.
    </p>

    <p style="font-family:Arial,Helvetica,sans-serif;font-size:15.5px;line-height:1.75;color:#1f2937;margin:0 0 20px 0;text-align:justify;">
      We wish Shital Khulape continued success in their career.
    </p>

    <!-- Signatures: Founder on Left with enlarged signature, Signed & Issued on Right -->
    <div style="margin-top:20px;display:flex;justify-content:space-between;align-items:flex-end;">
      <div>
        <div class="contract-sign-slot" data-slot="sign" style="height:75px;min-height:75px;display:flex;align-items:flex-end;margin-bottom:6px;"><!--SIGN--></div>
        <div style="font-family:Arial,Helvetica,sans-serif;font-size:16px;font-weight:700;color:#b45309;">[PROPRIETOR NAME]</div>
        <div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#64748b;margin-top:2px;">Founder, Triple S Production</div>
      </div>
      <div style="text-align:right;">
        <div style="font-family:Arial,Helvetica,sans-serif;font-size:13.5px;color:#64748b;margin-bottom:3px;">Signed &amp; issued on</div>
        <div style="font-family:Arial,Helvetica,sans-serif;font-size:16px;font-weight:700;color:#000000;"><span class="contract-date" data-default-date="true">13/11/2026</span></div>
      </div>
    </div>
  </div>

  <!-- Footer Divider and Details -->
  <div style="position:relative;z-index:1;border-top:1px solid #e2e8f0;padding-top:12px;display:flex;align-items:center;justify-content:space-between;font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#64748b;box-sizing:border-box;width:100%;">
    <div>Private &amp; Confidential</div>
    <div style="text-align:center;">hr@triplesproduction.com</div>
    <div style="text-align:right;">OFFER/2026/001</div>
  </div>
</div>`;
}

function relLetterTemplate() {
  return LH("REL") + `
<h2 style="font-family:Arial,sans-serif;font-size:14pt;font-weight:800;letter-spacing:0.5px;text-transform:uppercase;text-align:center;margin:0 0 24px 0;padding-bottom:10px;border-bottom:1px solid #e0e0e0">Relieving Letter</h2>
<p style="font-family:Arial,sans-serif;font-size:10.5pt;margin-bottom:20px;text-align:justify">Dear <strong>[CANDIDATE NAME]</strong>,</p>
<p style="font-family:Arial,sans-serif;font-size:10.5pt;margin-bottom:20px;text-align:justify">With reference to your resignation, we would like to inform you that it has been accepted. You are officially relieved from your duties and responsibilities as <strong>[ROLE]</strong> at Triple S Production, effective from the close of business hours on <strong>[END DATE]</strong>.</p>
<p style="font-family:Arial,sans-serif;font-size:10.5pt;margin-bottom:20px;text-align:justify">Your contributions during your employment from <strong>[START DATE]</strong> are appreciated.</p>
<p style="font-family:Arial,sans-serif;font-size:10.5pt;margin-bottom:20px;text-align:justify">Please note that your obligations regarding Confidentiality, Non-Disclosure, and Intellectual Property, as stated in your employment agreement, remain in effect post-employment.</p>
<p style="font-family:Arial,sans-serif;font-size:10.5pt;margin-bottom:20px;text-align:justify">We wish you success in your future career.</p>
<br/>
${SIG}`;
}

export function getContractTemplates(): Contract[] {
  return [
    { id: "emp-ft", name: "Full-Time Employment Agreement", icon: "📋", desc: "Comprehensive employment contract for permanent hires · Includes probation, compensation, IP, and termination clauses", type: "employment", body: empTemplate() },
    { id: "intern", name: "Internship Agreement", icon: "📄", desc: "Fixed-term internship with stipend, scope of work, confidentiality, and completion certificate", type: "internship", body: internTemplate() },
    { id: "freelance", name: "Freelance / Project Contract", icon: "📝", desc: "Deliverable-based contract for freelance and project-based engagements with payment terms", type: "freelance", body: freelanceTemplate() },
    { id: "nda", name: "Non-Disclosure Agreement", icon: "🔒", desc: "Mutual NDA covering confidential information obligations for all new hires and collaborators", type: "nda", body: ndasTemplate() },
    { id: "ip", name: "IP Assignment Agreement", icon: "©️", desc: "Intellectual property transfer and moral rights waiver for creative and technical roles", type: "ip", body: ipTemplate() },
    { id: "model", name: "Model Release & Usage Agreement", icon: "📸", desc: "Commercial and editorial image/video usage rights for models · Includes exclusivity and payment terms", type: "model", body: modelTemplate() },
    { id: "exp_letter", name: "Experience Letter", icon: "📜", desc: "Official certification of employment tenure and designation", type: "employment", body: expLetterTemplate() },
    { id: "rel_letter", name: "Relieving Letter", icon: "👋", desc: "Official acknowledgment of resignation acceptance and release from duties", type: "employment", body: relLetterTemplate() },
  ];
}
