import fs from 'fs';

async function extract() {
  const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs');
  const data = new Uint8Array(fs.readFileSync('Offer_Letter_Full_Time__Shital_Khulape.pdf'));
  const doc = await pdfjsLib.getDocument({ data }).promise;
  console.log('Number of pages:', doc.numPages);
  
  for (let i = 1; i <= doc.numPages; i++) {
    console.log(`\n--- PAGE ${i} ---`);
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    const strings = content.items.map(item => item.str);
    console.log(strings.join(' '));
  }
}

extract().catch(console.error);
