(() => {
  const D = window.DATA;
  const R = window.규칙;
  const {esc: esc, put: put, "길이": 길이} = window.공통;
  const $ = id => document.getElementById(id);
  if (!D || !R || !window.라벨) {
    put(document.body, "<p style='padding:24px'>데이터·규칙·라벨 인식 파일 중 하나를 읽지 못했습니다. js 폴더를 확인하세요.</p>");
    return;
  }
  const 저장키 = "전력안심망.내가구";
  const 최대기기 = 3;
  const 산소통1개h = 4;
  const 동목록 = [ "가산동", "독산동", "시흥동" ];
  const 단계이름 = [ "기기 찾기", "지금 상태", "확인·등록" ];
  const 등급글 = {
    A: "제조사 사양",
    B: "기기 화면",
    C: "보호자 입력"
  };
  const st = {
    "단계": 1,
    "기기": [],
    "찾기": null,
    "사진": null,
    "검색": "",
    "근거": "A",
    "시간": "",
    "분": "",
    "충전": "",
    "외장": 0,
    "산소통": 0,
    "케이블": false,
    "동": "",
    "오류": "",
    "저장": null
  };
  const 기기 = id => D.기기[id];
  const 배터리있음 = id => Boolean(기기(id).표준h);
  const 기기이름 = id => `${기기(id).모델}`;
  const 종류묶음 = 종류 => 종류.replace(/\(.+\)/, "");
  function 그리기() {
    put($("steps"), 단계이름.map(((n, i) => {
      const k = i + 1, 상태 = k < st.단계 ? "done" : k === st.단계 ? "now" : "";
      return `<li class="${상태}" ${k === st.단계 ? 'aria-current="step"' : ""}><span>${k}</span>${n}</li>`;
    })).join(""));
    put($("app"), st.단계 === 1 ? 단계1() : st.단계 === 2 ? 단계2() : 단계3());
    if (st.단계 === 1 && st.사진 && !st.사진.결과) 자르기준비();
  }
  function 단계1() {
    const 담은 = st.기기.length ? `<ul class="dev-picked">${st.기기.map(((id, i) => `\n        <li><div><strong>${esc(기기이름(id))}</strong><span>${esc(기기(id).종류)}</span></div>\n        <button type="button" class="krds-btn small tertiary" data-act="빼기" data-i="${i}">빼기</button></li>`)).join("")}</ul>` : "";
    const 더하기 = st.기기.length >= 최대기기 ? `<p class="t-subtle">기기는 ${최대기기}대까지 등록합니다.</p>` : st.찾기 === "사진" ? 사진칸() : st.찾기 === "목록" ? 목록칸() : `<div class="find-btns">\n          <button type="button" class="find-btn" data-act="사진"><strong>라벨 사진으로 찾기</strong><span>기기 뒷면·밑면의 모델명 라벨을 찍어 주세요</span></button>\n          <button type="button" class="find-btn" data-act="목록"><strong>목록에서 고르기</strong><span>모델명을 알고 있으면 더 빠릅니다</span></button>\n        </div>`;
    return `<section class="reg-sec">\n        <h2>${st.기기.length ? "등록할 기기" : "어떤 기기를 쓰시나요?"}</h2>\n        <p class="t-subtle">전기가 끊기면 멈추는 기기를 모두 넣어 주세요. 인공호흡기, 산소발생기, 기침유발기, 석션기 등.</p>\n        ${담은}\n        ${st.기기.length && !st.찾기 && st.기기.length < 최대기기 ? '<h3 class="reg-h3">다른 기기도 있나요?</h3>' : ""}\n        ${더하기}\n      </section>\n      ${st.찾기 ? "" : 아래버튼(st.기기.length ? "다음: 지금 상태" : "", false)}`;
  }
  function 사진칸() {
    const p = st.사진;
    if (!p) {
      return `<div class="photo-pick">\n          <label class="krds-btn large primary file-btn">사진 찍기 · 고르기\n            <input type="file" accept="image/*" capture="environment" id="photoIn" class="sr-only"></label>\n          <button type="button" class="krds-btn large secondary" data-act="견본">시연용 견본 라벨로 해 보기</button>\n          <p class="t-subtle">사진은 이 휴대폰 안에서만 읽고, 어디에도 보내지 않습니다.</p>\n          <button type="button" class="krds-btn small text" data-act="취소">돌아가기</button>\n        </div>`;
    }
    if (p.결과) return 인식결과(p);
    return `<div class="crop">\n        <p><strong>모델명이 적힌 부분을 손가락으로 끌어 네모로 감싸 주세요.</strong> 좁게 자를수록 빠르고 정확합니다.</p>\n        <canvas id="cropCv" class="crop-cv" aria-label="라벨 사진. 끌어서 읽을 부분을 고르세요"></canvas>\n        ${p.오류 ? `<p class="t-danger">${esc(p.오류)}</p>` : ""}\n        ${p.읽는중 ? `<div class="ocr-wait" role="status"><span class="spin"></span>${esc(p.진행 || "준비 중")}</div>` : `<div class="btn-row">\n              <button type="button" class="krds-btn large primary" data-act="읽기">${p.영역.전체 ? "사진 전체 읽기" : "고른 부분 읽기"}</button>\n              <button type="button" class="krds-btn large tertiary" data-act="다시찍기">다른 사진</button>\n            </div>\n            <p class="t-subtle">처음 한 번은 글자 인식 엔진(약 7MB)을 받느라 시간이 걸립니다.</p>`}\n      </div>`;
  }
  function 인식결과(p) {
    const r = p.결과;
    const 읽은글 = r.글.replace(/\s+/g, " ").trim().slice(0, 160);
    const 원문 = `<details class="ocr-raw"><summary>읽은 글자 보기</summary><p>${esc(읽은글) || "(읽은 글자 없음)"}</p></details>`;
    if (r.결과 === "찾음") {
      const d = 기기(r.기기);
      return `<div class="ocr-res ok" role="status">\n          <p class="ocr-q">이 기기가 맞나요?</p>\n          <p class="ocr-model">${esc(d.모델)}</p><p class="t-subtle">${esc(d.종류)}</p>\n          <p class="ocr-note">라벨에 적힌 모델명과 같은지 꼭 확인해 주세요. 다른 기기로 등록되면 버티는 시간이 틀리게 계산됩니다.</p>\n          ${원문}\n          <div class="btn-row">\n            <button type="button" class="krds-btn large primary" data-act="담기" data-id="${esc(r.기기)}">네, 맞아요</button>\n            <button type="button" class="krds-btn large secondary" data-act="목록">아니요, 목록에서 고를게요</button>\n          </div></div>`;
    }
    const 글 = r.결과 === "목록밖" ? `<p class="ocr-q">${esc(r.이름)}(으)로 보입니다.</p><p>이 기기는 아직 사양 확인이 끝나지 않아 바로 등록할 수 없습니다. 아래 목록에 없으면 구청 담당자에게 알려 주세요.</p>` : r.결과 === "여러개" ? '<p class="ocr-q">비슷한 모델이 여러 개라 하나로 정하지 못했습니다.</p><p>모델명 부분만 좁게 잘라 다시 읽거나, 목록에서 골라 주세요.</p>' : '<p class="ocr-q">모델명을 알아보지 못했습니다.</p><p>밝은 곳에서 라벨을 정면으로 다시 찍거나, 모델명 부분만 좁게 잘라 주세요. 목록에서 골라도 됩니다.</p>';
    return `<div class="ocr-res hold" role="status">${글}${원문}\n        <div class="btn-row">\n          <button type="button" class="krds-btn large primary" data-act="목록">목록에서 고르기</button>\n          <button type="button" class="krds-btn large tertiary" data-act="다시자르기">다시 자르기</button>\n        </div></div>`;
  }
  function 목록칸() {
    const q = st.검색.trim().toLowerCase();
    const 후보 = Object.keys(D.기기).filter((id => !st.기기.includes(id))).filter((id => !q || `${기기(id).모델} ${기기(id).종류}`.toLowerCase().includes(q)));
    const 묶음 = {};
    후보.forEach((id => {
      (묶음[종류묶음(기기(id).종류)] ||= []).push(id);
    }));
    return `<div class="dev-find">\n        <label class="sr-only" for="q">모델명 검색</label>\n        <input type="search" id="q" class="krds-input" placeholder="모델명이나 기기 종류 (예: Astral, 산소)" value="${esc(st.검색)}" autocomplete="off">\n        <div id="devList">${Object.entries(묶음).map((([k, ids]) => `<h3 class="reg-h3">${esc(k)}</h3>\n          <ul class="dev-list">${ids.map((id => `<li><button type="button" data-act="담기" data-id="${esc(id)}">\n            <strong>${esc(기기(id).모델)}</strong><span>${esc(기기(id).종류)}</span></button></li>`)).join("")}</ul>`)).join("") || '<p class="t-subtle">맞는 기기가 없습니다. 목록에 없는 기기는 구청 담당자에게 알려 주세요.</p>'}</div>\n        <button type="button" class="krds-btn small text" data-act="취소">돌아가기</button>\n      </div>`;
  }
  function 사진받기(img) {
    st.사진 = {
      img: img,
      "영역": {
        x: 0,
        y: 0,
        w: img.naturalWidth || img.width,
        h: img.naturalHeight || img.height,
        "전체": true
      }
    };
    그리기();
  }
  function 견본() {
    const c = document.createElement("canvas");
    c.width = 900;
    c.height = 520;
    const g = c.getContext("2d");
    g.fillStyle = "#e9e6df";
    g.fillRect(0, 0, 900, 520);
    g.fillStyle = "#fff";
    g.fillRect(120, 90, 660, 340);
    g.strokeStyle = "#333";
    g.lineWidth = 3;
    g.strokeRect(120, 90, 660, 340);
    g.fillStyle = "#111";
    g.font = "bold 44px sans-serif";
    g.fillText("Trilogy Evo", 160, 175);
    g.font = "28px sans-serif";
    g.fillText("Portable ventilator", 160, 225);
    g.fillText("100-240V~ 50/60Hz 1.7-0.6A", 160, 280);
    g.fillText("DC 12/24V 6.5A", 160, 325);
    g.fillStyle = "#bd2c0f";
    g.font = "bold 26px sans-serif";
    g.fillText("SAMPLE · 시연용 견본", 160, 395);
    사진받기(c);
  }
  function 자르기준비() {
    const cv = $("cropCv");
    if (!cv) return;
    const p = st.사진, img = p.img;
    const W = img.naturalWidth || img.width, H = img.naturalHeight || img.height;
    const 배 = Math.min(1, 1200 / Math.max(W, H));
    cv.width = Math.round(W * 배);
    cv.height = Math.round(H * 배);
    const g = cv.getContext("2d");
    const 다시 = () => {
      g.drawImage(img, 0, 0, cv.width, cv.height);
      if (p.영역.전체) return;
      const a = p.영역;
      g.fillStyle = "rgba(0,0,0,0.45)";
      g.fillRect(0, 0, cv.width, a.y * 배);
      g.fillRect(0, (a.y + a.h) * 배, cv.width, cv.height);
      g.fillRect(0, a.y * 배, a.x * 배, a.h * 배);
      g.fillRect((a.x + a.w) * 배, a.y * 배, cv.width, a.h * 배);
      g.strokeStyle = "#256ef4";
      g.lineWidth = 3;
      g.strokeRect(a.x * 배, a.y * 배, a.w * 배, a.h * 배);
    };
    const 점 = e => {
      const b = cv.getBoundingClientRect();
      return {
        x: Math.max(0, Math.min(W, (e.clientX - b.left) / b.width * W)),
        y: Math.max(0, Math.min(H, (e.clientY - b.top) / b.height * H))
      };
    };
    cv.onpointerdown = e => {
      if (p.읽는중) return;
      cv.setPointerCapture(e.pointerId);
      p.끌기 = 점(e);
    };
    cv.onpointermove = e => {
      if (!p.끌기) return;
      const q = 점(e), s = p.끌기;
      p.영역 = {
        x: Math.min(s.x, q.x),
        y: Math.min(s.y, q.y),
        w: Math.abs(q.x - s.x),
        h: Math.abs(q.y - s.y),
        "전체": false
      };
      다시();
    };
    cv.onpointerup = () => {
      p.끌기 = null;
      if (p.영역.w < W * .05 || p.영역.h < H * .03) p.영역 = {
        x: 0,
        y: 0,
        w: W,
        h: H,
        "전체": true
      };
      그리기();
    };
    다시();
  }
  async function 읽기() {
    const p = st.사진;
    p.읽는중 = true;
    p.오류 = "";
    p.진행 = "글자 인식 엔진 준비 중";
    그리기();
    const 진행 = (글, 비율) => {
      const 이름 = {
        "loading tesseract core": "엔진 받는 중",
        "initializing tesseract": "엔진 준비 중",
        "loading language traineddata": "영어 글자 자료 받는 중",
        "initializing api": "엔진 준비 중",
        "recognizing text": "글자 읽는 중"
      }[글] || 글;
      const 새글 = 비율 != null && 비율 < 1 ? `${이름} ${Math.round(비율 * 100)}%` : 이름;
      if (새글 === p.진행) return;
      p.진행 = 새글;
      const el = document.querySelector(".ocr-wait");
      if (el) put(el, `<span class="spin"></span>${esc(새글)}`);
    };
    try {
      p.결과 = await window.라벨.읽기(p.img, p.영역, 진행);
    } catch (e) {
      p.오류 = `${e.message || e}. 목록에서 골라 주세요.`;
    }
    p.읽는중 = false;
    그리기();
  }
  function 단계2() {
    const 주 = st.기기[0];
    const 외장기기 = st.기기.filter((id => 기기(id).외장h));
    const 산소기기 = st.기기.filter((id => !배터리있음(id) && 기기(id).종류.includes("산소발생기")));
    const dc기기 = st.기기.filter((id => 기기(id).DC12));
    const 주고르기 = st.기기.length > 1 ? `<div class="reg-sec" role="radiogroup" aria-labelledby="h-main"><h2 id="h-main">전기가 끊기면 가장 위험한 기기는?</h2>\n        <p class="t-subtle">아래 남은 시간·충전량은 이 기기 기준으로 적어 주세요.</p>\n        ${st.기기.map(((id, i) => 라디오("주기기", String(i), i === 0, 기기이름(id)))).join("")}</div>` : "";
    const 배터리질문 = 배터리있음(주) ? `<div class="reg-sec" role="radiogroup" aria-labelledby="h-bat"><h2 id="h-bat">${esc(기기이름(주))} 화면에 무엇이 보이나요?</h2>\n        <p class="t-subtle">지금 배터리 상태를 알려 주시면 더 정확해집니다. 전원을 뽑지 말고 화면만 봐 주세요.</p>\n        ${라디오("근거", "B", st.근거 === "B", "남은 시간이 보여요")}\n        ${st.근거 === "B" ? `<div class="sub-in"><label><input type="number" inputmode="numeric" min="0" max="24" class="krds-input num" data-k="시간" aria-label="남은 시간(시간)" value="${esc(st.시간)}"> 시간</label>\n          <label><input type="number" inputmode="numeric" min="0" max="59" class="krds-input num" data-k="분" aria-label="남은 시간(분)" value="${esc(st.분)}"> 분</label></div>` : ""}\n        ${라디오("근거", "C", st.근거 === "C", "충전량(%)만 보여요")}\n        ${st.근거 === "C" ? `<div class="sub-in"><label>충전량 <input type="number" inputmode="numeric" min="0" max="100" class="krds-input num" data-k="충전" value="${esc(st.충전)}"> %</label></div>` : ""}\n        ${라디오("근거", "A", st.근거 === "A", "잘 모르겠어요 (제조사 사양으로 계산)")}\n      </div>` : `<section class="reg-sec"><h2>${esc(기기이름(주))}</h2><p class="krds-badge bg-light-danger">내장 배터리 없음</p>\n        <p>정전되면 바로 멈추는 기기입니다. 구청 화면에서 가장 먼저 확인합니다.</p></section>`;
    const 준비물 = [];
    if (외장기기.length) {
      준비물.push(`<div class="in-row"><label for="ext">${esc(외장기기.map(기기이름).join(", "))} 여분 배터리(외장·탈착식)</label>\n        <select id="ext" class="krds-form-select" data-k="외장">${[ 0, 1, 2 ].map((n => `<option value="${n}" ${n === st.외장 ? "selected" : ""}>${n ? `${n}개` : "없음"}</option>`)).join("")}</select></div>`);
    }
    if (산소기기.length) {
      준비물.push(`<div class="in-row"><label for="o2">예비 산소통</label>\n        <select id="o2" class="krds-form-select" data-k="산소통">${[ 0, 1, 2, 3 ].map((n => `<option value="${n}" ${n === st.산소통 ? "selected" : ""}>${n ? `${n}개` : "없음"}</option>`)).join("")}</select></div>`);
    }
    if (dc기기.length) {
      준비물.push(`<div class="krds-form-check"><input type="checkbox" id="dc" data-k="케이블" ${st.케이블 ? "checked" : ""}>\n        <label for="dc">${esc(dc기기.map(기기이름).join(", "))} 차량용·DC 전용 케이블이 있어요</label></div>`);
    }
    return `${주고르기}${배터리질문}\n      ${준비물.length ? `<section class="reg-sec"><h2>집에 있는 준비물</h2>${준비물.join("")}\n        <p class="t-subtle">여분 배터리와 산소통은 구청 담당자나 대여업체가 확인한 뒤에 계산에 더합니다. 그 전에는 더하지 않고 짧게 잡습니다.</p></section>` : ""}\n      <section class="reg-sec"><h2>사는 동</h2>\n        <div class="in-row"><label for="dong">동</label>\n        <select id="dong" class="krds-form-select" data-k="동"><option value="">고르세요</option>${동목록.map((d => `<option ${d === st.동 ? "selected" : ""}>${d}</option>`)).join("")}</select></div>\n        <p class="t-subtle">시연에서는 금천구 동만 고를 수 있습니다. 정확한 주소는 구청 담당자가 따로 확인합니다.</p></section>\n      ${st.오류 ? `<p class="t-danger" role="alert">${esc(st.오류)}</p>` : ""}\n      ${아래버튼("다음: 확인", true)}`;
  }
  const 라디오 = (이름, 값, 켬, 글) => `<div class="krds-form-check reg-radio">\n      <input type="radio" name="${이름}" id="${이름}-${값}" value="${값}" ${켬 ? "checked" : ""} data-k="${이름}">\n      <label for="${이름}-${값}">${esc(글)}</label></div>`;
  function 아래버튼(다음글, 이전) {
    return `<div class="reg-foot">\n        ${이전 ? '<button type="button" class="krds-btn large tertiary" data-act="이전">이전</button>' : ""}\n        ${다음글 ? `<button type="button" class="krds-btn large primary" data-act="다음">${다음글}</button>` : ""}\n      </div>`;
  }
  function 상태검사() {
    if (!st.동) return "사는 동을 골라 주세요.";
    if (!배터리있음(st.기기[0])) return "";
    if (st.근거 === "B") {
      const h = Number(st.시간 || 0) + Number(st.분 || 0) / 60;
      if (!(h > 0) || h > 24) return "남은 시간을 0보다 크고 24시간 이하로 적어 주세요.";
    }
    if (st.근거 === "C") {
      const v = Number(st.충전);
      if (st.충전 === "" || !(v >= 0 && v <= 100)) return "충전량을 0~100 사이로 적어 주세요.";
    }
    return "";
  }
  function 가구만들기() {
    const 주배터리 = 배터리있음(st.기기[0]);
    const 근거 = 주배터리 ? st.근거 : "A";
    return {
      id: "내 가구",
      "구역": st.동,
      "기기": [ ...st.기기 ],
      "상태": {
        "근거": 근거,
        "기기화면_남은시간h": 근거 === "B" ? Number(st.시간 || 0) + Number(st.분 || 0) / 60 : null,
        "충전량pct": 근거 === "C" ? Number(st.충전) : null
      },
      "외장배터리": {
        "개수": st.외장,
        "사양확인": false
      },
      "예비산소통": {
        "시간h": st.산소통 * 산소통1개h,
        "업체확인": false
      },
      "DC전용케이블": st.케이블
    };
  }
  function 단계3() {
    const g = 가구만들기();
    const r = R.가구안전시간(g, D.기기);
    const 즉시 = r.h === 0;
    const 기기줄 = r.기기별.map((d => `<li>\n        <p class="ev-dev">${esc(d.기기.모델)} <span>${길이(d.h)}</span></p>\n        <ul>${d.과정.map((p => `<li><span class="krds-badge ${p.등급 === "C" ? "outline-warning" : p.등급 === "B" ? "outline-primary" : "outline-gray"}">${등급글[p.등급]}</span> ${esc(p.식.replace(/(\d+(?:\.\d+)?)h/g, "$1시간"))}</li>`)).join("")}</ul>\n        <p class="ev-note">설명서 근거: ${esc(d.기기.근거)}</p></li>`)).join("");
    const 확인할것 = [];
    if (st.외장) 확인할것.push(`여분 배터리 ${st.외장}개 — 담당자가 정품·모델을 확인하면 시간이 늘어납니다.`);
    if (st.산소통) 확인할것.push(`예비 산소통 ${st.산소통}개 — 대여업체 확인 뒤 약 ${st.산소통 * 산소통1개h}시간을 더합니다(가정값).`);
    return `<section class="reg-sec result ${즉시 ? "zero" : ""}">\n        <p class="res-q">정전되면 기기가 버티는 시간</p>\n        <p class="res-h">${즉시 ? "바로 멈춤" : `약 ${길이(r.h)}`}</p>\n        <p>${즉시 ? `${esc(r.기기별.find((d => d.h === 0)).기기.모델)}은(는) 정전 즉시 멈춥니다. 구청 화면에서 먼저 확인하는 가구로 표시됩니다.` : "배터리가 낡았을 때를 생각해 일부러 짧게 잡은 시간입니다. 실제로는 더 버틸 수 있습니다."}</p>\n      </section>\n      <section class="reg-sec"><h2>이렇게 계산했어요</h2>\n        <ul class="ev-calc">${기기줄}</ul>\n        ${r.기기별.length > 1 ? '<p class="ev-note">기기가 여러 대면 가장 짧은 쪽을 씁니다.</p>' : ""}\n        ${확인할것.length ? `<h3 class="reg-h3">담당자 확인 뒤 반영</h3><ul class="ev-warn">${확인할것.map((x => `<li>${esc(x)}</li>`)).join("")}</ul>` : ""}\n      </section>\n      <section class="reg-sec"><h2>등록하면</h2>\n        <ul class="plain-list">\n          <li>구청 담당자 화면에 <strong>${esc(st.동)}</strong>, 기기 종류, 버티는 시간이 표시됩니다.</li>\n          <li>119에는 구청이 출동을 승인한 뒤에만 위치·기기 종류·멈출 수 있는 시각을 알립니다.</li>\n          <li>남은 시간은 바뀝니다. 배터리를 새로 바꾸거나 기기가 달라지면 다시 등록해 주세요.</li>\n        </ul>\n      </section>\n      ${st.저장 ? `<div class="krds-badge bg-light-success saved" role="status">${esc(st.저장)}</div>` : ""}\n      <div class="reg-foot">\n        <button type="button" class="krds-btn large tertiary" data-act="이전">이전</button>\n        ${st.저장 ? '<a class="krds-btn large primary" href="card.html">정전 대비 카드 보기</a>' : '<button type="button" class="krds-btn large primary" data-act="등록">등록하기</button>'}\n      </div>`;
  }
  function 등록() {
    const g = {
      ...가구만들기(),
      "등록시각": (new Date).toISOString()
    };
    try {
      localStorage.setItem(저장키, JSON.stringify(g));
      st.저장 = "등록했습니다. 시연에서는 이 휴대폰에만 저장되고 서버로 보내지 않습니다.";
    } catch (e) {
      st.저장 = "이 브라우저에서는 저장할 수 없어 화면에만 표시했습니다(개인 정보 보호 모드 등).";
    }
    그리기();
  }
  function 행동(act, el) {
    if (act === "사진") {
      st.찾기 = "사진";
      st.사진 = null;
    } else if (act === "목록") {
      st.찾기 = "목록";
      st.사진 = null;
      st.검색 = "";
    } else if (act === "취소") {
      st.찾기 = null;
      st.사진 = null;
    } else if (act === "견본") {
      견본();
      return;
    } else if (act === "다시찍기") {
      st.사진 = null;
    } else if (act === "다시자르기") {
      st.사진.결과 = null;
    } else if (act === "읽기") {
      읽기();
      return;
    } else if (act === "담기") {
      if (!st.기기.includes(el.dataset.id)) st.기기 = [ ...st.기기, el.dataset.id ];
      st.찾기 = null;
      st.사진 = null;
    } else if (act === "빼기") {
      st.기기 = st.기기.filter(((_, i) => i !== Number(el.dataset.i)));
    } else if (act === "다음") {
      if (st.단계 === 2) {
        st.오류 = 상태검사();
        if (st.오류) {
          그리기();
          return;
        }
      }
      st.단계 = Math.min(3, st.단계 + 1);
      st.저장 = null;
      window.scrollTo(0, 0);
    } else if (act === "이전") {
      st.단계 = Math.max(1, st.단계 - 1);
      st.오류 = "";
      st.저장 = null;
    } else if (act === "등록") {
      등록();
      return;
    }
    그리기();
  }
  $("app").addEventListener("click", (e => {
    const b = e.target.closest("[data-act]");
    if (b) 행동(b.dataset.act, b);
  }));
  $("app").addEventListener("input", (e => {
    const k = e.target.dataset.k;
    if (e.target.id === "q") {
      st.검색 = e.target.value;
      const 위치 = e.target.selectionStart;
      그리기();
      const q = $("q");
      q.focus();
      q.setSelectionRange(위치, 위치);
    } else if (k === "시간" || k === "분" || k === "충전") {
      st[k] = e.target.value;
      오류지우기();
    }
  }));
  const 오류지우기 = () => {
    if (!st.오류) return;
    st.오류 = "";
    document.querySelector("#app [role=alert]")?.remove();
  };
  $("app").addEventListener("change", (e => {
    const t = e.target, k = t.dataset.k;
    오류지우기();
    if (t.id === "photoIn") {
      const f = t.files && t.files[0];
      if (!f) return;
      if (!f.type.startsWith("image/")) {
        alert("사진 파일만 고를 수 있습니다.");
        return;
      }
      const img = new Image;
      img.onload = () => {
        URL.revokeObjectURL(img.src);
        사진받기(img);
      };
      img.onerror = () => alert("사진을 열지 못했습니다. 다른 사진을 골라 주세요(HEIC는 일부 브라우저에서 안 열립니다).");
      img.src = URL.createObjectURL(f);
    } else if (k === "근거") {
      st.근거 = t.value;
      그리기();
    } else if (k === "주기기") {
      const i = Number(t.value);
      st.기기 = [ st.기기[i], ...st.기기.filter(((_, j) => j !== i)) ];
      그리기();
    } else if (k === "외장" || k === "산소통") {
      st[k] = Number(t.value);
    } else if (k === "케이블") {
      st.케이블 = t.checked;
    } else if (k === "동") {
      st.동 = t.value;
    }
  }));
  그리기();
})();
