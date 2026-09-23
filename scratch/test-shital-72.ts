import fs from "fs";
import { parseResumeFile } from "../src/lib/parser";
import { DEFAULT_ROLES } from "../src/lib/data";

const run = async () => {
    const filePath = "C:/Users/VICTUS/Downloads/SHITAL JFS2 (1).pdf";
    const filename = "SHITAL JFS2 (1).pdf";
    const buffer = fs.readFileSync(filePath);
    const file = new File([buffer], filename, { type: "application/pdf" });
    
    // Test with auto (will pick dev-ft)
    const candidate = await parseResumeFile(file, DEFAULT_ROLES, "auto");
    const role = DEFAULT_ROLES.find(r => r.id === candidate.roleId);
    
    console.log(`1. The exact role passed to parseResumeFile(): ${JSON.stringify(role)}`);
    console.log(`2. The exact role keywords passed to scoreCandidateFromText(): ${role?.keywords.join(", ")}`);
    console.log(`3. reqExp: ${role?.reqExp}`);
    console.log(`4. reqEdu: ${role?.reqEdu}`);
    console.log(`5. extracted candidate experience: ${candidate.exp}`);
    console.log(`6. extracted candidate education: ${candidate.education}`);
    console.log(`7. extracted skills: ${candidate.skills.join(", ")}`);
    console.log(`8. the result returned by calculateMatchScore(): ${JSON.stringify(candidate.score)}`);
    console.log(`9. candidate.score immediately after parseResumeFile(): ${candidate.score.total}`);
};

run().catch(console.error);
