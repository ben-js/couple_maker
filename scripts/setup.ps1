# Couple Maker 프로젝트 초기 설정 스크립트 (PowerShell)

Write-Host "🚀 Couple Maker 프로젝트 설정을 시작합니다..." -ForegroundColor Green

# 함수 정의
function Write-Step {
    param([string]$Message)
    Write-Host "📋 $Message" -ForegroundColor Blue
}

function Write-Success {
    param([string]$Message)
    Write-Host "✅ $Message" -ForegroundColor Green
}

function Write-Warning {
    param([string]$Message)
    Write-Host "⚠️  $Message" -ForegroundColor Yellow
}

function Write-Error {
    param([string]$Message)
    Write-Host "❌ $Message" -ForegroundColor Red
}

# Node.js 버전 확인
Write-Step "Node.js 버전 확인 중..."
try {
    $nodeVersion = node --version
    Write-Success "Node.js 버전: $nodeVersion"
} catch {
    Write-Error "Node.js가 설치되지 않았습니다. https://nodejs.org에서 설치해주세요."
    exit 1
}

# npm 버전 확인
Write-Step "npm 버전 확인 중..."
try {
    $npmVersion = npm --version
    Write-Success "npm 버전: $npmVersion"
} catch {
    Write-Error "npm이 설치되지 않았습니다."
    exit 1
}

# Git 확인
Write-Step "Git 확인 중..."
try {
    $gitVersion = git --version
    Write-Success "Git이 설치되어 있습니다: $gitVersion"
} catch {
    Write-Error "Git이 설치되지 않았습니다. https://git-scm.com에서 설치해주세요."
    exit 1
}

# 프론트엔드 설정
Write-Step "프론트엔드 의존성 설치 중..."
Set-Location frontend
try {
    npm install
    Write-Success "프론트엔드 의존성 설치 완료"
} catch {
    Write-Error "프론트엔드 의존성 설치 실패"
    exit 1
}

# Expo CLI 설치 확인
Write-Step "Expo CLI 확인 중..."
try {
    $expoVersion = expo --version
    Write-Success "Expo CLI가 설치되어 있습니다: $expoVersion"
} catch {
    Write-Warning "Expo CLI가 설치되지 않았습니다. 설치 중..."
    try {
        npm install -g @expo/cli
        Write-Success "Expo CLI 설치 완료"
    } catch {
        Write-Error "Expo CLI 설치 실패"
        exit 1
    }
}

Set-Location ..

# 백엔드 설정
Write-Step "백엔드 의존성 설치 중..."
Set-Location backend
try {
    npm install
    Write-Success "백엔드 의존성 설치 완료"
} catch {
    Write-Error "백엔드 의존성 설치 실패"
    exit 1
}

Set-Location ..

# 환경 변수 파일 생성
Write-Step "환경 변수 파일 생성 중..."

# 프론트엔드 .env 파일
if (-not (Test-Path "frontend/.env")) {
    @"
# API 설정
EXPO_PUBLIC_API_URL=https://your-api-gateway-url.amazonaws.com

# Cognito 설정
EXPO_PUBLIC_USER_POOL_ID=your-user-pool-id
EXPO_PUBLIC_USER_POOL_CLIENT_ID=your-user-pool-client-id

# 기타 설정
EXPO_PUBLIC_APP_NAME=Couple Maker
EXPO_PUBLIC_APP_VERSION=1.0.0
"@ | Out-File -FilePath "frontend/.env" -Encoding UTF8
    Write-Success "frontend/.env 파일 생성 완료"
} else {
    Write-Warning "frontend/.env 파일이 이미 존재합니다."
}

# 백엔드 .env 파일
if (-not (Test-Path "backend/.env")) {
    @"
# AWS 설정
AWS_REGION=ap-northeast-2

# Cognito 설정
USER_POOL_ID=your-user-pool-id
USER_POOL_CLIENT_ID=your-user-pool-client-id

# 기타 설정
NODE_ENV=development
LOG_LEVEL=debug
"@ | Out-File -FilePath "backend/.env" -Encoding UTF8
    Write-Success "backend/.env 파일 생성 완료"
} else {
    Write-Warning "backend/.env 파일이 이미 존재합니다."
}

# Git 설정
Write-Step "Git 설정 확인 중..."
if (-not (Test-Path ".gitignore")) {
    @"
# Dependencies
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Environment variables
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Build outputs
dist/
build/
.next/
out/

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Logs
logs/
*.log

# Runtime data
pids/
*.pid
*.seed
*.pid.lock

# Coverage directory used by tools like istanbul
coverage/

# Expo
.expo/
web-build/

# AWS
.aws/

# SST
.sst/
"@ | Out-File -FilePath ".gitignore" -Encoding UTF8
    Write-Success ".gitignore 파일 생성 완료"
} else {
    Write-Warning ".gitignore 파일이 이미 존재합니다."
}

# 초기 커밋
Write-Step "Git 초기 커밋 준비 중..."
try {
    $status = git status --porcelain
    if ($status) {
        git add .
        git commit -m "feat: 프로젝트 초기 설정

- React Native + Expo 프론트엔드 설정
- AWS Lambda + API Gateway 백엔드 설정
- SST 인프라 코드 설정
- GitHub Actions CI/CD 설정
- 개발 가이드 문서 작성"
        Write-Success "초기 커밋 완료"
    } else {
        Write-Warning "커밋할 변경사항이 없습니다."
    }
} catch {
    Write-Warning "Git 커밋 중 오류가 발생했습니다."
}

# 완료 메시지
Write-Host ""
Write-Host "🎉 Couple Maker 프로젝트 설정이 완료되었습니다!" -ForegroundColor Green
Write-Host ""
Write-Host "다음 단계:" -ForegroundColor Blue
Write-Host "1. frontend/.env 파일에서 API URL과 Cognito 설정을 업데이트하세요"
Write-Host "2. backend/.env 파일에서 AWS 설정을 업데이트하세요"
Write-Host "3. AWS CLI를 설정하세요: aws configure"
Write-Host "4. 프론트엔드 실행: cd frontend && npm start"
Write-Host "5. 백엔드 배포: cd backend && npm run deploy -- --stage dev"
Write-Host ""
Write-Host "📚 자세한 내용은 docs/DEVELOPMENT.md를 참조하세요" -ForegroundColor Yellow
Write-Host "" 