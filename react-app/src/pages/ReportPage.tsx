import { useEffect, useState } from "react";
import { Camera, Image, Mic, Sparkles } from "lucide-react";
import { useGenba } from "../context/GenbaContext";
import {
  Card,
  GhostBtn,
  PrimaryBtn,
  Section,
  StatusBar,
} from "../components/ui/Card";
import { esc } from "../lib/format";
import type { GenbaSite } from "../lib/types";

export function ReportPage() {
  const {
    me,
    photos,
    repBody,
    repConfirmOpen,
    repStatus,
    repSiteId,
    repSitesLoaded,
    voiceSupported,
    voiceOn,
    aiBusy,
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
    photoCounts,
    repSiteName,
    PHOTO_TYPE_LABELS,
    PHOTO_TYPE_COLORS,
  } = useGenba();

  const [repSites, setRepSites] = useState<GenbaSite[]>([]);
  const t = me?.today ?? {};
  const needsSitePicker = !(t.status === "in" || t.status === "out");

  useEffect(() => {
    if (needsSitePicker && !repSitesLoaded) {
      void loadRepSites().then(setRepSites);
    } else if (repSitesLoaded && me?.sites) {
      setRepSites(me.sites.filter((s) => s.status !== "completed"));
    }
  }, [needsSitePicker, repSitesLoaded, loadRepSites, me?.sites]);

  const showConfirm = () => {
    if (!repBody.trim() && photos.length === 0) {
      return;
    }
    setRepConfirmOpen(true);
  };

  const c = photoCounts();
  const phSummary = photos.length
    ? `写真 ${photos.length}枚（施工前${c.before}・施工中${c.during}・完了${c.after}）`
    : "写真なし";

  return (
    <div>
      <Section>本日の日報</Section>

      {needsSitePicker && (
        <Card>
          <p className="mb-2.5 text-xs font-bold text-[#6b7280]">
            現場（本日の打刻が無いため選択してください）
          </p>
          <select
            value={repSiteId}
            onChange={(e) => setRepSiteId(e.target.value)}
            className="w-full rounded-xl border border-[#e6eaee] bg-white p-3 text-base"
          >
            <option value="">現場を選択…</option>
            {repSites.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </Card>
      )}

      <Card>
        <p className="mb-2.5 text-xs font-bold text-[#6b7280]">
          写真{" "}
          <span className="font-medium">
            （サムネイルのラベルをタップで 施工前/施工中/完了 を切替）
          </span>
        </p>
        <div className="flex flex-wrap gap-2.5">
          {photos.map((p, i) => (
            <div
              key={i}
              className="relative h-[122px] w-[96px] overflow-hidden rounded-xl border border-[#e6eaee]"
            >
              <img src={p.data} alt="" className="h-[88px] w-full object-cover" />
              <button
                type="button"
                onClick={() => cyclePhotoType(i)}
                className="absolute right-0 bottom-0 left-0 h-[34px] text-center text-[13px] leading-[34px] font-extrabold text-white"
                style={{ background: PHOTO_TYPE_COLORS[p.type] }}
              >
                {PHOTO_TYPE_LABELS[p.type]}
              </button>
              <button
                type="button"
                onClick={() => removePhoto(i)}
                className="absolute top-0.5 right-0.5 flex h-7 w-7 items-center justify-center rounded-full bg-[#11181bcc] text-base text-white"
              >
                ×
              </button>
            </div>
          ))}
        </div>
        <div className="mt-2.5 flex gap-2.5">
          <label className="flex flex-1 cursor-pointer flex-col items-center justify-center gap-1.5 rounded-[14px] border-[1.5px] border-dashed border-[#06c755] bg-[#f3fcf6] px-2 py-4 text-[13.5px] font-bold text-[#05a847]">
            <Camera className="h-[18px] w-[18px]" />
            カメラで撮影
            <input
              type="file"
              accept="image/*"
              capture="environment"
              multiple
              hidden
              onChange={(e) => e.target.files && void addPhotoFiles(e.target.files)}
            />
          </label>
          <label className="flex flex-1 cursor-pointer flex-col items-center justify-center gap-1.5 rounded-[14px] border-[1.5px] border-dashed border-[#94a3b8] bg-[#f8fafc] px-2 py-4 text-[13.5px] font-bold text-[#475569]">
            <Image className="h-[18px] w-[18px]" />
            アルバムから選択
            <input
              type="file"
              accept="image/*"
              multiple
              hidden
              onChange={(e) => e.target.files && void addPhotoFiles(e.target.files)}
            />
          </label>
        </div>
      </Card>

      <Card>
        <p className="mb-2.5 text-xs font-bold text-[#6b7280]">作業内容</p>
        <textarea
          value={repBody}
          onChange={(e) => setRepBody(e.target.value)}
          placeholder="例）2階廊下のコーティング下塗りまで完了。乾燥待ち。"
          className="min-h-[130px] w-full resize-none rounded-xl border border-[#e6eaee] p-3 text-base"
        />
        <div className="mt-2.5 flex gap-2">
          {voiceSupported && (
            <button
              type="button"
              onClick={toggleVoice}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-[#e6eaee] bg-white py-3 text-[12.5px] font-extrabold ${
                voiceOn ? "border-[#f6c8c4] bg-[#fdecea] text-[#cf3a31]" : ""
              }`}
            >
              <Mic className="h-4 w-4" />
              {voiceOn ? "停止（音声入力中…）" : "音声で入力"}
            </button>
          )}
          <button
            type="button"
            disabled={aiBusy}
            onClick={() => void aiDraft()}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-[#e6eaee] bg-white py-3 text-[12.5px] font-extrabold disabled:text-[#aab2b9]"
          >
            <Sparkles className="h-4 w-4" />
            {aiBusy ? "作成中…" : "AIで下書きを作成"}
          </button>
        </div>
      </Card>

      <PrimaryBtn className="flex-row py-4 text-base" onClick={showConfirm}>
        提出内容を確認する
      </PrimaryBtn>

      {repConfirmOpen && (
        <Card className="mt-3.5 border-[#bfebd2]">
          <p className="mb-2 text-xs font-extrabold text-[#6b7280]">提出内容の確認</p>
          <div className="text-[13px] leading-loose">
            <b>現場:</b> {repSiteName()}
            <br />
            <b>写真:</b> {phSummary}
            <br />
            <b>作業内容:</b>{" "}
            {repBody.trim()
              ? esc(
                  repBody.length > 60 ? repBody.slice(0, 60) + "…" : repBody,
                ) + `（${repBody.length}文字）`
              : "未入力"}
          </div>
          <PrimaryBtn
            className="mt-3 flex-row py-4 text-base"
            onClick={() => void submitReport()}
          >
            この内容で提出する
          </PrimaryBtn>
          <GhostBtn onClick={() => setRepConfirmOpen(false)}>修正する</GhostBtn>
        </Card>
      )}

      <div className="mt-3.5">
        <StatusBar message={repStatus.message} kind={repStatus.kind} />
      </div>
      <p className="mt-4 text-center text-[11px] text-[#9aa4ad]">
        提出後は監督が内容を確認します
      </p>
    </div>
  );
}
