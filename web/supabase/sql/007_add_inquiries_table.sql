-- =====================================================
-- 문의(Inquiries) 테이블 생성
-- =====================================================
-- 홈페이지 방문자가 문의를 남길 수 있는 기능
-- 글자 수 제한으로 데이터베이스 보안 강화
-- =====================================================

-- 문의 테이블 생성
CREATE TABLE IF NOT EXISTS public.inquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL CHECK (char_length(name) <= 50),
  email TEXT NOT NULL CHECK (char_length(email) <= 100),
  phone TEXT CHECK (phone IS NULL OR char_length(phone) <= 20),
  subject TEXT NOT NULL CHECK (char_length(subject) <= 100),
  message TEXT NOT NULL CHECK (char_length(message) <= 2000),
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'in_progress', 'resolved')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_inquiries_created_at ON public.inquiries(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_inquiries_status ON public.inquiries(status);
CREATE INDEX IF NOT EXISTS idx_inquiries_email ON public.inquiries(email);

-- RLS 활성화
ALTER TABLE public.inquiries ENABLE ROW LEVEL SECURITY;

-- 구버전 정책 삭제 (재실행 시 오류 방지)
DROP POLICY IF EXISTS "inquiries_insert_public" ON public.inquiries;
DROP POLICY IF EXISTS "inquiries_select_admin" ON public.inquiries;
DROP POLICY IF EXISTS "inquiries_update_admin" ON public.inquiries;
DROP POLICY IF EXISTS "inquiries_delete_admin" ON public.inquiries;

-- RLS 정책: 누구나 문의를 등록할 수 있음 (공개 삽입)
CREATE POLICY "inquiries_insert_public" 
ON public.inquiries 
FOR INSERT 
WITH CHECK (true);

-- RLS 정책: 인증된 관리자만 문의 조회 가능
CREATE POLICY "inquiries_select_admin" 
ON public.inquiries 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE users.id = auth.uid() 
    AND users.role = 'admin'
  )
);

-- RLS 정책: 인증된 관리자만 문의 상태 업데이트 가능
CREATE POLICY "inquiries_update_admin" 
ON public.inquiries 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE users.id = auth.uid() 
    AND users.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE users.id = auth.uid() 
    AND users.role = 'admin'
  )
);

-- RLS 정책: 인증된 관리자만 문의 삭제 가능
CREATE POLICY "inquiries_delete_admin" 
ON public.inquiries 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE users.id = auth.uid() 
    AND users.role = 'admin'
  )
);

-- updated_at 자동 업데이트 트리거
-- 트리거 삭제 후 재생성 (재실행 시 오류 방지)
DROP TRIGGER IF EXISTS update_inquiries_updated_at ON public.inquiries;

CREATE TRIGGER update_inquiries_updated_at
  BEFORE UPDATE ON public.inquiries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 완료!
-- =====================================================
