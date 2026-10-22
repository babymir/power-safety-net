window.라벨 = (() => {
  const 엔진경로 = "vendor/tesseract/";
  const 규칙 = {
    M01: [ /astral/ ],
    M02: [ /trilogyevo/, /ev300/ ],
    M03: [ /trilogy(100|200|202)/ ],
    M04: [ /stellar/ ],
    M05: [ /puritanbennett560/, /pb560/ ],
    M06: [ /prismavent/ ],
    M07: [ /vivo45/ ],
    M08: [ /vivo65/ ],
    M09: [ /vivo50/ ],
    M10: [ /everflo/ ],
    M11: [ /oxus502/ ],
    M12: [ /525ds/ ],
    M13: [ /inogenoneg5/, /oneg5/ ],
    M14: [ /inogenoneg3/, /oneg3/ ],
    M15: [ /inogenoneg4/, /oneg4/ ],
    M16: [ /simplygo(?!mini)/ ],
    M17: [ /coughassist/, /e70/ ],
    M18: [ /comfortcough/ ],
    M19: [ /7305/ ],
    M20: [ /askir/ ],
    M21: [ /js20r/ ],
    M22: [ /js20(?!r)/ ],
    M23: [ /rove6/ ],
    M24: [ /zeno/ ],
    M25: [ /eclipse5/ ],
    M26: [ /옥시저네이트/ ],
    M27: [ /visionaire/ ],
    M28: [ /o24\.0/, /o240/ ]
  };
  const 계산기기 = {
    M01: "D01",
    M02: "D02",
    M04: "D04",
    M05: "D05",
    M07: "D07",
    M08: "D08",
    M10: "D10",
    M11: "D11",
    M13: "D13",
    M16: "D16",
    M17: "D17",
    M19: "D18",
    M20: "D19"
  };
  const 모델이름 = {
    M03: "Philips Trilogy 100/200",
    M06: "Löwenstein prisma VENT",
    M09: "Breas Vivo 50",
    M12: "Drive DeVilbiss 525DS",
    M14: "Inogen One G3",
    M15: "Inogen One G4",
    M18: "서일퍼시픽 Comfort Cough II",
    M21: "조인메디칼 JS20R",
    M22: "조인메디칼 JS20",
    M23: "Inogen ROVE 6",
    M24: "GCE Zen-O lite",
    M25: "CAIRE Eclipse 5",
    M26: "옥시저네이트 5",
    M27: "CAIRE VisionAire",
    M28: "Kröber O2 4.0"
  };
  function 고르기(글) {
    const t = 글.toLowerCase();
    const 붙임 = t.replace(/[\s\-_·:.,/()]/g, ""), 점유지 = t.replace(/[\s\-_·:,/()]/g, "");
    const 맞음 = Object.keys(규칙).filter((m => 규칙[m].some((p => p.test(붙임) || p.test(점유지)))));
    if (맞음.length !== 1) return {
      "결과": 맞음.length ? "여러개" : "없음",
      "후보": 맞음
    };
    const m = 맞음[0];
    return 계산기기[m] ? {
      "결과": "찾음",
      "기기": 계산기기[m]
    } : {
      "결과": "목록밖",
      "이름": 모델이름[m] || m
    };
  }
  let 작업자 = null;
  async function 준비(진행) {
    if (작업자) return 작업자;
    if (!window.Tesseract) throw new Error("글자 인식 엔진 파일(vendor/tesseract/)을 읽지 못했습니다");
    if (location.protocol === "file:") throw new Error("파일을 바로 연 상태에서는 글자 인식이 동작하지 않습니다. 배포 주소나 로컬 서버로 열어 주세요");
    작업자 = await Tesseract.createWorker("eng", 1, {
      workerPath: 엔진경로 + "worker.min.js",
      corePath: 엔진경로,
      langPath: 엔진경로 + "lang",
      logger: m => 진행 && 진행(m.status, m.progress)
    }).catch((e => {
      작업자 = null;
      throw new Error(`글자 인식 엔진을 준비하지 못했습니다: ${e.message || e}`);
    }));
    await 작업자.setParameters({
      tessedit_pageseg_mode: "11"
    });
    return 작업자;
  }
  function 다듬기(원본, 영역, angle) {
    const 배 = Math.max(영역.w, 영역.h) < 1600 ? 2 : 1;
    const c = document.createElement("canvas");
    c.width = 영역.w * 배;
    c.height = 영역.h * 배;
    const g = c.getContext("2d");
    if (angle === 180) {
      g.translate(c.width, c.height);
      g.rotate(Math.PI);
    }
    g.filter = "grayscale(1)";
    g.drawImage(원본, 영역.x, 영역.y, 영역.w, 영역.h, 0, 0, c.width, c.height);
    return c;
  }
  async function 읽기(원본, 영역, 진행) {
    const w = await 준비(진행);
    let 글 = "";
    for (const angle of [ 0, 180 ]) {
      진행 && 진행(angle ? "뒤집어서 한 번 더 읽는 중" : "글자 읽는 중", null);
      const r = await w.recognize(다듬기(원본, 영역, angle));
      글 += "\n" + r.data.text;
    }
    return {
      ...고르기(글),
      "글": 글
    };
  }
  return {
    "읽기": 읽기,
    "고르기": 고르기
  };
})();
