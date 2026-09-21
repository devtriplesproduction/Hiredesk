// Production overhaul verification test suite
console.log("=== Hiredesk Name Extractor Pipeline Overhaul Tests ===");

const COMMON_FIRSTNAMES = new Set([
  "sunita", "amit", "rohan", "mitali", "priya", "sneha", "neha", "ananya", "pooja", "riya", "meera",
  "shruti", "zara", "tanya", "ayesha", "simran", "deepika", "aditi", "kavya", "anushka", "rahul",
  "rohit", "arjun", "vikram", "raj", "dev", "ishaan", "siddharth", "aditya", "manish", "nikhil",
  "dhruv", "vivek", "abhishek", "saurabh", "gaurav", "kunal", "yash", "ajay", "vijay", "sunil",
  "anil", "sanjay", "aarav", "ram", "shyam", "harsh", "aman", "anisha"
]);

const COMMON_LASTNAMES = new Set([
  "madake", "kumar", "sharma", "patel", "singh", "gupta", "verma", "mehta", "shah", "joshi",
  "nair", "iyer", "reddy", "bose", "khanna", "malhotra", "kapoor", "desai", "pillai", "rao",
  "agarwal", "kumkar", "pangarkar"
]);

const ROLE_KEYWORDS = new Set([
  "developer", "engineer", "designer", "manager", "executive", "intern", "cameraman", "consultant",
  "specialist", "analyst", "lead", "director", "architect", "builder", "associate", "founder", "head",
  "administrator", "strategist", "expert", "officer", "coordinator", "assistant", "superviser",
  "programmer", "coder", "tester", "technician", "operator", "advisor", "counselor", "representative",
  "agent", "partner", "vp", "president", "chair"
]);

const NON_NAME_WORDS = new Set([
  "digital", "marketing", "sales", "design", "development", "experience", "education",
  "skills", "projects", "contact", "about", "profile", "summary", "work", "history",
  "professional", "personal", "technical", "key", "details", "information", "interests",
  "hobbies", "languages", "references", "certified", "certification", "certifications",
  "training", "courses", "achievements", "awards", "publications", "activities",
  "affiliations", "memberships", "declaration", "resume", "cv", "portfolio", "creative",
  "objective", "qualification", "qualifications", "career", "employment", "history",
  "academic", "activities", "extracurricular", "hiredesk", "curriculum", "vitae",
  "graphics", "fullstack", "frontend", "backend", "software", "hardware", "network",
  "systems", "cloud", "database", "security", "brand", "branding", "growth", "operations",
  "finance", "accounting", "recruiting", "recruiter", "talent", "acquisition", "hiring",
  "human", "resources", "support", "success", "service", "services", "solutions",
  "technology", "technologies", "innovations", "networks", "consulting", "strategy"
]);

const JUNK_KEYWORDS = new Set([
  "resume", "cv", "curriculum", "vitae", "profile", "portfolio", "page", "developer", "engineer",
  "designer", "manager", "executive", "intern", "cameraman", "consultant", "specialist", "analyst",
  "lead", "director", "architect", "builder", "associate", "student", "graduate", "fresher",
  "professional", "hiredesk", "copy", "final", "latest", "updated", "work", "experience", "education",
  "skills", "summary", "contact", "phone", "email", "address", "about", "me", "hobbies", "languages",
  "references", "project", "projects", "key", "technical", "personal", "microsoft", "word", "pdf",
  "document", "doc", "docx", "ver", "version", "v1", "v2", "v3", "v4", "v5", "temp", "template", "job",
  "application", "applying", "candidate", "applicant"
]);

const SALUTATIONS = /^(mr|ms|mrs|dr|prof|sir|er)\.?\s+/i;

function getLevenshteinDistance(a, b) {
  const tmp = [];
  for (let i = 0; i <= a.length; i++) {
    tmp[i] = [i];
  }
  for (let j = 0; j <= b.length; j++) {
    tmp[0][j] = j;
  }
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      tmp[i][j] = Math.min(
        tmp[i - 1][j] + 1,
        tmp[i][j - 1] + 1,
        tmp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
      );
    }
  }
  return tmp[a.length][b.length];
}

function fuzzyMatch(name1, name2) {
  if (!name1 || !name2) return false;
  const n1 = name1.toLowerCase().replace(/[^a-z]/g, "");
  const n2 = name2.toLowerCase().replace(/[^a-z]/g, "");
  if (n1 === n2) return true;
  if (n1.includes(n2) || n2.includes(n1)) return true;
  return getLevenshteinDistance(n1, n2) <= 2;
}

function splitMergedName(word) {
  if (!word || word.length < 3) return word;
  let split = word.replace(/([a-z])([A-Z])/g, "$1 $2");
  split = split.replace(/([A-Z]+)([A-Z][a-z]+)/g, "$1 $2");
  if (split !== word) return split;

  const lower = word.toLowerCase();
  for (let i = 3; i < lower.length - 2; i++) {
    const part1 = lower.slice(0, i);
    const part2 = lower.slice(i);
    if (COMMON_FIRSTNAMES.has(part1) && (COMMON_LASTNAMES.has(part2) || COMMON_FIRSTNAMES.has(part2))) {
      const p1Cap = part1.charAt(0).toUpperCase() + part1.slice(1);
      const p2Cap = part2.charAt(0).toUpperCase() + part2.slice(1);
      return `${p1Cap} ${p2Cap}`;
    }
  }
  return word;
}

function normalizeCandidateName(rawName) {
  let name = rawName.trim().replace(SALUTATIONS, "");
  name = name.replace(/[_\/\\%20]+/g, " ").replace(/\s+/g, " ").trim();
  const words = name.split(/\s+/).filter(Boolean);
  const processedWords = words.map(w => splitMergedName(w));
  const finalWords = processedWords.join(" ").trim().split(/\s+/).filter(Boolean);
  
  const titleCased = finalWords.map(w => {
    if (w.includes("-")) {
      return w.split("-").map(sub => sub.charAt(0).toUpperCase() + sub.slice(1).toLowerCase()).join("-");
    }
    if (w.includes(".") && w.length <= 4) return w.toUpperCase();
    if (w.length === 1) return w.toUpperCase();
    if (w === w.toUpperCase() && w.length >= 2 && w.length <= 4) {
      return w;
    }
    if (w === w.toUpperCase() || w === w.toLowerCase()) {
      return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
    }
    return w;
  });
  return titleCased.join(" ").trim();
}

function scoreAndValidateName(name) {
  const words = name.split(/\s+/).filter(Boolean);
  if (words.length < 1 || words.length > 6) return { isValid: false, reason: `Word count: ${words.length}` };
  if (name.length < 3 || name.length > 50) return { isValid: false, reason: `Char count: ${name.length}` };
  if (/[0-9]/.test(name)) return { isValid: false, reason: "Contains digit" };
  if (/[@#\$\%&\*\(\)\+=\{\}\[\]\|\\:;"'<>,\?/]/.test(name)) return { isValid: false, reason: "Contains symbol" };
  for (const w of words) {
    const cleanWord = w.toLowerCase().replace(/[^a-z]/g, "");
    if (JUNK_KEYWORDS.has(cleanWord) || NON_NAME_WORDS.has(cleanWord)) {
      return { isValid: false, reason: `Generic junk/non-name token: "${cleanWord}"` };
    }
  }
  const matchesRoleTitleOnly = words.every(w => {
    const clean = w.toLowerCase().replace(/[^a-z]/g, "");
    return ROLE_KEYWORDS.has(clean);
  });
  if (matchesRoleTitleOnly) {
    return { isValid: false, reason: "Matches Job/Role Title" };
  }
  return { isValid: true };
}

// 2. Overhaul Normalization & Splitting Cases
const normalizationTestCases = [
  { name: "Merged lowercase name (Dictionary split)", input: "SunitaMadake", expected: "Sunita Madake" },
  { name: "CamelCase Split (Standard transition)", input: "AmitKumarSharma", expected: "Amit Kumar Sharma" },
  { name: "ALL CAPS Split with mixed case tail", input: "ROHANSharma", expected: "Rohan Sharma" },
  { name: "1-Word initialed standard name", input: "A R Rahman", expected: "A R Rahman" },
  { name: "Salutation removal + 4 word name", input: "Dr APJ Abdul Kalam", expected: "APJ Abdul Kalam" },
  { name: "Hyphenated international name", input: "Jean-Pierre", expected: "Jean-Pierre" },
  { name: "Initials prefix and standard split", input: "Md Arif", expected: "Md Arif" }
];

// 3. Entity Disambiguation Test Cases
const entityTestCases = [
  { name: "Generic Profession Header", input: "DIGITAL MARKETING", expectedValid: false },
  { name: "Generic Job Role Title", input: "SOFTWARE DEVELOPER", expectedValid: false },
  { name: "ATS Section Header", input: "WORK EXPERIENCE", expectedValid: false },
  { name: "Valid Person Name (Dictionary)", input: "Anisha Pangarkar", expectedValid: true }
];

// 4. Fuzzy Matching & Levenshtein Checks
const fuzzyTestCases = [
  { name: "Exact Match", w1: "Anisha Pangarkar", w2: "Anisha Pangarkar", expectedMatch: true },
  { name: "Typo Levenshtein 1 Match", w1: "Anisha Pangarkar", w2: "An1sha Pangarkar", expectedMatch: true },
  { name: "Substring Match (Omitted Middle Name)", w1: "Anisha Pangarkar", w2: "Anisha", expectedMatch: true },
  { name: "Totally Different Names", w1: "Anisha Pangarkar", w2: "Sunita Madake", expectedMatch: false }
];

function runSuite() {
  let passed = 0;
  let totalTests = 0;

  console.log("\n=== PART 1: NORMALIZATION & DICTIONARY SPLITS ===");
  normalizationTestCases.forEach((tc, idx) => {
    totalTests++;
    const normalized = normalizeCandidateName(tc.input);
    const validation = scoreAndValidateName(normalized);
    
    console.log(`Test 1.${idx+1}: ${tc.name}`);
    console.log(`- Input: "${tc.input}" -> Normalized: "${normalized}" [${validation.isValid ? "VALID" : "INVALID"}]`);
    
    if (normalized.toLowerCase() === tc.expected.toLowerCase() && validation.isValid) {
      console.log("🟢 PASS");
      passed++;
    } else {
      console.log(`🔴 FAIL (Expected: "${tc.expected}", Got Valid: ${validation.isValid})`);
    }
  });

  console.log("\n=== PART 2: ENTITY DISAMBIGUATION (PERSON VS ROLE TITLE) ===");
  entityTestCases.forEach((tc, idx) => {
    totalTests++;
    const normalized = normalizeCandidateName(tc.input);
    const validation = scoreAndValidateName(normalized);
    
    console.log(`Test 2.${idx+1}: ${tc.name}`);
    console.log(`- Input: "${tc.input}" -> Normalized: "${normalized}" [${validation.isValid ? "VALID" : "INVALID"}]`);
    
    if (validation.isValid === tc.expectedValid) {
      console.log("🟢 PASS");
      passed++;
    } else {
      console.log(`🔴 FAIL (Expected Valid: ${tc.expectedValid}, Got Valid: ${validation.isValid})`);
    }
  });

  console.log("\n=== PART 3: LEVENSHTEIN FUZZY MATCHES ===");
  fuzzyTestCases.forEach((tc, idx) => {
    totalTests++;
    const match = fuzzyMatch(tc.w1, tc.w2);
    
    console.log(`Test 3.${idx+1}: ${tc.name}`);
    console.log(`- Compare: "${tc.w1}" <-> "${tc.w2}" -> Match: ${match}`);
    
    if (match === tc.expectedMatch) {
      console.log("🟢 PASS");
      passed++;
    } else {
      console.log(`🔴 FAIL (Expected Match: ${tc.expectedMatch}, Got Match: ${match})`);
    }
  });

  console.log(`\n=== Verification Complete: ${passed}/${totalTests} Passed ===`);
  return passed === totalTests;
}

runSuite();
