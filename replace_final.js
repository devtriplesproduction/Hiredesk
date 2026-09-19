const fs = require('fs');
const path = require('path');
const dir = 'src/components/candidates';
const files = fs.readdirSync(dir);
files.forEach(f => {
  if (!f.endsWith('.tsx')) return;
  const fp = path.join(dir, f);
  let c = fs.readFileSync(fp, 'utf8');
  let original = c;

  c = c.replaceAll('rgba(255, 255, 255, 0.08)', 'var(--border)');
  c = c.replaceAll('rgba(255, 255, 255, 0.10)', 'var(--border-2)');
  c = c.replaceAll('rgba(255,255,255,0.03)', 'var(--glass-2)');
  c = c.replaceAll('rgba(255,255,255,0.05)', 'var(--glass-2)');
  c = c.replace(/hover:border-zinc-[45]00/g, 'hover:border-[var(--border-3)]');
  c = c.replace(/hover:bg-zinc-200/g, 'hover:bg-[var(--text-2)]');
  c = c.replace(/text-bg2 bg-white/g, 'text-[var(--bg2)] bg-[var(--text)]');
  c = c.replace(/from-white/g, 'from-[var(--text)]');
  c = c.replace(/to-zinc-400/g, 'to-[var(--text-3)]');
  c = c.replace(/border-zinc-900\/60/g, 'border-[var(--border)]');
  c = c.replace(/border-zinc-[89]00/g, 'border-[var(--border-2)]');
  c = c.replace(/border-t-white/g, 'border-t-[var(--text)]');
  c = c.replace(/border-zinc-600/g, 'border-[var(--border-3)]');

  if (c !== original) {
    fs.writeFileSync(fp, c);
    console.log('Cleaned up ' + f);
  }
});
