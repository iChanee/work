const express = require('express');
const mysql = require('mysql2/promise');
const app = express();
const PORT = process.env.PORT || 3000;

const dbName = process.env.DB_NAME || 'board';
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || ''
};

let pool;

app.use(express.json());
app.use(express.static(__dirname));

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

app.get('/api/posts', async (req, res) => {
  const [posts] = await pool.query('SELECT * FROM posts ORDER BY id DESC');
  for (const post of posts) {
    const [comments] = await pool.query(
      'SELECT author, text FROM comments WHERE post_id = ? ORDER BY id',
      [post.id]
    );
    post.comments = comments;
  }
  res.json(posts);
});

app.post('/api/posts', async (req, res) => {
  const { author, title, content } = req.body;
  if (!author || !title || !content) {
    return res.status(400).json({ error: '필수 항목 누락' });
  }
  const [result] = await pool.query(
    'INSERT INTO posts (author, title, content) VALUES (?, ?, ?)',
    [author, title, content]
  );
  const id = result.insertId;
  res.status(201).json({ id, author, title, content, comments: [] });
});

app.post('/api/posts/:id/comments', async (req, res) => {
  const { author, text } = req.body;
  if (!author || !text) {
    return res.status(400).json({ error: '필수 항목 누락' });
  }
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

init()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server listening on ${PORT}`);
    });
  })
  .catch(err => {
    console.error('Failed to initialize database:', err);
  });
