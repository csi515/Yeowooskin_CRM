# 빌드 검증 스크립트 (PowerShell)
# 빌드가 성공하는지 확인하고 주요 오류를 체크합니다.

$ErrorActionPreference = "Stop"

Write-Host "🔍 빌드 검증 시작..." -ForegroundColor Cyan

# 1. TypeScript 타입 체크
Write-Host "📝 TypeScript 타입 체크 중..." -ForegroundColor Yellow
try {
    npx tsc --noEmit --skipLibCheck
    Write-Host "✅ TypeScript 타입 체크 통과" -ForegroundColor Green
} catch {
    Write-Host "❌ TypeScript 타입 오류 발견" -ForegroundColor Red
    exit 1
}

# 2. ESLint 검사
Write-Host "🔍 ESLint 검사 중..." -ForegroundColor Yellow
try {
    npm run lint
    Write-Host "✅ ESLint 검사 통과" -ForegroundColor Green
} catch {
    Write-Host "❌ ESLint 오류 발견" -ForegroundColor Red
    exit 1
}

# 3. Next.js 빌드
Write-Host "🏗️  Next.js 빌드 중..." -ForegroundColor Yellow
try {
    npm run build
    Write-Host "✅ 빌드 성공" -ForegroundColor Green
} catch {
    Write-Host "❌ 빌드 실패" -ForegroundColor Red
    exit 1
}

Write-Host "🎉 모든 검증 통과!" -ForegroundColor Green
