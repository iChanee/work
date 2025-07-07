/* server.js */
require('dotenv').config();

const express = require('express');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// 환경변수/DB설정
const dbName = process.env.DB_NAME || 'board';
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || ''
};

let pool;

app.use(express.json());

// ---------- API 라우트 (정적 파일보다 위에) ----------

// 회원가입
app.post('/api/register', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password)
    return res.status(400).json({ error: '필수 항목 누락' });
  const hash = await bcrypt.hash(password, 10);
  const id = uuidv4();
  try {
    await pool.query(
      'INSERT INTO users (id, username, password, created_at) VALUES (?, ?, ?, NOW())',
      [id, username, hash]
    );
    res.status(201).json({ success: true });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      res.status(409).json({ error: '이미 존재하는 사용자' });
    } else {
      res.status(500).json({ error: 'DB 오류', detail: err.message });
    }
  }
});

// 로그인
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password)
    return res.status(400).json({ error: '필수 항목 누락' });
  const [rows] = await pool.query(
    'SELECT password FROM users WHERE username=?',
    [username]
  );
  if (rows.length === 0)
    return res.status(401).json({ error: '사용자 없음' });
  const match = await bcrypt.compare(password, rows[0].password);
  if (!match)
    return res.status(401).json({ error: '비밀번호 불일치' });
  res.json({ success: true });
});

// 게시글 목록
app.get('/api/posts', async (req, res) => {
  const [posts] = await pool.query(
    'SELECT * FROM posts ORDER BY id DESC'
  );
  for (const post of posts) {
    const [comments] = await pool.query(
      'SELECT author, text FROM comments WHERE post_id = ? ORDER BY id',
      [post.id]
    );
    post.comments = comments;
  }
  res.json(posts);
});

// 게시글 등록
app.post('/api/posts', async (req, res) => {
  const { author, title, content } = req.body;
  if (!author || !title || !content)
    return res.status(400).json({ error: '필수 항목 누락' });
  const [result] = await pool.query(
    'INSERT INTO posts (author, title, content) VALUES (?, ?, ?)',
    [author, title, content]
  );
  const id = result.insertId;
  res.status(201).json({ id, author, title, content, comments: [] });
});

// 댓글 등록
app.post('/api/posts/:id/comments', async (req, res) => {
  const { author, text } = req.body;
  if (!author || !text)
    return res.status(400).json({ error: '필수 항목 누락' });
  const postId = req.params.id;
  await pool.query(
    'INSERT INTO comments (post_id, author, text) VALUES (?, ?, ?)',
    [postId, author, text]
  );
  const [comments] = await pool.query(
    'SELECT author, text FROM comments WHERE post_id = ? ORDER BY id',
    [postId]
  );
  res.status(201).json({ postId, comments });
});

app.get('/register.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'register.html'));
});
// ---------- 정적 파일 서비스는 반드시 마지막 ----------
console.log('정적 파일 경로:', __dirname);
app.use(express.static(__dirname));
// ---------- DB/테이블 자동 생성 ----------
async function ensureDatabase() {
  const conn = await mysql.createConnection(dbConfig);
  await conn.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``);
  await conn.end();
  pool = mysql.createPool({
    ...dbConfig,
    database: dbName,
    waitForConnections: true,
    connectionLimit: 10
  });
}

async function init() {
  await ensureDatabase();
  await pool.query(`CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(64) PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`);
  await pool.query(`CREATE TABLE IF NOT EXISTS posts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    author VARCHAR(255) NOT NULL,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL
  )`);
  await pool.query(`CREATE TABLE IF NOT EXISTS comments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    post_id INT NOT NULL,
    author VARCHAR(255) NOT NULL,
    text TEXT NOT NULL,
    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
  )`);
}

init()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server listening on ${PORT}`);
    });
  })
  .catch(err => {
    console.error('Failed to initialize database:', err);
  });
