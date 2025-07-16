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

// 글 목록 렌더링
function renderPosts(posts) {
    const tbody = document.getElementById("boardBody");
    tbody.innerHTML = "";
    if (!posts.length) {
        const tr = document.createElement("tr");
        tr.innerHTML = `<td colspan="6" style="color:#aaa; text-align:center;">등록된 게시글이 없습니다.</td>`;
        tbody.appendChild(tr);
        return;
    }
    posts.forEach(post => {
        let tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${post.post_id}</td>
            <td class="title" style="cursor:pointer; color:#1d8ce0;">${escapeHTML(post.title)}${post.comments > 0 ? `<span class="reply-count">[${post.comments}]</span>` : ""}</td>
            <td>${escapeHTML(post.author)}</td>
            <td>${formatDate(post.created_at)}</td>
            <td>${post.views}</td>
            <td>${post.comments}</td>
        `;
        // 제목 클릭 시 상세 모달 열기
        tr.querySelector(".title").addEventListener("click", () => openDetailModal(post.post_id));
        tbody.appendChild(tr);
    });
}

// 상세 모달 열기
async function openDetailModal(post_id) {
    console.log("상세 모달 open 시도:", post_id);
    const data = await fetchPostDetail(post_id);
    if (!data) return;
    document.getElementById("detailTitle").textContent = escapeHTML(data.title);
    document.getElementById("detailAuthor").textContent = escapeHTML(data.author);
    document.getElementById("detailDate").textContent = formatDate(data.created_at);
    document.getElementById("detailContent").innerHTML = escapeHTML(data.content).replace(/\n/g, "<br>");
    document.getElementById("detailModal").classList.add("active");
}

// 상세 모달 닫기
document.addEventListener("DOMContentLoaded", async () => {
    await fetchCurrentUser();
    let posts = await fetchPosts();
    renderPosts(posts);

    const writeModal = document.getElementById("writeModal");
    document.getElementById("openWrite").addEventListener("click", async () => {
        if (window.currentUser === null) {
            await fetchCurrentUser();
        }
        if (!window.currentUser) {
            if (confirm("로그인한 사용자만 글쓰기가 가능합니다.\n로그인 페이지로 이동하시겠습니까?")) {
                location.href = "/login.html";
            }
            return;
        }
        writeModal.classList.add("active");
    });
    document.getElementById("closeWrite").addEventListener("click", () => {
        writeModal.classList.remove("active");
    });

    // 상세 모달 닫기
    document.getElementById("closeDetail").addEventListener("click", () => {
        document.getElementById("detailModal").classList.remove("active");
    });

    // 글 등록
    document.getElementById("writeForm").addEventListener("submit", async function (e) {
        e.preventDefault();
        if (!window.currentUser) {
            alert("로그인 후 글쓰기가 가능합니다.");
            return;
        }
        let title = document.getElementById("writeTitle").value.trim();
        let content = document.getElementById("writeContent").value.trim();
        if (!title || !content) return;

        try {
            const res = await fetch('/api/posts', {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ title, content }),
                credentials: "include"
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "글 등록 실패");
            alert("글이 등록되었습니다.");
            writeModal.classList.remove("active");
            this.reset();
            posts = await fetchPosts();
            renderPosts(posts);
        } catch (err) {
            alert("글 등록에 실패했습니다. (" + err.message + ")");
        }
    });
});

// HTML 이스케이프
function escapeHTML(str) {
    if (!str) return "";
    return str.replace(/[<>&'"]/g, c => ({
        "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&#39;", '"': "&quot;"
    }[c]));
}

// 날짜 포맷
function formatDate(dateString) {
    if (!dateString) return "";
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return `${d.getFullYear()}.${(d.getMonth()+1).toString().padStart(2, "0")}.${d.getDate().toString().padStart(2, "0")}.`;
}
