export function Header({
  displayName,
  env,
}: {
  displayName: string;
  env?: string;
}) {
  return (
    <header className="-mx-4 -mt-4 rounded-b-3xl bg-gradient-to-br from-[#06c755] to-[#04a648] px-4 pb-5 pt-[max(1.25rem,env(safe-area-inset-top))] text-white shadow-lg shadow-[#06c755]/25">
      <div className="flex items-center gap-2.5">
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/20 text-sm font-extrabold">
          現
        </div>
        <div>
          <p className="text-base font-extrabold leading-tight">現場WORKS</p>
          <p className="text-[9.5px] font-semibold tracking-[0.14em] opacity-85">
            GENBA WORKS
          </p>
        </div>
        <div className="ml-auto flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 text-xs font-bold">
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white text-[10px] font-extrabold text-[#05a847]">
            {(displayName || "？").trim().slice(0, 1)}
          </span>
          {displayName}
        </div>
      </div>
      {env === "dev" && (
        <div className="mt-2 inline-block rounded-full border border-[#f5d98a] bg-[#fff7e6] px-2.5 py-0.5 text-[11.5px] font-extrabold text-[#b45309]">
          テスト中 (dev)
        </div>
      )}
    </header>
  );
}
