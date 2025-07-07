document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('login-form');
  const registerForm = document.getElementById('register-form');

  loginForm.addEventListener('submit', e => {
    e.preventDefault();
    const username = document.getElementById('login-username').value.trim();
    const password = document.getElementById('login-password').value.trim();
    fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    })
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(() => { window.location.href = 'home.html'; })
      .catch(() => alert('로그인 실패'));
  });

  registerForm.addEventListener('submit', e => {
    e.preventDefault();
    const username = document.getElementById('register-username').value.trim();
    const password = document.getElementById('register-password').value.trim();
    fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    })
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(() => alert('가입 완료'))
      .catch(() => alert('가입 실패'));
  });
});
