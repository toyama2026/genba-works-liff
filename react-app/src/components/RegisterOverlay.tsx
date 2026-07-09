import { useState } from "react";
import { useGenba } from "../context/GenbaContext";
import { Card, PrimaryBtn, StatusBar } from "../components/ui/Card";
import { TRADES } from "../lib/constants";

export function RegisterOverlay() {
  const {
    showReg,
    regCompanies,
    regBusy,
    regStatus,
    displayName,
    register,
  } = useGenba();

  const [company, setCompany] = useState("");
  const [trade, setTrade] = useState<string>(TRADES[0]);
  const [name, setName] = useState("");

  if (!showReg) return null;

  const companies =
    regCompanies.length > 0 ? regCompanies : ["合同会社REALIFE"];

  return (
    <div className="fixed inset-0 z-30 overflow-auto bg-[#f2f5f7]">
      <div className="mx-auto max-w-[460px] px-4 py-6 pb-8">
        <div className="mb-4 mt-2 text-center">
          <div className="text-[19px] font-extrabold">はじめての方の登録</div>
          <div className="mt-1 text-[13px] text-[#6b7280]">
            会社と担当工事を選ぶだけ。承認は不要です。
          </div>
        </div>
        <Card>
          <label className="mb-1.5 block text-xs font-bold text-[#6b7280]">
            所属会社（協力会社）
          </label>
          <select
            value={company || companies[0]}
            onChange={(e) => setCompany(e.target.value)}
            className="w-full rounded-xl border border-[#e6eaee] bg-white p-3.5 text-base"
          >
            {companies.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <div className="h-3.5" />
          <label className="mb-1.5 block text-xs font-bold text-[#6b7280]">担当工事</label>
          <select
            value={trade}
            onChange={(e) => setTrade(e.target.value)}
            className="w-full rounded-xl border border-[#e6eaee] bg-white p-3.5 text-base"
          >
            {TRADES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          <div className="h-3.5" />
          <label className="mb-1.5 block text-xs font-bold text-[#6b7280]">お名前（任意）</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={
              displayName
                ? `未入力なら「${displayName}」`
                : "未入力ならLINEの名前を使用"
            }
            className="w-full rounded-xl border border-[#e6eaee] p-3 text-base"
          />
        </Card>
        <PrimaryBtn
          className="mt-4 flex-row py-4 text-base"
          disabled={regBusy}
          onClick={() => void register(company || companies[0], trade, name)}
        >
          この内容で登録して始める
        </PrimaryBtn>
        {regStatus.message && (
          <div className="mt-3.5">
            <StatusBar message={regStatus.message} kind={regStatus.kind} />
          </div>
        )}
      </div>
    </div>
  );
}
