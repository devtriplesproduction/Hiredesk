import fs from "fs";
import { parseResumeFile } from "../src/lib/parser";
import { DEFAULT_ROLES } from "../src/lib/data";

const run = async () => {
    const filePath = "C:/Users/VICTUS/Downloads/SHITAL JFS2 (1).pdf";
    const filename = "SHITAL JFS2 (1).pdf";
    const buffer = fs.readFileSync(filePath);
    const file = new File([buffer], filename, { type: "application/pdf" });
    
    for (const role of DEFAULT_ROLES) {
        const candidate = await parseResumeFile(file, DEFAULT_ROLES, role.id);
        console.log(`Role ${role.id}: Score ${candidate.score.total}`);
    }
};

run().catch(console.error);
