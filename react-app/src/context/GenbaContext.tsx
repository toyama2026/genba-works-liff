import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { apiPost } from "../lib/api";
import {
  CHAT_QUICK_TEXTS,
  PHOTO_TYPE_COLORS,
  PHOTO_TYPE_LABELS,
  TRADES,
  type PhotoType,
  type SiteFilter,
} from "../lib/constants";
import {
  fmtTime,
  newIdempotencyKey,
} from "../lib/format";
import { filesToPhotos, type LocalPhoto } from "../lib/photos";
import { lastUnreported, siteById } from "../lib/site-helpers";
import type {
  ChatMessage,
  DmConversation,
  DmMessage,
  DmWorker,
  GenbaMeResponse,
  GenbaSchedule,
  GenbaSite,
  SiteTabKey,
  TabKey,
  ViewKey,
} from "../lib/types";
import { getLiffIdToken, liff } from "../liff/init";

type PunchStatus = { message: string; kind: "" | "ok" | "err" | "busy" };

type GenbaContextValue = {
  displayName: string;
  idToken: string | null;
  me: GenbaMeResponse | null;
  schedCache: GenbaSchedule[] | null;
  view: ViewKey;
  tab: TabKey;
  curSite: GenbaSite | null;
  siteTab: SiteTabKey;
  siteFilter: SiteFilter;
  siteQuery: string;
  doneOpen: boolean;
  qr: string | null;
  punchStatus: PunchStatus;
  showReg: boolean;
  regCompanies: string[];
  regBusy: boolean;
  regStatus: PunchStatus;
  chatSiteId: string | null;
  reportAlert: boolean;
  unrep: string | null;
  photos: LocalPhoto[];
  repBody: string;
  repConfirmOpen: boolean;
  repStatus: PunchStatus;
  repSiteId: string;
  repSitesLoaded: boolean;
  voiceSupported: boolean;
  voiceOn: boolean;
  aiBusy: boolean;
  setTab: (t: TabKey) => void;
  go: (v: ViewKey) => void;
  openPunch: (from?: "home" | "site") => void;
  closePunch: () => void;
  openSite: (id: string) => void;
  closeSite: () => void;
  setSiteTab: (t: SiteTabKey) => void;
  setSiteFilter: (f: SiteFilter) => void;
  setSiteQuery: (q: string) => void;
  setDoneOpen: (v: boolean) => void;
  refreshMe: () => Promise<void>;
  scanQR: () => Promise<void>;
  punch: (type: "in" | "out") => Promise<void>;
  register: (company: string, trade: string, name: string) => Promise<void>;
  setChatSiteId: (id: string | null) => void;
  loadChat: (since?: string | null, siteId?: string | null) => Promise<{
    ok: boolean;
    messages: ChatMessage[];
    mine?: string;
    site_id?: string;
    site_name?: string;
    error?: string;
  }>;
  sendChat: (body: string, siteId?: string | null) => Promise<void>;
  loadDmWorkers: () => Promise<DmWorker[]>;
  loadDmConversations: () => Promise<DmConversation[]>;
  loadDmHistory: (
    otherWorkerId: string,
    since?: string | null,
  ) => Promise<{ ok: boolean; messages: DmMessage[]; mine?: string; other_name?: string | null; error?: string }>;
  sendDm: (otherWorkerId: string, body: string) => Promise<void>;
  toggleScheduleDay: (scheduleId: string, date: string, decline: boolean) => Promise<void>;
  createSchedule: (
    siteId: string,
    start: string,
    end: string,
    trade: string,
    headcount?: number,
  ) => Promise<{ ok: boolean; error?: string }>;
  setPhotos: (p: LocalPhoto[]) => void;
  addPhotoFiles: (files: FileList | File[]) => Promise<void>;
  cyclePhotoType: (i: number) => void;
  removePhoto: (i: number) => void;
  setRepBody: (v: string) => void;
  setRepSiteId: (v: string) => void;
  setRepConfirmOpen: (v: boolean) => void;
  loadRepSites: () => Promise<GenbaSite[]>;
  aiDraft: () => Promise<void>;
  toggleVoice: () => void;
  submitReport: () => Promise<void>;
  openReportForSite: (siteId: string) => void;
  photoCounts: () => Record<PhotoType, number>;
  repSiteName: () => string;
  TRADES: readonly string[];
  CHAT_QUICK_TEXTS: readonly string[];
  PHOTO_TYPE_LABELS: typeof PHOTO_TYPE_LABELS;
  PHOTO_TYPE_COLORS: typeof PHOTO_TYPE_COLORS;
};

const GenbaContext = createContext<GenbaContextValue | null>(null);

export function useGenba() {
  const ctx = useContext(GenbaContext);
  if (!ctx) throw new Error("useGenba must be used within GenbaProvider");
  return ctx;
}

export function GenbaProvider({
  displayName,
  children,
}: {
  displayName: string;
  children: ReactNode;
}) {
  const [idToken, setIdToken] = useState<string | null>(null);
  const [me, setMe] = useState<GenbaMeResponse | null>(null);
  const [schedCache, setSchedCache] = useState<GenbaSchedule[] | null>(null);
  const [view, setView] = useState<ViewKey>("home");
  const [tab, setTabState] = useState<TabKey>("home");
  const [curSite, setCurSite] = useState<GenbaSite | null>(null);
  const [siteTab, setSiteTab] = useState<SiteTabKey>("ov");
  const [siteFilter, setSiteFilter] = useState<SiteFilter>("all");
  const [siteQuery, setSiteQuery] = useState("");
  const [doneOpen, setDoneOpen] = useState(false);
  const [qr, setQr] = useState<string | null>(null);
  const [punchBack, setPunchBack] = useState<"home" | "site">("home");
  const [punchStatus, setPunchStatus] = useState<PunchStatus>({
    message: "現場のQRコードを読み取ってください。",
    kind: "",
  });
  const [showReg, setShowReg] = useState(false);
  const [regCompanies, setRegCompanies] = useState<string[]>([]);
  const [regBusy, setRegBusy] = useState(false);
  const [regStatus, setRegStatus] = useState<PunchStatus>({ message: "", kind: "" });
  const [chatSiteId, setChatSiteId] = useState<string | null>(null);
  const [photos, setPhotos] = useState<LocalPhoto[]>([]);
  const [repBody, setRepBody] = useState("");
  const [repConfirmOpen, setRepConfirmOpen] = useState(false);
  const [repStatus, setRepStatus] = useState<PunchStatus>({
    message: "写真と作業内容を入力して提出してください。",
    kind: "",
  });
  const [repSiteId, setRepSiteId] = useState("");
  const [repSitesLoaded, setRepSitesLoaded] = useState(false);
  const [aiBusy, setAiBusy] = useState(false);
  const [voiceOn, setVoiceOn] = useState(false);
  const pendingPunch = useRef<{ type: "in" | "out"; key: string } | null>(null);
  const recRef = useRef<SpeechRecognition | null>(null);

  const voiceSupported =
    typeof window !== "undefined" &&
    !!(window.SpeechRecognition || window.webkitSpeechRecognition);

  const unrep = useMemo(() => lastUnreported(me), [me]);
  const reportAlert = !!unrep;

  const loadSchedule = useCallback(async (token: string) => {
    try {
      const j = await apiPost<{ ok: boolean; schedules?: GenbaSchedule[] }>(
        "/genba-schedule",
        { mode: "list_mine", id_token: token },
      );
      if (j.ok) setSchedCache(j.schedules ?? []);
    } catch {
      /* ignore */
    }
  }, []);

  const refreshMe = useCallback(async () => {
    const token = idToken ?? getLiffIdToken();
    if (!idToken) setIdToken(token);
    try {
      const j = await apiPost<GenbaMeResponse & { companies?: string[] }>(
        "/genba-me",
        { id_token: token },
      );
      if (!j.ok) {
        if (j.error === "worker_not_found") {
          setShowReg(true);
          setRegCompanies(j.companies ?? []);
        }
        return;
      }
      setShowReg(false);
      setMe(j);
      if (schedCache === null) await loadSchedule(token);
    } catch {
      /* ignore */
    }
  }, [idToken, schedCache, loadSchedule]);

  useEffect(() => {
    try {
      const token = getLiffIdToken();
      setIdToken(token);
      void refreshMe();
    } catch {
      /* login redirect handled in App */
    }
  }, [refreshMe]);

  const setTab = useCallback(
    (t: TabKey) => {
      setTabState(t);
      const map: Record<TabKey, ViewKey> = {
        home: "home",
        sites: "sites",
        report: "report",
        chat: "chat",
        me: "my",
      };
      setView(map[t]);
      if (t !== "sites") setCurSite(null);
    },
    [],
  );

  const go = useCallback((v: ViewKey) => {
    setView(v);
    if (v === "home") setTabState("home");
    if (v === "sites" || v === "site") setTabState("sites");
    if (v === "report") setTabState("report");
    if (v === "chat") setTabState("chat");
    if (v === "my") setTabState("me");
    if (v !== "site") setCurSite(null);
  }, []);

  const openPunch = useCallback(
    (from: "home" | "site" = "home") => {
      setPunchBack(from === "site" && curSite ? "site" : "home");
      setView("punch");
    },
    [curSite],
  );

  const closePunch = useCallback(() => {
    go(punchBack === "site" ? "site" : "home");
  }, [go, punchBack]);

  const openSite = useCallback(
    (id: string) => {
      const s = siteById(me, id);
      if (!s) return;
      setCurSite(s);
      setSiteTab("ov");
      setView("site");
      setTabState("sites");
    },
    [me],
  );

  const closeSite = useCallback(() => {
    setCurSite(null);
    go("sites");
  }, [go]);

  const scanQR = useCallback(async () => {
    const scan = (liff as unknown as { scanCodeV2?: () => Promise<{ value: string }> })
      .scanCodeV2;
    if (!scan) {
      setPunchStatus({
        message: "QRが使えません。ミニアプリ設定の「Scan QR」をONにしてください。",
        kind: "err",
      });
      return;
    }
    try {
      setPunchStatus({ message: "QRをスキャン中…", kind: "busy" });
      const r = await scan();
      setQr(r.value);
      setPunchStatus({ message: "QR読取OK。", kind: "ok" });
    } catch {
      setPunchStatus({
        message: "QR読取に失敗しました。もう一度お試しください。",
        kind: "err",
      });
    }
  }, []);

  const punch = useCallback(
    async (type: "in" | "out") => {
      const token = idToken ?? getLiffIdToken();
      if (!qr) {
        setPunchStatus({ message: "先に現場のQRコードを読み取ってください。", kind: "err" });
        return;
      }
      setPunchStatus({
        message: (type === "in" ? "入場" : "退場") + "を送信中…",
        kind: "busy",
      });
      if (!pendingPunch.current || pendingPunch.current.type !== type) {
        pendingPunch.current = { type, key: newIdempotencyKey() };
      }
      try {
        const j = await apiPost<{
          ok: boolean;
          error?: string;
          site?: string;
          attendance?: { occurred_at: string };
        }>("/punch", {
          id_token: token,
          type,
          method: "qr",
          qr_token: qr,
          idempotency_key: pendingPunch.current.key,
        });
        if (j.ok) {
          pendingPunch.current = null;
          setMe((prev) => {
            if (!prev) return prev;
            const lt = prev.today ?? {};
            if (type === "in") {
              return {
                ...prev,
                today: {
                  status: "in",
                  site_id: lt.site_id,
                  first_in: j.attendance?.occurred_at,
                  elapsed_min: 0,
                },
              };
            }
            return {
              ...prev,
              today: {
                status: "out",
                site_id: lt.site_id,
                first_in: lt.first_in ?? j.attendance?.occurred_at,
                last_out: j.attendance?.occurred_at,
              },
            };
          });
          if (type === "out") {
            setQr(null);
            setPunchStatus({
              message: "退場を記録しました。日報タブから報告を提出できます。",
              kind: "ok",
            });
            setView("report");
            setTabState("report");
          } else {
            setPunchStatus({
              message: "入場を記録しました。作業終了後は必ず退場打刻してください。",
              kind: "ok",
            });
          }
          void refreshMe();
        } else if (j.error === "worker_not_found") {
          setPunchStatus({ message: "はじめての方は登録してください。", kind: "err" });
          void refreshMe();
        } else if (j.error === "qr_invalid" || j.error === "no_qr") {
          setPunchStatus({
            message: "このQRコードは現場に登録されていません。",
            kind: "err",
          });
        } else {
          setPunchStatus({
            message: "打刻に失敗しました（" + (j.error ?? "unknown") + "）",
            kind: "err",
          });
        }
      } catch (e) {
        setPunchStatus({
          message:
            "通信エラー: 再度ボタンを押すと同じ打刻として再送されます（" +
            (e instanceof Error ? e.message : String(e)) +
            "）",
          kind: "err",
        });
      }
    },
    [idToken, qr, refreshMe],
  );

  const register = useCallback(
    async (company: string, trade: string, name: string) => {
      const token = idToken ?? getLiffIdToken();
      if (!company || !trade) {
        setRegStatus({ message: "会社と担当工事を選んでください。", kind: "err" });
        return;
      }
      setRegBusy(true);
      setRegStatus({ message: "登録中…", kind: "busy" });
      try {
        const j = await apiPost<{ ok: boolean; error?: string }>("/genba-register", {
          id_token: token,
          company_name: company,
          trade,
          name,
        });
        if (j.ok) {
          setShowReg(false);
          setPunchStatus({
            message: "登録しました。QRを読み取って打刻できます。",
            kind: "ok",
          });
          void refreshMe();
        } else {
          setRegStatus({
            message: "登録に失敗しました（" + (j.error ?? "") + "）",
            kind: "err",
          });
        }
      } catch (e) {
        setRegStatus({
          message: "通信エラー: " + (e instanceof Error ? e.message : String(e)),
          kind: "err",
        });
      } finally {
        setRegBusy(false);
      }
    },
    [idToken, refreshMe],
  );

  const loadChat = useCallback(
    async (since?: string | null, siteId?: string | null) => {
      const token = idToken ?? getLiffIdToken();
      const body: Record<string, unknown> = { mode: "list", id_token: token };
      const sid = siteId !== undefined ? siteId : chatSiteId;
      if (sid) body.site_id = sid;
      if (since) body.since = since;
      const j = await apiPost<{
        ok: boolean;
        messages: ChatMessage[];
        mine?: string;
        site_id?: string;
        site_name?: string;
        error?: string;
      }>("/genba-chat", body);
      if (j.ok && j.site_id && me) {
        setMe((prev) => {
          if (!prev?.unread?.length) return prev;
          return {
            ...prev,
            unread: prev.unread.filter((u) => u.site_id !== j.site_id),
          };
        });
      }
      return j;
    },
    [idToken, chatSiteId, me],
  );

  const sendChat = useCallback(
    async (body: string, siteId?: string | null) => {
      const token = idToken ?? getLiffIdToken();
      const sb: Record<string, unknown> = { mode: "send", id_token: token, body };
      const sid = siteId !== undefined ? siteId : chatSiteId;
      if (sid) sb.site_id = sid;
      else if (curSite) sb.site_id = curSite.id;
      await apiPost("/genba-chat", sb);
    },
    [idToken, chatSiteId, curSite],
  );

  const loadDmWorkers = useCallback(async () => {
    const token = idToken ?? getLiffIdToken();
    const j = await apiPost<{ ok: boolean; workers: DmWorker[] }>("/genba-dm", {
      mode: "workers",
      id_token: token,
    });
    return j.ok ? j.workers : [];
  }, [idToken]);

  const loadDmConversations = useCallback(async () => {
    const token = idToken ?? getLiffIdToken();
    const j = await apiPost<{ ok: boolean; conversations: DmConversation[] }>("/genba-dm", {
      mode: "list",
      id_token: token,
    });
    return j.ok ? j.conversations : [];
  }, [idToken]);

  const loadDmHistory = useCallback(
    async (otherWorkerId: string, since?: string | null) => {
      const token = idToken ?? getLiffIdToken();
      const body: Record<string, unknown> = {
        mode: "history",
        id_token: token,
        other_worker_id: otherWorkerId,
      };
      if (since) body.since = since;
      return apiPost<{
        ok: boolean;
        messages: DmMessage[];
        mine?: string;
        other_name?: string | null;
        error?: string;
      }>("/genba-dm", body);
    },
    [idToken],
  );

  const sendDm = useCallback(
    async (otherWorkerId: string, body: string) => {
      const token = idToken ?? getLiffIdToken();
      await apiPost("/genba-dm", {
        mode: "send",
        id_token: token,
        other_worker_id: otherWorkerId,
        body,
      });
    },
    [idToken],
  );

  const toggleScheduleDay = useCallback(
    async (scheduleId: string, date: string, decline: boolean) => {
      const token = idToken ?? getLiffIdToken();
      await apiPost("/genba-schedule", {
        mode: "toggle",
        id_token: token,
        schedule_id: scheduleId,
        date,
        decline,
      });
      await loadSchedule(token);
    },
    [idToken, loadSchedule],
  );

  const createSchedule = useCallback(
    async (
      siteId: string,
      start: string,
      end: string,
      trade: string,
      headcount?: number,
    ) => {
      const token = idToken ?? getLiffIdToken();
      const body: Record<string, unknown> = {
        mode: "create",
        id_token: token,
        site_id: siteId,
        trade,
        start_date: start,
        end_date: end,
      };
      if (headcount) body.headcount = headcount;
      const j = await apiPost<{ ok: boolean; error?: string }>(
        "/genba-schedule",
        body,
      );
      if (j.ok) await loadSchedule(token);
      return j;
    },
    [idToken, loadSchedule],
  );

  const photoCounts = useCallback(() => {
    const c: Record<PhotoType, number> = { before: 0, during: 0, after: 0 };
    photos.forEach((p) => {
      c[p.type]++;
    });
    return c;
  }, [photos]);

  const repSiteName = useCallback(() => {
    if (repSiteId && me?.sites) {
      const s = me.sites.find((x) => x.id === repSiteId);
      if (s) return s.name;
    }
    const t = me?.today ?? {};
    if (t.site_id) {
      const s = siteById(me, t.site_id);
      if (s) return s.name;
    }
    return "本日の打刻現場";
  }, [me, repSiteId]);

  const loadRepSites = useCallback(async () => {
    const token = idToken ?? getLiffIdToken();
    const j = await apiPost<GenbaMeResponse>("/genba-me", { id_token: token });
    const sites = (j.sites ?? []).filter((s) => s.status !== "completed");
    setRepSitesLoaded(true);
    return sites;
  }, [idToken]);

  const addPhotoFiles = useCallback(async (files: FileList | File[]) => {
    const added = await filesToPhotos(files, 6 - photos.length);
    setPhotos((prev) => [...prev, ...added].slice(0, 6));
  }, [photos.length]);

  const cyclePhotoType = useCallback((i: number) => {
    setPhotos((prev) => {
      const next = [...prev];
      const types: PhotoType[] = ["during", "before", "after"];
      const idx = types.indexOf(next[i].type);
      next[i] = { ...next[i], type: types[(idx + 1) % types.length] };
      return next;
    });
  }, []);

  const removePhoto = useCallback((i: number) => {
    setPhotos((prev) => prev.filter((_, j) => j !== i));
  }, []);

  const draftTemplate = useCallback(() => {
    const t = me?.today ?? {};
    const nm = repSiteName();
    let trade: string | null = null;
    for (const s of schedCache ?? []) {
      if (s.trade && (s.site_id === t.site_id || s.site === nm)) {
        trade = s.trade;
        break;
      }
    }
    const c = photoCounts();
    const lines: string[] = [];
    lines.push(nm + "にて" + (trade ? trade + "作業" : "本日の作業") + "を実施しました。");
    if (c.before) lines.push("着手前の状況を確認し、施工前写真" + c.before + "枚を記録しました。");
    if (c.during) lines.push("作業中の経過は施工中写真" + c.during + "枚のとおりです。");
    if (c.after) lines.push("仕上がりを確認し、完了写真" + c.after + "枚を添付しました。");
    if (t.first_in) {
      lines.push(
        "入場 " +
          fmtTime(t.first_in) +
          (t.last_out ? " / 退場 " + fmtTime(t.last_out) : "") +
          "。",
      );
    }
    lines.push("（特記事項・翌日の予定があれば追記してください）");
    return lines.join("\n");
  }, [me, schedCache, repSiteName, photoCounts]);

  const aiDraft = useCallback(async () => {
    if (repBody.trim() && !window.confirm("入力済みの作業内容を下書きで置き換えます。よろしいですか？"))
      return;
    setAiBusy(true);
    let draft: string | null = null;
    try {
      const token = idToken ?? getLiffIdToken();
      const j = await apiPost<{ ok: boolean; draft?: string }>("/genba-report-draft", {
        id_token: token,
        site: repSiteName(),
        photo_types: photos.map((p) => p.type),
        memo: repBody.trim(),
      });
      if (j.ok && j.draft) draft = j.draft;
    } catch {
      /* fallback */
    }
    setRepBody(draft ?? draftTemplate());
    setAiBusy(false);
    setRepStatus({
      message: "下書きを作成しました。内容を確認・修正してから提出してください。",
      kind: "ok",
    });
  }, [repBody, idToken, repSiteName, photos, draftTemplate]);

  const toggleVoice = useCallback(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;
    if (voiceOn) {
      try {
        recRef.current?.stop();
      } catch {
        /* ignore */
      }
      setVoiceOn(false);
      return;
    }
    const rec = new SR();
    rec.lang = "ja-JP";
    rec.interimResults = false;
    rec.continuous = true;
    rec.onresult = (ev: SpeechRecognitionEvent) => {
      let t = "";
      for (let i = ev.resultIndex; i < ev.results.length; i++) {
        if (ev.results[i].isFinal) t += ev.results[i][0].transcript;
      }
      if (t) setRepBody((prev) => (prev ? prev + "\n" + t : t));
    };
    rec.onend = () => setVoiceOn(false);
    rec.onerror = () => {
      setVoiceOn(false);
      setRepStatus({
        message: "音声入力を利用できませんでした。マイクの許可を確認してください。",
        kind: "err",
      });
    };
    try {
      rec.start();
      recRef.current = rec;
      setVoiceOn(true);
    } catch {
      setVoiceOn(false);
    }
  }, [voiceOn]);

  const submitReport = useCallback(async () => {
    const token = idToken ?? getLiffIdToken();
    const body = repBody.trim();
    if (!body && photos.length === 0) {
      setRepStatus({ message: "写真か作業内容を入力してください。", kind: "err" });
      return;
    }
    setRepStatus({ message: "提出中…", kind: "busy" });
    try {
      const j = await apiPost<{
        ok: boolean;
        error?: string;
        report?: { photos: number };
      }>("/report-submit", {
        id_token: token,
        body,
        photos,
        site_id: repSiteId || null,
      });
      if (j.ok) {
        setRepConfirmOpen(false);
        setRepStatus({
          message: "日報を提出しました（写真" + (j.report?.photos ?? 0) + "枚）。監督が確認します。",
          kind: "ok",
        });
        void refreshMe();
      } else if (j.error === "punch_first") {
        setRepConfirmOpen(false);
        setRepStatus({
          message: "本日の打刻がありません。上の「現場」を選んでから提出してください。",
          kind: "err",
        });
      } else if (j.error === "worker_not_found") {
        setRepConfirmOpen(false);
        setRepStatus({
          message: "未登録の職人です。監督に登録を依頼してください。",
          kind: "err",
        });
      } else {
        setRepStatus({
          message: "提出に失敗しました（" + (j.error ?? "unknown") + "）",
          kind: "err",
        });
      }
    } catch (e) {
      setRepStatus({
        message: "通信エラー: " + (e instanceof Error ? e.message : String(e)),
        kind: "err",
      });
    }
  }, [idToken, repBody, photos, repSiteId, refreshMe]);

  const openReportForSite = useCallback(
    (siteId: string) => {
      setRepSiteId(siteId);
      setView("report");
      setTabState("report");
    },
    [],
  );

  const value: GenbaContextValue = {
    displayName,
    idToken,
    me,
    schedCache,
    view,
    tab,
    curSite,
    siteTab,
    siteFilter,
    siteQuery,
    doneOpen,
    qr,
    punchStatus,
    showReg,
    regCompanies,
    regBusy,
    regStatus,
    chatSiteId,
    reportAlert,
    unrep,
    photos,
    repBody,
    repConfirmOpen,
    repStatus,
    repSiteId,
    repSitesLoaded,
    voiceSupported,
    voiceOn,
    aiBusy,
    setTab,
    go,
    openPunch,
    closePunch,
    openSite,
    closeSite,
    setSiteTab,
    setSiteFilter,
    setSiteQuery,
    setDoneOpen,
    refreshMe,
    scanQR,
    punch,
    register,
    setChatSiteId,
    loadChat,
    sendChat,
    loadDmWorkers,
    loadDmConversations,
    loadDmHistory,
    sendDm,
    toggleScheduleDay,
    createSchedule,
    setPhotos,
    addPhotoFiles,
    cyclePhotoType,
    removePhoto,
    setRepBody,
    setRepSiteId,
    setRepConfirmOpen,
    loadRepSites,
    aiDraft,
    toggleVoice,
    submitReport,
    openReportForSite,
    photoCounts,
    repSiteName,
    TRADES,
    CHAT_QUICK_TEXTS,
    PHOTO_TYPE_LABELS,
    PHOTO_TYPE_COLORS,
  };

  return <GenbaContext.Provider value={value}>{children}</GenbaContext.Provider>;
}
