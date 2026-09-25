import { useState } from "react";
import { useNav } from "../app/store";
import { aiDiagnoses, chatQueries, contextLabel } from "../app/data";
import {
  Badge,
  ContextBar,
  fmtDateTime,
  GhostButton,
  Icons,
  inputClass,
  PrimaryButton,
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
      <ScreenHeader title="AI nhận diện bệnh" subtitle="Phân tích hình ảnh tôm" />
      <div className="space-y-4 px-4 pt-4">
        <ContextBar {...ctx} />

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
              <PrimaryButton full tone="rose" icon={Icons.warn} onClick={() => nav.go("case-new", { seasonId })}>
                Tạo ca bệnh từ kết quả này
              </PrimaryButton>
            </div>
          </div>
        )}

        <div>
          <div className="mb-2 px-1 font-display text-[14px] font-bold text-ink">Lịch sử nhận diện</div>
          <div className="space-y-2">
            {history.map((a) => (
              <div key={a.id} className="card flex items-center gap-3 p-3.5">
                <span className="grid size-9 place-items-center rounded-xl bg-violet-50 text-violet-500"><Icons.sparkle size={17} /></span>
                <div className="min-w-0 flex-1">
                  <div className="text-[13px] font-bold text-ink">{a.predictedLabel}</div>
                  <div className="text-[11px] text-ink-muted">{a.imageCount} ảnh · {fmtDateTime(a.createdAt)}</div>
                </div>
                <span className="font-mono text-[13px] font-semibold text-violet-500">{(a.confidence! * 100).toFixed(0)}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
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

  return (
    <div className="flex h-full flex-col">
      <ScreenHeader title="Hỏi chuyên gia AI" subtitle="Trợ lý kỹ thuật (RAG)" />
      <div className="border-b border-line/60 bg-white/85 px-4 py-2 backdrop-blur-md">
        <ContextBar {...ctx} />
      </div>
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
                <p className="text-[13px] leading-relaxed text-ink-soft">{q.answer}</p>
                <div className="mt-2 flex items-center gap-1 border-t border-line-soft pt-2">
                  <span className="mr-1 text-[10px] text-ink-muted">Đánh giá:</span>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      onClick={() => { setRating((r) => ({ ...r, [q.id]: n })); nav.toast("Cảm ơn đánh giá của bạn."); }}
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
    </div>
  );
}
