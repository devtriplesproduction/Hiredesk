import fs from "fs";
import { parseResumeFile } from "../src/lib/parser";
import { DEFAULT_ROLES } from "../src/lib/data";

const run = async () => {
    const filePath = "C:/Users/VICTUS/Downloads/SHITAL JFS2 (1).pdf";
    const filename = "SHITAL JFS2 (1).pdf";
    const buffer = fs.readFileSync(filePath);
    const file = new File([buffer], filename, { type: "application/pdf" });
    
    const cases = [
        { name: "CASE 1", exp: "all", edu: "all" },
        { name: "CASE 2", exp: "2", edu: "all" },
        { name: "CASE 3", exp: "all", edu: "b.tech" },
        { name: "CASE 4", exp: "2", edu: "b.tech" },
    ];

    for (const c of cases) {
        console.log(`\n\n=== RUNNING ${c.name} (Exp: ${c.exp}, Edu: ${c.edu}) ===`);
        
        // clone DEFAULT_ROLES and modify dev-ft
        const roles = DEFAULT_ROLES.map(r => {
            if (r.id === "dev-ft") {
                return { ...r, reqExp: c.exp, reqEdu: c.edu };
            }
            return r;
        });

        const candidate = await parseResumeFile(file, roles, "dev-ft");
        console.log(`Final total returned: ${candidate.score.total}`);
    }
};

run().catch(console.error);
