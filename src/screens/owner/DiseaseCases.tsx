import { useState } from 'react';
import { useNav } from '../../app/store';
import {
    Icons,
    Badge,
    EmptyState,
    Segmented,
    caseStatusMeta,
    healthMeta,
    MetricTileGrid,
} from '../../app/ui';
import {
    ownerDiseaseCases,
    protocolsForSeason,
    ownerSeasons,
    ownerPonds,
    ownerFarms,
    type OwnerDiseaseCase,
} from '../../app/ownerData';
import { waterMetricState } from '../../app/waterQuality';
import { ScreenHeader } from '../common';

const severityMeta = {
    low: { label: 'Thấp', tone: 'slate' as const },
    medium: { label: 'Trung bình', tone: 'amber' as const },
    high: { label: 'Cao', tone: 'rose' as const },
    critical: { label: 'Nghiêm trọng', tone: 'rose' as const },
};

const fmtDate = (iso: string) =>
    new Date(iso).toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    });

const fmtDateTime = (iso: string) =>
    new Date(iso).toLocaleString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });

const caseIsOperational = (caseItem: OwnerDiseaseCase) => {
    const season = ownerSeasons.find((item) => item.id === caseItem.seasonId);
    if (!season) return false;
    const pond = ownerPonds.find((item) => item.id === season.pondId);
    const farm = ownerFarms.find((item) => item.id === season.farmId);
    return !!pond && !pond.isDeleted && !!farm && !farm.isDeleted;
};

const responseMeta: Record<
    OwnerDiseaseCase['responses'][number]['responseType'],
    { label: string; tone: 'ocean' | 'teal' | 'amber' | 'rose' | 'violet' | 'slate' }
> = {
    request_info: { label: 'Yêu cầu bổ sung', tone: 'amber' },
    provide_info: { label: 'Bổ sung thông tin', tone: 'ocean' },
    monitoring_result: { label: 'Kết quả theo dõi', tone: 'teal' },
    treatment_result: { label: 'Kết quả điều trị', tone: 'teal' },
    emergency_alert: { label: 'Cảnh báo khẩn', tone: 'rose' },
    expert_assessment: { label: 'Đánh giá chuyên gia', tone: 'violet' },
    expert_instruction: { label: 'Chỉ dẫn chuyên gia', tone: 'violet' },
    resolution: { label: 'Kết luận ca bệnh', tone: 'teal' },
};

// ── UC 32: Disease Case List (read-only for Owner) ────────────────────────────

export function OwnerCaseList() {
    const nav = useNav();
    const operationalCases = ownerDiseaseCases.filter(caseIsOperational);
    const openCases = operationalCases.filter((c) => c.status !== 'resolved');
    const closedCases = operationalCases.filter((c) => c.status === 'resolved');
    const [tab, setTab] = useState<'open' | 'resolved'>('open');
    const visible = tab === 'open' ? openCases : closedCases;

    return (
        <div className="pb-8">
            <ScreenHeader title="Ca bệnh" />
            <div className="px-4 space-y-3">
                {operationalCases.length === 0 ? (
                    <EmptyState
                        icon={Icons.diseaseCase}
                        title="Không có ca bệnh"
                        hint="Không có ca bệnh nào đang theo dõi."
                    />
                ) : (
                    <>
                        <Segmented
                            value={tab}
                            onChange={setTab}
                            options={[
                                { value: 'open', label: `Đang xử lý (${openCases.length})` },
                                {
                                    value: 'resolved',
                                    label: `Đã giải quyết (${closedCases.length})`,
                                },
                            ]}
                        />
                        {visible.length === 0 ? (
                            <EmptyState
                                icon={Icons.diseaseCase}
                                title={
                                    tab === 'open'
                                        ? 'Không có ca đang xử lý'
                                        : 'Chưa có ca đã giải quyết'
                                }
                            />
                        ) : (
                            <div className="space-y-2.5">
                                {visible.map((c) => (
                                    <CaseCard
                                        key={c.id}
                                        caseItem={c}
                                        onClick={() =>
                                            nav.go('owner-case-detail', { caseId: c.id })
                                        }
                                    />
                                ))}
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}

function CaseCard({ caseItem: c, onClick }: { caseItem: OwnerDiseaseCase; onClick: () => void }) {
    const sm = caseStatusMeta[c.status];
    const sv = severityMeta[c.severity];
    return (
        <button
            onClick={onClick}
            className="card w-full p-3.5 text-left transition active:scale-[0.99]"
        >
            <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 text-[14px] font-bold leading-snug text-ink">{c.title}</div>
                <Badge tone={sm.tone} dot>
                    {sm.label}
                </Badge>
            </div>
            <p className="mt-1 line-clamp-2 text-[12px] leading-relaxed text-ink-soft">
                {c.description}
            </p>
            {c.aiLabel && (
                <div className="mt-2 inline-flex items-center gap-1 rounded-lg bg-violet-50 px-2 py-1 text-[10px] font-semibold text-violet-600">
                    <Icons.sparkle size={11} /> AI: {c.aiLabel}
                </div>
            )}
            <div className="mt-2.5 flex items-center justify-between gap-2 border-t border-line-soft pt-2.5">
                <div className="flex min-w-0 items-center gap-1.5">
                    <Badge tone={sv.tone}>Mức {sv.label}</Badge>
                    <span className="truncate text-[10px] text-ink-muted">
                        {c.pondName} · Báo bởi {c.reportedByName}
                    </span>
                </div>
                <div className="flex shrink-0 items-center gap-1 text-[10px] text-ink-muted">
                    {fmtDate(c.createdAt)} · {c.responsesCount} phản hồi
                    <Icons.chevronR size={13} />
                </div>
            </div>
        </button>
    );
}

// ── UC 33: Disease Case Detail (read-only for Owner) ──────────────────────────

export function OwnerCaseDetail({ caseId }: { caseId: string }) {
    const nav = useNav();
    const c = ownerDiseaseCases.find((c) => c.id === caseId);
    if (!c || !caseIsOperational(c)) {
        return (
            <div className="pb-8">
                <ScreenHeader title="Chi tiết ca bệnh" />
                <div className="px-4">
                    <EmptyState
                        icon={Icons.diseaseCase}
                        title="Không tìm thấy ca bệnh"
                        hint="Ao hoặc trang trại liên quan không còn trong danh sách quản lý."
                    />
                </div>
            </div>
        );
    }

    const season = ownerSeasons.find((item) => item.id === c.seasonId);
    const sm = caseStatusMeta[c.status];
    const sv = severityMeta[c.severity];
    const healthStatus = healthMeta[c.caseSnapshot.healthStatus];
    const treatmentProtocols = protocolsForSeason(c.seasonId)
        .filter((protocol) => protocol.diseaseCaseId === caseId)
        .sort((a, b) => b.versionNo - a.versionNo);
    const timeline = [
        ...c.statusHistory.map((entry) => ({
            kind: 'status' as const,
            id: entry.id,
            at: entry.changedAt,
            entry,
        })),
        ...c.responses.map((entry) => ({
            kind: 'response' as const,
            id: entry.id,
            at: entry.createdAt,
            entry,
        })),
    ].sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime());

    const snapshotItems = [
        c.caseSnapshot.avgWeightG != null
            ? {
                  label: 'Cỡ TB',
                  value: c.caseSnapshot.avgWeightG,
                  unit: 'g/con',
                  state: 'default' as const,
              }
            : null,
        {
            label: 'Hao hụt',
            value: c.caseSnapshot.mortalityCount,
            unit: 'con',
            state: c.caseSnapshot.mortalityCount > 0 ? ('warning' as const) : ('default' as const),
        },
        c.caseSnapshot.ph != null
            ? {
                  label: 'pH',
                  value: c.caseSnapshot.ph,
                  unit: '',
                  state: waterMetricState('ph', c.caseSnapshot.ph),
              }
            : null,
        c.caseSnapshot.no2MgL != null
            ? {
                  label: 'NO₂',
                  value: c.caseSnapshot.no2MgL,
                  unit: 'mg/L',
                  state: waterMetricState('no2', c.caseSnapshot.no2MgL),
              }
            : null,
        c.caseSnapshot.nh3MgL != null
            ? {
                  label: 'NH₃',
                  value: c.caseSnapshot.nh3MgL,
                  unit: 'mg/L',
                  state: waterMetricState('nh3', c.caseSnapshot.nh3MgL),
              }
            : null,
    ].filter((item): item is NonNullable<typeof item> => item != null);

    return (
        <div className="pb-8">
            <ScreenHeader
                title="Chi tiết ca bệnh"
                subtitle={season ? `${season.pondName} · ${season.name}` : undefined}
            />
            <div className="px-4 space-y-4">
                {/* Header */}
                <div className="rounded-2xl bg-white p-4 shadow-[0_2px_12px_rgba(0,0,0,.06)] space-y-2.5">
                    <div className="flex flex-wrap gap-1.5">
                        <Badge tone={sm.tone} dot>
                            {sm.label}
                        </Badge>
                        <Badge tone={sv.tone}>Mức {sv.label}</Badge>
                    </div>
                    <div className="text-[15px] font-bold text-ink">{c.title}</div>
                    <p className="text-[13px] leading-relaxed text-ink-soft">{c.description}</p>
                    <div className="border-t border-slate-100 pt-2.5 space-y-1">
                        <div className="text-[11px] text-ink-muted">
                            Ao: {c.pondName} · {c.farmName}
                        </div>
                        <div className="text-[11px] text-ink-muted">Vụ nuôi: {c.seasonName}</div>
                        <div className="text-[11px] text-ink-muted">
                            Mở ca: {fmtDateTime(c.createdAt)}
                        </div>
                        <div className="text-[11px] text-ink-muted">
                            Cập nhật cuối: {fmtDateTime(c.updatedAt)}
                        </div>
                    </div>
                    {c.aiLabel && (
                        <div className="rounded-lg border border-violet-100 bg-violet-50 px-3 py-2">
                            <div className="text-[10px] font-semibold uppercase tracking-wide text-violet-500">
                                Chẩn đoán AI
                            </div>
                            <div className="text-[12px] font-semibold text-violet-700">
                                {c.aiLabel}
                            </div>
                        </div>
                    )}
                </div>

                {/* Responsibility */}
                <div className="card divide-y divide-line-soft">
                    <ResponsibilityRow label="Người phát hiện và báo ca" value={c.reportedByName} />
                    <ResponsibilityRow label="Chuyên gia chịu trách nhiệm" value={c.expertName} />
                    <ResponsibilityRow
                        label="Số phản hồi đã ghi nhận"
                        value={`${c.responses.length} phản hồi`}
                    />
                </div>

                {/* Immutable snapshot used when the case was opened */}
                <div className="card space-y-3 p-4">
                    <div className="flex items-start justify-between gap-3">
                        <div>
                            <div className="font-display text-[14px] font-bold text-ink">
                                Hiện trạng khi mở ca
                            </div>
                            <div className="mt-0.5 text-[10px] text-ink-muted">
                                Chụp tại {fmtDateTime(c.caseSnapshot.recordedAt)}
                            </div>
                        </div>
                        <Badge tone={healthStatus.tone} dot>
                            {healthStatus.label}
                        </Badge>
                    </div>
                    <MetricTileGrid items={snapshotItems} />
                    {c.caseSnapshot.note && (
                        <p className="border-t border-line-soft pt-2 text-[11px] leading-relaxed text-ink-soft">
                            {c.caseSnapshot.note}
                        </p>
                    )}
                </div>

                {c.attachments.length > 0 && (
                    <div>
                        <div className="mb-2 flex items-center justify-between px-1">
                            <span className="font-display text-[14px] font-bold text-ink">
                                Bằng chứng ban đầu
                            </span>
                            <Badge tone="slate">{c.attachments.length} tệp</Badge>
                        </div>
                        <div className="space-y-2">
                            {c.attachments.map((attachment, index) => (
                                <div
                                    key={attachment.id}
                                    className="card flex items-center gap-3 p-3.5"
                                >
                                    <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-violet-50 text-violet-600">
                                        <Icons.camera size={18} />
                                    </span>
                                    <div className="min-w-0 flex-1">
                                        <div className="truncate text-[12px] font-bold text-ink">
                                            {attachment.caption || `Tệp bằng chứng ${index + 1}`}
                                        </div>
                                        <div className="mt-0.5 text-[10px] text-ink-muted">
                                            {attachment.uploadedByName} ·{' '}
                                            {fmtDateTime(attachment.createdAt)}
                                        </div>
                                        {attachment.mediaType && (
                                            <div className="text-[9px] uppercase tracking-wide text-ink-muted">
                                                {attachment.mediaType}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {c.status === 'resolved' && c.resolutionSummary && (
                    <div className="rounded-2xl border border-teal-200 bg-teal-50 p-4">
                        <div className="flex items-center gap-2 text-[13px] font-bold text-teal-700">
                            <Icons.check size={17} /> Kết luận xử lý
                        </div>
                        <p className="mt-2 text-[12px] leading-relaxed text-teal-800">
                            {c.resolutionSummary}
                        </p>
                        <div className="mt-2 border-t border-teal-200 pt-2 text-[10px] text-teal-700">
                            {c.resolvedByName} · {c.resolvedAt ? fmtDateTime(c.resolvedAt) : '—'}
                        </div>
                    </div>
                )}

                {/* Treatment protocol journey */}
                {treatmentProtocols.length > 0 && (
                    <div>
                        <div className="mb-2 flex items-center justify-between px-1">
                            <span className="font-display text-[14px] font-bold text-ink">
                                Phác đồ điều trị
                            </span>
                            <span className="text-[10px] text-ink-muted">
                                {treatmentProtocols.length} phiên bản
                            </span>
                        </div>
                        <div className="space-y-2">
                            {treatmentProtocols.map((protocol) => {
                                const pending = protocol.status === 'pending_approval';
                                const approved = protocol.status === 'approved';
                                const rejected =
                                    protocol.status === 'rejected' ||
                                    protocol.status === 'aborted' ||
                                    protocol.status === 'cancelled';
                                return (
                                    <button
                                        key={protocol.id}
                                        onClick={() =>
                                            nav.go('owner-season-protocol-detail', {
                                                protocolId: protocol.id,
                                            })
                                        }
                                        className={`card w-full p-3.5 text-left transition active:scale-[0.99] ${pending ? 'border-amber-200' : ''}`}
                                    >
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="min-w-0 text-[13px] font-bold leading-snug text-ink">
                                                {protocol.title}
                                            </div>
                                            <Badge
                                                tone={
                                                    pending
                                                        ? 'amber'
                                                        : approved
                                                          ? 'teal'
                                                          : rejected
                                                            ? 'rose'
                                                            : 'slate'
                                                }
                                                dot={pending}
                                            >
                                                {pending
                                                    ? 'Chờ duyệt'
                                                    : approved
                                                      ? 'Đang áp dụng'
                                                      : protocol.status === 'superseded'
                                                        ? 'Đã thay thế'
                                                        : 'Không áp dụng'}
                                            </Badge>
                                        </div>
                                        {protocol.summary && (
                                            <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-ink-soft">
                                                {protocol.summary}
                                            </p>
                                        )}
                                        <div className="mt-2.5 flex items-center justify-between border-t border-line-soft pt-2.5">
                                            <Badge tone="slate">
                                                Phiên bản {protocol.versionNo}
                                            </Badge>
                                            <span className="flex items-center gap-1 text-[10px] text-ink-muted">
                                                Xem phác đồ <Icons.chevronR size={13} />
                                            </span>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Complete read-only audit timeline */}
                <div>
                    <div className="mb-2 px-1">
                        <div className="font-display text-[14px] font-bold text-ink">
                            Diễn tiến và trách nhiệm
                        </div>
                        <div className="mt-0.5 text-[10px] text-ink-muted">
                            Toàn bộ thay đổi trạng thái và phản hồi theo thứ tự thời gian
                        </div>
                    </div>
                    <div className="space-y-2">
                        {timeline.map((item, index) => {
                            const isLast = index === timeline.length - 1;
                            if (item.kind === 'status') {
                                const entry = item.entry;
                                const toMeta = caseStatusMeta[entry.toStatus];
                                return (
                                    <div key={item.id} className="relative flex gap-3">
                                        {!isLast && (
                                            <span className="absolute bottom-[-10px] left-[15px] top-8 w-px bg-line" />
                                        )}
                                        <span className="relative z-10 grid size-8 shrink-0 place-items-center rounded-full bg-slate-100 text-slate-500">
                                            <Icons.refresh size={14} />
                                        </span>
                                        <div className="card min-w-0 flex-1 p-3.5">
                                            <div className="flex flex-wrap items-center gap-1.5">
                                                <span className="text-[11px] font-bold text-ink">
                                                    Đổi trạng thái
                                                </span>
                                                {entry.fromStatus && (
                                                    <Badge
                                                        tone={caseStatusMeta[entry.fromStatus].tone}
                                                    >
                                                        {caseStatusMeta[entry.fromStatus].label}
                                                    </Badge>
                                                )}
                                                {entry.fromStatus && (
                                                    <Icons.chevronR
                                                        size={13}
                                                        className="text-ink-muted"
                                                    />
                                                )}
                                                <Badge tone={toMeta.tone} dot>
                                                    {toMeta.label}
                                                </Badge>
                                            </div>
                                            {entry.reason && (
                                                <p className="mt-1.5 text-[11px] leading-relaxed text-ink-soft">
                                                    {entry.reason}
                                                </p>
                                            )}
                                            <div className="mt-2 text-[10px] text-ink-muted">
                                                {entry.changedByName} ·{' '}
                                                {fmtDateTime(entry.changedAt)}
                                            </div>
                                        </div>
                                    </div>
                                );
                            }

                            const entry = item.entry;
                            const meta = responseMeta[entry.responseType];
                            return (
                                <div key={item.id} className="relative flex gap-3">
                                    {!isLast && (
                                        <span className="absolute bottom-[-10px] left-[15px] top-8 w-px bg-line" />
                                    )}
                                    <span
                                        className={`relative z-10 grid size-8 shrink-0 place-items-center rounded-full ${entry.authorRole === 'Chuyên gia' ? 'bg-violet-50 text-violet-600' : 'bg-ocean-50 text-ocean-600'}`}
                                    >
                                        <Icons.chat size={14} />
                                    </span>
                                    <div className="card min-w-0 flex-1 p-3.5">
                                        <div className="flex flex-wrap items-center gap-1.5">
                                            <Badge tone={meta.tone}>{meta.label}</Badge>
                                            <span className="text-[10px] font-semibold text-ink-muted">
                                                {entry.authorRole}
                                            </span>
                                        </div>
                                        <p className="mt-2 text-[12px] leading-relaxed text-ink">
                                            {entry.message}
                                        </p>
                                        <div className="mt-2 flex flex-wrap items-center gap-x-2 text-[10px] text-ink-muted">
                                            <span>{entry.authorName}</span>
                                            <span>·</span>
                                            <span>{fmtDateTime(entry.createdAt)}</span>
                                            {entry.attachmentsCount ? (
                                                <span>· {entry.attachmentsCount} tệp đính kèm</span>
                                            ) : null}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}

function ResponsibilityRow({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex items-center gap-3 px-4 py-3">
            <span className="grid size-8 shrink-0 place-items-center rounded-full bg-ocean-50 text-ocean-600">
                <Icons.user size={15} />
            </span>
            <div className="min-w-0 flex-1">
                <div className="text-[10px] uppercase tracking-wide text-ink-muted">{label}</div>
                <div className="mt-0.5 text-[12px] font-semibold text-ink">{value}</div>
            </div>
        </div>
    );
}
