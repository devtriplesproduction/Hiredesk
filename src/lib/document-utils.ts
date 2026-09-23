
// Utility functions for Document Studio

export function val(x: string | null | undefined): string {
  if (!x) return "-";
  return esc(x.toString().replace(/\[.*?\]/g, "").trim()) || "-";
}

export function esc(s: string): string {
  if (!s) return "";
  return s.replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;")
    .replace(/\n/g, "<br>");
}

export const INK = "#111111";

const PATHS = {
  briefcase: '<rect x="3" y="7.5" width="18" height="12.5" rx="1.6"/><path d="M8.5 7.5V5.8C8.5 4.8 9.3 4 10.3 4H13.7C14.7 4 15.5 4.8 15.5 5.8V7.5"/><line x1="3" y1="13" x2="21" y2="13"/>',
  user: '<circle cx="12" cy="8.3" r="3.6"/><path d="M4.8 20c0-3.8 3.2-6.3 7.2-6.3s7.2 2.5 7.2 6.3"/>',
  users: '<circle cx="9" cy="8" r="3.1"/><path d="M3.3 19.3c0-3.3 2.6-5.6 5.7-5.6s5.7 2.3 5.7 5.6"/><circle cx="17" cy="9" r="2.4"/><path d="M15 14.3c2.7 0.3 4.5 2.3 4.7 5"/>',
  pin: '<path d="M12 21C12 21 5.5 14.7 5.5 9.8C5.5 6 8.4 3 12 3S18.5 6 18.5 9.8C18.5 14.7 12 21 12 21Z"/><circle cx="12" cy="9.6" r="2.6"/>',
  hourglass: '<path d="M6 3H18"/><path d="M6 21H18"/><path d="M7 3C7 8 12 10 12 12C12 10 17 8 17 3"/><path d="M7 21C7 16 12 14 12 12C12 14 17 16 17 21"/>',
  clock: '<circle cx="12" cy="12" r="8.5"/><polyline points="12,7.3 12,12 15.3,14"/>',
  calendar: '<rect x="3.5" y="4.5" width="17" height="16" rx="1.5"/><line x1="3.5" y1="9.5" x2="20.5" y2="9.5"/><line x1="8" y1="2.7" x2="8" y2="6.3"/><line x1="16" y1="2.7" x2="16" y2="6.3"/>',
  bell: '<path d="M6 10.5c0-3.6 2.7-6 6-6s6 2.4 6 6c0 4 1.4 5.4 1.4 5.4H4.6S6 14.5 6 10.5Z"/><path d="M10 19a2 2 0 0 0 4 0"/>',
  clipboard: '<rect x="5.5" y="4.5" width="13" height="16" rx="1.4"/><rect x="9" y="2.8" width="6" height="3.2" rx="0.8"/><line x1="8.3" y1="11" x2="15.7" y2="11"/><line x1="8.3" y1="14.6" x2="15.7" y2="14.6"/>',
  file: '<rect x="5.5" y="3" width="13" height="18" rx="1.3"/><line x1="8" y1="8" x2="16" y2="8"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="8" y1="16" x2="13" y2="16"/>',
  lock: '<rect x="5" y="10.5" width="14" height="10" rx="1.6"/><path d="M7.5 10.5V7.8C7.5 5.2 9.5 3 12 3S16.5 5.2 16.5 7.8V10.5"/><circle cx="12" cy="15" r="1.4" fill="currentColor" stroke="none"/>',
  scale: '<line x1="12" y1="3" x2="12" y2="20"/><line x1="6" y1="6.5" x2="18" y2="6.5"/><path d="M6.5 6.5L3 13.5C4.7 15 7.3 15 9 13.5Z"/><path d="M17.5 6.5L14 13.5C15.7 15 18.3 15 20 13.5Z"/><line x1="8.5" y1="21" x2="15.5" y2="21"/>',
  cpu: '<rect x="7" y="7" width="10" height="10" rx="1.2"/><rect x="10" y="10" width="4" height="4"/><line x1="9" y1="2.8" x2="9" y2="5.3"/><line x1="15" y1="2.8" x2="15" y2="5.3"/><line x1="9" y1="18.7" x2="9" y2="21.2"/><line x1="15" y1="18.7" x2="15" y2="21.2"/><line x1="2.8" y1="9" x2="5.3" y2="9"/><line x1="2.8" y1="15" x2="5.3" y2="15"/><line x1="18.7" y1="9" x2="21.2" y2="9"/><line x1="18.7" y1="15" x2="21.2" y2="15"/>',
  search: '<circle cx="10.8" cy="10.8" r="6.3"/><line x1="15.5" y1="15.5" x2="20.5" y2="20.5"/>',
  "badge-check": '<path d="M12 2.5 L14.5 4.8 L18 4.5 L18.5 8 L21.2 10.3 L19.5 13.3 L20.5 16.7 L17.1 17.5 L15.3 20.5 L12 19 L8.7 20.5 L6.9 17.5 L3.5 16.7 L4.5 13.3 L2.8 10.3 L5.5 8 L6 4.5 L9.5 4.8 Z"/><polyline points="8.6,12.3 10.8,14.5 15.4,9.7"/>',
  shield: '<path d="M12 3 L19.5 6.3 V11.2C19.5 15.8 16.3 19.4 12 21C7.7 19.4 4.5 15.8 4.5 11.2V6.3Z"/><polyline points="8.6,12 10.8,14.2 15.4,9.4"/>',
  compass: '<circle cx="12" cy="12" r="9"/><polygon points="15.3,8.7 13.2,13.2 8.7,15.3 10.8,10.8"/>',
  eye: '<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z"/><circle cx="12" cy="12" r="3"/>',
  heart: '<path d="M12 20.3c-5-3.6-9-7-9-11.2C3 6 5 4 7.6 4C9.4 4 11 5 12 6.5C13 5 14.6 4 16.4 4C19 4 21 6 21 9.1C21 13.3 17 16.7 12 20.3Z"/>',
  quote: '<path d="M4 12V8.5C4 6 6 4 8.5 4H9V9H6.5C6.5 9 6.5 12 9 12V16H4V12Z"/><path d="M14 12V8.5C14 6 16 4 18.5 4H19V9H16.5C16.5 9 16.5 12 19 12V16H14V12Z"/>',
  globe: '<circle cx="12" cy="12" r="9"/><ellipse cx="12" cy="12" rx="4" ry="9"/><line x1="3" y1="12" x2="21" y2="12"/><path d="M4.5 7.5h15M4.5 16.5h15"/>',
  mail: '<rect x="3.2" y="5.5" width="17.6" height="13" rx="1.3"/><polyline points="3.6,6.3 12,13 20.4,6.3"/>',
  phone: '<path d="M7.8 3.5L10.6 3.5L12.2 7.7L10 9.6C10.9 12 12.4 13.9 14.7 14.9L16.4 12.5L20.5 14.1V17C20.5 18.4 19.4 19.6 18 19.5C10.5 19 4.9 13.3 4.5 5.8C4.4 4.5 5.6 3.5 6.9 3.5Z"/>',
  siren: '<path d="M12 4a5 5 0 0 1 5 5v6H7v-6a5 5 0 0 1 5-5Z"/><line x1="4.5" y1="15" x2="19.5" y2="15"/><line x1="12" y1="2" x2="12" y2="4"/><line x1="4" y1="7" x2="5.5" y2="8.2"/><line x1="20" y1="7" x2="18.5" y2="8.2"/>',
  pencil: '<path d="M4 20 L4 16.2 L14.9 5.3 L18.7 9.1 L7.8 20Z"/><line x1="12.7" y1="7.5" x2="16.5" y2="11.3"/>',
  "document-check": '<rect x="5.5" y="3" width="13" height="18" rx="1.3"/><polyline points="8.7,12.4 10.6,14.3 15.3,9.6"/>',
  laptop: '<rect x="4.5" y="4.5" width="15" height="10" rx="1"/><path d="M2.3 18.5H21.7L20 20.5H4Z"/>',
  party: '<path d="M4 20L9 8.5L15.5 15Z"/><line x1="14" y1="4" x2="14" y2="6.3"/><line x1="18.2" y1="6.6" x2="16.6" y2="8.2"/><line x1="20.3" y1="10.7" x2="18" y2="10.9"/><circle cx="17" cy="4.5" r="0.9" fill="currentColor" stroke="none"/>',
  "chevron-down": '<polyline points="6,9 12,15 18,9"/>',
  stamp: '<path d="M9 3.5h6c1 0 1.7 0.8 1.7 1.8V9c0 1.3-1 2.4-2.3 2.6L16 13.5h1.2c1.2 0 2.3 0.9 2.3 2.2V17H4.5v-1.3c0-1.3 1.1-2.2 2.3-2.2H8l1.6-1.9C8.3 11.4 7.3 10.3 7.3 9V5.3C7.3 4.3 8 3.5 9 3.5Z"/><line x1="4" y1="20.5" x2="20" y2="20.5"/>'
};

export function icon(name: keyof typeof PATHS | string, size?: number, color?: string): string {
  const c = color || INK;
  const s = size || 24;
  const path = (PATHS as any)[name] || (PATHS as any).file;
  return `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${path}</svg>`;
}

export function badge(name: keyof typeof PATHS | string, size?: number, invert?: boolean, bg?: string): string {
  const s = size || 36;
  const ic = invert ? "#fff" : INK;
  const bc = invert ? INK : (bg || "transparent");
  const is = Math.floor(s * 0.45);
  return `<div class="badge" style="width:${s}px;height:${s}px;background:${bc};color:${ic};">${icon(name, is, ic)}</div>`;
}

export function page(inner: string, num: number, d: any, docName?: string, totalPages?: number): string {
  return `<div class="page document-studio-wrapper">
    <div class="hd"><div class="l"><!--LOGO--></div><div class="c"><div class="t1">${docName || 'Offer Letter'}</div><div class="t2">Triple S Production</div></div><div class="r">${val(d.refNo)}</div></div>
    <div class="content">${inner}</div>
    <div class="ft"><div>Strictly Private &amp; Confidential</div>${totalPages ? `<div>Page ${num} of ${totalPages}</div>` : ''}</div>
  </div>`;
}

export const DOCUMENT_STUDIO_CSS = `

    .document-studio-wrapper {
      --ink: #111111;
      --muted: #6B6B6B;
      --g1: #F5F5F5;
      --g2: #EAEAEA;
      --line: #E1E1E1;
      --accent: #A6742E;
      box-sizing: border-box;
      font-family: 'Poppins', 'Segoe UI', Arial, sans-serif;
    }

    .document-studio-wrapper * {
      box-sizing: border-box;
    }

    .page {
      width: 210mm;
      height: 297mm;
      position: relative;
      background: #fff;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.15);
      overflow: hidden;
      flex-shrink: 0;
    }

    .ph {
      color: var(--accent);
      font-weight: 600;
    }

    .hd {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 22mm;
      padding: 0 16mm;
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 0.9pt solid var(--ink);
    }

    .hd .l img {
      height: 34px;
    }

    .hd .c {
      text-align: center;
      line-height: 1.35;
    }

    .hd .c .t1 {
      font-size: 10.5pt;
      font-weight: 700;
    }

    .hd .c .t2 {
      font-size: 9.5pt;
      color: var(--ink);
      font-weight: 600;
    }

    .hd .r {
      font-size: 8.5pt;
      color: var(--muted);
      font-weight: 500;
      width: 30mm;
      text-align: right;
      white-space: nowrap;
      flex-shrink: 0;
    }

    .ft {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      height: 16mm;
      padding: 0 16mm;
      border-top: 0.7pt solid var(--line);
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 7.6pt;
      color: var(--muted);
    }

    .ft>div:first-child {
      flex-shrink: 0;
      white-space: nowrap;
    }

    .ft>div:last-child {
      flex-shrink: 0;
      white-space: nowrap;
      text-align: right;
    }

    .content {
      position: absolute;
      top: 22mm;
      bottom: 16mm;
      left: 16mm;
      right: 16mm;
      padding-top: 7mm;
    }

    h1.pt {
      font-size: 23pt;
      font-weight: 700;
      margin: 0 0 3mm 0;
      line-height: 1.25;
    }

    p.body {
      font-size: 10.3pt;
      line-height: 1.6;
      margin: 0 0 3.5mm 0;
      color: #2b2b2b;
    }

    .badge {
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .cover {
      background: var(--ink);
      color: #fff;
    }

    .cover .wm {
      position: absolute;
      left: 20mm;
      top: 63.5mm;
      width: 170mm;
      height: 170mm;
      opacity: 0.06;
    }

    .cover .innerc {
      position: relative;
      z-index: 1;
      height: 100%;
      padding: 18mm;
      display: flex;
      flex-direction: column;
    }

    .cover .logo-row {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .cover .logo-row img {
      height: 34px;
    }

    .cover .logo-row .word {
      font-size: 12.5pt;
      font-weight: 700;
      line-height: 1.2;
    }

    .cover .logo-row .word .subw {
      display: block;
      font-size: 7.5pt;
      font-weight: 400;
      color: #b9b9b9;
      letter-spacing: 1px;
    }

    .cover .mid {
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: center;
    }

    .cover .title {
      font-size: 40pt;
      font-weight: 700;
      line-height: 1.15;
      margin: 0 0 5mm 0;
    }

    .cover .rule-w {
      width: 52px;
      height: 3px;
      background: #fff;
      margin: 0 0 7mm 0;
    }

    .cover .tagline {
      font-size: 10.5pt;
      font-weight: 500;
      color: #d8d8d8;
      letter-spacing: 0.5px;
    }

    .cover .tagline b {
      color: #fff;
    }

    .cover .bottom {
      border-top: 1px solid #333;
      padding-top: 6mm;
    }

    .cover .metarow {
      display: flex;
      gap: 0;
    }

    .cover .metarow .m {
      flex: 1;
    }

    .cover .metarow .lbl {
      font-size: 7.3pt;
      letter-spacing: 1px;
      color: #999;
      font-weight: 600;
      text-transform: uppercase;
    }

    .cover .metarow .val {
      font-size: 11pt;
      font-weight: 600;
      margin-top: 1.5mm;
    }

    .cover .confbar {
      display: flex;
      justify-content: space-between;
      margin-top: 8mm;
      font-size: 8pt;
      color: #999;
    }

    @media print {
      * {
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
        color-adjust: exact !important;
      }
    }

    .strip {
      display: flex;
      gap: 0;
      margin-top: 6mm;
      border: 1px solid var(--line);
      border-radius: 10px;
      overflow: hidden;
    }

    .strip .cell {
      flex: 1;
      padding: 8px 10px;
      border-right: 1px solid var(--line);
    }

    .strip .cell:last-child {
      border-right: none;
    }

    .strip .cell .lbl {
      font-size: 7.2pt;
      color: var(--muted);
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .strip .cell .val {
      font-size: 9.3pt;
      font-weight: 600;
      margin-top: 1.5mm;
    }

    .infocard2 {
      border: 1px solid var(--line);
      border-radius: 12px;
      margin-top: 7mm;
    }

    .infocard2 .hd2 {
      background: var(--ink);
      color: #fff;
      font-size: 9pt;
      font-weight: 600;
      padding: 9px 16px;
      border-radius: 12px 12px 0 0;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .infocard2 .rows {
      display: flex;
      flex-wrap: wrap;
    }

    .infocard2 .row2 {
      width: 50%;
      display: flex;
      gap: 10px;
      align-items: flex-start;
      padding: 10px 16px;
      border-bottom: 1px solid var(--line);
    }

    .infocard2 .row2:nth-last-child(-n+2) {
      border-bottom: none;
    }

    .infocard2 .row2 .lbl {
      font-size: 7.2pt;
      color: var(--muted);
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .infocard2 .row2 .val {
      font-size: 9.6pt;
      font-weight: 600;
      margin-top: 1px;
    }

    .banner {
      margin-top: 6mm;
      background: var(--g1);
      border-radius: 10px;
      padding: 12px 16px;
      display: flex;
      gap: 10px;
      align-items: flex-start;
      font-size: 9.3pt;
      line-height: 1.5;
    }

    .sig2 {
      margin-top: 7mm;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
    }

    .sig2 .name {
      font-size: 10.5pt;
      font-weight: 700;
    }

    .sig2 .role {
      font-size: 8.4pt;
      color: var(--muted);
    }

    .payflow {
      display: flex;
      align-items: stretch;
      gap: 0;
      margin-top: 6mm;
    }

    .payflow .panel {
      flex: 1;
      border: 1px solid var(--line);
      border-radius: 12px;
      padding: 16px 20px;
    }

    .payflow .panel.dark {
      background: var(--ink);
      color: #fff;
      border-color: var(--ink);
    }

    .payflow .panel .kicker2 {
      font-size: 8pt;
      font-weight: 600;
      letter-spacing: 0.6px;
      text-transform: uppercase;
      opacity: 0.7;
    }

    .payflow .panel .amt {
      font-size: 19pt;
      font-weight: 700;
      margin-top: 5px;
    }

    .payflow .panel .sub2 {
      font-size: 8pt;
      margin-top: 3px;
      opacity: 0.7;
    }

    .payflow .arrow {
      width: 34px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--muted);
      flex-shrink: 0;
    }

    .paycard {
      border: 1px solid var(--line);
      border-radius: 12px;
      margin-top: 7mm;
      overflow: hidden;
    }

    .paycard .row2f {
      display: flex;
      gap: 12px;
      align-items: flex-start;
      padding: 11px 16px;
      border-bottom: 1px solid var(--line);
    }

    .paycard .row2f:last-child {
      border-bottom: none;
    }

    .paycard .row2f .h {
      font-size: 9.4pt;
      font-weight: 700;
    }

    .paycard .row2f .d {
      font-size: 8.3pt;
      color: var(--muted);
      margin-top: 1px;
    }

    .lgrid {
      display: flex;
      flex-wrap: wrap;
      gap: 5mm;
      margin-top: 5mm;
    }

    .lcard {
      width: calc(50% - 2.5mm);
      border: 1px solid var(--line);
      border-radius: 12px;
      padding: 14px 16px;
      display: flex;
      gap: 11px;
      align-items: flex-start;
      height: 33mm;
    }

    .lcard .h {
      font-size: 10pt;
      font-weight: 700;
      margin-bottom: 2px;
    }

    .lcard .d {
      font-size: 8.4pt;
      color: var(--muted);
      line-height: 1.45;
    }

    .mvrow {
      display: flex;
      gap: 8mm;
      margin-top: 5mm;
    }

    .mvblock {
      flex: 1;
      border: 1px solid var(--line);
      border-radius: 12px;
      padding: 14px 16px;
    }

    .mvblock .h {
      font-size: 10.5pt;
      font-weight: 700;
      margin-top: 8px;
    }

    .mvblock .d {
      font-size: 8.6pt;
      color: var(--muted);
      line-height: 1.5;
      margin-top: 3px;
    }

    .valuesgrid5b {
      display: flex;
      flex-wrap: wrap;
      gap: 5mm;
      margin-top: 6mm;
    }

    .valcard5b {
      width: calc(33.333% - 3.34mm);
      border: 1px solid var(--line);
      border-radius: 12px;
      padding: 14px;
    }

    .valcard5b .h {
      font-size: 9.6pt;
      font-weight: 700;
      margin-top: 8px;
    }

    .valcard5b .d {
      font-size: 8pt;
      color: var(--muted);
      line-height: 1.45;
      margin-top: 2px;
    }

    .benefitstrip {
      display: flex;
      gap: 5mm;
      margin-top: 6mm;
    }

    .benefitchip {
      flex: 1;
      border: 1px solid var(--line);
      border-radius: 10px;
      padding: 10px 12px;
      display: flex;
      gap: 9px;
      align-items: center;
    }

    .benefitchip .h {
      font-size: 8.6pt;
      font-weight: 600;
    }

    .benefitchip .d {
      font-size: 7.2pt;
      color: var(--muted);
    }

    .quote5 {
      margin-top: 7mm;
      background: var(--ink);
      color: #fff;
      border-radius: 12px;
      padding: 14px 20px;
      display: flex;
      gap: 12px;
      align-items: center;
    }

    .quote5 .qt {
      font-size: 11.5pt;
      font-weight: 600;
      line-height: 1.4;
      font-style: italic;
    }

    .quote5 .qa {
      font-size: 8pt;
      color: #bbb;
      margin-top: 3px;
      font-style: normal;
    }

    .roadmap {
      margin-top: 6mm;
    }

    .rstep {
      display: flex;
      gap: 12px;
      position: relative;
      padding-bottom: 9mm;
    }

    .rstep .col {
      display: flex;
      flex-direction: column;
      align-items: center;
    }

    .rstep .connector {
      width: 1.4px;
      flex: 1;
      background: var(--g2);
      margin-top: 2px;
    }

    .rstep:last-child .connector {
      display: none;
    }

    .rstep .box {
      flex: 1;
      display: flex;
      align-items: center;
      gap: 12px;
      background: var(--g1);
      border-radius: 10px;
      padding: 9px 14px;
      margin-top: -2px;
    }

    .rstep .box .h {
      font-size: 9.8pt;
      font-weight: 700;
    }

    .rstep .box .d {
      font-size: 8.3pt;
      color: var(--muted);
      margin-top: 1px;
    }

    .p7wrap {
      display: flex;
      gap: 8mm;
      margin-top: 4mm;
    }

    .p7col {
      flex: 1;
    }

    .p7col h3 {
      font-size: 10.5pt;
      font-weight: 700;
      margin: 0 0 4mm 0;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .p7list {
      display: flex;
      flex-direction: column;
      gap: 7px;
    }

    .p7item {
      display: flex;
      gap: 8px;
      font-size: 8.8pt;
      line-height: 1.5;
      color: #2b2b2b;
    }

    .p7item .dot {
      width: 5px;
      height: 5px;
      border-radius: 50%;
      background: var(--ink);
      margin-top: 6px;
      flex-shrink: 0;
    }

    .polstrip {
      display: flex;
      gap: 5mm;
      margin-top: 7mm;
    }

    .polchip {
      flex: 1;
      border: 1px solid var(--line);
      border-radius: 10px;
      padding: 9px 12px;
      display: flex;
      gap: 9px;
      align-items: center;
    }

    .polchip .h {
      font-size: 8.6pt;
      font-weight: 600;
    }

    .polchip .d {
      font-size: 7.2pt;
      color: var(--muted);
    }

    .helpcard {
      margin-top: 6mm;
      background: var(--ink);
      color: #fff;
      border-radius: 14px;
      padding: 14px 18px;
      display: flex;
      gap: 14px;
      align-items: center;
    }

    .helpcard .cols {
      flex: 1;
      display: flex;
      flex-wrap: wrap;
      gap: 6px 18px;
    }

    .helpcard .h {
      font-size: 10.5pt;
      font-weight: 700;
      margin-bottom: 6px;
      width: 100%;
    }

    .helpcard .row7 {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 8.6pt;
      width: calc(50% - 9px);
    }

    .helpcard .qr {
      width: 22mm;
      height: 22mm;
      background: #fff;
      border-radius: 8px;
      padding: 2mm;
      flex-shrink: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 6pt;
      color: #999;
      text-align: center;
    }

    .p8 .statement {
      background: var(--g1);
      border-radius: 12px;
      padding: 14px 18px;
      font-size: 9.6pt;
      line-height: 1.6;
      margin-top: 4mm;
    }

    .sigwrap {
      display: flex;
      gap: 8mm;
      margin-top: 10mm;
    }

    .sigbox {
      flex: 1;
      border: 1px solid var(--line);
      border-radius: 12px;
      padding: 20px;
      height: 54mm;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }

    .sigbox .lbl {
      font-size: 8.4pt;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.6px;
      color: var(--muted);
    }

    .sigbox .line {
      border-bottom: 1px solid #999;
      height: 20mm;
    }

    .sigbox .name {
      font-size: 9.8pt;
      font-weight: 700;
      margin-top: 2px;
    }

    .sigbox .date {
      font-size: 8.4pt;
      color: var(--muted);
    }

    .stamprow {
      display: flex;
      gap: 8mm;
      margin-top: 8mm;
    }

    .stampbox {
      flex: 1;
      border: 1.4px dashed var(--g2);
      border-radius: 12px;
      height: 32mm;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      color: #bbb;
      gap: 4px;
    }

    .stampbox .lbl {
      font-size: 7.6pt;
      letter-spacing: 1px;
      text-transform: uppercase;
    }

    .welcome8 {
      margin-top: 10mm;
      background: var(--ink);
      color: #fff;
      border-radius: 14px;
      padding: 22px;
      text-align: center;
      position: relative;
      overflow: hidden;
    }

    .welcome8 .wm8 {
      position: absolute;
      right: -20mm;
      top: -14mm;
      width: 80mm;
      opacity: 0.06;
    }

    .welcome8 .h {
      font-size: 14pt;
      font-weight: 700;
      position: relative;
    }

    .welcome8 .d {
      font-size: 9pt;
      color: #bbb;
      margin-top: 4px;
      position: relative;
    }


    .fsection.hidden {
      display: none;
    }

    #docType {
      width: 100%;
      padding: 8px 9px;
      font-size: 12.5px;
      border: 1px solid #ccc;
      border-radius: 6px;
      font-family: inherit;
      background: #fff;
    }

    optgroup {
      font-weight: 700;
    }

    .reviewflag {
      margin: 10px 0 4px;
      font-size: 10.6px;
      line-height: 1.5;
      background: #FBF3E7;
      border: 1px solid #E3C48C;
      color: #7A5518;
      border-radius: 7px;
      padding: 8px 10px;
    }

    .subjectline {
      font-weight: 700;
      text-decoration: underline;
      margin: 4mm 0 3mm;
      font-size: 10.5pt;
    }

    @media print {

      html,
      body {
        margin: 0 !important;
        padding: 0 !important;
      }

      body {
        background: #fff;
      }

      .sidebar,
      .preview-wrap-controls {
        display: none !important;
      }

      .app {
        display: block;
      }

      .preview-wrap {
        padding: 0;
        gap: 0;
        display: block;
      }

      .page {
        box-shadow: none;
        page-break-after: always;
        margin: 0 !important;
      }

      .page:last-child {
        page-break-after: auto;
      }

      * {
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
        color-adjust: exact;
      }

      @page {
        size: A4;
        margin: 0;
      }
    }
  
`;
