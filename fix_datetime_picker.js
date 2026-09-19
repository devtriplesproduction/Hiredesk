const fs = require('fs');

const file = 'src/components/ui/DateTimePicker.tsx';
let c = fs.readFileSync(file, 'utf8');

// 1. Fix the background opacity
c = c.replace(/background: "var\(--card-bg\)"/g, 'background: "var(--bg2)"');

// 2. Fix the trigger button
c = c.replace(/border-\[#A78BFA\]\/50 bg-\[var\(--card-bg\)\] shadow-\[0_0_12px_rgba\(167,139,250,0\.15\)\]/g, 'border-[var(--tab-purple-border)] bg-[var(--bg2)] shadow-md');

// 3. Fix the Time text
c = c.replace(/text-\[#A78BFA\]/g, 'text-[var(--tab-purple-text)]');

// 4. Fix the selected day (cyan)
c = c.replace(/text-\[#00D9FF\] bg-\[rgba\(0,217,255,0\.15\)\] border border-\[rgba\(0,217,255,0\.45\)\] font-bold shadow-\[0_0_8px_rgba\(0,217,255,0\.2\)\]/g, 'text-[var(--tab-cyan-text)] bg-[var(--tab-cyan-bg)] border border-[var(--tab-cyan-border)] font-bold shadow-sm');
c = c.replace(/bg-\[#00D9FF\]/g, 'bg-[var(--tab-cyan-text)]');
c = c.replace(/text-\[#00D9FF\]/g, 'text-[var(--tab-cyan-text)]'); // e.g. Today button

// 5. Fix AM/PM buttons
c = c.replace(/bg-\[rgba\(167,139,250,0\.15\)\] border border-\[rgba\(167,139,250,0\.35\)\]/g, 'bg-[var(--tab-purple-bg)] border border-[var(--tab-purple-border)]');

fs.writeFileSync(file, c);
console.log('DateTimePicker updated successfully.');
