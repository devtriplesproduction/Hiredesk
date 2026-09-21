const assert = require('assert');

// Module logic aligned with src/lib/contract-assets.ts
function resolveContractAssets(contract, globalLogo, globalSign) {
  const specificLogo = (contract?.logoUrl ?? "").trim();
  const specificSign = (contract?.signUrl ?? "").trim();
  const gLogo = (globalLogo ?? "").trim();
  const gSign = (globalSign ?? "").trim();

  const isSpecificLogo = !!specificLogo;
  const isSpecificSign = !!specificSign;

  const logoUrl = isSpecificLogo ? specificLogo : gLogo;
  const signUrl = isSpecificSign ? specificSign : gSign;

  return {
    logoUrl,
    signUrl,
    isSpecificLogo,
    isSpecificSign,
    hasGlobalLogo: !!gLogo,
    hasGlobalSign: !!gSign,
  };
}

function getLogoHtml(logoUrl) {
  if (logoUrl) {
    return `<img src="${logoUrl}" alt="Company Logo" class="contract-doc-logo" data-contract-asset="logo" style="height:56px;max-width:240px;object-fit:contain;display:block;pointer-events:none;" />`;
  }
  return `<div class="contract-doc-logo-default" data-contract-asset="logo-default" style="font-family:Arial,sans-serif;line-height:1.15;user-select:none;"><div style="font-size:18pt;font-weight:800;letter-spacing:-0.5px;color:#111">Triple S Production</div><div style="font-size:7.5pt;color:#666;text-transform:uppercase;letter-spacing:1.5px;margin-top:3px">Creative &middot; Technology &middot; Agency</div></div>`;
}

function getSignHtml(signUrl) {
  if (signUrl) {
    return `<img src="${signUrl}" alt="Authorized Signature" class="contract-doc-sign" data-contract-asset="sign" style="height:86px;max-width:200px;object-fit:contain;display:block;pointer-events:none;" />`;
  }
  return `<div class="contract-sign-empty" data-contract-asset="sign-empty" style="height:86px;min-height:86px;user-select:none;"></div>`;
}

function renderContractHtml(content, assets) {
  if (!content) return "";
  let html = content;

  // 0. Pre-cleaning: Sanitize malformed tags or stray characters
  html = html.replace(/<div\s*<div/gi, "<div");
  html = html.replace(/<div([^>]*>)\s*>\s*/gi, "<div$1");
  html = html.replace(/>\s*>\s*<img/gi, "><img");
  html = html.replace(/>\s*&gt;\s*</gi, "><");
  html = html.replace(/>\s*>\s*<div class="contract-sign-slot"/gi, '><div class="contract-sign-slot"');

  const logoHtml = getLogoHtml(assets.logoUrl);
  const signHtml = getSignHtml(assets.signUrl);

  const logoSlotHtml = `<div class="contract-logo-slot" data-slot="logo" contenteditable="false" style="height:56px;max-height:56px;display:flex;align-items:center;justify-content:flex-start;margin-bottom:8px;user-select:none;">${logoHtml}</div>`;
  const signSlotHtml = `<div class="contract-sign-slot" data-slot="sign" contenteditable="false" style="height:96px;min-height:96px;max-height:96px;display:flex;align-items:flex-end;justify-content:flex-start;margin-bottom:8px;user-select:none;">${signHtml}</div>`;

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

  // Cover page watermark / explicit template replacements
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
    html = html.replace(
      /<div[^>]*style="[^"]*height:\s*96px[^"]*"[^>]*>[\s\S]*?<!--SIGN-->[\s\S]*?<\/div>/i,
      signSlotHtml
    );
  } else if (/<div[^>]*style="[^"]*height:\s*96px[^"]*"[^>]*>[\s\S]*?<\/div>(?=\s*<div[^>]*>[\s\S]*?Authorized Signatory)/i.test(html)) {
    html = html.replace(
      /<div[^>]*style="[^"]*height:\s*96px[^"]*"[^>]*>[\s\S]*?<\/div>(?=\s*<div[^>]*>[\s\S]*?Authorized Signatory)/i,
      signSlotHtml
    );
  } else if (html.includes("<!--SIGN-->")) {
    html = html.replaceAll("<!--SIGN-->", signSlotHtml);
  }

  html = html.replace(/<div\s*<div/gi, "<div");
  return html;
}

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

// ── TEST RUNNER ─────────────────────────────────────────────────────────────
console.log("Running comprehensive Contracts Asset Behavior & Positioning Verification Tests...\n");

// Sample template definitions
const sampleLH = `
<div style="display:flex;justify-content:space-between;align-items:flex-start;border-bottom:2.5px solid #111;padding-bottom:16px;margin-bottom:28px">
  <div>
    <div style="height:56px;display:flex;align-items:center;margin-bottom:8px"><!--LOGO--></div>
    <div style="font-family:Arial,sans-serif;font-size:7.5pt;color:#999;margin-top:2px">Rajdhani Towers, First floor, Rajwada, Satara · info@triplesproduction.com</div>
  </div>
  <div style="text-align:right;font-family:Arial,sans-serif;font-size:9pt;color:#555">
    <div style="font-weight:700;color:#111;font-size:10pt">Ref: TSP/EXP/[REF NO]</div>
    <div style="margin-top:4px">Date: 16 September 2026</div>
  </div>
</div>`;

const sampleSIG = `
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

const fullDoc = `${sampleLH}\n<p>Document Content</p>\n${sampleSIG}`;

// TEST 1: Default fallback
const assetsDefault = resolveContractAssets(null, null, null);
assert.strictEqual(assetsDefault.logoUrl, "");
assert.strictEqual(assetsDefault.signUrl, "");
const rendered1 = renderContractHtml(fullDoc, assetsDefault);
assert(rendered1.includes("Triple S Production"));
assert(rendered1.includes("contract-sign-empty"));
assert(!rendered1.includes("<div<div"));
assert(!rendered1.includes(">>"));
console.log("✔ Test 1 passed: No assets -> renders default letterhead banner & empty sign space");

// TEST 2: Global asset auto-applies
const globalAssets = {
  logo: "https://example.com/global_logo.png",
  sign: "https://example.com/global_sign.png",
};
const assetsInherited = resolveContractAssets({ id: "doc-1" }, globalAssets.logo, globalAssets.sign);
assert.strictEqual(assetsInherited.logoUrl, globalAssets.logo);
assert.strictEqual(assetsInherited.signUrl, globalAssets.sign);
assert.strictEqual(assetsInherited.isSpecificLogo, false);
assert.strictEqual(assetsInherited.isSpecificSign, false);

const rendered2 = renderContractHtml(fullDoc, assetsInherited);
assert(rendered2.includes(globalAssets.logo));
assert(rendered2.includes(globalAssets.sign));
assert(!rendered2.includes("<div<div"));
assert(!rendered2.includes(">>"));
console.log("✔ Test 2 passed: Global asset auto-applies to documents without specific assets");

// TEST 3: Document-specific overrides global asset
const docSpecificAssets = {
  id: "doc-special",
  logoUrl: "https://example.com/doc_logo.png",
  signUrl: "https://example.com/doc_sign.png",
};
const assetsOverridden = resolveContractAssets(docSpecificAssets, globalAssets.logo, globalAssets.sign);
assert.strictEqual(assetsOverridden.logoUrl, docSpecificAssets.logoUrl);
assert.strictEqual(assetsOverridden.signUrl, docSpecificAssets.signUrl);
assert.strictEqual(assetsOverridden.isSpecificLogo, true);
assert.strictEqual(assetsOverridden.isSpecificSign, true);

const rendered3 = renderContractHtml(fullDoc, assetsOverridden);
assert(rendered3.includes(docSpecificAssets.logoUrl));
assert(rendered3.includes(docSpecificAssets.signUrl));
assert(!rendered3.includes(globalAssets.logo));
assert(!rendered3.includes(globalAssets.sign));
console.log("✔ Test 3 passed: Document-specific asset overrides global asset for that document");

// TEST 4: Isolation
const docAnother = { id: "doc-another" };
const assetsAnother = resolveContractAssets(docAnother, globalAssets.logo, globalAssets.sign);
assert.strictEqual(assetsAnother.logoUrl, globalAssets.logo);
assert.strictEqual(assetsAnother.signUrl, globalAssets.sign);
assert.strictEqual(assetsAnother.isSpecificLogo, false);
console.log("✔ Test 4 passed: Other documents inherit global assets, isolated from doc-specific asset");

// TEST 5: Fallback on remove
const docCleared = { id: "doc-special", logoUrl: "", signUrl: "" };
const assetsCleared = resolveContractAssets(docCleared, globalAssets.logo, globalAssets.sign);
assert.strictEqual(assetsCleared.logoUrl, globalAssets.logo);
assert.strictEqual(assetsCleared.signUrl, globalAssets.sign);
assert.strictEqual(assetsCleared.isSpecificLogo, false);
assert.strictEqual(assetsCleared.isSpecificSign, false);
console.log("✔ Test 5 passed: Removing specific document asset immediately falls back to global asset");

// TEST 6: Global asset replacement / removal
const globalAssetsNew = {
  logo: "https://example.com/brand_v2.png",
  sign: "",
};
const assetsDocInheriting = resolveContractAssets({ id: "doc-1" }, globalAssetsNew.logo, globalAssetsNew.sign);
assert.strictEqual(assetsDocInheriting.logoUrl, "https://example.com/brand_v2.png");
assert.strictEqual(assetsDocInheriting.signUrl, "");

const assetsDocSpecialUnchanged = resolveContractAssets(docSpecificAssets, globalAssetsNew.logo, globalAssetsNew.sign);
assert.strictEqual(assetsDocSpecialUnchanged.logoUrl, docSpecificAssets.logoUrl);
assert.strictEqual(assetsDocSpecialUnchanged.signUrl, docSpecificAssets.signUrl);
console.log("✔ Test 6 passed: Replacing/removing global asset updates inheriting documents while doc-specific documents remain unchanged");

// TEST 7: Storage normalization
const stripped = stripContractAssetsForStorage(rendered3);
assert(stripped.includes("<!--LOGO-->"));
assert(stripped.includes("<!--SIGN-->"));
assert(!stripped.includes("doc_logo.png"));
assert(!stripped.includes("doc_sign.png"));
console.log("✔ Test 7 passed: stripContractAssetsForStorage normalizes slots and keeps saved templates clean");

// TEST 8: Positioning & Stray Character Sanitation (from screenshot bug)
const malformedInputFromScreenshot = `
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

const healedOutput = renderContractHtml(malformedInputFromScreenshot, assetsInherited);
assert(!healedOutput.includes("<div<div"), "Output must not contain broken <div<div tags");
assert(!healedOutput.includes(">>"), "Output must not contain double closing angle brackets");
assert(!/>[\s]*>[\s]*</.test(healedOutput), "Output must not contain stray > characters");
assert(healedOutput.includes("contenteditable=\"false\""), "Asset slots must have contenteditable=false to isolate from text cursor");
assert(healedOutput.includes(globalAssets.sign), "Output must contain the newly resolved signature URL");
console.log("✔ Test 8 passed: Self-heals malformed HTML, eliminates stray '>' and locks slots with contenteditable=false");

console.log("\nALL 8 TESTS PASSED SUCCESSFULLY! 🎉\n");
