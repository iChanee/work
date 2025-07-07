document.addEventListener('DOMContentLoaded', function() {
  const postForm = document.getElementById('new-post-form');
  const postList = document.getElementById('post-list');
  if (!postForm || !postList) return;

  let posts = JSON.parse(localStorage.getItem('communityPosts') || '[]');

  function save() {
    localStorage.setItem('communityPosts', JSON.stringify(posts));
  }

  function render() {
    postList.innerHTML = '';
    posts.forEach((post, index) => {
      const li = document.createElement('li');
      li.className = 'post-item';

      const meta = document.createElement('div');
      meta.className = 'post-meta';
      meta.textContent = `${post.title} - ${post.author}`;
      li.appendChild(meta);

      const content = document.createElement('p');
      content.className = 'post-content';
      content.textContent = post.content;
      li.appendChild(content);

      const commentsUl = document.createElement('ul');
      commentsUl.className = 'comment-list';
      (post.comments || []).forEach(c => {
        const cLi = document.createElement('li');
        cLi.textContent = `${c.author}: ${c.text}`;
        commentsUl.appendChild(cLi);
      });
      li.appendChild(commentsUl);

      const cForm = document.createElement('form');
      cForm.className = 'comment-form';
      cForm.innerHTML = `
        <input type="text" name="author" placeholder="이름" required>
        <input type="text" name="text" placeholder="댓글" required>
        <button type="submit" class="btn">댓글 작성</button>
      `;
      cForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const author = this.author.value.trim();
        const text = this.text.value.trim();
        if (!author || !text) return;
        posts[index].comments = posts[index].comments || [];
        posts[index].comments.push({author, text});
        save();
        render();
      });
      li.appendChild(cForm);

      postList.appendChild(li);
    });
  }

  postForm.addEventListener('submit', function(e) {
    e.preventDefault();
    const author = document.getElementById('post-author').value.trim();
    const title = document.getElementById('post-title').value.trim();
    const content = document.getElementById('post-content').value.trim();
    if (!author || !title || !content) return;
    posts.push({author, title, content, comments: []});
    save();
    postForm.reset();
    render();
  });

  render();
});
