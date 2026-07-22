import { useState } from "react";
import {
  Calendar,
  MapPin,
  MessageCircle,
  Navigation,
} from "lucide-react";
import { useGenba } from "../context/GenbaContext";
import {
  BackBtn,
  Card,
  PrimaryBtn,
  Section,
  StatusBar,
} from "../components/ui/Card";
import { ChatPanel } from "../components/ChatPanel";
import { TRADES } from "../lib/constants";
import { fmtMD, fmtTime, gcalUrl, jstToday, navUrl } from "../lib/format";
import {
  siteMeta,
  unreadFor,
  workersToday,
} from "../lib/site-helpers";
import type { SiteTabKey } from "../lib/types";

const SITE_TABS: [SiteTabKey, string][] = [
  ["ov", "概要"],
  ["photo", "写真"],
  ["plan", "図面・資料"],
  ["chat", "現場連絡"],
  ["report", "日報"],
];

export function SiteDetailPage() {
  const {
    me,
    schedCache,
    curSite,
    siteTab,
    setSiteTab,
    closeSite,
    openPunch,
    openSiteChat,
    scanQR,
    toggleScheduleDay,
    createSchedule,
    openReportForSite,
    PHOTO_TYPE_COLORS,
    PHOTO_TYPE_LABELS,
  } = useGenba();

  const [scStart, setScStart] = useState("");
  const [scEnd, setScEnd] = useState("");
  const [scTrade, setScTrade] = useState<string>(TRADES[0]);
  const [scHead, setScHead] = useState("");
  const [scStatus, setScStatus] = useState<{ message: string; kind: "" | "ok" | "err" | "busy" }>({
    message: "",
    kind: "",
  });
  const [scBusy, setScBusy] = useState(false);

  if (!curSite) return null;
  const m = siteMeta(me, schedCache, curSite);
  const t = me?.today ?? {};
  const scheds = (schedCache ?? []).filter((s) => s.site_id === curSite.id);
  const reps = (me?.reports ?? []).filter((r) => r.site_id === curSite.id);
  const hist = (me?.history ?? []).filter((r) => r.site_id === curSite.id);
  const phN = reps.reduce((n, r) => n + (r.photos?.length ?? 0), 0);
  const lastRep = reps.reduce<string | null>(
    (best, r) => (!best || r.date > best ? r.date : best),
    null,
  );

  const handleCreateSched = async () => {
    if (!scStart || !scEnd) {
      setScStatus({ message: "期間を入力してください。", kind: "err" });
      return;
    }
    if (scStart > scEnd) {
      setScStatus({ message: "終了日は開始日以降にしてください。", kind: "err" });
      return;
    }
    setScBusy(true);
    setScStatus({ message: "登録中…", kind: "busy" });
    const j = await createSchedule(
      curSite.id,
      scStart,
      scEnd,
      scTrade,
      scHead ? parseInt(scHead, 10) : undefined,
    );
    if (j.ok) {
      setScStatus({ message: "登録しました。", kind: "ok" });
    } else {
      setScStatus({ message: "登録に失敗（" + (j.error ?? "") + "）", kind: "err" });
    }
    setScBusy(false);
  };

  const chatUnread = unreadFor(me, curSite.id);

  return (
    <div className="pb-20">
      <BackBtn onClick={closeSite} label="現場一覧へ" />

      <div className="mb-3 px-1">
        <div className="text-lg leading-snug font-extrabold">
          {curSite.name}
          {m.inNow ? (
            <span className="ml-1.5 inline-block rounded-full bg-[#e7f8ef] px-2 py-0.5 text-[10px] font-extrabold text-[#0a8f4f]">
              在場中
            </span>
          ) : m.next ? (
            <span className="ml-1.5 inline-block rounded-full bg-[#fff7e6] px-2 py-0.5 text-[10px] font-extrabold text-[#b45309]">
              {m.next.date === jstToday() ? "今日" : fmtMD(m.next.date)} 予定
            </span>
          ) : null}
        </div>
        {curSite.address && (
          <>
            <a
              href={`https://maps.google.com/?q=${encodeURIComponent(curSite.address)}`}
              target="_blank"
              rel="noreferrer"
              className="mt-1 inline-flex items-center gap-1 text-[12.5px] text-[#185fa5]"
            >
              <MapPin className="h-3 w-3" />
              {curSite.address}（地図）
            </a>
            <div>
              <a
                href={navUrl(curSite.address)}
                target="_blank"
                rel="noreferrer"
                className="mt-2 inline-flex items-center gap-1 rounded-[11px] border border-[#cfe3fa] bg-[#eef6ff] px-3 py-2 text-xs font-extrabold text-[#2563eb]"
              >
                <Navigation className="h-3.5 w-3.5" /> ナビを開始
              </a>
            </div>
          </>
        )}
      </div>

      <div className="mb-3.5 flex gap-1.5 overflow-x-auto">
        {SITE_TABS.map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setSiteTab(key)}
            className={`shrink-0 rounded-full px-4 py-2.5 text-[13px] font-bold ${
              siteTab === key
                ? "bg-[#06c755] text-white"
                : "bg-white text-[#6b7280] shadow-[inset_0_0_0_1px_#e6eaee]"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {siteTab === "ov" && (
        <>
          {t.site_id === curSite.id && t.status === "in" && (
            <div className="mb-3 rounded-[14px] bg-[#e7f8ef] px-3.5 py-3 text-[13.5px] font-bold text-[#0a8f4f]">
              この現場に在場中（{Math.floor((t.elapsed_min ?? 0) / 60)}時間
              {(t.elapsed_min ?? 0) % 60}分）
            </div>
          )}
          {workersToday(me, curSite.id) > 0 && (
            <div className="mb-3 rounded-[14px] bg-[#eef6ff] px-3.5 py-3 text-[13.5px] font-bold text-[#185fa5]">
              今日の職人：{workersToday(me, curSite.id)}人
            </div>
          )}
          <PrimaryBtn
            className="mb-3.5 py-4 text-[15px]"
            onClick={() => {
              openPunch("site");
              void scanQR();
            }}
          >
            この現場で打刻する（QR読取）
          </PrimaryBtn>

          <Section>工程（入らない日はタップで切替）</Section>
          <Card className="!p-3.5">
            {!scheds.length ? (
              <p className="py-1.5 text-center text-sm text-[#6b7280]">予定はありません</p>
            ) : (
              scheds.map((s, i) => (
                <div
                  key={s.id}
                  className={i > 0 ? "mt-3 border-t border-[#eef1f3] pt-3" : ""}
                >
                  <div className="text-sm font-extrabold">
                    {fmtMD(s.start_date)}〜{fmtMD(s.end_date)}
                    {s.trade ? "　" + s.trade : ""}
                    {s.headcount ? "　" + s.headcount + "名" : ""}
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {(s.days ?? []).map((d) => {
                      const dec = d.status === "declined";
                      return (
                        <button
                          key={d.date}
                          type="button"
                          onClick={() => void toggleScheduleDay(s.id, d.date, !dec)}
                          className="cursor-pointer rounded-[11px] px-3 py-2.5 text-[13px] font-bold"
                          style={{
                            background: dec ? "#fdecea" : "#e7f8ef",
                            color: dec ? "#cf3a31" : "#0a8f4f",
                          }}
                        >
                          {fmtMD(d.date)}
                          {dec ? " 入らない" : ""}
                        </button>
                      );
                    })}
                  </div>
                  <a
                    href={gcalUrl(curSite.name, s.start_date, s.end_date)}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 inline-flex items-center gap-1 text-[12.5px] font-bold text-[#185fa5]"
                  >
                    <Calendar className="h-3.5 w-3.5" /> ＋ スマホのカレンダーに追加
                  </a>
                </div>
              ))
            )}
          </Card>

          <Section>最近の動き</Section>
          <Card className="!p-2.5">
            {[
              ["報告写真 " + phN + "枚", "photo"] as const,
              [
                lastRep ? "日報 " + fmtMD(lastRep) + " 提出" : "日報 まだ提出がありません",
                "report",
              ] as const,
              [
                "この現場の連絡を開く" +
                  (unreadFor(me, curSite.id)
                    ? "（未読" + unreadFor(me, curSite.id) + "件）"
                    : ""),
                "chat",
              ] as const,
            ].map(([txt, pane]) => (
              <div
                key={pane}
                role="button"
                onClick={() => {
                  if (pane === "chat") openSiteChat(curSite.id);
                  else setSiteTab(pane);
                }}
                className="mb-2 flex cursor-pointer items-center rounded-[14px] bg-[#f1f4f2] px-3.5 py-3 text-[13.5px] font-bold text-[#6b7280] last:mb-0"
              >
                {txt}
                <span className="ml-auto opacity-55">›</span>
              </div>
            ))}
          </Card>

          <Section>この現場に予定を登録</Section>
          <Card className="!p-3.5">
            <div className="flex gap-2.5">
              <div className="flex-1">
                <label className="mb-1.5 block text-xs font-bold text-[#6b7280]">開始日</label>
                <input
                  type="date"
                  value={scStart}
                  onChange={(e) => setScStart(e.target.value)}
                  className="w-full rounded-[11px] border border-[#e6eaee] p-2.5 text-base"
                />
              </div>
              <div className="flex-1">
                <label className="mb-1.5 block text-xs font-bold text-[#6b7280]">終了日</label>
                <input
                  type="date"
                  value={scEnd}
                  onChange={(e) => setScEnd(e.target.value)}
                  className="w-full rounded-[11px] border border-[#e6eaee] p-2.5 text-base"
                />
              </div>
            </div>
            <div className="mt-2.5 flex gap-2.5">
              <div className="flex-1">
                <label className="mb-1.5 block text-xs font-bold text-[#6b7280]">担当工事</label>
                <select
                  value={scTrade}
                  onChange={(e) => setScTrade(e.target.value)}
                  className="w-full rounded-[11px] border border-[#e6eaee] bg-white p-2.5 text-base"
                >
                  {TRADES.map((x) => (
                    <option key={x}>{x}</option>
                  ))}
                </select>
              </div>
              <div className="w-[84px] shrink-0">
                <label className="mb-1.5 block text-xs font-bold text-[#6b7280]">人数</label>
                <input
                  type="number"
                  inputMode="numeric"
                  value={scHead}
                  onChange={(e) => setScHead(e.target.value)}
                  className="w-full rounded-[11px] border border-[#e6eaee] p-2.5 text-base"
                />
              </div>
            </div>
            <PrimaryBtn
              className="mt-3 py-4 text-base"
              disabled={scBusy}
              onClick={() => void handleCreateSched()}
            >
              予定を登録
            </PrimaryBtn>
            {scStatus.message && (
              <div className="mt-3">
                <StatusBar message={scStatus.message} kind={scStatus.kind} />
              </div>
            )}
          </Card>
        </>
      )}

      {siteTab === "photo" && (
        <>
          <Section>報告写真（直近）</Section>
          <Card>
            {phN === 0 ? (
              <p className="py-1.5 text-center text-sm text-[#6b7280]">
                まだ写真はありません。日報で提出した写真がここに表示されます。
              </p>
            ) : (
              <div className="flex flex-wrap gap-2.5">
                {reps
                  .flatMap((r) =>
                    (r.photos ?? []).map((p) => ({ ...p, date: r.date })),
                  )
                  .slice(0, 24)
                  .map((p, i) => (
                    <span
                      key={i}
                      className="relative h-[92px] w-[92px] overflow-hidden rounded-xl border border-[#e6eaee]"
                    >
                      <img src={p.url} alt="" className="h-full w-full object-cover" loading="lazy" />
                      <span
                        className="absolute right-0 bottom-0 left-0 h-[18px] text-center text-[9.5px] leading-[18px] font-extrabold text-white"
                        style={{
                          background: PHOTO_TYPE_COLORS[p.type] ?? "#0a8f4f",
                        }}
                      >
                        {(PHOTO_TYPE_LABELS[p.type] ?? "施工中") + " " + fmtMD(p.date)}
                      </span>
                    </span>
                  ))}
              </div>
            )}
          </Card>
        </>
      )}

      {siteTab === "plan" && (
        <>
          <Section>図面・資料</Section>
          <Card className="py-7 text-center">
            <p className="text-sm font-bold text-[#6b7280]">図面はまだ登録されていません</p>
            <p className="mt-1.5 text-xs text-[#9aa4ad]">
              監督が管理画面から図面を登録すると、ここに表示されます（準備中）
            </p>
          </Card>
        </>
      )}

      {siteTab === "chat" && (
        <ChatPanel siteId={curSite.id} siteName={curSite.name} />
      )}

      {siteTab === "report" && (
        <>
          <PrimaryBtn
            className="mb-3.5 py-4 text-[15px]"
            onClick={() => openReportForSite(curSite.id)}
          >
            この現場の日報を出す
          </PrimaryBtn>
          <Section>提出済みの日報</Section>
          <Card className="!p-3.5">
            {!reps.length ? (
              <p className="py-1.5 text-center text-sm text-[#6b7280]">まだ日報はありません</p>
            ) : (
              reps.slice(0, 10).map((r, i) => (
                <div
                  key={r.date}
                  className={i > 0 ? "mt-2.5 border-t border-[#eef1f3] pt-2.5" : ""}
                >
                  <div className="text-[13.5px] font-extrabold">
                    {fmtMD(r.date)}{" "}
                    <span className="text-xs font-semibold text-[#6b7280]">
                      写真{(r.photos ?? []).length}枚
                    </span>
                  </div>
                  {r.body && (
                    <div className="mt-0.5 text-[12.5px] leading-snug text-[#6b7280]">
                      {r.body}
                    </div>
                  )}
                </div>
              ))
            )}
          </Card>
          <Section>この現場の出面履歴</Section>
          <Card>
            {!hist.length ? (
              <p className="py-1.5 text-center text-sm text-[#6b7280]">まだ記録がありません</p>
            ) : (
              hist.slice(0, 15).map((r) => {
                const color = r.last_out
                  ? "#0a8f4f"
                  : r.first_in
                    ? "#06c755"
                    : "#cbd2d8";
                return (
                  <div
                    key={r.date}
                    className="flex items-center gap-3 border-b border-[#eef1f3] py-3 last:border-0"
                  >
                    <span className="w-[50px] text-sm font-extrabold">
                      {parseInt(r.date.slice(5, 7), 10)}/{parseInt(r.date.slice(8, 10), 10)}
                    </span>
                    <span
                      className="h-2 w-2 shrink-0 rounded-full"
                      style={{ background: color }}
                    />
                    <span className="text-[13px] tabular-nums text-[#6b7280]">
                      {fmtTime(r.first_in)} → {r.last_out ? fmtTime(r.last_out) : "在場中"}
                    </span>
                    <span
                      className={`ml-auto rounded-full px-2 py-0.5 text-[10.5px] font-extrabold ${
                        r.has_report
                          ? "bg-[#e7f8ef] text-[#0a8f4f]"
                          : "bg-[#fdecea] text-[#e8453c]"
                      }`}
                    >
                      {r.has_report ? "日報済" : "日報未"}
                    </span>
                  </div>
                );
              })
            )}
          </Card>
        </>
      )}

      {/* KANNA-style sticky chat CTA — always visible on site detail */}
      <div className="pointer-events-none fixed bottom-[calc(4rem+env(safe-area-inset-bottom))] left-1/2 z-20 w-full max-w-[460px] -translate-x-1/2 px-4 pb-2">
        <button
          type="button"
          onClick={() => openSiteChat(curSite.id)}
          className="pointer-events-auto flex w-full items-center justify-center gap-2 rounded-2xl bg-[#06c755] py-4 text-[16px] font-extrabold text-white shadow-lg shadow-[#06c755]/35"
        >
          <MessageCircle className="h-5 w-5" strokeWidth={2.4} />
          チャット
          {chatUnread > 0 ? `（未読${chatUnread}件）` : ""}
        </button>
      </div>
    </div>
  );
}
