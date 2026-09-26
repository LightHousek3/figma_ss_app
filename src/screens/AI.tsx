import { useState } from "react";
import { useNav } from "../app/store";
import { aiDiagnoses, chatQueries, contextLabel } from "../app/data";
import {
  Badge,
  EmptyState,
  Field,
  fmtDateTime,
  Icons,
  inputClass,
  PrimaryButton,
  Sheet,
} from "../app/ui";
import { ScreenHeader } from "./common";

export function AIDiagnosis({ seasonId }: { seasonId: string }) {
  const nav = useNav();
  const ctx = contextLabel(seasonId);
  const history = aiDiagnoses.filter((a) => a.seasonId === seasonId);
  const [result, setResult] = useState<(typeof aiDiagnoses)[number] | null>(null);
  const [running, setRunning] = useState(false);

  const run = () => {
    setRunning(true);
    setTimeout(() => {
      setRunning(false);
      setResult(history[0]);
    }, 1400);
  };

  return (
    <div className="pb-6">
      <ScreenHeader title="AI nhận diện bệnh" subtitle={`${ctx.pond} · ${ctx.season}`} />
      <div className="space-y-4 px-4 pt-4">
        <div className="card p-4">
          <button className="flex w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-violet-500/30 bg-violet-50/40 py-8 text-violet-500">
            <Icons.camera size={28} />
            <span className="text-[13px] font-bold">Chụp / tải ảnh mẫu tôm</span>
            <span className="text-[11px] text-ink-muted">Tối thiểu 1 ảnh rõ nét vùng nghi bệnh</span>
          </button>
          <div className="mt-3">
            {running ? (
              <div className="flex items-center justify-center gap-2 rounded-xl bg-violet-50 py-3 text-[13px] font-semibold text-violet-500">
                <span className="size-3 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
                Đang phân tích…
              </div>
            ) : (
              <PrimaryButton full icon={Icons.sparkle} onClick={run}>
                Yêu cầu AI nhận diện
              </PrimaryButton>
            )}
          </div>
        </div>

        {result && (
          <div className="card p-4">
            <div className="flex items-center justify-between">
              <span className="font-display text-[14px] font-bold text-ink">Kết quả gần nhất</span>
              <Badge tone="teal" dot>Thành công</Badge>
            </div>
            <div className="mt-3 flex items-end gap-3">
              <div className="text-[19px] font-extrabold text-ink">{result.predictedLabel}</div>
              <div className="mb-0.5 font-mono text-[13px] font-semibold text-violet-500">{(result.confidence! * 100).toFixed(0)}%</div>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
              <div className="h-full rounded-full bg-violet-500" style={{ width: `${result.confidence! * 100}%` }} />
            </div>
            <p className="mt-3 rounded-xl bg-slate-50 p-3 text-[13px] leading-snug text-ink-soft">{result.recommendation}</p>
            <div className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-[11px] text-amber-500">
              Độ tin cậy AI không phải chẩn đoán lâm sàng. Hãy tạo ca bệnh để chuyên gia đánh giá.
            </div>
            <div className="mt-3">
              <PrimaryButton full tone="rose" icon={Icons.diseaseCase} onClick={() => nav.go("case-new", { seasonId })}>
                Tạo ca bệnh từ kết quả này
              </PrimaryButton>
            </div>
          </div>
        )}

        <div>
          <div className="mb-2 px-1 font-display text-[14px] font-bold text-ink">Lịch sử nhận diện</div>
          <div className="space-y-2">
            {history.map((a) => (
              <button
                key={a.id}
                type="button"
                onClick={() => nav.go("ai-detail", { id: a.id })}
                className="card flex w-full items-center gap-3 p-3.5 text-left transition active:scale-[0.99]"
              >
                <span className="grid size-9 place-items-center rounded-xl bg-violet-50 text-violet-500"><Icons.sparkle size={17} /></span>
                <div className="min-w-0 flex-1">
                  <div className="text-[13px] font-bold text-ink">{a.predictedLabel}</div>
                  <div className="text-[11px] text-ink-muted">{a.imageCount} ảnh · {fmtDateTime(a.createdAt)}</div>
                </div>
                <span className="font-mono text-[13px] font-semibold text-violet-500">{(a.confidence! * 100).toFixed(0)}%</span>
                <Icons.chevronR size={16} className="text-ink-muted" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function AIDiagnosisDetail({ id }: { id: string }) {
  const nav = useNav();
  const result = aiDiagnoses.find((item) => item.id === id);
  if (!result) {
    return (
      <div className="pb-6">
        <ScreenHeader title="Chi tiết nhận diện AI" />
        <div className="px-4 pt-4">
          <EmptyState icon={Icons.sparkle} title="Không tìm thấy kết quả nhận diện" />
        </div>
      </div>
    );
  }
  const ctx = contextLabel(result.seasonId);
  const success = result.runStatus === "success";
  return (
    <div className="pb-6">
      <ScreenHeader title="Chi tiết nhận diện AI" subtitle={`${ctx.pond} · ${ctx.season}`} />
      <div className="space-y-4 px-4 pt-4">
        <div className="card overflow-hidden">
          <div className={`h-1.5 ${success ? "bg-violet-500" : "bg-rose-500"}`} />
          <div className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="font-mono text-[11px] text-ink-muted">{result.id}</div>
                <div className="mt-1 text-[16px] font-bold text-ink">
                  {success ? result.predictedLabel : "Phân tích không thành công"}
                </div>
              </div>
              <Badge tone={success ? "teal" : "rose"} dot>
                {success ? "Thành công" : "Lỗi"}
              </Badge>
            </div>
            {success && result.confidence != null && (
              <div className="mt-4">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-ink-muted">Độ tin cậy</span>
                  <span className="font-mono font-bold text-violet-600">
                    {(result.confidence * 100).toFixed(0)}%
                  </span>
                </div>
                <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full rounded-full bg-violet-500" style={{ width: `${result.confidence * 100}%` }} />
                </div>
              </div>
            )}
            <div className="mt-4 grid grid-cols-2 gap-2">
              <DetailMetric label="Ảnh đầu vào" value={`${result.imageCount} ảnh`} />
              <DetailMetric label="Thời điểm" value={fmtDateTime(result.createdAt)} />
              <DetailMetric label="Phiên bản mô hình" value={result.modelVersion ?? "—"} />
              <DetailMetric
                label="Thời gian xử lý"
                value={result.processingTimeMs != null ? `${result.processingTimeMs} ms` : "—"}
              />
            </div>
          </div>
        </div>

        {success ? (
          <div className="card p-4">
            <div className="text-[13px] font-bold text-ink">Khuyến nghị từ AI</div>
            <p className="mt-2 text-[13px] leading-relaxed text-ink-soft">{result.recommendation}</p>
            <div className="mt-3 rounded-xl bg-amber-50 p-3 text-[11px] leading-relaxed text-amber-700">
              Kết quả AI chỉ hỗ trợ nhận diện dấu hiệu, không thay thế đánh giá của Chuyên gia.
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-[12px] text-rose-700">
            <div className="font-bold">{result.errorCode ?? "Không thể phân tích"}</div>
            <p className="mt-1">{result.errorMessage ?? "Vui lòng thử lại với ảnh rõ nét hơn."}</p>
          </div>
        )}

        {success && (
          <PrimaryButton
            full
            tone="rose"
            icon={Icons.diseaseCase}
            onClick={() => nav.go("case-new", { seasonId: result.seasonId })}
          >
            Tạo ca bệnh từ kết quả này
          </PrimaryButton>
        )}
      </div>
    </div>
  );
}

function DetailMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-slate-50 px-3 py-2.5">
      <div className="text-[10px] text-ink-muted">{label}</div>
      <div className="mt-0.5 text-[12px] font-semibold text-ink">{value}</div>
    </div>
  );
}

export function Chat({ seasonId }: { seasonId: string }) {
  const nav = useNav();
  const ctx = contextLabel(seasonId);
  const [rating, setRating] = useState<Record<string, number>>(
    Object.fromEntries(chatQueries.filter((q) => q.rating).map((q) => [q.id, q.rating!])),
  );
  const [text, setText] = useState("");
  const [feedback, setFeedback] = useState<{ queryId: string; rating: number } | null>(null);
  const [comment, setComment] = useState("");

  return (
    <div className="flex h-full flex-col">
      <ScreenHeader title="Chatbox kỹ thuật" subtitle={`${ctx.pond} · ${ctx.season}`} />
      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto scroll-clean px-4 py-4">
        {chatQueries.map((q) => (
          <div key={q.id} className="space-y-2">
            <div className="flex justify-end">
              <div className="max-w-[85%] rounded-2xl rounded-br-md bg-ocean-600 px-3.5 py-2.5 text-[13px] text-white">{q.question}</div>
            </div>
            <div className="flex justify-start">
              <div className="max-w-[88%] rounded-2xl rounded-bl-md border border-line bg-white px-3.5 py-2.5">
                <div className="mb-1 flex items-center gap-1.5 text-[11px] font-bold text-violet-500">
                  <Icons.sparkle size={13} /> Trợ lý AI
                </div>
                <p className="text-[13px] leading-relaxed text-ink-soft">
                  {q.answer ?? (q.status === "no_source"
                    ? "Chưa tìm thấy tài liệu đủ phù hợp để trả lời câu hỏi này."
                    : q.status === "low_match"
                      ? "Nguồn tham chiếu có độ phù hợp thấp. Hãy mô tả cụ thể hơn."
                      : "Không thể xử lý câu hỏi lúc này. Vui lòng thử lại.")}
                </p>
                <div className="mt-2 flex items-center gap-1 border-t border-line-soft pt-2">
                  <span className="mr-1 text-[10px] text-ink-muted">
                    {rating[q.id] ? "Đã đánh giá:" : "Đánh giá:"}
                  </span>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      type="button"
                      disabled={!!rating[q.id]}
                      onClick={() => { setComment(""); setFeedback({ queryId: q.id, rating: n }); }}
                      className={(rating[q.id] ?? 0) >= n ? "text-amber-500" : "text-slate-500/40"}
                    >
                      <Icons.star size={16} />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="border-t border-line/70 bg-white/90 p-3 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <input className={`${inputClass} flex-1 font-sans`} placeholder="Hỏi về kỹ thuật, nước, bệnh…" value={text} onChange={(e) => setText(e.target.value)} />
          <button onClick={() => { if (text.trim()) { setText(""); nav.toast("Đã gửi câu hỏi tới Chatbox."); } }} className="grid size-11 shrink-0 place-items-center rounded-xl bg-ocean-600 text-white">
            <Icons.send size={18} />
          </button>
        </div>
      </div>
      <Sheet
        open={!!feedback}
        onClose={() => setFeedback(null)}
        title="Đánh giá câu trả lời"
        footer={
          <PrimaryButton
            full
            icon={Icons.check}
            onClick={() => {
              if (!feedback) return;
              setRating((current) => ({ ...current, [feedback.queryId]: feedback.rating }));
              setFeedback(null);
              nav.toast("Cảm ơn đánh giá của bạn.");
            }}
          >
            Gửi đánh giá
          </PrimaryButton>
        }
      >
        <div className="flex justify-center gap-2 py-2">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => feedback && setFeedback({ ...feedback, rating: n })}
              className={(feedback?.rating ?? 0) >= n ? "text-amber-500" : "text-slate-300"}
            >
              <Icons.star size={28} />
            </button>
          ))}
        </div>
        <div className="mt-3">
          <Field label="Bình luận (tùy chọn)" hint="Tối đa 2.000 ký tự theo dữ liệu hệ thống.">
            <textarea
              className={`${inputClass} font-sans`}
              rows={3}
              maxLength={2000}
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              placeholder="Câu trả lời hữu ích hoặc cần cải thiện điểm nào?"
            />
          </Field>
        </div>
      </Sheet>
    </div>
  );
}
