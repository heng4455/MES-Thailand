# MES Thailand - 설치형 제조실행시스템 (Manufacturing Execution System)

[![Node.js](https://img.shields.io/badge/Node.js-18.x-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18.x-blue.svg)](https://reactjs.org/)
[![Electron](https://img.shields.io/badge/Electron-latest-lightgrey.svg)](https://electronjs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15.x-blue.svg)](https://postgresql.org/)

## 📋 프로젝트 개요

**MES Thailand**는 태국 제조업체를 위한 완전한 설치형 제조실행시스템입니다. 
Electron 데스크톱 애플리케이션으로 제작되어 독립 실행이 가능하며, 다국어 지원(한국어, 영어, 태국어)과 현대적인 UI/UX를 제공합니다.

## 🏗 시스템 아키텍처

```
MES Thailand System
├── Frontend (Electron + React)
│   ├── 데스크톱 애플리케이션
│   ├── 다국어 지원 (Ko, En, Th)
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
- **i18n**: react-i18next
- **State Management**: React Context
- **Build**: Webpack, Babel

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
git clone [repository-url]
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
```

## 📁 프로젝트 구조

```
mes-thailand/
├── frontend/                 # Electron + React 앱
│   ├── public/              # 정적 파일
│   │   ├── components/      # 재사용 컴포넌트
│   │   ├── pages/          # 페이지 컴포넌트
│   │   ├── layouts/        # 레이아웃 컴포넌트
│   │   ├── locales/        # 다국어 파일
│   │   ├── hooks/          # 커스텀 훅
│   │   ├── utils/          # 유틸리티 함수
│   │   ├── assets/         # 이미지, 애니메이션
│   │   └── styles/         # CSS 파일
│   └── electron/           # Electron 메인 프로세스
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

- 프로젝트 링크: [https://github.com/your-username/mes-thailand](https://github.com/your-username/mes-thailand)
- 이슈 제보: [Issues](https://github.com/your-username/mes-thailand/issues)

---

**Made with ❤️ for Thai Manufacturing Industry** 