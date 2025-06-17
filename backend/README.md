# MES Thailand Backend

## 📋 개요

MES (Manufacturing Execution System) Thailand 백엔드 API 서버입니다.
Node.js + Express + PostgreSQL을 기반으로 구축되었습니다.

## 🛠 기술 스택

- **Backend**: Node.js, Express.js
- **Database**: PostgreSQL
- **Authentication**: JWT (JSON Web Tokens)
- **Email**: Nodemailer
- **Real-time**: Socket.IO
- **Validation**: express-validator, Joi
- **File Upload**: Multer
- **Security**: Helmet, CORS, bcryptjs

## 📁 프로젝트 구조

```
backend/
├── src/
│   ├── config/
│   │   └── database.js          # 데이터베이스 연결 설정
│   ├── controllers/
│   │   └── authController.js    # 인증 컨트롤러
│   ├── middleware/
│   │   ├── auth.js              # JWT 인증 미들웨어
│   │   └── errorHandler.js      # 에러 핸들링 미들웨어
│   ├── models/                  # 데이터 모델 (향후 추가)
│   ├── routes/
│   │   ├── authRoutes.js        # 인증 라우터
│   │   ├── userRoutes.js        # 사용자 관리 라우터
│   │   ├── dashboardRoutes.js   # 대시보드 라우터
│   │   ├── productionRoutes.js  # 생산 관리 라우터
│   │   ├── qualityRoutes.js     # 품질 관리 라우터
│   │   ├── equipmentRoutes.js   # 장비 관리 라우터
│   │   ├── planningRoutes.js    # 생산 계획 라우터
│   │   └── reportRoutes.js      # 보고서 라우터
│   └── utils/
│       └── helpers.js           # 유틸리티 함수들
├── scripts/
│   ├── migrate.js               # 데이터베이스 마이그레이션
│   └── seed.js                  # 초기 데이터 생성
├── uploads/                     # 파일 업로드 디렉토리
├── .env.example                 # 환경 변수 예시
├── package.json
└── server.js                    # 메인 서버 파일
```

## 🚀 설치 및 실행

### 1. 환경 변수 설정

`.env.example` 파일을 복사하여 `.env` 파일을 생성하고 설정을 수정하세요:

```bash
cp .env.example .env
```

### 2. PostgreSQL 데이터베이스 설정

PostgreSQL을 설치하고 데이터베이스를 생성하세요:

```sql
CREATE DATABASE mes_thailand;
CREATE USER mes_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE mes_thailand TO mes_user;
```

### 3. 의존성 설치

```bash
npm install
```

### 4. 데이터베이스 초기화

```bash
# 테이블 생성
npm run db:migrate

# 초기 데이터 생성
npm run db:seed
```

### 5. 서버 실행

```bash
# 개발 모드 (nodemon 사용)
npm run dev

# 프로덕션 모드
npm start
```

## 📚 API 엔드포인트

### 인증 API (`/api/auth`)

| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| POST | `/register` | 회원가입 | Public |
| POST | `/login` | 로그인 | Public |
| POST | `/verify-email` | 이메일 인증 | Public |
| POST | `/forgot-password` | 비밀번호 재설정 요청 | Public |
| POST | `/reset-password` | 비밀번호 재설정 | Public |
| GET | `/profile` | 프로필 조회 | Private |
| GET | `/check` | 토큰 유효성 검사 | Private |

### 사용자 관리 API (`/api/users`)

| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| GET | `/` | 사용자 목록 조회 | Admin |
| PATCH | `/:id/status` | 사용자 상태 변경 | Admin |

### 대시보드 API (`/api/dashboard`)

| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| GET | `/stats` | 대시보드 통계 | Private |

### 생산 관리 API (`/api/production`)

| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| GET | `/work-orders` | 작업 지시서 목록 | Private |
| GET | `/lines` | 생산 라인 목록 | Private |

## 🔐 인증 시스템

### JWT 토큰 기반 인증

- 로그인 시 JWT 토큰 발급
- Authorization 헤더에 Bearer 토큰 포함
- 토큰 만료 시간: 7일 (설정 가능)

### 권한 체계

- **general**: 일반 사용자 (기본값)
- **manager**: 매니저 (생산 관리 권한)
- **admin**: 관리자 (모든 권한)

### 계정 승인 시스템

- 회원가입 후 관리자 승인 필요
- 상태: `pending` → `approved` / `rejected`

## 📧 이메일 시스템

- 회원가입 시 이메일 인증
- 비밀번호 재설정 링크 발송
- SMTP 설정 필요 (Gmail 권장)

## 🗄 데이터베이스 스키마

### 주요 테이블

- **users**: 사용자 정보
- **production_lines**: 생산 라인
- **products**: 제품 정보
- **work_orders**: 작업 지시서
- **production_records**: 생산 기록
- **equipment**: 장비 정보
- **quality_checks**: 품질 검사
- **defect_types**: 불량 유형
- **audit_logs**: 감사 로그

## 🔧 개발 도구

### 스크립트 명령어

```bash
# 개발 서버 실행
npm run dev

# 프로덕션 서버 실행
npm start

# 데이터베이스 마이그레이션
npm run db:migrate

# 데이터베이스 시딩
npm run db:seed

# 데이터베이스 리셋
npm run db:reset
```

### 기본 계정 정보

시드 데이터 실행 후 다음 계정으로 테스트 가능:

- **관리자**: admin@mes-thailand.com / Admin123!@#
- **매니저**: manager@mes-thailand.com / Manager123!@#
- **운영자**: operator@mes-thailand.com / User123!@#

## 🚨 에러 처리

- 통합 에러 핸들링 미들웨어
- PostgreSQL 오류 자동 매핑
- 개발/프로덕션 환경별 에러 정보 제어
- 상세한 로깅 시스템

## 🔒 보안 기능

- Helmet.js로 HTTP 헤더 보안
- CORS 설정
- Rate Limiting
- 비밀번호 해싱 (bcrypt)
- SQL Injection 방지 (Parameterized Query)
- XSS 방지

## 📡 실시간 통신

Socket.IO를 통한 실시간 데이터 업데이트:

- 생산 라인 상태 모니터링
- 품질 검사 결과 실시간 알림
- 장비 상태 변경 알림

## 🧪 테스트

API 테스트를 위한 도구:

- Postman Collection (향후 제공)
- Jest 테스트 프레임워크 (향후 구현)

## 📈 성능 최적화

- 데이터베이스 인덱스 최적화
- 연결 풀링
- 압축 미들웨어
- 캐싱 전략 (향후 구현)

## 🚀 배포

### Docker 배포 (향후 구현)

```bash
docker build -t mes-thailand-backend .
docker run -p 3001:3001 mes-thailand-backend
```

### PM2 배포

```bash
npm install -g pm2
pm2 start server.js --name "mes-backend"
pm2 startup
pm2 save
```

## 📝 라이센스

MIT License

## 🤝 기여 가이드

1. Fork 프로젝트
2. Feature 브랜치 생성
3. 변경사항 커밋
4. Pull Request 생성

## 📞 지원

문제 발생 시 GitHub Issues에 등록해주세요. 