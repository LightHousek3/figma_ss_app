import { useState } from "react";
import { useNav } from "../app/store";
import { farmForSeason, pondForSeason, seasons } from "../app/data";
import { Badge, EmptyState, healthMeta, Icons, num, seasonMeta, Segmented, toneText } from "../app/ui";
import { TopBar } from "./common";

export function SeasonsList() {
  const nav = useNav();
  const [filter, setFilter] = useState<"active" | "all">("active");
  const list = seasons.filter((s) => (filter === "active" ? s.status === "active" : true));

  return (
    <div className="pb-6">
      <TopBar title="Vụ nuôi" subtitle="Các vụ nuôi bạn được phân công" />
      <div className="px-4 pb-3">
        <Segmented
          value={filter}
          onChange={setFilter}
          options={[
            { value: "active", label: `Đang nuôi (${seasons.filter((s) => s.status === "active").length})` },
            { value: "all", label: `Tất cả (${seasons.length})` },
          ]}
        />
      </div>

      <div className="space-y-3 px-4">
        {list.length === 0 && (
          <EmptyState icon={Icons.layers} title="Không có vụ nuôi phù hợp" />
        )}
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
              {s.status === "planning" ? (
                <div className="mt-3 rounded-xl bg-violet-50 px-3 py-2.5 text-[11px] leading-relaxed text-violet-700">
                  Chờ Chủ trại kích hoạt vụ. Chức năng ghi nhận vận hành chỉ mở khi vụ bắt đầu nuôi.
                </div>
              ) : (
                <div className="mt-3 grid grid-cols-3 gap-2">
                  <MiniStat label="DOC" value={String(s.dayOfCulture)} />
                  <MiniStat label="Sinh khối" value={s.latestBiomassKg ? `${num(s.latestBiomassKg)}kg` : "—"} />
                  <MiniStat
                    label="Sức khỏe"
                    value={<span className={toneText[hm.tone]}>{hm.label}</span>}
                  />
                </div>
              )}
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
