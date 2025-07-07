require('dotenv').config();

const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const path = require('path');
const session = require('express-session');

const app = express();
app.use(cors());
app.use(express.json());

// 세션 사용
app.use(session({
  secret: 'your_secret_key',
  resave: false,
  saveUninitialized: true
}));


// 루트에서 무조건 로그인 페이지로
app.get('/', (req, res) => {
  res.redirect('/login.html');
});

// 정적 파일 서빙
app.use(express.static(path.join(__dirname, 'public'), { extensions: ['html'] }));

const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME
});


const { v4: uuidv4 } = require('uuid');

app.post('/register', (req, res) => {
  const { username, password } = req.body;
  const id = uuidv4();  // 랜덤 고유값 생성
  db.query(
    'INSERT INTO users (id, username, password) VALUES (?, ?, ?)',
    [id, username, password],
    (err2, result2) => {
      if (err2) return res.status(500).json({ error: 'DB 저장 오류: ' + err2.message });
      res.json({ message: '회원가입 성공' });
    }
  );
});



// 로그인 API
app.post('/login', (req, res) => {
  const { username, password } = req.body;
  db.query(
    'SELECT * FROM users WHERE username = ? AND password = ?',
    [username, password],
    (err, results) => {
      if (err) return res.status(500).json({ error: 'DB 오류' });
      if (results.length === 0) return res.status(401).json({ error: '아이디 또는 비밀번호가 틀렸습니다' });
      req.session.loggedIn = true;
      req.session.username = username;
      res.json({ message: '로그인 성공!' });
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

// 로그아웃 API (세션 삭제)
app.post('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      return res.status(500).json({ error: '로그아웃 실패' });
    }
    res.json({ message: '로그아웃 성공' });
  });
});


const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
