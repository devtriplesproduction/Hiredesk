// Comprehensive test and development of clean contract asset positioning

function getLogoHtml(logoUrl) {
  if (logoUrl) {
    return `<img src="${logoUrl}" alt="Company Logo" class="contract-doc-logo" data-contract-asset="logo" style="height:56px;max-width:240px;object-fit:contain;display:block;" />`;
  }
  return `<div class="contract-doc-logo-default" data-contract-asset="logo-default" style="font-family:Arial,sans-serif;line-height:1.15;user-select:none;"><div style="font-size:18pt;font-weight:800;letter-spacing:-0.5px;color:#111">Triple S Production</div><div style="font-size:7.5pt;color:#666;text-transform:uppercase;letter-spacing:1.5px;margin-top:3px">Creative &middot; Technology &middot; Agency</div></div>`;
}

function getSignHtml(signUrl) {
  if (signUrl) {
    return `<img src="${signUrl}" alt="Authorized Signature" class="contract-doc-sign" data-contract-asset="sign" style="height:86px;max-width:200px;object-fit:contain;display:block;" />`;
  }
  return `<div class="contract-sign-empty" data-contract-asset="sign-empty" style="height:86px;min-height:86px;"></div>`;
}

function renderContractHtmlFixed(content, assets) {
  if (!content) return "";
  let html = content;

  // 0. Pre-cleaning: Sanitize any malformed tags or stray characters left by previous buggy rendering
  html = html.replace(/<div\s*<div/gi, "<div");
  html = html.replace(/<div([^>]*>)\s*>\s*/gi, "<div$1");
  html = html.replace(/>\s*>\s*<img/gi, "><img");
  // Remove stray '>' text node preceding sign slot or image
  html = html.replace(/>\s*&gt;\s*</gi, "><");
  html = html.replace(/>\s*>\s*<div class="contract-sign-slot"/gi, '><div class="contract-sign-slot"');

  const logoHtml = getLogoHtml(assets.logoUrl);
  const signHtml = getSignHtml(assets.signUrl);

  const logoSlotHtml = `<div class="contract-logo-slot" data-slot="logo" contenteditable="false" style="height:56px;display:flex;align-items:center;margin-bottom:8px;user-select:none;">${logoHtml}</div>`;
  const signSlotHtml = `<div class="contract-sign-slot" data-slot="sign" contenteditable="false" style="height:96px;min-height:96px;display:flex;align-items:flex-end;margin-bottom:8px;user-select:none;">${signHtml}</div>`;

  // ── 1. Top-Left Logo Position Resolution ──────────────────────────────────
  if (/<div[^>]*class="[^"]*contract-logo-slot[^"]*"[^>]*>[\s\S]*?<\/div>/i.test(html)) {
    html = html.replace(
      /<div[^>]*class="[^"]*contract-logo-slot[^"]*"[^>]*>[\s\S]*?<\/div>/i,
      logoSlotHtml
    );
  } else if (/<div[^>]*data-slot="logo"[^>]*>[\s\S]*?<\/div>/i.test(html)) {
    html = html.replace(
      /<div[^>]*data-slot="logo"[^>]*>[\s\S]*?<\/div>/i,
      logoSlotHtml
    );
  } else if (/<div[^>]*style="[^"]*height:\s*56px[^"]*"[^>]*>[\s\S]*?<\/div>/i.test(html)) {
    html = html.replace(
      /<div[^>]*style="[^"]*height:\s*56px[^"]*"[^>]*>[\s\S]*?<\/div>/i,
      logoSlotHtml
    );
  } else if (html.includes("<!--LOGO-->")) {
    html = html.replaceAll("<!--LOGO-->", logoSlotHtml);
  }

  // Watermark or cover page template src replacements
  if (assets.logoUrl) {
    html = html.replaceAll('src="<!--LOGO-->"', `src="${assets.logoUrl}"`);
    html = html.replaceAll("src='<!--LOGO-->'", `src='${assets.logoUrl}'`);
  } else {
    html = html.replaceAll('src="<!--LOGO-->"', 'src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"');
    html = html.replaceAll("src='<!--LOGO-->'", "src='data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'");
  }

  // ── 2. Authorized Signatory Position Resolution ───────────────────────────
  if (/<div[^>]*class="[^"]*contract-sign-slot[^"]*"[^>]*>[\s\S]*?<\/div>/i.test(html)) {
    html = html.replace(
      /<div[^>]*class="[^"]*contract-sign-slot[^"]*"[^>]*>[\s\S]*?<\/div>/i,
      signSlotHtml
    );
  } else if (/<div[^>]*data-slot="sign"[^>]*>[\s\S]*?<\/div>/i.test(html)) {
    html = html.replace(
      /<div[^>]*data-slot="sign"[^>]*>[\s\S]*?<\/div>/i,
      signSlotHtml
    );
  } else if (/<div[^>]*style="[^"]*height:\s*96px[^"]*"[^>]*>[\s\S]*?<!--SIGN-->[\s\S]*?<\/div>/i.test(html)) {
    // Template 96px container with <!--SIGN-->
    html = html.replace(
      /<div[^>]*style="[^"]*height:\s*96px[^"]*"[^>]*>[\s\S]*?<!--SIGN-->[\s\S]*?<\/div>/i,
      signSlotHtml
    );
  } else if (/<div[^>]*style="[^"]*height:\s*96px[^"]*"[^>]*>[\s\S]*?<\/div>(?=\s*<div[^>]*>[\s\S]*?Authorized Signatory)/i.test(html)) {
    // 96px container directly preceding Authorized Signatory block
    html = html.replace(
      /<div[^>]*style="[^"]*height:\s*96px[^"]*"[^>]*>[\s\S]*?<\/div>(?=\s*<div[^>]*>[\s\S]*?Authorized Signatory)/i,
      signSlotHtml
    );
  } else if (html.includes("<!--SIGN-->")) {
    html = html.replaceAll("<!--SIGN-->", signSlotHtml);
  }

  // Final cleanup of any trailing/leading stray tags
  html = html.replace(/<div\s*<div/gi, "<div");
  html = html.replace(/<\/div>\s*<\/div>\s*<\/div>(?=\s*<div[^>]*>Candidate Signature)/i, "</div></div>");

  return html;
}

function stripContractAssetsForStorageFixed(html) {
  if (!html) return "";
  let clean = html;

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

// ── TEST CASES ─────────────────────────────────────────────────────────────
const testAssets = {
  logoUrl: "https://example.com/logo.png",
  signUrl: "https://example.com/sign.png",
  isSpecificLogo: false,
  isSpecificSign: false,
  hasGlobalLogo: true,
  hasGlobalSign: true,
};

// Test 1: Clean Template
const cleanSigTemplate = `
<div style="display:grid;grid-template-columns:1fr 1fr;gap:80px;margin-top:60px;padding-top:24px;border-top:1px solid #ddd">
  <div>
    <div style="height:96px;display:flex;align-items:flex-end;margin-bottom:8px"><!--SIGN--></div>
    <div style="border-top:1.5px solid #333;padding-top:8px">
      <div style="font-family:Arial,sans-serif;font-weight:700;font-size:10pt">Authorized Signatory</div>
      <div style="font-family:Arial,sans-serif;font-size:9pt;color:#555;margin-top:2px">Triple S Production</div>
    </div>
  </div>
  <div>
    <div style="height:96px;display:flex;align-items:flex-end;margin-bottom:8px"></div>
    <div style="border-top:1.5px solid #333;padding-top:8px">
      <div style="font-family:Arial,sans-serif;font-weight:700;font-size:10pt">Candidate Signature</div>
      <div style="font-family:Arial,sans-serif;font-size:9pt;color:#555;margin-top:2px">[CANDIDATE NAME]</div>
      <div style="font-family:Arial,sans-serif;font-size:8pt;color:#999;margin-top:2px">Date: _______________</div>
    </div>
  </div>
</div>`;

const res1 = renderContractHtmlFixed(cleanSigTemplate, testAssets);
console.log("=== TEST 1: Clean Template Render ===");
console.log("Contains <div<div:", res1.includes("<div<div"));
console.log("Contains stray >:", />[\s]*>[\s]*</.test(res1));
console.log("Authorized Signatory exists:", res1.includes("Authorized Signatory"));
console.log("Candidate Signature exists:", res1.includes("Candidate Signature"));
console.log("Signature rendered:", res1.includes("https://example.com/sign.png"));

// Test 2: Broken input with `<div<div` and `>>`
const brokenSigInput = `
<div style="display:grid;grid-template-columns:1fr 1fr;gap:80px;margin-top:60px;padding-top:24px;border-top:1px solid #ddd">
  <div>
    <div<div class="contract-sign-slot" data-slot="sign" style="height:96px;display:flex;align-items:flex-end;margin-bottom:8px">><img src="https://example.com/old_sign.png" alt="Authorized Signature" class="contract-doc-sign" data-contract-asset="sign" style="height:86px;max-width:200px;object-fit:contain;display:block;" /></div>
    <div style="border-top:1.5px solid #333;padding-top:8px">
      <div style="font-family:Arial,sans-serif;font-weight:700;font-size:10pt">Authorized Signatory</div>
      <div style="font-family:Arial,sans-serif;font-size:9pt;color:#555;margin-top:2px">Triple S Production</div>
    </div>
  </div>
  <div>
    <div style="height:96px;display:flex;align-items:flex-end;margin-bottom:8px"></div>
    <div style="border-top:1.5px solid #333;padding-top:8px">
      <div style="font-family:Arial,sans-serif;font-weight:700;font-size:10pt">Candidate Signature</div>
      <div style="font-family:Arial,sans-serif;font-size:9pt;color:#555;margin-top:2px">[CANDIDATE NAME]</div>
      <div style="font-family:Arial,sans-serif;font-size:8pt;color:#999;margin-top:2px">Date: _______________</div>
    </div>
  </div>
</div>`;

const res2 = renderContractHtmlFixed(brokenSigInput, testAssets);
console.log("\n=== TEST 2: Broken Input Self-Healing Render ===");
console.log("Contains <div<div:", res2.includes("<div<div"));
console.log("Contains stray >:", />[\s]*>[\s]*</.test(res2));
console.log("Signature replaced with new:", res2.includes("https://example.com/sign.png"));
console.log("Old signature removed:", !res2.includes("old_sign.png"));

// Test 3: Normalization for storage
const cleanStorage = stripContractAssetsForStorageFixed(res1);
console.log("\n=== TEST 3: Strip for Storage ===");
console.log("Contains <!--SIGN-->:", cleanStorage.includes("<!--SIGN-->"));
console.log("Contains sign.png:", cleanStorage.includes("sign.png"));

console.log("\nALL CHECKS FINISHED!");
