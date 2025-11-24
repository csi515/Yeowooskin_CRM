#!/bin/bash
# 빌드 검증 스크립트
# 빌드가 성공하는지 확인하고 주요 오류를 체크합니다.

set -e

echo "🔍 빌드 검증 시작..."

# 1. TypeScript 타입 체크
echo "📝 TypeScript 타입 체크 중..."
npx tsc --noEmit --skipLibCheck || {
  echo "❌ TypeScript 타입 오류 발견"
  exit 1
}
echo "✅ TypeScript 타입 체크 통과"

# 2. ESLint 검사
echo "🔍 ESLint 검사 중..."
npm run lint || {
  echo "❌ ESLint 오류 발견"
  exit 1
}
echo "✅ ESLint 검사 통과"

# 3. Next.js 빌드
echo "🏗️  Next.js 빌드 중..."
npm run build || {
  echo "❌ 빌드 실패"
  exit 1
}
echo "✅ 빌드 성공"

echo "🎉 모든 검증 통과!"
