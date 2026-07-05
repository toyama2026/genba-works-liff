import { Check, MapPin, QrCode } from "lucide-react";
import { useGenba } from "../context/GenbaContext";
import {
  BackBtn,
  Card,
  PrimaryBtn,
  StatusBar,
} from "../components/ui/Card";
import { fmtTime } from "../lib/format";
import { siteById } from "../lib/site-helpers";

export function PunchPage() {
  const {
    me,
    qr,
    punchStatus,
    closePunch,
    scanQR,
    punch,
    setTab,
  } = useGenba();

  const t = me?.today ?? {};
  const scanned = !!qr;
  const inDone = t.status === "in" || t.status === "out";
  const outDone = t.status === "out";
  const hourJST = parseInt(
    new Date().toLocaleTimeString("ja-JP", {
      timeZone: "Asia/Tokyo",
      hour: "2-digit",
      hour12: false,
    }),
    10,
  );
  const showRemind = t.status === "in" && hourJST >= 17;
  const showOutSummary = t.status === "out" && !qr;

  let inDisabled = true;
  let outDisabled = true;
  let hint = "先にQRコードを読み取ってください";
  if (qr) {
    if (t.status === "in") {
      inDisabled = true;
      outDisabled = false;
      hint = "帰るときは「退場」を押してください";
    } else {
      inDisabled = false;
      outDisabled = true;
      hint = "「入場」を押してください（未入場のため退場は押せません）";
    }
  }

  const siteName = qr
    ? "読取済み（打刻できます）"
    : t.site_id && t.status === "in"
      ? siteById(me, t.site_id)?.name ?? "現場"
      : "QR未読取";

  const steps = [
    { state: scanned || inDone ? "done" : "on", num: "1", label: "QR読取" },
    {
      state: inDone ? "done" : scanned ? "on" : "",
      num: "2",
      label: inDone ? "入場 " + fmtTime(t.first_in) : "入場",
    },
    {
      state: outDone ? "done" : t.status === "in" ? "on" : "",
      num: "3",
      label: outDone ? "退場 " + fmtTime(t.last_out) : "退場",
    },
  ];

  let stayHours = "0h";
  if (t.first_in && t.last_out) {
    const mins = Math.max(
      0,
      (new Date(t.last_out).getTime() - new Date(t.first_in).getTime()) / 60000,
    );
    stayHours = String(Math.round(mins / 6) / 10) + "h";
  }

  return (
    <div>
      <BackBtn onClick={closePunch} label="戻る" />

      <div className="mb-2 flex items-center px-1.5 pt-0.5">
        {steps.map((s, i) => (
          <div key={s.num} className="flex flex-1 items-center">
            <div className="flex w-[72px] shrink-0 flex-col items-center gap-1">
              <span
                className={`flex h-[30px] w-[30px] items-center justify-center rounded-full text-xs font-extrabold ${
                  s.state === "done"
                    ? "bg-[#e7f8ef] text-[#0a8f4f]"
                    : s.state === "on"
                      ? "bg-[#06c755] text-white"
                      : "bg-[#e9edf0] text-[#aab2b9]"
                }`}
              >
                {s.state === "done" ? "✓" : s.num}
              </span>
              <span
                className={`text-[9.5px] font-extrabold whitespace-nowrap ${
                  s.state ? "text-[#05a847]" : "text-[#aab2b9]"
                }`}
              >
                {s.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <span
                className={`mb-4 h-[3px] flex-1 rounded-sm ${
                  (i === 0 && (scanned || inDone)) || (i === 1 && inDone)
                    ? "bg-[#06c755]"
                    : "bg-[#e9edf0]"
                }`}
              />
            )}
          </div>
        ))}
      </div>

      <Card>
        <div className={`flex items-center gap-3.5 ${qr ? "" : ""}`}>
          <div
            className={`flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-[15px] ${
              qr ? "bg-[#e7f8ef] text-[#0a8f4f]" : "bg-[#f0f3f5] text-[#6b7280]"
            }`}
          >
            {qr ? <Check className="h-6 w-6" /> : <MapPin className="h-6 w-6" />}
          </div>
          <div>
            <p className="text-xs font-semibold text-[#6b7280]">現場</p>
            <p
              className={`mt-0.5 leading-tight font-extrabold ${
                qr ? "text-lg" : "text-[15px] text-[#6b7280]"
              }`}
            >
              {siteName}
            </p>
          </div>
        </div>
        {t.status === "in" && (
          <p className="mt-2 text-center text-[26px] font-extrabold tabular-nums text-[#05a847]">
            {Math.floor((t.elapsed_min ?? 0) / 60)}時間{(t.elapsed_min ?? 0) % 60}分
            <small className="ml-1.5 text-xs font-bold text-[#6b7280]">
              在場中 ・ {fmtTime(t.first_in)} 入場
            </small>
          </p>
        )}
        <PrimaryBtn className="mt-3.5 py-5" onClick={() => void scanQR()}>
          <QrCode className="h-5 w-5" />
          {qr ? "別のQRを読み直す" : "QRコードを読み取る"}
        </PrimaryBtn>
      </Card>

      {showRemind && (
        <div className="mb-4 flex items-start gap-2 rounded-[14px] border border-[#f5d98a] bg-[#fff7e6] px-3.5 py-3 text-xs font-bold leading-snug text-[#b45309]">
          17時を過ぎています。退場打刻を忘れていませんか？
        </div>
      )}

      {!showOutSummary ? (
        <Card>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              disabled={inDisabled}
              onClick={() => void punch("in")}
              className="flex flex-col items-center gap-1.5 rounded-2xl bg-[#06c755] py-5 text-white shadow-md shadow-[#06c755]/30 disabled:bg-[#e9edf0] disabled:text-[#aab2b9] disabled:shadow-none"
            >
              <span className="text-[17px] font-extrabold">入場する</span>
            </button>
            <button
              type="button"
              disabled={outDisabled}
              onClick={() => void punch("out")}
              className="flex flex-col items-center gap-1.5 rounded-2xl bg-[#e8453c] py-5 text-white shadow-md shadow-[#e8453c]/30 disabled:bg-[#e9edf0] disabled:text-[#aab2b9] disabled:shadow-none"
            >
              <span className="text-[17px] font-extrabold">退場する</span>
            </button>
          </div>
          <p className="mt-2.5 text-center text-[11.5px] text-[#6b7280]">{hint}</p>
        </Card>
      ) : (
        <Card>
          <div className="flex items-center justify-center gap-3.5 py-1.5 tabular-nums">
            <div className="text-center">
              <div className="text-xl font-extrabold">{fmtTime(t.first_in)}</div>
              <div className="text-[10px] font-bold text-[#6b7280]">入場</div>
            </div>
            <span className="text-[#cbd2d8]">→</span>
            <div className="text-center">
              <div className="text-xl font-extrabold">{fmtTime(t.last_out)}</div>
              <div className="text-[10px] font-bold text-[#6b7280]">退場</div>
            </div>
            <span className="text-[#cbd2d8]">＝</span>
            <div className="text-center">
              <div className="text-xl font-extrabold">{stayHours}</div>
              <div className="text-[10px] font-bold text-[#6b7280]">滞在</div>
            </div>
          </div>
          <p className="mt-2 text-center text-[11.5px] text-[#6b7280]">
            おつかれさまでした。記録済みです。再入場する場合はQRを読み取り直してください
          </p>
          <PrimaryBtn className="mt-3 py-3.5 text-sm" onClick={() => setTab("report")}>
            日報を書く
          </PrimaryBtn>
        </Card>
      )}

      <StatusBar message={punchStatus.message} kind={punchStatus.kind} />
      <p className="mt-4 text-center text-[11px] text-[#9aa4ad]">
        公式LINEミニアプリ ・ 打刻はSupabaseへ記録
      </p>
    </div>
  );
}
