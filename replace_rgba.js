const fs = require('fs');
const path = require('path');
const dir = 'src/components/candidates';
const files = fs.readdirSync(dir);
files.forEach(f => {
  if (!f.endsWith('.tsx')) return;
  const fp = path.join(dir, f);
  let c = fs.readFileSync(fp, 'utf8');
  let original = c;

  // Replace background: rgba(255,255,255, x) with var(--card-bg) or var(--glass-2)
  c = c.replace(/background:\s*['"]rgba\(\s*255\s*,\s*255\s*,\s*255\s*,\s*0\.[0-9]+\)['"]/g, 'background: "var(--glass-2)"');
  
  // Replace border: 1px solid rgba(255,255,255, x) with var(--border-2)
  c = c.replace(/border:\s*['"][0-9]+px\s+solid\s+rgba\(\s*255\s*,\s*255\s*,\s*255\s*,\s*0\.[0-9]+\)['"]/g, 'border: "1px solid var(--border-2)"');

  // Replace border-white/[0.15] etc in tailwind classes
  c = c.replace(/border-white\/\[0\.[0-9]+\]/g, 'border-[var(--border-2)]');
  c = c.replace(/border-white\/\d+/g, 'border-[var(--border-2)]');
  
  // Replace bg-white/[0.03] etc in tailwind classes
  c = c.replace(/bg-white\/\[0\.[0-9]+\]/g, 'bg-[var(--glass-2)]');

  // Replace text-white/[0.x] in tailwind classes
  c = c.replace(/text-white\/\[0\.[0-9]+\]/g, 'text-[var(--text-3)]');
  
  // Replace rgba(0,0,0,x) in borders/backgrounds to use variables if they are not meant for modal overlays
  // Actually, rgba(0,0,0,0.82) is for the modal backdrop. Let's keep it.
  
  // Replace box-shadow using rgba(0,0,0,x) with var(--card-shadow) if needed, but it's ok to leave black shadows in light mode.
  // Wait, there is rgba(0,0,0, 0.4) as background? Let's check where it is used.
  c = c.replace(/background:\s*['"]rgba\(\s*0\s*,\s*0\s*,\s*0\s*,\s*0\.[3-9]+\)['"]/g, 'background: "var(--bg2)"');

  // Any left over bg-black
  c = c.replace(/\bbg-black\b(?!\/)/g, 'bg-[var(--bg2)]');
  c = c.replace(/\bbg-black\/[0-9]+\b/g, 'bg-[var(--glass-2)]');
  
  // Replace hover:bg-black/10 etc
  c = c.replace(/hover:bg-black\/[0-9]+/g, 'hover:bg-[var(--glass-3)]');

  if (c !== original) {
    fs.writeFileSync(fp, c);
    console.log('Updated rgba in ' + f);
  }
});
