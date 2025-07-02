#!/bin/bash

# Couple Maker 프로젝트 초기 설정 스크립트

echo "🚀 Couple Maker 프로젝트 설정을 시작합니다..."

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 함수 정의
print_step() {
    echo -e "${BLUE}📋 $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Node.js 버전 확인
print_step "Node.js 버전 확인 중..."
NODE_VERSION=$(node --version)
if [[ $? -eq 0 ]]; then
    print_success "Node.js 버전: $NODE_VERSION"
else
    print_error "Node.js가 설치되지 않았습니다. https://nodejs.org에서 설치해주세요."
    exit 1
fi

# npm 버전 확인
print_step "npm 버전 확인 중..."
NPM_VERSION=$(npm --version)
if [[ $? -eq 0 ]]; then
    print_success "npm 버전: $NPM_VERSION"
else
    print_error "npm이 설치되지 않았습니다."
    exit 1
fi

# Git 확인
print_step "Git 확인 중..."
if command -v git &> /dev/null; then
    print_success "Git이 설치되어 있습니다."
else
    print_error "Git이 설치되지 않았습니다. https://git-scm.com에서 설치해주세요."
    exit 1
fi

# 프론트엔드 설정
print_step "프론트엔드 의존성 설치 중..."
cd frontend
if npm install; then
    print_success "프론트엔드 의존성 설치 완료"
else
    print_error "프론트엔드 의존성 설치 실패"
    exit 1
fi

# Expo CLI 설치 확인
print_step "Expo CLI 확인 중..."
if command -v expo &> /dev/null; then
    print_success "Expo CLI가 설치되어 있습니다."
else
    print_warning "Expo CLI가 설치되지 않았습니다. 설치 중..."
    if npm install -g @expo/cli; then
        print_success "Expo CLI 설치 완료"
    else
        print_error "Expo CLI 설치 실패"
        exit 1
    fi
fi

cd ..

# 백엔드 설정
print_step "백엔드 의존성 설치 중..."
cd backend
if npm install; then
    print_success "백엔드 의존성 설치 완료"
else
    print_error "백엔드 의존성 설치 실패"
    exit 1
fi

cd ..

# 환경 변수 파일 생성
print_step "환경 변수 파일 생성 중..."

# 프론트엔드 .env 파일
if [ ! -f frontend/.env ]; then
    cat > frontend/.env << EOF
# API 설정
EXPO_PUBLIC_API_URL=https://your-api-gateway-url.amazonaws.com

# Cognito 설정
EXPO_PUBLIC_USER_POOL_ID=your-user-pool-id
EXPO_PUBLIC_USER_POOL_CLIENT_ID=your-user-pool-client-id

# 기타 설정
EXPO_PUBLIC_APP_NAME=Couple Maker
EXPO_PUBLIC_APP_VERSION=1.0.0
EOF
    print_success "frontend/.env 파일 생성 완료"
else
    print_warning "frontend/.env 파일이 이미 존재합니다."
fi

# 백엔드 .env 파일
if [ ! -f backend/.env ]; then
    cat > backend/.env << EOF
# AWS 설정
AWS_REGION=ap-northeast-2

# Cognito 설정
USER_POOL_ID=your-user-pool-id
USER_POOL_CLIENT_ID=your-user-pool-client-id

# 기타 설정
NODE_ENV=development
LOG_LEVEL=debug
EOF
    print_success "backend/.env 파일 생성 완료"
else
    print_warning "backend/.env 파일이 이미 존재합니다."
fi

# Git 설정
print_step "Git 설정 확인 중..."
if [ ! -f .gitignore ]; then
    cat > .gitignore << EOF
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
EOF
    print_success ".gitignore 파일 생성 완료"
else
    print_warning ".gitignore 파일이 이미 존재합니다."
fi

# 초기 커밋
print_step "Git 초기 커밋 준비 중..."
if git status --porcelain | grep -q .; then
    git add .
    git commit -m "feat: 프로젝트 초기 설정

- React Native + Expo 프론트엔드 설정
- AWS Lambda + API Gateway 백엔드 설정
- SST 인프라 코드 설정
- GitHub Actions CI/CD 설정
- 개발 가이드 문서 작성"
    print_success "초기 커밋 완료"
else
    print_warning "커밋할 변경사항이 없습니다."
fi

# 완료 메시지
echo ""
echo -e "${GREEN}🎉 Couple Maker 프로젝트 설정이 완료되었습니다!${NC}"
echo ""
echo -e "${BLUE}다음 단계:${NC}"
echo "1. frontend/.env 파일에서 API URL과 Cognito 설정을 업데이트하세요"
echo "2. backend/.env 파일에서 AWS 설정을 업데이트하세요"
echo "3. AWS CLI를 설정하세요: aws configure"
echo "4. 프론트엔드 실행: cd frontend && npm start"
echo "5. 백엔드 배포: cd backend && npm run deploy -- --stage dev"
echo ""
echo -e "${YELLOW}📚 자세한 내용은 docs/DEVELOPMENT.md를 참조하세요${NC}"
echo "" 