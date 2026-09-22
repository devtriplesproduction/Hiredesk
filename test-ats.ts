import { scoreCandidateFromText } from "./src/lib/data";

const roleKeywords = ["react", "typescript", "node.js", "graphql", "sql"];
const resumeText = "I am a frontend developer with experience in React and TypeScript. I have worked with GraphQL APIs.";

const info = {
  name: "John Doe",
  email: "john@example.com",
  phone: "1234567890",
  city: "Mumbai",
  education: "B.Tech",
  exp: "3 yrs",
  skills: ["React", "TypeScript", "GraphQL"]
};

for (let i = 1; i <= 5; i++) {
  const score = scoreCandidateFromText(resumeText, roleKeywords, info);
  console.log(`Run ${i}: Total Score = ${score.total}, Skills = ${score.skills}, Exp = ${score.exp}, Edu = ${score.edu}, Comp = ${score.completeness}`);
}
