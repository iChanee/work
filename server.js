require('dotenv').config();

const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const path = require('path');
const session = require('express-session');
const { v4: uuidv4 } = require('uuid');

const app = express();

// CORS: 반드시 origin/credentials 옵션 추가
app.use(cors({
  origin: "http://localhost:3000", // 실제 프론트 주소에 맞게 변경
  credentials: true
}));

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public'), { extensions: ['html'] }));

// 세션
app.use(session({
  secret: 'your_secret_key',
  resave: false,
  saveUninitialized: true,
  cookie: {
    httpOnly: true,
    secure: false // HTTPS 환경에서는 true로!
  }
}));

// MySQL 연결
const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME // .env에 반드시 community_db로!
});

// DB 연결 체크
db.connect(err => {
  if (err) {
    console.error('MySQL 연결 실패:', err);
  } else {
    console.log('MySQL 연결 성공');
  }
});

// 루트에서 무조건 로그인 페이지로
app.get('/', (req, res) => {
  res.redirect('/login.html');
});

// 로그인 상태 확인 API (프론트에서 /api/me fetch)
app.get('/api/me', (req, res) => {
  if (req.session.loggedIn && req.session.ID) {
    res.json({ loggedIn: true, ID: req.session.ID });
  } else {
    res.json({ loggedIn: false });
  }
});

// 회원가입
app.post('/register', (req, res) => {
  const { ID, password } = req.body;
  const userID = uuidv4();  // 랜덤 고유값
  db.query(
    'INSERT INTO users (userID, ID, password) VALUES (?, ?, ?)',
    [userID, ID, password],
    (err, result) => {
      if (err) return res.status(500).json({ error: 'DB 저장 오류: ' + err.message });
      res.json({ message: '회원가입 성공' });
    }
  );
});

// 로그인
app.post('/login', (req, res) => {
  const { ID, password } = req.body;
  db.query(
    'SELECT * FROM users WHERE ID = ? AND password = ?',
    [ID, password],
    (err, results) => {
      if (err) return res.status(500).json({ error: 'DB 오류' });
      if (results.length === 0) return res.status(401).json({ error: '아이디 또는 비밀번호가 틀렸습니다' });
      req.session.loggedIn = true;
      req.session.ID = ID;
      res.json({ message: '로그인 성공!' });
    }
  );
});

// 로그아웃
app.post('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      return res.status(500).json({ error: '로그아웃 실패' });
    }
    res.json({ message: '로그아웃 성공' });
  });
});

// 글 목록
app.get('/api/posts', (req, res) => {
  db.query("SELECT * FROM board ORDER BY post_id DESC", (err, rows) => {
    if (err) return res.status(500).json({ error: 'DB 오류: ' + err.message });
    res.json(rows);
  });
});

// 글 등록 (로그인 필요)
app.post('/api/posts', (req, res) => {
  if (!req.session.loggedIn) {
    return res.status(401).json({ error: '로그인 필요' });
  }
  const { title, content } = req.body;
  const author = req.session.ID;
  db.query(
    "INSERT INTO board (title, content, author) VALUES (?, ?, ?)",
    [title, content, author],
    (err, result) => {
      if (err) return res.status(500).json({ error: 'DB 오류: ' + err.message });
      res.json({ message: '글 등록 성공', post_id: result.insertId });
    }
  );
});

// 메인페이지(인증 필요)
app.get('/main', (req, res) => {
  if (req.session.loggedIn) {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
  } else {
    res.redirect('/login.html');
  }
});

// 게시글 상세정보 라우터 추가
app.get('/api/posts/:id', (req, res) => {
  const postId = req.params.id;
  db.query(
    "SELECT * FROM board WHERE post_id = ?",
    [postId],
    (err, rows) => {
      if (err) return res.status(500).json({ error: 'DB 오류: ' + err.message });
      if (rows.length === 0) return res.status(404).json({ error: '글을 찾을 수 없습니다.' });
      res.json(rows[0]);
    }
  );
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

