/**
 * 에러 메시지 현지화 (한국어)
 * Supabase 에러 코드와 일반 에러를 사용자 친화적인 메시지로 변환
 */

/**
 * Supabase 에러 코드 매핑
 */
const SUPABASE_ERROR_MESSAGES: Record<string, string> = {
    // 인증 관련 에러
    'PGRST301': '인증이 만료되었습니다. 다시 로그인해주세요.',
    'invalid_grant': '잘못된 인증 정보입니다.',
    'invalid_credentials': '이메일 또는 비밀번호가 올바르지 않습니다.',
    'email_not_confirmed': '이메일 인증이 필요합니다. 받은 메일함을 확인해주세요.',
    'user_already_exists': '이미 가입된 이메일입니다.',
    'weak_password': '비밀번호가 너무 약합니다. 더 강한 비밀번호를 사용해주세요.',

    // 데이터 관련 에러
    'PGRST116': '요청한 데이터를 찾을 수 없습니다.',
    '23505': '이미 존재하는 데이터입니다. 다른 값을 사용해주세요.',
    '23503': '참조된 데이터가 존재하지 않습니다.',
    '23502': '필수 항목이 누락되었습니다.',
    '42P01': '데이터베이스 테이블을 찾을 수 없습니다.',

    // 권한 관련 에러
    '42501': '이 작업을 수행할 권한이 없습니다.',
    'insufficient_privilege': '권한이 부족합니다.',

    // 네트워크 관련 에러
    'FetchError': '네트워크 연결을 확인해주세요.',
    'TimeoutError': '요청 시간이 초과되었습니다. 다시 시도해주세요.',

    // JWT 관련 에러
    'invalid_jwt': '인증 토큰이 유효하지 않습니다. 다시 로그인해주세요.',
    'jwt_expired': '로그인이 만료되었습니다. 다시 로그인해주세요.',
}

/**
 * HTTP 상태 코드별 기본 메시지
 */
const HTTP_STATUS_MESSAGES: Record<number, string> = {
    400: '잘못된 요청입니다.',
    401: '로그인이 필요합니다.',
    403: '접근 권한이 없습니다.',
    404: '요청한 리소스를 찾을 수 없습니다.',
    408: '요청 시간이 초과되었습니다.',
    409: '데이터 충돌이 발생했습니다.',
    429: '너무 많은 요청을 보냈습니다. 잠시 후 다시 시도해주세요.',
    500: '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
    502: '서버에 연결할 수 없습니다.',
    503: '서비스를 일시적으로 사용할 수 없습니다.',
    504: '서버 응답 시간이 초과되었습니다.',
}

/**
 * 일반적인 에러 패턴 매핑
 */
const ERROR_PATTERN_MESSAGES: Array<{ pattern: RegExp; message: string }> = [
    { pattern: /network/i, message: '네트워크 연결을 확인해주세요.' },
    { pattern: /timeout/i, message: '요청 시간이 초과되었습니다. 다시 시도해주세요.' },
    { pattern: /fetch.*failed/i, message: '네트워크 연결을 확인해주세요.' },
    { pattern: /duplicate key/i, message: '이미 존재하는 데이터입니다.' },
    { pattern: /foreign key constraint/i, message: '연결된 데이터가 있어 삭제할 수 없습니다.' },
    { pattern: /not null constraint/i, message: '필수 항목을 입력해주세요.' },
    { pattern: /unique constraint/i, message: '중복된 값입니다. 다른 값을 입력해주세요.' },
    { pattern: /permission denied/i, message: '권한이 없습니다.' },
    { pattern: /unauthorized/i, message: '로그인이 필요합니다.' },
]

/**
 * 에러 객체에서 코드 추출
 */
function extractErrorCode(error: unknown): string | null {
    if (!error || typeof error !== 'object') return null

    const err = error as { code?: string; details?: { code?: string }; status?: number | string }

    // Supabase 에러 코드
    if (err.code) return err.code

    // PostgreSQL 에러 코드
    if (err.details?.code) return err.details.code

    // HTTP 상태 코드를 문자열로
    if (err.status) return err.status.toString()

    return null
}

/**
 * 에러를 한국어 메시지로 변환
 * 
 * @param error - 변환할 에러 객체
 * @param fallbackMessage - 기본 메시지 (optional)
 * @returns 사용자 친화적인 한국어 메시지
 * 
 * @example
 * const message = getLocalizedErrorMessage(error)
 * toast.error(message)
 */
export function getLocalizedErrorMessage(
    error: unknown,
    fallbackMessage: string = '오류가 발생했습니다.'
): string {
    if (!error) return fallbackMessage

    // 문자열 에러
    if (typeof error === 'string') {
        // 패턴 매칭
        for (const { pattern, message } of ERROR_PATTERN_MESSAGES) {
            if (pattern.test(error)) {
                return message
            }
        }
        return error || fallbackMessage
    }

    // 객체 에러
    if (typeof error === 'object') {
        const err = error as any

        // 1. 에러 코드 확인
        const code = extractErrorCode(err)
        if (code && SUPABASE_ERROR_MESSAGES[code]) {
            return SUPABASE_ERROR_MESSAGES[code]
        }

        // 2. HTTP 상태 코드 확인
        if (err.status && typeof err.status === 'number') {
            const statusMessage = HTTP_STATUS_MESSAGES[err.status]
            if (statusMessage) {
                return statusMessage
            }
        }

        // 3. 에러 메시지 패턴 매칭
        const message = err.message || err.error || err.msg
        if (message && typeof message === 'string') {
            for (const { pattern, message: localizedMsg } of ERROR_PATTERN_MESSAGES) {
                if (pattern.test(message)) {
                    return localizedMsg
                }
            }

            // 4. Supabase 에러 메시지 직접 번역
            if (message.includes('JWT')) {
                return '인증이 만료되었습니다. 다시 로그인해주세요.'
            }
            if (message.includes('rate limit')) {
                return '너무 많은 요청을 보냈습니다. 잠시 후 다시 시도해주세요.'
            }
            if (message.includes('email') && message.includes('exists')) {
                return '이미 사용 중인 이메일입니다.'
            }

            // 원본 메시지가 한국어면 그대로 반환
            if (/[가-힣]/.test(message)) {
                return message
            }

            // 매칭되는 패턴/코드가 없으면 원본 메시지를 유지 (테스트 및 디버깅 친화)
            return message
        }
    }

    return fallbackMessage
}

/**
 * 필드별 검증 에러 메시지
 */
export const VALIDATION_MESSAGES = {
    required: (field: string) => `${field}은(는) 필수 항목입니다.`,
    email: '올바른 이메일 주소를 입력해주세요.',
    phone: '올바른 전화번호를 입력해주세요. (예: 010-1234-5678)',
    minLength: (field: string, min: number) =>
        `${field}은(는) 최소 ${min}자 이상이어야 합니다.`,
    maxLength: (field: string, max: number) =>
        `${field}은(는) 최대 ${max}자 이하여야 합니다.`,
    min: (field: string, min: number) =>
        `${field}은(는) ${min} 이상이어야 합니다.`,
    max: (field: string, max: number) =>
        `${field}은(는) ${max} 이하여야 합니다.`,
    pattern: (field: string) => `${field} 형식이 올바르지 않습니다.`,
    unique: (field: string) => `이미 사용 중인 ${field}입니다.`,
    match: (field1: string, field2: string) =>
        `${field1}과(와) ${field2}이(가) 일치하지 않습니다.`,
}

/**
 * 성공 메시지
 */
export const SUCCESS_MESSAGES = {
    created: (item: string) => `${item}이(가) 생성되었습니다.`,
    updated: (item: string) => `${item}이(가) 수정되었습니다.`,
    deleted: (item: string) => `${item}이(가) 삭제되었습니다.`,
    saved: '저장되었습니다.',
    sent: '전송되었습니다.',
    copied: '복사되었습니다.',
    uploaded: '업로드되었습니다.',
    downloaded: '다운로드되었습니다.',
}

/**
 * 확인 메시지
 */
export const CONFIRMATION_MESSAGES = {
    delete: (item: string) => `정말 ${item}을(를) 삭제하시겠습니까?`,
    update: (item: string) => `${item}을(를) 수정하시겠습니까?`,
    cancel: '변경사항이 저장되지 않습니다. 계속하시겠습니까?',
    leave: '변경사항이 저장되지 않을 수 있습니다. 페이지를 떠나시겠습니까?',
}
