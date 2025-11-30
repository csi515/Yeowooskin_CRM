-- appointments 테이블에 staff_id 컬럼 추가 마이그레이션
-- 기존 데이터를 유지하면서 컬럼을 추가합니다.

-- staff_id 컬럼 추가
ALTER TABLE public.appointments 
ADD COLUMN IF NOT EXISTS staff_id UUID REFERENCES public.staff(id) ON DELETE SET NULL;

-- 인덱스 추가 (성능 향상)
CREATE INDEX IF NOT EXISTS idx_appointments_staff ON public.appointments(staff_id);

-- 완료 메시지
DO $$
BEGIN
  RAISE NOTICE 'staff_id 컬럼이 appointments 테이블에 추가되었습니다.';
END $$;
