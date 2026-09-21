const fs = require('fs');
const pdfjsLib = require('pdfjs-dist/build/pdf.js');

async function extract() {
  const data = new Uint8Array(fs.readFileSync('Offer_Letter_Full_Time__Shital_Khulape.pdf'));
  const doc = await pdfjsLib.getDocument({ data }).promise;
  console.log('Number of pages:', doc.numPages);
  
  let fullOutput = '';
  for (let i = 1; i <= doc.numPages; i++) {
    fullOutput += `\n==================== PAGE ${i} ====================\n`;
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    
    // Group text items by roughly their y coordinate to preserve line formatting
    const items = content.items;
    let lines = [];
    let currentLine = [];
    let lastY = null;
    
    for (const item of items) {
      if (lastY === null || Math.abs(item.transform[5] - lastY) > 4) {
        if (currentLine.length > 0) {
          lines.push(currentLine.map(it => it.str).join(' '));
        }
        currentLine = [item];
        lastY = item.transform[5];
      } else {
        currentLine.push(item);
      }
    }
    if (currentLine.length > 0) {
      lines.push(currentLine.map(it => it.str).join(' '));
    }
    fullOutput += lines.join('\n') + '\n';
  }
  
  fs.writeFileSync('extracted_pdf_text.txt', fullOutput, 'utf8');
  console.log('Saved to extracted_pdf_text.txt, length:', fullOutput.length);
}

extract().catch(console.error);
