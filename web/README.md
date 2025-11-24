# 여우스킨 CRM - Web Application

Next.js 14 기반의 프랜차이즈 피부관리샵 관리 시스템 웹 애플리케이션입니다.

## 🚀 주요 특징

- **역할 기반 접근 제어**: HQ(본사) - Owner(점주) - Staff(직원) 계층 구조
- **지점별 데이터 분리**: Supabase RLS를 통한 안전한 다중 지점 데이터 관리
- **초대 시스템**: 점주가 직원을 초대하고 역할별 권한 부여
- **지점별 재무 관리**: HQ는 전체 지점 비교, Owner는 본인 지점 관리

## 기술 스택

- **Framework**: Next.js 14 (App Router)
- **UI**: Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Deployment**: Vercel
- **PWA**: Service Worker, Manifest

## 시작하기

### 필수 요구사항

- Node.js 18 이상
- npm 또는 yarn
- Supabase 프로젝트

### 설치

```bash
# 의존성 설치
npm install

# 개발 서버 실행
npm run dev

# 프로덕션 빌드
npm run build

# 프로덕션 서버 실행
npm start
```

### 환경 변수 설정

`.env.local` 파일을 생성하고 다음 변수를 설정하세요:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# 프랜차이즈 시스템용 (선택사항)
INVITE_SECRET=your-invite-secret-key
```

### 데이터베이스 마이그레이션

Supabase에서 다음 SQL 파일들을 순서대로 실행하세요:

1. `001_users.sql` - 기본 사용자 테이블
2. `002_sync_auth_updates.sql` - 사용자 정보 동기화
3. `003_franchise_structure.sql` - 프랜차이즈 구조 및 RLS 정책

### 초기 설정

1. **HQ 계정 생성**: 첫 번째 사용자는 자동으로 HQ 권한을 받습니다
2. **지점 생성**: HQ가 관리할 지점을 먼저 생성합니다
3. **점주 초대**: 각 지점의 점주를 초대합니다
4. **직원 초대**: 점주가 자신의 지점 직원들을 초대합니다

자세한 내용은 `.env.example` 파일을 참고하세요.

## 데이터베이스 구조

### 📊 주요 테이블

- **profiles**: 사용자 프로필 (역할, 지점 정보)
- **branches**: 지점 정보
- **invitations**: 직원 초대 시스템
- **customers**: 고객 정보 (branch_id 필드 추가)
- **appointments**: 예약 정보 (branch_id 필드 추가)
- **transactions**: 거래 내역 (branch_id 필드 추가)
- **expenses**: 지출 내역 (branch_id 필드 추가)
- **staff**: 직원 정보 (branch_id 필드 추가)
- **products**: 제품 정보 (branch_id 필드 추가)

### 🔄 마이그레이션

프랜차이즈 구조 적용을 위한 마이그레이션 파일:
- `003_franchise_structure.sql`: RLS 정책 및 테이블 구조 변경

## 프로젝트 구조

```
web/
├── app/                    # Next.js App Router
│   ├── api/               # API 라우트 (역할 검증 적용)
│   ├── components/        # React 컴포넌트
│   │   ├── modals/        # 모달 컴포넌트
│   │   └── settings/      # 설정 섹션 컴포넌트
│   ├── lib/               # 유틸리티 및 헬퍼
│   │   ├── hocs/          # 역할 보호 HOC
│   │   └── hooks/         # 역할 관련 커스텀 훅
│   ├── (auth)/            # 인증 관련 페이지
│   └── settings/          # 설정 페이지 (역할별 탭)
├── supabase/sql/          # 데이터베이스 마이그레이션
├── types/                 # TypeScript 타입 정의
└── middleware.ts          # Next.js 미들웨어 (역할 라우팅)
```

## 사용자 역할 및 권한

### 📋 역할별 기능

#### 👑 HQ (본사)
- 모든 지점 데이터 열람/수정
- 지점 생성 및 점주 계정 생성
- 지점별 매출 비교 및 분석 리포트
- 시스템 전체 설정 관리

#### 🏪 Owner (점주)
- 본인 지점 데이터만 접근 (고객, 예약, 제품, 재무)
- 직원 초대 및 권한 관리
- 지점별 재무 보고서 및 엑셀 내보내기

#### 👤 Staff (직원)
- 고객 상담 및 예약 관리
- 제품 정보 조회
- 개인 일정 및 업무 관리

### 🔒 데이터 보안

- **Supabase RLS (Row Level Security)**: 역할별 자동 데이터 필터링
- **API 레벨 검증**: 모든 요청에 역할 기반 권한 체크
- **지점별 분리**: 각 지점 데이터는 완전히 격리

## 주요 기능

- ✅ **고객 관리** - 지점별 고객 정보 및 히스토리
- ✅ **예약 관리** - 실시간 예약 시스템
- ✅ **제품 관리** - 재고 및 서비스 관리
- ✅ **직원 관리** - 초대 시스템 및 권한 관리
- ✅ **재무 관리** - 지점별 수입/지출 추적
- ✅ **분석 리포트** - HQ 전용 지점 비교 기능
- ✅ **PWA 지원** - 모바일 앱처럼 사용 가능
- ✅ **반응형 디자인** - 모든 기기 지원

## 배포

### Vercel 배포

1. **프로젝트 연결**
   - Vercel에 GitHub 리포지토리 연결
   - Root Directory: `web`

2. **환경 변수 설정** (Vercel Dashboard)
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   NEXT_PUBLIC_SITE_URL=https://your-app.vercel.app
   INVITE_SECRET=your-invite-secret-key
   ```

3. **빌드 설정**
   - Build Command: `npm run build`
   - Install Command: `npm install`
   - Node.js Version: 18.x 이상

4. **Supabase RLS 정책 확인**
   - 배포 전 마이그레이션 파일 실행 필수
   - RLS 정책이 올바르게 적용되었는지 확인

### Supabase 설정

#### RLS 정책 적용
프로젝트에 다음 RLS 정책이 적용되어 있어야 합니다:

```sql
-- 예시: customers 테이블 RLS
create policy "owner_customers_branch" on public.customers
  for all using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'OWNER' and p.branch_id = customers.branch_id
    )
  );
```

#### 마이그레이션 실행
```bash
# Supabase CLI 설치 후
supabase db push
# 또는 Supabase Dashboard에서 SQL 실행
```

자세한 배포 가이드는 `VERCEL_DEPLOYMENT.md`를 참고하세요.

## 개발 가이드

### 역할 기반 개발

#### 권한 체크 패턴

```typescript
// 1. HOC를 사용한 페이지 보호
import { createOwnerOrAbovePage } from '@/app/lib/hocs/createProtectedPage'

function MyPage() { /* ... */ }
export default createOwnerOrAbovePage(MyPage)

// 2. Hook을 사용한 컴포넌트 내 권한 체크
import { useCurrentUser } from '@/app/lib/hooks/useCurrentUser'

function MyComponent() {
  const { isHQ, branchId } = useCurrentUser()
  // 권한에 따른 UI 렌더링
}

// 3. API 라우트에서 권한 검증
import { requireOwnerOrAbove } from '@/app/lib/api/roleGuard'

export async function POST(req: NextRequest) {
  const userProfile = await requireOwnerOrAbove(req)
  // userProfile.branch_id로 데이터 필터링
}
```

#### 데이터 필터링

```typescript
// 지점별 데이터 조회
const { data, error } = await supabase
  .from('customers')
  .select('*')
  .eq('branch_id', userProfile.branch_id) // 자동 필터링
```

### 코드 스타일

- TypeScript 사용 (strict mode)
- ESLint 규칙 준수
- 컴포넌트는 함수형 컴포넌트 사용
- API 라우트는 Zod 스키마로 검증
- 역할 기반 접근 제어 필수 적용

### API 응답 형식

모든 API는 다음 형식을 따릅니다:

```typescript
{
  success: boolean
  data?: T
  error?: string
}
```

### 에러 처리

- `403/page.tsx`: 권한 없음 페이지
- `error.tsx`: 페이지 레벨 에러 처리
- `global-error.tsx`: 글로벌 에러 처리
- `not-found.tsx`: 404 페이지
- API 에러는 `createErrorResponse()` 사용

## 라이선스

프로젝트 라이선스를 확인하세요.
