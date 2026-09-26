import { useState } from "react";
import { useNav } from "../app/store";
import {
  aiDiagnoses,
  contextLabel,
  currentUser,
  diseaseCases,
  seasonById,
  type CaseResponse,
  type CaseSeverity,
} from "../app/data";
import {
  Badge,
  caseStatusMeta,
  EmptyState,
  Field,
  fmtDateTime,
  Icons,
  inputClass,
  MetricTileGrid,
  PrimaryButton,
  Sheet,
  type Tone,
} from "../app/ui";
import { ScreenHeader } from "./common";

const respMeta: Record<CaseResponse["type"], { label: string; tone: Tone }> = {
  request_info: { label: "Yêu cầu thông tin", tone: "amber" },
  provide_info: { label: "Cung cấp thông tin", tone: "ocean" },
  monitoring_result: { label: "Kết quả theo dõi", tone: "violet" },
  treatment_result: { label: "Kết quả điều trị", tone: "teal" },
  emergency_alert: { label: "Cảnh báo khẩn", tone: "rose" },
  expert_assessment: { label: "Đánh giá chuyên gia", tone: "ocean" },
  expert_instruction: { label: "Hướng dẫn chuyên gia", tone: "violet" },
  resolution: { label: "Kết luận", tone: "teal" },
};

const severityMeta: Record<string, { label: string; tone: Tone }> = {
  low: { label: "Nhẹ", tone: "slate" },
  medium: { label: "Trung bình", tone: "amber" },
  high: { label: "Cao", tone: "rose" },
  critical: { label: "Nguy cấp", tone: "rose" },
};

export function CaseDetail({ id }: { id: string }) {
  const nav = useNav();
  const c = diseaseCases.find((x) => x.id === id)!;
  const cm = caseStatusMeta[c.status];
  const ctx = contextLabel(c.seasonId);
  const [reply, setReply] = useState("");
  const [replyType, setReplyType] = useState<CaseResponse["type"]>(
    c.status === "in_treatment"
      ? "treatment_result"
      : c.status === "monitoring"
        ? "monitoring_result"
        : "provide_info",
  );
  const [emergency, setEmergency] = useState(false);
  const resolved = c.status === "resolved";

  return (
    <div className="flex h-full flex-col">
      <ScreenHeader
        title={c.title}
        subtitle={`${ctx.pond} · ${ctx.season}`}
        right={<Badge tone={cm.tone} dot>{cm.label}</Badge>}
      />
      <div className="min-h-0 flex-1 overflow-y-auto scroll-clean px-4 py-4">
        <div className="card p-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={severityMeta[c.severity].tone} dot>Mức độ: {severityMeta[c.severity].label}</Badge>
            <Badge tone="slate">{c.expertName}</Badge>
          </div>
          <p className="mt-3 text-[13px] leading-relaxed text-ink-soft">{c.description}</p>
          {c.aiLabel && (
            <div className="mt-3 flex items-center gap-2 rounded-xl bg-violet-50 px-3 py-2 text-[12px] font-semibold text-violet-500">
              <Icons.sparkle size={15} /> AI gợi ý: {c.aiLabel}
            </div>
          )}
          <div className="mt-2 text-[11px] text-ink-muted">Tạo lúc {fmtDateTime(c.createdAt)}</div>
        </div>

        {c.caseSnapshot && (
          <div className="card mt-3 p-4">
            <div className="flex items-center justify-between gap-2">
              <div className="text-[13px] font-bold text-ink">Dữ liệu lúc mở ca</div>
              {c.caseSnapshot.healthStatus && (
                <Badge tone={c.caseSnapshot.healthStatus === "warning" || c.caseSnapshot.healthStatus === "critical" ? "rose" : "teal"}>
                  {c.caseSnapshot.healthStatus === "warning"
                    ? "Cần chú ý"
                    : c.caseSnapshot.healthStatus === "critical"
                      ? "Nguy cấp"
                      : "Ổn định"}
                </Badge>
              )}
            </div>
            <div className="mt-3">
              <MetricTileGrid
                items={[
                  { label: "Cỡ TB", value: c.caseSnapshot.avgWeightG ?? "—", unit: "g/con" },
                  { label: "Hao hụt", value: c.caseSnapshot.mortalityCount ?? "—", unit: "con" },
                  { label: "Sinh khối", value: c.caseSnapshot.estimatedBiomassKg ?? "—", unit: "kg" },
                  { label: "pH", value: c.caseSnapshot.ph ?? "—" },
                  { label: "DO", value: c.caseSnapshot.doMgL ?? "—", unit: "mg/L" },
                  { label: "NH3", value: c.caseSnapshot.nh3MgL ?? "—", unit: "mg/L" },
                  { label: "NO2", value: c.caseSnapshot.no2MgL ?? "—", unit: "mg/L" },
                ]}
              />
            </div>
          </div>
        )}

        <div className="mb-2 mt-5 px-1 font-display text-[14px] font-bold text-ink">Diễn tiến trao đổi</div>
        <div className="space-y-3">
          {c.responses.map((r) => {
            const mine = r.authorRole === "KTV";
            const rm = respMeta[r.type];
            return (
              <div key={r.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[85%] rounded-2xl border p-3 ${mine ? "border-ocean-100 bg-ocean-50/70" : "border-line bg-white"}`}>
                  <div className="mb-1 flex items-center gap-2">
                    <span className="text-[12px] font-bold text-ink">{r.authorName}</span>
                    <Badge tone={rm.tone}>{rm.label}</Badge>
                  </div>
                  <p className="text-[13px] leading-snug text-ink-soft">{r.message}</p>
                  <div className="mt-1 text-[10px] text-ink-muted">{fmtDateTime(r.createdAt)}</div>
                </div>
              </div>
            );
          })}
        </div>

        {resolved && (
          <div className="mt-4 rounded-2xl border border-teal-500/25 bg-teal-50/60 p-3 text-[12px] text-teal-500">
            Ca bệnh đã xử lý — không thể thêm phản hồi. Nếu tái phát, hãy tạo ca bệnh mới.
          </div>
        )}
      </div>

      {!resolved && (
        <div className="border-t border-line/70 bg-white/90 p-3 backdrop-blur-md">
          <select
            aria-label="Loại phản hồi"
            value={replyType}
            onChange={(event) => setReplyType(event.target.value as CaseResponse["type"])}
            className="mb-2 w-full rounded-xl border border-line bg-slate-50 px-3 py-2 text-[11px] font-semibold text-ink-soft outline-none focus:border-ocean-400"
          >
            <option value="provide_info">Cung cấp thông tin</option>
            <option value="monitoring_result">Kết quả theo dõi</option>
            <option value="treatment_result">Kết quả điều trị</option>
          </select>
          <div className="flex items-center gap-2">
            <input
              className={`${inputClass} flex-1 font-sans`}
              placeholder="Phản hồi / cung cấp thông tin…"
              value={reply}
              onChange={(e) => setReply(e.target.value)}
            />
            <button
              onClick={() => {
                if (!reply.trim()) return nav.toast("Vui lòng nhập nội dung phản hồi.");
                c.responses.push({
                  id: `r-${Date.now()}`,
                  authorName: currentUser.name,
                  authorRole: "KTV",
                  type: replyType,
                  message: reply.trim(),
                  createdAt: new Date().toISOString(),
                });
                setReply("");
                nav.toast("Đã gửi phản hồi.");
              }}
              className="grid size-11 shrink-0 place-items-center rounded-xl bg-ocean-600 text-white"
            >
              <Icons.send size={18} />
            </button>
          </div>
          <button onClick={() => setEmergency(true)} className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border border-rose-500/40 bg-rose-50/60 py-2.5 text-[13px] font-bold text-rose-500">
            <Icons.warn size={16} /> Gửi cảnh báo khẩn cho chuyên gia
          </button>
        </div>
      )}

      <Sheet open={emergency} onClose={() => setEmergency(false)} title="Cảnh báo khẩn" footer={
        <PrimaryButton tone="rose" full icon={Icons.send} onClick={() => { setEmergency(false); nav.toast("Đã gửi cảnh báo khẩn — chuyên gia & chủ trại được thông báo ngay."); }}>
          Gửi cảnh báo khẩn
        </PrimaryButton>
      }>
        <div className="rounded-xl bg-rose-50 p-3 text-[12px] leading-snug text-rose-500">
          KTV chỉ gửi cảnh báo khẩn — <b>không tự dừng phác đồ</b>. Chuyên gia sẽ đánh giá và quyết định dừng khẩn cấp nếu cần; chủ trại được thông báo ngay.
        </div>
        <div className="mt-3">
          <Field label="Mô tả tình huống khẩn cấp">
            <textarea className={`${inputClass} font-sans`} rows={4} placeholder="Tôm chết hàng loạt, bỏ ăn đột ngột, dấu hiệu xấu đi nhanh…" />
          </Field>
        </div>
      </Sheet>
    </div>
  );
}

export function CaseNew({ seasonId }: { seasonId: string }) {
  const nav = useNav();
  const season = seasonById(seasonId);
  const ctx = contextLabel(seasonId);
  const relatedAi = aiDiagnoses.filter((a) => a.seasonId === seasonId && a.runStatus === "success");
  const [linkedAi, setLinkedAi] = useState<string | null>(relatedAi[0]?.id ?? null);
  const [severity, setSeverity] = useState<CaseSeverity>("medium");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  if (season.status !== "active") {
    return (
      <div className="pb-6">
        <ScreenHeader title="Tạo ca bệnh" subtitle={`${ctx.pond} · ${ctx.season}`} />
        <div className="px-4 pt-4">
          <EmptyState
            icon={Icons.diseaseCase}
            title="Chưa thể tạo ca bệnh"
            hint="KTV chỉ tạo ca bệnh cho vụ đang hoạt động và đang được phân công."
          />
        </div>
      </div>
    );
  }

  return (
    <div className="pb-6">
      <ScreenHeader title="Tạo ca bệnh" subtitle={`${ctx.pond} · ${ctx.season}`} />
      <div className="space-y-4 px-4 pt-4">
        <div className="card space-y-3 p-4">
          <Field label="Tiêu đề">
            <input
              className={`${inputClass} font-sans`}
              placeholder="VD: Nghi phân trắng — Ao A3"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
            />
          </Field>
          <Field label="Mức độ nghiêm trọng">
            <div className="grid grid-cols-4 gap-1.5">
              {(["low", "medium", "high", "critical"] as const).map((sv) => (
                <button
                  key={sv}
                  type="button"
                  onClick={() => setSeverity(sv)}
                  className={`rounded-xl border py-2 text-[12px] font-semibold transition ${
                    severity === sv
                      ? "border-rose-400 bg-rose-50 text-rose-600"
                      : "border-line bg-white text-ink-soft"
                  }`}
                >
                  {severityMeta[sv].label}
                </button>
              ))}
            </div>
          </Field>
          <Field label="Mô tả dấu hiệu">
            <textarea
              className={`${inputClass} font-sans`}
              rows={4}
              placeholder="Quan sát tại nhá, hành vi bắt mồi, màu sắc, phân, vỏ…"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
            />
          </Field>
          <Field label="Hình ảnh / video">
            <button className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-line py-6 text-[13px] font-semibold text-ink-muted">
              <Icons.camera size={18} /> Thêm ảnh mẫu tôm / nhá
            </button>
          </Field>
        </div>

        {relatedAi.length > 0 && (
          <div>
            <div className="mb-2 px-1 text-[13px] font-bold text-ink">Liên kết kết quả AI (tùy chọn)</div>
            {relatedAi.map((a) => (
              <button
                key={a.id}
                onClick={() => setLinkedAi(linkedAi === a.id ? null : a.id)}
                className={`mb-2 flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition ${linkedAi === a.id ? "border-violet-500 bg-violet-50/60" : "border-line bg-white/70"}`}
              >
                <span className="grid size-9 place-items-center rounded-xl bg-violet-50 text-violet-500"><Icons.sparkle size={17} /></span>
                <span className="flex-1">
                  <span className="block text-[13px] font-bold text-ink">{a.predictedLabel}</span>
                  <span className="block text-[11px] text-ink-muted">Độ tin cậy {(a.confidence! * 100).toFixed(0)}% · {a.id}</span>
                </span>
                {linkedAi === a.id && <Icons.check size={18} className="text-violet-500" />}
              </button>
            ))}
          </div>
        )}

        <PrimaryButton
          full
          tone="rose"
          icon={Icons.diseaseCase}
          onClick={() => {
            if (!title.trim()) return nav.toast("Vui lòng nhập tiêu đề ca bệnh.");
            if (!description.trim()) return nav.toast("Vui lòng mô tả dấu hiệu quan sát được.");
            nav.back();
            nav.toast("Đã tạo ca bệnh — chuyên gia phụ trách được thông báo.");
          }}
        >
          Gửi cho chuyên gia
        </PrimaryButton>
      </div>
    </div>
  );
}
