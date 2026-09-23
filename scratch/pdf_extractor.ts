import fs from 'fs';
const pdfjs = require('pdfjs-dist');

async function extractText(filePath: string) {
    const data = new Uint8Array(fs.readFileSync(filePath));
    const loadingTask = pdfjs.getDocument({data});
    const pdf = await loadingTask.promise;
    let text = "";
    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        text += content.items.map((item: any) => item.str).join(" ") + " ";
    }
    return text;
}

export { extractText };
