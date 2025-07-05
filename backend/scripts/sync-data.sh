#!/bin/bash

# backend/data와 .serverless/build/data 동기화 스크립트
# Linux/Mac에서 실행: ./scripts/sync-data.sh

echo "🔄 데이터 파일 동기화 시작..."

# backend/data 폴더의 모든 JSON 파일을 .serverless/build/data로 복사
source_dir="data"
target_dir=".serverless/build/data"

# 대상 디렉토리가 없으면 생성
if [ ! -d "$target_dir" ]; then
    mkdir -p "$target_dir"
    echo "📁 $target_dir 디렉토리 생성됨"
fi

# 모든 JSON 파일 복사
for file in "$source_dir"/*.json; do
    if [ -f "$file" ]; then
        filename=$(basename "$file")
        cp "$file" "$target_dir/$filename"
        echo "✅ $filename 동기화 완료"
    fi
done

echo "🎉 모든 데이터 파일 동기화 완료!"
echo "💡 서버를 재시작하려면: npm run dev" 