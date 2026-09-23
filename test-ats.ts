import { calculateMatchScore } from "./src/lib/data";

const resumeText = "I am a frontend developer with experience in React and TypeScript. I have worked with GraphQL APIs. Total experience: 3 years. Education: B.Tech in CS.";

const info = {
  name: "John Doe",
  email: "john@example.com",
  phone: "1234567890",
  city: "Mumbai",
  education: "B.Tech",
  exp: "3 yrs",
  skills: ["React", "TypeScript", "GraphQL"]
};

console.log("=== SCENARIO 1: Standard ATS (Keywords only, no Exp/Edu req) ===");
const atsReq = { keywords: ["react", "typescript", "node.js"] };
const atsScore = calculateMatchScore(resumeText, atsReq, info);
console.log(`Expected Skills: 67 (2/3), Exp: 100, Edu: 100, Comp: 100, Total: 87`);
console.log(`Actual: Total = ${atsScore.total}, Skills = ${atsScore.skills}, Exp = ${atsScore.exp}, Edu = ${atsScore.edu}, Comp = ${atsScore.completeness}`);
console.log(`Missing Skills: ${atsScore.missingSkills}`);

console.log("\n=== SCENARIO 2: Smart Match (Keywords + Exp + Edu req) ===");
const smReq = { keywords: ["react", "typescript"], exp: "2 yrs", education: "B.Tech" };
const smScore = calculateMatchScore(resumeText, smReq, info);
console.log(`Expected Skills: 100, Exp: 100 (Cand: 3 >= Req: 2), Edu: 100 (Cand: B.Tech >= Req: B.Tech), Comp: 100, Total: 100`);
console.log(`Actual: Total = ${smScore.total}, Skills = ${smScore.skills}, Exp = ${smScore.exp}, Edu = ${smScore.edu}, Comp = ${smScore.completeness}`);

console.log("\n=== SCENARIO 3: Smart Match (Failing Requirements) ===");
const failReq = { keywords: ["react"], exp: "5+ yrs", education: "MBA" };
const failScore = calculateMatchScore(resumeText, failReq, info);
console.log(`Expected Skills: 100, Exp: 60 (3/5), Edu: 75 (Cand: B.Tech < Req: MBA), Comp: 100, Total: 85`);
console.log(`Actual: Total = ${failScore.total}, Skills = ${failScore.skills}, Exp = ${failScore.exp}, Edu = ${failScore.edu}, Comp = ${failScore.completeness}`);

console.log("\n=== SCENARIO 4: Missing Required Skills (No Fabrication) ===");
const missingReq = { keywords: ["react", "python", "aws", "docker"] };
const missingScore = calculateMatchScore(resumeText, missingReq, info);
console.log(`Expected Skills: 25 (1/4), Total: 70`);
console.log(`Actual: Total = ${missingScore.total}, Skills = ${missingScore.skills}, Matched = ${missingScore.matchedSkills}, Missing = ${missingScore.missingSkills}`);

console.log("\n=== SCENARIO 5: Java vs JavaScript (Word Boundary Validation) ===");
const jsResume = "I am a frontend developer with experience in JavaScript.";
const javaReq = { keywords: ["java"] };
const javaScore = calculateMatchScore(jsResume, javaReq, info);
console.log(`Expected Skills: 0 (Java should not match JavaScript), Total: 60`);
console.log(`Actual: Skills = ${javaScore.skills}, Matched = ${javaScore.matchedSkills}`);

console.log("\n=== SCENARIO 6: Experience 'Not specified' Fallback ===");
const noExpInfo = { ...info, exp: "Not specified" };
const reqExpReq = { keywords: ["react"], exp: "2 yrs" };
const noExpScore = calculateMatchScore("No exp mentioned", reqExpReq, noExpInfo);
console.log(`Expected Exp: 0 (Not specified should yield 0), Total: 75`);
console.log(`Actual: Exp = ${noExpScore.exp}`);

