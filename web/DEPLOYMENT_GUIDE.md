# 배포 가이드

## 배포 전 검증 단계

### 1. 로컬 빌드 테스트

#### Windows (PowerShell)
```powershell
cd web
npm run verify-build
```

#### Linux/Mac
```bash
cd web
chmod +x scripts/verify-build.sh
./scripts/verify-build.sh
```

또는 수동으로:
```bash
cd web
npx tsc --noEmit --skipLibCheck
npm run lint
npm run build
```

### 2. Vercel 프리뷰 배포

#### 방법 1: Vercel CLI 사용
```bash
# Vercel CLI 설치 (전역)
npm i -g vercel

# 프로젝트 루트에서 배포
cd web
vercel

# 프리뷰 배포 (프로덕션 배포가 아닌)
vercel --prod=false
```

#### 방법 2: Git 통합 사용
```bash
# 변경사항 커밋
git add .
git commit -m "빌드 오류 수정 및 타입 안전성 강화"

# 프리뷰 브랜치에 푸시
git push origin feature/your-branch

# Vercel이 자동으로 프리뷰 배포를 생성합니다
```

#### 방법 3: GitHub Pull Request
1. GitHub에 PR 생성
2. Vercel이 자동으로 프리뷰 배포 생성
3. PR에 배포 링크가 자동으로 추가됨

### 3. E2E 테스트 실행

#### 현재 설정된 테스트
```bash
cd web
npm test                    # 단위 테스트 실행
npm run test:ui            # 테스트 UI 실행
npm run test:coverage      # 커버리지 리포트 생성
```

#### E2E 테스트 설정 (Playwright 권장)

Playwright를 설치하려면:
```bash
cd web
npm install -D @playwright/test
npx playwright install
```

E2E 테스트 예시 (`e2e/example.spec.ts`):
```typescript
import { test, expect } from '@playwright/test'

test('홈페이지 로드', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveTitle(/yeowooskin/i)
})

test('로그인 페이지 접근', async ({ page }) => {
  await page.goto('/login')
  await expect(page.locator('input[type="email"]')).toBeVisible()
})
```

E2E 테스트 실행:
```bash
npx playwright test
```

## 배포 체크리스트

### 배포 전 확인사항
- [ ] 로컬 빌드 성공 (`npm run verify-build`)
- [ ] 모든 테스트 통과 (`npm test`)
- [ ] 환경 변수 설정 확인 (Vercel 대시보드)
- [ ] 데이터베이스 마이그레이션 적용 확인
- [ ] 주요 기능 수동 테스트

### Vercel 환경 변수 설정
다음 환경 변수가 Vercel 프로젝트에 설정되어 있어야 합니다:

**필수:**
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

**선택:**
- `NEXT_PUBLIC_SITE_URL`
- `NEXT_PUBLIC_BASE_URL`

### 배포 후 확인사항
- [ ] 프리뷰 배포 URL 접근 가능
- [ ] 주요 페이지 로드 확인
- [ ] API 엔드포인트 동작 확인
- [ ] 인증/인가 기능 확인
- [ ] 데이터베이스 연결 확인

## 문제 해결

### 빌드 실패 시
1. 로컬에서 `npm run verify-build` 실행하여 오류 확인
2. TypeScript 타입 오류 수정
3. ESLint 오류 수정
4. 다시 빌드 테스트

### Vercel 배포 실패 시
1. Vercel 대시보드에서 빌드 로그 확인
2. 환경 변수 설정 확인
3. `next.config.js` 설정 확인
4. 의존성 버전 충돌 확인

### 런타임 오류 시
1. Vercel 함수 로그 확인
2. 브라우저 콘솔 오류 확인
3. 네트워크 탭에서 API 호출 확인
4. 데이터베이스 연결 상태 확인

## 롤백 방법

### Vercel에서 롤백
1. Vercel 대시보드 접속
2. 프로젝트 → Deployments
3. 이전 성공한 배포 선택
4. "Promote to Production" 클릭

### Git으로 롤백
```bash
git revert HEAD
git push origin main
```

## 모니터링

### Vercel Analytics
- Vercel 대시보드에서 Analytics 활성화
- 성능 메트릭 모니터링
- 에러 추적 설정

### 로깅
- Vercel 함수 로그 확인
- 브라우저 콘솔 로그 확인
- 서버 사이드 로그 확인

## 연락처 및 지원

문제가 발생하면:
1. 빌드 로그 확인
2. Vercel 문서 참조: https://vercel.com/docs
3. Next.js 문서 참조: https://nextjs.org/docs
