import { useState } from "react";
import { useNav } from "../app/store";
import { contextLabel, operations } from "../app/data";
import {
  Badge,
  doseBasisLabel,
  Field,
  fmtDateTime,
  fmtTime,
  Icons,
  inputClass,
  opMeta,
  opTypeMeta,
  PrimaryButton,
  Sheet,
} from "../app/ui";
import { ScreenHeader } from "./common";

const VARIANCE_PCT = 10; // allowed_variance_pct — variance_reason becomes mandatory beyond this

export default function OperationDetail({ id }: { id: string }) {
  const nav = useNav();
  const op = operations.find((o) => o.id === id)!;
  const meta = opTypeMeta[op.operationType];
  const om = opMeta[op.status];
  const Icon = Icons[meta.icon];
  const ctx = contextLabel(op.seasonId);

  const [exec, setExec] = useState(false);
  const [qty, setQty] = useState(String(op.plannedQuantity));
  const [reason, setReason] = useState("");
  const [note, setNote] = useState("");

  const actual = parseFloat(qty) || 0;
  const variancePct = op.plannedQuantity ? Math.abs((actual - op.plannedQuantity) / op.plannedQuantity) * 100 : 0;
  const needsReason = variancePct > VARIANCE_PCT;

  return (
    <div className="pb-6">
      <ScreenHeader
        title="Chi tiết vận hành"
        subtitle={`${ctx.pond} · ${ctx.season}`}
        right={<Badge tone={om.tone} dot>{om.label}</Badge>}
      />
      <div className="space-y-4 px-4 pt-4">
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <span className={`grid size-12 place-items-center rounded-2xl ${meta.tone === "teal" ? "bg-teal-50 text-teal-500" : meta.tone === "rose" ? "bg-rose-50 text-rose-500" : meta.tone === "violet" ? "bg-violet-50 text-violet-500" : "bg-ocean-50 text-ocean-600"}`}>
              <Icon size={22} />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <Badge tone={meta.tone}>{meta.label}</Badge>
                {op.mealNumber && <span className="text-[12px] font-semibold text-ink-muted">Cữ {op.mealNumber}</span>}
              </div>
              <div className="mt-1 text-[15px] font-bold text-ink">{op.productName}</div>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2.5">
            <KV k="Giờ dự kiến" v={fmtTime(op.scheduledAt)} />
            <KV k="Cách tính liều" v={doseBasisLabel[op.doseBasis]} />
            <KV k="Liều kế hoạch" v={`${op.plannedQuantity} ${op.unit}`} mono />
            {op.execution && <KV k="Thực tế" v={`${op.execution.actualQuantity} ${op.unit}`} mono />}
            {op.basisQuantity != null && (
              <KV
                k="Dữ liệu tính liều"
                v={`${op.basisQuantity.toLocaleString("vi-VN")} ${op.basisUnit === "kg_biomass" ? "kg sinh khối" : "m³ nước"}`}
                mono
              />
            )}
            {op.calculationVersion && <KV k="Phiên bản tính" v={op.calculationVersion} mono />}
          </div>

          {op.instructions && (
            <p className="mt-3 rounded-xl bg-slate-50 p-3 text-[13px] leading-snug text-ink-soft">{op.instructions}</p>
          )}

          {op.withMedicine && (
            <div className="mt-3 flex items-center gap-2 rounded-xl border border-rose-500/25 bg-rose-50/60 p-3">
              <Icons.pills size={18} className="text-rose-500" />
              <div className="text-[12px]">
                <span className="font-bold text-ink">Trộn kèm theo protocol: </span>
                <span className="text-ink-soft">{op.withMedicine.productName} · {op.withMedicine.quantity} {op.withMedicine.unit}</span>
              </div>
            </div>
          )}
        </div>

        {/* status-specific blocks */}
        {op.status === "completed" && op.execution && (
          <div className="card p-4">
            <div className="flex items-center gap-2 text-[13px] font-bold text-teal-500">
              <Icons.check size={16} /> Đã ghi nhận thực hiện
            </div>
            <div className="mt-2 space-y-1 text-[12px] text-ink-soft">
              <div>Thực hiện lúc {fmtDateTime(op.execution.executedAt)}</div>
              {op.execution.note && <div>Ghi chú: {op.execution.note}</div>}
              {op.execution.varianceReason && (
                <div className="rounded-lg bg-amber-50 p-2 text-amber-500">
                  Chênh lệch liều: {op.execution.varianceReason}
                </div>
              )}
            </div>
          </div>
        )}

        {op.status === "cancelled" && op.cancellation && (
          <div className="card p-4">
            <div className="flex items-center gap-2 text-[13px] font-bold text-ink-soft">
              <Icons.ban size={16} /> Lịch đã hủy
            </div>
            <p className="mt-1 text-[12px] text-ink-soft">{op.cancellation.reason}</p>
          </div>
        )}

        {op.status === "planned" && !op.blocked && (
          <PrimaryButton full icon={Icons.check} tone="teal" onClick={() => setExec(true)}>
            Ghi nhận thực hiện
          </PrimaryButton>
        )}

        {op.blocked && (
          <div className="rounded-2xl border border-amber-500/30 bg-amber-50/70 p-3.5 text-[12px] text-ink-soft">
            <div className="mb-1 flex items-center gap-2 font-bold text-amber-500">
              <Icons.warn size={15} /> Chưa thể thực hiện
            </div>
            {op.blocked}
          </div>
        )}
      </div>

      <Sheet
        open={exec}
        onClose={() => setExec(false)}
        title="Ghi nhận thực hiện"
        footer={
          <PrimaryButton
            tone="teal"
            full
            icon={Icons.check}
            onClick={() => {
              if (actual <= 0) return nav.toast("Số lượng thực tế phải lớn hơn 0.");
              if (needsReason && !reason.trim()) return nav.toast("Chênh lệch vượt 10% — cần nhập lý do.");
              op.execution = {
                actualQuantity: actual,
                executedAt: new Date().toISOString(),
                note: note.trim() || undefined,
                varianceReason: needsReason ? reason.trim() : undefined,
              };
              op.status = "completed";
              setExec(false);
              nav.back();
              nav.toast("Đã ghi nhận thực hiện & trừ kho (JIT).");
            }}
          >
            Xác nhận & trừ kho
          </PrimaryButton>
        }
      >
        <div className="mb-3 rounded-xl bg-teal-50 px-3 py-2 text-[12px] text-teal-500">
          Khi xác nhận, hệ thống trừ kho theo thứ tự lô nhập trước, lưu kết quả
          thực hiện không thể chỉnh sửa và hoàn tất lịch.
        </div>
        <Field label="Sản phẩm sử dụng">
          <input className={`${inputClass} bg-slate-50 font-sans`} value={op.productName} readOnly />
        </Field>
        <div className="mt-3">
          <Field label="Số lượng thực tế" unit={op.unit} hint={`Kế hoạch: ${op.plannedQuantity} ${op.unit}`}>
            <input className={inputClass} inputMode="decimal" value={qty} onChange={(e) => setQty(e.target.value)} />
          </Field>
        </div>
        {op.plannedQuantity > 0 && (
          <div className={`mt-2 rounded-lg px-3 py-2 text-[12px] font-semibold ${needsReason ? "bg-amber-50 text-amber-500" : "bg-slate-50 text-ink-soft"}`}>
            Chênh lệch {variancePct.toFixed(1)}%
            {needsReason ? " — vượt ngưỡng 10%, cần ghi lý do." : " — trong ngưỡng cho phép."}
          </div>
        )}
        {needsReason && (
          <div className="mt-3">
            <Field label="Lý do chênh lệch (bắt buộc)">
              <textarea className={`${inputClass} font-sans`} rows={2} value={reason} onChange={(e) => setReason(e.target.value)} />
            </Field>
          </div>
        )}
        <div className="mt-3">
          <Field label="Ghi chú">
            <textarea
              className={`${inputClass} font-sans`}
              rows={2}
              placeholder="Tình trạng bắt mồi, thời tiết…"
              value={note}
              onChange={(event) => setNote(event.target.value)}
            />
          </Field>
        </div>
      </Sheet>
    </div>
  );
}

function KV({ k, v, mono }: { k: string; v: string; mono?: boolean }) {
  return (
    <div className="rounded-xl bg-slate-50/70 px-3 py-2">
      <div className="text-[11px] text-ink-muted">{k}</div>
      <div className={`mt-0.5 text-[13px] font-semibold text-ink ${mono ? "font-mono tabnum" : ""}`}>{v}</div>
    </div>
  );
}
