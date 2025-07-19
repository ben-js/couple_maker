# AWS 자격 증명 설정 스크립트
Write-Host "🔐 AWS 자격 증명 설정" -ForegroundColor Green

# AWS Access Key ID 입력
$accessKeyId = Read-Host "AWS Access Key ID를 입력하세요"
if ([string]::IsNullOrEmpty($accessKeyId)) {
    Write-Host "❌ Access Key ID가 입력되지 않았습니다." -ForegroundColor Red
    exit 1
}

# AWS Secret Access Key 입력
$secretAccessKey = Read-Host "AWS Secret Access Key를 입력하세요" -AsSecureString
$secretAccessKeyPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($secretAccessKey))
if ([string]::IsNullOrEmpty($secretAccessKeyPlain)) {
    Write-Host "❌ Secret Access Key가 입력되지 않았습니다." -ForegroundColor Red
    exit 1
}

# AWS Region 입력 (기본값: us-east-1)
$region = Read-Host "AWS Region을 입력하세요 (기본값: us-east-1)"
if ([string]::IsNullOrEmpty($region)) {
    $region = "us-east-1"
}

# 환경 변수 설정
Write-Host "🔧 환경 변수 설정 중..." -ForegroundColor Yellow
$env:AWS_ACCESS_KEY_ID = $accessKeyId
$env:AWS_SECRET_ACCESS_KEY = $secretAccessKeyPlain
$env:AWS_DEFAULT_REGION = $region

# 설정 확인
Write-Host "✅ AWS 자격 증명이 설정되었습니다!" -ForegroundColor Green
Write-Host "   - Access Key ID: $($accessKeyId.Substring(0, 4))..." -ForegroundColor Cyan
Write-Host "   - Secret Access Key: $($secretAccessKeyPlain.Substring(0, 4))..." -ForegroundColor Cyan
Write-Host "   - Region: $region" -ForegroundColor Cyan

Write-Host "`n💡 이제 API를 테스트할 수 있습니다!" -ForegroundColor Green
Write-Host "   Invoke-WebRequest -Uri 'http://localhost:3001/api/admin/admins' -Method GET" -ForegroundColor White 