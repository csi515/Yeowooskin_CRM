# Supabase 마이그레이션 적용 가이드

## 적용 순서

현재 시스템에 맞게 수정된 SQL 파일을 다음 순서로 적용하세요:

### 1단계: 기본 구조 (이미 적용되어 있을 수 있음)
- `001_users.sql` - 사용자 테이블 (선택사항, profiles로 대체됨)
- `002_sync_auth_updates.sql` - auth 동기화
- `003_franchise_structure.sql` - 프랜차이즈 구조 (필수)
- `004_skincare_features.sql` - 피부관리 기능
- `006_index_optimization.sql` - 인덱스 최적화

### 2단계: 통합 스키마 적용 (권장)
**`007_complete_schema.sql`** 파일을 Supabase SQL Editor에서 실행하세요.

이 파일은 다음을 포함합니다:
- 모든 테이블 생성 (if not exists로 안전하게)
- 모든 인덱스 생성
- 모든 RLS 정책 설정
- 모든 트리거 설정
- 기본 데이터 삽입

### 3단계: 알림 테이블 수정 (필수)
코드에서 `user_id`를 사용하므로, 기존에 `profile_id`를 사용한 경우 다음을 실행:

```sql
-- notification_settings 테이블 수정
ALTER TABLE public.notification_settings 
  DROP CONSTRAINT IF EXISTS notification_settings_profile_id_fkey,
  DROP COLUMN IF EXISTS profile_id,
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS notification_type text,
  ADD COLUMN IF NOT EXISTS enabled boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS channel text DEFAULT 'email',
  ADD CONSTRAINT notification_settings_user_type_unique UNIQUE (user_id, notification_type);

-- notifications 테이블 수정
ALTER TABLE public.notifications
  DROP CONSTRAINT IF EXISTS notifications_profile_id_fkey,
  DROP COLUMN IF EXISTS profile_id,
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  DROP COLUMN IF EXISTS is_read,
  ADD COLUMN IF NOT EXISTS read boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS read_at timestamptz,
  ADD COLUMN IF NOT EXISTS metadata jsonb;

-- 인덱스 재생성
DROP INDEX IF EXISTS idx_notification_settings_profile_id;
DROP INDEX IF EXISTS idx_notifications_profile_id;
CREATE INDEX IF NOT EXISTS idx_notification_settings_user_id ON public.notification_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON public.notifications(read, created_at DESC);
```

## 적용 방법

### 방법 1: Supabase Dashboard
1. Supabase Dashboard 접속
2. SQL Editor 열기
3. `007_complete_schema.sql` 파일 내용 복사하여 붙여넣기
4. 실행

### 방법 2: Supabase CLI
```bash
cd web
supabase db push
```

### 방법 3: 개별 파일 적용
각 SQL 파일을 순서대로 실행:
1. `003_franchise_structure.sql`
2. `004_skincare_features.sql`
3. `005_hq_admin_features.sql` (수정 필요: notification_settings는 user_id 사용)
4. `006_index_optimization.sql`
5. `007_complete_schema.sql` (최신 통합 버전)

## 주의사항

1. **백업 필수**: 기존 데이터가 있는 경우 반드시 백업 후 진행
2. **RLS 정책**: 기존 정책이 있으면 `drop policy if exists`로 안전하게 처리됨
3. **트리거**: 기존 트리거가 있으면 `drop trigger if exists`로 안전하게 처리됨
4. **테이블**: `create table if not exists`로 안전하게 처리됨

## 검증

마이그레이션 후 다음을 확인하세요:

```sql
-- 테이블 존재 확인
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN (
    'branches', 'profiles', 'invitations',
    'customers', 'products', 'staff', 'appointments',
    'transactions', 'expenses',
    'points_ledger', 'customer_products', 'customer_product_ledger',
    'treatment_rooms', 'treatment_records', 'treatment_programs',
    'approval_history', 'api_keys', 'notification_settings',
    'notifications', 'permissions', 'system_settings', 'backup_history'
  );

-- RLS 활성화 확인
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('branches', 'profiles', 'customers', 'notification_settings', 'notifications');
```

## 문제 해결

### 오류: "relation already exists"
- `create table if not exists`를 사용하므로 안전하게 처리됨
- 기존 테이블 구조가 다르면 수동으로 수정 필요

### 오류: "policy already exists"
- `drop policy if exists`로 처리됨
- 그래도 오류가 나면 수동으로 정책 삭제 후 재생성

### notification_settings 테이블 오류
- 코드는 `user_id`를 사용하므로 `profile_id`가 있으면 위의 ALTER TABLE 스크립트 실행

