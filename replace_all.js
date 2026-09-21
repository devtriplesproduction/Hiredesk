const fs = require('fs');
const path = require('path');
const dir = 'src/components/candidates';
const files = fs.readdirSync(dir);
files.forEach(f => {
  if (!f.endsWith('.tsx')) return;
  const fp = path.join(dir, f);
  let c = fs.readFileSync(fp, 'utf8');
  let original = c;
  c = c.replace(/\bbg-black\b(?!\/)/g, 'bg-[var(--bg2)]');
  c = c.replace(/\btext-white\b/g, 'text-[var(--text)]');
  c = c.replace(/border-white\/\[0\.10\]/g, 'border-[var(--border-2)]');
  c = c.replace(/border-white\/\[0\.05\]/g, 'border-[var(--border)]');
  c = c.replace(/border-white\/10\b/g, 'border-[var(--border-2)]');
  c = c.replace(/border-white\/5\b/g, 'border-[var(--border)]');
  c = c.replace(/border-white\/20\b/g, 'border-[var(--border-3)]');
  c = c.replace(/\btext-zinc-[12]00\b/g, 'text-[var(--text)]');
  c = c.replace(/\btext-zinc-300\b/g, 'text-[var(--text-2)]');
  c = c.replace(/\btext-zinc-400\b/g, 'text-[var(--text-2)]');
  c = c.replace(/\btext-zinc-[56]00\b/g, 'text-[var(--text-3)]');
  c = c.replace(/\bbg-zinc-[89]00\b/g, 'bg-[var(--card-bg)]');
  c = c.replace(/\bbg-white\/5\b/g, 'bg-[var(--glass-2)]');
  c = c.replace(/\bbg-white\/10\b/g, 'bg-[var(--glass-3)]');
  c = c.replace(/\bbg-white\/20\b/g, 'bg-[var(--glass-3)]');
  c = c.replace(/style=\{\{\s*background:\s*['"]#0[aA]0[aA]0[aA]['"].*?\}\}/g, 'style={{ background: "var(--bg)", border: "1px solid var(--border-2)", color: "var(--text)" }}');
  c = c.replace(/style=\{\{\s*background:\s*['"]#111111['"].*?\}\}/g, 'style={{ background: "var(--bg2)", border: "1px solid var(--border-2)", color: "var(--text)" }}');
  if (c !== original) {
    fs.writeFileSync(fp, c);
    console.log('Updated ' + f);
  }
});
