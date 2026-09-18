const fs = require("fs");
const path = require("path");

const file = path.join(
  process.cwd(),
  "app",
  "report",
  "meta-weekly-share",
  "page.tsx"
);

if (!fs.existsSync(file)) {
  throw new Error("파일을 찾을 수 없습니다: " + file);
}

let s = fs.readFileSync(file, "utf8");

const marker = "MODOODOC_COMPETITOR_COMPARE_20260918";

if (s.includes(marker)) {
  console.log("이미 모두닥 비교 섹션이 들어가 있습니다.");
  process.exit(0);
}

const backup =
  file +
  ".bak_modoodoc_" +
  new Date().toISOString().replace(/[:.]/g, "-");

fs.copyFileSync(file, backup);

console.log("백업 생성:");
console.log(backup);

const section = `
        {/* ${marker} */}
        <section className="mb-8">
          <div className="mb-5">
            <div className="text-xs font-bold uppercase tracking-wider text-zinc-400">
              AI SEARCH
            </div>

            <h2 className="mt-2 text-2xl font-bold">
              모두닥 경쟁 병원 비교
            </h2>

            <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-500">
              AI 검색에서 병원 정보를 찾을 때 모두닥 같은 병원 정보 사이트도
              참고될 수 있다고 해서 직접 비교해봤습니다.
              미호와 모두닥 정보가 잘 채워져 있는 병원을 비교해보니
              몇 가지 차이가 있었습니다.
            </p>
          </div>


          {/* SUMMARY CARDS */}
          <div className="mb-5 grid gap-4 md:grid-cols-3">

            <div className="rounded-2xl border border-zinc-900 bg-zinc-900 p-5 text-white shadow-sm">
              <div className="text-sm text-zinc-300">
                미호성형외과
              </div>

              <div className="mt-3 text-3xl font-bold">
                리뷰 9개
              </div>

              <div className="mt-3 text-sm leading-6 text-zinc-300">
                정보공개 미동의
                <br />
                현재 모두닥에 보이는 수술 정보가 적은 편
              </div>
            </div>


            <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
              <div className="text-sm text-zinc-500">
                디엠성형외과
              </div>

              <div className="mt-3 text-3xl font-bold">
                리뷰 74개
              </div>

              <div className="mt-3 text-sm leading-6 text-zinc-600">
                정보공개 동의
                <br />
                눈·코 수술 항목이 여러 개 등록되어 있음
              </div>
            </div>


            <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
              <div className="text-sm text-zinc-500">
                루비성형외과
              </div>

              <div className="mt-3 text-3xl font-bold">
                리뷰 110개
              </div>

              <div className="mt-3 text-sm leading-6 text-zinc-600">
                정보공개 동의
                <br />
                눈·코·리프팅 등 여러 수술 정보가 노출됨
              </div>
            </div>

          </div>


          {/* COMPARE TABLE */}
          <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
            <div className="border-b border-zinc-100 px-5 py-4">
              <div className="font-semibold">
                모두닥에서 실제로 보이는 정보 비교
              </div>

              <div className="mt-1 text-xs text-zinc-400">
                모두닥 공개 페이지 확인 기준 · 정보는 이후 변경될 수 있음
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[820px] text-sm">
                <thead className="bg-zinc-50 text-zinc-500">
                  <tr>
                    <th className="px-5 py-4 text-left font-medium">
                      확인 항목
                    </th>

                    <th className="px-5 py-4 text-left font-medium">
                      미호성형외과
                    </th>

                    <th className="px-5 py-4 text-left font-medium">
                      디엠성형외과
                    </th>

                    <th className="px-5 py-4 text-left font-medium">
                      루비성형외과
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-zinc-100">

                  <tr>
                    <td className="px-5 py-4 font-medium">
                      정보공개
                    </td>

                    <td className="px-5 py-4 font-semibold text-red-500">
                      미동의
                    </td>

                    <td className="px-5 py-4 font-semibold text-emerald-600">
                      동의
                    </td>

                    <td className="px-5 py-4 font-semibold text-emerald-600">
                      동의
                    </td>
                  </tr>


                  <tr>
                    <td className="px-5 py-4 font-medium">
                      리뷰 수
                    </td>

                    <td className="px-5 py-4">
                      9개
                    </td>

                    <td className="px-5 py-4">
                      74개
                    </td>

                    <td className="px-5 py-4">
                      110개
                    </td>
                  </tr>


                  <tr>
                    <td className="px-5 py-4 font-medium">
                      눈밑지방재배치
                    </td>

                    <td className="px-5 py-4 text-zinc-500">
                      관련 정보가 적음
                    </td>

                    <td className="px-5 py-4">
                      리뷰 26건 확인
                    </td>

                    <td className="px-5 py-4">
                      리뷰 29건 확인
                    </td>
                  </tr>


                  <tr>
                    <td className="px-5 py-4 font-medium">
                      코 관련 정보
                    </td>

                    <td className="px-5 py-4 text-zinc-500">
                      기능코·필러 위주로 보임
                    </td>

                    <td className="px-5 py-4">
                      코상담·코끝·콧대·기능코 등
                    </td>

                    <td className="px-5 py-4">
                      코 관련 여러 항목 노출
                    </td>
                  </tr>


                  <tr>
                    <td className="px-5 py-4 font-medium">
                      눈 관련 정보
                    </td>

                    <td className="px-5 py-4 text-zinc-500">
                      실제 주력 수술에 비해 적음
                    </td>

                    <td className="px-5 py-4">
                      눈밑·하안검·쌍꺼풀 등
                    </td>

                    <td className="px-5 py-4">
                      눈밑·쌍꺼풀 등 여러 항목
                    </td>
                  </tr>


                  <tr>
                    <td className="px-5 py-4 font-medium">
                      가격 / 시술 정보
                    </td>

                    <td className="px-5 py-4 text-zinc-500">
                      현재 보이는 정보가 적음
                    </td>

                    <td className="px-5 py-4">
                      여러 항목 확인 가능
                    </td>

                    <td className="px-5 py-4">
                      여러 항목 확인 가능
                    </td>
                  </tr>

                </tbody>
              </table>
            </div>
          </div>


          {/* WHAT I FOUND */}
          <div className="mt-5 grid gap-4 lg:grid-cols-2">

            <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
              <div className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                CHECK
              </div>

              <h3 className="mt-2 text-lg font-bold">
                미호는 실제 하는 수술에 비해 정보가 적습니다
              </h3>

              <div className="mt-3 space-y-2 text-sm leading-6 text-zinc-600">
                <p>
                  직접 확인해보니 미호는 실제로 광고하고 있는
                  첫코, 코재수술, 눈밑지방재배치, 하안검 같은 수술에 비해
                  모두닥에 올라가 있는 정보가 많이 적었습니다.
                </p>

                <p>
                  반면 비교한 병원들은 수술명이 세부적으로 많이 등록되어 있고
                  각 수술별 리뷰도 같이 쌓여 있었습니다.
                </p>

                <p>
                  그래서 처음 보는 사람이 모두닥만 보고 비교하면
                  미호가 어떤 수술을 주로 하는 병원인지 바로 알기 어려운 상태입니다.
                </p>
              </div>
            </div>


            <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
              <div className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                AI SEARCH
              </div>

              <h3 className="mt-2 text-lg font-bold">
                AI 검색에서도 정보가 많은 쪽이 설명하기 쉽습니다
              </h3>

              <div className="mt-3 space-y-2 text-sm leading-6 text-zinc-600">
                <p>
                  AI가 꼭 모두닥만 보고 답변한다고 볼 수는 없지만,
                  병원명과 수술명, 리뷰, 가격 같은 정보가 여러 사이트에
                  자세하게 올라가 있으면 병원을 설명할 때 참고할 정보도 많아집니다.
                </p>

                <p>
                  따라서 모두닥만 수정하는 게 아니라
                  홈페이지, 네이버, 구글, 카카오 등에 올라간 병원 정보도
                  같이 맞춰주는 방향으로 보는 게 좋겠습니다.
                </p>
              </div>
            </div>

          </div>


          {/* ACTION */}
          <div className="mt-5 rounded-2xl border border-zinc-900 bg-zinc-900 p-6 text-white shadow-sm">
            <div className="text-xs font-bold uppercase tracking-wider text-zinc-400">
              ACTION
            </div>

            <h3 className="mt-2 text-xl font-bold">
              우선 수정하면 좋을 부분
            </h3>

            <div className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-3">

              <div className="rounded-xl bg-white/5 p-4">
                <div className="text-sm font-bold">
                  01. 정보공개 확인
                </div>

                <p className="mt-2 text-sm leading-6 text-zinc-300">
                  모두닥에서 현재 정보공개 미동의로 나오기 때문에
                  병원에서 수정할 수 있는지 먼저 확인합니다.
                </p>
              </div>


              <div className="rounded-xl bg-white/5 p-4">
                <div className="text-sm font-bold">
                  02. 주력 수술 추가
                </div>

                <p className="mt-2 text-sm leading-6 text-zinc-300">
                  첫코, 코재수술, 코성형, 눈밑지방재배치,
                  하안검 등 실제 주력 수술을 더 잘 보이게 추가합니다.
                </p>
              </div>


              <div className="rounded-xl bg-white/5 p-4">
                <div className="text-sm font-bold">
                  03. 리뷰 늘리기
                </div>

                <p className="mt-2 text-sm leading-6 text-zinc-300">
                  단순히 전체 리뷰 수만 늘리기보다
                  코·눈밑·하안검처럼 수술별 리뷰가 쌓이는 게 중요합니다.
                </p>
              </div>


              <div className="rounded-xl bg-white/5 p-4">
                <div className="text-sm font-bold">
                  04. 병원 정보 확인
                </div>

                <p className="mt-2 text-sm leading-6 text-zinc-300">
                  주소, 전화번호, 진료시간, 의료진 정보가
                  현재 병원 정보와 맞는지 확인하고 수정합니다.
                </p>
              </div>


              <div className="rounded-xl bg-white/5 p-4">
                <div className="text-sm font-bold">
                  05. 가격 정보 확인
                </div>

                <p className="mt-2 text-sm leading-6 text-zinc-300">
                  모두닥에서 등록 가능한 수술이나 상담 가격이 있다면
                  실제 검색하는 수술명 기준으로 추가합니다.
                </p>
              </div>


              <div className="rounded-xl bg-white/5 p-4">
                <div className="text-sm font-bold">
                  06. 다른 채널도 같이 수정
                </div>

                <p className="mt-2 text-sm leading-6 text-zinc-300">
                  홈페이지, 네이버, 구글, 카카오에도
                  같은 수술 정보와 병원 정보가 잘 올라가 있는지 같이 확인합니다.
                </p>
              </div>

            </div>
          </div>


          {/* EASY SUMMARY */}
          <div className="mt-5 rounded-2xl border border-zinc-200 bg-zinc-50 p-5">
            <div className="text-sm font-semibold">
              한 줄 정리
            </div>

            <p className="mt-2 text-sm leading-6 text-zinc-600">
              경쟁 병원보다 미호의 모두닥 정보가 적어서,
              우선 실제로 많이 하는 코·눈밑 수술 정보를 채우고
              리뷰와 병원 기본 정보를 같이 정리하는 게 필요해 보입니다.
            </p>
          </div>

        </section>
`;

const footerIndex = s.indexOf("<footer");

if (footerIndex === -1) {
  throw new Error(
    "footer를 찾지 못했습니다. 기존 페이지는 수정하지 않았습니다."
  );
}

s =
  s.slice(0, footerIndex) +
  section +
  "\n        " +
  s.slice(footerIndex);

fs.writeFileSync(file, s, "utf8");

console.log("");
console.log("==========================================");
console.log("모두닥 경쟁 병원 비교 섹션 추가 완료");
console.log("==========================================");
console.log("미호 리뷰 9개");
console.log("디엠 리뷰 74개");
console.log("루비 리뷰 110개");
console.log("액션 6개 추가");
console.log("==========================================");
