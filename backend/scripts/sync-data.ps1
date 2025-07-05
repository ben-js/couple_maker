# backend/data와 .serverless/build/data 동기화 스크립트
# PowerShell에서 실행: .\scripts\sync-data.ps1

Write-Host "🔄 데이터 파일 동기화 시작..." -ForegroundColor Yellow

# backend/data 폴더의 모든 JSON 파일을 .serverless/build/data로 복사
$sourceDir = "data"
$targetDir = ".serverless\build\data"

# 대상 디렉토리가 없으면 생성
if (!(Test-Path $targetDir)) {
    New-Item -ItemType Directory -Path $targetDir -Force
    Write-Host "📁 $targetDir 디렉토리 생성됨" -ForegroundColor Green
}

# 모든 JSON 파일 복사
$files = Get-ChildItem -Path $sourceDir -Filter "*.json"
foreach ($file in $files) {
    $sourcePath = Join-Path $sourceDir $file.Name
    $targetPath = Join-Path $targetDir $file.Name
    
    Copy-Item -Path $sourcePath -Destination $targetPath -Force
    Write-Host "✅ $($file.Name) 동기화 완료" -ForegroundColor Green
}

Write-Host "🎉 모든 데이터 파일 동기화 완료!" -ForegroundColor Green
Write-Host "💡 서버를 재시작하려면: npm run dev" -ForegroundColor Cyan 