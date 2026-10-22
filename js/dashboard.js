(() => {
  const D = window.DATA;
  const R = window.규칙;
  const {esc: esc, put: put, "길이": 길이, "자원이름": 자원이름} = window.공통;
  if (!D || !R) {
    put(document.body, "<p style='padding:24px'>데이터 또는 규칙 파일을 읽지 못했습니다. js/data.js 가 있는지 확인하세요.</p>");
    return;
  }
  const 묶음 = [ {
    "코드": "crit",
    "제목": "119에 바로 알릴 집",
    "설명": "비상전원이 도착하기 전에 기기가 멈출 수 있습니다. 119에 알리고, 비상전원도 함께 보냅니다.",
    "짧게": "119에 알리기",
    "도움": "비상전원이 닿기 전에 기기가 멈출 수 있는 집"
  }, {
    "코드": "assign",
    "제목": "비상전원을 보낼 집",
    "설명": "추천한 비상전원을 확인하고 보내기를 누르세요.",
    "짧게": "비상전원 보내기",
    "도움": "추천을 확인하고 보내기를 누르세요"
  }, {
    "코드": "short",
    "제목": "비상전원이 모자란 집",
    "설명": "보낼 비상전원이 남아 있지 않습니다. 이웃 구나 한전 이동 발전차를 요청하세요.",
    "짧게": "비상전원 부족",
    "도움": "이웃 구·한전에 추가 요청이 필요한 집"
  }, {
    "코드": "ok",
    "제목": "기다려도 되는 집",
    "설명": "복구 예상 시각까지 기기가 버팁니다. 보호자에게 기다려도 된다고 안내합니다.",
    "짧게": "기다려도 되는 집",
    "도움": "복구 예상 시각까지 기기가 버팀"
  } ];
  const 등급글 = {
    A: "제조사 사양",
    B: "기기 화면",
    C: "보호자 입력"
  };
  const 처음보일수 = 5;
  const state = {
    scen: "small",
    open: new Set,
    more: new Set,
    fixed: {},
    approved: {}
  };
  const $ = id => document.getElementById(id);
  function 발생시각() {
    return new Date(D.시나리오[state.scen].발생);
  }
  const 시각 = h => window.공통.시각(h, 발생시각());
  const 지금 = () => (new Date).toTimeString().slice(0, 5);
  const 기기종류 = ids => [ ...new Set(ids.map((d => D.기기[d].종류.replace(/\(.+\)/, "")))) ].join("·");
  function 쉬운경고(w) {
    if (w.includes("최악 조건 미공개")) return "제조사가 최악 조건 시간을 밝히지 않아 보통 조건으로 계산함";
    if (w.includes("충전량")) return "충전량은 보호자가 적은 값";
    if (w.includes("외장배터리")) return "여분 배터리 정품 여부 확인 전이라 시간에 넣지 않음";
    if (w.includes("예비 산소통")) return "예비 산소통 업체 확인 전이라 시간에 넣지 않음";
    if (w.includes("배터리 시간 표기 없음")) return "설명서에 배터리 시간이 없어 0으로 계산함";
    return w;
  }
  const 기기글 = d => `${D.기기[d].종류.replace(/\(.+\)/, "")} · ${D.기기[d].모델}`;
  function 계산() {
    const s = D.시나리오[state.scen];
    return R.판정(s.가구, D.자원, D.복구, D.기기, state.fixed);
  }
  function 머리(결과) {
    const s = D.시나리오[state.scen];
    const d = 발생시각();
    const 원인들 = [ ...new Set(결과.map((r => r.가구.정전원인))) ];
    put($("lead"), `<strong>${d.getMonth() + 1}월 ${d.getDate()}일 ${시각(0)} 정전 발생</strong> · 원인: ${esc(원인들.join(", "))} · 정전 지역 등록 가구 ${s.가구.length}곳`);
    put($("scen"), Object.entries(D.시나리오).map((([k, v]) => {
      const on = k === state.scen;
      return `<li role="tab" aria-selected="${on}" class="${on ? "active" : ""}"><button type="button" class="btn-tab" data-k="${k}">${esc(v.이름)} (${v.가구.length}가구)</button></li>`;
    })).join(""));
    $("scen").querySelectorAll("button").forEach((b => b.onclick = () => {
      state.scen = b.dataset.k;
      state.open = new Set;
      state.more = new Set;
      state.fixed = {};
      state.approved = {};
      그리기();
    }));
  }
  function 할일(결과) {
    const 줄 = 묶음.map((g => {
      const 전체 = 결과.filter((r => r.상태.코드 === g.코드));
      const 남음 = 전체.filter((r => !state.approved[r.가구.id])).length;
      if (!전체.length) return "";
      const 끝 = (g.코드 === "crit" || g.코드 === "assign") && !남음;
      return `<li class="td-${g.코드}${끝 ? " done" : ""}"><a href="#grp-${g.코드}">\n        <strong>${g.짧게} <b>${끝 ? "완료" : `${g.코드 === "crit" || g.코드 === "assign" ? 남음 : 전체.length}곳`}</b></strong>\n        <span>${g.도움}</span></a></li>`;
    })).join("");
    put($("todo"), `<h2 id="todoTit">지금 할 일</h2><ol class="todo-list">${줄}</ol>`);
  }
  function 목록(결과) {
    const 순위 = new Map(결과.map(((r, i) => [ r.가구.id, i + 1 ])));
    put($("groups"), 묶음.map((g => {
      const rs = 결과.filter((r => r.상태.코드 === g.코드));
      if (!rs.length) return "";
      return `<section class="grp" id="grp-${g.코드}">\n        <div class="grp-head"><h2>${g.제목} <span class="grp-n">${rs.length}</span></h2><p>${g.설명}</p></div>\n        <ul class="hh-list">${(state.more.has(g.코드) ? rs : rs.slice(0, 처음보일수)).map((r => 카드(r, 순위.get(r.가구.id), g, 결과))).join("")}</ul>\n        ${rs.length > 처음보일수 ? `<button type="button" class="krds-btn medium tertiary more-btn" data-more="${g.코드}">${state.more.has(g.코드) ? "접기" : `나머지 ${rs.length - 처음보일수}곳 더 보기`}</button>` : ""}\n      </section>`;
    })).join(""));
    $("groups").querySelectorAll("[data-act]").forEach((b => b.onclick = () => 행동(b.dataset.act, b.dataset.id, 결과)));
    $("groups").querySelectorAll("[data-more]").forEach((b => b.onclick = () => {
      const m = new Set(state.more);
      if (m.has(b.dataset.more)) m.delete(b.dataset.more); else m.add(b.dataset.more);
      state.more = m;
      그리기();
    }));
    $("groups").querySelectorAll('input[type="radio"]').forEach((inp => inp.onchange = () => {
      state.fixed = {
        ...state.fixed,
        [inp.dataset.id]: inp.value
      };
      그리기();
    }));
  }
  function 카드(r, 순위, g, 결과) {
    const id = r.가구.id, a = state.approved[id], 열림 = state.open.has(id);
    const 자원칸 = r.배정 ? `<strong>${esc(자원이름(r.배정.자원))} <em>${esc(r.배정.자원.id)}</em></strong><span>${esc(r.배정.자원.거점)}에서 ${길이(r.배정.도착h)} 뒤 도착 (${시각(r.배정.도착h)})${r.배정.교대 ? " · 복구 전에 한 번 더 교체 필요" : ""}</span>` : r.상태.코드 === "ok" ? `<strong class="none">필요 없음</strong><span>복구 예상 ${시각(r.복구.상한_h)}까지 버팀</span>` : `<strong class="none">남은 비상전원 없음</strong><span>이웃 구·한전에 추가 요청</span>`;
    let 버튼 = "";
    if (a) {
      버튼 = `<span class="krds-badge bg-light-success">${a.종류 === "119" ? "119 알림" : "보내기 승인"} ${a.시각}</span>\n        <button type="button" class="krds-btn small tertiary" data-act="undo" data-id="${esc(id)}">취소</button>`;
    } else if (g.코드 === "crit") {
      버튼 = `<button type="button" class="krds-btn medium primary danger-btn" data-act="approve" data-id="${esc(id)}">119에 알리기</button>`;
    } else if (g.코드 === "assign") {
      버튼 = `<button type="button" class="krds-btn medium primary" data-act="approve" data-id="${esc(id)}">비상전원 보내기</button>`;
    }
    버튼 += `<button type="button" class="krds-btn small text" data-act="toggle" data-id="${esc(id)}" aria-expanded="${열림}">${열림 ? "설명 접기" : "왜 이 순서인가요"}</button>`;
    return `<li class="hh hh-${g.코드}${a ? " done" : ""}">\n      <div class="hh-row">\n        <div class="hh-who">\n          <span class="hh-rank" title="전체 순서">${순위}</span>\n          <div>\n            <p class="hh-id"><strong>${esc(기기종류(r.가구.기기))} 사용 집</strong></p>\n            <p class="hh-dev">${esc(r.가구.구역)} · ${r.가구.기기.map((d => esc(D.기기[d].모델))).join(", ")} <span class="hh-code">${esc(id)}</span></p>\n            ${r.경고.length ? `<p class="hh-warn"><span class="krds-badge bg-light-warning">확인 필요</span> ${esc(쉬운경고(r.경고[0]))}${r.경고.length > 1 ? ` 외 ${r.경고.length - 1}건` : ""}</p>` : ""}\n          </div>\n        </div>\n        <dl class="hh-facts">\n          <div><dt>기기가 버티는 시간</dt><dd><strong class="${r.안전h < 1 ? "urgent" : ""}">${r.안전h === 0 ? "바로 멈춤" : 길이(r.안전h)}</strong><span>${r.안전h === 0 ? "내장 배터리 없음" : `${시각(r.안전h)}까지`} · ${등급글[r.가구.상태.근거]} 기준</span></dd></div>\n          <div><dt>${r.상태.코드 === "ok" ? "비상전원" : "보낼 비상전원"}</dt><dd>${자원칸}</dd></div>\n        </dl>\n        <div class="hh-act">${버튼}</div>\n      </div>\n      ${a ? 전달정보(r, a) : ""}\n      ${열림 ? 근거(r, 결과, a) : ""}\n    </li>`;
  }
  function 근거(r, 결과, a) {
    const g = r.가구;
    const 다른가구 = new Map;
    결과.forEach((x => {
      if (x.배정 && x.가구.id !== g.id) 다른가구.set(x.배정.자원.id, x.가구.id);
    }));
    const 계산줄 = r.기기별.map((d => `\n      <li><p class="ev-dev">${esc(d.기기.모델)} <span>(${esc(d.기기.종류)}, ${d.기기.W}W)</span></p>\n        <ul>${d.과정.map((p => `<li><span class="krds-badge ${p.등급 === "C" ? "outline-warning" : p.등급 === "B" ? "outline-primary" : "outline-gray"}">${등급글[p.등급]}</span> ${esc(p.식.replace(/(\d+(?:\.\d+)?)h/g, "$1시간"))} → <strong>${길이(p.값)}</strong></li>`)).join("")}</ul></li>`)).join("");
    const 복구 = r.복구;
    const 범위 = 복구.하한_h ? `${길이(복구.하한_h)} ~ ${길이(복구.상한_h)}` : `최대 ${길이(복구.상한_h)}`;
    const 기준 = Math.min(복구.상한_h, r.최선도착);
    const 기준글 = 기준 === 복구.상한_h ? "복구 예상(최대)" : "가장 빠른 비상전원 도착";
    const 자원행 = r.자원평가.map((c => {
      const id = c.자원.id;
      const 내것 = r.배정 && r.배정.자원.id === id;
      const 남 = 다른가구.get(id);
      const 고름 = c.방식 && !남;
      const 판단 = !c.방식 ? `<span class="t-danger">불가 · ${esc(c.사유)}</span>` : 남 ? `<span class="t-subtle">${esc(남)}에 배정됨</span>` : `가능 · ${esc(c.방식)}, ${길이(c.공급h)} 공급${c.도착h > r.안전h ? ' <span class="t-danger">(기기가 멈춘 뒤 도착)</span>' : ""}`;
      return `<tr class="${내것 ? "mine" : ""}">\n        <td>${고름 ? `<input type="radio" name="pick-${esc(g.id)}" value="${esc(id)}" data-id="${esc(g.id)}" ${내것 ? "checked" : ""} ${a ? "disabled" : ""} aria-label="${esc(id)} 선택">` : ""}</td>\n        <td><strong>${esc(id)}</strong> ${esc(자원이름(c.자원))}<br><span class="t-subtle">${esc(c.자원.거점)} · 잔량 ${c.자원.잔량pct}%</span></td>\n        <td>${c.방식 ? 길이(c.도착h) : "—"}</td>\n        <td>${판단}</td></tr>`;
    })).join("");
    return `<div class="hh-ev">\n      <div class="ev-col">\n        <h3>기기가 버티는 시간</h3>\n        <ul class="ev-calc">${계산줄}</ul>\n        <p class="ev-note">기기가 여러 대면 가장 짧은 쪽을 씁니다. 사양값에는 오차(×0.9)와 배터리 노후(×0.67)를 반영합니다.</p>\n        <h3>복구 예상</h3>\n        <p>${esc(g.정전원인)}: ${범위} <span class="krds-badge outline-warning">가정값</span></p>\n        <p class="ev-note">${esc(복구.근거.join(" / "))}</p>\n        <h3>대응 여유</h3>\n        <p>버티는 시간 ${길이(r.안전h)} − ${기준글} ${길이(기준)} = <strong class="${r.여유 < 0 ? "t-danger" : ""}">${길이(r.여유)}</strong></p>\n        ${r.경고.length ? `<h3>확인 필요</h3><ul class="ev-warn">${r.경고.map((w => `<li>${esc(w)}</li>`)).join("")}</ul>` : ""}\n        ${g.메모 ? `<p class="ev-note">시연 메모: ${esc(g.메모)}</p>` : ""}\n      </div>\n      <div class="ev-col">\n        <h3>보낼 수 있는 비상전원 ${a ? "" : '<span class="ev-sub">다른 것을 고르면 다시 계산합니다</span>'}</h3>\n        <div class="krds-table-wrap"><table class="tbl col data ev-tbl">\n          <caption class="sr-only">${esc(g.id)} 가구에 보낼 수 있는 비상전원과 판단</caption>\n          <thead><tr><th scope="col"><span class="sr-only">선택</span></th><th scope="col">비상전원</th><th scope="col">도착</th><th scope="col">판단</th></tr></thead>\n          <tbody>${자원행}</tbody></table></div>\n        <p class="ev-note">이동 시간 = 직선거리 × ${R.상수.도로우회계수} ÷ 시속 ${R.상수.이동시속km}km + 출발 준비 (가정값). 출력은 기기 정격의 ${R.상수.출력여유배수}배 이상이어야 합니다.</p>\n      </div>\n    </div>`;
  }
  function 전달정보(r, a) {
    const g = r.가구;
    const 기기종류 = [ ...new Set(g.기기.map((d => D.기기[d].종류))) ].join(", ");
    let html = "";
    if (a.종류 === "119") {
      html += `<div class="handoff handoff-119"><p class="ho-tit">119에 전달한 정보 <span>최소 정보만 · ${a.시각}</span></p>\n        <dl><div><dt>위치</dt><dd>${esc(g.구역)} (${g.위도.toFixed(4)}, ${g.경도.toFixed(4)})</dd></div>\n        <div><dt>기기</dt><dd>${esc(기기종류)}</dd></div>\n        <div><dt>멈출 수 있는 시각</dt><dd>${r.안전h === 0 ? "정전과 함께 멈춤 (내장 배터리 없음)" : `${시각(r.안전h)} (${길이(r.안전h)} 뒤)`}</dd></div></dl></div>`;
    }
    if (r.배정) {
      html += `<div class="handoff"><p class="ho-tit">비상전원 보관 장소에 보낸 출동 요청 <span>${a.시각}</span></p>\n        <dl><div><dt>비상전원</dt><dd>${esc(r.배정.자원.id)} ${esc(자원이름(r.배정.자원))} · ${esc(r.배정.자원.거점)}</dd></div>\n        <div><dt>연결</dt><dd>${esc(r.배정.방식)}${r.배정.방식.startsWith("DC") ? " (가구 보유 케이블)" : ""}</dd></div>\n        <div><dt>도착 목표</dt><dd>${시각(r.배정.도착h)}</dd></div>\n        <div><dt>공급 가능</dt><dd>${길이(r.배정.공급h)}${r.배정.교대 ? ` (복구까지 ${길이(r.배정.필요h)} 필요 — 교대 자원 준비)` : ""}</dd></div></dl></div>`;
    }
    return html;
  }
  function 행동(종류, id, 결과) {
    const r = 결과.find((x => x.가구.id === id));
    if (!r) return;
    if (종류 === "toggle") {
      const s = new Set(state.open);
      if (s.has(id)) s.delete(id); else s.add(id);
      state.open = s;
    } else if (종류 === "approve") {
      state.approved = {
        ...state.approved,
        [id]: {
          "종류": r.상태.코드 === "crit" ? "119" : "출동",
          "시각": 지금()
        }
      };
      if (r.배정) state.fixed = {
        ...state.fixed,
        [id]: r.배정.자원.id
      };
    } else if (종류 === "undo") {
      const {[id]: _a, ...restA} = state.approved;
      const {[id]: _f, ...restF} = state.fixed;
      state.approved = restA;
      state.fixed = restF;
    }
    그리기();
  }
  function 자원현황(결과) {
    const 배정 = new Map(결과.filter((r => r.배정)).map((r => [ r.배정.자원.id, r.가구.id ])));
    const 불가 = D.자원.filter((x => !x.가용)).length;
    put($("resSum"), `전체 ${D.자원.length}대 · 추천 ${배정.size}대${불가 ? ` · 사용 불가 ${불가}대` : ""}`);
    put($("res"), D.자원.map((x => {
      const 누구 = 배정.get(x.id);
      const 배지 = !x.가용 ? '<span class="krds-badge bg-light-gray">사용 불가</span>' : 누구 ? state.approved[누구] ? `<span class="krds-badge bg-light-success">${esc(누구)} 출동</span>` : `<span class="krds-badge bg-light-primary">${esc(누구)} 추천</span>` : '<span class="krds-badge outline-gray">대기</span>';
      const 용량 = x.산소h ? `산소 ${x.산소h}시간분` : `${x.용량Wh >= 1e3 ? x.용량Wh / 1e3 + "kWh" : x.용량Wh + "Wh"} · 출력 ${x.AC_W}W`;
      const 아래 = [ x.산소h ? "" : `잔량 ${x.잔량pct}%`, esc(x.메모) ].filter(Boolean).join(" · ");
      return `<li class="${x.가용 ? "" : "off"}">\n        <div class="res-top"><strong>${esc(x.id)} ${esc(자원이름(x))}</strong>${배지}</div>\n        <p class="t-subtle">${esc(x.거점)} · ${용량}</p>\n        ${x.산소h ? "" : `<div class="res-bar" role="img" aria-label="잔량 ${x.잔량pct}%"><span style="width:${x.잔량pct}%"></span></div>`}\n        ${아래 ? `<p class="t-subtle">${아래}</p>` : ""}\n      </li>`;
    })).join(""));
  }
  function 가정값() {
    const c = R.상수;
    const 행들 = [ [ "사양 오차 보정", `× ${c.사양오차}`, "PB560 설명서 표6-1 '각 −10%'" ], [ "배터리 노후 보정", `× ${c.노후배터리}`, "SimplyGo 설명서 '수명 끝 무렵 약 2/3'" ], [ "기기 화면 표시값 보정", `× ${c.화면값보정}`, "가정값" ], [ "비상전원 출력 여유", `기기 정격 × ${c.출력여유배수}`, "가정값" ], [ "파워뱅크 사용 가능 비율", `${c.인버터효율 * 100}%`, "가정값" ], [ "이동 시간", `직선거리 × ${c.도로우회계수} ÷ 시속 ${c.이동시속km}km + 준비 15~45분`, "가정값 (길찾기 API 미사용)" ], [ "119 연락 기준 (자원 없음)", `${c.이송판단h}시간 안에 기기가 멈춤`, "가정값" ], [ "예비 산소통 1개", "4시간", "가정값 — 실제로는 용량·유량에 따라 다름" ], ...Object.entries(D.복구).map((([k, v]) => [ `복구 예상 · ${k}`, v.하한_h ? `${길이(v.하한_h)} ~ ${길이(v.상한_h)}` : `최대 ${길이(v.상한_h)}`, v.근거.join(" / ") ])) ];
    put($("assume"), `<h2 class="box-tit">가정값과 출처</h2>\n      <div class="krds-table-wrap"><table class="tbl col data"><caption class="sr-only">계산에 쓴 가정값과 출처</caption>\n      <thead><tr><th scope="col">항목</th><th scope="col">값</th><th scope="col">출처</th></tr></thead>\n      <tbody>${행들.map((x => `<tr><td>${esc(x[0])}</td><td>${esc(x[1])}</td><td>${esc(x[2])}</td></tr>`)).join("")}</tbody></table></div>\n      <p class="ev-note">모든 가구와 자원은 가상입니다. 실제 개인정보는 없습니다. 배정은 여유가 작은 가구부터 가장 빨리 도착하는 자원을 고르는 규칙이라, 전체로 보면 가장 좋은 배정이 아닐 수 있습니다.</p>`);
    $("openAssume").onclick = () => {
      $("assume").hidden = !$("assume").hidden;
      if (!$("assume").hidden) $("assume").scrollIntoView({
        behavior: "smooth"
      });
    };
  }
  function 그리기() {
    const 결과 = 계산();
    머리(결과);
    할일(결과);
    목록(결과);
    자원현황(결과);
  }
  if (window.matchMedia("(max-width: 1100px)").matches) {
    $("resBox").open = false;
    $("ruleBox").open = false;
  }
  가정값();
  그리기();
})();
