import type { Contract } from "@/types";

export interface ResolvedAssets {
  logoUrl: string;
  signUrl: string;
  isSpecificLogo: boolean;
  isSpecificSign: boolean;
  hasGlobalLogo: boolean;
  hasGlobalSign: boolean;
}

/**
 * Resolves assets with strict priority:
 * Specific document asset → Global Brand Asset → none ("").
 */
export function resolveContractAssets(
  contract?: { id?: string; logoUrl?: string | null; signUrl?: string | null } | null,
  globalLogo?: string | null,
  globalSign?: string | null
): ResolvedAssets {
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

/**
 * Generates the top-left logo HTML markup.
 */
export function getLogoHtml(logoUrl: string): string {
  if (logoUrl) {
    return `<img src="${logoUrl}" alt="Company Logo" class="contract-doc-logo" data-contract-asset="logo" style="height:56px;max-width:240px;object-fit:contain;display:block;pointer-events:none;" />`;
  }
  return `<div class="contract-doc-logo-default" data-contract-asset="logo-default" style="font-family:Arial,sans-serif;line-height:1.15;user-select:none;"><div style="font-size:18pt;font-weight:800;letter-spacing:-0.5px;color:#111">Triple S Production</div><div style="font-size:7.5pt;color:#666;text-transform:uppercase;letter-spacing:1.5px;margin-top:3px">Creative &middot; Technology &middot; Agency</div></div>`;
}

/**
 * Generates the Authorized Signatory signature HTML markup.
 */
export function getSignHtml(signUrl: string): string {
  if (signUrl) {
    return `<img src="${signUrl}" alt="Authorized Signature" class="contract-doc-sign" data-contract-asset="sign" style="height:86px;max-width:200px;object-fit:contain;display:block;pointer-events:none;" />`;
  }
  return `<div class="contract-sign-empty" data-contract-asset="sign-empty" style="height:86px;min-height:86px;user-select:none;"></div>`;
}

/**
 * Injects resolved logo and signature into document HTML with fixed, exact positioning:
 * - Logo → fixed top-left inside the A4 document header (56px container).
 * - Authorized Signature → fixed directly above "Authorized Signatory" label (96px container).
 *
 * Self-heals any previous malformed tags (e.g. `<div<div` or stray `>` characters)
 * and uses `contenteditable="false"` to prevent cursor/text drift.
 */
export function renderContractHtml(content: string, assets: ResolvedAssets): string {
  if (!content) return "";
  let html = content;

  // 0. Pre-cleaning: Sanitize malformed tags or stray characters from broken state
  html = html.replace(/<div\s*<div/gi, "<div");
  html = html.replace(/<div([^>]*>)\s*>\s*/gi, "<div$1");
  html = html.replace(/>\s*>\s*<img/gi, "><img");
  html = html.replace(/>\s*&gt;\s*</gi, "><");
  html = html.replace(/>\s*>\s*<div class="contract-sign-slot"/gi, '><div class="contract-sign-slot"');

  const logoHtml = getLogoHtml(assets.logoUrl);
  const signHtml = getSignHtml(assets.signUrl);

  const logoSlotHtml = `<div class="contract-logo-slot" data-slot="logo" contenteditable="false" style="height:56px;max-height:56px;display:flex;align-items:center;justify-content:flex-start;margin-bottom:8px;user-select:none;">${logoHtml}</div>`;
  const signSlotHtml = `<div class="contract-sign-slot" data-slot="sign" contenteditable="false" style="height:96px;min-height:96px;max-height:96px;display:flex;align-items:flex-end;justify-content:flex-start;margin-bottom:8px;user-select:none;">${signHtml}</div>`;

  // 1. Cover page watermark / explicit template img src replacements (MUST run before slot replacement!)
  const effectiveLogoUrl = assets.logoUrl || "/logo.png";
  html = html.replaceAll('src="<!--LOGO-->"', `src="${effectiveLogoUrl}"`);
  html = html.replaceAll("src='<!--LOGO-->'", `src='${effectiveLogoUrl}'`);

  // 2. Logo Slot Replacement
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

  // Post-cleaning verification: Ensure clean div tags
  html = html.replace(/<div\s*<div/gi, "<div");

  return html;
}

/**
 * Normalizes document HTML before persisting to store / database.
 * Replaces rendered logo & signature with standard template tokens so
 * documents dynamically inherit updated global or custom assets.
 */
export function stripContractAssetsForStorage(html: string): string {
  if (!html) return "";
  let clean = html;

  // Clean any malformed tag artifacts
  clean = clean.replace(/<div\s*<div/gi, "<div");
  clean = clean.replace(/<div([^>]*>)\s*>\s*/gi, "<div$1");
  clean = clean.replace(/>\s*>\s*<img/gi, "><img");

  // Restore watermark & header img src to <!--LOGO-->
  clean = clean.replace(/(<img[^>]*class="[^"]*(?:page-wm|wm|wm8|header-logo)[^"]*"[^>]*src=")[^"]*(")/gi, '$1<!--LOGO-->$2');

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

/**
 * Directly updates DOM nodes in the editor canvas without disrupting cursor or re-rendering everything.
 */
export function updateEditorDomAssets(editorEl: HTMLElement, assets: ResolvedAssets): void {
  // 1. Update Logo Slot
  let logoSlot = editorEl.querySelector<HTMLElement>(".contract-logo-slot, [data-slot='logo']");
  if (!logoSlot) {
    // Fallback: look for 56px height header div
    const fallbackLogo = editorEl.querySelector<HTMLElement>('div[style*="height:56px"], div[style*="height: 56px"]');
    if (fallbackLogo) {
      fallbackLogo.classList.add("contract-logo-slot");
      fallbackLogo.setAttribute("data-slot", "logo");
      logoSlot = fallbackLogo;
    }
  }

  if (logoSlot) {
    logoSlot.setAttribute("contenteditable", "false");
    logoSlot.style.userSelect = "none";
    logoSlot.style.height = "56px";
    logoSlot.style.display = "flex";
    logoSlot.style.alignItems = "center";
    logoSlot.style.marginBottom = "8px";
    logoSlot.innerHTML = getLogoHtml(assets.logoUrl);
  }

  // 2. Update Signature Slot
  let signSlot = editorEl.querySelector<HTMLElement>(".contract-sign-slot, [data-slot='sign']");
  if (!signSlot) {
    // Fallback: find 96px div above Authorized Signatory
    const allDivs = Array.from(editorEl.querySelectorAll<HTMLElement>("div"));
    const authSignLabel = allDivs.find(d => d.textContent?.trim() === "Authorized Signatory");
    if (authSignLabel) {
      const parentCol = authSignLabel.closest("div[style*='border-top']")?.parentElement;
      const slotCandidate = parentCol?.querySelector<HTMLElement>('div[style*="height:96px"], div[style*="height: 96px"]');
      if (slotCandidate) {
        slotCandidate.classList.add("contract-sign-slot");
        slotCandidate.setAttribute("data-slot", "sign");
        signSlot = slotCandidate;
      }
    }
  }

  if (signSlot) {
    // Remove any accidental stray '>' text nodes preceding the slot
    if (signSlot.previousSibling && signSlot.previousSibling.nodeType === Node.TEXT_NODE) {
      if (signSlot.previousSibling.textContent?.trim() === ">") {
        signSlot.previousSibling.remove();
      }
    }

    signSlot.setAttribute("contenteditable", "false");
    signSlot.style.userSelect = "none";
    signSlot.style.height = "96px";
    signSlot.style.minHeight = "96px";
    signSlot.style.display = "flex";
    signSlot.style.alignItems = "flex-end";
    signSlot.style.marginBottom = "8px";
    signSlot.innerHTML = getSignHtml(assets.signUrl);
  }
}
