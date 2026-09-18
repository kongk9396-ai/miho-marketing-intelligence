const fs = require("fs");

const path = "./app/report/meta-weekly-share/page.tsx";
let s = fs.readFileSync(path, "utf8");

const marker = `        <section className="mt-7 grid gap-4 md:grid-cols-3">`;

const block = `
        <section className="mt-7">
          <div className="mb-4">
            <h2 className="text-lg font-bold">영상 · 랜딩 반응</h2>
            <p className="mt-1 text-sm text-gray-500">
              2026-08-31 ~ 2026-09-06 기준
            </p>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-2xl border border-gray-200 bg-white p-5">
              <p className="text-xs font-bold text-violet-600">
                🎬 영상 완주율 TOP
              </p>

              <div className="mt-4 space-y-4">
                {[
                  {
                    name: "눈밑지_최선다해2",
                    views3: 1173,
                    complete: 344,
                    rate: 29.3
                  },
                  {
                    name: "눈밑지_최선다해1",
                    views3: 531,
                    complete: 155,
                    rate: 29.2
                  }
                ].map((v, index) => (
                  <div
                    key={v.name}
                    className="rounded-xl border border-gray-100 bg-gray-50 p-4"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-xs text-gray-400">
                          {index === 0 ? "1위" : "2위"}
                        </p>
                        <p className="mt-1 font-semibold">{v.name}</p>
                      </div>

                      <p className="text-xl font-bold text-violet-700">
                        {v.rate.toFixed(1)}%
                      </p>
                    </div>

                    <p className="mt-2 text-sm text-gray-500">
                      3초 시청 {v.views3.toLocaleString("ko-KR")}회 →
                      100% 완주 {v.complete.toLocaleString("ko-KR")}회
                    </p>
                  </div>
                ))}
              </div>

              <p className="mt-4 text-xs leading-5 text-gray-400">
                3초 이상 시청자 대비 100% 완주 기준
              </p>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-5">
              <p className="text-xs font-bold text-blue-600">
                🌐 랜딩 도달률 TOP
              </p>

              <div className="mt-4 space-y-3">
                {[
                  {
                    name: "눈밑지_최선다해2",
                    click: 118,
                    lpv: 108,
                    rate: 91.5
                  },
                  {
                    name: "260814_남자코",
                    click: 52,
                    lpv: 45,
                    rate: 86.5
                  },
                  {
                    name: "눈밑지_최선다해1",
                    click: 59,
                    lpv: 51,
                    rate: 86.4
                  },
                  {
                    name: "A_첫코_릴스_소재A",
                    click: 19,
                    lpv: 15,
                    rate: 78.9
                  }
                ].map((v, index) => (
                  <div
                    key={v.name}
                    className="flex items-center justify-between gap-4 rounded-xl border border-gray-100 bg-gray-50 p-4"
                  >
                    <div>
                      <p className="text-xs text-gray-400">{index + 1}위</p>
                      <p className="mt-1 font-semibold">{v.name}</p>
                      <p className="mt-1 text-xs text-gray-500">
                        클릭 {v.click} → LPV {v.lpv}
                      </p>
                    </div>

                    <p className="text-xl font-bold text-blue-700">
                      {v.rate.toFixed(1)}%
                    </p>
                  </div>
                ))}
              </div>

              <p className="mt-4 text-xs leading-5 text-gray-400">
                링크 클릭 대비 실제 랜딩 페이지 조회 기준
              </p>
            </div>
          </div>

          <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-5">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-xs font-bold text-red-500">
                  ⚠️ 확인 필요
                </p>
                <h3 className="mt-2 text-lg font-bold">
                  코재수술_0831
                </h3>
                <p className="mt-2 text-sm leading-6 text-gray-700">
                  링크 클릭 294회 대비 랜딩 페이지 조회가 5회로,
                  랜딩 도달률이 1.7%에 불과합니다.
                </p>
              </div>

              <div className="rounded-xl bg-white px-5 py-4 text-center shadow-sm">
                <p className="text-xs text-gray-500">랜딩 도달률</p>
                <p className="mt-1 text-3xl font-bold text-red-500">
                  1.7%
                </p>
              </div>
            </div>

            <p className="mt-3 text-xs leading-5 text-red-700">
              링크 연결, 랜딩 로딩, URL 설정 또는 집계 상태를 우선 확인할 필요가 있습니다.
            </p>
          </div>
        </section>

`;

if (s.includes("영상 · 랜딩 반응")) {
  console.log("이미 영상/랜딩 섹션이 있습니다.");
} else {
  if (!s.includes(marker)) {
    throw new Error("삽입 위치를 찾지 못했습니다.");
  }

  s = s.replace(marker, block + marker);
  fs.writeFileSync(path, s, "utf8");

  console.log("✅ 영상 완주율 + 랜딩 도달률 화면 추가 완료");
}
