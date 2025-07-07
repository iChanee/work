const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'data', 'posts.json');

app.use(express.json());
app.use(express.static(__dirname));

function loadPosts() {
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  } catch (e) {
    return [];
  }
}

function savePosts(posts) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(posts, null, 2));
}

app.get('/api/posts', (req, res) => {
  res.json(loadPosts());
});

app.post('/api/posts', (req, res) => {
  const posts = loadPosts();
  const { author, title, content } = req.body;
  if (!author || !title || !content) {
    return res.status(400).json({ error: '필수 항목 누락' });
  }
  const newPost = { id: Date.now().toString(), author, title, content, comments: [] };
  posts.push(newPost);
  savePosts(posts);
  res.status(201).json(newPost);
});

app.post('/api/posts/:id/comments', (req, res) => {
  const posts = loadPosts();
  const post = posts.find(p => p.id === req.params.id);
  if (!post) return res.status(404).end();
  const { author, text } = req.body;
  if (!author || !text) {
    return res.status(400).json({ error: '필수 항목 누락' });
  }
  post.comments.push({ author, text });
  savePosts(posts);
  res.status(201).json(post);
});

app.listen(PORT, () => {
  console.log(`Server listening on ${PORT}`);
});
