import fs from "fs";
import { 
    extractEmail, extractPhone, extractCity, 
    extractEducation, extractExperience, extractEmploymentStatus, 
    extractGender, extractAge, extractSkills 
} from "./exported_parser";
import { calculateMatchScore, DEFAULT_ROLES } from "../src/lib/data";
import { extractText } from "./pdf_extractor";

const run = async () => {
    const resumes = [
        "C:/Users/VICTUS/Downloads/SHITAL JFS2 (1).pdf",
        "C:/Users/VICTUS/Downloads/Sawant_Omkar_9373028146 (1).pdf"
    ];

    for (const filePath of resumes) {
        console.log(`\n\n=========================================`);
        const filename = filePath.split('/').pop() || "";
        console.log(`1. Resume filename: ${filename}`);
        
        let text = "";
        try {
            text = await extractText(filePath);
        } catch (e) {
            console.error("PDF extraction failed", e);
            continue;
        }
        
        console.log(`2. Extracted resume text: ${text.substring(0, 150).replace(/\n/g, ' ')}...`);
        
        // Mock name extraction
        const parsedName = filename.replace(".pdf", "").replace(/[_\-\(\)0-9]/g, " ").trim();
        console.log(`3. Parsed name: ${parsedName}`);

        const education = extractEducation(text);
        console.log(`4. Parsed education: ${education}`);
        
        const exp = extractExperience(text);
        console.log(`5. Parsed experience: ${exp}`);

        const roleId = "all"; 
        const skills = extractSkills(text, roleId);
        console.log(`6. Parsed skills: ${skills.join(", ")}`);

        const candidate: any = {
            id: "dummy",
            name: parsedName,
            email: extractEmail(text),
            phone: extractPhone(text),
            city: extractCity(text),
            education,
            exp,
            skills,
            gender: extractGender(text, parsedName),
            age: extractAge(text) || (Math.floor(Math.random() * 18) + 21),
            employmentStatus: extractEmploymentStatus(text).status,
            roleId: "all",
            roleName: "Unknown Role",
            resumeText: text,
            score: { total: 0, skills: 0, exp: 0, edu: 0, completeness: 0, matchedSkills: [], missingSkills: [] }
        };

        const storedScore = calculateMatchScore(text, { keywords: [], exp: "0", education: "all" }, candidate);
        candidate.score = storedScore;

        const { detectBestRole } = require("../src/lib/data");
        const detectedRoleId = detectBestRole(skills.join(" "), DEFAULT_ROLES);
        const detectedRole = DEFAULT_ROLES.find((r: any) => r.id === detectedRoleId) || DEFAULT_ROLES[0];
        
        console.log(`7. Detected role: ${detectedRole.name}`);
        console.log(`8. Actual role keywords: ${detectedRole.keywords.join(", ")}`);
        console.log(`9. Required experience: ${detectedRole.reqExp}`);
        console.log(`10. Required education: ${detectedRole.reqEdu}`);

        const atsReq = {
            keywords: detectedRole.keywords,
            exp: detectedRole.reqExp,
            education: detectedRole.reqEdu
        };

        const matchBreakdown = calculateMatchScore(text, atsReq, candidate);

        console.log(`11. Matched keywords: ${matchBreakdown.matchedSkills?.join(", ")}`);
        console.log(`12. Missing keywords: ${matchBreakdown.missingSkills?.join(", ")}`);
        console.log(`13. Skill score: ${matchBreakdown.skills}`);
        console.log(`14. Experience score: ${matchBreakdown.exp}`);
        console.log(`15. Education score: ${matchBreakdown.edu}`);
        console.log(`16. Completeness score: ${matchBreakdown.completeness}`);
        
        console.log(`17. Actual ATS weights used by calculateMatchScore(): (Skills=40%, Exp=20%, Edu=20%, Comp=20%)`);
        console.log(`18. Freshly calculated ATS score: ${matchBreakdown.total}`);
        
        console.log(`19. Stored candidate ATS score: ${storedScore.total}`);
        
        console.log(`\nStored score: ${storedScore.total}`);
        console.log(`Fresh calculation: ${matchBreakdown.total}`);
        console.log(`Difference: ${storedScore.total - matchBreakdown.total}`);
    }
    process.exit(0);
};

run().catch(console.error);
