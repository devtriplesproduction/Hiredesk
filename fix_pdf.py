import re

with open('src/components/candidates/PDFViewer.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Fix 1: Remove flex flex-col items-center justify-center from Main Viewport Container
content = content.replace(
    'className="relative w-full flex-1 min-h-0 rounded-xl border border-[var(--border-2)] bg-[var(--card-bg)] overflow-hidden flex flex-col items-center justify-center shadow-inner"',
    'className="relative w-full flex-1 min-h-0 rounded-xl border border-[var(--border-2)] bg-[var(--card-bg)] overflow-hidden shadow-inner"'
)

# Fix 2: Make canvas view absolute inset-0
content = content.replace(
    'className="w-full h-full overflow-y-auto overflow-x-auto p-4 sm:p-6 bg-[var(--card-bg)] custom-scrollbar flex flex-col items-center"',
    'className="absolute inset-0 overflow-y-auto overflow-x-auto p-4 sm:p-6 bg-[var(--card-bg)] custom-scrollbar flex flex-col items-center"'
)

# Fix 3: Make native view absolute inset-0
content = content.replace(
    'className="w-full h-full relative bg-[var(--card-bg)]"',
    'className="absolute inset-0 bg-[var(--card-bg)]"'
)

with open('src/components/candidates/PDFViewer.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Done")
