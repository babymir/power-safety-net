(() => {
  const D = window.DATA;
  const R = window.규칙;
  const {esc: esc, put: put, "길이": 길이, "자원이름": 자원이름} = window.공통;
  const $ = id => document.getElementById(id);
  if (!D || !R || !window.L) {
    put(document.body, "<p style='padding:24px'>데이터·규칙·지도 파일 중 하나를 읽지 못했습니다. js/data.js 와 vendor/leaflet/ 이 있는지 확인하세요.</p>");
    return;
  }
  const OSM저작 = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> 기여자';
  const 파일로염 = location.protocol === "file:";
  const 바탕 = 파일로염 ? {
    "주소": "https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}",
    "저작": "Tiles &copy; Esri — Esri, HERE, Garmin, OpenStreetMap 기여자",
    "원본최대": 13
  } : {
    "주소": "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
    "저작": OSM저작,
    "원본최대": 18
  };
  const 시연_시군구 = {
    "시도": "서울특별시",
    "시군구": "금천구"
  };
  const 판정글 = {
    crit: "119 연락",
    assign: "자원 보내기",
    short: "자원 부족",
    ok: "대기"
  };
  const 등급글 = {
    A: "제조사 사양",
    B: "기기 화면",
    C: "보호자 입력"
  };
  const state = {
    scen: location.hash === "#wide" ? "wide" : "small",
    pick: null
  };
  const 발생시각 = () => new Date(D.시나리오[state.scen].발생);
  const 시각 = h => window.공통.시각(h, 발생시각());
  const 계산 = () => R.판정(D.시나리오[state.scen].가구, D.자원, D.복구, D.기기, {});
  function 거점들() {
    const m = new Map;
    D.자원.forEach((x => {
      const k = `${x.위도},${x.경도}`;
      if (!m.has(k)) m.set(k, {
        "이름": x.거점,
        "위도": x.위도,
        "경도": x.경도,
        "자원": []
      });
      m.get(k).자원.push(x);
    }));
    return [ ...m.values() ];
  }
  const 지도 = L.map("map", {
    scrollWheelZoom: false,
    zoomSnap: .5,
    maxZoom: 18
  });
  const 기본안내 = 파일로염 ? "파일로 바로 열어 흐린 지도를 보여 줍니다. 배포 주소나 로컬 서버로 열면 자세한 지도가 나옵니다. 가구와 거점 위치는 모두 가상입니다." : "가구와 거점 위치는 모두 가상입니다.";
  put($("mapNote"), 기본안내);
  let 바탕오류 = false;
  L.tileLayer(바탕.주소, {
    maxZoom: 18,
    maxNativeZoom: 바탕.원본최대,
    attribution: 바탕.저작
  }).on("tileerror", (() => {
    if (바탕오류) return;
    바탕오류 = true;
    put($("mapNote"), "지도 바탕을 불러오지 못했습니다(인터넷 연결 확인). 가구·거점 위치와 배정 선은 그대로 표시됩니다. 가구와 거점 위치는 모두 가상입니다.");
  })).addTo(지도);
  const 표시층 = L.layerGroup().addTo(지도);
  function 가구표시(r, 순위) {
    const 코드 = r.상태.코드;
    const icon = L.divIcon({
      className: "",
      html: `<span class="mk-hh mk-${코드}${state.pick === r.가구.id ? " on" : ""}">${순위}</span>`,
      iconSize: [ 28, 28 ],
      iconAnchor: [ 14, 14 ]
    });
    return L.marker([ r.가구.위도, r.가구.경도 ], {
      icon: icon,
      title: `${r.가구.id} ${판정글[코드]}`,
      keyboard: true,
      zIndexOffset: 코드 === "crit" ? 500 : 0
    }).on("click", (() => 고르기(r.가구.id)));
  }
  function 거점표시(p) {
    const 쓸수있음 = p.자원.filter((x => x.가용)).length;
    const icon = L.divIcon({
      className: "",
      html: `<span class="mk-site${state.pick === p.이름 ? " on" : ""}">${esc(p.이름)} <b>${쓸수있음}/${p.자원.length}</b></span>`,
      iconSize: null,
      iconAnchor: [ 0, 14 ]
    });
    return L.marker([ p.위도, p.경도 ], {
      icon: icon,
      title: `${p.이름} 거점`,
      keyboard: true,
      zIndexOffset: 1e3
    }).on("click", (() => 고르기(p.이름)));
  }
  function 지도그리기(결과) {
    표시층.clearLayers();
    결과.forEach((r => {
      if (!r.배정) return;
      L.polyline([ [ r.배정.자원.위도, r.배정.자원.경도 ], [ r.가구.위도, r.가구.경도 ] ], {
        className: `ln ln-${r.상태.코드}`,
        weight: 2.5,
        dashArray: "6 6",
        interactive: false
      }).addTo(표시층);
    }));
    결과.forEach(((r, i) => 가구표시(r, i + 1).addTo(표시층)));
    거점들().forEach((p => 거점표시(p).addTo(표시층)));
  }
  function 범위맞추기() {
    const 점 = [ ...D.시나리오[state.scen].가구, ...D.자원 ].map((x => [ x.위도, x.경도 ]));
    지도.fitBounds(점, {
      padding: [ 30, 30 ]
    });
  }
  function 고르기(키) {
    state.pick = 키;
    그리기(false);
    if (window.matchMedia("(max-width: 1100px)").matches) $("pick").scrollIntoView({
      behavior: "smooth",
      block: "nearest"
    });
  }
  function 선택칸(결과) {
    const 비움 = '<h2 class="box-tit">선택한 곳</h2><p class="t-subtle">지도에서 가구나 거점을 누르세요.</p>';
    const r = 결과.find((x => x.가구.id === state.pick));
    if (r) {
      const g = r.가구;
      const 자원 = r.배정 ? `${esc(r.배정.자원.id)} ${esc(자원이름(r.배정.자원))} · ${esc(r.배정.자원.거점)}에서 ${길이(r.배정.도착h)} (${시각(r.배정.도착h)} 도착)` : r.상태.코드 === "ok" ? "필요 없음" : "남은 자원 없음";
      put($("pick"), `<h2 class="box-tit">${esc(g.id)} <span class="krds-badge pk-${r.상태.코드}">${판정글[r.상태.코드]}</span></h2>\n        <dl class="pick-dl">\n          <div><dt>구역</dt><dd>${esc(g.구역)}</dd></div>\n          <div><dt>기기</dt><dd>${g.기기.map((d => esc(D.기기[d].모델))).join("<br>")}</dd></div>\n          <div><dt>버티는 시간</dt><dd><strong class="${r.안전h < 1 ? "t-danger" : ""}">${길이(r.안전h)}</strong> (${등급글[g.상태.근거]} 기준)</dd></div>\n          <div><dt>보낼 자원</dt><dd>${자원}</dd></div>\n        </dl>\n        <a class="krds-btn small secondary" href="index.html">운영자 화면에서 승인하기</a>`);
      return;
    }
    const p = 거점들().find((x => x.이름 === state.pick));
    if (p) {
      const 배정 = new Map(결과.filter((x => x.배정)).map((x => [ x.배정.자원.id, x.가구.id ])));
      put($("pick"), `<h2 class="box-tit">${esc(p.이름)} 거점</h2>\n        <ul class="res-list">${p.자원.map((x => `<li class="${x.가용 ? "" : "off"}"><div class="res-top"><strong>${esc(x.id)} ${esc(자원이름(x))}</strong>\n          ${!x.가용 ? '<span class="krds-badge bg-light-gray">사용 불가</span>' : 배정.has(x.id) ? `<span class="krds-badge bg-light-primary">${esc(배정.get(x.id))} 추천</span>` : '<span class="krds-badge outline-gray">대기</span>'}</div>\n          <p class="t-subtle">${x.산소h ? `산소 ${x.산소h}시간분` : `잔량 ${x.잔량pct}%`}</p></li>`)).join("")}</ul>`);
      return;
    }
    put($("pick"), 비움);
  }
  function 대장(결과) {
    const 배정 = new Map(결과.filter((r => r.배정)).map((r => [ r.배정.자원.id, r ])));
    put($("ledgerBody"), D.자원.map((x => {
      const 원 = window.공통.원본(x.id) || x;
      const 바뀜 = 원.가용 !== x.가용 || 원.잔량pct !== x.잔량pct;
      const r = 배정.get(x.id);
      const 용량 = x.산소h ? `산소통 ${x.산소h}시간분` : `${x.용량Wh >= 1e3 ? x.용량Wh / 1e3 + "kWh" : x.용량Wh + "Wh"} · AC ${x.AC_W}W${x.DC12_W ? ` · DC12V ${x.DC12_W}W` : ""}`;
      const 잔량칸 = x.산소h ? '<span class="t-subtle">—</span>' : `<select class="krds-form-select small" data-id="${esc(x.id)}" data-k="잔량" aria-label="${esc(x.id)} 잔량">\n            ${[ 0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100 ].map((v => `<option value="${v}" ${v === x.잔량pct ? "selected" : ""}>${v}%</option>`)).join("")}\n            ${x.잔량pct % 10 ? `<option value="${x.잔량pct}" selected>${x.잔량pct}%</option>` : ""}\n          </select>`;
      const 사용칸 = `<div class="krds-form-toggle-switch medium">\n          <input type="checkbox" id="use-${esc(x.id)}" data-id="${esc(x.id)}" data-k="가용" ${x.가용 ? "checked" : ""}>\n          <label for="use-${esc(x.id)}"><span class="switch-toggle"><i></i></span><span class="sr-only">${esc(x.id)} </span>${x.가용 ? "가능" : "불가"}</label></div>`;
      const 배정칸 = !x.가용 ? `<span class="t-subtle">${esc(x.메모 || "사용 불가")}</span>` : r ? `<strong>${esc(r.가구.id)}</strong> ${esc(r.가구.구역)}<br><span class="t-subtle">${esc(r.배정.방식)} · ${길이(r.배정.도착h)} 뒤 도착</span>` : `<span class="t-subtle">대기${x.메모 ? ` · ${esc(x.메모)}` : ""}</span>`;
      return `<tr class="${바뀜 ? "changed" : ""}${x.가용 ? "" : " off"}">\n        <td><strong>${esc(x.id)}</strong> ${esc(자원이름(x))}${바뀜 ? ' <span class="krds-badge outline-primary">수정함</span>' : ""}</td>\n        <td data-label="거점">${esc(x.거점)}</td><td data-label="용량 · 출력">${용량}</td><td data-label="잔량">${잔량칸}</td>\n        <td data-label="사용">${사용칸}</td><td data-label="지금 배정"><div>${배정칸}</div></td></tr>`;
    })).join(""));
    const 부족 = 결과.filter((r => r.상태.코드 === "short")).length;
    const 줄 = [];
    if (window.공통.수정있음()) 줄.push(`<p>자원대장을 원래 값에서 바꿨습니다. 운영자 화면 배정도 바뀐 값으로 계산됩니다. <button type="button" class="krds-btn small tertiary" id="reset">원래 값으로 되돌리기</button></p>`);
    if (부족) 줄.push(`<p class="t-danger">이 시나리오에서 자원이 모자란 가구가 ${부족}곳입니다.</p>`);
    put($("ledgerAlert"), 줄.join(""));
    if ($("reset")) $("reset").onclick = () => {
      window.공통.자원초기화();
      그리기(false);
    };
    $("ledgerBody").querySelectorAll("[data-k]").forEach((el => el.onchange = () => {
      const 원 = window.공통.원본(el.dataset.id) || {};
      const 값 = el.dataset.k === "가용" ? {
        "가용": el.checked,
        "메모": el.checked && !원.가용 ? "" : 원.메모
      } : {
        "잔량pct": Number(el.value)
      };
      window.공통.자원수정(el.dataset.id, 값);
      그리기(false);
    }));
  }
  function 한전() {
    const 행들 = D.한전시군구;
    const 기준 = 행들[0].기준연월;
    const 전국 = 행들.reduce(((a, x) => a + x.가구수), 0);
    const 시도 = 행들.filter((x => x.시도 === 시연_시군구.시도)).sort(((a, b) => b.가구수 - a.가구수));
    const 시도합 = 시도.reduce(((a, x) => a + x.가구수), 0);
    const 우리 = 시도.find((x => x.시군구 === 시연_시군구.시군구));
    const 최대 = 시도[0].가구수;
    const 연월 = `${기준.slice(0, 4)}년 ${Number(기준.slice(4))}월`;
    put($("kepcoLead"), `한국전력 전기요금 복지할인(생명유지장치) 적용 가구 수, ${연월} 기준. 할인을 신청한 가구만 세므로 실제보다 적을 수 있는 최소치입니다.`);
    put($("kepcoBody"), `<ul class="kp-sum">\n        <li><span>${esc(시연_시군구.시군구)} <em>(시연 지역)</em></span><strong>${우리 ? 우리.가구수.toLocaleString() : "—"}</strong>가구</li>\n        <li><span>${esc(시연_시군구.시도)}</span><strong>${시도합.toLocaleString()}</strong>가구</li>\n        <li><span>전국</span><strong>${전국.toLocaleString()}</strong>가구</li>\n      </ul>\n      <ol class="kp-bars" aria-label="${esc(시연_시군구.시도)} 자치구별 가구 수">${시도.map((x => `\n        <li class="${x === 우리 ? "me" : ""}"><span class="kp-name">${esc(x.시군구)}</span>\n          <span class="kp-bar"><span style="width:${x.가구수 / 최대 * 100}%"></span></span>\n          <span class="kp-n">${x.가구수}</span></li>`)).join("")}</ol>\n      <p class="ev-note">출처: 한국전력공사 전력데이터개방포털 「복지할인대상」(공공데이터포털 15039293), ${연월}. 시연 가구 ${D.시나리오.wide.가구.length}곳은 이 숫자와 무관한 가상 데이터입니다.</p>`);
  }
  function 머리() {
    const s = D.시나리오[state.scen];
    const d = 발생시각();
    put($("lead"), `${d.getMonth() + 1}월 ${d.getDate()}일 ${시각(0)} 정전 · ${esc(s.이름)} · 가구 ${s.가구.length}곳 · 비상전원 거점 ${거점들().length}곳`);
    put($("scen"), Object.entries(D.시나리오).map((([k, v]) => {
      const on = k === state.scen;
      return `<li role="tab" aria-selected="${on}" class="${on ? "active" : ""}"><button type="button" class="btn-tab" data-k="${k}">${esc(v.이름)}</button></li>`;
    })).join(""));
    $("scen").querySelectorAll("button").forEach((b => b.onclick = () => {
      state.scen = b.dataset.k;
      state.pick = null;
      history.replaceState(null, "", `#${state.scen}`);
      그리기(true);
    }));
  }
  function 그리기(범위도) {
    const 결과 = 계산();
    머리();
    지도그리기(결과);
    if (범위도) 범위맞추기();
    선택칸(결과);
    대장(결과);
  }
  한전();
  그리기(true);
})();
