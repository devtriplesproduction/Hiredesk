$files = @(
    "src\components\documents\DocumentStudioModal.tsx",
    "src\components\candidates\PDFViewer.tsx",
    "src\components\contracts\ContractEditor.tsx",
    "src\app\onboarding\[candidateId]\page.tsx",
    "src\app\onboarding\[candidateId]\checklist\ChecklistClient.tsx",
    "src\app\offer\[candidateId]\page.tsx",
    "src\app\globals.css"
)

foreach ($relPath in $files) {
    $fullPath = Join-Path -Path "c:\Users\HP\Desktop\Triple S\HireDesk" -ChildPath $relPath
    if (Test-Path $fullPath) {
        if ($relPath -match "DocumentStudioModal|PDFViewer|ContractEditor|globals.css") {
            continue
        }
        
        $content = [System.IO.File]::ReadAllText($fullPath)

        $newContent = $content -replace '\btext-white\b', 'text-text'
        $newContent = $newContent -replace '\btext-zinc-200\b', 'text-text'
        $newContent = $newContent -replace '\btext-zinc-300\b', 'text-text-2'
        $newContent = $newContent -replace '\btext-zinc-400\b', 'text-text-2'
        $newContent = $newContent -replace '\btext-zinc-500\b', 'text-text-3'
        $newContent = $newContent -replace '\btext-black\b', 'text-bg2'
        
        $newContent = $newContent -replace 'border-white/\[0\.08\]', 'border-[var(--border)]'
        $newContent = $newContent -replace 'border-white/\[0\.10\]', 'border-[var(--border-2)]'
        $newContent = $newContent -replace 'border-white/\[0\.12\]', 'border-[var(--border-2)]'
        $newContent = $newContent -replace 'border-white/\[0\.06\]', 'border-[var(--border)]'
        
        $newContent = $newContent -replace 'bg-white/\[0\.04\]', 'bg-[var(--glass)]'
        $newContent = $newContent -replace 'bg-white/\[0\.03\]', 'bg-[var(--glass)]'
        $newContent = $newContent -replace 'bg-white/\[0\.06\]', 'bg-[var(--glass-2)]'
        $newContent = $newContent -replace 'bg-white/\[0\.08\]', 'bg-[var(--glass-2)]'
        $newContent = $newContent -replace 'bg-white/\[0\.05\]', 'bg-[var(--glass)]'
        
        $newContent = $newContent -replace '\bbg-black\b(?!/)', 'bg-bg'
        $newContent = $newContent -replace 'bg-black/60', 'bg-glass-3'
        $newContent = $newContent -replace 'bg-black/30', 'bg-glass-2'

        if ($content -ne $newContent) {
            [System.IO.File]::WriteAllText($fullPath, $newContent)
            Write-Host "Updated $relPath"
        }
    }
}
