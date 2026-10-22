window.공통 = (() => {
  const 저장키 = "전력안심망.자원수정";
  const esc = s => String(s ?? "").replace(/[&<>"']/g, (c => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[c])));
  const put = (el, html) => {
    const range = document.createRange();
    range.selectNodeContents(el);
    el.replaceChildren(range.createContextualFragment(html));
  };
  function 길이(h) {
    if (!isFinite(h)) return "—";
    const 음수 = h < 0;
    const 분 = Math.round(Math.abs(h) * 60);
    const 시 = Math.floor(분 / 60), 나머지 = 분 % 60;
    const 글 = 시 ? `${시}시간${나머지 ? ` ${나머지}분` : ""}` : `${나머지}분`;
    return 음수 ? `−${글}` : 글;
  }
  function 시각(h, 시작) {
    if (!isFinite(h)) return "—";
    const d = new Date(시작.getTime() + h * 36e5);
    const 일차 = Math.round((new Date(d.toDateString()) - new Date(시작.toDateString())) / 864e5);
    const hm = `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
    return 일차 > 0 ? `${일차 === 1 ? "다음 날" : `${일차}일 뒤`} ${hm}` : hm;
  }
  const 자원이름 = x => x.종류.replace("휴대용 ", "").replace("(대여업체)", "").replace("(트레일러)", "").replace("급", "");
  const 원본자원 = window.DATA ? JSON.parse(JSON.stringify(window.DATA.자원)) : [];
  function 수정값읽기() {
    try {
      const v = JSON.parse(localStorage.getItem(저장키) || "{}");
      return v && typeof v === "object" ? v : {};
    } catch (e) {
      console.warn("자원대장 수정값을 읽지 못해 원래 데이터로 표시합니다:", e);
      return {};
    }
  }
  function 수정값적용() {
    if (!window.DATA) return;
    const 수정 = 수정값읽기();
    window.DATA.자원 = 원본자원.map((x => {
      const m = 수정[x.id] || {};
      const y = {
        ...x
      };
      if (typeof m.가용 === "boolean") y.가용 = m.가용;
      if (Number.isFinite(m.잔량pct)) y.잔량pct = Math.max(0, Math.min(100, m.잔량pct));
      if (typeof m.메모 === "string") y.메모 = m.메모;
      return y;
    }));
  }
  function 자원수정(id, 바꿀것) {
    const 수정 = 수정값읽기();
    수정[id] = {
      ...수정[id] || {},
      ...바꿀것
    };
    try {
      localStorage.setItem(저장키, JSON.stringify(수정));
    } catch (e) {
      console.warn("이 브라우저에서는 자원대장 수정값을 저장할 수 없어 이 화면에서만 반영합니다:", e);
    }
    수정값적용();
  }
  function 자원초기화() {
    try {
      localStorage.removeItem(저장키);
    } catch (e) {}
    수정값적용();
  }
  const 수정있음 = () => Object.keys(수정값읽기()).length > 0;
  const 원본 = id => 원본자원.find((x => x.id === id));
  수정값적용();
  return {
    esc: esc,
    put: put,
    "길이": 길이,
    "시각": 시각,
    "자원이름": 자원이름,
    "자원수정": 자원수정,
    "자원초기화": 자원초기화,
    "수정있음": 수정있음,
    "원본": 원본
  };
})();
