# work-experience
일경험 프로젝트 (씨티아이코리아)

## 로컬 서버 실행 방법

커뮤니티 게시판은 Express 서버와 MySQL 데이터베이스를 통해 게시글과 댓글을 관리합니다.

```bash
# 의존성 설치 (mysql2 패키지 포함)
npm install

# 환경 변수로 MySQL 접속 정보를 설정합니다.
# (DB_HOST, DB_USER, DB_PASS, DB_NAME)
npm run server    # http://localhost:3000 에서 실행
```

서버는 지정된 데이터베이스가 없으면 처음 실행 시 자동으로 생성합니다. 해당 사용자에게
데이터베이스 생성 권한이 있어야 합니다.

서버가 실행된 상태에서 `npm start` 로 정적 페이지를 열면 커뮤니티 기능을 이용할 수 있습니다.

## 로그인 페이지

처음 접속하면 로그인 화면(`index.html`)이 표시됩니다. 여기서 회원가입 후 로그인하면
`home.html`을 비롯한 다른 페이지들을 이용할 수 있습니다.
