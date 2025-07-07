require('dotenv').config(); // .env 사용!

const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

// 정적 파일 서빙
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
  res.redirect('/login.html');
});

app.get('/login', (req, res) => {
  res.redirect('/login.html');
});

const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME
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
      res.json({ message: '로그인 성공!' });
    }
  );
});

// 서버 실행
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});