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
console.log(`Expected Skills: 67 (2/3), Exp: 0, Edu: 0`);
console.log(`Actual: Total = ${atsScore.total}, Skills = ${atsScore.skills}, Exp = ${atsScore.exp}, Edu = ${atsScore.edu}, Comp = ${atsScore.completeness}`);
console.log(`Missing Skills: ${atsScore.missingSkills}`);

console.log("\n=== SCENARIO 2: Smart Match (Keywords + Exp + Edu req) ===");
const smReq = { keywords: ["react", "typescript"], exp: "2 yrs", education: "B.Tech" };
const smScore = calculateMatchScore(resumeText, smReq, info);
console.log(`Expected Skills: 100, Exp: 100 (Cand: 3 >= Req: 2), Edu: 100 (Cand: B.Tech >= Req: B.Tech)`);
console.log(`Actual: Total = ${smScore.total}, Skills = ${smScore.skills}, Exp = ${smScore.exp}, Edu = ${smScore.edu}, Comp = ${smScore.completeness}`);

console.log("\n=== SCENARIO 3: Smart Match (Failing Requirements) ===");
const failReq = { keywords: ["react"], exp: "5+ yrs", education: "MBA" };
const failScore = calculateMatchScore(resumeText, failReq, info);
console.log(`Expected Skills: 100, Exp: 60 (3/5), Edu: 0 (Cand: B.Tech < Req: MBA)`);
console.log(`Actual: Total = ${failScore.total}, Skills = ${failScore.skills}, Exp = ${failScore.exp}, Edu = ${failScore.edu}, Comp = ${failScore.completeness}`);

console.log("\n=== SCENARIO 4: Missing Required Skills (No Fabrication) ===");
const missingReq = { keywords: ["react", "python", "aws", "docker"] };
const missingScore = calculateMatchScore(resumeText, missingReq, info);
console.log(`Expected Skills: 25 (1/4)`);
console.log(`Actual: Total = ${missingScore.total}, Skills = ${missingScore.skills}, Matched = ${missingScore.matchedSkills}, Missing = ${missingScore.missingSkills}`);
