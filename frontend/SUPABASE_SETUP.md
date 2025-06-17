# Supabase Auth 설정 가이드

## 🚀 현재 연결 정보
- **URL**: `https://rrkumbyeyhxdsblqxrmn.supabase.co`
- **API Key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

## 📧 이메일 인증 설정

### 1. Supabase 대시보드 설정
1. [Supabase 대시보드](https://supabase.com/dashboard) 접속
2. 프로젝트 선택: `rrkumbyeyhxdsblqxrmn`
3. 좌측 메뉴에서 **Authentication** > **Settings** 클릭

### 2. Site URL 설정
**Settings** > **General**에서:
- **Site URL**: `http://localhost:3000`
- **Redirect URLs**: `http://localhost:3000/verify-email`

### 3. 이메일 템플릿 설정
**Settings** > **Auth** > **Email Templates**에서:

#### Confirm signup 템플릿:
```html
<h2>Confirm your signup</h2>
<p>MES Thailand 회원가입을 완료하기 위해 아래 링크를 클릭해주세요:</p>
<p><a href="{{ .ConfirmationURL }}">이메일 인증하기</a></p>
<p>링크가 작동하지 않으면 다음 URL을 복사하여 브라우저에 붙여넣으세요:</p>
<p>{{ .ConfirmationURL }}</p>
```

### 4. SMTP 설정 (선택사항)
기본적으로 Supabase의 이메일 서비스를 사용하지만, 사용자 정의 SMTP를 설정할 수 있습니다:

**Settings** > **Auth** > **SMTP Settings**:
- Gmail SMTP 사용 시:
  - Host: `smtp.gmail.com`
  - Port: `587`
  - Username: 이메일 주소
  - Password: 앱 비밀번호

## 🔧 현재 앱에서 테스트 방법

### 1. 브라우저 개발자 도구에서 테스트
```javascript
// 연결 테스트
await window.supabaseTest.testConnection()

// 테스트 회원가입
await window.supabaseTest.testSignUp()

// Auth 상태 모니터링
window.supabaseTest.monitorAuth()

// 현재 사용자 확인
await window.supabaseTest.checkEmail()
```

### 2. 수동 테스트
1. `/register` 페이지에서 회원가입
2. 이메일 받은편지함 확인
3. "Confirm your signup" 링크 클릭
4. `/verify-email` 페이지에서 인증 완료 확인
5. `/login` 페이지에서 로그인

## 📊 상태 확인
- 화면 우하단의 **Supabase Status** 위젯에서 실시간 상태 확인
- 브라우저 콘솔에서 상세 로그 확인

## ❗ 문제 해결

### 이메일이 오지 않는 경우:
1. **스팸 폴더** 확인
2. Supabase 대시보드에서 **Authentication** > **Users** 탭에서 사용자 등록 여부 확인
3. 이메일 템플릿 설정 확인
4. Site URL과 Redirect URL이 정확한지 확인

### 인증 링크 클릭 후 오류가 발생하는 경우:
1. URL이 올바른 도메인(`localhost:3000`)인지 확인
2. 브라우저 콘솔에서 오류 메시지 확인
3. Supabase 대시보드에서 Auth 로그 확인

### 로그인이 안 되는 경우:
1. 이메일 인증이 완료되었는지 확인
2. 비밀번호가 정확한지 확인
3. Supabase 대시보드에서 사용자 상태 확인

## 🎯 성공 확인 방법
1. 회원가입 후 이메일 수신 ✅
2. 이메일 링크 클릭 후 `/verify-email` 페이지 이동 ✅
3. "이메일 인증이 완료되었습니다!" 메시지 표시 ✅
4. Supabase 대시보드의 Users 탭에 사용자 등록 ✅
5. 로그인 성공 및 대시보드 접근 ✅

## 📞 추가 지원
문제가 지속되면 Supabase 대시보드의 **Authentication** > **Logs**에서 상세한 오류 정보를 확인할 수 있습니다. 