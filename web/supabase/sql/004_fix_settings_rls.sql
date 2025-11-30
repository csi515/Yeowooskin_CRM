-- Settings 테이블 RLS 정책 수정
-- 사용자별로 설정이 구분되도록 보장

-- 기존 정책 삭제 (있다면)
DROP POLICY IF EXISTS "settings_all" ON public.settings;
DROP POLICY IF EXISTS "settings_select_policy" ON public.settings;
DROP POLICY IF EXISTS "settings_insert_policy" ON public.settings;
DROP POLICY IF EXISTS "settings_update_policy" ON public.settings;
DROP POLICY IF EXISTS "settings_delete_policy" ON public.settings;

-- RLS 활성화 확인
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- SELECT 정책: 사용자는 자신의 설정만 조회 가능
CREATE POLICY "settings_select_own"
ON public.settings
FOR SELECT
USING (owner_id = auth.uid());

-- INSERT 정책: 사용자는 자신의 owner_id로만 설정 생성 가능
CREATE POLICY "settings_insert_own"
ON public.settings
FOR INSERT
WITH CHECK (owner_id = auth.uid());

-- UPDATE 정책: 사용자는 자신의 설정만 수정 가능
CREATE POLICY "settings_update_own"
ON public.settings
FOR UPDATE
USING (owner_id = auth.uid())
WITH CHECK (owner_id = auth.uid());

-- DELETE 정책: 사용자는 자신의 설정만 삭제 가능
CREATE POLICY "settings_delete_own"
ON public.settings
FOR DELETE
USING (owner_id = auth.uid());

-- 완료 메시지
DO $$
BEGIN
  RAISE NOTICE 'Settings 테이블 RLS 정책이 수정되었습니다.';
END $$;

