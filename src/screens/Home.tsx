import { useNav } from "../app/store";
import {
  currentUser,
  diseaseCases,
  notifications,
  operations,
  pondForSeason,
  seasons,
  tasks,
} from "../app/data";
import {
  Badge,
  chip,
  fmtTime,
  healthMeta,
  Icons,
  num,
  opTypeMeta,
  priorityMeta,
  SectionTitle,
} from "../app/ui";
import { TopBar } from "./common";

export default function Home() {
  const nav = useNav();
  const activeSeasons = seasons.filter((s) => s.status === "active");
  const warnings = notifications.filter((n) => n.category === "warning" && !n.read);
  const todayOps = operations.filter(
    (o) => o.status === "planned" && o.scheduledAt.startsWith("2026-09-08") && !o.blocked,
  );
  const openTasks = tasks.filter((t) => t.status === "pending" || t.status === "in_progress");
  const openCases = diseaseCases.filter((c) => c.status !== "resolved");

  return (
    <div className="pb-6">
      <TopBar
        title={`Chào, ${currentUser.name.split(" ").slice(-1)[0]}`}
        subtitle={`${currentUser.role} · ${currentUser.ownerName}`}
        right={
          <button
            onClick={() => nav.setTab("account")}
            className="grid size-11 place-items-center rounded-full bg-ocean-600 font-display text-[15px] font-bold text-white shadow-sm"
          >
            {currentUser.name.split(" ").slice(-1)[0][0]}
          </button>
        }
      />

      {/* summary strip */}
      <div className="grid grid-cols-3 gap-2 px-4 pb-3">
        {[
          { k: "Ao đang nuôi", v: activeSeasons.length, tone: "text-teal-500" },
          { k: "Việc cần làm", v: openTasks.length, tone: "text-ocean-600" },
          { k: "Ca bệnh mở", v: openCases.length, tone: "text-rose-500" },
        ].map((s) => (
          <div key={s.k} className="card px-3 py-3">
            <div className={`font-display text-[24px] font-extrabold tabnum leading-none ${s.tone}`}>{s.v}</div>
            <div className="mt-1 text-[11px] font-medium text-ink-muted">{s.k}</div>
          </div>
        ))}
      </div>

      {/* Early warnings */}
      {warnings.length > 0 && (
        <div className="px-4 pt-1">
          <SectionTitle
            action={
              <button onClick={() => nav.setTab("notifications")} className="text-[12px] font-semibold text-ocean-600">
                Tất cả
              </button>
            }
          >
            Cảnh báo sớm
          </SectionTitle>
          <div className="space-y-2">
            {warnings.map((w) => (
              <button
                key={w.id}
                onClick={() => {
                  const target = w.action?.nav;
                  if (target?.startsWith("pond:"))
                    nav.go("pond", { seasonId: target.slice(5) });
                  else if (target?.startsWith("health:"))
                    nav.go("health", { seasonId: target.slice(7) });
                  else nav.setTab("notifications");
                }}
                className="flex w-full items-start gap-3 rounded-2xl border border-amber-500/30 bg-amber-50/70 p-3 text-left transition active:scale-[0.99]"
              >
                <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-xl bg-amber-500/15 text-amber-500">
                  <Icons.warn size={17} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[13px] font-bold text-ink">{w.title}</span>
                  <span className="mt-0.5 line-clamp-2 block text-[12px] leading-snug text-ink-soft">{w.content}</span>
                </span>
                <Icons.chevronR size={16} className="mt-1 shrink-0 text-amber-500" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Việc cần làm hôm nay */}
      <div className="px-4 pt-4">
        <SectionTitle
          action={
            <button onClick={() => nav.setTab("tasks")} className="text-[12px] font-semibold text-ocean-600">
              Nhiệm vụ
            </button>
          }
        >
          Việc cần làm hôm nay
        </SectionTitle>
        <div className="card divide-y divide-line-soft">
          {openTasks.slice(0, 3).map((t) => (
            <button
              key={t.id}
              onClick={() => nav.go("task", { id: t.id })}
              className="flex w-full items-center gap-3 px-3.5 py-3 text-left transition hover:bg-slate-50/60"
            >
              <span
                className={`size-2 shrink-0 rounded-full ${t.priority === "urgent" ? "bg-rose-500" : t.priority === "high" ? "bg-amber-500" : "bg-ocean-500"}`}
              />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13px] font-semibold text-ink">{t.title}</span>
                <span className="mt-0.5 flex items-center gap-1.5 text-[11px] text-ink-muted">
                  <Icons.clock size={12} /> Hạn {fmtTime(t.dueAt)}
                </span>
              </span>
              <Badge tone={priorityMeta[t.priority].tone}>{priorityMeta[t.priority].label}</Badge>
            </button>
          ))}
        </div>
      </div>

      {/* Cữ vận hành tiếp theo */}
      <div className="px-4 pt-4">
        <SectionTitle>Cữ vận hành sắp tới</SectionTitle>
        <div className="scroll-clean -mx-1 flex gap-2.5 overflow-x-auto px-1 pb-1">
          {todayOps.slice(0, 4).map((o) => {
            const meta = opTypeMeta[o.operationType];
            const pond = pondForSeason(o.seasonId);
            const Icon = Icons[meta.icon];
            return (
              <button
                key={o.id}
                onClick={() => nav.go("op", { id: o.id })}
                className="card w-[168px] shrink-0 p-3 text-left transition active:scale-[0.98]"
              >
                <div className="flex items-center justify-between">
                  <span className={`grid size-8 place-items-center rounded-xl ${chip(meta.tone)}`}>
                    <Icon size={17} />
                  </span>
                  <span className="font-mono text-[12px] font-semibold text-ink-soft">{fmtTime(o.scheduledAt)}</span>
                </div>
                <div className="mt-2 text-[12px] font-bold text-ink">{meta.label}</div>
                <div className="mt-0.5 line-clamp-1 text-[11px] text-ink-muted">{o.productName}</div>
                <div className="mt-2 flex items-center gap-1 text-[11px] font-semibold text-ocean-600">
                  <Icons.pin size={12} /> {pond.name}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Trạng thái ao */}
      <div className="px-4 pt-4">
        <SectionTitle
          action={
            <button onClick={() => nav.setTab("seasons")} className="text-[12px] font-semibold text-ocean-600">
              Tất cả
            </button>
          }
        >
          Ao đang phụ trách
        </SectionTitle>
        <div className="space-y-2.5">
          {activeSeasons.map((s) => {
            const pond = pondForSeason(s.id);
            const hm = healthMeta[s.healthStatus];
            return (
              <button
                key={s.id}
                onClick={() => nav.go("pond", { seasonId: s.id })}
                className="card flex w-full items-center gap-3 p-3.5 text-left transition active:scale-[0.99]"
              >
                <div className="grid size-12 shrink-0 place-items-center rounded-2xl bg-ocean-50 font-display text-[13px] font-extrabold text-ocean-700">
                  {pond.name.replace("Ao ", "")}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-[14px] font-bold text-ink">{pond.name}</span>
                    <Badge tone={hm.tone} dot>
                      {hm.label}
                    </Badge>
                  </div>
                  <div className="mt-0.5 text-[12px] text-ink-muted">
                    DOC {s.dayOfCulture} · {s.latestBiomassKg ? `${num(s.latestBiomassKg)} kg sinh khối` : "chưa có sinh khối"}
                  </div>
                </div>
                <Icons.chevronR size={18} className="shrink-0 text-ink-muted" />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
