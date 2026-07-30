# 지렁이 게임 — Web 구현 Design Spec

## 1. 개요

- 장르: 클래식 스네이크 게임의 현대적 리메이크
- 플랫폼: 웹(반응형, 데스크톱+모바일), 참고 원본은 iOS/Android/Steam에도 출시
- 핵심 컨셉: 레트로 향수 + 모던 UX(파워업, 테마, 다중 모드)

## 2. 게임 모드

| 모드 | 설명 | 종료 조건 |
|---|---|---|
| Freestyle | 무한 생존형. 벽 없음(화면 반대편으로 wrap). 긴장감보다 릴렉스한 성장 경험 | 없음(Game Over 없이 계속 먹고 성장) |
| Level | Game Over 전까지 무한 단계. 단계당 속도 증가. 외부·내부 벽이 있는 벽 충돌 모드 | 벽 충돌 시 실패·재시도 |

## 3. 코어 메커닉

- 이동: 4방향(상하좌우), 관성 유지(반대 방향 즉시 전환 불가)
- 조작: 키보드 화살표/WASD(데스크톱), 스와이프 제스처 + on-screen D-Pad(모바일)
- 경계 처리:
  - Freestyle: 벽 없음 — 화면 밖으로 나가면 반대편에서 재등장(wrap-around)
  - Level/Battle: 외부 벽 충돌 시 게임오버(난이도에 따라 옵션화 가능)
- Level 벽: 외부 벽과 함께 플레이마다 내부 임의의 벽 세그먼트를 생성하며, 각 세그먼트는 2~4 block이고 가로/세로 방향을 무작위 혼합한다
- Level 진행: 내부 벽 세그먼트 수는 기존처럼 레벨에 비례해 증가하되 보드 안전 한도를 넘지 않으며, 생성 후 Snake 이동 경로가 반드시 존재해야 함
- Level 속도: 단계당 기본 10% 증가, 최대 2.5배로 제한
- 성장: 먹이(byte) 섭취 시 몸길이 +1, 점수 증가
- 자동 성장: 게임 진행 중 5초마다 몸길이 +1
- 자기 충돌: 모든 모드에서 본인 몸통과 충돌 시 게임오버

## 4. 아이템 & 파워업

- 일반 Byte: 기본 점수 아이템
- Golden Byte: 일정 확률로 등장, 고득점 + 일시적 효과(예: 속도 증가/무적/점수 배율) 부여
- Frog Coin: 게임 플레이 중 별도로 수집, 게임 재화 역할(아래 4번 참고)

## 5. 진행/보상 시스템

- Frog Coin 시스템:
  - 획득: 플레이 중 조건 충족 시 수집
  - 사용처: 테마 잠금 해제, 어려운 레벨 스킵, 추가 시간 보상
- 광고 모델(선택): 보상형 광고로 추가 목숨/시간 제공, Ad-Free 프리미엄 옵션

## 6. 비주얼/테마

- 스타일 토글: 레트로 픽셀 아트 ↔ 모던 스무스 그래픽
- 테마 커스터마이징: Frog Coin으로 해금되는 스킨/배경/스네이크 색상
- UI 톤: 미니멀 HUD(점수, 코인, 남은 목숨/시간만 표시), 모드 선택 화면은 카드형 레이아웃 권장

### 6.1 레트로 디자인 시스템 — "8-Bit Arcade" (기본 테마)

> 출처: [NovusGFX/retro-design-system](https://github.com/NovusGFX/retro-design-system) — AI 코딩 에이전트용 레트로 UI 테마 모음. `styles/11-8bit-arcade/index.html` 기준.

**컬러 팔레트 (CSS 변수)**

```css
:root {
  --bg: #0b0b1e;       /* 배경: 짙은 네이비/블랙 */
  --pink: #ff2d95;      /* 포인트: 핫핑크 */
  --cyan: #00e5ff;      /* 포인트: 네온 시안 */
  --yellow: #ffd300;    /* 강조: 골든 옐로우(Golden Byte에 매칭) */
  --green: #2bff88;     /* 성공/스네이크 몸통 */
  --red: #ff3b3b;       /* 위험/게임오버 */
  --purple: #7c1dfd;    /* 서브 포인트 */
  --white: #ffffff;
  --ink: #e9e9ff;        /* 본문 텍스트 */
  --font: "Press Start 2P", "VT323", monospace; /* 픽셀 폰트 */
}
```

**적용 가이드**

- 배경(`--bg`): 게임 캔버스 바깥 영역, 다크 네이비/블랙 톤 유지
- 스네이크 몸통: `--green`, 충돌/게임오버 시 `--red`로 플래시
- Golden Byte / 강조 아이템: `--yellow`
- HUD 텍스트/버튼 강조: `--pink`, `--cyan` 네온 톤 (box-shadow로 네온 글로우 효과 부여 권장)
- 폰트: `Press Start 2P`(제목/로고 등 짧은 텍스트), `VT323`(점수판·본문처럼 가독성 필요한 부분)에 사용 — 두 폰트를 역할별로 분리
- 버튼/패널 테두리: 픽셀 느낌을 위해 `border-radius: 0`, 두꺼운 solid border + 하드 섀도우(offset shadow, blur 없음) 사용
- 선택적 효과: CRT 스캔라인/글로우를 넣고 싶다면 같은 저장소의 `styles/09-crt-phosphor` 테마의 스캔라인 오버레이 CSS를 함께 참고 가능

**참고 대안 테마**

- `styles/22-gameboy-dmg` (Game Boy DMG) — 4단계 그린 모노크롬. 더 미니멀한 레트로 톤을 원할 경우 대안
- `styles/09-crt-phosphor` (CRT Phosphor) — 그린 인광 터미널 느낌, 배경/오버레이 효과용으로 혼합 사용 가능
- `styles/10-dos-cga` (DOS CGA) — 시안/마젠타 4색 팔레트, 좀 더 거친 도트 느낌 원할 때

## 7. 기술 구현 가이드 (웹)

- 렌더링: HTML5 Canvas 또는 Grid 기반 DOM 렌더링 (Canvas 권장 — 부드러운 애니메이션/파티클 효과에 유리)
- 게임 루프: `requestAnimationFrame` 기반, 고정 tick rate(예: 100~150ms per move)로 스네이크 이동 처리
- 상태 관리: 스네이크 좌표 배열(queue), 방향 벡터, 먹이 좌표, 점수/코인 상태
- 반응형: 캔버스 크기를 뷰포트에 맞춰 스케일링, 모바일은 터치 스와이프 이벤트 바인딩
- 데이터 저장: 최고 점수, 해금 테마 localStorage 사용, DB 사용 금지

## 8. 웹페이지 전체 UI 디자인 (레트로 스타일 적용)

> 게임 캔버스뿐 아니라 랜딩 페이지, 메뉴, 스코어보드 등 사이트 전체를 8-Bit Arcade 톤으로 통일하기 위한 컴포넌트 규칙. [NovusGFX/retro-design-system `styles/11-8bit-arcade`](https://github.com/NovusGFX/retro-design-system/blob/main/styles/11-8bit-arcade/index.html) 원본 컴포넌트를 기준으로 정리.

### 8.1 페이지 배경 & 타이포 베이스

```css
body {
  background: radial-gradient(ellipse at top, #1a1440 0%, var(--bg) 60%), var(--bg);
  color: var(--ink);
  font-family: var(--font);
  image-rendering: pixelated;
}
/* 미세 스캔라인 오버레이 (선택) */
body::before {
  content: "";
  position: fixed; inset: 0; pointer-events: none;
  background-image: repeating-linear-gradient(to bottom, transparent 0 2px, rgba(255,255,255,0.02) 2px 3px);
}
```

- `h1`(로고/타이틀): `--yellow` 색상 + `text-shadow: 4px 4px 0 var(--red), 8px 8px 0 var(--purple)` — 4px 단위로 겹치는 하드 섀도우가 픽셀 느낌의 핵심
- `h2`(섹션 제목): `--cyan` + `text-shadow: 2px 2px 0 var(--pink)`, 대문자 강제(`text-transform: uppercase`)
- 본문(`p`): `line-height: 1.8`, 작은 폰트 크기(12px 내외) 유지 — 픽셀 폰트는 크게 쓰면 가독성이 떨어짐

### 8.2 공통 컨테이너 — "Pixel Box"

랜딩 페이지의 카드/섹션/모달 등 모든 컨테이너에 재사용하는 패턴:

```css
.pixel-box {
  background: var(--bg);
  border: 4px solid var(--white);
  box-shadow: 0 0 0 4px var(--bg), 0 0 0 8px var(--pink), 8px 8px 0 8px var(--purple);
  padding: 20px;
}
```

이중 테두리(흰색 border + pink/purple box-shadow 레이어)가 오락실 기기의 베젤 느낌을 만든다. 모드 선택 카드, 리더보드 패널, 설정 모달 모두 이 클래스를 기본값으로 사용.

### 8.3 버튼

```css
.btn {
  font-family: var(--font); font-size: 12px;
  background: var(--yellow); color: var(--bg);
  border: 4px solid var(--white);
  box-shadow: 4px 4px 0 var(--red), 8px 8px 0 var(--purple);
  padding: 10px 18px; text-transform: uppercase; letter-spacing: 2px;
}
.btn:hover  { transform: translate(-2px,-2px); box-shadow: 6px 6px 0 var(--red), 10px 10px 0 var(--purple); }
.btn:active { transform: translate(4px,4px);   box-shadow: 0 0 0 var(--red), 4px 4px 0 var(--purple); }
.btn-b { background: var(--cyan); }   /* 보조 액션 (예: OPTIONS) */
.btn-c { background: var(--green); }  /* 성공/확인 액션 (예: HI SCORE, PLAY) */
```

- 페이지 CTA 우선순위: 기본(`--yellow`, 예: START/PLAY) → 보조(`--cyan`, 예: OPTIONS/설정) → 확인(`--green`, 예: HI SCORE/저장)
- hover/active 시 위치 이동 + 그림자 축소로 "버튼을 눌렀다"는 물리적 피드백 재현

### 8.4 입력 필드

```css
.input {
  font-family: var(--font); font-size: 12px;
  background: var(--bg); color: var(--green);
  border: 4px solid var(--green); padding: 8px 10px;
  text-transform: uppercase; letter-spacing: 2px;
}
.input:focus { outline: none; border-color: var(--yellow); color: var(--yellow); }
```

닉네임 입력, 검색창 등에 사용. 포커스 시 테두리/텍스트가 옐로우로 전환되어 아케이드 하이스코어 입력 화면 느낌.

### 8.5 HUD / 스코어보드 (웹 헤더·네비게이션에 응용)

```css
.hud { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px; font-size: 12px; }
.score { font-family: var(--font); font-size: 28px; color: var(--yellow); text-shadow: 3px 3px 0 var(--red); }
.life { width: 18px; height: 18px; background: var(--red);
  clip-path: polygon(50% 0, 100% 38%, 82% 100%, 50% 75%, 18% 100%, 0 38%); margin-right: 4px; } /* 하트 모양 */
```

- 사이트 상단 고정 헤더를 오락실 HUD처럼 3분할(1UP / HI-SCORE / LIVES)하여 로그인 상태·최고점수·잔여 목숨(하트 아이콘)을 표시하는 방식으로 응용 가능
- 코인/재화 표시: 원형 옐로우 아이콘에 `scaleX` 애니메이션으로 회전하는 동전 느낌 재현

### 8.6 프로그레스 바 (레벨 진행도, 로딩 화면)

```css
.progress { background: var(--bg); border: 4px solid var(--white); height: 24px; position: relative; }
.progress::after {
  content: ""; position: absolute; inset: 0; width: 65%; /* 진행률 값으로 대체 */
  background: repeating-linear-gradient(to right, var(--pink) 0 8px, var(--red) 8px 16px);
}
```

### 8.7 페이지 구성 제안 (Snake Byte 웹사이트)

1. **Profile**: `Ted the engineer`, `삼성전자 무선 사업부`
2. **Project**: `SnakeByte`, Game 섹션 앵커 링크
3. **Game**: `SnakeByte` 게임 영역과 Freestyle / Level 카드
4. **Contact**: `https://woosung-ted.github.io`
5. **공통 헤더·푸터**: 로고·내비게이션·GitHub 링크는 레트로 톤으로 유지

### 8.8 접근성 주의사항

- 네온 컬러(핑크/시안/옐로우)를 `--bg`(짙은 네이비) 위에 쓸 경우 대비는 충분하나, 픽셀 폰트(Press Start 2P)는 작은 사이즈에서 가독성이 떨어지므로 본문 텍스트는 VT323 등 보조 폰트로 대체 권장
- 버튼 hover/active의 transform 이동은 `prefers-reduced-motion` 미디어쿼리로 감쇠 옵션 제공 권장
- 포커스 아웃라인 제거(`outline: none`) 시 반드시 대체 포커스 스타일(테두리 색상 변경 등)을 유지해 키보드 내비게이션 접근성 확보

## 9. 참고 자료 (Sources)

- [Google Play - Snake Byte (dbdevstudio)](https://play.google.com/store/apps/details?id=com.dbdevstudio.snakebyte&hl=en_US)
- [Steam - SnakeByte](https://store.steampowered.com/app/1916150/SnakeByte/)
- [Steam Community - SnakeByte](https://steamcommunity.com/app/1916150)
- [원조 Snake Byte (1982) - Wikipedia](https://en.wikipedia.org/wiki/Snake_Byte)
- [NovusGFX/retro-design-system (GitHub)](https://github.com/NovusGFX/retro-design-system) — 8-Bit Arcade 등 레트로 UI 디자인 토큰 출처

---
