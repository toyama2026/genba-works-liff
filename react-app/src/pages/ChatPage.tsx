import { useState } from "react";
import { Section } from "../components/ui/Card";
import { ChatPanel } from "../components/ChatPanel";
import { DmPanel } from "../components/DmPanel";

export function ChatPage() {
  const [mode, setMode] = useState<"site" | "dm">("site");

  return (
    <div>
      <Section>現場連絡</Section>
      <div className="mb-3 flex rounded-2xl border border-[#e6eaee] bg-[#f1f4f2] p-1">
        <button
          type="button"
          onClick={() => setMode("site")}
          className={`flex-1 rounded-xl py-2 text-[13px] font-extrabold transition-colors ${
            mode === "site" ? "bg-white text-[#14181b] shadow-sm" : "text-[#6b7280]"
          }`}
        >
          現場
        </button>
        <button
          type="button"
          onClick={() => setMode("dm")}
          className={`flex-1 rounded-xl py-2 text-[13px] font-extrabold transition-colors ${
            mode === "dm" ? "bg-white text-[#14181b] shadow-sm" : "text-[#6b7280]"
          }`}
        >
          個人
        </button>
      </div>
      {mode === "site" ? <ChatPanel /> : <DmPanel />}
    </div>
  );
}
