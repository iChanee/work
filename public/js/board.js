window.currentUser = null;

// 로그인 상태 fetch
async function fetchCurrentUser() {
    try {
        const res = await fetch('/api/me', { credentials: "include" });
        const data = await res.json();
        if (data.loggedIn) {
            window.currentUser = { ID: data.ID };
        } else {
            window.currentUser = null;
        }
    } catch (e) {
        window.currentUser = null;
    }
}

// 글 목록 fetch
async function fetchPosts() {
    try {
        const res = await fetch('/api/posts', { credentials: "include" });
        if (!res.ok) {
            console.error('글 목록 API 에러:', res.status, res.statusText);
            return [];
        }
        const data = await res.json();
        return Array.isArray(data) ? data : [];
    } catch (e) {
        console.error('글 목록 fetch 에러:', e);
        return [];
    }
}

// 글 상세 fetch
async function fetchPostDetail(post_id) {
    try {
        const res = await fetch(`/api/posts/${post_id}`, { credentials: "include" });
        if (!res.ok) throw new Error('글을 불러올 수 없습니다.');
        return await res.json();
    } catch (e) {
        alert(e.message || '글을 불러올 수 없습니다.');
        return null;
    }
}

// 카드형 게시글 목록 렌더링
function renderPosts(posts) {
    const listDiv = document.querySelector(".post-list");
    listDiv.innerHTML = "";
    if (!posts.length) {
        listDiv.innerHTML = `<div style="text-align:center; color:#aaa; margin-top:60px;">등록된 게시글이 없습니다.</div>`;
        return;
    }
    posts.forEach(post => {
        const card = document.createElement("div");
        card.className = "post-card";
        card.innerHTML = `
            <div class="post-title">${escapeHTML(post.title)}</div>
            <div class="post-content">${escapeHTML(post.content).replace(/\n/g," ").substring(0, 64)}${post.content.length > 64 ? '...' : ''}</div>
            <div class="post-meta">
                <span class="comment-count">💬 ${post.comment_count || 0}</span>
                <span class="post-time">${formatTime(post.created_at)}</span>
                <span class="post-author">${post.isAnonymous ? "익명" : escapeHTML(post.author)}</span>
            </div>
        `;
        // 카드 클릭시 상세 페이지 이동(혹은 상세 모달로)
        card.onclick = () => window.location.href = `board-detail.html?id=${post.post_id}`;
        listDiv.appendChild(card);
    });
}

// 시간 포맷 (17:25)
function formatTime(dt) {
    if (!dt) return '';
    const d = new Date(dt);
    const h = d.getHours().toString().padStart(2, "0");
    const m = d.getMinutes().toString().padStart(2, "0");
    return `${h}:${m}`;
}

// HTML 이스케이프
function escapeHTML(str) {
    if (!str) return "";
    return str.replace(/[<>&'"]/g, c => ({
        "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&#39;", '"': "&quot;"
    }[c]));
}

// 페이지 로드시
document.addEventListener("DOMContentLoaded", async () => {
    await fetchCurrentUser();
    let posts = await fetchPosts();
    renderPosts(posts);

    // 글쓰기 버튼
    const writeBtn = document.querySelector(".write-btn");
    if (writeBtn) {
        writeBtn.addEventListener("click", async (e) => {
            e.preventDefault();
            if (!window.currentUser) {
                await fetchCurrentUser();
            }
            if (!window.currentUser) {
                if (confirm("로그인한 사용자만 글쓰기가 가능합니다.\n로그인 페이지로 이동하시겠습니까?")) {
                    location.href = "/login.html";
                }
                return;
            }
            // write-post.html로 이동
            window.location.href = "write-post.html";
        });
    }
});
