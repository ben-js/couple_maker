# S3 버킷 생성 및 설정 스크립트
# PowerShell에서 실행

# 환경 변수 설정
$BUCKET_NAME = "date-sense-dev-images"
$REGION = "ap-northeast-2"

Write-Host "🚀 S3 버킷 생성 시작..." -ForegroundColor Green

# 1. S3 버킷 생성
Write-Host "📦 S3 버킷 생성 중: $BUCKET_NAME" -ForegroundColor Yellow
aws s3api create-bucket `
    --bucket $BUCKET_NAME `
    --region $REGION `
    --create-bucket-configuration LocationConstraint=$REGION

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ S3 버킷 생성 완료" -ForegroundColor Green
} else {
    Write-Host "❌ S3 버킷 생성 실패" -ForegroundColor Red
    exit 1
}

# 2. 버킷 버전 관리 활성화
Write-Host "🔄 버킷 버전 관리 활성화 중..." -ForegroundColor Yellow
aws s3api put-bucket-versioning `
    --bucket $BUCKET_NAME `
    --versioning-configuration Status=Enabled

# 3. CORS 설정 (프론트엔드에서 직접 업로드 허용)
Write-Host "🌐 CORS 설정 중..." -ForegroundColor Yellow
$corsConfig = @"
{
    "CORSRules": [
        {
            "AllowedHeaders": ["*"],
            "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
            "AllowedOrigins": ["*"],
            "ExposeHeaders": ["ETag"],
            "MaxAgeSeconds": 3000
        }
    ]
}
"@

$corsConfig | aws s3api put-bucket-cors `
    --bucket $BUCKET_NAME `
    --cors-configuration file:///dev/stdin

# 4. 버킷 정책 설정 (공개 읽기, 인증된 쓰기)
Write-Host "🔒 버킷 정책 설정 중..." -ForegroundColor Yellow
$bucketPolicy = @"
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "PublicReadGetObject",
            "Effect": "Allow",
            "Principal": "*",
            "Action": "s3:GetObject",
            "Resource": "arn:aws:s3:::$BUCKET_NAME/*"
        },
        {
            "Sid": "AuthenticatedWrite",
            "Effect": "Allow",
            "Principal": {
                "AWS": "arn:aws:iam::*:user/*"
            },
            "Action": [
                "s3:PutObject",
                "s3:DeleteObject"
            ],
            "Resource": "arn:aws:s3:::$BUCKET_NAME/*",
            "Condition": {
                "StringEquals": {
                    "aws:PrincipalType": "IAMUser"
                }
            }
        }
    ]
}
"@

$bucketPolicy | aws s3api put-bucket-policy `
    --bucket $BUCKET_NAME `
    --policy file:///dev/stdin

# 5. 폴더 구조 생성
Write-Host "📁 폴더 구조 생성 중..." -ForegroundColor Yellow
$folders = @(
    "images/profile",
    "images/temp"
)

foreach ($folder in $folders) {
    aws s3api put-object `
        --bucket $BUCKET_NAME `
        --key "$folder/"
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ 폴더 생성: $folder" -ForegroundColor Green
    } else {
        Write-Host "❌ 폴더 생성 실패: $folder" -ForegroundColor Red
    }
}

# 6. 환경 변수 설정 파일 생성
Write-Host "⚙️ 환경 변수 설정 파일 생성 중..." -ForegroundColor Yellow
$envContent = @"
# S3 설정
S3_BUCKET_NAME=$BUCKET_NAME
S3_REGION=$REGION

# 기타 환경 변수들...
"@

$envContent | Out-File -FilePath ".env" -Encoding UTF8

Write-Host "S3 bucket setup completed!" -ForegroundColor Green
Write-Host "Created resources:" -ForegroundColor Cyan
Write-Host "   - S3 bucket: $BUCKET_NAME" -ForegroundColor White
Write-Host "   - Region: $REGION" -ForegroundColor White
Write-Host "   - Environment file: .env" -ForegroundColor White
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "   1. Check and modify .env file if needed" -ForegroundColor White
Write-Host "   2. Environment variables added to serverless.yml" -ForegroundColor White
Write-Host "   3. S3 permissions added to Lambda functions" -ForegroundColor White 