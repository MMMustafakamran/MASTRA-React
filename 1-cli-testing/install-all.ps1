# Install all package managers in separate terminal windows with command visibly shown
$rootDir = $PSScriptRoot
$envSource = Join-Path $rootDir ".env"

Write-Host "================================================================" -ForegroundColor Cyan
Write-Host " Launching dependency installers in separate terminals...       " -ForegroundColor Cyan
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host ""

$managers = @(
    @{ Name = "npm";  Cmd = "npm install" },
    @{ Name = "pnpm"; Cmd = "pnpm install" },
    @{ Name = "bun";  Cmd = "bun install" },
    @{ Name = "yarn"; Cmd = "yarn install" }
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
        if (Test-Path $envSource) {
            Copy-Item -Path $envSource -Destination "$targetPath\.env" -Force -ErrorAction SilentlyContinue
            if (Test-Path "$targetPath\agent") {
                Copy-Item -Path $envSource -Destination "$targetPath\agent\.env" -Force -ErrorAction SilentlyContinue
            }
        }

        Write-Host "[$name] Opening terminal for: $cmd" -ForegroundColor Green
        Write-Host "       Target: $targetPath" -ForegroundColor Gray

        $psCommand = "Set-Location '$targetPath'; " +
                     "Write-Host '================================================================' -ForegroundColor Cyan; " +
                     "Write-Host ' Location: $targetPath' -ForegroundColor Gray; " +
                     "Write-Host ' Running:  $cmd' -ForegroundColor Yellow; " +
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
Write-Host " All installer terminals have been opened!                     " -ForegroundColor Cyan
Write-Host "================================================================" -ForegroundColor Cyan
