$ErrorActionPreference = "Stop"

# Chay khi tat ca tien trinh PinkBook da dung.
$projectRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$sourceRoot = Join-Path $projectRoot "data"
$sourceDb = Join-Path $sourceRoot "db"
$envFile = Join-Path $projectRoot ".env"

if (-not $env:LOCALAPPDATA) {
    throw "Khong tim thay LOCALAPPDATA cua Windows."
}

if (-not (Test-Path (Join-Path $sourceDb "PG_VERSION") -PathType Leaf) -or
    -not (Test-Path (Join-Path $sourceDb "base") -PathType Container) -or
    -not (Test-Path (Join-Path $sourceDb "global") -PathType Container)) {
    throw "Database goc khong day du (thieu PG_VERSION, base hoac global). Khong sao chep."
}

if (Test-Path $envFile) {
    throw "Da ton tai .env. Script khong ghi de cau hinh hien co. Hay sao luu va kiem tra .env truoc."
}

$targetRoot = Join-Path $env:LOCALAPPDATA "PinkBook"
$targetDb = Join-Path $targetRoot "db"

if (Test-Path $targetRoot) {
    $existing = @(Get-ChildItem $targetRoot -Force -ErrorAction Stop)
    if ($existing.Count -gt 0) {
        throw "Thu muc dich da co du lieu: $targetRoot. Script dung de tranh ghi de."
    }
} else {
    New-Item -ItemType Directory -Path $targetRoot -Force | Out-Null
}

Write-Host "Nguon database: $sourceRoot"
Write-Host "Dich local:     $targetRoot"
Write-Host "Dang sao chep nguyen thu muc data, khong xoa du lieu goc..."

& robocopy $sourceRoot $targetRoot /E /COPY:DAT /DCOPY:DAT /R:1 /W:2 /XJ /NP
$copyCode = $LASTEXITCODE

if ($copyCode -ge 8) {
    throw "Robocopy bao loi ma $copyCode. Du lieu goc duoc giu nguyen; hay gui lai ket qua."
}

$sourceFiles = @(Get-ChildItem $sourceRoot -Recurse -File -Force -ErrorAction Stop)
$targetFiles = @(Get-ChildItem $targetRoot -Recurse -File -Force -ErrorAction Stop)

$sourceBytes = [int64](($sourceFiles | Measure-Object -Property Length -Sum).Sum)
$targetBytes = [int64](($targetFiles | Measure-Object -Property Length -Sum).Sum)

if ($sourceFiles.Count -ne $targetFiles.Count -or $sourceBytes -ne $targetBytes) {
    throw "Ban sao chua khop: nguon $($sourceFiles.Count) file/$sourceBytes byte; dich $($targetFiles.Count) file/$targetBytes byte. Khong tao .env."
}

$sourceVersion = (Get-Content (Join-Path $sourceDb "PG_VERSION") -Raw).Trim()
$targetVersion = (Get-Content (Join-Path $targetDb "PG_VERSION") -Raw).Trim()

if ($sourceVersion -ne $targetVersion) {
    throw "PG_VERSION cua ban sao khong trung khop. Khong tao .env."
}

# Bo thuoc tinh ReadOnly chi tren ban sao local, khong sua du lieu OneDrive goc.
& attrib -R (Join-Path $targetRoot "*") /S /D

$targetForEnv = $targetRoot.Replace("\", "/")
$envContent = "DATA_DIR=" + $targetForEnv + [Environment]::NewLine
[System.IO.File]::WriteAllText(
    $envFile,
    $envContent,
    [System.Text.UTF8Encoding]::new($false)
)

Write-Host ""
Write-Host "SAO CHEP VA DOI CHIEU THANH CONG." -ForegroundColor Green
Write-Host "So file: $($targetFiles.Count)"
Write-Host "Dung luong: $([math]::Round($targetBytes / 1MB, 2)) MB"
Write-Host "DATA_DIR da duoc ghi vao .env: $targetForEnv"
Write-Host "Database goc trong OneDrive van duoc giu nguyen."
Write-Host "Bay gio co the thu chay npm run dev."
