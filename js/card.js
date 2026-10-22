(() => {
  const D = window.DATA;
  const R = window.규칙;
  const {esc: esc, put: put, "길이": 길이} = window.공통;
  const app = document.getElementById("app");
  if (!D || !R) {
    put(app, "<p>데이터 또는 규칙 파일을 읽지 못했습니다. js/data.js 가 있는지 확인하세요.</p>");
    return;
  }
  const 저장키 = "전력안심망.내가구";
  const 등급글 = {
    A: "제조사 사양",
    B: "기기 화면",
    C: "보호자 입력"
  };
  const 산소통1개h = 4;
  function 기기안내(기기) {
    const k = 기기.종류;
    if (k.includes("인공호흡기")) return "기기 화면에서 배터리로 바뀌었는지 확인하세요. 배터리 경보가 울리면 바로 다른 전원에 연결하세요. 예비 호흡 수단(수동식 인공호흡기 등)은 담당 의료진과 미리 정해 두세요.";
    if (k.includes("산소발생기") && !기기.표준h) return "내장 배터리가 없어 정전 즉시 멈춥니다. 예비 산소통으로 바꾸고 산소 대여업체에 연락하세요.";
    if (k.includes("산소발생기")) return "배터리로 동작하는지 확인하세요. 남은 배터리 칸을 보고, 예비 산소를 준비하세요.";
    return "배터리 남은 양을 확인하세요. 차량용 전원 등 다른 전원을 쓸 수 있는지 미리 알아 두세요.";
  }
  function 읽기() {
    if (new URLSearchParams(location.search).has("예시")) {
      const g = D.시나리오.small.가구[0];
      return {
        "가구": g,
        "예시": true
      };
    }
    try {
      const v = JSON.parse(localStorage.getItem(저장키) || "null");
      if (v && Array.isArray(v.기기) && v.기기.length && v.기기.every((id => D.기기[id])) && v.상태) return {
        "가구": v,
        "예시": false
      };
      if (v) console.warn("등록 정보 형식이 맞지 않아 쓰지 않습니다:", v);
    } catch (e) {
      console.warn("등록 정보를 읽지 못했습니다:", e);
    }
    return null;
  }
  function 빈화면() {
    put(app, `<div class="page-title"><h1>정전 대비 카드</h1></div>\n      <div class="card-empty">\n        <p>이 휴대폰에 등록된 기기가 없습니다. 기기를 먼저 등록하면 카드가 만들어집니다.</p>\n        <div class="btn-row">\n          <a class="krds-btn large primary" href="register.html">기기 등록하기</a>\n          <a class="krds-btn large secondary" href="card.html?예시">예시 카드 보기</a>\n        </div>\n      </div>`);
  }
  function 카드(읽은것) {
    const g = 읽은것.가구;
    const r = R.가구안전시간(g, D.기기);
    const 즉시 = r.h === 0;
    const 산소기기 = g.기기.filter((id => !D.기기[id].표준h && D.기기[id].종류.includes("산소발생기")));
    const 산소통개수 = Math.round((g.예비산소통?.시간h || 0) / 산소통1개h);
    const 등록일 = g.등록시각 ? new Date(g.등록시각) : null;
    const 날짜 = 등록일 ? `${등록일.getFullYear()}. ${등록일.getMonth() + 1}. ${등록일.getDate()}.` : "";
    const 기기행 = r.기기별.map((d => {
      const 서 = d.기기.설명서 || {};
      const 등급 = d.과정.some((p => p.등급 === "B")) ? "B" : d.과정.some((p => p.등급 === "C" && p.식.includes("충전량"))) ? "C" : "A";
      return `<tr>\n        <th scope="row">${esc(d.기기.모델)}<span>${esc(d.기기.종류)}</span></th>\n        <td><strong class="${d.h === 0 ? "t-danger" : ""}">${d.h === 0 ? "바로 멈춤" : 길이(d.h)}</strong><span>${등급글[등급]} 기준</span></td>\n        <td>${esc(서.충전 || "—")}</td></tr>`;
    })).join("");
    const 원문 = r.기기별.filter((d => d.기기.설명서?.권고)).map((d => `<li>\n        <p class="q-model">${esc(d.기기.모델)}</p>\n        <blockquote lang="en">${esc(d.기기.설명서.권고)}</blockquote>\n        <p class="q-src">제조사 설명서 ${esc(d.기기.설명서.쪽수.split("/")[0].trim())}</p></li>`)).join("");
    put(app, `<article class="pcard">\n      <header class="pcard-head">\n        <div><p class="pcard-kicker">정전 대비 카드${읽은것.예시 ? " · 예시" : ""}</p>\n          <h1>정전되면 기기가 버티는 시간</h1></div>\n        <p class="pcard-meta">${esc(g.구역 || "")}${날짜 ? ` · ${날짜} 등록` : ""}</p>\n      </header>\n\n      <section class="pcard-big ${즉시 ? "zero" : ""}">\n        <p class="big-h">${즉시 ? "바로 멈춤" : `약 ${길이(r.h)}`}</p>\n        <p>${즉시 ? "정전 즉시 멈추는 기기가 있습니다. 아래 순서대로 바로 움직이세요." : "배터리가 낡았을 때를 생각해 짧게 잡은 시간입니다."}</p>\n        ${즉시 ? "" : `<div class="fill" aria-label="손으로 적는 칸"><span>정전 시작 <b></b></span><span>+ ${길이(r.h)} =</span><span><b></b> 전까지 조치</span></div>`}\n      </section>\n\n      <section class="pcard-sec">\n        <h2>기기별 시간</h2>\n        <table class="ptbl"><thead><tr><th scope="col">기기</th><th scope="col">버티는 시간</th><th scope="col">완충까지 (설명서)</th></tr></thead>\n        <tbody>${기기행}</tbody></table>\n        ${r.기기별.length > 1 ? '<p class="small">여러 대 중 가장 짧은 시간을 위에 크게 적었습니다.</p>' : ""}\n      </section>\n\n      <section class="pcard-sec">\n        <h2>정전이 나면 이 순서로</h2>\n        <ol class="todo">\n          ${r.기기별.map((d => `<li><b>${esc(d.기기.모델)}</b> ${esc(기기안내(d.기기))}</li>`)).join("")}\n          <li><b>한전 123</b>(국번 없이)에 정전을 알리고 <b>"생명유지장치를 쓰는 집"</b>이라고 말하세요.</li>\n          <li><b>구청 담당자</b>에게 연락하세요. 비상전원을 보내 드립니다. <span class="line">연락처</span></li>\n          <li>${즉시 ? "기기가 멈췄거나" : `정전 후 <b>${길이(r.h)}</b> 안에 전기가 안 들어올 것 같거나`} 숨쉬기가 힘들면 바로 <b class="t-danger">119</b>.</li>\n        </ol>\n      </section>\n\n      ${산소기기.length ? `<section class="pcard-sec">\n        <h2>예비 산소통</h2>\n        <p>${산소통개수 ? `집에 ${산소통개수}개 있다고 등록했습니다. 대여업체가 확인하면 1개당 약 ${산소통1개h}시간을 더해 계산합니다(가정값, 유량에 따라 다름). 확인 전인 지금은 위 시간에 넣지 않았습니다.` : "등록된 예비 산소통이 없습니다. 산소 대여업체에 예비 산소통을 미리 요청하세요."}</p>\n        <p><span class="line">산소 대여업체 연락처</span></p>\n      </section>` : ""}\n\n      ${원문 ? `<section class="pcard-sec quotes">\n        <h2>제조사 설명서의 정전 관련 권고 <span>(원문)</span></h2>\n        <ul>${원문}</ul>\n        <p class="small">원문을 그대로 옮겼습니다. 뜻이 궁금하면 담당 의료진이나 기기 업체에 물어보세요.</p>\n      </section>` : ""}\n\n      <footer class="pcard-foot">\n        <p>버티는 시간은 제조사 사양을 낮춰 잡거나(×0.9×0.67) 기기 화면 값을 줄여서(×0.9) 계산했습니다. 여분 배터리·산소통은 담당자 확인 전에는 더하지 않았습니다. 배터리를 바꾸거나 기기가 달라지면 다시 등록하세요.</p>\n        <p>전력안심망 시연판 · 실제 서비스가 아닙니다</p>\n      </footer>\n    </article>\n\n    <div class="btn-row no-print card-btns">\n      <button type="button" class="krds-btn large primary" id="print">인쇄하기</button>\n      <a class="krds-btn large secondary" href="register.html">다시 등록하기</a>\n    </div>`);
    document.getElementById("print").onclick = () => window.print();
  }
  const 읽은것 = 읽기();
  if (읽은것) 카드(읽은것); else 빈화면();
})();
