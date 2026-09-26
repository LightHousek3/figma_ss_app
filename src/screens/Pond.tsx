import { useState } from 'react';
import { useNav } from '../app/store';
import {
    contextLabel,
    currentUser,
    diseaseCases,
    farmForSeason,
    healthLogs,
    operations,
    ponds,
    pondForSeason,
    seasonById,
    seasons,
    waterLogs,
    type HealthLog,
    type OperationSchedule,
    type WaterLog,
} from '../app/data';
import {
    Badge,
    caseStatusMeta,
    chip,
    ContextBar,
    CompactFilterTabs,
    EmptyState,
    Field,
    fmtDate,
    fmtDateTime,
    fmtTime,
    GhostButton,
    healthMeta,
    Icons,
    inputClass,
    num,
    opMeta,
    opTypeMeta,
    PrimaryButton,
    MetricTileGrid,
    SectionTitle,
    seasonMeta,
    Segmented,
    Sheet,
    Stat,
    toneText,
} from '../app/ui';
import { ScreenHeader } from './common';
import { waterMetricIsOutside, waterMetricState, type WaterMetricKey } from '../app/waterQuality';

// KTV and Owner use one shared operational threshold set.
const waterBad = (l: WaterLog) => {
    const metrics: { label: string; metric: WaterMetricKey; value?: number }[] = [
        { label: 'Nhiệt độ', metric: 'temperature', value: l.temperatureC },
        { label: 'pH', metric: 'ph', value: l.ph },
        { label: 'DO', metric: 'dissolvedOxygen', value: l.doMgL },
        { label: 'NH3', metric: 'nh3', value: l.nh3MgL },
        { label: 'NO2', metric: 'no2', value: l.no2MgL },
        { label: 'Kiềm', metric: 'alkalinity', value: l.alkalinity },
        { label: 'H2S', metric: 'h2s', value: l.h2sMgL },
    ];
    return metrics
        .filter(({ metric, value }) => waterMetricIsOutside(metric, value))
        .map(({ label }) => label);
};

// Merged season-detail + pond dashboard. Tapping a season lands here directly;
// the old segmented tab bar is gone — each area opens as its own sub-screen.
export default function PondHub({ seasonId }: { seasonId: string }) {
    const nav = useNav();
    const s = seasonById(seasonId);
    const pond = pondForSeason(seasonId);
    const farm = farmForSeason(seasonId);
    const sm = seasonMeta[s.status];
    const hm = healthMeta[s.healthStatus];
    const ctx = contextLabel(seasonId);
    const shrimp = s.shrimpType === 'whiteleg' ? 'Tôm thẻ chân trắng' : 'Tôm sú';

    const latestWater = waterLogs.filter((w) => w.seasonId === seasonId && !w.voided)[0];
    const plannedOps = operations.filter(
        (o) => o.seasonId === seasonId && o.status === 'planned' && !o.blocked,
    );
    const blocked = operations.filter((o) => o.seasonId === seasonId && o.blocked);
    const openCases = diseaseCases.filter(
        (c) => c.seasonId === seasonId && c.status !== 'resolved',
    );
    const siblingPonds = ponds.filter((p) => p.farmId === pond.farmId && p.id !== pond.id);

    const actions: {
        label: string;
        icon: keyof typeof Icons;
        tone: Parameters<typeof chip>[0];
        route: string;
    }[] = [
        { label: 'Đo nước', icon: 'drop', tone: 'ocean', route: 'water' },
        { label: 'Sức khỏe', icon: 'heart', tone: 'rose', route: 'health' },
        { label: 'Vận hành', icon: 'ops', tone: 'teal', route: 'ops' },
        { label: 'AI nhận diện', icon: 'camera', tone: 'violet', route: 'ai' },
        { label: 'Hỏi chuyên gia', icon: 'chat', tone: 'ocean', route: 'chat' },
        { label: 'Ca bệnh', icon: 'diseaseCase', tone: 'rose', route: 'cases' },
    ];

    return (
        <div className="pb-6">
            <ScreenHeader
                title={pond.name}
                subtitle={`${s.name} · ${s.status === 'planning' ? sm.label : `DOC ${s.dayOfCulture}`}`}
                right={
                    <Badge tone={sm.tone} dot>
                        {sm.label}
                    </Badge>
                }
            />
            <div className="space-y-4 px-4 pt-4">
                <ContextBar {...ctx} />

                {s.status === 'active' && blocked.length > 0 && (
                    <div className="rounded-2xl border border-amber-500/30 bg-amber-50/70 p-3.5">
                        <div className="flex items-center gap-2 text-[13px] font-bold text-amber-500">
                            <Icons.warn size={16} /> Cảnh báo sớm
                        </div>
                        <p className="mt-1 text-[12px] leading-snug text-ink-soft">
                            {blocked[0].blocked}
                        </p>
                        <button
                            onClick={() => nav.go('health', { seasonId })}
                            className="mt-2 inline-flex items-center gap-1 text-[12px] font-bold text-ocean-600"
                        >
                            <span>Ghi nhận sức khỏe để mở lại lịch</span>
                            <Icons.chevronR size={14} />
                        </button>
                    </div>
                )}

                {/* Pond hero */}
                <div className="card overflow-hidden">
                    <div className="flex items-center gap-3 border-b border-line-soft bg-ocean-50/50 p-4">
                        <div className="grid size-14 place-items-center rounded-2xl bg-ocean-600 font-display text-[16px] font-extrabold text-white">
                            {pond.name.replace('Ao ', '')}
                        </div>
                        <div className="min-w-0">
                            <div className="text-[16px] font-bold text-ink">{pond.name}</div>
                            <div className="truncate text-[12px] text-ink-muted">
                                {shrimp} · {num(pond.areaM2)} m² · {num(pond.volumeM3)} m³
                            </div>
                        </div>
                    </div>
                    {s.status === 'planning' ? (
                        <div className="p-4">
                            <div className="rounded-xl bg-violet-50 px-3.5 py-3 text-[12px] leading-relaxed text-violet-700">
                                Vụ đang chuẩn bị và chưa phát sinh dữ liệu vận hành. KTV có thể xem
                                phân công; các chức năng đo nước, sức khỏe, vận hành, AI và ca bệnh
                                sẽ mở sau khi Chủ trại kích hoạt vụ.
                            </div>
                        </div>
                    ) : (
                    <div className="grid grid-cols-2 gap-2.5 p-4">
                        <Stat
                            label="Ngày tuổi (DOC)"
                            value={s.dayOfCulture}
                            sub={`Thả ${fmtDate(s.stockingDate)}`}
                        />
                        <Stat
                            label="Sức khỏe đàn"
                            value={<span className={toneText[hm.tone]}>{hm.label}</span>}
                            sub={`${num(s.initialQuantity / 1000)}k con post`}
                        />
                        <Stat
                            label="Sinh khối"
                            value={s.latestBiomassKg ? `${num(s.latestBiomassKg)}` : '—'}
                            sub={s.latestBiomassKg ? 'kg (mới nhất)' : 'chưa ghi nhận'}
                            tone="teal"
                        />
                        <Stat
                            label="Tỷ lệ sống"
                            value={s.survivalPct ? `${s.survivalPct}%` : '—'}
                            sub={s.latestAvgWeightG ? `${s.latestAvgWeightG} g/con` : 'chưa có mẫu'}
                        />
                    </div>
                    )}
                </div>

                {/* Quick actions → dedicated sub-screens */}
                {s.status === 'active' && (
                <div className="grid grid-cols-3 gap-2">
                    {actions.map((a) => {
                        const Icon = Icons[a.icon];
                        return (
                            <button
                                key={a.label}
                                onClick={() => nav.go(a.route, { seasonId })}
                                className="relative flex flex-col items-center gap-2 rounded-2xl border border-line bg-white/80 py-3.5 transition active:scale-[0.97]"
                            >
                                <span
                                    className={`grid size-9 place-items-center rounded-xl ${chip(a.tone)}`}
                                >
                                    <Icon size={18} />
                                </span>
                                <span className="text-[11px] font-semibold text-ink-soft">
                                    {a.label}
                                </span>
                                {a.route === 'cases' && openCases.length > 0 && (
                                    <span className="absolute right-2 top-2 grid size-4 place-items-center rounded-full bg-rose-500 text-[9px] font-bold text-white">
                                        {openCases.length}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>
                )}

                {s.status === 'active' && latestWater && (
                    <button
                        onClick={() => nav.go('water', { seasonId })}
                        className="card w-full p-4 text-left transition active:scale-[0.99]"
                    >
                        <div className="mb-2 flex items-center justify-between">
                            <span className="font-display text-[14px] font-bold text-ink">
                                Đo nước gần nhất
                            </span>
                            <span className="text-[11px] text-ink-muted">
                                {fmtDateTime(latestWater.recordedAt)}
                            </span>
                        </div>
                        <WaterGrid log={latestWater} />
                    </button>
                )}

                {s.status === 'active' && (
                <div>
                    <div className="mb-2 flex items-center justify-between px-1">
                        <span className="font-display text-[14px] font-bold text-ink">
                            Cữ vận hành hôm nay
                        </span>
                        <button
                            onClick={() => nav.go('ops', { seasonId })}
                            className="text-[12px] font-semibold text-ocean-600"
                        >
                            Xem tất cả
                        </button>
                    </div>
                    <div className="space-y-2">
                        {plannedOps.slice(0, 3).map((o) => (
                            <OpRow key={o.id} op={o} />
                        ))}
                        {plannedOps.length === 0 && (
                            <EmptyState icon={Icons.check} title="Đã xong cữ hôm nay" />
                        )}
                    </div>
                </div>
                )}

                {/* Team */}
                <SectionTitle>Nhân sự vụ nuôi</SectionTitle>
                <div className="card divide-y divide-line-soft">
                    <PersonRow role="Kỹ thuật viên phụ trách" name="Cô Thái Bảo (bạn)" />
                    <PersonRow role="Chuyên gia thủy sản" name={s.expertName} />
                    <PersonRow role="Chủ trang trại" name={farm.name} />
                </div>

                {siblingPonds.length > 0 && (
                    <>
                        <SectionTitle>Các ao khác trong trại</SectionTitle>
                        <div className="space-y-2">
                            {siblingPonds.map((p) => {
                                const sib = seasons.find((x) => x.pondId === p.id);
                                return (
                                    <button
                                        key={p.id}
                                        onClick={() =>
                                            sib ? nav.go('pond', { seasonId: sib.id }) : undefined
                                        }
                                        disabled={!sib}
                                        className="flex w-full items-center gap-3 rounded-2xl border border-line bg-white/70 p-3 text-left disabled:opacity-50"
                                    >
                                        <span className="grid size-9 place-items-center rounded-xl bg-slate-50 font-display text-[12px] font-bold text-ink-soft">
                                            {p.name.replace('Ao ', '')}
                                        </span>
                                        <span className="flex-1 text-[13px] font-semibold text-ink">
                                            {p.name}
                                        </span>
                                        {sib ? (
                                            <Badge tone={seasonMeta[sib.status].tone}>
                                                {seasonMeta[sib.status].label}
                                            </Badge>
                                        ) : (
                                            <span className="text-[11px] text-ink-muted">
                                                Trống
                                            </span>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

function PersonRow({ role, name }: { role: string; name: string }) {
    return (
        <div className="flex items-center gap-3 px-4 py-3">
            <div className="grid size-9 place-items-center rounded-full bg-slate-50 text-ink-soft">
                <Icons.user size={17} />
            </div>
            <div>
                <div className="text-[13px] font-semibold text-ink">{name}</div>
                <div className="text-[11px] text-ink-muted">{role}</div>
            </div>
        </div>
    );
}

/* --------------------------------------------------- sub-screen wrappers */
// Each area is now its own pushed screen with a header + context bar, wrapping
// the list/form bodies below.
function SubScreen({
    seasonId,
    title,
    children,
}: {
    seasonId: string;
    title: string;
    children: React.ReactNode;
}) {
    const ctx = contextLabel(seasonId);
    return (
        <div className="pb-6">
            <ScreenHeader title={title} subtitle={`${ctx.pond} · ${ctx.season}`} />
            <div className="space-y-4 px-4 pt-4">
                {children}
            </div>
        </div>
    );
}

export function WaterScreen({ seasonId }: { seasonId: string }) {
    return (
        <SubScreen seasonId={seasonId} title="Chất lượng nước">
            <WaterTab seasonId={seasonId} />
        </SubScreen>
    );
}
export function HealthScreen({ seasonId }: { seasonId: string }) {
    return (
        <SubScreen seasonId={seasonId} title="Sức khỏe tôm">
            <HealthTab seasonId={seasonId} />
        </SubScreen>
    );
}
export function OpsScreen({ seasonId }: { seasonId: string }) {
    return (
        <SubScreen seasonId={seasonId} title="Vận hành">
            <OpsTab seasonId={seasonId} />
        </SubScreen>
    );
}
export function CasesScreen({ seasonId }: { seasonId: string }) {
    return (
        <SubScreen seasonId={seasonId} title="Ca bệnh">
            <CasesTab seasonId={seasonId} />
        </SubScreen>
    );
}

function WaterGrid({ log }: { log: WaterLog }) {
    const cells: { label: string; value?: number; unit: string; metric: WaterMetricKey }[] = [
        { label: 'Nhiệt độ', value: log.temperatureC, unit: '°C', metric: 'temperature' },
        { label: 'pH', value: log.ph, unit: '', metric: 'ph' },
        { label: 'DO', value: log.doMgL, unit: 'mg/L', metric: 'dissolvedOxygen' },
        { label: 'Độ mặn', value: log.salinityPpt, unit: '‰', metric: 'salinity' },
        { label: 'NH3', value: log.nh3MgL, unit: 'mg/L', metric: 'nh3' },
        { label: 'NO2', value: log.no2MgL, unit: 'mg/L', metric: 'no2' },
        { label: 'Kiềm', value: log.alkalinity, unit: 'mg/L', metric: 'alkalinity' },
        { label: 'H2S', value: log.h2sMgL, unit: 'mg/L', metric: 'h2s' },
    ];
    return (
        <MetricTileGrid
            items={cells.map((cell) => ({
                label: cell.label,
                value: cell.value,
                unit: cell.unit,
                state: waterMetricState(cell.metric, cell.value),
            }))}
        />
    );
}

/* ------------------------------------------------------------------- water */
function WaterTab({ seasonId }: { seasonId: string }) {
    const nav = useNav();
    const [form, setForm] = useState(false);
    const [detail, setDetail] = useState<WaterLog | null>(null);
    const [filter, setFilter] = useState<'all' | 'alert' | 'voided'>('all');
    const logs = waterLogs.filter((w) => w.seasonId === seasonId);
    const latestValid = logs.find((log) => !log.voided);
    const alertCount = logs.filter((log) => !log.voided && waterBad(log).length > 0).length;
    const voidedCount = logs.filter((log) => !!log.voided).length;
    const visible = logs.filter((log) =>
        filter === 'alert'
            ? !log.voided && waterBad(log).length > 0
            : filter === 'voided'
              ? !!log.voided
              : true,
    );

    return (
        <div className="space-y-3">
            <PrimaryButton full icon={Icons.plus} onClick={() => setForm(true)}>
                Nhập nhật ký đo nước
            </PrimaryButton>

            <div className="grid grid-cols-3 gap-2">
                <Stat label="Bản ghi hợp lệ" value={logs.filter((log) => !log.voided).length} />
                <Stat label="Có cảnh báo" value={alertCount} tone={alertCount > 0 ? 'rose' : 'teal'} />
                <Stat
                    label="DO mới nhất"
                    value={latestValid?.doMgL != null ? latestValid.doMgL : '—'}
                    sub={latestValid?.doMgL != null ? 'mg/L' : 'chưa đo'}
                    tone="teal"
                />
            </div>

            <div className="rounded-xl bg-ocean-50/70 px-3 py-2 text-[11px] leading-snug text-ocean-700">
                <Icons.info size={13} className="mr-1 inline align-[-2px]" />
                Kết quả đo đã lưu không thể chỉnh sửa. Nếu ghi sai, KTV chỉ có thể hủy hiệu lực kèm
                lý do để vẫn giữ được lịch sử đối chiếu.
            </div>

            <Segmented
                fill
                value={filter}
                onChange={setFilter}
                options={[
                    { value: 'all', label: `Tất cả (${logs.length})` },
                    { value: 'alert', label: `Cảnh báo (${alertCount})` },
                    { value: 'voided', label: `Vô hiệu (${voidedCount})` },
                ]}
            />

            {visible.length === 0 && (
                <EmptyState
                    icon={Icons.drop}
                    title={logs.length === 0 ? 'Chưa có nhật ký đo nước' : 'Không có bản ghi phù hợp'}
                    hint={logs.length === 0 ? 'Nhấn nút trên để ghi lần đo đầu tiên.' : undefined}
                />
            )}

            {visible.map((l) => {
                const flags = waterBad(l);
                return (
                    <button
                        key={l.id}
                        onClick={() => setDetail(l)}
                        className={`card w-full p-3.5 text-left transition active:scale-[0.99] ${l.voided ? 'opacity-60' : ''}`}
                    >
                        <div className="flex items-center justify-between">
                            <span className="flex items-center gap-2">
                                <span
                                    className={`grid size-8 place-items-center rounded-xl ${chip('ocean')}`}
                                >
                                    <Icons.drop size={16} />
                                </span>
                                <span>
                                    <span className="block text-[13px] font-bold text-ink">
                                        {fmtTime(l.recordedAt)}
                                    </span>
                                    <span className="block font-mono text-[10px] text-ink-muted">
                                        {l.id} · {fmtDate(l.recordedAt)}
                                    </span>
                                </span>
                            </span>
                            {l.voided ? (
                                <Badge tone="slate">Đã hủy hiệu lực</Badge>
                            ) : flags.length ? (
                                <Badge tone="rose" dot>
                                    {flags.join(' · ')} cao
                                </Badge>
                            ) : (
                                <Badge tone="teal" dot>
                                    Trong ngưỡng
                                </Badge>
                            )}
                        </div>
                        <div className="mt-3">
                            <WaterGrid log={l} />
                        </div>
                        {l.note && (
                            <p className="mt-2 rounded-xl bg-slate-50 p-3 text-[10px] leading-relaxed text-ink-soft">
                                {l.note}
                            </p>
                        )}
                    </button>
                );
            })}

            <WaterForm
                open={form}
                onClose={() => setForm(false)}
                onSave={() => {
                    setForm(false);
                    nav.toast('Đã lưu nhật ký đo nước.');
                }}
            />
            <WaterDetail log={detail} onClose={() => setDetail(null)} />
        </div>
    );
}

function WaterForm({
    open,
    onClose,
    onSave,
}: {
    open: boolean;
    onClose: () => void;
    onSave: () => void;
}) {
    const fields = [
        { k: 'Nhiệt độ', u: '°C' },
        { k: 'pH', u: '' },
        { k: 'DO', u: 'mg/L' },
        { k: 'Độ mặn', u: '‰' },
        { k: 'NH3', u: 'mg/L' },
        { k: 'NO2', u: 'mg/L' },
        { k: 'Độ kiềm', u: 'mg/L' },
        { k: 'H2S', u: 'mg/L' },
    ];
    return (
        <Sheet
            open={open}
            onClose={onClose}
            title="Nhập nhật ký đo nước"
            footer={
                <PrimaryButton full icon={Icons.check} onClick={onSave}>
                    Lưu nhật ký
                </PrimaryButton>
            }
        >
            <div className="mb-3 rounded-xl bg-slate-50 px-3 py-2 text-[12px] text-ink-soft">
                Thời điểm đo:{' '}
                <span className="font-mono font-semibold text-ink">
                    {fmtDateTime(new Date().toISOString())}
                </span>
            </div>
            <div className="grid grid-cols-2 gap-3">
                {fields.map((f) => (
                    <Field key={f.k} label={f.k} unit={f.u}>
                        <input className={inputClass} placeholder="0.0" inputMode="decimal" />
                    </Field>
                ))}
            </div>
            <div className="mt-3">
                <Field label="Ghi chú">
                    <textarea
                        className={`${inputClass} font-sans`}
                        rows={2}
                        placeholder="Quan sát tại hiện trường…"
                    />
                </Field>
            </div>
        </Sheet>
    );
}

function WaterDetail({ log, onClose }: { log: WaterLog | null; onClose: () => void }) {
    const nav = useNav();
    const [voiding, setVoiding] = useState(false);
    const [reason, setReason] = useState('');
    if (!log) return null;
    return (
        <Sheet open={!!log} onClose={onClose} title={`Nhật ký ${log.id}`}>
            <div className="mb-3 flex items-center justify-between">
                <span className="text-[12px] text-ink-muted">{fmtDateTime(log.recordedAt)}</span>
                {log.voided ? (
                    <Badge tone="slate">Đã hủy hiệu lực</Badge>
                ) : (
                    <Badge tone="teal" dot>
                        Có hiệu lực
                    </Badge>
                )}
            </div>
            <WaterGrid log={log} />
            {log.note && (
                <p className="mt-3 rounded-xl bg-slate-50 p-3 text-[13px] text-ink-soft">
                    {log.note}
                </p>
            )}

            {log.voided ? (
                <div className="mt-4 rounded-xl border border-line bg-slate-50/60 p-3 text-[12px]">
                    <div className="font-semibold text-ink">Đã hủy hiệu lực</div>
                    <div className="mt-1 text-ink-soft">Lý do: {log.voided.reason}</div>
                    <div className="mt-0.5 text-ink-muted">
                        {log.voided.by} · {fmtDateTime(log.voided.at)}
                    </div>
                </div>
            ) : voiding ? (
                <div className="mt-4 space-y-2">
                    <Field label="Lý do hủy hiệu lực (bắt buộc)">
                        <textarea
                            className={`${inputClass} font-sans`}
                            rows={2}
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            placeholder="Vì sao bản ghi này không chính xác?"
                        />
                    </Field>
                    <div className="flex gap-2">
                        <GhostButton full onClick={() => setVoiding(false)}>
                            Hủy bỏ
                        </GhostButton>
                        <PrimaryButton
                            tone="rose"
                            full
                            onClick={() => {
                                if (!reason.trim())
                                    return nav.toast('Vui lòng nhập lý do hủy hiệu lực.');
                                log.voided = {
                                    at: new Date().toISOString(),
                                    by: currentUser.name,
                                    reason: reason.trim(),
                                };
                                onClose();
                                nav.toast('Đã hủy hiệu lực bản ghi đo nước.');
                            }}
                        >
                            Xác nhận
                        </PrimaryButton>
                    </div>
                </div>
            ) : (
                <div className="mt-4">
                    <GhostButton full icon={Icons.ban} onClick={() => setVoiding(true)}>
                        Hủy hiệu lực bản ghi
                    </GhostButton>
                </div>
            )}
        </Sheet>
    );
}

/* ------------------------------------------------------------------ health */
function HealthTab({ seasonId }: { seasonId: string }) {
    const nav = useNav();
    const [form, setForm] = useState(false);
    const [detail, setDetail] = useState<HealthLog | null>(null);
    const [filter, setFilter] = useState<'all' | 'attention' | 'voided'>('all');
    const logs = healthLogs.filter((h) => h.seasonId === seasonId);
    const valid = logs.filter((l) => !l.voided);
    const attentionCount = valid.filter(
        (log) => log.healthStatus === 'warning' || log.healthStatus === 'critical',
    ).length;
    const voidedCount = logs.filter((log) => !!log.voided).length;
    const visible = logs.filter((log) =>
        filter === 'attention'
            ? !log.voided && (log.healthStatus === 'warning' || log.healthStatus === 'critical')
            : filter === 'voided'
              ? !!log.voided
              : true,
    );
    const growth =
        valid.length >= 2 ? (valid[0].avgWeightG! - valid[1].avgWeightG!).toFixed(1) : null;

    return (
        <div className="space-y-3">
            <PrimaryButton full icon={Icons.plus} tone="rose" onClick={() => setForm(true)}>
                Ghi nhận sức khỏe tôm
            </PrimaryButton>

            {valid[0]?.estimatedBiomassKg && (
                <div className="grid grid-cols-3 gap-2">
                    <Stat
                        label="Sinh khối"
                        value={`${num(valid[0].estimatedBiomassKg)}`}
                        sub="kg"
                        tone="teal"
                    />
                    <Stat label="Cỡ TB" value={`${valid[0].avgWeightG}`} sub="g/con" />
                    <Stat label="Tăng trưởng" value={growth ? `+${growth}` : '—'} sub="g / kỳ" />
                </div>
            )}

            <div className="rounded-xl bg-rose-50/70 px-3 py-2 text-[11px] leading-snug text-rose-500">
                <Icons.info size={13} className="mr-1 inline align-[-2px]" />
                Chỉ bản ghi <b>còn hiệu lực</b> mới được dùng tính sinh khối & liều động. Sửa sai
                bằng cách hủy hiệu lực kèm lý do.
            </div>

            <Segmented
                fill
                value={filter}
                onChange={setFilter}
                options={[
                    { value: 'all', label: `Tất cả (${logs.length})` },
                    { value: 'attention', label: `Chú ý (${attentionCount})` },
                    { value: 'voided', label: `Vô hiệu (${voidedCount})` },
                ]}
            />

            {visible.length === 0 && (
                <EmptyState
                    icon={Icons.heart}
                    title={logs.length === 0 ? 'Chưa có bản ghi sức khỏe' : 'Không có bản ghi phù hợp'}
                />
            )}

            {visible.map((l) => {
                const hm = healthMeta[l.healthStatus];
                return (
                    <button
                        key={l.id}
                        onClick={() => setDetail(l)}
                        className={`card w-full p-3.5 text-left transition active:scale-[0.99] ${l.voided ? 'opacity-60' : ''}`}
                    >
                        <div className="flex items-start justify-between gap-2">
                            <span className="flex min-w-0 items-center gap-2.5">
                                <span className="grid size-8 shrink-0 place-items-center rounded-xl bg-rose-50 text-rose-500">
                                    <Icons.heart size={16} />
                                </span>
                                <span className="min-w-0">
                                    <span className="block text-[13px] font-bold text-ink">
                                        {fmtTime(l.recordedAt)}
                                    </span>
                                    <span className="block font-mono text-[10px] text-ink-muted">
                                        {l.id} · {fmtDate(l.recordedAt)}
                                    </span>
                                </span>
                            </span>
                            {l.voided ? (
                                <Badge tone="slate">Đã hủy hiệu lực</Badge>
                            ) : (
                                <Badge tone={hm.tone} dot>
                                    {hm.label}
                                </Badge>
                            )}
                        </div>
                        <div className="mt-2.5">
                            <MetricTileGrid
                                items={[
                                    {
                                        label: 'Cỡ TB',
                                        value: l.avgWeightG != null ? num(l.avgWeightG) : '—',
                                        unit: 'g',
                                    },
                                    {
                                        label: 'Dài TB',
                                        value: l.avgLengthCm != null ? num(l.avgLengthCm) : '—',
                                        unit: 'cm',
                                    },
                                    {
                                        label: 'Sinh khối',
                                        value:
                                            l.estimatedBiomassKg != null
                                                ? num(l.estimatedBiomassKg)
                                                : '—',
                                        unit: 'kg',
                                    },
                                    {
                                        label: 'Hao hụt',
                                        value:
                                            l.mortalityCount != null ? num(l.mortalityCount) : '—',
                                        unit: 'con',
                                    },
                                    {
                                        label: 'Cỡ mẫu',
                                        value: l.sampleSize != null ? num(l.sampleSize) : '—',
                                        unit: 'con',
                                    },
                                    {
                                        label: 'Quần thể',
                                        value:
                                            l.estimatedPopulation != null
                                                ? num(l.estimatedPopulation)
                                                : '—',
                                        unit: 'con',
                                    },
                                ]}
                            />
                        </div>
                        {l.note && (
                            <p className="mt-2 rounded-xl bg-slate-50 p-3 text-[10px] leading-relaxed text-ink-soft">
                                {l.note}
                            </p>
                        )}
                    </button>
                );
            })}

            <HealthForm
                open={form}
                onClose={() => setForm(false)}
                onSave={() => {
                    setForm(false);
                    nav.toast('Đã ghi nhận sức khỏe — sinh khối được cập nhật.');
                }}
            />
            <HealthDetail log={detail} onClose={() => setDetail(null)} />
        </div>
    );
}

function HealthForm({
    open,
    onClose,
    onSave,
}: {
    open: boolean;
    onClose: () => void;
    onSave: () => void;
}) {
    const [selectedHealth, setSelectedHealth] = useState<HealthLog['healthStatus']>('good');
    return (
        <Sheet
            open={open}
            onClose={onClose}
            title="Ghi nhận sức khỏe tôm"
            footer={
                <PrimaryButton tone="rose" full icon={Icons.check} onClick={onSave}>
                    Lưu bản ghi
                </PrimaryButton>
            }
        >
            <div className="mb-3 rounded-xl bg-slate-50 px-3 py-2 text-[12px] text-ink-soft">
                Thời điểm ghi nhận:{' '}
                <span className="font-mono font-semibold text-ink">
                    {fmtDateTime(new Date().toISOString())}
                </span>
            </div>
            <div className="grid grid-cols-2 gap-3">
                <Field label="Số mẫu (chài)" unit="con">
                    <input className={inputClass} inputMode="numeric" placeholder="120" />
                </Field>
                <Field label="Trọng lượng TB" unit="g">
                    <input className={inputClass} inputMode="decimal" placeholder="12.4" />
                </Field>
                <Field label="Chiều dài TB" unit="cm">
                    <input className={inputClass} inputMode="decimal" placeholder="11.2" />
                </Field>
                <Field label="Số hao hụt" unit="con">
                    <input className={inputClass} inputMode="numeric" placeholder="0" />
                </Field>
                <Field label="Quần thể ước tính" unit="con">
                    <input className={inputClass} inputMode="numeric" placeholder="416000" />
                </Field>
                <Field label="Sinh khối ước tính" unit="kg">
                    <input className={inputClass} inputMode="decimal" placeholder="1180" />
                </Field>
            </div>
            <div className="mt-3">
                <Field label="Đánh giá sức khỏe">
                    <div className="grid grid-cols-4 gap-1.5">
                        {(['excellent', 'good', 'warning', 'critical'] as const).map((h) => (
                            <button
                                key={h}
                                type="button"
                                onClick={() => setSelectedHealth(h)}
                                className={`rounded-xl border py-2 text-[11px] font-semibold transition ${
                                    selectedHealth === h
                                        ? 'border-ocean-400 bg-ocean-50 text-ocean-700'
                                        : 'border-line bg-white text-ink-soft'
                                }`}
                            >
                                {healthMeta[h].label}
                            </button>
                        ))}
                    </div>
                </Field>
            </div>
            <div className="mt-3">
                <Field label="Ghi chú quan sát">
                    <textarea
                        className={`${inputClass} font-sans`}
                        rows={2}
                        placeholder="Màu sắc, đường ruột, phân, vỏ…"
                    />
                </Field>
            </div>
        </Sheet>
    );
}

function HealthDetail({ log, onClose }: { log: HealthLog | null; onClose: () => void }) {
    const nav = useNav();
    const [voiding, setVoiding] = useState(false);
    const [reason, setReason] = useState('');
    if (!log) return null;
    const hm = healthMeta[log.healthStatus];
    return (
        <Sheet open={!!log} onClose={onClose} title={`Sức khỏe ${log.id}`}>
            <div className="mb-3 flex items-center justify-between">
                <span className="text-[12px] text-ink-muted">{fmtDateTime(log.recordedAt)}</span>
                {log.voided ? (
                    <Badge tone="slate">Đã hủy hiệu lực</Badge>
                ) : (
                    <Badge tone={hm.tone} dot>
                        {hm.label}
                    </Badge>
                )}
            </div>
            <MetricTileGrid
                items={[
                    {
                        label: 'Cỡ TB',
                        value: log.avgWeightG != null ? num(log.avgWeightG) : '—',
                        unit: 'g',
                    },
                    {
                        label: 'Dài TB',
                        value: log.avgLengthCm != null ? num(log.avgLengthCm) : '—',
                        unit: 'cm',
                    },
                    {
                        label: 'Số mẫu',
                        value: log.sampleSize != null ? num(log.sampleSize) : '—',
                        unit: 'con',
                    },
                    {
                        label: 'Hao hụt',
                        value: log.mortalityCount != null ? num(log.mortalityCount) : '—',
                        unit: 'con',
                    },
                    {
                        label: 'Quần thể',
                        value: log.estimatedPopulation != null ? num(log.estimatedPopulation) : '—',
                        unit: 'con',
                    },
                    {
                        label: 'Sinh khối',
                        value: log.estimatedBiomassKg != null ? num(log.estimatedBiomassKg) : '—',
                        unit: 'kg',
                    },
                ]}
            />
            {log.note && (
                <p className="mt-3 rounded-xl bg-slate-50 p-3 text-[13px] text-ink-soft">
                    {log.note}
                </p>
            )}
            {log.voided ? (
                <div className="mt-4 rounded-xl border border-line bg-slate-50/60 p-3 text-[12px]">
                    <div className="font-semibold text-ink">Đã hủy hiệu lực · {log.voided.by}</div>
                    <div className="mt-1 text-ink-soft">Lý do: {log.voided.reason}</div>
                </div>
            ) : voiding ? (
                <div className="mt-4 space-y-2">
                    <Field label="Lý do hủy hiệu lực (bắt buộc)">
                        <textarea
                            className={`${inputClass} font-sans`}
                            rows={2}
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                        />
                    </Field>
                    <div className="flex gap-2">
                        <GhostButton full onClick={() => setVoiding(false)}>
                            Hủy bỏ
                        </GhostButton>
                        <PrimaryButton
                            tone="rose"
                            full
                            onClick={() => {
                                if (!reason.trim()) return nav.toast('Vui lòng nhập lý do.');
                                log.voided = {
                                    at: new Date().toISOString(),
                                    by: currentUser.name,
                                    reason: reason.trim(),
                                };
                                onClose();
                                nav.toast('Đã hủy hiệu lực bản ghi sức khỏe.');
                            }}
                        >
                            Xác nhận
                        </PrimaryButton>
                    </div>
                </div>
            ) : (
                <div className="mt-4">
                    <GhostButton full icon={Icons.ban} onClick={() => setVoiding(true)}>
                        Hủy hiệu lực bản ghi
                    </GhostButton>
                </div>
            )}
        </Sheet>
    );
}

/* --------------------------------------------------------------------- ops */
function OpsTab({ seasonId }: { seasonId: string }) {
    const [filter, setFilter] = useState<'all' | 'planned' | 'completed' | 'cancelled'>('all');
    const ops = operations.filter((o) => o.seasonId === seasonId);
    const generationWarnings = ops.filter((o) => !!o.blocked);
    const schedules = ops.filter((o) => !o.blocked);
    const visible = schedules.filter((o) => (filter === 'all' ? true : o.status === filter));
    // Distinguish: feeding+medicine (cữ ăn) vs mineral/chemical treatment.
    const feed = visible.filter(
        (o) => o.operationType === 'feeding' || o.operationType === 'medicine',
    );
    const treat = visible.filter(
        (o) => o.operationType === 'mineral' || o.operationType === 'chemical',
    );

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-3 gap-2">
                <Stat
                    label="Chờ thực hiện"
                    value={schedules.filter((o) => o.status === 'planned').length}
                />
                <Stat
                    label="Hoàn thành"
                    value={schedules.filter((o) => o.status === 'completed').length}
                    tone="teal"
                />
                <Stat
                    label="Đã hủy"
                    value={schedules.filter((o) => o.status === 'cancelled').length}
                />
            </div>
            {generationWarnings.map((warning) => (
                <div
                    key={warning.id}
                    className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-[11px] leading-relaxed text-amber-700"
                >
                    <div className="flex items-center gap-1.5 font-bold">
                        <Icons.warn size={14} /> Chưa thể sinh lịch kế tiếp
                    </div>
                    <p className="mt-1">{warning.blocked}</p>
                </div>
            ))}
            <CompactFilterTabs
                value={filter}
                onChange={setFilter}
                options={[
                    { value: 'all', label: 'Tất cả' },
                    { value: 'planned', label: 'Chờ làm' },
                    { value: 'completed', label: 'Hoàn thành' },
                    { value: 'cancelled', label: 'Đã hủy' },
                ]}
            />
            {visible.length === 0 && (
                <EmptyState icon={Icons.ops} title="Không có lịch vận hành phù hợp" />
            )}
            {visible.length > 0 && (
            <>
            <div>
                <div className="mb-2 flex items-center gap-2 px-1">
                    <span className={`grid size-6 place-items-center rounded-lg ${chip('teal')}`}>
                        <Icons.ops size={14} />
                    </span>
                    <span className="font-display text-[14px] font-bold text-ink">
                        Cữ ăn & thuốc theo cữ
                    </span>
                </div>
                <div className="space-y-2">
                    {feed.map((o) => (
                        <OpRow key={o.id} op={o} />
                    ))}
                    {feed.length === 0 && <EmptyState icon={Icons.ops} title="Không có cữ ăn" />}
                </div>
            </div>
            <div>
                <div className="mb-2 flex items-center gap-2 px-1">
                    <span className={`grid size-6 place-items-center rounded-lg ${chip('violet')}`}>
                        <Icons.flask size={14} />
                    </span>
                    <span className="font-display text-[14px] font-bold text-ink">
                        Xử lý khoáng / hóa chất
                    </span>
                </div>
                <div className="space-y-2">
                    {treat.map((o) => (
                        <OpRow key={o.id} op={o} />
                    ))}
                    {treat.length === 0 && (
                        <EmptyState icon={Icons.flask} title="Không có xử lý khoáng/hóa chất" />
                    )}
                </div>
            </div>
            </>
            )}
        </div>
    );
}

function OpRow({ op }: { op: OperationSchedule }) {
    const nav = useNav();
    const meta = opTypeMeta[op.operationType];
    const Icon = Icons[meta.icon];
    const om = opMeta[op.status];
    return (
        <button
            onClick={() => nav.go('op', { id: op.id })}
            disabled={!!op.blocked}
            className={`card w-full p-3.5 text-left transition active:scale-[0.99] ${op.blocked ? 'opacity-70' : ''} ${op.status === 'cancelled' ? 'opacity-60' : ''}`}
        >
            <div className="flex items-start gap-3">
                <span
                    className={`grid size-9 shrink-0 place-items-center rounded-xl ${chip(meta.tone)}`}
                >
                    <Icon size={17} />
                </span>
                <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                        <Badge tone={meta.tone}>{meta.label}</Badge>
                        {op.mealNumber && (
                            <span className="text-[11px] font-semibold text-ink-muted">
                                Cữ {op.mealNumber}
                            </span>
                        )}
                    </div>
                    <div className="mt-1 truncate text-[13px] font-semibold text-ink">
                        {op.productName}
                    </div>
                    <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-ink-muted">
                        <Icons.clock size={12} /> {fmtTime(op.scheduledAt)}
                        {!op.blocked && (
                            <>
                                {' · '}
                                <span className="font-mono">
                                    {op.status === 'completed' && op.execution
                                        ? op.execution.actualQuantity
                                        : op.plannedQuantity}{' '}
                                    {op.unit}
                                </span>
                            </>
                        )}
                    </div>
                    {op.withMedicine && (
                        <div className="mt-1.5 inline-flex items-center gap-1 rounded-lg bg-rose-50 px-2 py-0.5 text-[11px] font-semibold text-rose-500">
                            <Icons.pills size={12} /> Kèm {op.withMedicine.productName}
                        </div>
                    )}
                    {op.blocked && (
                        <div className="mt-1.5 flex items-start gap-1 text-[11px] font-semibold text-amber-500">
                            <Icons.warn size={13} className="mt-px shrink-0" />
                            <span>Chưa tạo được lịch — {op.blocked}</span>
                        </div>
                    )}
                </div>
                {!op.blocked && (
                    <Badge tone={om.tone} dot>
                        {om.label}
                    </Badge>
                )}
            </div>
        </button>
    );
}

/* ------------------------------------------------------------------- cases */
function CasesTab({ seasonId }: { seasonId: string }) {
    const nav = useNav();
    const [tab, setTab] = useState<'open' | 'resolved'>('open');
    const cases = diseaseCases.filter((c) => c.seasonId === seasonId);
    const openCases = cases.filter((c) => c.status !== 'resolved');
    const resolvedCases = cases.filter((c) => c.status === 'resolved');
    const visible = tab === 'open' ? openCases : resolvedCases;
    return (
        <div className="space-y-3">
            <PrimaryButton
                full
                icon={Icons.plus}
                tone="rose"
                onClick={() => nav.go('case-new', { seasonId })}
            >
                Tạo ca bệnh
            </PrimaryButton>
            <Segmented
                value={tab}
                onChange={setTab}
                options={[
                    { value: 'open', label: `Đang xử lý (${openCases.length})` },
                    { value: 'resolved', label: `Đã giải quyết (${resolvedCases.length})` },
                ]}
            />
            {visible.length === 0 && (
                <EmptyState
                    icon={Icons.diseaseCase}
                    title={cases.length === 0 ? 'Chưa có ca bệnh' : 'Không có ca bệnh ở trạng thái này'}
                    hint={
                        cases.length === 0
                            ? 'Tạo ca bệnh khi phát hiện dấu hiệu bất thường để chuyên gia hỗ trợ.'
                            : undefined
                    }
                />
            )}
            {visible.map((c) => {
                const cm = caseStatusMeta[c.status];
                return (
                    <button
                        key={c.id}
                        onClick={() => nav.go('case', { id: c.id })}
                        className="card w-full p-3.5 text-left transition active:scale-[0.99]"
                    >
                        <div className="flex items-start gap-3">
                            <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-rose-50 text-rose-500">
                                <Icons.diseaseCase size={17} />
                            </span>
                            <div className="min-w-0 flex-1">
                                <span className="block text-[14px] font-bold text-ink">{c.title}</span>
                                <p className="mt-1 line-clamp-2 text-[12px] text-ink-soft">
                                    {c.description}
                                </p>
                            </div>
                            <Badge tone={cm.tone} dot>
                                {cm.label}
                            </Badge>
                        </div>
                        <div className="mt-2 flex items-center gap-2 text-[11px] text-ink-muted">
                            <span className="font-mono">{c.id}</span> · {c.expertName} ·{' '}
                            {c.responses.length} phản hồi
                        </div>
                    </button>
                );
            })}
        </div>
    );
}

// used by Overview import
export { OpRow };
