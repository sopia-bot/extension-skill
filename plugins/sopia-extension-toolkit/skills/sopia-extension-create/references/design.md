# Renderer design guide

Renderer는 ZIZI의 어두운 데스크톱 표면 안에서 열린다. 설정을 빠르게 이해하고 안전하게 저장하는 도구 UI로 만든다.

## 원칙

- 다크 단일 테마
- 화면당 주요 CTA 하나
- shadcn/ui 또는 네이티브 semantic element 우선
- 색은 semantic token으로만 사용
- 아이콘은 Lucide 한 종류만 사용하고 emoji를 구조적 아이콘으로 쓰지 않음
- 애니메이션은 상태 변화를 설명할 때만 150–300ms
- `prefers-reduced-motion` 존중

## 공개 토큰

```css
:root {
  color-scheme: dark;
  --background: 0 0% 7%;
  --foreground: 0 0% 98%;
  --card: 0 0% 10%;
  --card-foreground: 0 0% 98%;
  --muted: 0 0% 15%;
  --muted-foreground: 0 0% 64%;
  --border: 0 0% 20%;
  --input: 0 0% 20%;
  --primary: 339 90% 51%;
  --primary-foreground: 0 0% 100%;
  --destructive: 0 72% 51%;
  --destructive-foreground: 0 0% 100%;
  --ring: 339 90% 51%;
  --radius: 0.75rem;
}
```

컴포넌트 JSX에 raw hex, `zinc-*`, `slate-*` 색을 직접 넣지 않는다. 브랜드 핑크는 저장·실행 같은 주요 동작, 활성 상태, focus ring에만 사용한다.

## 설정 폼

- 모든 입력은 가시적인 `<label>`과 연결한다.
- placeholder를 label 대신 사용하지 않는다.
- 복잡한 값은 입력 아래 helper text로 설명한다.
- 길이·범위 제한을 입력 속성과 Worker 검증 양쪽에 둔다.
- 저장 중 버튼을 비활성화하고 진행 상태를 표시한다.
- 성공·실패 결과는 `aria-live="polite"` 또는 `role="alert"`로 알린다.
- 에러는 해당 필드 가까이에 원인과 복구 방법을 표시한다.
- Switch에는 접근 가능한 이름을 제공한다.

## 통계와 이벤트 목록

- 숫자는 `tabular-nums`를 사용한다.
- 상태를 색만으로 구분하지 말고 텍스트나 아이콘을 함께 사용한다.
- 빈 목록에는 무엇을 해야 데이터가 생기는지 설명한다.
- 이벤트 목록은 최근 항목 수를 제한한다.
- 닉네임과 메시지는 React text node 또는 `textContent`로 렌더링한다. `innerHTML`을 사용하지 않는다.

## Layout

- 기본 content width는 `max-width: 48rem`.
- 4px/8px 간격 체계를 사용한다.
- 패널 자체가 스크롤되도록 `height: 100%`와 `overflow-y: auto`를 명시한다.
- 좁은 폭에서도 가로 스크롤이 생기지 않게 grid를 한 열로 축소한다.
- 중첩 스크롤 영역은 실시간 목록처럼 필요한 곳에만 둔다.

## Interaction checklist

- 키보드만으로 모든 입력과 버튼 사용 가능
- focus ring 제거 금지
- 아이콘 전용 버튼에 `aria-label`
- disabled 상태가 시각적·semantic하게 명확함
- 로딩, 빈 상태, 실패 상태 존재
- 성공 토스트가 focus를 훔치지 않음
- 저장 실패 후 다시 시도 가능
- 장식 애니메이션 없음
