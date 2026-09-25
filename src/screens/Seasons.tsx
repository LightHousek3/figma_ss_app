import { useState } from "react";
import { useNav } from "../app/store";
import { farmForSeason, pondForSeason, seasons } from "../app/data";
import { Badge, healthMeta, num, seasonMeta, toneText } from "../app/ui";
import { TopBar } from "./common";

export function SeasonsList() {
  const nav = useNav();
  const [filter, setFilter] = useState<"active" | "all">("active");
  const list = seasons.filter((s) => (filter === "active" ? s.status === "active" : true));

  return (
    <div className="pb-6">
      <TopBar title="Vụ nuôi" subtitle="Các vụ nuôi bạn được phân công" />
      <div className="flex gap-2 px-4 pb-3">
        {(["active", "all"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-full px-3.5 py-1.5 text-[13px] font-semibold transition ${
              filter === f ? "bg-ocean-500 text-white shadow-sm" : "bg-white/70 text-ink-soft"
            }`}
          >
            {f === "active" ? "Đang nuôi" : "Tất cả"}
          </button>
        ))}
      </div>

      <div className="space-y-3 px-4">
        {list.map((s) => {
          const pond = pondForSeason(s.id);
          const farm = farmForSeason(s.id);
          const sm = seasonMeta[s.status];
          const hm = healthMeta[s.healthStatus];
          return (
            <button
              key={s.id}
              onClick={() => nav.go("pond", { seasonId: s.id })}
              className="card w-full p-4 text-left transition active:scale-[0.99]"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="text-[15px] font-bold text-ink">{pond.name}</div>
                  <div className="mt-0.5 text-[12px] text-ink-muted">
                    {farm.name} · {s.name}
                  </div>
                </div>
                <Badge tone={sm.tone} dot>
                  {sm.label}
                </Badge>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2">
                <MiniStat label="DOC" value={s.status === "planning" ? "—" : String(s.dayOfCulture)} />
                <MiniStat label="Sinh khối" value={s.latestBiomassKg ? `${num(s.latestBiomassKg)}kg` : "—"} />
                <MiniStat
                  label="Sức khỏe"
                  value={<span className={toneText[hm.tone]}>{hm.label}</span>}
                />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-xl bg-slate-50/70 px-2.5 py-2">
      <div className="text-[10px] font-medium uppercase tracking-wide text-ink-muted">{label}</div>
      <div className="mt-0.5 font-display text-[14px] font-bold tabnum text-ink">{value}</div>
    </div>
  );
}
