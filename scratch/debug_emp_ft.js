// Test: what if contentEditable browser modifies HTML structure?
// Browsers often rewrite innerHTML when contentEditable is active.
// They may remove classes, merge divs, etc.

// Simulate what Chrome's contentEditable typically produces for our 2-page emp-ft
const browserModifiedHtml = `<div class="page a4-flow-page" data-page="1"><div class="a4-flow-content"><div style="display:flex;justify-content:space-between;align-items:flex-start;border-bottom:2.5px solid #111;padding-bottom:16px;margin-bottom:28px"><div><div class="contract-logo-slot" data-slot="logo" contenteditable="false" style="height: 56px; max-height: 56px; display: flex; align-items: center; justify-content: flex-start; margin-bottom: 8px; user-select: none;"><img src="https://example.com/logo.png" alt="Company Logo" class="contract-doc-logo" data-contract-asset="logo" style="height: 56px; max-width: 240px; object-fit: contain; display: block; pointer-events: none;"></div><div style="font-family:Arial,sans-serif;font-size:7.5pt;color:#999;margin-top:2px">Rajdhani Towers, First floor, Rajwada, Satara · info@triplesproduction.com</div></div><div style="text-align:right;font-family:Arial,sans-serif;font-size:9pt;color:#555"><div style="font-weight:700;color:#111;font-size:10pt">Ref: TSP/EMP/[REF NO]</div><div style="margin-top:4px">Date: <span class="contract-date" data-default-date="true">16 September 2026</span></div></div></div><h2 style="font-family:Arial,sans-serif;font-size:14pt;font-weight:800;letter-spacing:0.5px;text-transform:uppercase;text-align:center;margin:0 0 24px 0;padding-bottom:10px;border-bottom:1px solid #e0e0e0">Employment Agreement</h2><p style="font-family:Arial,sans-serif;font-size:10.5pt;margin-bottom:20px;text-align:justify">Preamble text...</p><p style="margin:0 0 4px 0"><strong style="font-family:Arial,sans-serif;font-size:10.5pt">1. Position &amp; Duties</strong></p><p style="margin:0 0 16px 0;font-family:Arial,sans-serif;font-size:10.5pt;text-align:justify">desc</p><p style="margin:0 0 4px 0"><strong style="font-family:Arial,sans-serif;font-size:10.5pt">2. Commencement</strong></p><p style="margin:0 0 16px 0;font-family:Arial,sans-serif;font-size:10.5pt;text-align:justify">desc</p><p style="margin:0 0 4px 0"><strong style="font-family:Arial,sans-serif;font-size:10.5pt">3. Compensation</strong></p><p style="margin:0 0 16px 0;font-family:Arial,sans-serif;font-size:10.5pt;text-align:justify">desc</p><p style="margin:0 0 4px 0"><strong style="font-family:Arial,sans-serif;font-size:10.5pt">4. Working Hours</strong></p><p style="margin:0 0 16px 0;font-family:Arial,sans-serif;font-size:10.5pt;text-align:justify">desc</p><p style="margin:0 0 4px 0"><strong style="font-family:Arial,sans-serif;font-size:10.5pt">5. Leave</strong></p><p style="margin:0 0 16px 0;font-family:Arial,sans-serif;font-size:10.5pt;text-align:justify">desc</p><p style="margin:0 0 4px 0"><strong style="font-family:Arial,sans-serif;font-size:10.5pt">6. Confidentiality</strong></p><p style="margin:0 0 16px 0;font-family:Arial,sans-serif;font-size:10.5pt;text-align:justify">desc</p></div></div><div class="page a4-flow-page" data-page="2"><div class="a4-flow-content"><p style="margin:0 0 4px 0"><strong style="font-family:Arial,sans-serif;font-size:10.5pt">7. Intellectual Property</strong></p><p style="margin:0 0 16px 0;font-family:Arial,sans-serif;font-size:10.5pt;text-align:justify">desc</p><p style="margin:0 0 4px 0"><strong style="font-family:Arial,sans-serif;font-size:10.5pt">8. Code of Conduct</strong></p><p style="margin:0 0 16px 0;font-family:Arial,sans-serif;font-size:10.5pt;text-align:justify">desc</p><p style="margin:0 0 4px 0"><strong style="font-family:Arial,sans-serif;font-size:10.5pt">9. Termination</strong></p><p style="margin:0 0 16px 0;font-family:Arial,sans-serif;font-size:10.5pt;text-align:justify">desc</p><p style="margin:0 0 4px 0"><strong style="font-family:Arial,sans-serif;font-size:10.5pt">10. Governing Law</strong></p><p style="margin:0 0 16px 0;font-family:Arial,sans-serif;font-size:10.5pt;text-align:justify">desc</p><p style="font-family:Arial,sans-serif;font-size:10pt;color:#555;margin-top:24px;text-align:justify"><em>Final clause.</em></p><div style="display:grid;grid-template-columns:1fr 1fr;gap:80px;margin-top:60px;padding-top:24px;border-top:1px solid #ddd"><div><div class="contract-sign-slot" data-slot="sign" contenteditable="false" style="height: 96px; min-height: 96px; max-height: 96px; display: flex; align-items: flex-end; justify-content: flex-start; margin-bottom: 8px; user-select: none;"><img src="https://example.com/sign.png" alt="Authorized Signature" class="contract-doc-sign" data-contract-asset="sign" style="height: 86px; max-width: 200px; object-fit: contain; display: block; pointer-events: none;"></div><div style="border-top:1.5px solid #333;padding-top:8px"><div style="font-family:Arial,sans-serif;font-weight:700;font-size:10pt">Authorized Signatory</div><div style="font-family:Arial,sans-serif;font-size:9pt;color:#555;margin-top:2px">Triple S Production</div></div></div><div><div style="height:96px;display:flex;align-items:flex-end;margin-bottom:8px"></div><div style="border-top:1.5px solid #333;padding-top:8px"><div style="font-family:Arial,sans-serif;font-weight:700;font-size:10pt">Candidate Signature</div><div style="font-family:Arial,sans-serif;font-size:9pt;color:#555;margin-top:2px">[CANDIDATE NAME]</div><div style="font-family:Arial,sans-serif;font-size:8pt;color:#999;margin-top:2px">Date: _______________</div></div></div></div></div></div>`;

function stripContractAssetsForStorage(html) {
  if (!html) return "";
  let clean = html;
  clean = clean.replace(/<div\s*<div/gi, "<div");
  clean = clean.replace(/<div([^>]*>)\s*>\s*/gi, "<div$1");
  clean = clean.replace(/>\s*>\s*<img/gi, "><img");
  
  clean = clean.replace(
    /<div[^>]*class="[^"]*contract-logo-slot[^"]*"[^>]*>[\s\S]*?<\/div>/gi,
    '<div class="contract-logo-slot" data-slot="logo" style="height:56px;display:flex;align-items:center;margin-bottom:8px"><!--LOGO--></div>'
  );
  clean = clean.replace(
    /<div[^>]*class="[^"]*contract-sign-slot[^"]*"[^>]*>[\s\S]*?<\/div>/gi,
    '<div class="contract-sign-slot" data-slot="sign" style="height:96px;display:flex;align-items:flex-end;margin-bottom:8px"><!--SIGN--></div>'
  );
  return clean;
}

const stripped = stripContractAssetsForStorage(browserModifiedHtml);

// Check the sign slot replacement
const signSlotRegex = /<div[^>]*class="[^"]*contract-sign-slot[^"]*"[^>]*>[\s\S]*?<\/div>/gi;
const signMatches = browserModifiedHtml.match(signSlotRegex);
if (signMatches) {
  console.log("=== Sign slot match count:", signMatches.length);
  signMatches.forEach((m, i) => {
    console.log(`=== Match ${i} (length ${m.length}):`);
    console.log(m.substring(0, 200));
    console.log("...");
    console.log(m.substring(m.length - 100));
  });
}

// Does the stripped version still have valid page structure?
console.log("\n=== Stripped has page 1?", stripped.includes('data-page="1"'));
console.log("=== Stripped has page 2?", stripped.includes('data-page="2"'));
console.log("=== Stripped has <!--LOGO-->?", stripped.includes("<!--LOGO-->"));
console.log("=== Stripped has <!--SIGN-->?", stripped.includes("<!--SIGN-->"));

// Does the sign regex accidentally eat the </div> that closes the grid column?
// The key issue: [\s\S]*? matches the MINIMUM, but </div> appears first inside the sign slot
// Let's check what comes AFTER the sign slot match in the stripped version
const signIdx = stripped.indexOf("<!--SIGN-->");
if (signIdx >= 0) {
  const after = stripped.substring(signIdx, signIdx + 200);
  console.log("\n=== After <!--SIGN--> in stripped:", after.substring(0, 200));
}

// Check for Authorized Signatory text
console.log("\n=== Has 'Authorized Signatory'?", stripped.includes("Authorized Signatory"));
console.log("=== Has 'Candidate Signature'?", stripped.includes("Candidate Signature"));

// Check the grid container
console.log("=== Has grid-template-columns?", stripped.includes("grid-template-columns"));
