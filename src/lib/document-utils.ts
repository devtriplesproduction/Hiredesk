
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

const PATHS = {};

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

    :root {
      --ink: #111111;
      --muted: #6B6B6B;
      --g1: #F5F5F5;
      --g2: #EAEAEA;
      --line: #E1E1E1;
      --accent: #A6742E;
    }

    * {
      box-sizing: border-box;
    }

    body {
      margin: 0;
      font-family: 'Poppins', 'Segoe UI', Arial, sans-serif;
      background: #e8e8ea;
      color: var(--ink);
    }

    .app {
      display: flex;
      height: 100vh;
    }

    .sidebar {
      width: 380px;
      flex-shrink: 0;
      background: #fff;
      border-right: 1px solid #ddd;
      overflow-y: auto;
      padding: 20px;
    }

    .sidebar h1 {
      font-size: 15px;
      font-weight: 700;
      margin: 0 0 4px 0;
    }

    .sidebar .sub {
      font-size: 11px;
      color: var(--muted);
      margin-bottom: 16px;
    }

    .sidebar h2 {
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: var(--muted);
      margin: 18px 0 8px 0;
      border-top: 1px solid #eee;
      padding-top: 14px;
    }

    .sidebar h2:first-of-type {
      border-top: none;
      padding-top: 0;
    }

    .field {
      margin-bottom: 10px;
    }

    .field label {
      display: block;
      font-size: 11px;
      font-weight: 600;
      margin-bottom: 3px;
      color: #333;
    }

    .field input {
      width: 100%;
      padding: 7px 9px;
      font-size: 12.5px;
      border: 1px solid #ccc;
      border-radius: 6px;
      font-family: inherit;
    }

    .field input:focus {
      outline: 2px solid #111;
      outline-offset: 0;
    }

    .btnrow {
      position: sticky;
      bottom: 0;
      background: #fff;
      padding-top: 12px;
      margin-top: 16px;
      border-top: 1px solid #eee;
    }

    .btn {
      width: 100%;
      padding: 11px;
      border-radius: 8px;
      border: none;
      background: #111;
      color: #fff;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      margin-bottom: 8px;
    }

    .btn.secondary {
      background: #fff;
      color: #111;
      border: 1px solid #ccc;
    }

    .btn:hover {
      opacity: 0.9;
    }

    .note {
      font-size: 10.5px;
      color: var(--muted);
      line-height: 1.5;
      margin-top: 8px;
    }

    .preview-wrap {
      flex: 1;
      overflow-y: auto;
      padding: 30px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 20px;
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
