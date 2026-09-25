import { useState } from 'react';
import { useNav } from '../../app/store';
import {
    Icons,
    Badge,
    Field,
    inputClass,
    PrimaryButton,
    GhostButton,
    EmptyState,
    Segmented,
    MetricTileGrid,
    AppDialog,
    num,
    seasonMeta,
} from '../../app/ui';
import {
    ownerSeasons,
    ownerPonds,
    ownerFarms,
    seasonAssignments,
    harvestEvents,
    harvestsForSeason,
    assignmentsForSeason,
    latestWaterForSeason,
    latestHealthForSeason,
    seasonKpiFor,
    protocolsForSeason,
    casesForSeason,
    ownerProducts,
    inventoryTransactions,
    ownerOperationOccurrences,
    type OwnerSeason,
    type HarvestEvent,
    type OwnerWaterLog,
    type OwnerHealthLog,
    type OwnerHealthStatus,
} from '../../app/ownerData';
import { healthMeta } from '../../app/ui';
import { currentUser } from '../../app/data';
import { waterMetricState, type WaterMetricKey } from '../../app/waterQuality';
import { ScreenHeader } from '../common';

// ── helpers ───────────────────────────────────────────────────────────────────

const shrimpLabel = (t: OwnerSeason['shrimpType']) =>
    t === 'whiteleg' ? 'Tôm thẻ chân trắng' : 'Tôm sú';

const fmtDate = (iso?: string) =>
    iso
        ? new Date(iso).toLocaleDateString('vi-VN', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
          })
        : '—';

const fmtDateTime = (iso: string) =>
    new Date(iso).toLocaleString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
    });

const fmtReadingTime = (iso: string) =>
    `${new Date(iso).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} · ${new Date(iso).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })}`;

const fmtMoney = (n?: number) => (n != null ? n.toLocaleString('vi-VN') + ' ₫' : '—');

const localDateValue = (date = new Date()) => {
    const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
    return local.toISOString().slice(0, 10);
};

const localDateTimeValue = (date = new Date()) => {
    const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
    return local.toISOString().slice(0, 16);
};

const seasonHasActiveParents = (season: OwnerSeason) => {
    const pond = ownerPonds.find((item) => item.id === season.pondId);
    const farm = ownerFarms.find((item) => item.id === season.farmId);
    return !!pond && !pond.isDeleted && !!farm && !farm.isDeleted;
};

const optionalPositiveNumber = (value: string) => (value.trim() ? Number(value) : undefined);

// ── UC 11: Season List (all farms) ───────────────────────────────────────────

export function OwnerSeasonList() {
    const nav = useNav();
    type FilterStatus = 'active' | 'planning' | 'completed' | 'cancelled';
    const [filter, setFilter] = useState<FilterStatus>('active');
    const visible = ownerSeasons.filter((s) => s.status === filter && seasonHasActiveParents(s));

    return (
        <div className="pb-8">
            <div className="flex items-start justify-between px-4 pb-2 pt-[52px]">
                <h1 className="font-display text-[22px] font-extrabold leading-tight tracking-tight text-ink">
                    Vụ nuôi
                </h1>
            </div>

            <div className="px-4 space-y-3">
                <Segmented
                    value={filter}
                    onChange={setFilter}
                    options={[
                        { value: 'active', label: 'Đang nuôi' },
                        { value: 'planning', label: 'Chuẩn bị' },
                        { value: 'completed', label: 'Hoàn tất' },
                        { value: 'cancelled', label: 'Đã hủy' },
                    ]}
                />

                {visible.length === 0 ? (
                    <EmptyState
                        icon={Icons.layers}
                        title="Không có vụ nuôi"
                        hint={`Chưa có vụ nào ở trạng thái "${seasonMeta[filter].label}".`}
                    />
                ) : (
                    <div className="space-y-2.5">
                        {visible.map((s) => (
                            <SeasonCard
                                key={s.id}
                                season={s}
                                onClick={() => nav.go('owner-season-detail', { seasonId: s.id })}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

function SeasonCard({ season: s, onClick }: { season: OwnerSeason; onClick: () => void }) {
    const meta = seasonMeta[s.status];
    return (
        <button
            onClick={onClick}
            className="flex w-full items-start gap-3 rounded-2xl bg-white px-4 py-3.5 text-left shadow-[0_2px_12px_rgba(0,0,0,.06)] transition active:scale-[0.99]"
        >
            <span
                className={`mt-0.5 grid size-9 shrink-0 place-items-center rounded-xl ${
                    meta.tone === 'teal'
                        ? 'bg-teal-50 text-teal-600'
                        : meta.tone === 'violet'
                          ? 'bg-violet-50 text-violet-600'
                          : 'bg-slate-50 text-slate-500'
                }`}
            >
                <Icons.layers size={16} />
            </span>
            <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                    <span className="truncate text-[13px] font-bold text-ink">{s.pondName}</span>
                    <Badge tone={meta.tone} dot>
                        {meta.label}
                    </Badge>
                </div>
                <div className="mt-0.5 truncate text-[12px] text-ink-muted">
                    {s.farmName} · {shrimpLabel(s.shrimpType)}
                </div>
                {s.status === 'active' && (
                    <div className="mt-1 text-[11px] text-ocean-600 font-semibold">
                        DOC {s.dayOfCulture} · Thả {num(s.initialQuantity ?? 0)} con
                    </div>
                )}
                {s.status === 'planning' && (
                    <div className="mt-1 text-[11px] text-violet-600 font-semibold">
                        {s.hasApprovedProtocol
                            ? '✓ Phác đồ đã duyệt'
                            : '⚠ Chưa có phác đồ được duyệt'}
                    </div>
                )}
            </div>
            <Icons.chevronR size={16} className="mt-1 shrink-0 text-ink-muted" />
        </button>
    );
}

// ── UC 12: Season Detail ──────────────────────────────────────────────────────

export function SeasonDetail({ seasonId }: { seasonId: string }) {
    const nav = useNav();
    const s = ownerSeasons.find((s) => s.id === seasonId);
    const [showCancelConfirm, setShowCancelConfirm] = useState(false);
    const [cancelReason, setCancelReason] = useState('');
    const [cancelError, setCancelError] = useState('');
    if (!s || !seasonHasActiveParents(s)) {
        return (
            <div className="pb-8">
                <ScreenHeader title="Vụ nuôi" />
                <div className="px-4">
                    <EmptyState
                        icon={Icons.layers}
                        title="Không tìm thấy vụ nuôi"
                        hint="Ao hoặc trang trại của vụ này không còn trong danh sách quản lý."
                    />
                </div>
            </div>
        );
    }

    const assignments = assignmentsForSeason(seasonId);
    const ktv = assignments.find((a) => a.role === 'technician');
    const expert = assignments.find((a) => a.role === 'expert');
    const harvests = harvestsForSeason(seasonId);
    const hasFinalHarvest = harvests.some((h) => h.harvestType === 'final');

    const water = latestWaterForSeason(seasonId);
    const health = latestHealthForSeason(seasonId);
    const kpi = seasonKpiFor(seasonId);
    const showFcr =
        (s.status === 'active' || s.status === 'completed') && kpi != null && kpi.fcr > 0;
    const protocols = protocolsForSeason(seasonId);
    const pendingProtocolCount = protocols.filter(
        (protocol) => protocol.status === 'pending_approval',
    ).length;
    const cases = casesForSeason(seasonId);
    const activeCases = cases.filter((c) => c.status !== 'resolved');

    const canActivate =
        s.status === 'planning' &&
        !!s.stockingDate &&
        s.initialQuantity != null &&
        !!ktv &&
        !!expert &&
        s.hasApprovedProtocol;

    const activateBlockReason = !canActivate
        ? [
              !s.stockingDate ? 'Thiếu ngày thả giống' : '',
              !s.initialQuantity ? 'Thiếu số lượng thả ban đầu' : '',
              !ktv ? 'Chưa phân công KTV' : '',
              !expert ? 'Chưa phân công Chuyên gia' : '',
              !s.hasApprovedProtocol ? 'Chưa có phác đồ nuôi được duyệt' : '',
          ].filter(Boolean)
        : [];

    const handleCancel = () => {
        if (!cancelReason.trim()) {
            setCancelError('Vui lòng nhập lý do hủy vụ.');
            return;
        }
        const wasActive = s.status === 'active';
        s.status = 'cancelled';
        s.cancellationReason = cancelReason.trim();
        if (wasActive) s.actualEndDate = localDateValue();
        const pond = ownerPonds.find((item) => item.id === s.pondId);
        if (pond?.currentSeasonId === s.id) pond.currentSeasonId = undefined;
        const farm = ownerFarms.find((item) => item.id === s.farmId);
        if (farm) {
            farm.activeSeasonsCount = ownerSeasons.filter(
                (season) => season.farmId === farm.id && season.status === 'active',
            ).length;
        }
        nav.toast('Vụ nuôi đã được hủy và giữ lại trong lịch sử.');
        setShowCancelConfirm(false);
        nav.back();
    };

    return (
        <div className="pb-8">
            <ScreenHeader
                title={s.name}
                subtitle={`${s.pondName} · ${s.farmName}`}
                right={
                    s.status === 'planning' ? (
                        <button
                            onClick={() => nav.go('owner-season-edit', { seasonId })}
                            className="grid size-9 place-items-center rounded-full bg-slate-50 text-ink-soft"
                        >
                            <Icons.edit size={17} />
                        </button>
                    ) : undefined
                }
            />

            <div className="px-4 space-y-4">
                {/* Season header */}
                <div className="rounded-2xl bg-white p-4 shadow-[0_2px_12px_rgba(0,0,0,.06)] space-y-3">
                    <div className="flex items-start gap-x-18">
                        <div>
                            <div className="mt-0.5 text-[13px] text-ocean-600 font-semibold">
                                {shrimpLabel(s.shrimpType)}
                            </div>
                        </div>
                        <Badge tone={seasonMeta[s.status].tone} dot>
                            {seasonMeta[s.status].label}
                        </Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-x-4 gap-y-2 pt-1">
                        <InfoCell label="Ngày thả giống" value={fmtDate(s.stockingDate)} />
                        <InfoCell label="Dự kiến kết thúc" value={fmtDate(s.expectedEndDate)} />
                        {s.actualEndDate && (
                            <InfoCell label="Kết thúc thực tế" value={fmtDate(s.actualEndDate)} />
                        )}
                        {s.initialQuantity && (
                            <InfoCell
                                label="Số lượng thả"
                                value={`${num(s.initialQuantity)} con`}
                            />
                        )}
                        {s.initialDensityPerM2 && (
                            <InfoCell
                                label="Mật độ thả"
                                value={`${s.initialDensityPerM2} con/m²`}
                            />
                        )}
                        {s.status === 'active' && (
                            <InfoCell label="DOC" value={`Ngày ${s.dayOfCulture}`} highlight />
                        )}
                        {showFcr && (
                            <InfoCell label="FCR tạm tính" value={kpi.fcr.toFixed(2)} highlight />
                        )}
                    </div>
                    {s.status === 'cancelled' && s.cancellationReason && (
                        <div className="rounded-xl border border-rose-100 bg-rose-50 px-3 py-2.5">
                            <div className="text-[10px] font-semibold uppercase tracking-wide text-rose-500">
                                Lý do hủy vụ
                            </div>
                            <p className="mt-1 text-[12px] leading-relaxed text-rose-700">
                                {s.cancellationReason}
                            </p>
                        </div>
                    )}
                </div>

                {/* Latest water_quality_log */}
                {water && s.status === 'active' && <WaterCard water={water} />}

                {/* Latest shrimp_health_log */}
                {health && s.status === 'active' && <HealthCard health={health} />}

                {(s.status === 'active' || s.status === 'completed') && (
                    <SeasonCostCard seasonId={seasonId} />
                )}

                {/* Production protocols must be reachable before activation; treatment
                    versions remain reachable for review while the season is active. */}
                <div className="space-y-2">
                    <button
                        onClick={() => nav.go('owner-season-protocols', { seasonId })}
                        className="card flex w-full items-center gap-3 p-3.5 text-left transition active:scale-[0.99]"
                    >
                        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-ocean-50 text-ocean-600">
                            <Icons.shield size={18} />
                        </span>
                        <div className="min-w-0 flex-1">
                            <div className="text-[14px] font-bold text-ink">Phác đồ</div>
                            <div className="mt-0.5 text-[11px] text-ink-muted">
                                {pendingProtocolCount > 0
                                    ? `${pendingProtocolCount} phác đồ đang chờ bạn xem và duyệt`
                                    : 'Xem kế hoạch nuôi, điều trị và từng cữ thực hiện'}
                            </div>
                            <div className="mt-1.5 flex flex-wrap gap-1.5">
                                {pendingProtocolCount > 0 && (
                                    <Badge tone="amber" dot>
                                        {pendingProtocolCount} chờ duyệt
                                    </Badge>
                                )}
                                <Badge tone="ocean">
                                    {
                                        protocols.filter((p) => p.protocolType === 'production')
                                            .length
                                    }{' '}
                                    nuôi
                                </Badge>
                                <Badge tone="rose">
                                    {protocols.filter((p) => p.protocolType === 'treatment').length}{' '}
                                    điều trị
                                </Badge>
                            </div>
                        </div>
                        <Icons.chevronR size={16} className="shrink-0 text-ink-muted" />
                    </button>

                    {s.status !== 'planning' && (
                        <button
                            onClick={() => nav.go('owner-season-cases', { seasonId })}
                            className="card flex w-full items-center gap-3 p-3.5 text-left transition active:scale-[0.99]"
                        >
                            <span
                                className={`grid size-10 shrink-0 place-items-center rounded-xl ${
                                    activeCases.length > 0
                                        ? 'bg-rose-50 text-rose-500'
                                        : 'bg-slate-50 text-slate-400'
                                }`}
                            >
                                <Icons.heart size={18} />
                            </span>
                            <div className="min-w-0 flex-1">
                                <div className="text-[14px] font-bold text-ink">Ca bệnh</div>
                                <div className="mt-0.5 text-[11px] text-ink-muted">
                                    Theo dõi chẩn đoán và diễn tiến xử lý
                                </div>
                                <div className="mt-1.5">
                                    <Badge
                                        tone={activeCases.length > 0 ? 'rose' : 'teal'}
                                        dot={activeCases.length > 0}
                                    >
                                        {activeCases.length > 0
                                            ? `${activeCases.length} đang xử lý`
                                            : 'Không có ca mở'}
                                    </Badge>
                                </div>
                            </div>
                            <Icons.chevronR size={16} className="shrink-0 text-ink-muted" />
                        </button>
                    )}
                </div>

                {/* Activation checklist (planning only) */}
                {s.status === 'planning' && (
                    <div className="rounded-2xl bg-white p-4 shadow-[0_2px_12px_rgba(0,0,0,.06)] space-y-2">
                        <div className="font-display text-[14px] font-bold text-ink mb-2">
                            Điều kiện kích hoạt vụ
                        </div>
                        {[
                            { ok: !!s.stockingDate, text: 'Ngày thả giống đã nhập' },
                            { ok: !!s.initialQuantity, text: 'Số lượng giống ban đầu' },
                            {
                                ok: !!ktv,
                                text: `KTV phụ trách: ${ktv ? ktv.accountName : 'Chưa phân công'}`,
                            },
                            {
                                ok: !!expert,
                                text: `Chuyên gia: ${
                                    expert ? expert.accountName : 'Chưa phân công'
                                }`,
                            },
                            { ok: s.hasApprovedProtocol, text: 'Phác đồ nuôi đã được duyệt' },
                        ].map((item, i) => (
                            <div key={i} className="flex items-center gap-2.5">
                                <span
                                    className={`grid size-5 place-items-center rounded-full ${
                                        item.ok
                                            ? 'bg-emerald-100 text-emerald-600'
                                            : 'bg-rose-100 text-rose-500'
                                    }`}
                                >
                                    {item.ok ? <Icons.check size={11} /> : <Icons.x size={11} />}
                                </span>
                                <span
                                    className={`text-[13px] ${
                                        item.ok ? 'text-ink' : 'text-rose-600'
                                    }`}
                                >
                                    {item.text}
                                </span>
                            </div>
                        ))}
                    </div>
                )}

                {/* Assignments */}
                <div>
                    <div className="mb-2 flex items-center justify-between px-1">
                        <span className="font-display text-[14px] font-bold text-ink">
                            Nhân sự phụ trách
                        </span>
                        {s.status !== 'completed' && s.status !== 'cancelled' && (
                            <button
                                onClick={() => nav.go('owner-assign-personnel', { seasonId })}
                                className="text-[12px] font-semibold text-ocean-600"
                            >
                                Phân công
                            </button>
                        )}
                    </div>
                    <div className="space-y-2">
                        <PersonnelRow
                            label="Kỹ thuật viên"
                            name={ktv?.accountName}
                            assignedAt={ktv?.assignedAt}
                            empty="Chưa phân công"
                        />
                        <PersonnelRow
                            label="Chuyên gia thủy sản"
                            name={expert?.accountName}
                            assignedAt={expert?.assignedAt}
                            empty="Chưa phân công"
                        />
                    </div>
                </div>

                {/* Harvest section */}
                {(s.status === 'active' || s.status === 'completed') && (
                    <div>
                        <div className="mb-2 flex items-center justify-between px-1">
                            <span className="font-display text-[14px] font-bold text-ink">
                                Thu hoạch
                            </span>
                            {s.status === 'active' && !hasFinalHarvest && (
                                <button
                                    onClick={() => nav.go('owner-harvest-record', { seasonId })}
                                    className="flex items-center gap-1 text-[12px] font-semibold text-ocean-600"
                                >
                                    <Icons.plus size={14} />
                                    Ghi nhận
                                </button>
                            )}
                        </div>
                        {harvests.length === 0 ? (
                            <div className="rounded-xl border border-dashed border-line px-4 py-3 text-center text-[12px] text-ink-muted">
                                Chưa có lần thu hoạch nào.
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {harvests.map((h) => (
                                    <HarvestCard
                                        key={h.id}
                                        harvest={h}
                                        onPress={() =>
                                            nav.go('owner-harvest-detail', { harvestId: h.id })
                                        }
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Action buttons */}
                <div className="space-y-2.5 pt-1">
                    {s.status === 'planning' && canActivate && (
                        <PrimaryButton
                            full
                            icon={Icons.check}
                            onClick={() => {
                                s.status = 'active';
                                if (s.stockingDate) {
                                    const start = new Date(`${s.stockingDate}T00:00:00`);
                                    const now = new Date();
                                    s.dayOfCulture = Math.max(
                                        1,
                                        Math.floor((now.getTime() - start.getTime()) / 86_400_000) +
                                            1,
                                    );
                                }
                                const pond = ownerPonds.find((item) => item.id === s.pondId);
                                if (pond) pond.currentSeasonId = s.id;
                                const farm = ownerFarms.find((item) => item.id === s.farmId);
                                if (farm) {
                                    farm.activeSeasonsCount = ownerSeasons.filter(
                                        (season) =>
                                            season.farmId === farm.id && season.status === 'active',
                                    ).length;
                                }
                                nav.toast('Vụ nuôi đã được kích hoạt!');
                                nav.back();
                            }}
                        >
                            Kích hoạt vụ nuôi
                        </PrimaryButton>
                    )}

                    {(s.status === 'planning' || s.status === 'active') && !showCancelConfirm && (
                        <GhostButton full icon={Icons.x} onClick={() => setShowCancelConfirm(true)}>
                            Hủy vụ nuôi
                        </GhostButton>
                    )}
                </div>
            </div>
            <AppDialog
                open={showCancelConfirm}
                onClose={() => setShowCancelConfirm(false)}
                tone="danger"
                title="Hủy vụ nuôi?"
                description="Vụ nuôi sẽ chuyển sang trạng thái Đã hủy và được giữ lại trong lịch sử. Đây không phải thao tác xóa dữ liệu."
                footer={
                    <div className="grid grid-cols-2 gap-2">
                        <GhostButton full onClick={() => setShowCancelConfirm(false)}>
                            Quay lại
                        </GhostButton>
                        <PrimaryButton full tone="rose" onClick={handleCancel}>
                            Xác nhận hủy
                        </PrimaryButton>
                    </div>
                }
            >
                <Field label="Lý do hủy *" error={cancelError}>
                    <textarea
                        className={`${inputClass} min-h-[82px] resize-none ${cancelError ? 'border-rose-400' : ''}`}
                        placeholder="Nhập lý do hủy vụ nuôi…"
                        value={cancelReason}
                        onChange={(event) => {
                            setCancelReason(event.target.value);
                            setCancelError('');
                        }}
                    />
                </Field>
            </AppDialog>
        </div>
    );
}

// ── WaterCard — renders all water_quality_logs columns ────────────────────────

function WaterCard({ water: w }: { water: OwnerWaterLog }) {
    const rows: {
        label: string;
        value: string | undefined;
        rawValue: number | undefined;
        unit: string;
        metric: WaterMetricKey;
    }[] = [
        {
            label: 'Nhiệt độ',
            value: w.temperatureC?.toString(),
            rawValue: w.temperatureC,
            unit: '°C',
            metric: 'temperature',
        },
        { label: 'pH', value: w.ph?.toString(), rawValue: w.ph, unit: '', metric: 'ph' },
        {
            label: 'DO',
            value: w.dissolvedOxygenMgL?.toString(),
            rawValue: w.dissolvedOxygenMgL,
            unit: 'mg/L',
            metric: 'dissolvedOxygen',
        },
        {
            label: 'Độ mặn',
            value: w.salinityPpt?.toString(),
            rawValue: w.salinityPpt,
            unit: '‰',
            metric: 'salinity',
        },
        {
            label: 'NH₃',
            value: w.nh3MgL?.toString(),
            rawValue: w.nh3MgL,
            unit: 'mg/L',
            metric: 'nh3',
        },
        {
            label: 'NO₂',
            value: w.no2MgL?.toString(),
            rawValue: w.no2MgL,
            unit: 'mg/L',
            metric: 'no2',
        },
        {
            label: 'Kiềm',
            value: w.alkalinityMgLCaCO3?.toFixed(0),
            rawValue: w.alkalinityMgLCaCO3,
            unit: 'mg/L',
            metric: 'alkalinity',
        },
        {
            label: 'H₂S',
            value: w.h2sMgL?.toString(),
            rawValue: w.h2sMgL,
            unit: 'mg/L',
            metric: 'h2s',
        },
    ].filter((r) => r.value != null) as {
        label: string;
        value: string;
        rawValue: number;
        unit: string;
        metric: WaterMetricKey;
    }[];

    return (
        <div className="card space-y-3 p-4">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <div className="font-display text-[14px] font-bold text-ink">
                        Đo nước gần nhất
                    </div>
                    <div className="mt-0.5 text-[9px] text-ink-muted">KTV · {w.recordedByName}</div>
                </div>
                <span className="shrink-0 text-[10px] text-ink-muted">
                    {fmtReadingTime(w.recordedAt)}
                </span>
            </div>
            <MetricTileGrid
                items={rows.map((row) => ({
                    label: row.label,
                    value: row.value,
                    unit: row.unit,
                    state: waterMetricState(row.metric, row.rawValue),
                }))}
            />
            {w.note && (
                <p className="border-t border-slate-100 pt-2 text-[11px] leading-relaxed text-ink-muted">
                    {w.note}
                </p>
            )}
        </div>
    );
}

function SeasonCostCard({ seasonId }: { seasonId: string }) {
    const completedExecutionIds = new Set(
        ownerOperationOccurrences
            .filter(
                (operation) =>
                    operation.seasonId === seasonId &&
                    operation.status === 'completed' &&
                    operation.execution,
            )
            .map((operation) => operation.execution!.id),
    );
    const transactions = inventoryTransactions.filter(
        (transaction) =>
            transaction.seasonId === seasonId &&
            transaction.transactionType === 'stock_out' &&
            transaction.referenceType === 'operation_execution' &&
            !!transaction.referenceId &&
            completedExecutionIds.has(transaction.referenceId),
    );
    const costs = transactions.reduce(
        (result, transaction) => {
            const category = ownerProducts.find(
                (product) => product.id === transaction.productId,
            )?.category;
            if (category === 'feed') result.feed += transaction.totalAmount;
            else if (category === 'medicine') result.medicine += transaction.totalAmount;
            else if (category === 'mineral' || category === 'chemical')
                result.environment += transaction.totalAmount;
            return result;
        },
        { feed: 0, medicine: 0, environment: 0 },
    );
    const total = costs.feed + costs.medicine + costs.environment;
    const feedPct = total > 0 ? (costs.feed / total) * 100 : 0;
    const medicinePct = total > 0 ? (costs.medicine / total) * 100 : 0;
    const environmentPct = total > 0 ? (costs.environment / total) * 100 : 0;
    const completedShiftCount = new Set(transactions.map((transaction) => transaction.referenceId))
        .size;
    const compactCost = (value: number) =>
        value >= 1_000_000
            ? `${(value / 1_000_000).toLocaleString('vi-VN', { maximumFractionDigits: 2 })} tr ₫`
            : fmtMoney(value);
    const rows = [
        { key: 'feed', label: 'Thức ăn', value: costs.feed, percent: feedPct, color: '#0f9b8e' },
        {
            key: 'medicine',
            label: 'Thuốc',
            value: costs.medicine,
            percent: medicinePct,
            color: '#d43b57',
        },
        {
            key: 'environment',
            label: 'Môi trường',
            value: costs.environment,
            percent: environmentPct,
            color: '#7b5bd6',
        },
    ];

    return (
        <div className="card p-4">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <div className="font-display text-[14px] font-bold text-ink">
                        Chi phí vật tư
                    </div>
                </div>
            </div>

            {total > 0 ? (
                <div className="mt-4 flex items-center gap-4">
                    <div className="relative size-32 shrink-0">
                        <div
                            className="absolute inset-0 rounded-full"
                            style={{
                                background: `conic-gradient(#0f9b8e 0 ${feedPct}%, #d43b57 ${feedPct}% ${feedPct + medicinePct}%, #7b5bd6 ${feedPct + medicinePct}% 100%)`,
                            }}
                        />
                        <div className="absolute inset-[14px] grid place-items-center rounded-full bg-white text-center shadow-inner">
                            <div>
                                <div className="text-[9px] font-semibold uppercase tracking-wide text-ink-muted">
                                    Tổng đã dùng
                                </div>
                                <div className="mt-0.5 font-display text-[14px] font-extrabold text-ink">
                                    {compactCost(total)}
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="min-w-0 flex-1 space-y-2.5">
                        {rows.map((row) => (
                            <div key={row.key}>
                                <div className="flex items-center justify-between gap-2">
                                    <span className="flex min-w-0 items-center gap-2 text-[10px] font-semibold text-ink-soft">
                                        <span
                                            className="size-2.5 shrink-0 rounded-full"
                                            style={{ backgroundColor: row.color }}
                                        />
                                        {row.label}
                                    </span>
                                    <span className="shrink-0 text-[10px] font-bold text-ink">
                                        {compactCost(row.value)}
                                    </span>
                                </div>
                                <div className="mt-1 flex items-center gap-2">
                                    <div className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-slate-100">
                                        <div
                                            className="h-full rounded-full"
                                            style={{
                                                width: `${row.percent}%`,
                                                backgroundColor: row.color,
                                            }}
                                        />
                                    </div>
                                    <span className="w-8 text-right font-mono text-[9px] text-ink-muted">
                                        {row.percent.toFixed(0)}%
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                <div className="mt-3 rounded-xl border border-dashed border-line px-4 py-4 text-center">
                    <div className="text-[11px] font-semibold text-ink-soft">
                        Chưa phát sinh chi phí
                    </div>
                    <p className="mt-1 text-[9px] leading-relaxed text-ink-muted">
                        Chi phí chỉ xuất hiện khi cữ đã hoàn thành tạo giao dịch xuất kho hợp lệ.
                    </p>
                </div>
            )}
        </div>
    );
}

// ── HealthCard — renders all shrimp_health_logs columns ──────────────────────

function HealthCard({ health: h }: { health: OwnerHealthLog }) {
    const hm = healthMeta[h.healthStatus];

    const toneStyle: Record<string, string> = {
        teal: 'bg-emerald-100 text-emerald-700',
        amber: 'bg-amber-100 text-amber-700',
        rose: 'bg-rose-100 text-rose-700',
        slate: 'bg-slate-100 text-slate-600',
    };
    const badge = toneStyle[hm.tone] ?? toneStyle.slate;

    const stats: { label: string; value: string | number; unit: string }[] = [
        ...(h.sampleSize != null
            ? [{ label: 'Cỡ mẫu', value: h.sampleSize.toLocaleString('vi-VN'), unit: 'con' }]
            : []),
        ...(h.avgWeightG != null ? [{ label: 'Cỡ TB', value: h.avgWeightG, unit: 'g/con' }] : []),
        ...(h.avgLengthCm != null ? [{ label: 'Dài TB', value: h.avgLengthCm, unit: 'cm' }] : []),
        {
            label: 'Hao hụt',
            value: h.mortalityCount.toLocaleString('vi-VN'),
            unit: 'con',
        },
        ...(h.estimatedPopulation != null
            ? [
                  {
                      label: 'Quần thể',
                      value: h.estimatedPopulation.toLocaleString('vi-VN'),
                      unit: 'con',
                  },
              ]
            : []),
        ...(h.estimatedBiomassKg != null
            ? [
                  {
                      label: 'Sinh khối',
                      value: h.estimatedBiomassKg.toLocaleString('vi-VN'),
                      unit: 'kg',
                  },
              ]
            : []),
    ];

    return (
        <div className="card space-y-3 p-4">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <div className="font-display text-[14px] font-bold text-ink">
                        Sức khỏe gần nhất
                    </div>
                    <div className="mt-0.5 text-[9px] text-ink-muted">KTV · {h.recordedByName}</div>
                </div>
                <div className="text-right">
                    <div className="text-[10px] text-ink-muted">{fmtReadingTime(h.recordedAt)}</div>
                    <span
                        className={`mt-1 inline-flex rounded-lg px-2 py-0.5 text-[10px] font-bold ${badge}`}
                    >
                        {hm.label}
                    </span>
                </div>
            </div>

            <MetricTileGrid items={stats} />

            {h.note && (
                <p className="border-t border-slate-100 pt-2 text-[11px] leading-relaxed text-ink-muted">
                    {h.note}
                </p>
            )}
        </div>
    );
}

function InfoCell({
    label,
    value,
    highlight,
}: {
    label: string;
    value: string;
    highlight?: boolean;
}) {
    return (
        <div>
            <div className="text-[10px] uppercase tracking-wide text-ink-muted">{label}</div>
            <div
                className={`mt-0.5 text-[13px] font-semibold ${
                    highlight ? 'text-ocean-600' : 'text-ink'
                }`}
            >
                {value}
            </div>
        </div>
    );
}

function PersonnelRow({
    label,
    name,
    assignedAt,
    empty,
}: {
    label: string;
    name?: string;
    assignedAt?: string;
    empty: string;
}) {
    return (
        <div className="flex items-center gap-3 rounded-xl bg-white px-4 py-3 shadow-[0_1px_6px_rgba(0,0,0,.05)]">
            <span className="grid size-8 shrink-0 place-items-center rounded-full bg-ocean-50 text-ocean-500">
                <Icons.user size={15} />
            </span>
            <div className="min-w-0 flex-1">
                <div className="text-[10px] uppercase tracking-wide text-ink-muted">{label}</div>
                <div
                    className={`text-[13px] font-semibold ${
                        name ? 'text-ink' : 'text-ink-muted italic'
                    }`}
                >
                    {name ?? empty}
                </div>
                {assignedAt && (
                    <div className="text-[10px] text-ink-muted">Từ {fmtDate(assignedAt)}</div>
                )}
            </div>
        </div>
    );
}

function HarvestCard({ harvest: h, onPress }: { harvest: HarvestEvent; onPress: () => void }) {
    return (
        <button
            type="button"
            onClick={onPress}
            className="w-full rounded-xl bg-white px-4 py-3 text-left shadow-[0_1px_6px_rgba(0,0,0,.05)] transition active:scale-[0.99]"
        >
            <div className="flex items-center justify-between">
                <span className="text-[12px] font-bold text-ink">
                    {h.harvestType === 'partial' ? 'Thu tỉa' : 'Thu hoạch cuối'}
                </span>
                <Icons.chevronR size={16} className="text-ink-muted" />
            </div>
            <div className="text-[11px] text-ink-muted">{fmtDate(h.harvestedAt)}</div>
            <div className="mt-3 grid grid-cols-3 divide-x divide-line-soft rounded-lg bg-slate-50 py-2.5 text-center">
                <div>
                    <div className="text-[10px] text-ink-muted">Sản lượng</div>
                    <div className="text-[13px] font-bold text-ink">{num(h.totalWeightKg)} kg</div>
                </div>
                <div>
                    <div className="text-[10px] text-ink-muted">Giá/kg</div>
                    <div className="text-[13px] font-bold text-ink">
                        {num(h.pricePerKg || 180.0)} ₫
                    </div>
                </div>
                <div>
                    <div className="text-[10px] text-ink-muted">Doanh thu</div>
                    <div className="text-[13px] font-bold text-teal-700">
                        {fmtMoney(h.totalRevenue)}
                    </div>
                </div>
            </div>
        </button>
    );
}

export function HarvestDetail({ harvestId }: { harvestId: string }) {
    const h = harvestEvents.find((item) => item.id === harvestId);
    const season = h ? ownerSeasons.find((item) => item.id === h.seasonId) : undefined;

    if (!h || !season || !seasonHasActiveParents(season)) {
        return (
            <div className="pb-8">
                <ScreenHeader title="Chi tiết thu hoạch" />
                <div className="px-4">
                    <EmptyState
                        icon={Icons.harvest}
                        title="Không tìm thấy lần thu hoạch"
                        hint="Vụ nuôi liên quan không còn trong danh sách quản lý."
                    />
                </div>
            </div>
        );
    }

    return (
        <div className="pb-8">
            <ScreenHeader
                title="Chi tiết thu hoạch"
                subtitle={`${season.pondName} · ${season.farmName}`}
            />
            <div className="space-y-4 px-4">
                <div className="overflow-hidden rounded-2xl bg-white shadow-[0_2px_12px_rgba(0,0,0,.06)]">
                    <div
                        className={`h-1.5 ${h.harvestType === 'final' ? 'bg-teal-500' : 'bg-ocean-500'}`}
                    />
                    <div className="p-4">
                        <div className="flex items-center justify-between gap-2">
                            <Badge tone={h.harvestType === 'final' ? 'teal' : 'ocean'} dot>
                                {h.harvestType === 'final' ? 'Thu hoạch cuối' : 'Thu tỉa'}
                            </Badge>
                            <span className="text-[10px] text-ink-muted">
                                {fmtDateTime(h.harvestedAt)}
                            </span>
                        </div>
                        <div className="mt-4 grid grid-cols-2 gap-3">
                            <div>
                                <div className="text-[10px] text-ink-muted">Sản lượng</div>
                                <div className="mt-0.5 font-display text-[22px] font-extrabold text-ink">
                                    {num(h.totalWeightKg)} kg
                                </div>
                            </div>
                            <div>
                                <div className="text-[10px] text-ink-muted">Doanh thu</div>
                                <div className="mt-0.5 font-display text-[18px] font-extrabold text-teal-700">
                                    {fmtMoney(h.totalRevenue)}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="card p-4">
                    <div className="mb-3 text-[13px] font-bold text-ink">Sản lượng và giá bán</div>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                        <HarvestFact label="Khối lượng" value={`${num(h.totalWeightKg)} kg`} />
                        <HarvestFact
                            label="Số lượng thu"
                            value={
                                h.quantityCount != null
                                    ? `${num(h.quantityCount)} con`
                                    : 'Không ghi nhận'
                            }
                        />
                        <HarvestFact
                            label="Cỡ tôm"
                            value={
                                h.avgSizePerKg != null
                                    ? `${num(h.avgSizePerKg)} con/kg`
                                    : 'Không ghi nhận'
                            }
                        />
                        <HarvestFact
                            label="Giá bán"
                            value={
                                h.pricePerKg != null
                                    ? `${num(h.pricePerKg)} ₫/kg`
                                    : 'Không ghi nhận'
                            }
                        />
                        <HarvestFact label="Tổng doanh thu" value={fmtMoney(h.totalRevenue)} />
                        <HarvestFact
                            label="Còn lại ước tính"
                            value={
                                h.estimatedRemainingCount != null
                                    ? `${num(h.estimatedRemainingCount)} con`
                                    : 'Không ghi nhận'
                            }
                        />
                    </div>
                </div>

                <div className="card space-y-3 p-4">
                    <div className="text-[13px] font-bold text-ink">Thông tin vụ nuôi</div>
                    <HarvestDetailRow label="Vụ nuôi" value={season.name} />
                    <HarvestDetailRow label="Ao nuôi" value={season.pondName} />
                    <HarvestDetailRow label="Trang trại" value={season.farmName} />
                    <HarvestDetailRow label="Thời điểm thu" value={fmtDateTime(h.harvestedAt)} />
                </div>

                <div className="card space-y-3 p-4">
                    <div className="text-[13px] font-bold text-ink">Người mua</div>
                    <HarvestDetailRow
                        label="Tên người mua"
                        value={h.buyerName ?? 'Không ghi nhận'}
                    />
                    <HarvestDetailRow label="Liên hệ" value={h.buyerContact ?? 'Không ghi nhận'} />
                </div>

                <div className="card space-y-3 p-4">
                    <div className="text-[13px] font-bold text-ink">Ghi nhận</div>
                    <HarvestDetailRow label="Người ghi nhận" value={h.recordedByName} />
                    <HarvestDetailRow label="Tạo lúc" value={fmtDateTime(h.createdAt)} />
                </div>

                <div className="rounded-xl border border-line bg-slate-50 p-3.5">
                    <div className="text-[10px] font-bold uppercase tracking-wide text-ink-muted">
                        Ghi chú
                    </div>
                    <p className="mt-1 text-[12px] leading-relaxed text-ink-soft">
                        {h.note ?? 'Không có ghi chú.'}
                    </p>
                </div>
            </div>
        </div>
    );
}

function HarvestDetailRow({
    label,
    value,
    mono = false,
}: {
    label: string;
    value: string;
    mono?: boolean;
}) {
    return (
        <div className="flex items-start justify-between gap-4 border-b border-line-soft pb-2 last:border-0 last:pb-0">
            <span className="text-[11px] text-ink-muted">{label}</span>
            <span
                className={`text-right text-[11px] font-semibold text-ink ${mono ? 'font-mono' : ''}`}
            >
                {value}
            </span>
        </div>
    );
}

function HarvestFact({ label, value }: { label: string; value: string }) {
    return (
        <div>
            <div className="text-[9px] uppercase tracking-wide text-ink-muted">{label}</div>
            <div className="mt-0.5 text-[11px] font-semibold text-ink">{value}</div>
        </div>
    );
}

// ── UC 13: Season Create ──────────────────────────────────────────────────────

export function SeasonCreate({ pondId }: { pondId: string }) {
    const nav = useNav();
    const pond = ownerPonds.find((p) => p.id === pondId);
    const farm = pond ? ownerFarms.find((item) => item.id === pond.farmId) : undefined;
    if (!pond || pond.isDeleted || !farm || farm.isDeleted) {
        return (
            <div className="pb-8">
                <ScreenHeader title="Tạo vụ nuôi" />
                <div className="px-4">
                    <EmptyState
                        icon={Icons.layers}
                        title="Không tìm thấy ao"
                        hint="Ao không còn trong danh sách quản lý."
                    />
                </div>
            </div>
        );
    }

    // Check: pond must be available aquaculture + no open season
    const hasOpenSeason = ownerSeasons.some(
        (s) => s.pondId === pondId && (s.status === 'planning' || s.status === 'active'),
    );

    const [name, setName] = useState('');
    const [shrimpType, setShrimpType] = useState<OwnerSeason['shrimpType']>('whiteleg');
    const [stockingDate, setStockingDate] = useState('');
    const [expectedEnd, setExpectedEnd] = useState('');
    const [qty, setQty] = useState('');
    const [density, setDensity] = useState('');
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [saving, setSaving] = useState(false);

    if (hasOpenSeason) {
        return (
            <div className="flex flex-col">
                <ScreenHeader title="Tạo vụ nuôi" />
                <div className="px-4 pt-6">
                    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-center">
                        <Icons.warn size={28} className="mx-auto mb-2 text-amber-600" />
                        <div className="text-[14px] font-bold text-amber-700">
                            Không thể tạo vụ mới
                        </div>
                        <div className="mt-1 text-[12px] text-amber-600">
                            Ao này đang có vụ nuôi mở. Mỗi ao chỉ có một vụ ở trạng thái Chuẩn bị
                            hoặc Đang nuôi.
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (pond.type !== 'aquaculture' || pond.status !== 'available') {
        return (
            <div className="flex flex-col">
                <ScreenHeader title="Tạo vụ nuôi" />
                <div className="px-4 pt-6">
                    <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-center">
                        <Icons.ban size={28} className="mx-auto mb-2 text-rose-500" />
                        <div className="text-[14px] font-bold text-rose-700">Ao không hợp lệ</div>
                        <div className="mt-1 text-[12px] text-rose-500">
                            Chỉ ao nuôi có trạng thái Sẵn sàng mới có thể tạo vụ nuôi.
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    const validate = () => {
        const e: Record<string, string> = {};
        if (!name.trim()) e.name = 'Tên vụ nuôi không được để trống.';
        if (!stockingDate) e.stockingDate = 'Vui lòng chọn ngày thả giống.';
        if (expectedEnd && stockingDate && expectedEnd < stockingDate)
            e.expectedEnd = 'Ngày kết thúc dự kiến phải sau ngày thả.';
        if (qty && (!Number.isInteger(Number(qty)) || Number(qty) <= 0))
            e.qty = 'Số lượng phải là số nguyên dương.';
        if (density && (isNaN(Number(density)) || Number(density) <= 0))
            e.density = 'Mật độ phải là số dương.';
        return e;
    };

    const submit = () => {
        const e = validate();
        setErrors(e);
        if (Object.keys(e).length) return;
        setSaving(true);
        window.setTimeout(() => {
            const newId = `S-${Date.now().toString(36).slice(-7)}`;
            ownerSeasons.push({
                id: newId,
                pondId: pond.id,
                name: name.trim(),
                shrimpType,
                status: 'planning',
                stockingDate: stockingDate || undefined,
                expectedEndDate: expectedEnd || undefined,
                initialQuantity: optionalPositiveNumber(qty),
                initialDensityPerM2: optionalPositiveNumber(density),
                pondName: pond.name,
                farmId: farm.id,
                farmName: farm.name,
                protocolStatus: null,
                hasApprovedProtocol: false,
                dayOfCulture: 0,
            });
            pond.currentSeasonId = newId;
            setSaving(false);
            nav.toast('Vụ nuôi đã được tạo thành công.');
            nav.back();
        }, 700);
    };

    return (
        <div className="flex flex-col">
            <ScreenHeader
                title="Tạo vụ nuôi mới"
                subtitle={`${pond.name} · ${ownerFarms.find((f) => f.id === pond.farmId)?.name}`}
            />
            <div className="px-4 pt-4 pb-10 space-y-4">
                <Field label="Tên vụ nuôi *" error={errors.name}>
                    <input
                        className={`${inputClass} ${errors.name ? 'border-rose-400' : ''}`}
                        placeholder="VD: Vụ Đông Xuân 2026"
                        value={name}
                        autoFocus
                        onChange={(e) => {
                            setName(e.target.value);
                            setErrors((p) => ({ ...p, name: undefined! }));
                        }}
                    />
                </Field>

                <Field label="Loại tôm *">
                    <div className="flex gap-2 mt-1">
                        {(['whiteleg', 'black_tiger'] as const).map((t) => (
                            <button
                                key={t}
                                onClick={() => setShrimpType(t)}
                                className={`flex-1 rounded-xl border py-2.5 text-[13px] font-semibold transition ${
                                    shrimpType === t
                                        ? 'border-ocean-400 bg-ocean-50 text-ocean-700'
                                        : 'border-line bg-white text-ink-muted'
                                }`}
                            >
                                {t === 'whiteleg' ? 'Tôm thẻ chân trắng' : 'Tôm sú'}
                            </button>
                        ))}
                    </div>
                </Field>

                <Field label="Ngày thả giống *" error={errors.stockingDate}>
                    <input
                        type="date"
                        className={`${inputClass} ${errors.stockingDate ? 'border-rose-400' : ''}`}
                        value={stockingDate}
                        onChange={(e) => {
                            setStockingDate(e.target.value);
                            setErrors((p) => ({ ...p, stockingDate: undefined! }));
                        }}
                    />
                </Field>

                <Field label="Ngày kết thúc dự kiến" error={errors.expectedEnd}>
                    <input
                        type="date"
                        className={`${inputClass} ${errors.expectedEnd ? 'border-rose-400' : ''}`}
                        value={expectedEnd}
                        onChange={(e) => {
                            setExpectedEnd(e.target.value);
                            setErrors((p) => ({ ...p, expectedEnd: undefined! }));
                        }}
                    />
                </Field>

                <Field label="Số lượng thả (con)" error={errors.qty}>
                    <input
                        className={`${inputClass} ${errors.qty ? 'border-rose-400' : ''}`}
                        inputMode="numeric"
                        placeholder="VD: 480000"
                        value={qty}
                        onChange={(e) => {
                            setQty(e.target.value);
                            setErrors((p) => ({ ...p, qty: undefined! }));
                        }}
                    />
                </Field>

                <Field label="Mật độ thả (con/m²)" error={errors.density}>
                    <input
                        className={`${inputClass} ${errors.density ? 'border-rose-400' : ''}`}
                        inputMode="decimal"
                        placeholder="VD: 150"
                        value={density}
                        onChange={(e) => {
                            setDensity(e.target.value);
                            setErrors((p) => ({ ...p, density: undefined! }));
                        }}
                    />
                </Field>

                <div className="pt-2">
                    <PrimaryButton full icon={saving ? undefined : Icons.check} onClick={submit}>
                        {saving ? 'Đang tạo…' : 'Tạo vụ nuôi'}
                    </PrimaryButton>
                </div>
            </div>
        </div>
    );
}

// ── UC 14: Season Edit ────────────────────────────────────────────────────────

export function SeasonEdit({ seasonId }: { seasonId: string }) {
    const nav = useNav();
    const s = ownerSeasons.find((s) => s.id === seasonId);
    if (!s || !seasonHasActiveParents(s)) {
        return (
            <div className="pb-8">
                <ScreenHeader title="Chỉnh sửa vụ nuôi" />
                <div className="px-4">
                    <EmptyState
                        icon={Icons.layers}
                        title="Không tìm thấy vụ nuôi"
                        hint="Vụ nuôi không còn trong danh sách quản lý."
                    />
                </div>
            </div>
        );
    }

    if (s.status !== 'planning') {
        return (
            <div className="flex flex-col">
                <ScreenHeader title="Chỉnh sửa vụ nuôi" />
                <div className="px-4 pt-6">
                    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-center">
                        <Icons.ban size={28} className="mx-auto mb-2 text-amber-600" />
                        <div className="text-[14px] font-bold text-amber-700">
                            Không thể chỉnh sửa
                        </div>
                        <div className="mt-1 text-[12px] text-amber-600">
                            Chỉ có thể chỉnh sửa vụ ở trạng thái Đang chuẩn bị.
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    const [name, setName] = useState(s.name);
    const [stockingDate, setStockingDate] = useState(s.stockingDate ?? '');
    const [expectedEnd, setExpectedEnd] = useState(s.expectedEndDate ?? '');
    const [qty, setQty] = useState(s.initialQuantity?.toString() ?? '');
    const [density, setDensity] = useState(s.initialDensityPerM2?.toString() ?? '');
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [saving, setSaving] = useState(false);

    const validate = () => {
        const e: Record<string, string> = {};
        if (!name.trim()) e.name = 'Tên vụ không được để trống.';
        if (expectedEnd && stockingDate && expectedEnd < stockingDate)
            e.expectedEnd = 'Ngày kết thúc phải sau ngày thả.';
        if (qty && (!Number.isInteger(Number(qty)) || Number(qty) <= 0))
            e.qty = 'Số lượng phải là số nguyên dương.';
        if (density && (isNaN(Number(density)) || Number(density) <= 0))
            e.density = 'Mật độ phải là số dương.';
        return e;
    };

    const submit = () => {
        const e = validate();
        setErrors(e);
        if (Object.keys(e).length) return;
        setSaving(true);
        window.setTimeout(() => {
            s.name = name.trim();
            s.stockingDate = stockingDate || undefined;
            s.expectedEndDate = expectedEnd || undefined;
            s.initialQuantity = optionalPositiveNumber(qty);
            s.initialDensityPerM2 = optionalPositiveNumber(density);
            setSaving(false);
            nav.toast('Cập nhật vụ nuôi thành công.');
            nav.back();
        }, 700);
    };

    return (
        <div className="flex flex-col">
            <ScreenHeader title="Chỉnh sửa vụ nuôi" subtitle={`${s.pondName} · ${s.farmName}`} />
            <div className="px-4 pt-4 pb-10 space-y-4">
                <Field label="Tên vụ nuôi *" error={errors.name}>
                    <input
                        className={`${inputClass} ${errors.name ? 'border-rose-400' : ''}`}
                        value={name}
                        autoFocus
                        onChange={(e) => setName(e.target.value)}
                    />
                </Field>
                <Field label="Ngày thả giống">
                    <input
                        type="date"
                        className={inputClass}
                        value={stockingDate}
                        onChange={(e) => setStockingDate(e.target.value)}
                    />
                </Field>
                <Field label="Ngày kết thúc dự kiến" error={errors.expectedEnd}>
                    <input
                        type="date"
                        className={`${inputClass} ${errors.expectedEnd ? 'border-rose-400' : ''}`}
                        value={expectedEnd}
                        onChange={(e) => {
                            setExpectedEnd(e.target.value);
                            setErrors((p) => ({ ...p, expectedEnd: undefined! }));
                        }}
                    />
                </Field>
                <Field label="Số lượng thả (con)" error={errors.qty}>
                    <input
                        className={`${inputClass} ${errors.qty ? 'border-rose-400' : ''}`}
                        inputMode="numeric"
                        value={qty}
                        onChange={(e) => {
                            setQty(e.target.value);
                            setErrors((p) => ({ ...p, qty: undefined! }));
                        }}
                    />
                </Field>
                <Field label="Mật độ thả (con/m²)" error={errors.density}>
                    <input
                        className={`${inputClass} ${errors.density ? 'border-rose-400' : ''}`}
                        inputMode="decimal"
                        value={density}
                        onChange={(e) => setDensity(e.target.value)}
                    />
                </Field>
                <div className="pt-2">
                    <PrimaryButton full icon={saving ? undefined : Icons.check} onClick={submit}>
                        {saving ? 'Đang lưu…' : 'Lưu thay đổi'}
                    </PrimaryButton>
                </div>
            </div>
        </div>
    );
}

// ── UC 19: Harvest Record ─────────────────────────────────────────────────────

export function HarvestRecord({ seasonId }: { seasonId: string }) {
    const nav = useNav();
    const s = ownerSeasons.find((s) => s.id === seasonId);
    if (!s || !seasonHasActiveParents(s) || s.status !== 'active') {
        return (
            <div className="pb-8">
                <ScreenHeader title="Ghi nhận thu hoạch" />
                <div className="px-4">
                    <EmptyState
                        icon={Icons.harvest}
                        title="Không thể ghi nhận thu hoạch"
                        hint="Chỉ vụ nuôi đang hoạt động mới được ghi nhận."
                    />
                </div>
            </div>
        );
    }

    const existingHarvests = harvestsForSeason(seasonId);
    const hasFinal = existingHarvests.some((h) => h.harvestType === 'final');

    const [harvestType, setHarvestType] = useState<HarvestEvent['harvestType']>('partial');
    const [harvestedAt, setHarvestedAt] = useState(() => localDateTimeValue());
    const [weightKg, setWeightKg] = useState('');
    const [qty, setQty] = useState('');
    const [avgSize, setAvgSize] = useState('');
    const [pricePerKg, setPricePerKg] = useState('');
    const [remainingCount, setRemainingCount] = useState('');
    const [buyerName, setBuyerName] = useState('');
    const [buyerContact, setBuyerContact] = useState('');
    const [note, setNote] = useState('');
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [saving, setSaving] = useState(false);
    const weightValue = Number(weightKg) || 0;
    const priceValue = Number(pricePerKg) || 0;
    const revenuePreview = weightValue * priceValue;
    const derivedSize = weightValue > 0 && Number(qty) > 0 ? Number(qty) / weightValue : undefined;

    const validate = () => {
        const e: Record<string, string> = {};
        if (!harvestedAt) e.harvestedAt = 'Vui lòng chọn thời điểm thu hoạch.';
        else if (new Date(harvestedAt).getTime() > Date.now())
            e.harvestedAt = 'Thời điểm thu hoạch không được ở tương lai.';
        else if (s.stockingDate && harvestedAt.slice(0, 10) < s.stockingDate)
            e.harvestedAt = 'Thời điểm thu hoạch phải sau ngày thả giống.';
        if (!weightKg || isNaN(Number(weightKg)) || Number(weightKg) <= 0)
            e.weightKg = 'Sản lượng phải là số dương.';
        if (qty && (!Number.isInteger(Number(qty)) || Number(qty) <= 0))
            e.qty = 'Số lượng tôm phải là số nguyên dương.';
        if (avgSize && (isNaN(Number(avgSize)) || Number(avgSize) <= 0))
            e.avgSize = 'Cỡ tôm phải là số dương.';
        if (pricePerKg && (isNaN(Number(pricePerKg)) || Number(pricePerKg) < 0))
            e.pricePerKg = 'Giá bán phải lớn hơn hoặc bằng 0.';
        if (harvestType === 'partial') {
            if (
                !remainingCount ||
                !Number.isInteger(Number(remainingCount)) ||
                Number(remainingCount) <= 0
            )
                e.remainingCount = 'Thu tỉa cần nhập số tôm còn lại (phải > 0).';
        }
        if (harvestType === 'final' && remainingCount && Number(remainingCount) > 0)
            e.remainingCount = 'Thu hoạch cuối: số còn lại phải bằng 0.';
        return e;
    };

    const submit = () => {
        const e = validate();
        setErrors(e);
        if (Object.keys(e).length) return;
        setSaving(true);
        window.setTimeout(() => {
            const eventTime = new Date(harvestedAt).toISOString();
            const price = pricePerKg.trim() ? Number(pricePerKg) : undefined;
            harvestEvents.unshift({
                id: `HV-${Date.now().toString(36).slice(-7)}`,
                seasonId,
                harvestType,
                harvestedAt: eventTime,
                totalWeightKg: Number(weightKg),
                quantityCount: optionalPositiveNumber(qty),
                avgSizePerKg: optionalPositiveNumber(avgSize) ?? derivedSize,
                pricePerKg: price,
                totalRevenue: price != null ? Number(weightKg) * price : undefined,
                estimatedRemainingCount: harvestType === 'final' ? 0 : Number(remainingCount),
                buyerName: buyerName.trim() || undefined,
                buyerContact: buyerContact.trim() || undefined,
                note: note.trim() || undefined,
                recordedByName: currentUser.name,
                createdAt: new Date().toISOString(),
            });
            if (harvestType === 'final') {
                s.status = 'completed';
                s.actualEndDate = harvestedAt.slice(0, 10);
                const pond = ownerPonds.find((item) => item.id === s.pondId);
                if (pond?.currentSeasonId === s.id) pond.currentSeasonId = undefined;
                const farm = ownerFarms.find((item) => item.id === s.farmId);
                if (farm) {
                    farm.activeSeasonsCount = ownerSeasons.filter(
                        (season) => season.farmId === farm.id && season.status === 'active',
                    ).length;
                }
            }
            setSaving(false);
            nav.toast(
                harvestType === 'final'
                    ? 'Thu hoạch cuối ghi nhận thành công. Vụ nuôi đã kết thúc.'
                    : 'Ghi nhận thu tỉa thành công.',
            );
            nav.back();
        }, 800);
    };

    if (hasFinal) {
        return (
            <div className="flex flex-col">
                <ScreenHeader title="Ghi nhận thu hoạch" />
                <div className="px-4 pt-6">
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-center">
                        <Icons.check size={28} className="mx-auto mb-2 text-slate-400" />
                        <div className="text-[14px] font-bold text-ink">
                            Đã ghi nhận thu hoạch cuối
                        </div>
                        <div className="mt-1 text-[12px] text-ink-muted">
                            Vụ nuôi này đã có thu hoạch cuối. Không thể ghi nhận thêm.
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col">
            <ScreenHeader title="Ghi nhận thu hoạch" subtitle={`${s.pondName} · ${s.farmName}`} />
            <div className="px-4 pt-4 pb-10 space-y-4">
                <Field label="Loại thu hoạch *">
                    <div className="flex gap-2 mt-1">
                        <button
                            onClick={() => setHarvestType('partial')}
                            className={`flex-1 rounded-xl border py-2.5 text-[13px] font-semibold transition ${
                                harvestType === 'partial'
                                    ? 'border-ocean-400 bg-ocean-50 text-ocean-700'
                                    : 'border-line bg-white text-ink-muted'
                            }`}
                        >
                            Thu tỉa
                        </button>
                        <button
                            onClick={() => setHarvestType('final')}
                            className={`flex-1 rounded-xl border py-2.5 text-[13px] font-semibold transition ${
                                harvestType === 'final'
                                    ? 'border-teal-400 bg-teal-50 text-teal-700'
                                    : 'border-line bg-white text-ink-muted'
                            }`}
                        >
                            Thu hoạch cuối
                        </button>
                    </div>
                </Field>

                {harvestType === 'final' && (
                    <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5">
                        <div className="text-[12px] font-semibold text-amber-700">
                            ⚠ Thu hoạch cuối sẽ kết thúc vụ nuôi. Không thể hoàn tác.
                        </div>
                    </div>
                )}

                <Field label="Thời điểm thu hoạch *" error={errors.harvestedAt}>
                    <input
                        type="datetime-local"
                        className={`${inputClass} ${errors.harvestedAt ? 'border-rose-400' : ''}`}
                        value={harvestedAt}
                        onChange={(e) => setHarvestedAt(e.target.value)}
                    />
                </Field>

                <Field label="Sản lượng (kg) *" error={errors.weightKg}>
                    <input
                        className={`${inputClass} ${errors.weightKg ? 'border-rose-400' : ''}`}
                        inputMode="decimal"
                        placeholder="VD: 480"
                        value={weightKg}
                        onChange={(e) => {
                            setWeightKg(e.target.value);
                            setErrors((p) => ({ ...p, weightKg: undefined! }));
                        }}
                    />
                </Field>

                <Field label="Số lượng thu hoạch (con)" error={errors.qty}>
                    <input
                        className={`${inputClass} ${errors.qty ? 'border-rose-400' : ''}`}
                        inputMode="numeric"
                        placeholder="Tùy chọn"
                        value={qty}
                        onChange={(e) => setQty(e.target.value)}
                    />
                </Field>

                <Field label="Cỡ tôm (con/kg)" error={errors.avgSize}>
                    <input
                        className={`${inputClass} ${errors.avgSize ? 'border-rose-400' : ''}`}
                        inputMode="decimal"
                        placeholder="VD: 80"
                        value={avgSize}
                        onChange={(e) => setAvgSize(e.target.value)}
                    />
                </Field>

                <Field label="Giá bán (₫/kg)" error={errors.pricePerKg}>
                    <input
                        className={`${inputClass} ${errors.pricePerKg ? 'border-rose-400' : ''}`}
                        inputMode="numeric"
                        placeholder="VD: 180000"
                        value={pricePerKg}
                        onChange={(e) => setPricePerKg(e.target.value)}
                    />
                </Field>

                {(weightValue > 0 || pricePerKg.trim() || derivedSize != null) && (
                    <div className="card overflow-hidden">
                        <div className="border-b border-line-soft bg-slate-50 px-4 py-2.5 text-[11px] font-bold uppercase tracking-wide text-ink-soft">
                            Đối chiếu trước khi lưu
                        </div>
                        <div className="space-y-2.5 p-4">
                            <div className="flex items-center justify-between text-[12px]">
                                <span className="text-ink-muted">Doanh thu dự kiến</span>
                                <span className="font-display text-[17px] font-extrabold text-teal-700">
                                    {pricePerKg.trim() && weightValue > 0
                                        ? fmtMoney(revenuePreview)
                                        : '—'}
                                </span>
                            </div>
                            {derivedSize != null && (
                                <div className="flex items-center justify-between text-[12px]">
                                    <span className="text-ink-muted">Cỡ suy ra từ số lượng</span>
                                    <span className="font-semibold text-ink">
                                        {derivedSize.toLocaleString('vi-VN', {
                                            maximumFractionDigits: 1,
                                        })}{' '}
                                        con/kg
                                    </span>
                                </div>
                            )}
                            {derivedSize != null &&
                                optionalPositiveNumber(avgSize) != null &&
                                Math.abs(derivedSize - Number(avgSize)) / derivedSize > 0.1 && (
                                    <p className="rounded-lg bg-amber-50 px-3 py-2 text-[10px] leading-relaxed text-amber-700">
                                        Cỡ tôm nhập tay lệch trên 10% so với số lượng ÷ sản lượng.
                                        Hãy kiểm tra lại trước khi lưu.
                                    </p>
                                )}
                        </div>
                    </div>
                )}

                <Field
                    label={
                        harvestType === 'partial'
                            ? 'Ước tính tôm còn lại (con) *'
                            : 'Số tôm còn lại sau thu hoạch'
                    }
                    error={errors.remainingCount}
                    hint={harvestType === 'final' ? 'Phải bằng 0 với thu hoạch cuối.' : undefined}
                >
                    <input
                        className={`${inputClass} ${
                            errors.remainingCount ? 'border-rose-400' : ''
                        }`}
                        inputMode="numeric"
                        placeholder={harvestType === 'partial' ? 'VD: 380000' : '0'}
                        value={harvestType === 'final' ? '0' : remainingCount}
                        readOnly={harvestType === 'final'}
                        onChange={(e) => {
                            setRemainingCount(e.target.value);
                            setErrors((p) => ({ ...p, remainingCount: undefined! }));
                        }}
                    />
                </Field>

                <Field label="Tên người mua">
                    <input
                        className={inputClass}
                        placeholder="Tùy chọn"
                        value={buyerName}
                        onChange={(e) => setBuyerName(e.target.value)}
                    />
                </Field>

                <Field label="Liên hệ người mua">
                    <input
                        className={inputClass}
                        inputMode="tel"
                        placeholder="Số điện thoại…"
                        value={buyerContact}
                        onChange={(e) => setBuyerContact(e.target.value)}
                    />
                </Field>

                <Field label="Ghi chú">
                    <textarea
                        className={`${inputClass} min-h-[72px] resize-none`}
                        placeholder="Ghi chú thêm…"
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                    />
                </Field>

                <div className="pt-2">
                    <PrimaryButton full icon={saving ? undefined : Icons.harvest} onClick={submit}>
                        {saving
                            ? 'Đang ghi nhận…'
                            : harvestType === 'final'
                              ? 'Ghi nhận thu hoạch cuối'
                              : 'Ghi nhận thu tỉa'}
                    </PrimaryButton>
                </div>
            </div>
        </div>
    );
}
