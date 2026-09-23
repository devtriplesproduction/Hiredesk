import { createClient } from "@supabase/supabase-js";
import { getDBCandidates, getDBRoles } from "./src/lib/supabase";
import { calculateMatchScore } from "./src/lib/data";

async function run() {
  const candidates = await getDBCandidates();
  const roles = await getDBRoles();

  const processCandidate = (resumeFileName) => {
    const c = candidates.find(can => can.resumeFile === resumeFileName);
    if (!c) {
      console.log("NOT FOUND:", resumeFileName);
      return;
    }
    const role = roles.find(r => r.id === c.roleId) || roles[0];
    const score = calculateMatchScore(c.resumeText || "", {
      keywords: role.keywords,
      exp: role.reqExp,
      education: role.reqEdu
    }, c);
    
    console.log(`\n=== DEBUG FOR ${resumeFileName} ===`);
    console.log(`Role: ${role.name}`);
    console.log(`Detected Experience: ${c.exp}`);
    console.log(`Detected Education: ${c.education}`);
    console.log(`Extracted Skills: ${c.skills?.join(", ")}`);
    console.log(`Role Keywords: ${role.keywords.join(", ")}`);
    console.log(`Matched Keywords: ${score.matchedSkills.join(", ")}`);
    console.log(`Missing Keywords: ${score.missingSkills.join(", ")}`);
    console.log(`Skill Score: ${score.skills}`);
    console.log(`Experience Score: ${score.exp}`);
    console.log(`Education Score: ${score.edu}`);
    console.log(`Completeness Score: ${score.completeness}`);
    console.log(`Final Stored Score: ${c.score.total} (from database)`);
    console.log(`Final Calculated Score: ${score.total}`);
    
    let hasExpReq = role.reqExp && role.reqExp !== "all";
    let hasEduReq = role.reqEdu && role.reqEdu !== "all";
    let expWeight = hasExpReq ? 0.25 : 0;
    let eduWeight = hasEduReq ? 0.20 : 0;
    let skillWeight = score.matchedSkills.length + score.missingSkills.length > 0 ? 1.0 - (expWeight + eduWeight) : 0;
    console.log(`Actual Math Weights -> Skills: ${skillWeight}, Exp: ${expWeight}, Edu: ${eduWeight}`);
    console.log(`Mathematical Calculation -> Math.round(${score.skills} * ${skillWeight} + ${score.exp} * ${expWeight} + ${score.edu} * ${eduWeight}) = ${score.total}`);
  };

  processCandidate("SHITAL JFS2 (1).pdf");
  processCandidate("Sawant_Omkar_9373028146 (1).pdf");
}

run().catch(console.error);
