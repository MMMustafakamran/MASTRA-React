# Start dev servers in separate terminal windows with command visibly shown
$rootDir = $PSScriptRoot

Write-Host "================================================================" -ForegroundColor Cyan
Write-Host " Launching dev servers in separate terminals...                 " -ForegroundColor Cyan
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host ""

$managers = @(
    @{ Name = "npm";  Cmd = "npm run dev" },
    @{ Name = "pnpm"; Cmd = "pnpm run dev" },
    @{ Name = "bun";  Cmd = "bun run dev" },
    @{ Name = "yarn"; Cmd = "yarn run dev" }
)

foreach ($m in $managers) {
    $name = $m.Name
    $cmd = $m.Cmd
    $targetPath = $null

    if (Test-Path "$rootDir\$name\app\package.json") {
        $targetPath = "$rootDir\$name\app"
    } elseif (Test-Path "$rootDir\$name\package.json") {
        $targetPath = "$rootDir\$name"
    }

    if ($targetPath) {
        Write-Host "[$name] Opening terminal for: $cmd" -ForegroundColor Green
        Write-Host "       Target: $targetPath" -ForegroundColor Gray

        $psCommand = "Set-Location '$targetPath'; " +
                     "Write-Host '================================================================' -ForegroundColor Cyan; " +
                     "Write-Host ' Location: $targetPath' -ForegroundColor Gray; " +
                     "Write-Host ' Running:  $cmd (UI :3000, Python Agent :8000)' -ForegroundColor Yellow; " +
                     "Write-Host '================================================================' -ForegroundColor Cyan; " +
                     "Write-Host ''; " +
                     "$cmd"

        Start-Process powershell -ArgumentList "-NoExit", "-Command", $psCommand
    } else {
        Write-Host "[$name] No project found in $name\app or $name. Skipping." -ForegroundColor DarkGray
    }
}

Write-Host ""
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host " All dev server terminals have been opened!                     " -ForegroundColor Cyan
Write-Host "================================================================" -ForegroundColor Cyan
