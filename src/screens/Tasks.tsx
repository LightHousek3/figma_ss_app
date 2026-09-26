import { useState } from "react";
import { useNav } from "../app/store";
import { contextLabel, tasks } from "../app/data";
import {
  Badge,
  fmtDateTime,
  GhostButton,
  Icons,
  EmptyState,
  PrimaryButton,
  priorityMeta,
  taskStatusMeta,
  Segmented,
} from "../app/ui";
import { ScreenHeader, TopBar } from "./common";

export function TasksList() {
  const nav = useNav();
  const [filter, setFilter] = useState<"open" | "done">("open");
  const list = tasks.filter((t) =>
    filter === "open" ? t.status === "pending" || t.status === "in_progress" : t.status === "completed" || t.status === "cancelled",
  );
  const order = { urgent: 0, high: 1, normal: 2, low: 3 } as const;
  list.sort((a, b) => order[a.priority] - order[b.priority]);

  return (
    <div className="pb-6">
      <TopBar title="Nhiệm vụ" subtitle="Công việc chủ trại giao" />
      <div className="px-4 pb-3">
        <Segmented
          value={filter}
          onChange={setFilter}
          options={[
            { value: "open", label: `Cần làm (${tasks.filter((t) => t.status === "pending" || t.status === "in_progress").length})` },
            { value: "done", label: `Đã kết thúc (${tasks.filter((t) => t.status === "completed" || t.status === "cancelled").length})` },
          ]}
        />
      </div>
      <div className="space-y-2.5 px-4">
        {list.length === 0 && (
          <EmptyState icon={Icons.checkList} title="Không có nhiệm vụ ở trạng thái này" />
        )}
        {list.map((t) => {
          const sm = taskStatusMeta[t.status];
          const pm = priorityMeta[t.priority];
          return (
            <button key={t.id} onClick={() => nav.go("task", { id: t.id })} className="card w-full p-3.5 text-left transition active:scale-[0.99]">
              <div className="flex items-start gap-3">
                <span className={`mt-1 size-2.5 shrink-0 rounded-full ${t.priority === "urgent" ? "bg-rose-500" : t.priority === "high" ? "bg-amber-500" : "bg-ocean-500"}`} />
                <div className="min-w-0 flex-1">
                  <div className="text-[14px] font-bold text-ink">{t.title}</div>
                  <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-ink-muted">
                    <Icons.clock size={12} /> Hạn {fmtDateTime(t.dueAt)}
                  </div>
                </div>
              </div>
              <div className="mt-2.5 flex items-center gap-2">
                <Badge tone={pm.tone}>{pm.label}</Badge>
                <Badge tone={sm.tone} dot>{sm.label}</Badge>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function TaskDetail({ id }: { id: string }) {
  const nav = useNav();
  const t = tasks.find((x) => x.id === id)!;
  const sm = taskStatusMeta[t.status];
  const pm = priorityMeta[t.priority];
  const terminal = t.status === "completed" || t.status === "cancelled";
  const taskContext = t.seasonId ? contextLabel(t.seasonId) : null;

  return (
    <div className="pb-6">
      <ScreenHeader
        title="Chi tiết nhiệm vụ"
        subtitle={taskContext ? `${taskContext.pond} · ${taskContext.season}` : t.id}
        right={<Badge tone={sm.tone} dot>{sm.label}</Badge>}
      />
      <div className="space-y-4 px-4 pt-4">
        <div className="card p-4">
          <div className="flex items-center gap-2">
            <Badge tone={pm.tone} dot>Ưu tiên: {pm.label}</Badge>
          </div>
          <h2 className="mt-2 font-display text-[17px] font-bold text-ink">{t.title}</h2>
          <p className="mt-2 text-[13px] leading-relaxed text-ink-soft">{t.description}</p>
          <div className="mt-3 grid grid-cols-2 gap-2.5 text-[12px]">
            <div className="rounded-xl bg-slate-50/70 px-3 py-2">
              <div className="text-ink-muted">Hạn hoàn thành</div>
              <div className="mt-0.5 font-semibold text-ink">{fmtDateTime(t.dueAt)}</div>
            </div>
            <div className="rounded-xl bg-slate-50/70 px-3 py-2">
              <div className="text-ink-muted">Người giao</div>
              <div className="mt-0.5 font-semibold text-ink">{t.assignedBy}</div>
            </div>
          </div>
          {(t.startedAt || t.completedAt || t.cancellationReason) && (
            <div className="mt-3 space-y-1.5 border-t border-line-soft pt-3 text-[11px] text-ink-soft">
              {t.startedAt && <div>Bắt đầu: {fmtDateTime(t.startedAt)}</div>}
              {t.completedAt && <div>Hoàn thành: {fmtDateTime(t.completedAt)}</div>}
              {t.cancellationReason && (
                <div className="rounded-lg bg-rose-50 p-2 text-rose-600">
                  Lý do hủy: {t.cancellationReason}
                </div>
              )}
            </div>
          )}
        </div>

        {terminal ? (
          <div className="rounded-2xl border border-line bg-slate-50/60 p-3 text-center text-[12px] text-ink-muted">
            Nhiệm vụ đã ở trạng thái kết thúc — không thể cập nhật.
          </div>
        ) : (
          <div className="space-y-2">
            <div className="px-1 text-[13px] font-bold text-ink">Cập nhật trạng thái</div>
            {t.status === "pending" && (
              <PrimaryButton full icon={Icons.ops} onClick={() => { t.status = "in_progress"; nav.back(); nav.toast("Đã bắt đầu nhiệm vụ."); }}>
                Bắt đầu làm
              </PrimaryButton>
            )}
            {t.status === "in_progress" && (
              <PrimaryButton full tone="teal" icon={Icons.check} onClick={() => { t.status = "completed"; nav.back(); nav.toast("Đã hoàn thành nhiệm vụ."); }}>
                Đánh dấu hoàn thành
              </PrimaryButton>
            )}
            {t.seasonId && (
              <GhostButton full icon={Icons.pin} onClick={() => nav.go("pond", { seasonId: t.seasonId! })}>
                Mở ao liên quan
              </GhostButton>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
