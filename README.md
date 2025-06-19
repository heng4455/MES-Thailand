# MES Thailand - 설치형 제조실행시스템 (Manufacturing Execution System)

[![Node.js](https://img.shields.io/badge/Node.js-18.x-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18.x-blue.svg)](https://reactjs.org/)
[![Electron](https://img.shields.io/badge/Electron-latest-lightgrey.svg)](https://electronjs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15.x-blue.svg)](https://postgresql.org/)

## 📋 프로젝트 개요

**MES Thailand**는 태국 제조업체를 위한 완전한 설치형 제조실행시스템입니다. 
Electron 데스크톱 애플리케이션으로 제작되어 독립 실행이 가능하며, 4개국어 지원(한국어, 영어, 태국어, 중국어)과 현대적인 UI/UX를 제공합니다.

## 🎯 주요 기능

### ✨ 최신 업데이트
- 🖥️ **데스크톱 앱**: Electron 기반 설치형 앱 (설치 프로그램 + 포터블 버전)
- 🌍 **4개국어 지원**: 한국어, 영어, 태국어, 중국어 완전 지원
- 🔔 **향상된 알림 시스템**: 실시간 드롭다운 알림 및 상태 표시
- 📊 **실시간 재고 계산**: 정확한 재고 수준 모니터링
- 🔐 **개선된 인증 시스템**: JWT 기반 보안 강화

### 📱 데스크톱 앱 다운로드

> **중요**: GitHub의 파일 크기 제한으로 인해 설치 파일은 별도로 제공됩니다.
> 웹 애플리케이션에서 다운로드 페이지를 통해 받으실 수 있습니다.

**사용 가능한 버전:**
- 🔧 **설치 프로그램** (101.8MB): 일반적인 설치 프로그램, 바탕화면 바로가기 포함
- 💾 **포터블 버전** (448.3MB): USB나 별도 폴더에서 바로 실행 가능

**장점:**
- ⚡ 더 빠른 실행 속도
- 📱 오프라인 데이터 캐싱
- 🔔 시스템 알림 지원  
- 🔄 멀티태스킹 환경 최적화

## 🏗 시스템 아키텍처

```
MES Thailand System
├── Frontend (Electron + React)
│   ├── 데스크톱 애플리케이션 (설치형 + 포터블)
│   ├── 4개국어 지원 (Ko, En, Th, Zh)
│   └── 현대적 UI/UX (Tailwind CSS)
├── Backend (Node.js + Express)
│   ├── RESTful API
│   ├── JWT 인증 시스템
│   └── 실시간 Socket.IO 통신
└── Database (PostgreSQL)
    ├── 생산 데이터 관리
    ├── 품질 관리 시스템
    └── 감사 로그 시스템
```

## 🛠 기술 스택

### Frontend
- **Framework**: Electron, React 18
- **Styling**: Tailwind CSS
- **Animation**: Framer Motion, Lottie
- **Charts**: Chart.js, React Chart.js 2
- **i18n**: react-i18next (4개국어 지원)
- **State Management**: React Context
- **Build**: Webpack, Babel, Electron Builder

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: PostgreSQL
- **Authentication**: JWT (JSON Web Tokens)
- **Email**: Nodemailer
- **Real-time**: Socket.IO
- **Validation**: express-validator, Joi
- **Security**: Helmet, CORS, bcryptjs

## 🚀 설치 및 실행

### 전체 프로젝트 설치

```bash
# 저장소 클론
git clone https://github.com/heng4455/MES-Thailand.git
cd mes-thailand

# 전체 의존성 설치
npm run install:all

# 환경 설정
cp backend/.env.example backend/.env
# .env 파일 설정 필요
```

### PostgreSQL 데이터베이스 설정

```sql
-- 데이터베이스 생성
CREATE DATABASE mes_thailand;
CREATE USER mes_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE mes_thailand TO mes_user;
```

### 데이터베이스 초기화

```bash
# 테이블 생성
npm run db:migrate

# 초기 데이터 생성
npm run db:seed
```

### 개발 서버 실행

```bash
# backend/.env 파일 생성
cp backend/.env.example backend/.env
```

### 4. 개발 모드 실행
```bash
# 백엔드 + 프론트엔드 동시 실행
npm run dev

# 또는 개별 실행
npm run dev:backend
npm run dev:frontend
```

### 5. Electron 앱 실행
```bash
npm run electron
```

### 6. 빌드 및 배포
```bash
# 전체 빌드
npm run build

# Electron 실행 파일 생성
npm run electron:build

# 데스크톱 앱 빌드 (Windows)
cd frontend
npm run build:desktop
```

## 📁 프로젝트 구조

```
mes-thailand/
├── frontend/                 # Electron + React 앱
│   ├── public/              # 정적 파일
│   │   ├── downloads/       # 데스크톱 앱 다운로드 파일
│   │   ├── components/      # 재사용 컴포넌트
│   │   ├── pages/          # 페이지 컴포넌트
│   │   ├── layouts/        # 레이아웃 컴포넌트
│   │   ├── locales/        # 다국어 파일 (ko, en, th, zh)
│   │   ├── hooks/          # 커스텀 훅
│   │   ├── utils/          # 유틸리티 함수
│   │   ├── assets/         # 이미지, 애니메이션
│   │   └── styles/         # CSS 파일
│   ├── electron/           # Electron 메인 프로세스
│   ├── build-desktop.ps1   # 데스크톱 빌드 스크립트
│   └── build-clean.ps1     # 빌드 정리 스크립트
├── backend/                # Node.js API 서버
│   ├── src/
│   │   ├── controllers/    # API 컨트롤러
│   │   ├── models/         # 데이터 모델
│   │   ├── routes/         # API 라우터
│   │   ├── middleware/     # 미들웨어
│   │   ├── services/       # 비즈니스 로직
│   │   ├── database/       # DB 설정
│   │   └── utils/          # 유틸리티
└── database/               # DB 관련 파일
    ├── migrations/         # 마이그레이션
    ├── seeds/             # 시드 데이터
    └── schema.sql         # DB 스키마
```

## 🌍 다국어 지원

현재 지원되는 언어:
- 🇰🇷 한국어 (Korean)
- 🇺🇸 영어 (English)  
- 🇹🇭 태국어 (Thai)
- 🇨🇳 중국어 (Chinese)

모든 페이지와 컴포넌트가 4개 언어로 완전히 번역되어 있으며, 헤더의 언어 선택기를 통해 실시간으로 언어를 변경할 수 있습니다.

## 📱 스크린샷

*(스크린샷은 개발 완료 후 추가 예정)*

## 🤝 기여하기

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다. 자세한 내용은 `LICENSE` 파일을 참조하세요.

## 📞 문의

- 프로젝트 링크: [https://github.com/heng4455/MES-Thailand](https://github.com/heng4455/MES-Thailand)
- 이슈 제보: [Issues](https://github.com/heng4455/MES-Thailand/issues)

---

**Made with ❤️ for Thai Manufacturing Industry** 