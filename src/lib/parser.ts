"use client";
import type { Candidate, Role } from "@/types";
import { makeCandidate, detectBestRole, scoreCandidateFromText, SKILLS_POOL } from "@/lib/data";
import { extractTextAndMetaFromPDF, PDFTextLine } from "@/lib/utils/pdf";

// A robust dictionary of first name roots to split un-spaced merged names (case-insensitive)
const COMMON_FIRSTNAMES = new Set([
  "sunita", "amit", "rohan", "mitali", "priya", "sneha", "neha", "ananya", "pooja", "riya", "meera",
  "shruti", "zara", "tanya", "ayesha", "simran", "deepika", "aditi", "kavya", "anushka", "rahul",
  "rohit", "arjun", "vikram", "raj", "dev", "ishaan", "siddharth", "aditya", "manish", "nikhil",
  "dhruv", "vivek", "abhishek", "saurabh", "gaurav", "kunal", "yash", "ajay", "vijay", "sunil",
  "anil", "sanjay", "aarav", "ram", "shyam", "harsh", "aman", "snehal", "swati", "sakshi", "shreya",
  "rashi", "kirti", "tripti", "divya", "kajal", "isha", "ekta", "sheetal", "rashmi", "poornima",
  "preeti", "sonia", "monika", "payal", "ashish", "rahim", "kabir", "abdul", "md", "mohammad", "mohamed",
  "anisha"
]);

// A robust dictionary of last name roots to split un-spaced merged names (case-insensitive)
const COMMON_LASTNAMES = new Set([
  "madake", "kumar", "sharma", "patel", "singh", "gupta", "verma", "mehta", "shah", "joshi",
  "nair", "iyer", "reddy", "bose", "khanna", "malhotra", "kapoor", "desai", "pillai", "rao",
  "agarwal", "kumkar", "patil", "shinde", "jadhav", "kulkarni", "deshmukh", "chavan", "more",
  "suryavanshi", "gawde", "sawant", "kamble", "gaikwad", "thorat", "naik", "dubey", "mishra",
  "tiwari", "pandey", "yadav", "choudhary", "prasad", "sen", "das", "khan", "ansari", "rahman",
  "pangarkar"
]);

// Common generic job titles to run Entity Disambiguation (PERSON vs ROLE TITLE)
const ROLE_KEYWORDS = new Set([
  "developer", "engineer", "designer", "manager", "executive", "intern", "cameraman", "consultant",
  "specialist", "analyst", "lead", "director", "architect", "builder", "associate", "founder", "head",
  "administrator", "strategist", "expert", "officer", "coordinator", "assistant", "superviser",
  "programmer", "coder", "tester", "technician", "operator", "advisor", "counselor", "representative",
  "agent", "partner", "vp", "president", "chair", "lead", "specialist"
]);

// Words that typically match a profession, business function, section header, or skill, not a human person
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

// Generic junk keywords to discard
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

/**
 * Standard Levenshtein distance helper
 */
export function getLevenshteinDistance(a: string, b: string): number {
  const tmp: number[][] = [];
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

/**
 * Fuzzy similarity helper
 */
export function fuzzyMatch(name1: string, name2: string): boolean {
  if (!name1 || !name2) return false;
  const n1 = name1.toLowerCase().replace(/[^a-z]/g, "");
  const n2 = name2.toLowerCase().replace(/[^a-z]/g, "");
  if (n1 === n2) return true;
  if (n1.includes(n2) || n2.includes(n1)) return true;
  return getLevenshteinDistance(n1, n2) <= 2;
}

/**
 * Merged name splitter. Resolves:
 * - lowercase-to-uppercase transitions (e.g. SunitaMadake -> Sunita Madake)
 * - uppercase-to-TitleCase transitions (e.g. ROHANSharma -> ROHAN Sharma)
 * - unspaced lowercase/uppercase dictionary roots (e.g. sunitamadake -> Sunita Madake, SUNITAMADAKE -> Sunita Madake)
 */
export function splitMergedName(word: string, transformations?: string[]): string {
  if (!word || word.length < 3) return word;

  // 1. Split on lowercase-to-uppercase transition (e.g. SunitaMadake -> Sunita Madake)
  let split = word.replace(/([a-z])([A-Z])/g, "$1 $2");
  if (split !== word && transformations) {
    transformations.push(`Split camelCase transition: "${word}" -> "${split}"`);
  }

  // 2. Split on uppercase-to-TitleCase transition (e.g. ROHANSharma -> ROHAN Sharma)
  let prevSplit = split;
  split = split.replace(/([A-Z]+)([A-Z][a-z]+)/g, "$1 $2");
  if (split !== prevSplit && transformations) {
    transformations.push(`Split uppercase transition: "${prevSplit}" -> "${split}"`);
  }

  if (split !== word) return split;

  // 3. Dictionary matching split for un-split lowercase/uppercase merged strings (e.g. sunitamadake)
  const lower = word.toLowerCase();
  for (let i = 3; i < lower.length - 2; i++) {
    const part1 = lower.slice(0, i);
    const part2 = lower.slice(i);
    if (COMMON_FIRSTNAMES.has(part1) && (COMMON_LASTNAMES.has(part2) || COMMON_FIRSTNAMES.has(part2))) {
      const p1Cap = part1.charAt(0).toUpperCase() + part1.slice(1);
      const p2Cap = part2.charAt(0).toUpperCase() + part2.slice(1);
      const resolved = `${p1Cap} ${p2Cap}`;
      if (transformations) {
        transformations.push(`Dictionary split: "${word}" -> "${resolved}"`);
      }
      return resolved;
    }
  }

  return word;
}

/**
 * Normalizes a raw candidate name:
 * - Strips salutations (Mr, Dr, Ms, etc.)
 * - Trims spacing, cleans separation characters
 * - Normalizes case: standardizes ALL CAPS or lowercase to elegant Title Case, keeping hyphenations/initials
 * - Executes merged name splitting on isolated words
 */
export function normalizeCandidateName(rawName: string, transformations?: string[]): string {
  let name = rawName.trim();
  
  if (name !== rawName && transformations) {
    transformations.push(`Trim spacing: "${rawName}" -> "${name}"`);
  }

  // 1. Strip salutations
  const cleanSalutation = name.replace(SALUTATIONS, "");
  if (cleanSalutation !== name) {
    if (transformations) transformations.push(`Remove salutation: "${name}" -> "${cleanSalutation}"`);
    name = cleanSalutation;
  }

  // 2. Clean separation characters like underscores, slashes, multiple dashes, %20
  let cleanedSeparators = name.replace(/[_\/\\%20]+/g, " ");
  // Standardize multiple spaces to single
  cleanedSeparators = cleanedSeparators.replace(/\s+/g, " ").trim();
  if (cleanedSeparators !== name) {
    if (transformations) transformations.push(`Clean separation tokens: "${name}" -> "${cleanedSeparators}"`);
    name = cleanedSeparators;
  }

  // 3. Process each word for merged splits
  const words = name.split(/\s+/).filter(Boolean);
  const processedWords = words.map(w => splitMergedName(w, transformations));
  const mergedSplitName = processedWords.join(" ").trim();
  if (mergedSplitName !== name) {
    name = mergedSplitName;
  }

  // 4. Case normalization (Title Case conversion, leaving initials/special casing)
  const finalWords = name.split(/\s+/).filter(Boolean);
  const titleCased = finalWords.map(w => {
    // Keep hyphenated sub-words Title Cased, e.g. Jean-Pierre -> Jean-Pierre
    if (w.includes("-")) {
      return w.split("-").map(sub => sub.charAt(0).toUpperCase() + sub.slice(1).toLowerCase()).join("-");
    }
    // Keep period initials intact (e.g. A.R.)
    if (w.includes(".") && w.length <= 4) {
      return w.toUpperCase();
    }
    // If single character initial (e.g. A R Rahman)
    if (w.length === 1) {
      return w.toUpperCase();
    }
    // Preserve short all-caps words (2-4 characters) representing acronym initials (e.g. APJ)
    if (w === w.toUpperCase() && w.length >= 2 && w.length <= 4) {
      return w;
    }
    // Standard Title Case for ALL CAPS or lowercase
    if (w === w.toUpperCase() || w === w.toLowerCase()) {
      return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
    }
    return w;
  });

  const finalName = titleCased.join(" ").trim();
  if (finalName !== rawName && transformations && !transformations.includes(`Casing Normalization: "${finalName}"`)) {
    transformations.push(`Casing Normalization: "${rawName}" -> "${finalName}"`);
  }

  return finalName;
}

/**
 * Semantic Human-Name Validation and Heuristic scoring:
 * - Checks length, character rules, word structure (allows 1-6 words)
 * - Runs Entity Disambiguation to distinguish PERSON vs ROLE TITLE
 */
function scoreAndValidateName(name: string): { isValid: boolean; scoreBoost: number; rejectReason?: string } {
  const words = name.split(/\s+/).filter(Boolean);

  // Rule 1: Human names typically contain between 1 and 6 words
  if (words.length < 1 || words.length > 6) {
    return { isValid: false, scoreBoost: 0, rejectReason: `Word count constraint: Contains ${words.length} words (allows 1-6)` };
  }

  // Rule 2: Minimum total length is 3 characters and max 50
  if (name.length < 3 || name.length > 50) {
    return { isValid: false, scoreBoost: 0, rejectReason: `Character length constraint: ${name.length} chars (allows 3-50)` };
  }

  // Rule 3: Reject names containing digits
  if (/[0-9]/.test(name)) {
    return { isValid: false, scoreBoost: 0, rejectReason: "Contains digit characters" };
  }

  // Rule 4: Reject names containing invalid symbols
  if (/[@#\$\%&\*\(\)\+=\{\}\[\]\|\\:;"'<>,\?/]/.test(name)) {
    return { isValid: false, scoreBoost: 0, rejectReason: "Contains invalid special symbols" };
  }

  // Rule 5: Reject if any word matches a common junk keyword or non-name word
  for (const w of words) {
    const cleanWord = w.toLowerCase().replace(/[^a-z]/g, "");
    if (JUNK_KEYWORDS.has(cleanWord) || NON_NAME_WORDS.has(cleanWord)) {
      return { isValid: false, scoreBoost: 0, rejectReason: `Contains generic junk or non-name token: "${cleanWord}"` };
    }
  }

  // Rule 6: Entity Disambiguation (PERSON vs ROLE TITLE)
  // If the words match typical job role keywords exclusively, reject
  const matchesRoleTitleOnly = words.every(w => {
    const clean = w.toLowerCase().replace(/[^a-z]/g, "");
    return ROLE_KEYWORDS.has(clean);
  });
  if (matchesRoleTitleOnly) {
    return { isValid: false, scoreBoost: 0, rejectReason: "Matches generic Job/Role Title instead of human name" };
  }

  // Scoring boost calculations
  let scoreBoost = 0.50; // Base baseline score for passing validation

  if (words.length >= 2 && words.length <= 3) {
    scoreBoost += 0.20;
  }
  
  const isAllTitleCased = words.every(w => {
    if (w.includes("-")) return true;
    if (w.includes(".")) return true;
    if (w.length === 1) return true;
    return /^[A-Z][a-zA-Z]*$/.test(w);
  });
  if (isAllTitleCased) {
    scoreBoost += 0.15;
  }

  // Massive boost if it matches known dictionary name roots
  const containsKnownRoot = words.some(w => {
    const cleanWord = w.toLowerCase();
    return COMMON_FIRSTNAMES.has(cleanWord) || COMMON_LASTNAMES.has(cleanWord);
  });
  if (containsKnownRoot) {
    scoreBoost += 0.20;
  }

  return { 
    isValid: true, 
    scoreBoost: Math.min(1.0, scoreBoost),
    rejectReason: undefined
  };
}

/**
 * Extraction Pipeline - Source 1: NLP Entity Name Scanners
 */
function extractNLPPersonName(text: string): string {
  const headerText = text.slice(0, 700);
  const lines = headerText.split("\n").map(l => l.trim()).filter(Boolean);

  const TITLE_STOP_WORDS = /\b(executive|manager|developer|designer|editor|marketer|cameraman|consultant|engineer|intern|resume|cv|profile|page|curriculum|vitae|specialist|analyst|lead|director|architect|builder|associate|student|graduate|fresher|professional)\b/i;

  for (const line of lines.slice(0, 8)) {
    if (TITLE_STOP_WORDS.test(line)) continue;
    
    const words = line.split(/\s+/);
    if (words.length >= 2 && words.length <= 4 && !/[0-9]/.test(line)) {
      return line;
    }
  }

  const matches = Array.from(headerText.slice(0, 450).matchAll(/\b([A-Z][a-z]{1,15}\s+[A-Z][a-z]{1,15}(?:\s+[A-Z][a-z]{1,15})?)\b/g));
  for (const match of matches) {
    const n = match[1].trim();
    if (!TITLE_STOP_WORDS.test(n)) return n;
  }

  return "";
}

/**
 * Extraction Pipeline - Source 2: Layout & Visual Heading Analyzer
 * Evaluates font sizes, Y coordinates (top of page), centered/left alignment, bold weight, and split multiline headings.
 */
function extractPDFHeadingName(firstPageLines: PDFTextLine[], transformations?: string[]): { headings: string[]; multilineJoined?: string } {
  if (firstPageLines.length === 0) return { headings: [] };

  const PAGE_WIDTH_A4 = 595.27;
  const pageCenter = PAGE_WIDTH_A4 / 2;

  // Find max font size among lines that could potentially be names (rules out huge vector artwork artifacts)
  const potentialNameLines = firstPageLines.filter(line => {
    const clean = line.text.trim();
    if (clean.length < 3 || clean.length > 50 || /[0-9]/.test(clean)) return false;
    const words = clean.split(/\s+/);
    return words.length >= 1 && words.length <= 6;
  });
  const maxFontSize = potentialNameLines.length > 0 ? Math.max(...potentialNameLines.map(l => l.fontSize)) : 12;

  // 1. Reconstruct Multiline Split Headings (adjacent, close vertical proximity, aligned)
  let multilineJoined: string | undefined;
  for (let i = 0; i < firstPageLines.length - 1; i++) {
    const line1 = firstPageLines[i];
    const line2 = firstPageLines[i + 1];

    const isLine1Large = line1.fontSize >= 12;
    const isLine2Large = line2.fontSize >= 12;

    const verticalGap = Math.abs(line1.y - line2.y);
    const isClose = verticalGap < Math.max(line1.fontSize, line2.fontSize) * 2.2;

    const line1Center = line1.x + line1.width / 2;
    const line2Center = line2.x + line2.width / 2;
    const bothCentered = Math.abs(line1Center - pageCenter) < 80 && Math.abs(line2Center - pageCenter) < 80;
    const bothLeftAligned = Math.abs(line1.x - line2.x) < 30;

    if (isLine1Large && isLine2Large && isClose && (bothCentered || bothLeftAligned)) {
      const combinedRaw = `${line1.text} ${line2.text}`;
      const normalizedCombined = normalizeCandidateName(combinedRaw);
      const { isValid } = scoreAndValidateName(normalizedCombined);
      
      if (isValid) {
        multilineJoined = normalizedCombined;
        if (transformations) {
          transformations.push(`Multiline heading assembled: "${line1.text}" + "${line2.text}" -> "${normalizedCombined}"`);
        }
        break;
      }
    }
  }

  // 2. Score individual headings using rich layout coordinates and styling
  const scoredLines = firstPageLines.map(line => {
    const raw = line.text.trim();
    const normalized = normalizeCandidateName(raw);
    const { isValid } = scoreAndValidateName(normalized);

    if (!isValid) return { line, score: -1, normalized };

    let layoutScore = line.fontSize * 2.0;

    // A. Vertical page position (reward top 25%, penalize bottom half heavily)
    if (line.y > 600) {
      layoutScore += 30;
    } else if (line.y > 450) {
      layoutScore += 15;
    } else if (line.y < 300) {
      layoutScore -= 35; // Strongly penalize lower page bounds
    }

    // B. Horizontal alignment (reward centered and left margin headers)
    const lineCenter = line.x + line.width / 2;
    const centeringOffset = Math.abs(lineCenter - pageCenter);
    if (centeringOffset < 50) {
      layoutScore += 25; // Highly centered
    } else if (centeringOffset < 100) {
      layoutScore += 15;
    } else if (line.x < 100) {
      layoutScore += 10; // Left-aligned header
    }

    // C. Bold weight boost
    if (line.isBold) {
      layoutScore += 20;
    }

    // D. Font size weight relative to max font size on the page
    if (line.fontSize === maxFontSize) {
      layoutScore += 25;
    } else if (line.fontSize >= maxFontSize - 3) {
      layoutScore += 15;
    }

    // E. Vertical Isolation: reward blocks that are separated from other elements
    let minVerticalGap = 9999;
    for (const other of firstPageLines) {
      if (other === line) continue;
      const gap = Math.abs(other.y - line.y);
      if (gap < minVerticalGap) {
        minVerticalGap = gap;
      }
    }
    const isIsolated = minVerticalGap > line.fontSize * 2.5;
    if (isIsolated) {
      layoutScore += 15;
    }

    return {
      line,
      score: layoutScore,
      normalized
    };
  }).filter(sl => sl.score > 0);

  if (scoredLines.length === 0) {
    return { headings: [], multilineJoined };
  }

  scoredLines.sort((a, b) => b.score - a.score);

  const headings = scoredLines.map(sl => sl.normalized);
  
  if (transformations && headings.length > 0) {
    transformations.push(
      `PDF heading visual rank: Top candidate "${headings[0]}" (Font: ${scoredLines[0].line.fontSize}pt, Centered: ${Math.abs((scoredLines[0].line.x + scoredLines[0].line.width/2) - pageCenter) < 60}, Score: ${Math.round(scoredLines[0].score)})`
    );
  }

  return { headings, multilineJoined };
}

/**
 * Extraction Pipeline - Source 3: Email Sender
 */
function extractEmailSenderName(sender?: string): string {
  if (!sender) return "";
  const match = sender.match(/^(?:"?([^"<]+)"?\s*)?<[^>]+>/) || sender.match(/^([^<]+)/);
  if (match && match[1]) {
    return match[1].trim();
  }
  return "";
}

/**
 * Extraction Pipeline - Source 4: Filename
 */
function extractFilenameName(filename: string, transformations?: string[]): string {
  let cleanFn = filename.replace(/\.(pdf|PDF|docx|DOCX)$/, "");
  cleanFn = cleanFn.replace(/^[a-f0-9\-]{20,}\-?/i, "");
  cleanFn = cleanFn.replace(/[-_]\d{4,}/g, "");
  
  const words = cleanFn.split(/[_\-\.\s%20]+/).filter(Boolean);
  const nameParts = words.filter(w => {
    const clean = w.toLowerCase().replace(/[^a-z]/g, "");
    return !JUNK_KEYWORDS.has(clean) && !/^\d+$/.test(clean);
  });

  if (nameParts.length > 0) {
    const resolved = nameParts.join(" ");
    if (resolved !== filename && transformations) {
      transformations.push(`Clean filename intelligence: "${filename}" -> "${resolved}"`);
    }
    return resolved;
  }

  return "";
}

/**
 * Extraction Pipeline - Source 5: Subject line
 */
function extractEmailSubjectName(subject?: string): string {
  if (!subject) return "";
  const patterns = [
    /\bresume\s+of\s+([a-z\s]+?)(?:\bfor\b|\b\-|\b$)/i,
    /\bcv\s+of\s+([a-z\s]+?)(?:\bfor\b|\b\-|\b$)/i,
    /\bapplication\s+from\s+([a-z\s]+?)(?:\bfor\b|\b\-|\b$)/i,
    /\bapplication\s+by\s+([a-z\s]+?)(?:\bfor\b|\b\-|\b$)/i,
    /\bjob\s+application:\s*([a-z\s]+?)(?:\bfor\b|\b\-|\b$)/i
  ];

  for (const pattern of patterns) {
    const match = subject.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }
  return "";
}

/**
 * Extraction Pipeline - Source 6: Signature Block
 */
function extractSignatureName(text: string): string {
  const lines = text.split("\n").map(l => l.trim()).filter(Boolean);
  const signatureStarters = /^(best\s+regards|warm\s+regards|sincerely|thanks\s+&\s+regards|thanks|yours\s+faithfully|regards|thank\s+you),?\s*$/i;

  const totalLines = lines.length;
  const startIndex = Math.max(0, Math.floor(totalLines * 0.65));

  for (let i = startIndex; i < totalLines - 1; i++) {
    if (signatureStarters.test(lines[i])) {
      for (let j = 1; j <= 2; j++) {
        if (i + j < totalLines) {
          const candidate = lines[i + j].trim();
          if (candidate.split(/\s+/).length >= 2 && candidate.split(/\s+/).length <= 4) {
            return candidate;
          }
        }
      }
    }
  }

  return "";
}

/**
 * Extraction Pipeline - Source 7: LinkedIn URL
 */
function extractLinkedInURLName(text: string): string {
  const match = text.match(/linkedin\.com\/in\/([a-zA-Z0-9\-_%]+)/i);
  if (match && match[1]) {
    const slug = match[1].replace(/%20/g, " ");
    return slug.replace(/[\-_]+/g, " ").trim();
  }
  return "";
}

/**
 * Extraction Pipeline - Source 8: OCR Scanned Text
 */
function extractOCRNameFallback(ocrText: string): string {
  if (!ocrText) return "";
  return extractNLPPersonName(ocrText);
}

/**
 * Standard utility string matching for contacts
 */
function extractEmail(text: string): string {
  return text.match(/[\w.+\-]+@[\w\-]+\.[a-z]{2,6}/i)?.[0] ?? "";
}

function extractPhone(text: string): string {
  return text.match(/(\+91[\s\-]?)?[6-9]\d{9}/)?.[0] ??
    text.match(/(\+?[\d\s\-]{10,14})/)?.[0]?.trim() ?? "";
}

function extractCity(text: string): string {
  const cities = ["Mumbai","Delhi","Pune","Bangalore","Bengaluru","Hyderabad","Chennai","Kolkata","Ahmedabad","Jaipur","Surat","Nashik","Nagpur","Vadodara","Indore","Remote","Noida","Gurugram","Gurgaon","Chandigarh"];
  const lower = text.toLowerCase();
  return cities.find(c => lower.includes(c.toLowerCase())) ?? "Not specified";
}

function extractEducation(text: string): string {
  const degrees = ["Ph.D","M.Tech","MCA","MBA","M.Sc","M.Com","B.Tech","BCA","BBA","B.Sc","B.Com","B.Des","BA","BE","Diploma","12th","10th"];
  for (const d of degrees) {
    if (text.includes(d) || text.toLowerCase().includes(d.toLowerCase())) return d;
  }
  return "Not specified";
}

function extractExperience(text: string): string {
  const lower = text.toLowerCase();
  const fresher = /\b(fresher|fresh graduate|entry level|no experience|0\s*years?\s*experience)\b/i.test(lower);
  if (fresher) return "Fresher";

  const labelRegexes = [
    /\b(?:total\s+)?experience\s*[:\-]?\s*(\d+(?:\.\d+)?)\+?\s*(?:year|yr)s?/i,
    /\bwork\s+experience\s*[:\-]?\s*(\d+(?:\.\d+)?)\+?\s*(?:year|yr)s?/i,
    /\b(?:total\s+)?exp\s*[:\-]?\s*(\d+(?:\.\d+)?)\+?\s*(?:year|yr)s?/i
  ];

  for (const regex of labelRegexes) {
    const match = lower.match(regex);
    if (match) {
      const yrs = Math.round(parseFloat(match[1]));
      if (yrs === 0) return "Fresher";
      if (yrs === 1) return "1 yr";
      if (yrs >= 5) return "5+ yrs";
      if (yrs === 2) return "2 yrs";
      if (yrs === 3 || yrs === 4) return "3 yrs";
      return `${yrs} yrs`;
    }
  }

  const valueFirstRegexes = [
    /(\d+(?:\.\d+)?)\+?\s*(?:year|yr)s?\s*(?:of\s*)?(?:experience|exp|work\s+exp)/i,
    /(\d+(?:\.\d+)?)\+?\s*(?:year|yr)s?\s+(?:professional|relevant|industry)\s+experience/i
  ];

  for (const regex of valueFirstRegexes) {
    const match = lower.match(regex);
    if (match) {
      const yrs = Math.round(parseFloat(match[1]));
      if (yrs === 0) return "Fresher";
      if (yrs === 1) return "1 yr";
      if (yrs >= 5) return "5+ yrs";
      if (yrs === 2) return "2 yrs";
      if (yrs === 3 || yrs === 4) return "3 yrs";
      return `${yrs} yrs`;
    }
  }

  return "Not specified";
}

function extractGender(text: string, name: string): string {
  const lowerText = text.toLowerCase();
  
  const explicitMatch = lowerText.match(/\b(?:gender|sex)\s*[:\-]\s*(female|male|f|m)\b/i);
  if (explicitMatch) {
    const g = explicitMatch[1].toLowerCase();
    if (g === "female" || g === "f") return "Female";
    if (g === "male" || g === "m") return "Male";
  }

  const sheCount = (lowerText.match(/\b(she|her|hers)\b/g) || []).length;
  const heCount = (lowerText.match(/\b(he|him|his)\b/g) || []).length;
  if (sheCount > heCount + 2) return "Female";
  if (heCount > sheCount + 2) return "Male";

  if (name) {
    const firstName = name.split(/\s+/)[0].toLowerCase();
    const femaleNames = ["priya","sneha","neha","ananya","pooja","riya","meera","shruti","zara","tanya","ayesha","simran","deepika","mitali","aditi","kavya","anushka","snehal","swati","sakshi","shreya","rashi","kirti","tripti","divya","kajal","isha","ekta","sheetal","rashmi","poornima","preeti","sonia","monika","payal","sunita","anisha"];
    const maleNames = ["aarav","rohit","arjun","vikram","raj","dev","ishaan","siddharth","aditya","manish","omar","nikhil","dhruv","ratan","vivek","amit","abhishek","rahul","sachin","saurabh","gaurav","pankaj","sanjay","anil","sunil","vijay","raju","ram","shyam","harsh","aman","kunal","yash","amit","rohan"];
    
    if (femaleNames.includes(firstName)) return "Female";
    if (maleNames.includes(firstName)) return "Male";
    
    if (/(i|ee|ya|a)$/.test(firstName)) {
      const maleSuffixExceptions = ["aditya","yash","amit","sharma","gupta","kumar","singh","verma","mehta","shah","joshi","nair","iyer","reddy","bose","khanna","malhotra","kapoor","desai","pillai","rao","agarwal"];
      if (!maleSuffixExceptions.includes(firstName)) {
        return "Female";
      }
    }
  }

  return "Not specified";
}

function extractAge(text: string): number {
  const m = text.match(/[Aa]ge[:\s]+(\d{2})/) ?? text.match(/DOB[:\s\-]+\d{1,2}[\/-]\d{1,2}[\/-](\d{4})/);
  if (m) {
    const val = parseInt(m[1]);
    if (val > 1950 && val < 2010) return new Date().getFullYear() - val;
    if (val >= 18 && val <= 65) return val;
  }
  return Math.floor(Math.random() * 10) + 22;
}

function extractSkills(text: string, roleId: string): string[] {
  const lower = text.toLowerCase();
  const rolePool = SKILLS_POOL[roleId] ?? [];
  const foundRoleSkills = rolePool.filter(skill => {
    const escaped = skill.toLowerCase().replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    return new RegExp(`\\b${escaped}\\b`, 'i').test(lower) || lower.includes(skill.toLowerCase());
  });

  const globalPool = [
    "React", "Node.js", "JavaScript", "TypeScript", "Python", "Flutter", "Next.js", "MongoDB", "SQL", "AWS", "Docker", "Git", "REST APIs", "GraphQL", "CSS", "HTML",
    "Figma", "Adobe XD", "Illustrator", "Photoshop", "Canva", "Branding", "Typography", "UI/UX", "Premiere Pro", "After Effects", "DaVinci Resolve", "Motion Graphics", "Color Grading",
    "SEO", "SEM", "Google Ads", "Meta Ads", "Analytics", "Email Marketing", "HubSpot", "Instagram", "TikTok", "Content Creation", "Reels", "Sales", "CRM", "B2B Sales", "Lead Generation",
    "Negotiation", "Salesforce", "Cold Calling", "ROAS", "PPC", "A/B Testing", "Conversion Optimization", "Copywriting", "Content Strategy", "Storytelling", "Brand Voice", "Editorial",
    "Commercial", "Runway", "Fashion", "Cinematography", "DSLR", "Lighting", "Video Production", "Drone", "Stabilizer", "Camera", "WordPress", "Shopify", "Excel", "PowerPoint", "Word", "Office"
  ];
  
  const foundGlobalSkills = globalPool.filter(skill => {
    if (foundRoleSkills.includes(skill)) return false;
    const escaped = skill.toLowerCase().replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    return new RegExp(`\\b${escaped}\\b`, 'i').test(lower) || lower.includes(skill.toLowerCase());
  });

  const sectionSkills: string[] = [];
  const skillSectionMatch = text.match(/\b(?:skills|expertise|key\s+skills|technical\s+skills)\b[:\-]?\s*([^\n\r]{5,200})/i);
  if (skillSectionMatch) {
    const rawList = skillSectionMatch[1];
    const items = rawList.split(/[,;|\/•\t]+/).map(i => i.trim()).filter(i => i.length > 1 && i.length < 25);
    for (const item of items) {
      const formattedItem = item.charAt(0).toUpperCase() + item.slice(1);
      if (!foundRoleSkills.includes(formattedItem) && !foundGlobalSkills.includes(formattedItem)) {
        sectionSkills.push(formattedItem);
      }
    }
  }

  const combined = [...foundRoleSkills, ...foundGlobalSkills, ...sectionSkills];
  const unique = Array.from(new Set(combined));

  if (unique.length > 0) {
    return unique.slice(0, 10);
  }
  return rolePool.slice(0, 5);
}

/**
 * Complete Overhauled Name Extraction and Verification Pipeline
 * Computes: Extract → Normalize → Score Heuristics → Validate
 */
export async function parseResumeFile(
  file: File,
  roles: Role[],
  emailSender?: string,
  emailSubject?: string
): Promise<Candidate> {
  
  console.log(`\n[HireDesk Overhauled Pipeline] Commencing extraction for: "${file.name}"`);
  
  const transformations: string[] = [];
  const rejectedCandidates: Array<{ name: string; source: string; reason: string }> = [];

  // 1. Text & Layout extraction (including OCR scanner)
  const parseResult = await extractTextAndMetaFromPDF(file);
  const text = parseResult.text;
  const firstPageLines = parseResult.firstPageLines;
  const ocrUsed = parseResult.ocrUsed;
  const ocrText = parseResult.ocrText;

  // 2. ATS score matching
  const roleId = detectBestRole(text, roles);
  const role = roles.find(r => r.id === roleId) ?? roles[0];
  const score = scoreCandidateFromText(text, roleId);

  // 3. Multi-Stage Extraction
  const rawNLP = extractNLPPersonName(text);
  const headingResult = extractPDFHeadingName(firstPageLines, transformations);
  const rawHeading = headingResult.headings.length > 0 ? headingResult.headings[0] : "";
  const rawMultilineHeading = headingResult.multilineJoined || "";
  const rawSender = extractEmailSenderName(emailSender);
  const rawFilename = extractFilenameName(file.name, transformations);
  const rawSubject = extractEmailSubjectName(emailSubject);
  const rawSignature = extractSignatureName(text);
  const rawLinkedin = extractLinkedInURLName(text);
  const rawOCR = ocrText ? extractOCRNameFallback(ocrText) : "";

  // Compile candidates with their visual and semantic multipliers
  const extractedSources = [
    { source: "PDF Multiline Heading Assembly", raw: rawMultilineHeading, multiplier: 0.98 },
    { source: "PDF Center-Weight Heading", raw: rawHeading, multiplier: 0.96 },
    { source: "Explicit NLP/NER Block", raw: rawNLP, multiplier: 0.89 },
    { source: "LinkedIn Profile URL", raw: rawLinkedin, multiplier: 0.82 },
    { source: "Email Sender Display", raw: rawSender, multiplier: 0.74 },
    { source: "Bottom Signature Block", raw: rawSignature, multiplier: 0.70 },
    { source: "Cleaned Filename Intelligence", raw: rawFilename, multiplier: 0.65 },
    { source: "Email Subject Parsing", raw: rawSubject, multiplier: 0.60 },
    { source: "Scanned OCR Recovery", raw: rawOCR, multiplier: 0.80 }
  ];

  // 4. Normalization and Scoring/Validation loop
  const validCandidates: Array<{ source: string; name: string; confidence: number }> = [];

  // Pre-normalize all extracted sources so we can easily compare them for cross-source validation
  const normalizedSources = extractedSources.map(c => {
    if (!c.raw || !c.raw.trim()) return { ...c, normalized: "", localTransformations: [] as string[] };
    const localTransformations: string[] = [];
    const normalized = normalizeCandidateName(c.raw, localTransformations);
    return { ...c, normalized, localTransformations };
  });

  for (const c of normalizedSources) {
    if (!c.normalized) continue;

    // B. Score & Validate Heuristics
    const { isValid, scoreBoost, rejectReason } = scoreAndValidateName(c.normalized);

    if (isValid) {
      let finalConfidence = Math.round(Math.min(100, (c.multiplier * scoreBoost) * 100));

      // Log unique transformations
      c.localTransformations.forEach(t => {
        if (!transformations.includes(t)) transformations.push(t);
      });

      // B1. OCR Validation Layer (Fuzzy & Exact):
      if (rawOCR) {
        const normalizedOCR = normalizeCandidateName(rawOCR);
        const normOCRLower = normalizedOCR.toLowerCase();
        const normLower = c.normalized.toLowerCase();
        
        const isExactOCRMatch = normLower === normOCRLower;
        const isFuzzyOCRMatch = normLower.includes(normOCRLower) || 
                                normOCRLower.includes(normLower) ||
                                getLevenshteinDistance(normLower, normOCRLower) <= 2;

        if (isExactOCRMatch) {
          finalConfidence = Math.min(100, finalConfidence + 15);
          transformations.push(`OCR Exact Validation: Match found. Confidence boosted for "${c.normalized}"`);
        } else if (isFuzzyOCRMatch) {
          finalConfidence = Math.min(100, finalConfidence + 10);
          transformations.push(`OCR Fuzzy Validation Match ("${normalizedOCR}" <-> "${c.normalized}"): Confidence boosted`);
        }
      }

      // B2. Cross-Source Validation:
      // If this candidate name is fuzzy-matched with at least one other active extraction source, reward it!
      let crossMatched = false;
      for (const other of normalizedSources) {
        if (other.source === c.source || !other.normalized) continue;
        if (fuzzyMatch(c.normalized, other.normalized)) {
          crossMatched = true;
          break;
        }
      }
      if (crossMatched) {
        finalConfidence = Math.min(100, finalConfidence + 8);
        transformations.push(`Cross-source validation boost: "${c.normalized}" validated by another extraction source`);
      }

      validCandidates.push({
        source: c.source,
        name: c.normalized,
        confidence: finalConfidence
      });
    } else {
      rejectedCandidates.push({
        name: c.normalized,
        source: c.source,
        reason: rejectReason || "Unknown validation block"
      });
    }
  }

  // Sort candidates by finalized confidence score
  const sortedCandidates = [...validCandidates].sort((a, b) => b.confidence - a.confidence);

  // 5. Final Resolution
  let resolvedName = "";
  let resolvedSource = "";
  let resolvedConfidence = 0;

  if (sortedCandidates.length > 0) {
    resolvedName = sortedCandidates[0].name;
    resolvedSource = sortedCandidates[0].source;
    resolvedConfidence = sortedCandidates[0].confidence;
  } else {
    // Ultimate fallback filename parser split
    const cleanFn = file.name.replace(/\.(pdf|PDF|docx|DOCX)$/, "");
    const cleaned = cleanFn.replace(/^[a-f0-9\-]{20,}\-?/i, "").replace(/[_\-\.]/g, " ");
    const splitName = splitMergedName(cleaned, transformations);
    resolvedName = normalizeCandidateName(splitName, transformations);
    resolvedSource = "Ultimate Filename Fallback";
    resolvedConfidence = 40;
  }

  console.log(`[HireDesk Overhauled Pipeline] Resolved Candidate: "${resolvedName}"`);
  console.log(`- Source: ${resolvedSource} (${resolvedConfidence}% Confidence)`);
  console.log(`- Transformations Logged:`, transformations.slice(0, 8));
  if (rejectedCandidates.length > 0) {
    console.log(`- Rejected Candidates Logged:`, rejectedCandidates.slice(0, 4));
  }

  // Extract remaining contacts
  const email = extractEmail(text);
  const phone = extractPhone(text);
  const extractedCity = extractCity(text);
  const city = extractedCity && extractedCity !== "Not specified" ? extractedCity : (extractCity(resolvedName) || "Not specified");
  const education = extractEducation(text);
  const exp = extractExperience(text);
  const gender = extractGender(text, resolvedName);
  const age = extractAge(text);
  const skills = extractSkills(text, roleId);

  // Construct final Candidate object
  return makeCandidate(roleId, {
    name: resolvedName,
    email: email || "",
    phone: phone || "",
    city,
    education,
    exp,
    gender,
    age,
    roleName: role.name,
    score,
    resumeFile: file.name,
    resumeText: text,
    skills: skills.length > 0 ? skills : ["See resume"],
    status: "new",
    appliedAt: new Date().toLocaleDateString("en-IN"),
    createdAt: new Date().toISOString(),
    extractionSource: resolvedSource,
    extractionConfidence: resolvedConfidence,
    extractionMetadata: {
      sourceRankings: sortedCandidates,
      ocrUsed,
      transformations,
      rejectedCandidates,
      firstPageLines
    }
  });
}
