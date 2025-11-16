# UI 컴포넌트 라이브러리

이 디렉토리에는 재사용 가능한 UI 컴포넌트들이 포함되어 있습니다.

## 컴포넌트 목록

### 기본 컴포넌트

- **Button** - 다양한 variant와 size를 지원하는 버튼 컴포넌트
- **Input** - 입력 필드 컴포넌트
- **Card** - 카드 레이아웃 컴포넌트
- **Modal** - 모달 다이얼로그 컴포넌트

### 입력 컴포넌트

- **FloatingLabel** - 플로팅 라벨 입력 컴포넌트
- **DatePicker** - 날짜 선택기
- **NumberInput** - 숫자 입력 (자동 포맷팅)
- **Autocomplete** - 자동완성 입력
- **FileUpload** - 파일 업로드 (드래그 앤 드롭)

### 피드백 컴포넌트

- **Spinner** - 로딩 스피너
- **LoadingButton** - 로딩 상태 버튼
- **ConfirmDialog** - 재확인 모달
- **Skeleton** - 스켈레톤 로더

### 테이블 컴포넌트

- **Table** - 테이블 래퍼
- **TableSort** - 정렬 가능한 테이블 헤더
- **Pagination** - 페이지네이션 컴포넌트

### 네비게이션 컴포넌트

- **Drawer** - 사이드 드로어
- **Breadcrumb** - 브레드크럼 네비게이션
- **Dropdown** - 드롭다운 메뉴
- **Tabs** - 탭 컴포넌트 (개선됨)

### 레이아웃 컴포넌트

- **StickyHeader** - 고정 헤더
- **ScrollToTop** - 상단 스크롤 버튼
- **InfiniteScroll** - 무한 스크롤 래퍼

### 애니메이션 컴포넌트

- **FadeIn** - 페이드인 애니메이션
- **SlideIn** - 슬라이드인 애니메이션
- **AnimatedList** - 리스트 애니메이션

### 테마 컴포넌트

- **ThemeToggle** - 테마 토글 버튼

## 사용 예시

### Button

```tsx
import Button from '@/app/components/ui/Button'

<Button variant="primary" size="md" leftIcon={<Icon />}>
  클릭
</Button>
```

### Input

```tsx
import Input from '@/app/components/ui/Input'

<Input
  label="이름"
  placeholder="이름을 입력하세요"
  error={error}
  helpText="도움말 텍스트"
/>
```

### Modal

```tsx
import Modal, { ModalHeader, ModalBody, ModalFooter } from '@/app/components/ui/Modal'

<Modal open={open} onClose={onClose} size="lg">
  <ModalHeader title="제목" />
  <ModalBody>내용</ModalBody>
  <ModalFooter>푸터</ModalFooter>
</Modal>
```

### DatePicker

```tsx
import DatePicker from '@/app/components/ui/DatePicker'

<DatePicker
  label="날짜"
  value={date}
  onChange={(date) => setDate(date)}
/>
```

### Autocomplete

```tsx
import Autocomplete from '@/app/components/ui/Autocomplete'

<Autocomplete
  label="검색"
  options={options}
  value={value}
  onChange={(value) => setValue(value)}
  onSearch={async (query) => {
    // 검색 로직
    return results
  }}
/>
```

## 접근성

모든 컴포넌트는 WCAG 2.1 가이드라인을 준수하며 다음과 같은 접근성 기능을 포함합니다:

- ARIA 속성
- 키보드 네비게이션
- 포커스 관리
- 스크린 리더 지원

## 반응형

모든 컴포넌트는 모바일부터 데스크톱까지 반응형으로 동작합니다. Tailwind CSS의 반응형 유틸리티 클래스를 사용합니다.

## 테마

컴포넌트는 다크모드를 지원합니다. `ThemeProvider`를 통해 테마를 관리할 수 있습니다.

```tsx
import { ThemeProvider } from '@/app/lib/context/ThemeContext'
import ThemeToggle from '@/app/components/ui/ThemeToggle'

<ThemeProvider>
  <ThemeToggle />
</ThemeProvider>
```
