$files = Get-ChildItem -Path "src" -Recurse -Include *.tsx,*.ts,*.jsx,*.js -Exclude DocumentStudioModal.tsx,ContractEditor.tsx,PDFViewer.tsx

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw

    # Replace hardcoded text colors
    $newContent = $content -replace '\btext-white\b', 'text-text'
    $newContent = $newContent -replace '\btext-zinc-200\b', 'text-text'
    $newContent = $newContent -replace '\btext-zinc-300\b', 'text-text-2'
    $newContent = $newContent -replace '\btext-zinc-400\b', 'text-text-2'
    $newContent = $newContent -replace '\btext-zinc-500\b', 'text-text-3'
    $newContent = $newContent -replace '\btext-black\b', 'text-bg2'

    # Replace hardcoded border colors
    $newContent = $newContent -replace 'border-white/10', 'border-border'
    $newContent = $newContent -replace 'border-white/15', 'border-border-2'
    $newContent = $newContent -replace 'border-white/5', 'border-border'
    $newContent = $newContent -replace 'border-white/20', 'border-border-2'

    # Replace hardcoded bg colors
    $newContent = $newContent -replace 'bg-black/40', 'bg-glass-2'
    $newContent = $newContent -replace 'bg-black/50', 'bg-glass-3'
    $newContent = $newContent -replace '\bbg-black\b(?!/)', 'bg-bg'
    
    # hover states
    $newContent = $newContent -replace 'hover:bg-white/10', 'hover:bg-glass-2'
    $newContent = $newContent -replace 'hover:bg-white/20', 'hover:bg-glass-3'
    
    # bg-white text-black combo (Primary buttons)
    $newContent = $newContent -replace 'bg-white text-bg2', 'bg-accent text-bg2'
    $newContent = $newContent -replace 'border-white hover:bg-white/85', 'border-accent hover:opacity-90'

    if ($content -ne $newContent) {
        Set-Content -Path $file.FullName -Value $newContent -NoNewline
        Write-Host "Updated $($file.Name)"
    }
}
