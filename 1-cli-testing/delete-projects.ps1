# Script to delete all generated projects and files inside bun, npm, pnpm, and yarn directories
$rootDir = $PSScriptRoot
$targetDirs = @("bun", "npm", "pnpm", "yarn")

Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "   CLEANUP: Deleting Generated Projects & Test Artifacts        " -ForegroundColor Cyan
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "Target root: $rootDir" -ForegroundColor Gray
Write-Host "Folders:     $($targetDirs -join ', ')" -ForegroundColor Gray
Write-Host ""

$totalDirs = $targetDirs.Count
$currentIndex = 0
$totalDeletedFolders = 0
$totalDeletedFiles = 0

foreach ($dir in $targetDirs) {
    $currentIndex++
    $dirPath = Join-Path $rootDir $dir
    
    Write-Host "----------------------------------------------------------------" -ForegroundColor DarkGray
    Write-Host "[$currentIndex/$totalDirs] Inspecting: $dir" -ForegroundColor Yellow
    Write-Host "----------------------------------------------------------------" -ForegroundColor DarkGray

    if (Test-Path $dirPath) {
        $items = @(Get-ChildItem -Path $dirPath -Force | Where-Object { $_.Name -ne "README.md" })
        
        if ($items.Count -eq 0) {
            Write-Host "  [OK] $dir is already clean (only README.md present)" -ForegroundColor Green
        } else {
            $folderCount = 0
            $fileCount = 0

            foreach ($item in $items) {
                if ($item.PSIsContainer) {
                    $folderCount++
                    $totalDeletedFolders++
                    Write-Host "  [-] Removing folder: $($item.Name)..." -ForegroundColor DarkGray
                } else {
                    $fileCount++
                    $totalDeletedFiles++
                    Write-Host "  [-] Removing file:   $($item.Name)..." -ForegroundColor DarkGray
                }
                
                try {
                    Remove-Item -Path $item.FullName -Recurse -Force -ErrorAction Stop
                    Write-Host "      [DONE] Deleted $($item.Name)" -ForegroundColor DarkGreen
                } catch {
                    Write-Warning "      [WARN] Could not remove $($item.Name): $_"
                }
            }
            Write-Host "  [OK] Cleaned $dir ($folderCount directories, $fileCount files removed)" -ForegroundColor Green
        }
    } else {
        Write-Host "  [SKIP] Directory $dir not found" -ForegroundColor DarkGray
    }
    Write-Host ""
}

Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "   CLEANUP COMPLETE                                             " -ForegroundColor Cyan
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "  Total directories deleted : $totalDeletedFolders" -ForegroundColor White
Write-Host "  Total files deleted       : $totalDeletedFiles" -ForegroundColor White
Write-Host "================================================================" -ForegroundColor Cyan
