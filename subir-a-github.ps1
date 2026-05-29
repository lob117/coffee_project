# Ejecutar en PowerShell dentro de esta carpeta (clic derecho -> Ejecutar con PowerShell)
# Sube el tema visual a https://github.com/lob117/coffee_project

$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

$git = @(
    "git",
    "C:\Program Files\Git\cmd\git.exe",
    "$env:LOCALAPPDATA\Programs\Git\cmd\git.exe"
) | Where-Object { $_ -eq "git" -and (Get-Command git -ErrorAction SilentlyContinue) } | Select-Object -First 1

if (-not $git) {
    foreach ($p in @("C:\Program Files\Git\cmd\git.exe", "$env:LOCALAPPDATA\Programs\Git\cmd\git.exe")) {
        if (Test-Path $p) { $git = $p; break }
    }
}

if (-not $git) {
    Write-Host "No se encontro Git. Instala Git: https://git-scm.com/download/win" -ForegroundColor Red
    Write-Host "O sube los archivos manualmente en:" -ForegroundColor Yellow
    Write-Host "https://github.com/lob117/coffee_project/upload/main"
    pause
    exit 1
}

& $git add css/ js/ index.html README.md "*.html"
& $git commit -m "Aplicar diseño inspirado en La Tienda del Café (colección especial)"
& $git push origin main

Write-Host "`nListo. Revisa: https://github.com/lob117/coffee_project" -ForegroundColor Green
pause
