import {
  Calendar,
  MapPin,
  MessageCircle,
  NotebookPen,
  QrCode,
  Search,
} from "lucide-react";
import { useGenba } from "../context/GenbaContext";
import {
  Card,
  GhostBtn,
  PrimaryBtn,
  Section,
} from "../components/ui/Card";
import {
  fmtMD,
  fmtTime,
  gcalUrl,
  jstToday,
} from "../lib/format";
import {
  nextSchedAfter,
  schedToday,
  siteById,
  todayPhotoShortageReport,
  unreadTotal,
} from "../lib/site-helpers";
function TodoRow({
  cls,
  children,
  onClick,
}: {
  cls: string;
  children: React.ReactNode;
  onClick?: () => void;
}) {
  const colors: Record<string, string> = {
    "todo-warn": "bg-[#fdecea] text-[#cf3a31]",
    "todo-amber": "bg-[#fff7e6] text-[#b45309]",
    "todo-info": "bg-[#eef6ff] text-[#185fa5]",
    "todo-ok": "bg-[#e7f8ef] text-[#0a8f4f]",
    "todo-mute": "bg-[#f1f4f2] text-[#6b7280]",
  };
  return (
    <div
      role={onClick ? "button" : undefined}
      onClick={onClick}
      className={`mb-2 flex items-center gap-2.5 rounded-[14px] px-3.5 py-3 text-[13.5px] font-bold leading-snug last:mb-0 ${colors[cls] ?? ""} ${onClick ? "cursor-pointer" : ""}`}
    >
      {children}
      {onClick && <span className="ml-auto shrink-0 opacity-55">›</span>}
    </div>
  );
}

export function HomePage() {
  const {
    me,
    schedCache,
    unrep,
    openPunch,
    scanQR,
    go,
    openSite,
    openReportForSite,
    setTab,
  } = useGenba();

  const today = jstToday();
  const t = me?.today ?? {};
  const hasPunch = t.status === "in" || t.status === "out";
  const th = me?.history?.find((r) => r.date === today);
  const hasReport = !!th?.has_report;
  const next = nextSchedAfter(schedCache, today);

  let stateCard: React.ReactNode;
  if (t.status === "in") {
    const s = siteById(me, t.site_id ?? "");
    const nm = s?.name ?? "現場";
    stateCard = (
      <Card className="border-[#bfebd2] bg-[#f6fdf9]">
        <span className="inline-block rounded-full bg-[#e7f8ef] px-2.5 py-0.5 text-[11px] font-extrabold text-[#0a8f4f]">
          在場中
        </span>
        <h2 className="mt-2 text-[17px] font-extrabold leading-snug">{nm}に在場中</h2>
        <p className="mt-1 text-[26px] font-extrabold tabular-nums text-[#05a847]">
          {Math.floor((t.elapsed_min ?? 0) / 60)}時間{(t.elapsed_min ?? 0) % 60}分
          <small className="ml-1.5 text-xs font-bold text-[#6b7280]">
            {fmtTime(t.first_in)} 入場
          </small>
        </p>
        {s?.address && (
          <a
            href={`https://maps.google.com/?q=${encodeURIComponent(s.address)}`}
            target="_blank"
            rel="noreferrer"
            className="mt-1.5 flex items-center gap-1 text-[12.5px] text-[#185fa5]"
          >
            <MapPin className="h-3 w-3" />
            {s.address}（地図）
          </a>
        )}
        <PrimaryBtn
          danger
          className="mt-3 py-4 text-[15px]"
          onClick={() => {
            openPunch("home");
            void scanQR();
          }}
        >
          <QrCode className="h-5 w-5" /> 退場する（QR読取）
        </PrimaryBtn>
        <GhostBtn onClick={() => setTab("report")}>日報を書く</GhostBtn>
      </Card>
    );
  } else if (t.status === "out") {
    stateCard = (
      <Card>
        <span className="inline-block rounded-full bg-[#eef1f3] px-2.5 py-0.5 text-[11px] font-extrabold text-[#6b7280]">
          退場済
        </span>
        <h2 className="mt-2 text-[17px] font-extrabold">本日の作業は終了しました</h2>
        <p className="mt-1 text-[15px] font-extrabold tabular-nums">
          {fmtTime(t.first_in)} → {fmtTime(t.last_out)}
        </p>
        <p className="mt-1 text-xs text-[#6b7280]">
          おつかれさまでした。再入場する場合はQRを読み取り直してください
        </p>
        <GhostBtn onClick={() => setTab("report")}>日報を書く</GhostBtn>
      </Card>
    );
  } else if (schedCache === null) {
    stateCard = (
      <Card>
        <p className="py-2 text-center text-sm text-[#6b7280]">確認中…</p>
      </Card>
    );
  } else {
    const sc = schedToday(schedCache);
    if (sc) {
      const st = siteById(me, sc.site_id);
      const nm2 = sc.site ?? st?.name ?? "現場";
      stateCard = (
        <Card>
          <span className="inline-block rounded-full bg-[#eef1f3] px-2.5 py-0.5 text-[11px] font-extrabold text-[#6b7280]">
            未入場
          </span>
          <h2 className="mt-2 text-[17px] font-extrabold">本日の現場があります</h2>
          <p className="mt-1.5 text-[15px] font-extrabold">
            {nm2}
            {sc.trade && (
              <span className="ml-2 text-xs font-semibold text-[#6b7280]">{sc.trade}</span>
            )}
          </p>
          {st?.address && (
            <a
              href={`https://maps.google.com/?q=${encodeURIComponent(st.address)}`}
              target="_blank"
              rel="noreferrer"
              className="mt-1.5 flex items-center gap-1 text-[12.5px] text-[#185fa5]"
            >
              <MapPin className="h-3 w-3" />
              {st.address}（地図）
            </a>
          )}
          <PrimaryBtn
            className="mt-3 py-4 text-[15px]"
            onClick={() => {
              openPunch("home");
              void scanQR();
            }}
          >
            <QrCode className="h-5 w-5" /> QRで入場する
          </PrimaryBtn>
          {st && (
            <GhostBtn onClick={() => openSite(st.id)}>現場詳細を見る</GhostBtn>
          )}
        </Card>
      );
    } else {
      stateCard = (
        <Card>
          <span className="inline-block rounded-full bg-[#eef1f3] px-2.5 py-0.5 text-[11px] font-extrabold text-[#6b7280]">
            予定なし
          </span>
          <h2 className="mt-2 text-[17px] font-extrabold text-[#6b7280]">
            本日の予定はありません
          </h2>
          <p className="mt-1 text-xs text-[#6b7280]">
            予定外の現場に入る場合は、現場を選んでQRで打刻できます
          </p>
          <PrimaryBtn className="mt-3 py-4 text-[15px]" onClick={() => go("sites")}>
            <Search className="h-4 w-4" /> 現場を探す
          </PrimaryBtn>
          <GhostBtn onClick={() => setTab("me")}>マイページを見る</GhostBtn>
        </Card>
      );
    }
  }

  const todos: React.ReactNode[] = [];
  if (unrep) {
    todos.push(
      <TodoRow key="unrep" cls="todo-warn" onClick={() => setTab("report")}>
        未提出日報を書く（{unrep === today ? "本日分" : fmtMD(unrep)}・写真と作業内容）
      </TodoRow>,
    );
  }
  const photoShortageReport = todayPhotoShortageReport(me);
  if (photoShortageReport) {
    todos.push(
      <TodoRow
        key="photo"
        cls="todo-amber"
        onClick={() => {
          if (photoShortageReport.site_id) openReportForSite(photoShortageReport.site_id);
          else setTab("report");
        }}
      >
        本日の日報に写真がありません（写真を追加してください）
      </TodoRow>,
    );
  }
  if (t.status === "in") {
    todos.push(
      <TodoRow key="out" cls="todo-warn" onClick={() => openPunch("home")}>
        退場打刻を忘れずに（QR→退場ボタン）
      </TodoRow>,
    );
  } else if (!hasPunch && schedToday(schedCache)) {
    todos.push(
      <TodoRow
        key="scan"
        cls="todo-info"
        onClick={() => {
          openPunch("home");
          void scanQR();
        }}
      >
        入場する（現場に着いたらQR読取）
      </TodoRow>,
    );
  }
  if (nextSchedAfter(schedCache, today)) {
    todos.push(
      <TodoRow key="sched" cls="todo-mute" onClick={() => go("sites")}>
        次の現場を確認
      </TodoRow>,
    );
  }
  const un = unreadTotal(me);
  if (un) {
    todos.push(
      <TodoRow key="chat" cls="todo-info" onClick={() => setTab("chat")}>
        チャットの未読を確認（{un}件）
      </TodoRow>,
    );
  }
  if (!todos.length) {
    todos.push(
      <TodoRow key="ok" cls="todo-ok">
        {hasPunch && hasReport
          ? "今日の打刻・日報は完了しています。おつかれさまです"
          : "今日のやることはありません"}
      </TodoRow>,
    );
  }

  return (
    <div className="space-y-4">
      {stateCard}

      <Section>今日やること</Section>
      <Card className="!p-3">{todos}</Card>

      {next && (
        <>
          <Section>次の予定</Section>
          <Card className="!py-3">
            <div className="flex items-center gap-2.5">
              <span className="shrink-0 rounded-xl bg-[#fff7e6] px-2.5 py-1.5 text-center text-xs font-extrabold tabular-nums text-[#b45309]">
                {parseInt(next.date.slice(5, 7), 10)}/{parseInt(next.date.slice(8, 10), 10)}
                <br />({next.date && "日月火水木金土"[new Date(`${next.date}T00:00:00+09:00`).getDay()]})
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-extrabold">{next.sched.site ?? "現場"}</span>
                {next.sched.trade && (
                  <span className="text-[11.5px] font-semibold text-[#6b7280]">
                    {next.sched.trade}
                  </span>
                )}
              </span>
              <a
                href={gcalUrl(next.sched.site ?? "現場", next.sched.start_date, next.sched.end_date)}
                target="_blank"
                rel="noreferrer"
                className="ml-auto flex shrink-0 items-center gap-1 rounded-[11px] border border-[#e6eaee] bg-white px-2.5 py-2 text-[11px] font-extrabold whitespace-nowrap text-[#185fa5]"
              >
                <Calendar className="h-3.5 w-3.5" />＋ カレンダー
              </a>
            </div>
          </Card>
        </>
      )}

      <Card className="grid grid-cols-3 gap-2 !p-3.5">
        <button
          type="button"
          onClick={() => go("sites")}
          className="flex flex-col items-center gap-1.5 rounded-[14px] border border-[#e6eaee] bg-white py-3 text-xs font-extrabold"
        >
          <Search className="h-4 w-4 text-[#05a847]" />
          現場を探す
        </button>
        <button
          type="button"
          onClick={() => setTab("report")}
          className="flex flex-col items-center gap-1.5 rounded-[14px] border border-[#e6eaee] bg-white py-3 text-xs font-extrabold"
        >
          <NotebookPen className="h-4 w-4 text-[#05a847]" />
          日報を書く
        </button>
        <button
          type="button"
          onClick={() => setTab("chat")}
          className="flex flex-col items-center gap-1.5 rounded-[14px] border border-[#e6eaee] bg-white py-3 text-xs font-extrabold"
        >
          <MessageCircle className="h-4 w-4 text-[#05a847]" />
          チャットを見る
        </button>
      </Card>
    </div>
  );
}
