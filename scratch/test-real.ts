import fs from "fs";
import { parseResumeFile } from "../src/lib/parser";
import { DEFAULT_ROLES, calculateMatchScore } from "../src/lib/data";

// Polyfill for File and FormData if needed (Node 20+ has them)

const run = async () => {
    const resumes = [
        "C:/Users/VICTUS/Downloads/SHITAL JFS2 (1).pdf",
        "C:/Users/VICTUS/Downloads/Sawant_Omkar_9373028146 (1).pdf"
    ];

    for (const filePath of resumes) {
        console.log(`\n\n=========================================`);
        const filename = filePath.split('/').pop() || "";
        
        const buffer = fs.readFileSync(filePath);
        // Create a File object
        const file = new File([buffer], filename, { type: "application/pdf" });
        
        console.log(`1. Resume filename: ${filename}`);

        try {
            const candidate = await parseResumeFile(file, DEFAULT_ROLES);
            
            console.log(`2. Extracted resume text: ${candidate.resumeText.substring(0, 150).replace(/\n/g, ' ')}...`);
            console.log(`3. Parsed name: ${candidate.name}`);
            console.log(`4. Parsed education: ${candidate.education}`);
            console.log(`5. Parsed experience: ${candidate.exp}`);
            console.log(`6. Parsed skills: ${candidate.skills.join(", ")}`);
            
            const role = DEFAULT_ROLES.find(r => r.id === candidate.roleId);
            console.log(`7. Detected role: ${role?.title || candidate.roleId}`);
            console.log(`8. Actual role keywords: ${role?.keywords.join(", ")}`);
            console.log(`9. Required experience: ${role?.experience || "0"}`);
            console.log(`10. Required education: ${role?.education || "B.Tech"}`);

            // To get missing keywords and match breakdown, we call calculateMatchScore fresh
            const atsReq = {
                keywords: role ? role.keywords : [],
                exp: role ? role.experience : "0",
                education: role ? role.education : "B.Tech"
            };

            const matchBreakdown = calculateMatchScore(candidate.resumeText, atsReq, candidate);
            
            console.log(`11. Matched keywords: ${matchBreakdown.matchedSkills?.join(", ")}`);
            console.log(`12. Missing keywords: ${matchBreakdown.missingSkills?.join(", ")}`);
            console.log(`13. Skill score: ${matchBreakdown.skills}`);
            console.log(`14. Experience score: ${matchBreakdown.exp}`);
            console.log(`15. Education score: ${matchBreakdown.edu}`);
            console.log(`16. Completeness score: ${matchBreakdown.completeness}`);
            
            console.log(`17. Actual ATS weights used by calculateMatchScore(): Total is sum of components... (we can see them inside the func)`);
            console.log(`18. Freshly calculated ATS score: ${matchBreakdown.total}`);
            console.log(`19. Stored candidate ATS score: ${candidate.score.total}`);
            
            console.log(`\nStored score: ${candidate.score.total}`);
            console.log(`Fresh calculation: ${matchBreakdown.total}`);
            console.log(`Difference: ${candidate.score.total - matchBreakdown.total}`);

        } catch (e) {
            console.error(e);
            console.log("NOT VERIFIED — actual resume could not be tested.");
        }
    }
};

run().catch(console.error);
