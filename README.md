# 📝 과제 관리 앱

나만의 과제 관리 웹앱! 모든 기기에서 동기화됩니다.

## 🚀 배포 방법

### 1단계: Firebase 설정 (5분)

1. [Firebase Console](https://console.firebase.google.com/) 접속
2. **프로젝트 만들기** 클릭
3. 프로젝트 이름 입력 (예: my-assignments)
4. Google Analytics는 꺼도 됨 → **프로젝트 만들기**

#### Realtime Database 설정
1. 왼쪽 메뉴 **빌드** → **Realtime Database** 클릭
2. **데이터베이스 만들기** 클릭
3. 위치: **싱가포르** 선택 (한국에서 빠름)
4. **테스트 모드에서 시작** 선택 → **사용 설정**

#### 앱 등록
1. 프로젝트 설정(⚙️) → **일반** 탭
2. 아래쪽 **앱 추가** → **웹(</>)** 아이콘 클릭
3. 앱 닉네임 입력 → **앱 등록**
4. 나오는 설정값 복사해두기!

### 2단계: 코드에 Firebase 설정 입력

`lib/firebase.js` 파일을 열고 설정값을 입력:

```javascript
const firebaseConfig = {
  apiKey: "여기에_복사한_apiKey",
  authDomain: "여기에_복사한_authDomain",
  databaseURL: "여기에_복사한_databaseURL",  // 중요!
  projectId: "여기에_복사한_projectId",
  storageBucket: "여기에_복사한_storageBucket",
  messagingSenderId: "여기에_복사한_messagingSenderId",
  appId: "여기에_복사한_appId"
};
```

### 3단계: Vercel 배포 (3분)

1. [GitHub](https://github.com)에 이 폴더를 업로드
   - **New repository** 만들기
   - 파일들 업로드

2. [Vercel](https://vercel.com) 접속 → GitHub으로 로그인

3. **Add New** → **Project** → GitHub 저장소 선택

4. **Deploy** 클릭!

5. 배포 완료되면 `https://너의앱.vercel.app` 주소 받음!

## 📱 휴대폰에 앱으로 설치

### iPhone
1. Safari로 사이트 접속
2. 공유 버튼(□↑) 탭
3. **홈 화면에 추가** 선택

### Android
1. Chrome으로 사이트 접속
2. 메뉴(⋮) → **홈 화면에 추가**

## ✨ 기능

- 📋 시간표 사진 업로드
- ✅ 과제 추가/완료/삭제
- 🔁 반복 과제 자동 생성
- 📅 주별/과목별/달력 보기
- 🔄 모든 기기 실시간 동기화
- 📱 PWA - 앱처럼 사용 가능

## 🎨 과목 색상

- 🔴 국어
- 🟠 언매
- 🟡 미적분
- 🟢 수학공통
- 🔵 영어
- 🟣 사문
- 💜 세계사
