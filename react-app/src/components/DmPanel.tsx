import { useEffect, useRef, useState } from "react";
import { useGenba } from "../context/GenbaContext";
import type { DmConversation, DmMessage, DmWorker } from "../lib/types";

function timeAgoOrTime(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  if (sameDay) {
    return d.toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" });
  }
  return d.toLocaleDateString("ja-JP", { month: "numeric", day: "numeric" });
}

export function DmPanel() {
  const [mode, setMode] = useState<"list" | "picker" | "thread">("list");
  const [activeWorker, setActiveWorker] = useState<{ id: string; name: string } | null>(null);

  if (mode === "thread" && activeWorker) {
    return (
      <DmThread
        otherWorkerId={activeWorker.id}
        otherName={activeWorker.name}
        onBack={() => {
          setMode("list");
          setActiveWorker(null);
        }}
      />
    );
  }

  if (mode === "picker") {
    return (
      <DmWorkerPicker
        onBack={() => setMode("list")}
        onPick={(w) => {
          setActiveWorker({ id: w.id, name: w.name });
          setMode("thread");
        }}
      />
    );
  }

  return (
    <DmConversationList
      onNew={() => setMode("picker")}
      onOpen={(c) => {
        setActiveWorker({ id: c.worker_id, name: c.name });
        setMode("thread");
      }}
    />
  );
}

function DmConversationList({
  onNew,
  onOpen,
}: {
  onNew: () => void;
  onOpen: (c: DmConversation) => void;
}) {
  const { loadDmConversations } = useGenba();
  const [items, setItems] = useState<DmConversation[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    void loadDmConversations().then((c) => {
      if (!cancelled) setItems(c);
    });
    return () => {
      cancelled = true;
    };
  }, [loadDmConversations]);

  return (
    <>
      <button
        type="button"
        onClick={onNew}
        className="mb-2.5 flex w-full items-center justify-center gap-1.5 rounded-2xl bg-[#06c755] py-3.5 text-sm font-extrabold text-white shadow-md shadow-[#06c755]/30"
      >
        ＋ 新しく連絡する
      </button>
      <div className="overflow-hidden rounded-2xl border border-[#e6eaee] bg-white">
        {items === null ? (
          <p className="p-6 text-center text-sm text-[#6b7280]">読込中…</p>
        ) : items.length === 0 ? (
          <p className="p-6 text-center text-sm text-[#6b7280]">
            まだ個人連絡はありません。「＋ 新しく連絡する」から職人を選んで送れます。
          </p>
        ) : (
          items.map((c) => (
            <button
              key={c.worker_id}
              type="button"
              onClick={() => onOpen(c)}
              className="flex w-full items-center gap-3 border-b border-[#f1f4f2] px-4 py-3.5 text-left last:border-b-0"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#eef6ff] text-sm font-extrabold text-[#185fa5]">
                {c.name.slice(0, 1)}
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-1.5">
                  <span className="truncate text-[13.5px] font-extrabold">{c.name}</span>
                  {c.company_name && (
                    <span className="shrink-0 text-[10.5px] font-semibold text-[#6b7280]">
                      {c.company_name}
                    </span>
                  )}
                </span>
                <span className="mt-0.5 block truncate text-xs text-[#6b7280]">
                  {c.last_body || "（メッセージなし）"}
                </span>
              </span>
              <span className="flex shrink-0 flex-col items-end gap-1">
                <span className="text-[10px] text-[#9aa4ad]">{timeAgoOrTime(c.last_at)}</span>
                {c.unread > 0 && (
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[#e8453c] px-1 text-[10px] font-extrabold text-white">
                    {c.unread > 99 ? "99+" : c.unread}
                  </span>
                )}
              </span>
            </button>
          ))
        )}
      </div>
    </>
  );
}

function DmWorkerPicker({
  onBack,
  onPick,
}: {
  onBack: () => void;
  onPick: (w: DmWorker) => void;
}) {
  const { loadDmWorkers } = useGenba();
  const [workers, setWorkers] = useState<DmWorker[] | null>(null);
  const [q, setQ] = useState("");

  useEffect(() => {
    let cancelled = false;
    void loadDmWorkers().then((w) => {
      if (!cancelled) setWorkers(w);
    });
    return () => {
      cancelled = true;
    };
  }, [loadDmWorkers]);

  const filtered = (workers ?? []).filter((w) => {
    if (!q.trim()) return true;
    const t = q.trim();
    return w.name.includes(t) || (w.company_name ?? "").includes(t);
  });

  return (
    <>
      <button
        type="button"
        onClick={onBack}
        className="mb-2 inline-flex items-center gap-1 bg-transparent px-1 py-1.5 text-[13.5px] font-bold text-[#6b7280]"
      >
        ‹ 戻る
      </button>
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="名前・会社名で検索"
        className="mb-2.5 w-full rounded-xl border border-[#e6eaee] px-3 py-3 text-[15px]"
      />
      <div className="overflow-hidden rounded-2xl border border-[#e6eaee] bg-white">
        {workers === null ? (
          <p className="p-6 text-center text-sm text-[#6b7280]">読込中…</p>
        ) : filtered.length === 0 ? (
          <p className="p-6 text-center text-sm text-[#6b7280]">該当する職人がいません</p>
        ) : (
          filtered.map((w) => (
            <button
              key={w.id}
              type="button"
              onClick={() => onPick(w)}
              className="flex w-full items-center gap-3 border-b border-[#f1f4f2] px-4 py-3.5 text-left last:border-b-0"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#eef6ff] text-sm font-extrabold text-[#185fa5]">
                {w.name.slice(0, 1)}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13.5px] font-extrabold">{w.name}</span>
                <span className="block truncate text-xs text-[#6b7280]">
                  {w.company_name ?? ""}
                  {w.trade ? `・${w.trade}` : ""}
                </span>
              </span>
            </button>
          ))
        )}
      </div>
    </>
  );
}

function DmThread({
  otherWorkerId,
  otherName,
  onBack,
}: {
  otherWorkerId: string;
  otherName: string;
  onBack: () => void;
}) {
  const { loadDmHistory, sendDm } = useGenba();
  const [messages, setMessages] = useState<DmMessage[]>([]);
  const [mine, setMine] = useState<string | undefined>();
  const [input, setInput] = useState("");
  const sinceRef = useRef<string | null>(null);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    sinceRef.current = null;
    setMessages([]);
    const poll = async () => {
      try {
        const j = await loadDmHistory(otherWorkerId, sinceRef.current);
        if (cancelled || !j.ok) return;
        setMine(j.mine);
        if (j.messages.length) {
          setMessages((prev) => (sinceRef.current ? [...prev, ...j.messages] : j.messages));
          sinceRef.current = j.messages[j.messages.length - 1].created_at;
          requestAnimationFrame(() => {
            if (boxRef.current) boxRef.current.scrollTop = boxRef.current.scrollHeight;
          });
        }
      } catch {
        /* ignore */
      }
    };
    void poll();
    const t = setInterval(poll, 5000);
    return () => {
      cancelled = true;
      clearInterval(t);
    };
  }, [loadDmHistory, otherWorkerId]);

  const handleSend = async () => {
    const v = input.trim();
    if (!v) return;
    setInput("");
    try {
      await sendDm(otherWorkerId, v);
      sinceRef.current = null;
      const j = await loadDmHistory(otherWorkerId, null);
      if (j.ok) {
        setMessages(j.messages);
        if (j.messages.length) sinceRef.current = j.messages[j.messages.length - 1].created_at;
      }
    } catch {
      setInput(v);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={onBack}
        className="mb-2 inline-flex items-center gap-1 bg-transparent px-1 py-1.5 text-[13.5px] font-bold text-[#6b7280]"
      >
        ‹ 一覧へ
      </button>
      <p className="mb-2.5 px-1 text-xs font-semibold text-[#6b7280]">{otherName} さんとの連絡</p>
      <div
        ref={boxRef}
        className="flex min-h-[280px] max-h-[54vh] flex-col gap-2 overflow-auto rounded-2xl border border-[#e6eaee] bg-white p-3"
      >
        {messages.length === 0 ? (
          <p className="py-6 text-center text-sm text-[#6b7280]">まだメッセージはありません。</p>
        ) : (
          messages.map((m) => {
            const isMine = m.sender_worker_id === mine;
            const t = new Date(m.created_at).toLocaleTimeString("ja-JP", {
              hour: "2-digit",
              minute: "2-digit",
            });
            return isMine ? (
              <div key={m.id} className="max-w-[80%] self-end">
                <div className="rounded-[14px_14px_3px_14px] bg-[#06c755] px-3 py-2 text-sm leading-snug whitespace-pre-wrap text-white">
                  {m.body}
                </div>
                <div className="mt-0.5 text-right text-[9.5px] text-[#9aa4ad]">{t}</div>
              </div>
            ) : (
              <div key={m.id} className="max-w-[82%] self-start">
                <div className="rounded-[3px_14px_14px_14px] border border-[#e6eaee] bg-white px-3 py-2 text-sm leading-snug whitespace-pre-wrap">
                  {m.body}
                </div>
                <div className="mt-0.5 ml-0.5 text-[9.5px] text-[#9aa4ad]">{t}</div>
              </div>
            );
          })
        )}
      </div>
      <div className="mt-2.5 flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && void handleSend()}
          placeholder="メッセージを入力"
          className="flex-1 rounded-xl border border-[#e6eaee] px-3 py-3 text-[15px]"
        />
        <button
          type="button"
          onClick={() => void handleSend()}
          className="rounded-2xl bg-[#06c755] px-4 py-3 text-sm font-extrabold text-white"
        >
          送信
        </button>
      </div>
    </>
  );
}
