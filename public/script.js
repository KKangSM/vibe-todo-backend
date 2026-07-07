// ── 백엔드 REST API (localhost:5000) ──
// 백엔드가 이 화면을 함께 서빙하므로 같은 출처 → 상대경로로 호출.
// (프론트를 다른 포트로 따로 띄우려면 API_ORIGIN 을 "http://localhost:5000" 로 바꾸면 됨)
const API_ORIGIN = "";
async function api(path, options) {
  const res = await fetch(API_ORIGIN + path, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  let data = null;
  try {
    data = await res.json();
  } catch (_) {
    /* 본문 없음(예: 일부 성공 응답) */
  }
  if (!res.ok) {
    throw new Error((data && data.message) || `요청 실패 (${res.status})`);
  }
  return data;
}

// ── 첫 화면(인트로): 화면을 누르거나 키를 누르면 사라지고 본 배경으로 넘어감 ──
(function () {
  "use strict";
  const splash = document.getElementById("splash");
  if (!splash) return;

  let dismissed = false;
  function dismiss() {
    if (dismissed) return;
    dismissed = true;
    splash.classList.add("is-hidden"); // 인트로 → 밤하늘 + 달
    startBgm(); // 두 번째 화면부터 배경 음악
  }

  splash.addEventListener("click", dismiss);
  splash.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " " || e.key === "Escape") {
      e.preventDefault();
      dismiss();
    }
  });
})();

// ── 배경 음악 : 두 번째 화면부터 YouTube 임베드 재생 + 음소거 토글 ──
const bgmToggle = document.getElementById("bgmToggle");
const YT_VIDEO_ID = "mwwloplVx84"; // 러브시티 - 블라인드 바이 러브
let ytPlayer = null;
let ytReady = false;
let pendingPlay = false; // 플레이어 준비 전에 두 번째 화면으로 넘어간 경우
let playing = false;

// YouTube IFrame API 로드
(function loadYT() {
  const tag = document.createElement("script");
  tag.src = "https://www.youtube.com/iframe_api";
  document.head.appendChild(tag);
})();

// API 준비되면 호출됨(전역 콜백)
window.onYouTubeIframeAPIReady = function () {
  ytPlayer = new YT.Player("ytbgm", {
    videoId: YT_VIDEO_ID,
    playerVars: {
      autoplay: 0,
      controls: 0,
      loop: 1,
      playlist: YT_VIDEO_ID, // loop 동작에 필요
      playsinline: 1,
    },
    events: {
      onReady: () => {
        ytReady = true;
        ytPlayer.setVolume(45);
        if (pendingPlay) play();
      },
      onStateChange: (e) => {
        if (e.data === YT.PlayerState.PLAYING) {
          playing = true;
          bgmToggle?.classList.remove("is-muted");
          bgmToggle?.setAttribute("aria-pressed", "true");
        } else if (
          e.data === YT.PlayerState.PAUSED ||
          e.data === YT.PlayerState.ENDED
        ) {
          playing = false;
          bgmToggle?.classList.add("is-muted");
          bgmToggle?.setAttribute("aria-pressed", "false");
        }
      },
      onError: (e) => {
        // 임베드 불가(101/150) 등 → 음소거 표시
        playing = false;
        bgmToggle?.classList.add("is-muted");
        document.getElementById("ytbgm")?.setAttribute("data-yt-error", String(e.data));
        console.warn("YouTube 재생 오류 코드:", e.data);
      },
    },
  });
};

function play() {
  if (!ytReady) {
    pendingPlay = true;
    return;
  }
  ytPlayer.playVideo();
  playing = true;
  bgmToggle?.classList.remove("is-muted");
  bgmToggle?.setAttribute("aria-pressed", "true");
}

function pause() {
  if (ytReady) ytPlayer.pauseVideo();
  playing = false;
  bgmToggle?.classList.add("is-muted");
  bgmToggle?.setAttribute("aria-pressed", "false");
}

function startBgm() {
  bgmToggle?.classList.add("is-visible"); // 토글 버튼 노출
  play(); // 두 번째 화면 진입(클릭 제스처)에서 재생 시작
}

bgmToggle?.addEventListener("click", () => {
  if (playing) pause();
  else play();
});

// ── 달을 누르면 메모 창 열기 / X·ESC로 닫으면 달 다시 보이기 ──
(function () {
  "use strict";
  const moon = document.getElementById("moon");
  const board = document.getElementById("board");
  const closeBtn = document.getElementById("memoClose");
  if (!moon || !board) return;

  function open() {
    board.classList.remove("board--hidden"); // 메모 창 페이드 인
    moon.classList.add("is-gone"); // 달은 스르륵 사라짐
  }
  function close() {
    board.classList.add("board--hidden"); // 메모 창 닫힘
    moon.classList.remove("is-gone"); // 달 다시 등장
  }

  moon.addEventListener("click", open);
  closeBtn?.addEventListener("click", close);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !board.classList.contains("board--hidden")) close();
  });
})();

// ── 오늘 날짜 표시 ──
(function () {
  const dateEl = document.getElementById("boardDate");
  if (dateEl) {
    dateEl.textContent = new Date().toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "long",
      day: "numeric",
      weekday: "long",
    });
  }
})();

// 공통 엘리먼트 헬퍼
function el(tag, cls, text) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text != null) e.textContent = text;
  return e;
}

// ── 할 일 : 백엔드 /todos ──
(function () {
  "use strict";
  const container = document.getElementById("sections");
  if (!container) return;

  const BASE = "/todos";
  let todos = []; // [{ _id, title, completed, createdAt, ... }]
  let editingId = null;

  // ── 섹션 껍데기(아코디언) ──
  const wrap = el("div", "section");
  const head = el("button", "section__head");
  head.type = "button";
  const sign = el("span", "section__sign", "+");
  const count = el("span", "section__count");
  head.append(sign, el("span", "section__label", "할 일"), count);
  const body = el("div", "section__body");
  wrap.append(head, body);
  container.appendChild(wrap);

  head.addEventListener("click", () => {
    const open = wrap.classList.toggle("section--open");
    sign.textContent = open ? "−" : "+";
    if (open) input.focus();
  });

  // ── 새 할 일 추가 폼 ──
  const form = el("form", "sched-add");
  form.autocomplete = "off";
  const input = el("input", "sched-input");
  input.type = "text";
  input.maxLength = 200;
  input.placeholder = "할 일을 적어보세요";
  const addBtn = el("button", "btn-mini", "추가");
  addBtn.type = "submit";
  form.append(input, addBtn);

  const notice = el("p", "todo-notice");
  notice.hidden = true;
  const ul = el("ul", "todo-list");
  body.append(form, notice, ul);

  const showError = (msg) => {
    notice.textContent = msg;
    notice.hidden = false;
  };
  const clearError = () => (notice.hidden = true);

  // ── 생성 ──
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const title = input.value.trim();
    if (!title) return input.focus();
    input.value = "";
    try {
      const created = await api(BASE, {
        method: "POST",
        body: JSON.stringify({ title }),
      });
      todos.unshift(created);
      clearError();
      render();
    } catch (err) {
      console.error("할 일 추가 실패:", err);
      input.value = title;
      showError(err.message);
    }
  });

  // ── 완료 토글 ──
  async function toggle(m) {
    try {
      const updated = await api(BASE + "/" + m._id, {
        method: "PUT",
        body: JSON.stringify({ completed: !m.completed }),
      });
      Object.assign(m, updated);
      clearError();
      render();
    } catch (err) {
      console.error("할 일 수정 실패:", err);
      showError(err.message);
    }
  }

  // ── 제목 수정 저장 ──
  async function saveEdit(m, title) {
    if (!title) return;
    try {
      const updated = await api(BASE + "/" + m._id, {
        method: "PUT",
        body: JSON.stringify({ title }),
      });
      Object.assign(m, updated);
      editingId = null;
      clearError();
      render();
    } catch (err) {
      console.error("할 일 수정 실패:", err);
      showError(err.message);
    }
  }

  // ── 삭제 ──
  async function del(m) {
    try {
      await api(BASE + "/" + m._id, { method: "DELETE" });
      todos = todos.filter((x) => x._id !== m._id);
      clearError();
      render();
    } catch (err) {
      console.error("할 일 삭제 실패:", err);
      showError(err.message);
    }
  }

  // ── 목록 렌더 ──
  function render() {
    ul.innerHTML = "";
    todos.forEach((m) => {
      const li = el("li", "todo-item" + (m.completed ? " is-done" : ""));
      li.dataset.id = m._id;

      if (editingId === m._id) {
        const ef = el("form", "todo-edit");
        const et = el("input", "sched-input");
        et.type = "text";
        et.maxLength = 200;
        et.value = m.title || "";
        const sv = el("button", "btn-mini", "저장");
        sv.type = "submit";
        const cc = el("button", "btn-mini", "취소");
        cc.type = "button";
        ef.append(et, sv, cc);
        ef.addEventListener("submit", (e) => {
          e.preventDefault();
          saveEdit(m, et.value.trim());
        });
        cc.addEventListener("click", () => {
          editingId = null;
          render();
        });
        li.appendChild(ef);
        ul.appendChild(li);
        setTimeout(() => et.focus(), 0);
        return;
      }

      const chk = el("input", "todo-check");
      chk.type = "checkbox";
      chk.checked = !!m.completed;
      chk.setAttribute("aria-label", "완료 표시");
      chk.addEventListener("change", () => toggle(m));

      const text = el("span", "todo-item__text", m.title || "(제목 없음)");

      const editBtn = el("button", "btn-mini", "수정");
      editBtn.type = "button";
      editBtn.addEventListener("click", () => {
        editingId = m._id;
        render();
      });
      const delBtn = el("button", "btn-mini", "삭제");
      delBtn.type = "button";
      delBtn.addEventListener("click", () => del(m));

      li.append(chk, text, editBtn, delBtn);
      ul.appendChild(li);
    });
    count.textContent = todos.length ? String(todos.length) : "";
  }

  // ── 초기 로드 ──
  (async function load() {
    try {
      const list = await api(BASE, { method: "GET" });
      todos = Array.isArray(list) ? list : [];
      clearError();
      render();
    } catch (err) {
      console.error("할 일 불러오기 실패:", err);
      showError(
        "할 일을 불러오지 못했어요. 백엔드(localhost:5000)가 실행 중인지 확인해주세요."
      );
    }
  })();
})();

// ── 한줄일정 : 달력에서 날짜 선택 → 한 줄 일정 저장 (백엔드 /schedule) ──
(function () {
  "use strict";
  const container = document.getElementById("sections");
  if (!container) return;

  const BASE = "/schedule";
  const pad = (n) => String(n).padStart(2, "0");
  const ymd = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const slash = (s) => (s ? s.replace(/-/g, "/") : "");

  const today = new Date();
  const todayStr = ymd(today);
  let latest = []; // {_id, text, date:"YYYY-MM-DD", createdAt}
  let viewY = today.getFullYear();
  let viewM = today.getMonth(); // 0-11
  let selected = todayStr;

  // ── 섹션 껍데기(아코디언) ──
  const wrap = el("div", "section");
  const head = el("button", "section__head");
  head.type = "button";
  const sign = el("span", "section__sign", "+");
  const count = el("span", "section__count");
  head.append(sign, el("span", "section__label", "한줄일정"), count);
  const body = el("div", "section__body");
  wrap.append(head, body);
  container.appendChild(wrap);

  head.addEventListener("click", () => {
    const open = wrap.classList.toggle("section--open");
    sign.textContent = open ? "−" : "+";
    if (open) input.focus();
  });

  // ── 작은 달력 ──
  const cal = el("div", "cal");
  function renderCal() {
    cal.innerHTML = "";
    const hd = el("div", "cal__head");
    const prev = el("button", "cal__nav", "‹");
    prev.type = "button";
    const next = el("button", "cal__nav", "›");
    next.type = "button";
    prev.onclick = () => {
      if (--viewM < 0) { viewM = 11; viewY--; }
      renderCal();
    };
    next.onclick = () => {
      if (++viewM > 11) { viewM = 0; viewY++; }
      renderCal();
    };
    hd.append(prev, el("span", "cal__title", `${viewY}년 ${viewM + 1}월`), next);
    cal.append(hd);

    const wd = el("div", "cal__grid cal__weekdays");
    ["일", "월", "화", "수", "목", "금", "토"].forEach((w) => wd.append(el("span", "cal__wd", w)));
    cal.append(wd);

    const grid = el("div", "cal__grid");
    const first = new Date(viewY, viewM, 1).getDay();
    const days = new Date(viewY, viewM + 1, 0).getDate();
    const withItems = new Set(latest.map((x) => x.date));
    for (let i = 0; i < first; i++) grid.append(el("span", "cal__day cal__day--empty"));
    for (let d = 1; d <= days; d++) {
      const ds = `${viewY}-${pad(viewM + 1)}-${pad(d)}`;
      const btn = el("button", "cal__day", String(d));
      btn.type = "button";
      if (ds === selected) btn.classList.add("is-selected");
      if (ds === todayStr) btn.classList.add("is-today");
      if (withItems.has(ds)) btn.classList.add("has-item");
      btn.onclick = () => {
        selected = ds;
        renderCal();
        input.focus();
      };
      grid.append(btn);
    }
    cal.append(grid);
    cal.append(el("div", "cal__sel", "선택: " + slash(selected)));
  }

  // ── 한 줄 일정 입력 ──
  const form = el("form", "sched-add");
  form.autocomplete = "off";
  const input = el("input", "sched-input");
  input.type = "text";
  input.maxLength = 120;
  input.placeholder = "한 줄 일정";
  const save = el("button", "btn-mini", "저장");
  save.type = "submit";
  form.append(input, save);

  const notice = el("p", "todo-notice");
  notice.hidden = true;
  const showError = (msg) => {
    notice.textContent = msg;
    notice.hidden = false;
  };
  const clearError = () => (notice.hidden = true);

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const text = input.value.trim();
    if (!text || !selected) return input.focus();
    input.value = "";
    try {
      const created = await api(BASE, {
        method: "POST",
        body: JSON.stringify({ text, date: selected }),
      });
      latest.push(created);
      clearError();
      count.textContent = latest.length ? String(latest.length) : "";
      renderCal();
      renderList();
    } catch (err) {
      console.error("일정 저장 실패:", err);
      input.value = text;
      showError(err.message);
    }
  });

  // ── 저장된 일정 목록 (내용 YYYY/MM/DD) ──
  const ul = el("ul", "sched-list");
  ul.addEventListener("click", async (e) => {
    const li = e.target.closest("li[data-id]");
    if (!li || !e.target.closest(".sched-del")) return;
    const id = li.dataset.id;
    try {
      await api(BASE + "/" + id, { method: "DELETE" });
      latest = latest.filter((x) => x._id !== id);
      clearError();
      count.textContent = latest.length ? String(latest.length) : "";
      renderCal();
      renderList();
    } catch (err) {
      console.error("일정 삭제 실패:", err);
      showError(err.message);
    }
  });
  function renderList() {
    ul.innerHTML = "";
    [...latest]
      .sort((a, b) => (a.date || "").localeCompare(b.date || "") || String(a.createdAt || "").localeCompare(String(b.createdAt || "")))
      .forEach(({ _id, text, date }) => {
        const li = el("li", "sched-item");
        li.dataset.id = _id;
        li.append(el("span", "sched-item__text", text));
        li.append(el("span", "sched-item__date", slash(date)));
        const del = el("button", "sched-del", "×");
        del.type = "button";
        del.setAttribute("aria-label", "삭제");
        li.append(del);
        ul.appendChild(li);
      });
  }

  body.append(cal, form, notice, ul);
  renderCal();

  // ── 초기 로드 ──
  (async function load() {
    try {
      const list = await api(BASE, { method: "GET" });
      latest = Array.isArray(list) ? list : [];
      count.textContent = latest.length ? String(latest.length) : "";
      clearError();
      renderCal();
      renderList();
    } catch (err) {
      console.error("일정 불러오기 실패:", err);
      showError("일정을 불러오지 못했어요. 백엔드가 실행 중인지 확인해주세요.");
    }
  })();
})();

// ── 메모형 섹션(메모장·일기장) : 제목+내용(+추가 필드), 제목만 표시 → 클릭 시 상세 ──
(function () {
  "use strict";
  const container = document.getElementById("sections");
  if (!container) return;

  // 메모형 카테고리 구성. key = 백엔드 경로(/diary, /memos).
  // main:true = 본문(내용, 여러 줄) · 그 외는 라벨 붙는 한 줄 필드.
  const MEMO_SECTIONS = [
    {
      key: "diary",
      label: "일기장",
      fields: [
        { key: "mood", label: "오늘의 기분" },
        { key: "thanks", label: "감사한 일" },
        { key: "content", label: "내용", main: true },
      ],
    },
    {
      key: "memos",
      label: "메모장",
      fields: [{ key: "content", label: "내용", main: true }],
    },
  ];

  function fmt(ts) {
    if (!ts) return "";
    const d = new Date(ts);
    const p = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}.${p(d.getMonth() + 1)}.${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
  }
  function fieldInput(f, value) {
    const i = el(f.main ? "textarea" : "input", "memo-field" + (f.main ? " memo-field--multi" : ""));
    if (!f.main) i.type = "text";
    i.maxLength = f.main ? 2000 : 200;
    i.placeholder = f.main ? "내용을 적어보세요" : f.label;
    i.dataset.key = f.key;
    if (value != null) i.value = value;
    return i;
  }

  MEMO_SECTIONS.forEach(buildMemoSection);

  function buildMemoSection(cfg) {
    const BASE = "/" + cfg.key;
    const expanded = new Set();
    let editingId = null;
    let latest = [];

    // ── 섹션 껍데기 ──
    const wrap = el("div", "section");
    const head = el("button", "section__head");
    head.type = "button";
    const sign = el("span", "section__sign", "+");
    const count = el("span", "section__count");
    head.append(sign, el("span", "section__label", cfg.label), count);

    const body = el("div", "section__body");

    // 새 글 작성 폼
    const form = el("form", "memo-new");
    form.autocomplete = "off";
    const newTitle = el("input", "memo-new__title");
    newTitle.type = "text";
    newTitle.maxLength = 80;
    newTitle.placeholder = "제목";
    const newFields = cfg.fields.map((f) => fieldInput(f));
    const saveBtn = el("button", "btn-mini memo-new__save", "저장");
    saveBtn.type = "submit";
    form.append(newTitle, ...newFields, saveBtn);

    const notice = el("p", "todo-notice");
    notice.hidden = true;
    const showError = (msg) => {
      notice.textContent = msg;
      notice.hidden = false;
    };
    const clearError = () => (notice.hidden = true);

    const ul = el("ul", "memo-list");
    body.append(form, notice, ul);
    wrap.append(head, body);
    container.appendChild(wrap);

    // ── 펼치기/접기 ──
    head.addEventListener("click", () => {
      const open = wrap.classList.toggle("section--open");
      sign.textContent = open ? "−" : "+";
      if (open) newTitle.focus();
    });

    // ── 새 글 저장 ──
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const title = newTitle.value.trim();
      if (!title) return newTitle.focus();
      const data = { title };
      cfg.fields.forEach((f, i) => (data[f.key] = newFields[i].value.trim()));
      try {
        const created = await api(BASE, {
          method: "POST",
          body: JSON.stringify(data),
        });
        latest.unshift(created);
        newTitle.value = "";
        newFields.forEach((i) => (i.value = ""));
        clearError();
        render();
      } catch (err) {
        console.error(cfg.label + " 저장 실패:", err);
        showError(err.message);
      }
    });

    // ── 목록 렌더 ──
    function render() {
      ul.innerHTML = "";
      latest.forEach((m) => {
        const li = el("li", "memo-item");
        li.dataset.id = m._id;

        if (editingId === m._id) {
          // 수정 폼
          const ef = el("form", "memo-edit");
          const et = el("input", "memo-edit__title");
          et.type = "text";
          et.maxLength = 80;
          et.value = m.title || "";
          const editFields = cfg.fields.map((f) => fieldInput(f, m[f.key] || ""));
          const row = el("div", "memo-item__actions");
          const sv = el("button", "btn-mini", "저장");
          sv.type = "submit";
          const cc = el("button", "btn-mini", "취소");
          cc.type = "button";
          row.append(sv, cc);
          ef.append(et, ...editFields, row);
          ef.addEventListener("submit", async (e) => {
            e.preventDefault();
            const title = et.value.trim();
            if (!title) return et.focus();
            const patch = { title };
            cfg.fields.forEach((f, i) => (patch[f.key] = editFields[i].value.trim()));
            try {
              const updated = await api(BASE + "/" + m._id, {
                method: "PUT",
                body: JSON.stringify(patch),
              });
              Object.assign(m, updated); // 낙관적 갱신
              editingId = null;
              expanded.add(m._id);
              clearError();
              render();
            } catch (err) {
              console.error(cfg.label + " 수정 실패:", err);
              showError(err.message);
            }
          });
          cc.addEventListener("click", () => {
            editingId = null;
            render();
          });
          li.appendChild(ef);
          ul.appendChild(li);
          return;
        }

        // 제목 (클릭 시 상세 펼침)
        const titleBtn = el("button", "memo-item__title", m.title || "(제목 없음)");
        titleBtn.type = "button";
        const detail = el("div", "memo-item__detail");
        detail.style.display = expanded.has(m._id) ? "block" : "none";

        if (m.content) detail.append(el("p", "memo-item__content", m.content));
        // 추가 필드(오늘의 기분·감사한 일 등)
        cfg.fields.forEach((f) => {
          if (f.main || !m[f.key]) return;
          const fb = el("div", "memo-item__field");
          fb.append(el("span", "memo-item__flabel", f.label), el("span", "memo-item__fval", m[f.key]));
          detail.append(fb);
        });

        const dates = el("div", "memo-item__dates");
        dates.append(el("span", null, "입력 " + fmt(m.createdAt)));
        if (m.updatedAt && m.updatedAt !== m.createdAt) dates.append(el("span", null, "수정 " + fmt(m.updatedAt)));
        detail.append(dates);

        const actions = el("div", "memo-item__actions");
        const editBtn = el("button", "btn-mini", "수정");
        editBtn.type = "button";
        const delBtn = el("button", "btn-mini", "삭제");
        delBtn.type = "button";
        actions.append(editBtn, delBtn);
        detail.append(actions);

        titleBtn.addEventListener("click", () => {
          if (expanded.has(m._id)) {
            expanded.delete(m._id);
            detail.style.display = "none";
          } else {
            expanded.add(m._id);
            detail.style.display = "block";
          }
        });
        editBtn.addEventListener("click", () => {
          editingId = m._id;
          render();
        });
        delBtn.addEventListener("click", async () => {
          try {
            await api(BASE + "/" + m._id, { method: "DELETE" });
            latest = latest.filter((x) => x._id !== m._id);
            expanded.delete(m._id);
            clearError();
            render();
          } catch (err) {
            console.error(cfg.label + " 삭제 실패:", err);
            showError(err.message);
          }
        });

        li.append(titleBtn, detail);
        ul.appendChild(li);
      });
      count.textContent = latest.length ? String(latest.length) : "";
    }

    // ── 초기 로드 (최신순) ──
    (async function load() {
      try {
        const list = await api(BASE, { method: "GET" });
        latest = Array.isArray(list) ? list : [];
        clearError();
        render();
      } catch (err) {
        console.error(cfg.label + " 불러오기 실패:", err);
        showError(cfg.label + "을(를) 불러오지 못했어요. 백엔드가 실행 중인지 확인해주세요.");
      }
    })();
  }
})();
