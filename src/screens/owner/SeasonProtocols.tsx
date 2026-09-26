import { useMemo, useState, type ReactNode } from 'react';
import { useNav } from '../../app/store';
import {
    Icons,
    Badge,
    Segmented,
    EmptyState,
    Field,
    inputClass,
    PrimaryButton,
    GhostButton,
    type Tone,
} from '../../app/ui';
import {
    ownerSeasons,
    protocolsForSeason,
    casesForSeason,
    allSeasonProtocols,
    operationsForProtocol,
    ownerProducts,
    inventoryTransactions,
    balancesForProduct,
    latestHealthLogs,
    isSeasonVisibleToOwner,
    type PendingProtocol,
    type ProtocolItem,
    type ProductUnit,
    type OwnerDiseaseCase,
    type OwnerSeason,
    type OwnerOperationOccurrence,
} from '../../app/ownerData';
import { ScreenHeader } from '../common';
import { currentUser } from '../../app/data';

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
        hour: '2-digit',
        minute: '2-digit',
    });

const fmtTime = (iso: string) =>
    new Date(iso).toLocaleTimeString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
    });

const protocolStatusMeta: Record<string, { label: string; tone: Tone }> = {
    draft: { label: 'Bản nháp', tone: 'slate' },
    pending_approval: { label: 'Chờ duyệt', tone: 'amber' },
    approved: { label: 'Đang áp dụng', tone: 'teal' },
    rejected: { label: 'Đã từ chối', tone: 'rose' },
    superseded: { label: 'Đã thay thế', tone: 'slate' },
    cancelled: { label: 'Đã hủy', tone: 'slate' },
    aborted: { label: 'Dừng khẩn cấp', tone: 'rose' },
};

const opTypeMeta: Record<
    string,
    {
        label: string;
        tone: Tone;
        icon: keyof typeof Icons;
    }
> = {
    feeding: { label: 'Thức ăn', tone: 'teal', icon: 'ops' },
    medicine: { label: 'Thuốc / men', tone: 'rose', icon: 'pills' },
    mineral: { label: 'Khoáng', tone: 'ocean', icon: 'flask' },
    chemical: { label: 'Hóa chất', tone: 'violet', icon: 'flask' },
    other: { label: 'Khác', tone: 'slate', icon: 'ops' },
};

const doseBasisLabel: Record<string, string> = {
    fixed_quantity: 'Liều cố định',
    per_kg_biomass: 'Theo kg sinh khối',
    percent_biomass: '% sinh khối',
    per_m3_water: 'Theo m³ nước',
};

const productUnitLabel: Record<ProductUnit, string> = {
    kg: 'kg',
    g: 'g',
    l: 'lít',
    ml: 'ml',
    pack: 'gói',
    bottle: 'chai',
};

function inventoryRowsForProtocol(protocol: PendingProtocol) {
    const season = ownerSeasons.find((item) => item.id === protocol.seasonId);
    const distinctItems = Array.from(
        new Map(
            protocol.items.map((item) => [
                item.productId ??
                    `recommended:${item.productName?.trim().toLowerCase() ?? item.id}:${item.doseUnit}`,
                item,
            ]),
        ).values(),
    );

    return distinctItems.map((item) => {
        const product = item.productId
            ? ownerProducts.find(
                  (candidate) =>
                      candidate.id === item.productId &&
                      !candidate.isDeleted &&
                      candidate.farmId === season?.farmId,
              )
            : undefined;
        const lots = product ? balancesForProduct(product.id) : [];
        const stock = lots.reduce((sum, lot) => sum + lot.quantity, 0);
        return { item, product, lots, stock };
    });
}

function doseDisplay(item: Pick<ProtocolItem, 'doseBasis' | 'doseValue' | 'doseUnit'>) {
    if (item.doseBasis === 'per_kg_biomass')
        return `${item.doseValue} ${item.doseUnit}/kg sinh khối`;
    if (item.doseBasis === 'percent_biomass') return `${item.doseValue}% sinh khối`;
    if (item.doseBasis === 'per_m3_water') return `${item.doseValue} ${item.doseUnit}/m³ nước`;
    return `${item.doseValue} ${item.doseUnit}/lần`;
}

export function SeasonProtocolList({ seasonId }: { seasonId: string }) {
    const nav = useNav();
    const season = ownerSeasons.find((item) => item.id === seasonId);
    const all = protocolsForSeason(seasonId);
    const [tab, setTab] = useState<'production' | 'treatment'>('production');
    const visible = all.filter((item) => item.protocolType === tab);

    if (!season || !isSeasonVisibleToOwner(seasonId)) {
        return (
            <div className="pb-8">
                <ScreenHeader title="Phác đồ vụ nuôi" />
                <div className="px-4">
                    <EmptyState
                        icon={Icons.protocol}
                        title="Không tìm thấy vụ nuôi"
                        hint="Vụ nuôi không còn trong danh sách quản lý."
                    />
                </div>
            </div>
        );
    }

    return (
        <div className="pb-8">
            <ScreenHeader
                title="Phác đồ"
                subtitle={season ? `${season.pondName} · ${season.name}` : undefined}
            />
            <div className="space-y-3 px-4">
                <Segmented
                    value={tab}
                    onChange={setTab}
                    options={[
                        {
                            value: 'production',
                            label: `Phác đồ nuôi (${all.filter((item) => item.protocolType === 'production').length})`,
                        },
                        {
                            value: 'treatment',
                            label: `Điều trị (${all.filter((item) => item.protocolType === 'treatment').length})`,
                        },
                    ]}
                />
                {visible.length === 0 ? (
                    <EmptyState
                        icon={Icons.protocol}
                        title="Chưa có phác đồ"
                        hint="Chuyên gia sẽ soạn và gửi phác đồ để Chủ trại xem."
                    />
                ) : (
                    <div className="space-y-3">
                        {visible.map((protocol) => (
                            <ProtocolCard
                                key={protocol.id}
                                protocol={protocol}
                                onPress={() =>
                                    nav.go('owner-season-protocol-detail', {
                                        protocolId: protocol.id,
                                    })
                                }
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

function ProtocolCard({ protocol, onPress }: { protocol: PendingProtocol; onPress: () => void }) {
    const status = protocolStatusMeta[protocol.status] ?? {
        label: protocol.status,
        tone: 'slate' as const,
    };
    const isTreatment = protocol.protocolType === 'treatment';
    const schedules = operationsForProtocol(protocol.id);
    const completed = schedules.filter((item) => item.status === 'completed').length;
    const maxDay = Math.max(...protocol.items.map((item) => item.endDayOffset + 1), 0);

    return (
        <button
            onClick={onPress}
            className="card w-full p-3.5 text-left transition active:scale-[0.99]"
        >
            <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                    <div className="text-[14px] font-bold leading-snug text-ink">
                        {protocol.title}
                    </div>
                </div>
                <Badge tone={status.tone} dot={protocol.status === 'pending_approval'}>
                    {status.label}
                </Badge>
            </div>
            <p
                className={`mt-1 line-clamp-2 text-[12px] leading-relaxed ${protocol.diseaseCaseTitle ? 'text-rose-500' : 'text-ink-soft'}`}
            >
                {protocol.diseaseCaseTitle
                    ? `Ca bệnh: ${protocol.diseaseCaseTitle}`
                    : protocol.summary}
            </p>
            <div className="mt-2.5 flex items-center justify-between border-t border-line-soft pt-2.5">
                <div className="flex items-center gap-1.5">
                    <Badge tone={isTreatment ? 'rose' : 'ocean'}>
                        {isTreatment ? 'Điều trị' : 'Nuôi'}
                    </Badge>
                    <Badge tone="slate">v{protocol.versionNo}</Badge>
                </div>
                <div className="flex items-center gap-1 text-[10px] text-ink-muted">
                    {protocol.createdBy} · {fmtDate(protocol.submittedAt)}{' '}
                    <Icons.chevronR size={13} />
                </div>
            </div>
        </button>
    );
}

function MiniStat({ label, value }: { label: string; value: string }) {
    return (
        <div>
            <div className="text-[11px] font-bold text-ink">{value}</div>
            <div className="mt-0.5 text-[9px] text-ink-muted">{label}</div>
        </div>
    );
}

export function SeasonProtocolDetail({ protocolId }: { protocolId: string }) {
    const nav = useNav();
    const protocol = allSeasonProtocols.find((item) => item.id === protocolId);
    const [, refresh] = useState(0);
    if (!protocol || !isSeasonVisibleToOwner(protocol.seasonId)) {
        return (
            <div className="pb-8">
                <ScreenHeader title="Chi tiết phác đồ" />
                <div className="px-4">
                    <EmptyState
                        icon={Icons.protocol}
                        title="Không tìm thấy phác đồ"
                        hint="Vụ nuôi liên quan không còn trong danh sách quản lý."
                    />
                </div>
            </div>
        );
    }

    const season = ownerSeasons.find((item) => item.id === protocol.seasonId);
    const status = protocolStatusMeta[protocol.status] ?? {
        label: protocol.status,
        tone: 'slate' as const,
    };
    const isTreatment = protocol.protocolType === 'treatment';
    const maxDay = Math.max(...protocol.items.map((item) => item.endDayOffset + 1), 1);
    const canReview =
        protocol.status === 'pending_approval' &&
        (season?.status === 'planning' || season?.status === 'active');

    return (
        <div className="pb-8">
            <ScreenHeader
                title="Chi tiết phác đồ"
                subtitle={season ? `${season.pondName} · ${season.name}` : undefined}
            />
            <div className="space-y-4 px-4">
                <div
                    className={`overflow-hidden rounded-2xl bg-white shadow-[0_2px_14px_rgba(0,0,0,.07)] ${
                        protocol.status === 'pending_approval' ? 'ring-1 ring-amber-200' : ''
                    }`}
                >
                    <div className={`h-1.5 ${isTreatment ? 'bg-rose-400' : 'bg-ocean-500'}`} />
                    <div className="space-y-3 p-4">
                        <div className="flex flex-wrap gap-1.5">
                            <Badge tone={isTreatment ? 'rose' : 'ocean'}>
                                {isTreatment ? 'Phác đồ điều trị' : 'Phác đồ nuôi'}
                            </Badge>
                            <Badge tone="slate">Phiên bản {protocol.versionNo}</Badge>
                            <Badge tone={status.tone} dot={protocol.status === 'pending_approval'}>
                                {status.label}
                            </Badge>
                        </div>
                        <div>
                            <h1 className="text-[16px] font-bold leading-snug text-ink">
                                {protocol.title}
                            </h1>
                            <p className="mt-1 text-[12px] text-ink-muted">
                                {protocol.pondName} · {protocol.farmName}
                            </p>
                        </div>
                        {protocol.diseaseCaseTitle && (
                            <button
                                onClick={() =>
                                    protocol.diseaseCaseId &&
                                    nav.go('owner-case-detail', {
                                        caseId: protocol.diseaseCaseId,
                                    })
                                }
                                className="flex w-full items-center gap-2 rounded-xl border border-rose-100 bg-rose-50 px-3 py-2 text-left"
                            >
                                <Icons.diseaseCase size={14} className="shrink-0 text-rose-500" />
                                <div className="min-w-0 flex-1">
                                    <div className="text-[9px] font-bold uppercase tracking-wide text-rose-500">
                                        Ca bệnh liên quan
                                    </div>
                                    <div className="truncate text-[11px] font-semibold text-rose-700">
                                        {protocol.diseaseCaseTitle}
                                    </div>
                                </div>
                                <Icons.chevronR size={13} className="text-rose-400" />
                            </button>
                        )}
                    </div>
                </div>

                {protocol.summary && (
                    <div className="rounded-2xl border border-ocean-100 bg-ocean-50 p-4">
                        <div className="mb-1 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-ocean-600">
                            <Icons.info size={13} /> Mục tiêu phác đồ
                        </div>
                        <p className="text-[12px] leading-relaxed text-ocean-800">
                            {protocol.summary}
                        </p>
                    </div>
                )}

                {canReview && <InventoryReadiness protocol={protocol} />}
                {protocol.status === 'pending_approval' && !canReview && (
                    <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-[11px] leading-relaxed text-amber-800">
                        Vụ nuôi đã kết thúc hoặc bị hủy nên phác đồ này chỉ còn giá trị đối soát,
                        không thể phê duyệt.
                    </div>
                )}
                <SixDocProtocolTimeline protocol={protocol} season={season} />
                <ProtocolAudit protocol={protocol} />
                {canReview && (
                    <ReviewDecision
                        protocol={protocol}
                        onChanged={() => refresh((value) => value + 1)}
                    />
                )}
            </div>
        </div>
    );
}

function InventoryReadiness({ protocol }: { protocol: PendingProtocol }) {
    const nav = useNav();
    const rows = inventoryRowsForProtocol(protocol);
    const season = ownerSeasons.find((item) => item.id === protocol.seasonId);
    const missing = rows.filter((row) => !row.product).length;
    const low = rows.filter(
        (row) => row.product && row.stock <= row.product.minAlertQuantity,
    ).length;

    return (
        <div className="card overflow-hidden ring-1 ring-amber-100">
            <div className="flex items-start justify-between gap-3 border-b border-line-soft bg-amber-50 px-4 py-3">
                <div>
                    <div className="font-display text-[14px] font-bold text-ink">
                        Khả năng cấp vật tư
                    </div>
                    <p className="mt-0.5 text-[10px] leading-relaxed text-amber-700">
                        Phải liên kết đủ vật tư trong kho trước khi phê duyệt.
                    </p>
                </div>
                <Badge tone={missing > 0 ? 'rose' : low > 0 ? 'amber' : 'teal'} dot>
                    {missing > 0
                        ? `${missing} chưa liên kết`
                        : low > 0
                          ? `${low} cần nhập thêm`
                          : 'Sẵn sàng'}
                </Badge>
            </div>
            <div className="divide-y divide-line-soft">
                {rows.map(({ item, product, lots, stock }) => (
                    <div
                        key={item.productId ?? item.productName ?? item.id}
                        className="flex items-center gap-3 px-4 py-3"
                    >
                        <span
                            className={`grid size-8 shrink-0 place-items-center rounded-xl ${!product ? 'bg-rose-50 text-rose-500' : stock <= product.minAlertQuantity ? 'bg-amber-50 text-amber-600' : 'bg-teal-50 text-teal-600'}`}
                        >
                            {!product ? <Icons.x size={14} /> : <Icons.box size={14} />}
                        </span>
                        <div className="min-w-0 flex-1">
                            <div className="truncate text-[12px] font-semibold text-ink">
                                {product?.name ?? item.productName ?? 'Sản phẩm chưa đặt tên'}
                            </div>
                            {product ? (
                                <>
                                    {item.productName && item.productName !== product.name && (
                                        <div className="mt-0.5 truncate text-[9px] text-ocean-600">
                                            Chuyên gia đề xuất: {item.productName}
                                        </div>
                                    )}
                                    <div className="mt-0.5 text-[10px] text-ink-muted">
                                        Còn{' '}
                                        <b className="text-ink">
                                            {stock.toLocaleString('vi-VN')}{' '}
                                            {productUnitLabel[product.unit]}
                                        </b>{' '}
                                        · {lots.length} lô · ngưỡng{' '}
                                        {product.minAlertQuantity.toLocaleString('vi-VN')}{' '}
                                        {productUnitLabel[product.unit]}
                                    </div>
                                </>
                            ) : (
                                <div className="mt-0.5 text-[10px] font-semibold text-rose-600">
                                    Chưa có vật tư tương ứng trong kho
                                </div>
                            )}
                        </div>
                        {!product ? (
                            <button
                                type="button"
                                onClick={() => {
                                    if (!season) return;
                                    nav.go('owner-product-edit', {
                                        farmId: season.farmId,
                                        protocolId: protocol.id,
                                        protocolItemId: item.id,
                                    });
                                }}
                                className="shrink-0 rounded-lg bg-ocean-50 px-2.5 py-2 text-[10px] font-bold text-ocean-700"
                            >
                                Tạo vật tư
                            </button>
                        ) : stock <= product.minAlertQuantity ? (
                            <button
                                type="button"
                                onClick={() => nav.go('owner-stock-in', { productId: product.id })}
                                className="shrink-0 rounded-lg bg-amber-50 px-2.5 py-2 text-[10px] font-bold text-amber-700"
                            >
                                Nhập thêm
                            </button>
                        ) : (
                            <Badge tone="teal">Có hàng</Badge>
                        )}
                    </div>
                ))}
            </div>
            <p className="border-t border-line-soft px-4 py-2.5 text-[10px] leading-relaxed text-ink-muted">
                Lượng cần dùng chính xác được chốt khi sinh từng lịch vận hành theo sinh khối hoặc
                thể tích tại thời điểm đó.
            </p>
        </div>
    );
}

function SixDocProtocolTimeline({
    protocol,
    season,
}: {
    protocol: PendingProtocol;
    season?: OwnerSeason;
}) {
    const maxDay = Math.max(...protocol.items.map((item) => item.endDayOffset + 1), 1);
    const ranges = Array.from({ length: Math.ceil(maxDay / 6) }, (_, index) => ({
        start: index * 6 + 1,
        end: Math.min(index * 6 + 6, maxDay),
    }));
    const [rangeIndex, setRangeIndex] = useState(0);
    const [selectedDoc, setSelectedDoc] = useState(1);
    const selectedRange = ranges[rangeIndex] ?? ranges[0];
    const occurrences = operationsForProtocol(protocol.id);
    const anchorDate =
        protocol.protocolType === 'production'
            ? season?.stockingDate
            : protocol.reviewedAt?.slice(0, 10);

    const occurrenceDoc = (row: OwnerOperationOccurrence) => {
        if (!anchorDate) return null;
        const anchor = new Date(`${anchorDate}T00:00:00`).getTime();
        const scheduled = new Date(`${row.scheduledAt.slice(0, 10)}T00:00:00`).getTime();
        return Math.round((scheduled - anchor) / 86_400_000) + 1;
    };

    const docDate = (doc: number) => {
        if (!anchorDate) return null;
        const date = new Date(`${anchorDate}T00:00:00`);
        date.setDate(date.getDate() + doc - 1);
        return date.toLocaleDateString('vi-VN', {
            weekday: 'short',
            day: '2-digit',
            month: '2-digit',
        });
    };

    const docDateShort = (doc: number) => {
        if (!anchorDate) return null;
        const date = new Date(`${anchorDate}T00:00:00`);
        date.setDate(date.getDate() + doc - 1);
        return date.toLocaleDateString('vi-VN', {
            day: '2-digit',
            month: '2-digit',
        });
    };

    const docsInRange = Array.from(
        { length: selectedRange.end - selectedRange.start + 1 },
        (_, index) => selectedRange.start + index,
    );

    const selectRange = (index: number) => {
        const nextRange = ranges[index];
        if (!nextRange) return;
        setRangeIndex(index);
        setSelectedDoc(nextRange.start);
    };

    const selectDoc = (doc: number) => {
        const nextDoc = Math.min(Math.max(doc, 1), maxDay);
        setSelectedDoc(nextDoc);
        setRangeIndex(Math.floor((nextDoc - 1) / 6));
    };

    const selectedOffset = selectedDoc - 1;
    const selectedItems = protocol.items.filter(
        (item) =>
            selectedOffset >= item.startDayOffset &&
            selectedOffset <= item.endDayOffset &&
            (selectedOffset - item.startDayOffset) % item.repeatIntervalDays === 0,
    );
    const selectedRows = occurrences.filter((row) => occurrenceDoc(row) === selectedDoc);
    const selectedTimes = new Set([
        ...selectedItems.map((item) => item.plannedTime ?? 'Chưa đặt giờ'),
        ...selectedRows.map((row) => fmtTime(row.scheduledAt)),
    ]);
    const selectedCompleted = selectedRows.filter((row) => row.status === 'completed').length;
    const selectedIssues = selectedRows.filter(
        (row) => row.status === 'cancelled' || row.status === 'generation_failed',
    ).length;

    return (
        <div className="space-y-4">
            <div className="overflow-hidden rounded-2xl border border-line bg-white shadow-[0_2px_12px_rgba(15,23,42,.06)]">
                <div className="border-b border-line-soft bg-gradient-to-br from-ocean-50 via-white to-teal-50 px-4 py-3.5">
                    <div className="flex items-end justify-between gap-3">
                        <div>
                            <h2 className="font-display text-[15px] font-bold text-ink">
                                Lịch theo từng cữ
                            </h2>
                            <p className="mt-1 text-[10px] leading-relaxed text-ink-muted">
                                Chọn khoảng, sau đó chọn một DOC để xem chi tiết.
                            </p>
                        </div>
                        <Badge tone="ocean">{maxDay} ngày</Badge>
                    </div>
                </div>

                <div className="space-y-4 p-3.5">
                    <div>
                        <div className="mb-2 flex items-center gap-2">
                            <span className="grid size-5 place-items-center rounded-full bg-ocean-600 text-[10px] font-extrabold text-white">
                                1
                            </span>
                            <span className="text-[10px] font-extrabold uppercase tracking-[.08em] text-ink-soft">
                                Chọn khoảng DOC
                            </span>
                        </div>
                        <div className="scroll-clean flex gap-2 overflow-x-auto pb-1">
                            {ranges.map((range, index) => {
                                const containsCurrent =
                                    protocol.protocolType === 'production' &&
                                    season?.dayOfCulture != null &&
                                    season.dayOfCulture >= range.start &&
                                    season.dayOfCulture <= range.end;
                                return (
                                    <button
                                        key={range.start}
                                        onClick={() => selectRange(index)}
                                        className={`relative shrink-0 rounded-xl px-3.5 py-2 text-[11px] font-bold transition active:scale-95 ${
                                            rangeIndex === index
                                                ? 'bg-ocean-600 text-white shadow-sm shadow-ocean-200'
                                                : 'border border-line bg-slate-50 text-ink-soft'
                                        }`}
                                    >
                                        {range.start}–{range.end}
                                        {containsCurrent && (
                                            <span
                                                className={`absolute -right-1 -top-1 size-2.5 rounded-full border-2 ${rangeIndex === index ? 'border-ocean-600 bg-white' : 'border-white bg-teal-500'}`}
                                            />
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div>
                        <div className="mb-2 flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                                <span className="grid size-5 place-items-center rounded-full bg-ocean-600 text-[10px] font-extrabold text-white">
                                    2
                                </span>
                                <span className="text-[10px] font-extrabold uppercase tracking-[.08em] text-ink-soft">
                                    Chọn {protocol.protocolType === 'production' ? 'DOC' : 'ngày'}
                                </span>
                            </div>
                            <span className="text-[9px] text-ink-muted">Chỉ hiển thị 1 ngày</span>
                        </div>
                        <div className="grid grid-cols-6 gap-1.5">
                            {docsInRange.map((doc) => {
                                const rows = occurrences.filter(
                                    (row) => occurrenceDoc(row) === doc,
                                );
                                const hasIssue = rows.some(
                                    (row) =>
                                        row.status === 'cancelled' ||
                                        row.status === 'generation_failed',
                                );
                                const allCompleted =
                                    rows.length > 0 &&
                                    rows.every((row) => row.status === 'completed');
                                const isCurrent =
                                    protocol.protocolType === 'production' &&
                                    season?.dayOfCulture === doc;
                                const isSelected = selectedDoc === doc;
                                return (
                                    <button
                                        key={doc}
                                        onClick={() => setSelectedDoc(doc)}
                                        aria-pressed={isSelected}
                                        className={`relative min-w-0 rounded-xl px-1 py-2.5 text-center transition active:scale-95 ${
                                            isSelected
                                                ? 'bg-ocean-600 text-white shadow-md shadow-ocean-200 ring-2 ring-ocean-100'
                                                : isCurrent
                                                  ? 'border border-teal-300 bg-teal-50 text-teal-700'
                                                  : 'border border-line bg-white text-ink-soft'
                                        }`}
                                    >
                                        <span
                                            className={`block text-[8px] font-bold uppercase ${isSelected ? 'text-ocean-100' : 'text-ink-muted'}`}
                                        >
                                            {protocol.protocolType === 'production'
                                                ? 'DOC'
                                                : 'Ngày'}
                                        </span>
                                        <span className="mt-0.5 block text-[14px] font-extrabold leading-none">
                                            {doc}
                                        </span>
                                        {docDateShort(doc) && (
                                            <span
                                                className={`mt-1 block text-[8px] ${isSelected ? 'text-ocean-100' : 'text-ink-muted'}`}
                                            >
                                                {docDateShort(doc)}
                                            </span>
                                        )}
                                        {(hasIssue || allCompleted || rows.length > 0) && (
                                            <span
                                                className={`absolute right-1 top-1 size-1.5 rounded-full ${hasIssue ? 'bg-rose-400' : allCompleted ? 'bg-teal-400' : 'bg-amber-400'}`}
                                            />
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                        <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 px-0.5 text-[8px] text-ink-muted">
                            <StatusLegend color="bg-teal-400" label="Đã hoàn tất" />
                            <StatusLegend color="bg-amber-400" label="Đang chờ" />
                            <StatusLegend color="bg-rose-400" label="Có vấn đề" />
                        </div>
                    </div>
                </div>
            </div>

            {!anchorDate && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-3 text-[10px] leading-relaxed text-amber-700">
                    Phác đồ điều trị chưa được duyệt nên chưa có ngày bắt đầu và chưa thể tạo lịch
                    vận hành. Các cữ dưới đây là kế hoạch dự kiến để Chủ trại xem trước.
                </div>
            )}

            <div className="overflow-hidden rounded-2xl bg-gradient-to-r from-ocean-700 to-ocean-500 p-[1px] shadow-[0_6px_20px_rgba(14,116,144,.16)]">
                <div className="rounded-[15px] bg-gradient-to-r from-ocean-700 to-ocean-600 px-3.5 py-3 text-white">
                    <div className="flex items-center justify-between gap-3">
                        <button
                            onClick={() => selectDoc(selectedDoc - 1)}
                            disabled={selectedDoc === 1}
                            aria-label="DOC trước"
                            className="grid size-9 shrink-0 place-items-center rounded-xl bg-white/10 transition active:scale-95 disabled:opacity-30"
                        >
                            <Icons.chevronR size={17} className="rotate-180" />
                        </button>
                        <div className="min-w-0 text-center">
                            <div className="text-[16px] font-extrabold">
                                {protocol.protocolType === 'production'
                                    ? `DOC ${selectedDoc}`
                                    : `Ngày điều trị ${selectedDoc}`}
                            </div>
                            <div className="mt-0.5 flex items-center justify-center gap-1 text-[10px] text-ocean-100">
                                {docDate(selectedDoc) && (
                                    <>
                                        <Icons.calendar size={11} /> {docDate(selectedDoc)}
                                    </>
                                )}
                            </div>
                            <div className="mt-1.5 text-[9px] text-white/80">
                                {selectedTimes.size} cữ · {selectedCompleted}/
                                {selectedRows.length || selectedItems.length} hạng mục hoàn tất
                                {selectedIssues > 0 && (
                                    <span className="font-bold text-rose-200">
                                        {' '}
                                        · {selectedIssues} cần chú ý
                                    </span>
                                )}
                            </div>
                        </div>
                        <button
                            onClick={() => selectDoc(selectedDoc + 1)}
                            disabled={selectedDoc === maxDay}
                            aria-label="DOC tiếp theo"
                            className="grid size-9 shrink-0 place-items-center rounded-xl bg-white/10 transition active:scale-95 disabled:opacity-30"
                        >
                            <Icons.chevronR size={17} />
                        </button>
                    </div>
                </div>
            </div>

            <DocAuditCard
                key={selectedDoc}
                doc={selectedDoc}
                dateLabel={docDate(selectedDoc)}
                protocol={protocol}
                items={selectedItems}
                rows={selectedRows}
                hideHeader
            />
        </div>
    );
}

function StatusLegend({ color, label }: { color: string; label: string }) {
    return (
        <span className="inline-flex items-center gap-1">
            <span className={`size-1.5 rounded-full ${color}`} /> {label}
        </span>
    );
}

function DocAuditCard({
    doc,
    dateLabel,
    protocol,
    items,
    rows,
    hideHeader = false,
}: {
    doc: number;
    dateLabel: string | null;
    protocol: PendingProtocol;
    items: ProtocolItem[];
    rows: OwnerOperationOccurrence[];
    hideHeader?: boolean;
}) {
    const byTime = new Map<string, { items: ProtocolItem[]; rows: OwnerOperationOccurrence[] }>();

    items.forEach((item) => {
        const time = item.plannedTime ?? 'Chưa đặt giờ';
        const current = byTime.get(time) ?? { items: [], rows: [] };
        current.items.push(item);
        byTime.set(time, current);
    });
    rows.forEach((row) => {
        const time = fmtTime(row.scheduledAt);
        const current = byTime.get(time) ?? { items: [], rows: [] };
        current.rows.push(row);
        byTime.set(time, current);
    });

    const shifts = [...byTime.entries()].sort(([a], [b]) => a.localeCompare(b));
    const completed = rows.filter((row) => row.status === 'completed').length;
    const issues = rows.filter(
        (row) => row.status === 'cancelled' || row.status === 'generation_failed',
    ).length;

    return (
        <section className="overflow-hidden rounded-2xl border border-line bg-white shadow-[0_2px_10px_rgba(0,0,0,.05)]">
            {!hideHeader && (
                <div className="flex items-center justify-between bg-slate-50/80 px-4 py-3">
                    <div>
                        <div className="text-[13px] font-extrabold text-ink">
                            {protocol.protocolType === 'production'
                                ? `DOC ${doc}`
                                : `Ngày điều trị ${doc}`}
                        </div>
                        {dateLabel && (
                            <div className="mt-0.5 text-[10px] text-ink-muted">{dateLabel}</div>
                        )}
                    </div>
                    {shifts.length ? (
                        <div className="text-right">
                            <div className="text-[11px] font-bold text-ink">{shifts.length} cữ</div>
                            <div
                                className={`text-[9px] ${issues ? 'text-rose-500' : 'text-ink-muted'}`}
                            >
                                {completed} đã làm{issues ? ` · ${issues} cần chú ý` : ''}
                            </div>
                        </div>
                    ) : (
                        <Badge tone="slate">Ngày nghỉ</Badge>
                    )}
                </div>
            )}
            {shifts.length ? (
                <div className="space-y-3 p-3">
                    {shifts.map(([time, shift]) => (
                        <MergedShift
                            key={time}
                            time={time}
                            protocol={protocol}
                            items={shift.items}
                            rows={shift.rows}
                        />
                    ))}
                </div>
            ) : (
                <div className="px-4 py-7 text-center text-[11px] text-ink-muted">
                    Không có hoạt động theo phác đồ.
                </div>
            )}
        </section>
    );
}

function MergedShift({
    time,
    protocol,
    items,
    rows,
}: {
    time: string;
    protocol: PendingProtocol;
    items: ProtocolItem[];
    rows: OwnerOperationOccurrence[];
}) {
    const allCompleted = rows.length > 0 && rows.every((row) => row.status === 'completed');
    const allPlanned = rows.length > 0 && rows.every((row) => row.status === 'planned');
    const allCancelled = rows.length > 0 && rows.every((row) => row.status === 'cancelled');
    const hasFailure = rows.some((row) => row.status === 'generation_failed');
    const partial = rows.length > 0 && !allCompleted && !allPlanned && !allCancelled && !hasFailure;
    const state = hasFailure
        ? { label: 'Lỗi sinh lịch', tone: 'rose' as const }
        : allCompleted
          ? { label: 'Đã hoàn thành', tone: 'teal' as const }
          : allCancelled
            ? { label: 'Đã hủy', tone: 'slate' as const }
            : allPlanned
              ? { label: 'Đã lên lịch', tone: 'ocean' as const }
              : partial
                ? { label: 'Một phần', tone: 'amber' as const }
                : protocol.status === 'pending_approval'
                  ? { label: 'Chờ duyệt', tone: 'amber' as const }
                  : { label: 'Chưa sinh lịch', tone: 'slate' as const };

    const keys = new Set([
        ...items.map((item) => item.id),
        ...rows.map((row) => row.protocolItemId),
    ]);

    return (
        <div className="overflow-hidden rounded-xl border border-line">
            <div className="flex items-center justify-between gap-2 bg-slate-50 px-3 py-2.5">
                <div>
                    <div className="flex items-center gap-1.5 font-mono text-[15px] font-extrabold text-ink">
                        <Icons.clock size={14} className="text-ocean-600" /> {time}
                    </div>
                    <div className="mt-0.5 text-[9px] text-ink-muted">
                        {keys.size > 1 ? `Kết hợp ${keys.size} sản phẩm` : '1 sản phẩm'}
                    </div>
                </div>
                <Badge tone={state.tone} dot={allPlanned}>
                    {state.label}
                </Badge>
            </div>
            <div className="divide-y divide-line-soft">
                {[...keys].map((key) => (
                    <AuditProductRow
                        key={key}
                        item={items.find((item) => item.id === key)}
                        row={rows.find((row) => row.protocolItemId === key)}
                        protocolStatus={protocol.status}
                    />
                ))}
            </div>
        </div>
    );
}

function AuditProductRow({
    item,
    row,
    protocolStatus,
}: {
    item?: ProtocolItem;
    row?: OwnerOperationOccurrence;
    protocolStatus: PendingProtocol['status'];
}) {
    const nav = useNav();
    const operationType = row?.operationType ?? item?.operationType ?? 'other';
    const meta = opTypeMeta[operationType];
    const Icon = Icons[meta.icon];
    const productName =
        row?.execution?.actualProductName ??
        row?.productName ??
        item?.productName ??
        'Chưa xác định sản phẩm';
    const plannedQuantity = row?.plannedQuantity;
    const actualQuantity = row?.execution?.actualQuantity;
    const sourceHealth = row?.sourceHealthLogId
        ? latestHealthLogs.find((log) => log.id === row.sourceHealthLogId)
        : undefined;
    const variance =
        plannedQuantity && actualQuantity != null
            ? ((actualQuantity - plannedQuantity) / plannedQuantity) * 100
            : null;
    const executionId = row?.execution?.id;
    const executionTransactions = executionId
        ? inventoryTransactions.filter(
              (transaction) =>
                  transaction.transactionType === 'stock_out' &&
                  transaction.referenceType === 'operation_execution' &&
                  transaction.referenceId === executionId,
          )
        : [];
    const season = row ? ownerSeasons.find((item) => item.id === row.seasonId) : undefined;

    return (
        <div className="p-3">
            <div className="flex gap-2.5">
                <span
                    className={`grid size-8 shrink-0 place-items-center rounded-lg ${meta.tone === 'rose' ? 'bg-rose-50 text-rose-500' : meta.tone === 'teal' ? 'bg-teal-50 text-teal-500' : meta.tone === 'ocean' ? 'bg-ocean-50 text-ocean-600' : 'bg-violet-50 text-violet-500'}`}
                >
                    <Icon size={14} />
                </span>
                <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                        <div className="text-[12px] font-bold leading-snug text-ink">
                            {productName}
                        </div>
                    </div>
                    {row?.execution?.actualProductName &&
                        row.execution.actualProductName !== row.productName && (
                            <div className="mt-0.5 text-[9px] text-ink-muted">
                                Sản phẩm kế hoạch: {row.productName}
                            </div>
                        )}

                    <div className="mt-2 grid grid-cols-2 gap-2">
                        <div className="rounded-lg bg-slate-50 px-2.5 py-2">
                            <div className="text-[9px] uppercase tracking-wide text-ink-muted">
                                Kế hoạch
                            </div>
                            <div className="mt-0.5 font-mono text-[12px] font-bold text-ink">
                                {plannedQuantity != null
                                    ? `${plannedQuantity.toLocaleString('vi-VN')} ${row?.unit}`
                                    : item
                                      ? doseDisplay(item)
                                      : '—'}
                            </div>
                        </div>
                        <div
                            className={`rounded-lg px-2.5 py-2 ${actualQuantity != null ? 'bg-teal-50 ring-1 ring-teal-100' : 'bg-slate-50'}`}
                        >
                            <div className="text-[9px] uppercase tracking-wide text-ink-muted">
                                KTV thực sự dùng
                            </div>
                            <div
                                className={`mt-0.5 font-mono text-[13px] font-extrabold ${actualQuantity != null ? 'text-teal-700' : 'text-ink-muted'}`}
                            >
                                {actualQuantity != null
                                    ? `${actualQuantity.toLocaleString('vi-VN')} ${row?.unit}`
                                    : 'Chưa có'}
                            </div>
                        </div>
                    </div>

                    {variance != null && Math.abs(variance) > 0.05 && (
                        <div
                            className={`mt-1 text-right text-[9px] font-bold ${Math.abs(variance) > 10 ? 'text-rose-500' : 'text-amber-600'}`}
                        >
                            Chênh lệch {variance > 0 ? '+' : ''}
                            {variance.toFixed(1)}%
                        </div>
                    )}
                    {row?.basisQuantity != null && (
                        <div className="mt-2 text-[9px] text-ink-muted">
                            Cơ sở tính:{' '}
                            <b className="text-ink-soft">
                                {row.basisQuantity.toLocaleString('vi-VN')}{' '}
                                {row.basisUnit === 'kg_biomass' ? 'kg sinh khối' : 'm³ nước'}
                            </b>
                        </div>
                    )}
                    {sourceHealth && (
                        <div className="mt-1.5 rounded-lg bg-ocean-50 px-2.5 py-2 text-[9px] leading-relaxed text-ocean-700">
                            Nguồn sinh khối <b>{sourceHealth.id}</b> ·{' '}
                            {sourceHealth.estimatedBiomassKg?.toLocaleString('vi-VN') ?? '—'} kg ·{' '}
                            {sourceHealth.recordedByName} · {fmtDateTime(sourceHealth.recordedAt)}
                        </div>
                    )}
                </div>
            </div>

            {row?.execution?.note && (
                <ReasonBox tone="slate" title="Ghi chú của KTV">
                    {row.execution.note}
                </ReasonBox>
            )}
            {row?.execution?.varianceReason && (
                <ReasonBox tone="amber" title="Lý do điều chỉnh lượng dùng">
                    {row.execution.varianceReason}
                </ReasonBox>
            )}
            {row?.cancellation && (
                <ReasonBox tone="rose" title="Lý do không thực hiện">
                    {row.cancellation.reason}
                    <span className="mt-1 block text-[9px] opacity-75">
                        {row.cancellation.cancelledBy} · {fmtDateTime(row.cancellation.cancelledAt)}
                    </span>
                </ReasonBox>
            )}
            {row?.generationError && (
                <ReasonBox tone="rose" title="Lỗi sinh lịch">
                    {row.generationError}
                </ReasonBox>
            )}
            {row?.execution && (
                <div className="mt-2 flex items-center justify-between rounded-lg bg-teal-50 px-2.5 py-2 text-[9px] text-teal-700">
                    <span>
                        Chịu trách nhiệm: <b>{row.execution.executedBy}</b>
                    </span>
                    <span>{fmtDateTime(row.execution.executedAt)}</span>
                </div>
            )}
            {row?.execution && season && (
                <button
                    type="button"
                    onClick={() =>
                        nav.go('owner-stock-history', {
                            farmId: season.farmId,
                            referenceType: 'operation_execution',
                            referenceId: row.execution!.id,
                        })
                    }
                    className={`mt-2 flex w-full items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-[10px] font-bold transition active:scale-[0.99] ${executionTransactions.length > 0 ? 'border-ocean-100 bg-ocean-50 text-ocean-700' : 'border-line bg-slate-50 text-ink-soft'}`}
                >
                    <Icons.clock size={13} />
                    {executionTransactions.length > 0
                        ? `Truy vết ${executionTransactions.length} giao dịch kho`
                        : 'Kiểm tra giao dịch kho'}
                </button>
            )}
            {item?.instructions && (
                <p className="mt-2 text-[10px] leading-relaxed text-ink-muted">
                    {item.instructions}
                </p>
            )}
        </div>
    );
}

function TechnicalScopeAudit() {
    const supported = [
        'Lịch 90 ngày, nhiều cữ/ngày và gộp sản phẩm cùng thời điểm',
        'Liều cố định, theo sinh khối hoặc theo thể tích nước',
        'Đối chiếu kế hoạch–thực tế, người làm, thời gian, note và lý do',
        'Giữ lịch sử cữ hoàn thành khi phác đồ bị thay thế',
    ];
    const gaps = [
        'Chưa có dose basis theo kg thức ăn cho men/Beta-glucan',
        'Chưa có thời gian ngừng thuốc trước thu hoạch',
        'Chưa quản lý checklist, minh chứng và đánh giá chứng nhận VietGAP',
        'Chưa biểu diễn quy tắc tăng liều hằng ngày hoặc điều kiện theo DO/thời tiết',
    ];
    return (
        <div className="rounded-2xl border border-violet-200 bg-violet-50 p-4">
            <div className="flex items-start gap-2.5">
                <Icons.protocol size={18} className="mt-0.5 shrink-0 text-violet-600" />
                <div>
                    <div className="text-[13px] font-bold text-violet-800">
                        Đối chiếu mô hình kỹ thuật Việt Nam
                    </div>
                    <p className="mt-1 text-[10px] leading-relaxed text-violet-700">
                        VietGAP quy định quản lý an toàn và truy xuất, không ấn định một thực đơn 90
                        ngày. Phác đồ mẫu dùng lịch cữ của tài liệu Khuyến nông làm tham chiếu kỹ
                        thuật.
                    </p>
                </div>
            </div>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl bg-white/80 p-3">
                    <div className="mb-2 text-[10px] font-bold uppercase tracking-wide text-teal-700">
                        Đồ án đã hỗ trợ
                    </div>
                    <div className="space-y-1.5">
                        {supported.map((text) => (
                            <div
                                key={text}
                                className="flex gap-1.5 text-[10px] leading-relaxed text-ink-soft"
                            >
                                <Icons.check size={12} className="mt-0.5 shrink-0 text-teal-600" />
                                {text}
                            </div>
                        ))}
                    </div>
                </div>
                <div className="rounded-xl bg-white/80 p-3">
                    <div className="mb-2 text-[10px] font-bold uppercase tracking-wide text-rose-600">
                        Còn thiếu để đầy đủ
                    </div>
                    <div className="space-y-1.5">
                        {gaps.map((text) => (
                            <div
                                key={text}
                                className="flex gap-1.5 text-[10px] leading-relaxed text-ink-soft"
                            >
                                <Icons.x size={12} className="mt-0.5 shrink-0 text-rose-500" />
                                {text}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

function ProtocolPlan({ protocol, initialDay }: { protocol: PendingProtocol; initialDay: number }) {
    const maxDay = Math.max(...protocol.items.map((item) => item.endDayOffset + 1), 1);
    const [selectedDay, setSelectedDay] = useState(initialDay);
    const isTreatment = protocol.protocolType === 'treatment';
    const dayItems = protocol.items.filter((item) => {
        const offset = selectedDay - 1;
        return (
            offset >= item.startDayOffset &&
            offset <= item.endDayOffset &&
            (offset - item.startDayOffset) % item.repeatIntervalDays === 0
        );
    });
    const shifts = groupPlanItems(dayItems);
    const rules = compactRules(protocol.items);

    return (
        <div className="space-y-4">
            <div>
                <div className="mb-2 flex items-end justify-between px-1">
                    <div>
                        <h2 className="font-display text-[15px] font-bold text-ink">
                            Lịch chính xác theo ngày
                        </h2>
                        <p className="mt-0.5 text-[10px] text-ink-muted">
                            Chọn ngày bất kỳ để xem từng cữ và sản phẩm dùng cùng lúc.
                        </p>
                    </div>
                    <Badge tone="ocean">{maxDay} ngày</Badge>
                </div>
                <div className="scroll-clean flex gap-2 overflow-x-auto pb-2">
                    {Array.from({ length: maxDay }, (_, index) => index + 1).map((day) => (
                        <button
                            key={day}
                            onClick={() => setSelectedDay(day)}
                            className={`shrink-0 rounded-xl px-3 py-2 text-center transition ${
                                selectedDay === day
                                    ? 'bg-ocean-600 text-white shadow-sm'
                                    : 'border border-line bg-white text-ink-soft'
                            }`}
                        >
                            <div className="text-[9px] font-semibold uppercase opacity-75">
                                {isTreatment ? 'Ngày' : 'DOC'}
                            </div>
                            <div className="text-[14px] font-bold">{day}</div>
                        </button>
                    ))}
                </div>
            </div>

            <div className="rounded-2xl border border-line bg-white p-3.5">
                <div className="mb-3 flex items-center justify-between">
                    <div>
                        <div className="text-[13px] font-bold text-ink">
                            {isTreatment ? `Ngày điều trị ${selectedDay}` : `DOC ${selectedDay}`}
                        </div>
                        <div className="text-[10px] text-ink-muted">
                            {dayItems.length} sản phẩm · {shifts.length} thời điểm
                        </div>
                    </div>
                    <Badge tone={dayItems.length ? 'teal' : 'slate'}>
                        {dayItems.length ? 'Có lịch' : 'Ngày nghỉ'}
                    </Badge>
                </div>
                {shifts.length ? (
                    <div className="space-y-2.5">
                        {shifts.map((shift) => (
                            <PlanShift key={shift.time} time={shift.time} items={shift.items} />
                        ))}
                    </div>
                ) : (
                    <div className="rounded-xl bg-slate-50 py-7 text-center text-[12px] text-ink-muted">
                        Không có hoạt động theo phác đồ trong ngày này.
                    </div>
                )}
            </div>

            <div>
                <div className="mb-2 px-1">
                    <h2 className="font-display text-[15px] font-bold text-ink">
                        Quy tắc xuyên suốt
                    </h2>
                    <p className="mt-0.5 text-[10px] text-ink-muted">
                        Tóm gọn toàn bộ thời gian áp dụng đến cuối phác đồ.
                    </p>
                </div>
                <div className="space-y-2.5">
                    {rules.map((rule) => {
                        const meta = opTypeMeta[rule.item.operationType];
                        return (
                            <div
                                key={rule.key}
                                className="rounded-2xl bg-white p-3.5 shadow-[0_1px_7px_rgba(0,0,0,.05)]"
                            >
                                <div className="flex items-start justify-between gap-2">
                                    <div className="min-w-0">
                                        <Badge tone={meta.tone}>{meta.label}</Badge>
                                        <div className="mt-1.5 text-[13px] font-bold leading-snug text-ink">
                                            {rule.item.productName}
                                        </div>
                                    </div>
                                    <div className="shrink-0 rounded-lg bg-slate-50 px-2 py-1 text-right text-[10px] font-semibold text-ink-soft">
                                        {isTreatment ? 'Ngày' : 'DOC'}{' '}
                                        {rule.item.startDayOffset + 1}–{rule.item.endDayOffset + 1}
                                    </div>
                                </div>
                                <div className="mt-2 grid grid-cols-2 gap-2 text-[11px]">
                                    <div>
                                        <span className="text-ink-muted">Thời điểm</span>
                                        <div className="font-bold text-ink">
                                            {rule.times.join(' · ') || 'Theo hướng dẫn'}
                                        </div>
                                    </div>
                                    <div>
                                        <span className="text-ink-muted">Liều mỗi lần</span>
                                        <div className="font-bold text-ink">
                                            {doseDisplay(rule.item)}
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-2 flex items-center justify-between border-t border-line-soft pt-2 text-[10px] text-ink-muted">
                                    <span>{doseBasisLabel[rule.item.doseBasis]}</span>
                                    <span>
                                        {rule.item.repeatIntervalDays === 1
                                            ? 'Mỗi ngày'
                                            : `Mỗi ${rule.item.repeatIntervalDays} ngày`}
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

function groupPlanItems(items: ProtocolItem[]) {
    const map = new Map<string, ProtocolItem[]>();
    items.forEach((item) => {
        const key = item.plannedTime ?? 'Theo hướng dẫn';
        map.set(key, [...(map.get(key) ?? []), item]);
    });
    return [...map.entries()]
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([time, grouped]) => ({ time, items: grouped }));
}

function compactRules(items: ProtocolItem[]) {
    const map = new Map<
        string,
        {
            key: string;
            item: ProtocolItem;
            times: string[];
        }
    >();
    items.forEach((item) => {
        const key = [
            item.operationType,
            item.productName,
            item.startDayOffset,
            item.endDayOffset,
            item.repeatIntervalDays,
            item.doseBasis,
            item.doseValue,
            item.doseUnit,
        ].join('|');
        const current = map.get(key);
        if (current) {
            if (item.plannedTime && !current.times.includes(item.plannedTime))
                current.times.push(item.plannedTime);
        } else
            map.set(key, {
                key,
                item,
                times: item.plannedTime ? [item.plannedTime] : [],
            });
    });
    return [...map.values()].map((rule) => ({
        ...rule,
        times: rule.times.sort(),
    }));
}

function PlanShift({ time, items }: { time: string; items: ProtocolItem[] }) {
    return (
        <div className="overflow-hidden rounded-xl border border-line">
            <div className="flex items-center justify-between bg-slate-50 px-3 py-2">
                <div className="flex items-center gap-1.5 text-[13px] font-bold text-ink">
                    <Icons.clock size={14} className="text-ocean-600" />
                    {time}
                </div>
                <span className="text-[10px] font-semibold text-ink-muted">
                    {items.length > 1
                        ? `Kết hợp ${items.length} sản phẩm`
                        : items[0]?.mealNumber
                          ? `Cữ ${items[0].mealNumber}`
                          : '1 hoạt động'}
                </span>
            </div>
            <div className="divide-y divide-line-soft">
                {items.map((item) => {
                    const meta = opTypeMeta[item.operationType];
                    const Icon = Icons[meta.icon];
                    return (
                        <div key={item.id} className="flex gap-2.5 px-3 py-2.5">
                            <span
                                className={`grid size-8 shrink-0 place-items-center rounded-lg ${
                                    meta.tone === 'rose'
                                        ? 'bg-rose-50 text-rose-500'
                                        : meta.tone === 'teal'
                                          ? 'bg-teal-50 text-teal-500'
                                          : meta.tone === 'ocean'
                                            ? 'bg-ocean-50 text-ocean-600'
                                            : 'bg-violet-50 text-violet-500'
                                }`}
                            >
                                <Icon size={14} />
                            </span>
                            <div className="min-w-0 flex-1">
                                <div className="text-[12px] font-bold text-ink">
                                    {item.productName}
                                </div>
                                <div className="mt-0.5 text-[11px] font-semibold text-ocean-700">
                                    {doseDisplay(item)}
                                </div>
                                {item.instructions && (
                                    <p className="mt-1 text-[10px] leading-relaxed text-ink-muted">
                                        {item.instructions}
                                    </p>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

function NoScheduleYet({ protocol }: { protocol: PendingProtocol }) {
    const pending = protocol.status === 'pending_approval';
    return (
        <div className="rounded-2xl border border-dashed border-line bg-white p-5 text-center">
            <span className="mx-auto grid size-11 place-items-center rounded-xl bg-amber-50 text-amber-600">
                <Icons.calendar size={20} />
            </span>
            <div className="mt-3 text-[14px] font-bold text-ink">
                {pending ? 'Chưa sinh lịch trước khi duyệt' : 'Chưa có cữ vận hành được sinh'}
            </div>
            <p className="mx-auto mt-1 max-w-[300px] text-[11px] leading-relaxed text-ink-muted">
                {pending
                    ? 'Sau khi Chủ trại duyệt, hệ thống mới neo ngày bắt đầu và sinh lịch 3–7 ngày gần nhất. Phác đồ toàn kỳ vẫn xem được ở tab bên cạnh.'
                    : 'Worker sẽ sinh lịch theo cửa sổ cuốn. Nếu thiếu dữ liệu sinh khối, hệ thống báo lỗi thay vì tự đoán liều.'}
            </p>
        </div>
    );
}

type ScheduleFilter = 'all' | 'completed' | 'planned' | 'issue';

function OperationTimeline({
    occurrences,
    showProtocol = false,
}: {
    occurrences: OwnerOperationOccurrence[];
    showProtocol?: boolean;
}) {
    const [filter, setFilter] = useState<ScheduleFilter>('all');
    const filtered = occurrences.filter(
        (item) =>
            filter === 'all' ||
            (filter === 'issue'
                ? item.status === 'cancelled' || item.status === 'generation_failed'
                : item.status === filter),
    );
    const days = useMemo(() => {
        const map = new Map<string, OwnerOperationOccurrence[]>();
        filtered.forEach((item) => {
            const key = item.scheduledAt.slice(0, 10);
            map.set(key, [...(map.get(key) ?? []), item]);
        });
        return [...map.entries()].sort(([a], [b]) => b.localeCompare(a));
    }, [filtered]);
    const counts = {
        completed: occurrences.filter((item) => item.status === 'completed').length,
        planned: occurrences.filter((item) => item.status === 'planned').length,
        issue: occurrences.filter(
            (item) => item.status === 'cancelled' || item.status === 'generation_failed',
        ).length,
    };

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-3 gap-2">
                <TimelineStat label="Đã làm" value={counts.completed} tone="teal" />
                <TimelineStat label="Đã lên lịch" value={counts.planned} tone="ocean" />
                <TimelineStat
                    label="Hủy / lỗi"
                    value={counts.issue}
                    tone={counts.issue ? 'rose' : 'slate'}
                />
            </div>
            <div className="scroll-clean flex gap-2 overflow-x-auto">
                {(['all', 'completed', 'planned', 'issue'] as const).map((value) => (
                    <button
                        key={value}
                        onClick={() => setFilter(value)}
                        className={`shrink-0 rounded-full px-3 py-1.5 text-[11px] font-semibold ${
                            filter === value
                                ? 'bg-ink text-white'
                                : 'border border-line bg-white text-ink-muted'
                        }`}
                    >
                        {value === 'all'
                            ? 'Tất cả'
                            : value === 'completed'
                              ? 'Đã thực hiện'
                              : value === 'planned'
                                ? 'Sắp tới'
                                : 'Hủy & lỗi sinh lịch'}
                    </button>
                ))}
            </div>
            {days.length ? (
                days.map(([date, rows]) => {
                    const byTime = new Map<string, OwnerOperationOccurrence[]>();
                    rows.forEach((row) =>
                        byTime.set(row.scheduledAt, [...(byTime.get(row.scheduledAt) ?? []), row]),
                    );
                    return (
                        <div key={date}>
                            <div className="mb-2 flex items-center gap-2">
                                <span className="h-px flex-1 bg-line" />
                                <span className="rounded-full border border-line bg-white px-3 py-1 text-[10px] font-bold text-ink-soft">
                                    {new Date(`${date}T00:00:00`).toLocaleDateString('vi-VN', {
                                        weekday: 'short',
                                        day: '2-digit',
                                        month: '2-digit',
                                        year: 'numeric',
                                    })}
                                </span>
                                <span className="h-px flex-1 bg-line" />
                            </div>
                            <div className="space-y-2.5">
                                {[...byTime.values()]
                                    .sort((a, b) =>
                                        b[0].scheduledAt.localeCompare(a[0].scheduledAt),
                                    )
                                    .map((shift) => (
                                        <OperationShift
                                            key={shift[0].scheduledAt}
                                            rows={shift}
                                            showProtocol={showProtocol}
                                        />
                                    ))}
                            </div>
                        </div>
                    );
                })
            ) : (
                <EmptyState
                    icon={Icons.calendar}
                    title="Không có dữ liệu phù hợp"
                    hint="Thử chọn một trạng thái khác."
                />
            )}
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-[10px] leading-relaxed text-ink-muted">
                <span className="font-bold text-ink-soft">Cách đọc:</span> mỗi sản phẩm vẫn được lưu
                và đối chiếu riêng. Màn hình gom các sản phẩm có cùng thời điểm để phản ánh đúng một
                cữ KTV thực hiện ngoài ao.
            </div>
        </div>
    );
}

function TimelineStat({ label, value, tone }: { label: string; value: number; tone: Tone }) {
    const color =
        tone === 'teal'
            ? 'text-teal-500'
            : tone === 'ocean'
              ? 'text-ocean-600'
              : tone === 'rose'
                ? 'text-rose-500'
                : 'text-slate-500';
    return (
        <div className="rounded-xl bg-white p-3 text-center shadow-[0_1px_6px_rgba(0,0,0,.05)]">
            <div className={`text-[20px] font-extrabold ${color}`}>{value}</div>
            <div className="text-[9px] font-semibold text-ink-muted">{label}</div>
        </div>
    );
}

function OperationShift({
    rows,
    showProtocol,
}: {
    rows: OwnerOperationOccurrence[];
    showProtocol: boolean;
}) {
    const status = rows.some((item) => item.status === 'generation_failed')
        ? 'generation_failed'
        : rows.every((item) => item.status === 'completed')
          ? 'completed'
          : rows.every((item) => item.status === 'cancelled')
            ? 'cancelled'
            : 'planned';
    const statusMeta: Record<string, { label: string; tone: Tone }> = {
        completed: { label: 'Đã thực hiện', tone: 'teal' },
        planned: { label: 'Đã lên lịch', tone: 'ocean' },
        cancelled: { label: 'Đã hủy', tone: 'slate' },
        generation_failed: { label: 'Chưa sinh được lịch', tone: 'rose' },
    };
    const meta = statusMeta[status];
    const firstExecution = rows.find((item) => item.execution)?.execution;
    const protocol = allSeasonProtocols.find((item) => item.id === rows[0].protocolId);
    return (
        <div
            className={`overflow-hidden rounded-2xl border bg-white shadow-[0_2px_10px_rgba(0,0,0,.05)] ${
                status === 'generation_failed'
                    ? 'border-rose-200'
                    : status === 'completed'
                      ? 'border-teal-100'
                      : 'border-line'
            }`}
        >
            <div className="flex items-start justify-between gap-3 bg-slate-50/80 px-3.5 py-3">
                <div>
                    <div className="flex items-center gap-2">
                        <span className="font-mono text-[17px] font-extrabold text-ink">
                            {fmtTime(rows[0].scheduledAt)}
                        </span>
                        {rows[0].mealNumber && (
                            <span className="text-[10px] font-semibold text-ink-muted">
                                Cữ {rows[0].mealNumber}
                            </span>
                        )}
                    </div>
                    <div className="mt-0.5 text-[10px] text-ink-muted">
                        {rows.length > 1 ? `${rows.length} sản phẩm cùng thời điểm` : '1 hoạt động'}
                    </div>
                    {showProtocol && protocol && (
                        <div className="mt-1 text-[10px] font-semibold text-violet-600">
                            {protocol.protocolType === 'treatment' ? 'Điều trị' : 'Nuôi'} v
                            {protocol.versionNo}
                        </div>
                    )}
                </div>
                <Badge tone={meta.tone} dot={status === 'planned'}>
                    {meta.label}
                </Badge>
            </div>
            <div className="divide-y divide-line-soft">
                {rows.map((row) => (
                    <OperationProductRow key={row.id} row={row} />
                ))}
            </div>
            {firstExecution && (
                <div className="flex items-center justify-between border-t border-line bg-teal-50/60 px-3.5 py-2 text-[10px] text-teal-700">
                    <span>
                        KTV: <b>{firstExecution.executedBy}</b>
                    </span>
                    <span>{fmtDateTime(firstExecution.executedAt)}</span>
                </div>
            )}
        </div>
    );
}

function OperationProductRow({ row }: { row: OwnerOperationOccurrence }) {
    const meta = opTypeMeta[row.operationType];
    const Icon = Icons[meta.icon];
    const variance =
        row.execution && row.plannedQuantity
            ? ((row.execution.actualQuantity - row.plannedQuantity) / row.plannedQuantity) * 100
            : null;
    const basis =
        row.basisQuantity != null
            ? `${row.basisQuantity.toLocaleString('vi-VN')} ${
                  row.basisUnit === 'kg_biomass' ? 'kg sinh khối' : 'm³ nước'
              }`
            : null;
    const sourceHealth = row.sourceHealthLogId
        ? latestHealthLogs.find((log) => log.id === row.sourceHealthLogId)
        : undefined;
    return (
        <div className="p-3.5">
            <div className="flex gap-2.5">
                <span
                    className={`grid size-8 shrink-0 place-items-center rounded-lg ${
                        meta.tone === 'rose'
                            ? 'bg-rose-50 text-rose-500'
                            : meta.tone === 'teal'
                              ? 'bg-teal-50 text-teal-500'
                              : meta.tone === 'ocean'
                                ? 'bg-ocean-50 text-ocean-600'
                                : 'bg-violet-50 text-violet-500'
                    }`}
                >
                    <Icon size={14} />
                </span>
                <div className="min-w-0 flex-1">
                    <div className="text-[12px] font-bold leading-snug text-ink">
                        {row.execution?.actualProductName ?? row.productName}
                    </div>
                    {row.execution?.actualProductName &&
                        row.execution.actualProductName !== row.productName && (
                            <div className="mt-0.5 text-[9px] text-ink-muted">
                                Kế hoạch: {row.productName}
                            </div>
                        )}
                    <div className="mt-2 grid grid-cols-2 gap-2">
                        <div className="rounded-lg bg-slate-50 px-2.5 py-2">
                            <div className="text-[9px] uppercase tracking-wide text-ink-muted">
                                Kế hoạch
                            </div>
                            <div className="font-mono text-[12px] font-bold text-ink">
                                {row.plannedQuantity != null
                                    ? `${row.plannedQuantity.toLocaleString('vi-VN')} ${row.unit}`
                                    : 'Chưa tính được'}
                            </div>
                        </div>
                        <div
                            className={`rounded-lg px-2.5 py-2 ${
                                row.execution ? 'bg-teal-50' : 'bg-slate-50'
                            }`}
                        >
                            <div className="text-[9px] uppercase tracking-wide text-ink-muted">
                                Thực tế
                            </div>
                            <div
                                className={`font-mono text-[12px] font-bold ${
                                    row.execution ? 'text-teal-700' : 'text-ink-muted'
                                }`}
                            >
                                {row.execution
                                    ? `${row.execution.actualQuantity.toLocaleString('vi-VN')} ${row.unit}`
                                    : '—'}
                            </div>
                        </div>
                    </div>
                    {variance != null && Math.abs(variance) > 0.05 && (
                        <div
                            className={`mt-1 text-right text-[9px] font-semibold ${
                                Math.abs(variance) > 10 ? 'text-rose-500' : 'text-amber-600'
                            }`}
                        >
                            Chênh lệch {variance > 0 ? '+' : ''}
                            {variance.toFixed(1)}%
                        </div>
                    )}
                    {basis && (
                        <div className="mt-2 text-[9px] text-ink-muted">
                            Cơ sở tính: <b className="text-ink-soft">{basis}</b> ·{' '}
                            {doseBasisLabel[row.doseBasis]}
                        </div>
                    )}
                    {sourceHealth && (
                        <div className="mt-1.5 rounded-lg bg-ocean-50 px-2.5 py-2 text-[9px] leading-relaxed text-ocean-700">
                            Nguồn sinh khối <b>{sourceHealth.id}</b> · {sourceHealth.recordedByName}{' '}
                            · {fmtDateTime(sourceHealth.recordedAt)}
                        </div>
                    )}
                </div>
            </div>
            {row.execution?.varianceReason && (
                <ReasonBox tone="amber" title="Lý do điều chỉnh thực tế">
                    {row.execution.varianceReason}
                </ReasonBox>
            )}
            {row.execution?.note && (
                <ReasonBox tone="slate" title="Ghi chú KTV">
                    {row.execution.note}
                </ReasonBox>
            )}
            {row.cancellation && (
                <ReasonBox tone="slate" title="Lý do hủy">
                    {row.cancellation.reason}
                    <span className="mt-1 block text-[9px] opacity-75">
                        {row.cancellation.cancelledBy} · {fmtDateTime(row.cancellation.cancelledAt)}
                    </span>
                </ReasonBox>
            )}
            {row.generationError && (
                <ReasonBox tone="rose" title="Lỗi sinh lịch — không tự đoán liều">
                    {row.generationError}
                </ReasonBox>
            )}
            {row.instructions && row.status === 'planned' && (
                <p className="mt-2 text-[10px] leading-relaxed text-ink-muted">
                    {row.instructions}
                </p>
            )}
        </div>
    );
}

function ReasonBox({
    tone,
    title,
    children,
}: {
    tone: 'amber' | 'rose' | 'slate';
    title: string;
    children: ReactNode;
}) {
    const cls =
        tone === 'amber'
            ? 'border-amber-100 bg-amber-50 text-amber-700'
            : tone === 'rose'
              ? 'border-rose-100 bg-rose-50 text-rose-700'
              : 'border-slate-200 bg-slate-50 text-ink-soft';
    return (
        <div className={`mt-2 rounded-lg border px-2.5 py-2 text-[10px] leading-relaxed ${cls}`}>
            <div className="mb-0.5 font-bold">{title}</div>
            {children}
        </div>
    );
}

function ProtocolAudit({ protocol }: { protocol: PendingProtocol }) {
    const isTreatment = protocol.protocolType === 'treatment';
    return (
        <div className="rounded-2xl border border-line bg-white p-4">
            <div className="mb-2 text-[12px] font-bold text-ink">Nguồn gốc & mốc thời gian</div>
            <div className="space-y-2 text-[11px]">
                <AuditRow label="Chuyên gia soạn" value={protocol.createdBy} />
                <AuditRow label="Gửi duyệt" value={fmtDateTime(protocol.submittedAt)} />
                <AuditRow
                    label="Mốc tính ngày"
                    value={isTreatment ? 'Ngày Chủ trại phê duyệt' : 'Ngày thả giống của vụ'}
                />
                {protocol.reviewedAt && (
                    <AuditRow
                        label="Đã duyệt"
                        value={`${protocol.reviewedBy ?? 'Chủ trại'} · ${fmtDateTime(protocol.reviewedAt)}`}
                    />
                )}
                {protocol.supersededAt && (
                    <AuditRow label="Đã thay thế lúc" value={fmtDateTime(protocol.supersededAt)} />
                )}
                {protocol.abortedAt && (
                    <AuditRow
                        label="Dừng điều trị"
                        value={`${protocol.abortedBy ?? '—'} · ${fmtDateTime(protocol.abortedAt)}`}
                    />
                )}
            </div>
            {protocol.rejectionReason && (
                <ReasonBox tone="rose" title="Lý do từ chối">
                    {protocol.rejectionReason}
                </ReasonBox>
            )}
            {protocol.abortReason && (
                <ReasonBox tone="rose" title="Lý do dừng khẩn cấp">
                    {protocol.abortReason}
                </ReasonBox>
            )}
            {protocol.statusHistory && protocol.statusHistory.length > 0 && (
                <div className="mt-3 border-t border-line-soft pt-3">
                    <div className="mb-2 text-[10px] font-bold uppercase tracking-wide text-ink-muted">
                        Lịch sử trạng thái
                    </div>
                    <div className="space-y-2">
                        {protocol.statusHistory.map((entry) => {
                            const to = protocolStatusMeta[entry.toStatus];
                            return (
                                <div key={entry.id} className="rounded-xl bg-slate-50 px-3 py-2.5">
                                    <div className="flex flex-wrap items-center gap-1.5">
                                        {entry.fromStatus && (
                                            <Badge tone={protocolStatusMeta[entry.fromStatus].tone}>
                                                {protocolStatusMeta[entry.fromStatus].label}
                                            </Badge>
                                        )}
                                        {entry.fromStatus && (
                                            <Icons.chevronR size={13} className="text-ink-muted" />
                                        )}
                                        <Badge tone={to.tone} dot>
                                            {to.label}
                                        </Badge>
                                    </div>
                                    {entry.reason && (
                                        <p className="mt-1.5 text-[10px] leading-relaxed text-ink-soft">
                                            {entry.reason}
                                        </p>
                                    )}
                                    <div className="mt-1.5 text-[9px] text-ink-muted">
                                        {entry.changedBy} · {fmtDateTime(entry.changedAt)}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}

function AuditRow({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex items-start justify-between gap-3">
            <span className="text-ink-muted">{label}</span>
            <span className="text-right font-semibold text-ink">{value}</span>
        </div>
    );
}

function ReviewDecision({
    protocol,
    onChanged,
}: {
    protocol: PendingProtocol;
    onChanged: () => void;
}) {
    const nav = useNav();
    const [action, setAction] = useState<'idle' | 'approve' | 'reject'>('idle');
    const [reason, setReason] = useState('');
    const [error, setError] = useState('');
    const [saving, setSaving] = useState(false);
    const missingProductCount = inventoryRowsForProtocol(protocol).filter(
        (row) => !row.product,
    ).length;
    const reviewContextIsValid = () => {
        const season = ownerSeasons.find((item) => item.id === protocol.seasonId);
        return (
            protocol.status === 'pending_approval' &&
            (season?.status === 'planning' || season?.status === 'active')
        );
    };
    const approve = () => {
        if (!reviewContextIsValid()) {
            nav.toast(
                'Trạng thái vụ nuôi hoặc phác đồ đã thay đổi. Không thể phê duyệt.',
                'warning',
            );
            onChanged();
            return;
        }
        if (missingProductCount > 0) {
            setError(
                `Còn ${missingProductCount} vật tư chưa liên kết. Hãy hoàn tất đối chiếu kho trước khi duyệt.`,
            );
            return;
        }
        setSaving(true);
        window.setTimeout(() => {
            protocol.status = 'approved';
            protocol.reviewedAt = new Date().toISOString();
            protocol.reviewedBy = currentUser.name;
            protocol.statusHistory = [
                ...(protocol.statusHistory ?? []),
                {
                    id: `PHS-${protocol.id}-${Date.now().toString(36)}`,
                    fromStatus: 'pending_approval',
                    toStatus: 'approved',
                    changedBy: currentUser.name,
                    reason: 'Chủ trang trại phê duyệt sau khi kiểm tra lịch và vật tư',
                    changedAt: protocol.reviewedAt,
                },
            ];
            const season = ownerSeasons.find((item) => item.id === protocol.seasonId);
            if (season) {
                season.protocolStatus = 'approved';
                if (protocol.protocolType === 'production') season.hasApprovedProtocol = true;
            }
            setSaving(false);
            setAction('idle');
            onChanged();
            nav.toast('Đã phê duyệt. Hệ thống sẽ sinh lịch vận hành gần nhất.');
        }, 650);
    };
    const reject = () => {
        if (!reviewContextIsValid()) {
            nav.toast('Trạng thái vụ nuôi hoặc phác đồ đã thay đổi. Không thể từ chối.', 'warning');
            onChanged();
            return;
        }
        if (!reason.trim()) {
            setError('Vui lòng nêu lý do để Chuyên gia có thể điều chỉnh.');
            return;
        }
        setSaving(true);
        window.setTimeout(() => {
            protocol.status = 'rejected';
            protocol.rejectionReason = reason.trim();
            protocol.reviewedAt = new Date().toISOString();
            protocol.reviewedBy = currentUser.name;
            protocol.statusHistory = [
                ...(protocol.statusHistory ?? []),
                {
                    id: `PHS-${protocol.id}-${Date.now().toString(36)}`,
                    fromStatus: 'pending_approval',
                    toStatus: 'rejected',
                    changedBy: currentUser.name,
                    reason: reason.trim(),
                    changedAt: protocol.reviewedAt,
                },
            ];
            const season = ownerSeasons.find((item) => item.id === protocol.seasonId);
            if (season && protocol.protocolType === 'production') {
                season.protocolStatus = 'rejected';
                season.hasApprovedProtocol = false;
            }
            setSaving(false);
            onChanged();
            nav.toast('Đã từ chối phác đồ và gửi lý do cho Chuyên gia.');
        }, 650);
    };
    return (
        <div className="rounded-2xl border-2 border-amber-200 bg-amber-50 p-4">
            <div className="flex gap-2.5">
                <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-amber-100 text-amber-700">
                    <Icons.approve size={17} />
                </span>
                <div>
                    <div className="text-[14px] font-bold text-amber-800">
                        Quyết định của Chủ trại
                    </div>
                    <p className="mt-0.5 text-[11px] leading-relaxed text-amber-700">
                        Chỉ quyết định sau khi đã kiểm tra toàn cảnh, từng cữ, liều lượng và mốc neo
                        của phác đồ.
                    </p>
                </div>
            </div>
            {action === 'idle' && (
                <div className="mt-4 space-y-2">
                    {missingProductCount > 0 && (
                        <div className="rounded-xl border border-rose-200 bg-white px-3 py-2.5 text-[11px] leading-relaxed text-rose-700">
                            <div className="font-bold">Chưa thể phê duyệt</div>
                            <p className="mt-0.5">
                                Còn {missingProductCount} vật tư chưa có trong kho. Hãy dùng mục
                                “Khả năng cấp vật tư” phía trên để tạo hoặc liên kết trước.
                            </p>
                        </div>
                    )}
                    <PrimaryButton
                        full
                        icon={Icons.approve}
                        disabled={missingProductCount > 0}
                        onClick={() => setAction('approve')}
                    >
                        {missingProductCount > 0
                            ? `Cần liên kết ${missingProductCount} vật tư`
                            : 'Phê duyệt phác đồ'}
                    </PrimaryButton>
                    <GhostButton full icon={Icons.x} onClick={() => setAction('reject')}>
                        Từ chối và nêu lý do
                    </GhostButton>
                </div>
            )}
            {action === 'approve' && (
                <div className="mt-4 rounded-xl border border-teal-200 bg-white p-3">
                    <div className="text-[12px] font-bold text-teal-700">
                        Xác nhận phê duyệt phiên bản {protocol.versionNo}
                    </div>
                    <p className="mt-1 text-[10px] leading-relaxed text-ink-muted">
                        Phiên bản sẽ bị khóa.{' '}
                        {protocol.protocolType === 'treatment'
                            ? 'Ngày duyệt hôm nay trở thành ngày 1 điều trị.'
                            : 'Lịch được sinh cuốn theo ngày thả giống, không tạo cứng toàn bộ mùa vụ.'}
                    </p>
                    <div className="mt-3 flex gap-2">
                        <GhostButton onClick={() => setAction('idle')}>Xem lại</GhostButton>
                        <PrimaryButton icon={Icons.check} onClick={approve}>
                            {saving ? 'Đang duyệt…' : 'Xác nhận duyệt'}
                        </PrimaryButton>
                    </div>
                </div>
            )}
            {action === 'reject' && (
                <div className="mt-4 space-y-3 rounded-xl border border-rose-200 bg-white p-3">
                    <Field label="Lý do từ chối *" error={error}>
                        <textarea
                            value={reason}
                            onChange={(event) => {
                                setReason(event.target.value);
                                setError('');
                            }}
                            className={`${inputClass} min-h-[82px] resize-none`}
                            placeholder="Ví dụ: Cần làm rõ liều ở cữ 14:00 và sản phẩm thay thế khi hết kho…"
                        />
                    </Field>
                    <div className="flex gap-2">
                        <GhostButton onClick={() => setAction('idle')}>Quay lại</GhostButton>
                        <PrimaryButton tone="rose" icon={Icons.x} onClick={reject}>
                            {saving ? 'Đang gửi…' : 'Xác nhận từ chối'}
                        </PrimaryButton>
                    </div>
                </div>
            )}
        </div>
    );
}

const severityMeta = {
    low: { label: 'Thấp', tone: 'slate' as const },
    medium: { label: 'Trung bình', tone: 'amber' as const },
    high: { label: 'Cao', tone: 'rose' as const },
    critical: { label: 'Nghiêm trọng', tone: 'rose' as const },
};
const caseStatusMeta: Record<string, { label: string; tone: Tone }> = {
    open: { label: 'Mới mở', tone: 'rose' },
    waiting_for_info: { label: 'Chờ thông tin', tone: 'amber' },
    monitoring: { label: 'Theo dõi', tone: 'ocean' },
    in_treatment: { label: 'Đang điều trị', tone: 'violet' },
    resolved: { label: 'Đã giải quyết', tone: 'teal' },
};

export function SeasonCaseList({ seasonId }: { seasonId: string }) {
    const nav = useNav();
    const season = ownerSeasons.find((item) => item.id === seasonId);
    const cases = casesForSeason(seasonId);
    const open = cases.filter((item) => item.status !== 'resolved');
    const closed = cases.filter((item) => item.status === 'resolved');
    const [tab, setTab] = useState<'open' | 'resolved'>('open');
    const visible = tab === 'open' ? open : closed;

    if (!season || !isSeasonVisibleToOwner(seasonId)) {
        return (
            <div className="pb-8">
                <ScreenHeader title="Ca bệnh" />
                <div className="px-4">
                    <EmptyState
                        icon={Icons.diseaseCase}
                        title="Không tìm thấy vụ nuôi"
                        hint="Vụ nuôi này không còn nằm trong danh sách quản lý."
                    />
                </div>
            </div>
        );
    }

    return (
        <div className="pb-8">
            <ScreenHeader
                title="Ca bệnh"
                subtitle={season ? `${season.pondName} · ${season.name}` : undefined}
            />
            <div className="space-y-3 px-4">
                {cases.length === 0 ? (
                    <EmptyState
                        icon={Icons.diseaseCase}
                        title="Không có ca bệnh"
                        hint="Vụ nuôi này chưa ghi nhận ca bệnh nào."
                    />
                ) : (
                    <>
                        <Segmented
                            value={tab}
                            onChange={setTab}
                            options={[
                                { value: 'open', label: `Đang xử lý (${open.length})` },
                                { value: 'resolved', label: `Đã giải quyết (${closed.length})` },
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
                                {visible.map((item) => (
                                    <CaseCard
                                        key={item.id}
                                        caseItem={item}
                                        onPress={() =>
                                            nav.go('owner-case-detail', { caseId: item.id })
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

function CaseCard({ caseItem, onPress }: { caseItem: OwnerDiseaseCase; onPress: () => void }) {
    const status = caseStatusMeta[caseItem.status];
    const severity = severityMeta[caseItem.severity];
    return (
        <button
            onClick={onPress}
            className="card w-full p-3.5 text-left transition active:scale-[0.99]"
        >
            <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 text-[14px] font-bold leading-snug text-ink">
                    {caseItem.title}
                </div>
                <Badge tone={status.tone} dot>
                    {status.label}
                </Badge>
            </div>
            <p className="mt-1 line-clamp-2 text-[12px] leading-relaxed text-ink-soft">
                {caseItem.description}
            </p>
            {caseItem.aiLabel && (
                <div className="mt-2 inline-flex items-center gap-1 rounded-lg bg-violet-50 px-2 py-1 text-[10px] font-semibold text-violet-600">
                    <Icons.sparkle size={11} /> AI: {caseItem.aiLabel}
                </div>
            )}
            <div className="mt-2.5 flex items-center justify-between gap-2 border-t border-line-soft pt-2.5">
                <div className="flex min-w-0 items-center gap-1.5">
                    <Badge tone={severity.tone}>Mức {severity.label}</Badge>
                    <span className="truncate text-[10px] text-ink-muted">
                        {caseItem.expertName}
                    </span>
                </div>
                <div className="flex shrink-0 items-center gap-1 text-[10px] text-ink-muted">
                    {caseItem.responsesCount} phản hồi <Icons.chevronR size={13} />
                </div>
            </div>
        </button>
    );
}
