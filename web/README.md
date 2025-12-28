# BeautyHub - Web Application

Next.js 14 기반의 피부관리샵 및 뷰티샵을 위한 올인원 CRM 시스템입니다.

## 기술 스택

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **UI**: MUI (Material-UI) v6 + Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **State Management**: React Context, SWR / React Query
- **Charts**: Recharts
- **Icons**: Lucide React
- **Date Handling**: date-fns
- **Deployment**: Vercel

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
```

## 프로젝트 구조

```
web/
├── app/
│   ├── (auth)/            # 로그인/회원가입 등 인증 페이지
│   ├── admin/             # 관리자 페이지
│   ├── analytics/         # 통계/분석 페이지 (LTV, VIP)
│   ├── api/               # Next.js API Routes (Serverless Functions)
│   ├── components/        # 재사용 가능한 UI 컴포넌트
│   │   ├── common/        # 공통 컴포넌트 (Header, Layout 등)
│   │   ├── modals/        # 각종 모달 컴포넌트
│   │   └── ui/            # 기본 UI 요소 (Button, Input 등)
│   ├── customers/         # 고객 관리 페이지
│   ├── dashboard/         # 메인 대시보드
│   ├── finance/           # 재무 관리 페이지
│   ├── inventory/         # 재고 관리 페이지
│   ├── payroll/           # 급여/직원 관리 페이지
│   └── lib/               # 유틸리티, API 클라이언트, 훅
├── public/                # 정적 파일 (이미지, 아이콘)
├── types/                 # TypeScript 타입 정의
└── middleware.ts          # 인증 미들웨어
```

## 주요 기능

### 1. 대시보드
- 실시간 예약, 매출, 고객 현황 요약
- 주요 알림 및 공지사항

### 2. 고객 관리 (CRM)
- 고객 상세 정보 및 이력 관리
- 상담 내역 및 사진 기록
- VIP 고객 관리 및 LTV 분석

### 3. 예약 관리
- 캘린더 기반 예약 스케줄링
- 예약 상태 변경 (예약됨, 완료, 취소 등)

### 4. 직원 및 급여 관리
- 직원 근무 일정 및 근태 관리
- 급여 자동 계산 (기본급, 인센티브, 공제 등)
- 직원별 실시간 근태 타임라인

### 5. 재고 관리
- 제품 입출고 및 재고 현황 추적
- 재고 부족/품절 알림 시스템

### 6. 재무 관리
- 수입/지출 내역 기록 및 분석
- 월별 매출/순이익 리포트
- 세무 자료 및 엑셀 다운로드

## 배포

### Vercel 배포

1. Vercel에 프로젝트 연결
2. 환경 변수 설정
3. Build Command: `npm run build`
4. Output Directory: `.next`

## 라이선스

Private Project
