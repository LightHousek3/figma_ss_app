import { useState } from 'react';
import { useNav } from '../../app/store';
import {
    Icons,
    Badge,
    Field,
    inputClass,
    PrimaryButton,
    GhostButton,
    AppDialog,
    DeleteConfirmDialog,
    EmptyState,
    Segmented,
    num,
} from '../../app/ui';
import {
    ownerProducts,
    ownerFarms,
    inventoryTransactions,
    inventoryBalances,
    balancesForProduct,
    plannedUseCountForProduct,
    allSeasonProtocols,
    ownerSeasons,
    type OwnerProduct,
    type InventoryTransaction,
    type InventoryBalance,
} from '../../app/ownerData';
import { ScreenHeader } from '../common';
import { currentUser } from '../../app/data';

// ── helpers ───────────────────────────────────────────────────────────────────

const categoryMeta: Record<
    OwnerProduct['category'],
    { label: string; tone: 'teal' | 'rose' | 'ocean' | 'violet' | 'amber' | 'slate' }
> = {
    feed: { label: 'Thức ăn', tone: 'teal' },
    medicine: { label: 'Thuốc / chế phẩm', tone: 'rose' },
    mineral: { label: 'Khoáng chất', tone: 'ocean' },
    chemical: { label: 'Hóa chất', tone: 'violet' },
    other: { label: 'Khác', tone: 'slate' },
};

const unitLabel: Record<OwnerProduct['unit'], string> = {
    kg: 'kg',
    g: 'g',
    l: 'lít',
    ml: 'ml',
    pack: 'gói',
    bottle: 'chai',
};

const categoryFromOperation: Record<string, OwnerProduct['category']> = {
    feeding: 'feed',
    medicine: 'medicine',
    mineral: 'mineral',
    chemical: 'chemical',
    other: 'other',
};

const unitFromProtocol = (value?: string): OwnerProduct['unit'] => {
    const normalized = value?.trim().toLowerCase();
    return (['kg', 'g', 'l', 'ml', 'pack', 'bottle'] as OwnerProduct['unit'][]).includes(
        normalized as OwnerProduct['unit'],
    )
        ? (normalized as OwnerProduct['unit'])
        : 'kg';
};

const fmtDate = (iso: string) =>
    new Date(iso).toLocaleString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
    });

const fmtMoney = (n: number) => n.toLocaleString('vi-VN') + ' ₫';

const transactionContextLabel = (transaction: InventoryTransaction) => {
    if (transaction.transactionType === 'stock_in') return 'Nhập kho';
    return 'Xuất kho';
};

const localDateTimeValue = () => {
    const now = new Date();
    const local = new Date(now.getTime() - now.getTimezoneOffset() * 60_000);
    return local.toISOString().slice(0, 16);
};

// ── UC 34: Product List ───────────────────────────────────────────────────────

export function ProductList({ farmId }: { farmId?: string }) {
    const nav = useNav();
    const activeFarms = ownerFarms.filter((farm) => !farm.isDeleted);
    const initialFarmId = activeFarms.some((farm) => farm.id === farmId)
        ? farmId!
        : (activeFarms[0]?.id ?? '');
    const [selectedFarm, setSelectedFarm] = useState(initialFarmId);
    const [stockFilter, setStockFilter] = useState<'all' | 'low'>('all');
    const [search, setSearch] = useState('');

    const farmProducts = ownerProducts.filter(
        (product) => product.farmId === selectedFarm && !product.isDeleted,
    );
    const products = farmProducts.filter((product) => {
        const query = search.trim().toLowerCase();
        const matchesSearch = !query || product.name.toLowerCase().includes(query);
        const matchesStock =
            stockFilter === 'all' || product.currentStock < product.minAlertQuantity;
        return matchesSearch && matchesStock;
    });
    const activeFarmProducts = ownerProducts.filter(
        (product) => product.farmId === selectedFarm && !product.isDeleted,
    );
    const lowStockCount = activeFarmProducts.filter(
        (product) => product.currentStock < product.minAlertQuantity,
    ).length;
    const totalValue = activeFarmProducts.reduce(
        (sum, product) =>
            sum +
            balancesForProduct(product.id).reduce(
                (lotSum, lot) => lotSum + lot.quantity * lot.unitPrice,
                0,
            ),
        0,
    );

    if (!selectedFarm) {
        return (
            <div className="pb-8">
                <ScreenHeader title="Kho vật tư" />
                <div className="px-4">
                    <EmptyState
                        icon={Icons.building}
                        title="Chưa có trang trại"
                        hint="Tạo trang trại trước khi thiết lập kho vật tư."
                    />
                </div>
            </div>
        );
    }

    return (
        <div className="pb-24">
            <ScreenHeader title="Kho vật tư" />
            <div className="px-4 space-y-3">
                {activeFarms.length > 1 && (
                    <div className="relative">
                        <Icons.building
                            size={15}
                            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted"
                        />
                        <select
                            className={`${inputClass} bg-white pl-9 font-sans font-semibold`}
                            value={selectedFarm}
                            onChange={(event) => setSelectedFarm(event.target.value)}
                        >
                            {activeFarms.map((farm) => (
                                <option key={farm.id} value={farm.id}>
                                    {farm.name}
                                </option>
                            ))}
                        </select>
                    </div>
                )}

                <div className="grid grid-cols-3 gap-2">
                    <InventoryStat label="Vật tư" value={activeFarmProducts.length.toString()} />
                    <InventoryStat
                        label="Sắp hết"
                        value={lowStockCount.toString()}
                        alert={lowStockCount > 0}
                    />
                    <InventoryStat label="Giá trị tồn" value={compactMoney(totalValue)} />
                </div>

                <div className="flex items-center gap-2 rounded-xl border border-line bg-white px-3 py-2.5">
                    <Icons.box size={15} className="shrink-0 text-ink-muted" />
                    <input
                        className="min-w-0 flex-1 bg-transparent text-[13px] outline-none placeholder:text-ink-muted"
                        placeholder="Tìm theo tên vật tư…"
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                    />
                </div>

                <Segmented
                    value={stockFilter}
                    onChange={setStockFilter}
                    options={[
                        { value: 'all', label: `Tất cả (${farmProducts.length})` },
                        { value: 'low', label: `Sắp hết (${lowStockCount})` },
                    ]}
                />
                <div className="flex items-center justify-between px-1">
                    <span className="font-display text-[14px] font-bold text-ink">
                        {products.length} sản phẩm
                    </span>
                    <button
                        type="button"
                        onClick={() => nav.go('owner-product-edit', { farmId: selectedFarm })}
                        className="inline-flex min-h-9 items-center gap-1 rounded-xl bg-ocean-50 px-3 text-[11px] font-bold text-ocean-700"
                    >
                        <Icons.plus size={13} /> Thêm vật tư
                    </button>
                </div>

                {products.length === 0 ? (
                    <EmptyState
                        icon={Icons.box}
                        title={search ? 'Không tìm thấy vật tư' : 'Chưa có vật tư'}
                        hint={!search ? 'Thêm vật tư để bắt đầu quản lý kho.' : undefined}
                    />
                ) : (
                    <div className="space-y-2.5">
                        {products.map((p) => (
                            <ProductCard
                                key={p.id}
                                product={p}
                                onClick={() => nav.go('owner-product-detail', { productId: p.id })}
                            />
                        ))}
                    </div>
                )}
            </div>
            <button
                type="button"
                onClick={() => nav.go('owner-stock-history', { farmId: selectedFarm })}
                aria-label="Xem lịch sử giao dịch kho"
                title="Lịch sử kho"
                className="fixed bottom-24 z-30 grid size-13 place-items-center rounded-full bg-ocean-500 text-white shadow-[0_10px_30px_rgba(15,98,180,.35)] transition active:scale-95"
                style={{ right: 'max(1rem, calc((100vw - 440px) / 2 + 1rem))' }}
            >
                <Icons.clock size={21} />
            </button>
        </div>
    );
}

function InventoryStat({
    label,
    value,
    alert = false,
}: {
    label: string;
    value: string;
    alert?: boolean;
}) {
    return (
        <div className="card px-3 py-2.5">
            <div
                className={`truncate font-display text-[15px] font-extrabold ${alert ? 'text-rose-500' : 'text-ink'}`}
            >
                {value}
            </div>
            <div className="mt-0.5 truncate text-[9px] font-semibold uppercase tracking-wide text-ink-muted">
                {label}
            </div>
        </div>
    );
}

const compactMoney = (value: number) =>
    value >= 1_000_000
        ? `${(value / 1_000_000).toLocaleString('vi-VN', { maximumFractionDigits: 1 })} tr ₫`
        : fmtMoney(value);

function ProductCard({ product: p, onClick }: { product: OwnerProduct; onClick: () => void }) {
    const cm = categoryMeta[p.category];
    const isLow = p.currentStock < p.minAlertQuantity;
    const lots = balancesForProduct(p.id);
    const stockValue = lots.reduce((sum, lot) => sum + lot.quantity * lot.unitPrice, 0);

    return (
        <button
            onClick={onClick}
            className="flex w-full items-center gap-3 rounded-2xl bg-white px-4 py-3.5 text-left shadow-[0_2px_12px_rgba(0,0,0,.06)] transition active:scale-[0.99]"
        >
            <span
                className={`grid size-10 shrink-0 place-items-center rounded-xl ${isLow ? 'bg-rose-50 text-rose-500' : 'bg-ocean-50 text-ocean-600'}`}
            >
                <Icons.box size={18} />
            </span>
            <div className="min-w-0 flex-1">
                <div className="truncate text-[13px] font-bold text-ink">{p.name}</div>
                <div className="mt-0.5 flex gap-1.5">
                    <Badge tone={cm.tone}>{cm.label}</Badge>
                    {isLow && (
                        <Badge tone="rose" dot>
                            Tồn kho thấp
                        </Badge>
                    )}
                </div>
                <div className="mt-1 text-[12px]">
                    <span className={`font-bold ${isLow ? 'text-rose-600' : 'text-teal-600'}`}>
                        {num(p.currentStock)} {unitLabel[p.unit]}
                    </span>
                    <span className="text-ink-muted">
                        {' '}
                        / ngưỡng {num(p.minAlertQuantity)} {unitLabel[p.unit]}
                    </span>
                </div>
                <div className="mt-1 text-[10px] text-ink-muted">
                    {lots.length} lô còn hàng · Giá trị tồn {compactMoney(stockValue)}
                </div>
            </div>
            <Icons.chevronR size={16} className="shrink-0 text-ink-muted" />
        </button>
    );
}

// ── UC 35: Product Detail ─────────────────────────────────────────────────────

export function ProductDetail({ productId }: { productId: string }) {
    const nav = useNav();
    const product = ownerProducts.find((p) => p.id === productId);
    const parentFarm = product ? ownerFarms.find((farm) => farm.id === product.farmId) : undefined;
    if (!product || product.isDeleted || parentFarm?.isDeleted) {
        return (
            <div className="pb-8">
                <ScreenHeader title="Vật tư" />
                <div className="px-4">
                    <EmptyState
                        icon={Icons.box}
                        title="Không tìm thấy vật tư"
                        hint="Vật tư không còn trong danh mục sử dụng."
                    />
                </div>
            </div>
        );
    }

    const cm = categoryMeta[product.category];
    const isLow = product.currentStock < product.minAlertQuantity;
    const lots = balancesForProduct(productId);
    const inventoryValue = lots.reduce((sum, lot) => sum + lot.quantity * lot.unitPrice, 0);
    const plannedUseCount = plannedUseCountForProduct(productId);
    const canDelete = product.currentStock === 0 && plannedUseCount === 0;
    const deleteBlockers = [
        product.currentStock > 0
            ? `Kho vẫn còn ${num(product.currentStock)} ${unitLabel[product.unit]}`
            : '',
        plannedUseCount > 0
            ? `${plannedUseCount} lịch vận hành đang dự kiến sử dụng vật tư này`
            : '',
    ].filter(Boolean);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [selectedImage, setSelectedImage] = useState(0);

    return (
        <div className="pb-8">
            <ScreenHeader
                title={product.name}
                right={
                    <button
                        onClick={() =>
                            nav.go('owner-product-edit', { productId, farmId: product.farmId })
                        }
                        className="grid size-9 place-items-center rounded-full bg-slate-50 text-ink-soft"
                        aria-label="Chỉnh sửa vật tư"
                    >
                        <Icons.edit size={17} />
                    </button>
                }
            />
            <div className="px-4 space-y-4">
                {/* Info card */}
                <div className="card space-y-3 p-4">
                    <div className="flex items-center justify-between">
                        <Badge tone={cm.tone}>{cm.label}</Badge>
                        {isLow && (
                            <Badge tone="rose" dot>
                                Tồn kho thấp
                            </Badge>
                        )}
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                        <div>
                            <div className="text-[10px] uppercase tracking-wide text-ink-muted">
                                Tồn kho hiện tại
                            </div>
                            <div
                                className={`mt-0.5 font-display text-[20px] font-extrabold ${isLow ? 'text-rose-600' : 'text-teal-600'}`}
                            >
                                {num(product.currentStock)}
                            </div>
                            <div className="text-[11px] text-ink-muted">
                                {unitLabel[product.unit]}
                            </div>
                        </div>
                        <div>
                            <div className="text-[10px] uppercase tracking-wide text-ink-muted">
                                Ngưỡng cảnh báo
                            </div>
                            <div className="mt-0.5 font-display text-[20px] font-extrabold text-ink">
                                {num(product.minAlertQuantity)}
                            </div>
                            <div className="text-[11px] text-ink-muted">
                                {unitLabel[product.unit]}
                            </div>
                        </div>
                        <div>
                            <div className="text-[10px] uppercase tracking-wide text-ink-muted">
                                Giá trị tồn
                            </div>
                            <div className="mt-0.5 font-display text-[16px] font-extrabold text-ocean-600">
                                {compactMoney(inventoryValue)}
                            </div>
                            <div className="text-[9px] text-ink-muted">Theo giá nhập</div>
                        </div>
                    </div>

                    <div className="border-t border-slate-100 pt-2 space-y-1">
                        <div className="text-[11px] text-ink-muted">
                            Đơn vị:{' '}
                            <span className="font-semibold text-ink">
                                {unitLabel[product.unit]}
                            </span>
                        </div>
                        {product.conversionQuantity && product.conversionUnit && (
                            <div className="text-[11px] text-ink-muted">
                                Quy đổi:{' '}
                                <span className="font-semibold text-ink">
                                    1 {unitLabel[product.unit]} = {num(product.conversionQuantity)}{' '}
                                    {product.conversionUnit}
                                </span>
                            </div>
                        )}
                        {product.description && (
                            <div className="text-[11px] text-ink-soft">{product.description}</div>
                        )}
                    </div>
                </div>

                {product.imageUrls.length > 0 && (
                    <div className="card space-y-3 p-3.5">
                        <div className="flex items-center justify-between px-0.5">
                            <div className="text-[13px] font-bold text-ink">Hình ảnh vật tư</div>
                            <span className="text-[10px] font-semibold text-ink-muted">
                                {selectedImage + 1}/{product.imageUrls.length}
                            </span>
                        </div>
                        <img
                            src={product.imageUrls[selectedImage]}
                            alt={`${product.name} - ảnh ${selectedImage + 1}`}
                            className="h-44 w-full rounded-2xl bg-slate-50 object-cover"
                        />
                        {product.imageUrls.length > 1 && (
                            <div className="scroll-clean flex gap-2 overflow-x-auto pb-0.5">
                                {product.imageUrls.map((image, index) => (
                                    <button
                                        key={`${image}-${index}`}
                                        type="button"
                                        onClick={() => setSelectedImage(index)}
                                        aria-label={`Xem ảnh ${index + 1}`}
                                        className={`shrink-0 overflow-hidden rounded-xl border-2 ${selectedImage === index ? 'border-ocean-500' : 'border-transparent'}`}
                                    >
                                        <img src={image} alt="" className="size-14 object-cover" />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Actions */}
                <div className="flex gap-2.5">
                    <PrimaryButton
                        full
                        icon={Icons.plus}
                        onClick={() => nav.go('owner-stock-in', { productId })}
                    >
                        Nhập kho
                    </PrimaryButton>
                    <GhostButton
                        full
                        icon={Icons.x}
                        onClick={() => nav.go('owner-stock-out', { productId })}
                    >
                        Xuất kho
                    </GhostButton>
                </div>

                <div>
                    <div className="mb-2 flex items-end justify-between px-1">
                        <div>
                            <div className="font-display text-[14px] font-bold text-ink">
                                Tồn kho theo lô
                            </div>
                            <div className="mt-0.5 text-[10px] text-ink-muted">
                                Ưu tiên xuất lô nhập trước
                            </div>
                        </div>
                        <Badge tone="ocean">{lots.length} lô còn hàng</Badge>
                    </div>
                    {lots.length > 0 ? (
                        <div className="space-y-2">
                            {lots.map((lot, index) => (
                                <InventoryLotCard
                                    key={lot.id}
                                    lot={lot}
                                    unit={unitLabel[product.unit]}
                                    receivedQuantity={
                                        inventoryTransactions
                                            .filter(
                                                (tx) =>
                                                    tx.productId === product.id &&
                                                    tx.lotNumber === lot.lotNumber &&
                                                    tx.transactionType === 'stock_in',
                                            )
                                            .reduce((sum, tx) => sum + tx.quantity, 0) ||
                                        lot.quantity
                                    }
                                    fifoFirst={index === 0}
                                />
                            ))}
                        </div>
                    ) : (
                        <EmptyState
                            icon={Icons.box}
                            title="Chưa có lô còn hàng"
                            hint="Nhập kho để tạo lô tồn đầu tiên."
                        />
                    )}
                </div>

                <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className={`flex w-full items-center justify-center gap-2 rounded-2xl border px-4 py-3 text-[14px] font-semibold ${canDelete ? 'border-rose-200 bg-rose-50 text-rose-600' : 'border-amber-200 bg-amber-50 text-amber-700'}`}
                >
                    <Icons.trash size={16} />
                    {'Xóa vật tư'}
                </button>
            </div>
            <DeleteConfirmDialog
                open={showDeleteConfirm}
                onClose={() => setShowDeleteConfirm(false)}
                entityLabel="vật tư"
                entityName={product.name}
                blockers={deleteBlockers}
                retentionMessage="Vật tư sẽ bị loại khỏi danh mục sử dụng. Toàn bộ giao dịch cũ vẫn được giữ để truy vết."
                onConfirm={() => {
                    product.isDeleted = true;
                    product.deletedAt = new Date().toISOString();
                    nav.toast('Đã xóa vật tư.', 'success');
                    nav.back();
                }}
            />
        </div>
    );
}

function InventoryLotCard({
    lot,
    unit,
    receivedQuantity,
    fifoFirst,
}: {
    lot: InventoryBalance;
    unit: string;
    receivedQuantity: number;
    fifoFirst: boolean;
}) {
    const usedPct =
        receivedQuantity > 0
            ? Math.min(
                  100,
                  Math.max(0, ((receivedQuantity - lot.quantity) / receivedQuantity) * 100),
              )
            : 0;
    return (
        <div className="card overflow-hidden p-3.5">
            <div className="flex items-start justify-between gap-2">
                <div>
                    <div className="font-mono text-[13px] font-bold text-ink">
                        Lô {lot.lotNumber}
                    </div>
                    <div className="mt-0.5 text-[10px] text-ink-muted">
                        Nhập {fmtDate(lot.receivedAt)}
                    </div>
                    <div className="mt-0.5 text-[10px] text-ink-muted">
                        Nhà cung cấp: {lot.supplierName}
                    </div>
                </div>
                {fifoFirst && (
                    <Badge tone="teal" dot>
                        Xuất trước
                    </Badge>
                )}
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2">
                <LotMetric label="Đã nhập" value={`${num(receivedQuantity)} ${unit}`} />
                <LotMetric label="Còn lại" value={`${num(lot.quantity)} ${unit}`} accent />
                <LotMetric label="Đơn giá" value={`${num(lot.unitPrice)} ₫/${unit}`} />
            </div>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100">
                <div
                    className="h-full rounded-full bg-ocean-500"
                    style={{ width: `${usedPct}%` }}
                />
            </div>
            <div className="mt-1.5 flex items-center justify-between text-[9px] text-ink-muted">
                <span>Đã sử dụng {usedPct.toFixed(0)}%</span>
                <span className="font-semibold text-ink-soft">
                    Giá trị còn {fmtMoney(lot.quantity * lot.unitPrice)}
                </span>
            </div>
        </div>
    );
}

function LotMetric({
    label,
    value,
    accent = false,
}: {
    label: string;
    value: string;
    accent?: boolean;
}) {
    return (
        <div className="min-w-0 rounded-xl bg-slate-50 px-2.5 py-2">
            <div className="text-[9px] text-ink-muted">{label}</div>
            <div
                className={`mt-0.5 break-words text-[11px] font-bold leading-snug ${accent ? 'text-teal-600' : 'text-ink'}`}
            >
                {value}
            </div>
        </div>
    );
}

// ── UC 36/37: Product Create/Edit ─────────────────────────────────────────────

export function ProductEdit({
    productId,
    farmId,
    protocolId,
    protocolItemId,
}: {
    productId?: string;
    farmId: string;
    protocolId?: string;
    protocolItemId?: string;
}) {
    const nav = useNav();
    const existing = productId ? ownerProducts.find((p) => p.id === productId) : undefined;
    const isCreate = !existing;
    const parentFarm = ownerFarms.find((farm) => farm.id === farmId);
    const sourceProtocol = protocolId
        ? allSeasonProtocols.find((protocol) => protocol.id === protocolId)
        : undefined;
    const sourceItem = protocolItemId
        ? sourceProtocol?.items.find((item) => item.id === protocolItemId)
        : undefined;
    const sourceSeason = sourceProtocol
        ? ownerSeasons.find((season) => season.id === sourceProtocol.seasonId)
        : undefined;
    const fromProtocol = !!sourceProtocol && !!sourceItem;
    const invalidProtocolContext =
        (!!protocolId || !!protocolItemId) &&
        (!sourceProtocol || !sourceItem || sourceSeason?.farmId !== farmId);

    if (existing?.isDeleted || !parentFarm || parentFarm.isDeleted || invalidProtocolContext) {
        return (
            <div className="pb-8">
                <ScreenHeader
                    title={invalidProtocolContext ? 'Tạo vật tư từ phác đồ' : 'Chỉnh sửa vật tư'}
                />
                <div className="px-4">
                    <EmptyState
                        icon={Icons.box}
                        title={
                            invalidProtocolContext
                                ? 'Không tìm thấy đề xuất vật tư'
                                : 'Không tìm thấy vật tư'
                        }
                        hint={
                            invalidProtocolContext
                                ? 'Phác đồ hoặc vật tư đề xuất không còn hợp lệ.'
                                : 'Vật tư không còn trong danh mục sử dụng.'
                        }
                    />
                </div>
            </div>
        );
    }

    const protocolCategory = sourceItem
        ? (categoryFromOperation[sourceItem.operationType] ?? 'other')
        : 'feed';
    const protocolUnit = unitFromProtocol(sourceItem?.doseUnit);
    const [name, setName] = useState(existing?.name ?? sourceItem?.productName ?? '');
    const [category, setCategory] = useState<OwnerProduct['category']>(
        existing?.category ?? protocolCategory,
    );
    const [unit, setUnit] = useState<OwnerProduct['unit']>(existing?.unit ?? protocolUnit);
    const [minAlert, setMinAlert] = useState(existing?.minAlertQuantity?.toString() ?? '0');
    const [conversionQuantity, setConversionQuantity] = useState(
        existing?.conversionQuantity?.toString() ?? '',
    );
    const [conversionUnit, setConversionUnit] = useState<
        NonNullable<OwnerProduct['conversionUnit']>
    >(existing?.conversionUnit ?? 'kg');
    const [imageUrls, setImageUrls] = useState(existing?.imageUrls ?? []);
    const [description, setDescription] = useState(
        existing?.description ??
            (sourceProtocol
                ? `Vật tư được tạo từ đề xuất trong phác đồ “${sourceProtocol.title}”.`
                : ''),
    );
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [saving, setSaving] = useState(false);
    const [createdProduct, setCreatedProduct] = useState<OwnerProduct>();
    const needsConversion = unit === 'pack' || unit === 'bottle';

    const linkedProduct =
        createdProduct ??
        (fromProtocol && sourceItem?.productId
            ? ownerProducts.find(
                  (product) =>
                      product.id === sourceItem.productId &&
                      !product.isDeleted &&
                      product.farmId === farmId,
              )
            : undefined);
    const linkedLots = linkedProduct ? balancesForProduct(linkedProduct.id) : [];

    const validate = () => {
        const e: Record<string, string> = {};
        if (!name.trim()) e.name = 'Tên vật tư không được để trống.';
        else {
            const dup = ownerProducts.find(
                (p) =>
                    p.farmId === farmId &&
                    !p.isDeleted &&
                    p.name.toLowerCase() === name.trim().toLowerCase() &&
                    p.unit === unit &&
                    p.id !== productId,
            );
            if (dup) e.name = 'Tên vật tư và đơn vị này đã tồn tại trong kho.';
        }
        if (isNaN(Number(minAlert)) || Number(minAlert) < 0)
            e.minAlert = 'Ngưỡng cảnh báo phải ≥ 0.';
        if (needsConversion && (!conversionQuantity || Number(conversionQuantity) <= 0))
            e.conversionQuantity = 'Số lượng quy đổi phải lớn hơn 0.';
        return e;
    };

    const submit = () => {
        const e = validate();
        setErrors(e);
        if (Object.keys(e).length) return;
        setSaving(true);
        window.setTimeout(() => {
            if (existing) {
                existing.name = name.trim();
                existing.category = category;
                existing.unit = unit;
                existing.conversionQuantity = needsConversion
                    ? Number(conversionQuantity)
                    : undefined;
                existing.conversionUnit = needsConversion ? conversionUnit : undefined;
                existing.imageUrls = imageUrls;
                existing.minAlertQuantity = Number(minAlert);
                existing.description = description.trim();
            } else {
                const newProduct: OwnerProduct = {
                    id: `PRD-${Date.now().toString(36).slice(-6)}`,
                    farmId,
                    name: name.trim(),
                    category,
                    unit,
                    conversionQuantity: needsConversion ? Number(conversionQuantity) : undefined,
                    conversionUnit: needsConversion ? conversionUnit : undefined,
                    imageUrls,
                    minAlertQuantity: Number(minAlert),
                    description: description.trim() || undefined,
                    isDeleted: false,
                    currentStock: 0,
                };
                ownerProducts.push(newProduct);
                if (sourceProtocol && sourceItem) {
                    const recommendationName = sourceItem.productName?.trim().toLowerCase();
                    sourceProtocol.items.forEach((item) => {
                        const sameRecommendation = recommendationName
                            ? !item.productId &&
                              item.productName?.trim().toLowerCase() === recommendationName &&
                              item.doseUnit === sourceItem.doseUnit
                            : item.id === sourceItem.id;
                        if (sameRecommendation) item.productId = newProduct.id;
                    });
                    setCreatedProduct(newProduct);
                }
            }
            setSaving(false);
            nav.toast(isCreate ? 'Vật tư đã được thêm vào kho.' : 'Cập nhật vật tư thành công.');
            if (!fromProtocol) nav.back();
        }, 700);
    };

    if (fromProtocol && linkedProduct) {
        return (
            <div className="pb-8">
                <ScreenHeader title="Đã tạo và liên kết" />
                <div className="space-y-4 px-4 pt-4">
                    <div className="rounded-2xl border border-teal-200 bg-teal-50 p-5 text-center">
                        <span className="mx-auto grid size-12 place-items-center rounded-full bg-teal-100 text-teal-700">
                            <Icons.check size={22} />
                        </span>
                        <div className="mt-3 text-[15px] font-bold text-teal-800">
                            {linkedProduct.name}
                        </div>
                        <p className="mt-1 text-[11px] leading-relaxed text-teal-700">
                            Vật tư đã được tạo trong kho {parentFarm.name} và liên kết với các cữ
                            tương ứng của phác đồ.
                        </p>
                    </div>

                    <div className="card space-y-3 p-4">
                        <div className="text-[12px] font-bold text-ink">Thông tin đã xác nhận</div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <div className="text-[9px] uppercase tracking-wide text-ink-muted">
                                    Danh mục
                                </div>
                                <div className="mt-0.5 text-[11px] font-semibold text-ink">
                                    {categoryMeta[linkedProduct.category].label}
                                </div>
                            </div>
                            <div>
                                <div className="text-[9px] uppercase tracking-wide text-ink-muted">
                                    Đơn vị
                                </div>
                                <div className="mt-0.5 text-[11px] font-semibold text-ink">
                                    {unitLabel[linkedProduct.unit]}
                                </div>
                            </div>
                            <div>
                                <div className="text-[9px] uppercase tracking-wide text-ink-muted">
                                    Tồn hiện tại
                                </div>
                                <div className="mt-0.5 text-[11px] font-semibold text-ink">
                                    {num(linkedProduct.currentStock)}{' '}
                                    {unitLabel[linkedProduct.unit]}
                                </div>
                            </div>
                            <div>
                                <div className="text-[9px] uppercase tracking-wide text-ink-muted">
                                    Ngưỡng cảnh báo
                                </div>
                                <div className="mt-0.5 text-[11px] font-semibold text-ink">
                                    {num(linkedProduct.minAlertQuantity)}{' '}
                                    {unitLabel[linkedProduct.unit]}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-xl border border-ocean-100 bg-ocean-50 px-4 py-3 text-[11px] leading-relaxed text-ocean-700">
                        {linkedLots.length > 0
                            ? `Vật tư hiện có ${linkedLots.length} lô với tổng tồn ${num(linkedProduct.currentStock)} ${unitLabel[linkedProduct.unit]}. Bạn có thể nhập thêm hoặc quay lại phác đồ để tiếp tục đối chiếu.`
                            : 'Vật tư mới chưa có lô tồn. Bạn có thể nhập mã lô, số lượng và đơn giá ngay bây giờ; hoặc quay lại phác đồ để tiếp tục đối chiếu vật tư khác.'}
                    </div>
                    <PrimaryButton
                        full
                        icon={Icons.plus}
                        onClick={() => nav.go('owner-stock-in', { productId: linkedProduct.id })}
                    >
                        {linkedLots.length > 0 ? 'Nhập thêm lô' : 'Tiếp tục nhập kho'}
                    </PrimaryButton>
                    <GhostButton full icon={Icons.chevronR} onClick={() => nav.back()}>
                        Quay lại phác đồ
                    </GhostButton>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col">
            <ScreenHeader
                title={
                    fromProtocol
                        ? 'Tạo vật tư từ phác đồ'
                        : isCreate
                          ? 'Thêm vật tư mới'
                          : 'Chỉnh sửa vật tư'
                }
            />
            <div className="px-4 pt-4 pb-10 space-y-4">
                <Field label="Tên vật tư *" error={errors.name}>
                    <input
                        className={`${inputClass} ${errors.name ? 'border-rose-400' : ''}`}
                        placeholder="VD: Thức ăn CP 9004"
                        value={name}
                        autoFocus
                        onChange={(e) => {
                            setName(e.target.value);
                            setErrors((p) => ({ ...p, name: undefined! }));
                        }}
                    />
                </Field>

                <Field label="Danh mục *">
                    <div className="grid grid-cols-3 gap-1.5 mt-1">
                        {(Object.keys(categoryMeta) as OwnerProduct['category'][]).map((c) => (
                            <button
                                key={c}
                                type="button"
                                disabled={fromProtocol}
                                onClick={() => setCategory(c)}
                                className={`rounded-xl border py-2 text-[11px] font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${category === c ? 'border-ocean-400 bg-ocean-50 text-ocean-700' : 'border-line bg-white text-ink-muted'}`}
                            >
                                {categoryMeta[c].label}
                            </button>
                        ))}
                    </div>
                </Field>

                <Field label="Đơn vị *">
                    <div className="flex flex-wrap gap-1.5 mt-1">
                        {(['kg', 'g', 'l', 'ml', 'pack', 'bottle'] as const).map((u) => (
                            <button
                                key={u}
                                type="button"
                                disabled={fromProtocol}
                                onClick={() => setUnit(u)}
                                className={`rounded-xl border px-3 py-2 text-[12px] font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${unit === u ? 'border-ocean-400 bg-ocean-50 text-ocean-700' : 'border-line bg-white text-ink-muted'}`}
                            >
                                {unitLabel[u]}
                            </button>
                        ))}
                    </div>
                </Field>

                {needsConversion && (
                    <div className="rounded-2xl border border-ocean-100 bg-ocean-50/60 p-3.5">
                        <div className="mb-2 text-[11px] font-semibold text-ocean-700">
                            Quy đổi đơn vị đóng gói
                        </div>
                        <div className="grid grid-cols-[1fr_104px] gap-2">
                            <Field
                                label={`1 ${unitLabel[unit]} tương đương *`}
                                error={errors.conversionQuantity}
                            >
                                <input
                                    className={`${inputClass} ${errors.conversionQuantity ? 'border-rose-400' : ''}`}
                                    inputMode="decimal"
                                    placeholder="VD: 1"
                                    value={conversionQuantity}
                                    onChange={(event) => {
                                        setConversionQuantity(event.target.value);
                                        setErrors((current) => ({
                                            ...current,
                                            conversionQuantity: undefined!,
                                        }));
                                    }}
                                />
                            </Field>
                            <Field label="Đơn vị *">
                                <select
                                    className={inputClass}
                                    value={conversionUnit}
                                    onChange={(event) =>
                                        setConversionUnit(
                                            event.target.value as NonNullable<
                                                OwnerProduct['conversionUnit']
                                            >,
                                        )
                                    }
                                >
                                    {(['mg', 'g', 'kg', 'ml', 'l'] as const).map((value) => (
                                        <option key={value} value={value}>
                                            {value === 'l' ? 'lít' : value}
                                        </option>
                                    ))}
                                </select>
                            </Field>
                        </div>
                    </div>
                )}

                <Field label="Hình ảnh vật tư (nhiều ảnh)">
                    <div className="space-y-2.5">
                        {imageUrls.length > 0 && (
                            <div className="grid grid-cols-3 gap-2">
                                {imageUrls.map((image, index) => (
                                    <div
                                        key={`${image}-${index}`}
                                        className="relative overflow-hidden rounded-xl bg-slate-100"
                                    >
                                        <img
                                            src={image}
                                            alt={`Ảnh vật tư ${index + 1}`}
                                            className="aspect-square w-full object-cover"
                                        />
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setImageUrls((current) =>
                                                    current.filter(
                                                        (_, itemIndex) => itemIndex !== index,
                                                    ),
                                                )
                                            }
                                            aria-label={`Xóa ảnh ${index + 1}`}
                                            className="absolute right-1.5 top-1.5 grid size-6 place-items-center rounded-full bg-slate-900/70 text-white"
                                        >
                                            <Icons.x size={12} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                        <label className="flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-ocean-300 bg-ocean-50 text-[12px] font-semibold text-ocean-700">
                            <Icons.camera size={16} />
                            {imageUrls.length > 0 ? 'Thêm ảnh khác' : 'Chọn nhiều ảnh'}
                            <input
                                type="file"
                                accept="image/*"
                                multiple
                                className="sr-only"
                                onChange={(event) => {
                                    const files = Array.from(event.target.files ?? []);
                                    setImageUrls((current) => [
                                        ...current,
                                        ...files.map((file) => URL.createObjectURL(file)),
                                    ]);
                                    event.target.value = '';
                                }}
                            />
                        </label>
                        <p className="text-[10px] leading-relaxed text-ink-muted">
                            Nên chụp mặt trước, mặt sau và nhãn sản phẩm.
                        </p>
                    </div>
                </Field>

                <Field
                    label={`Ngưỡng cảnh báo tồn kho tối thiểu (${unitLabel[unit]})`}
                    error={errors.minAlert}
                >
                    <input
                        className={`${inputClass} ${errors.minAlert ? 'border-rose-400' : ''}`}
                        inputMode="decimal"
                        placeholder="VD: 100"
                        value={minAlert}
                        onChange={(e) => {
                            setMinAlert(e.target.value);
                            setErrors((p) => ({ ...p, minAlert: undefined! }));
                        }}
                    />
                </Field>

                <Field label="Mô tả (tùy chọn)">
                    <textarea
                        className={`${inputClass} min-h-[60px] resize-none`}
                        placeholder="Ghi chú thêm về vật tư…"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                    />
                </Field>

                <div className="pt-2">
                    <PrimaryButton full icon={saving ? undefined : Icons.check} onClick={submit}>
                        {saving
                            ? 'Đang lưu…'
                            : fromProtocol
                              ? 'Tạo và liên kết vật tư'
                              : isCreate
                                ? 'Thêm vào kho'
                                : 'Lưu thay đổi'}
                    </PrimaryButton>
                </div>
            </div>
        </div>
    );
}

// ── UC 39: Stock In ───────────────────────────────────────────────────────────

export function StockIn({ productId }: { productId: string }) {
    const nav = useNav();
    const product = ownerProducts.find((p) => p.id === productId);
    const parentFarm = product ? ownerFarms.find((farm) => farm.id === product.farmId) : undefined;
    if (!product || product.isDeleted || parentFarm?.isDeleted) {
        return (
            <div className="pb-8">
                <ScreenHeader title="Nhập kho" />
                <div className="px-4">
                    <EmptyState
                        icon={Icons.box}
                        title="Không tìm thấy vật tư"
                        hint="Vật tư không còn trong danh mục sử dụng."
                    />
                </div>
            </div>
        );
    }

    const [lotNumber, setLotNumber] = useState('');
    const [quantity, setQuantity] = useState('');
    const [unitPrice, setUnitPrice] = useState('');
    const [reason, setReason] = useState('');
    const [receivedAt, setReceivedAt] = useState(localDateTimeValue);
    const [supplierName, setSupplierName] = useState('');
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [saving, setSaving] = useState(false);

    const validate = () => {
        const e: Record<string, string> = {};
        if (!lotNumber.trim()) e.lotNumber = 'Mã lô hàng không được để trống.';
        else if (
            inventoryBalances.some(
                (lot) =>
                    lot.productId === productId &&
                    lot.lotNumber.trim().toLowerCase() === lotNumber.trim().toLowerCase(),
            )
        )
            e.lotNumber = 'Mã lô này đã tồn tại. Hãy dùng mã lô khác.';
        if (!quantity || isNaN(Number(quantity)) || Number(quantity) <= 0)
            e.quantity = 'Số lượng nhập phải lớn hơn 0.';
        if (!unitPrice || isNaN(Number(unitPrice)) || Number(unitPrice) < 0)
            e.unitPrice = 'Đơn giá là bắt buộc và phải ≥ 0.';
        if (!receivedAt) e.receivedAt = 'Vui lòng chọn thời điểm nhập kho.';
        if (!supplierName.trim()) e.supplierName = 'Nhà cung cấp của lô là bắt buộc.';
        return e;
    };

    const quantityNumber = Number(quantity) || 0;
    const unitPriceNumber = Number(unitPrice) || 0;
    const totalValue = quantityNumber * unitPriceNumber;

    const submit = () => {
        const e = validate();
        setErrors(e);
        if (Object.keys(e).length) return;
        setSaving(true);
        window.setTimeout(() => {
            const timestamp = new Date(receivedAt).toISOString();
            const lotId = `IB-${Date.now().toString(36)}`;
            inventoryBalances.push({
                id: lotId,
                productId,
                lotNumber: lotNumber.trim(),
                receivedAt: timestamp,
                quantity: quantityNumber,
                unitPrice: unitPriceNumber,
                supplierName: supplierName.trim(),
                createdAt: timestamp,
                updatedAt: timestamp,
            });
            inventoryTransactions.push({
                id: `IT-${Date.now().toString(36)}`,
                productId,
                transactionType: 'stock_in',
                quantity: quantityNumber,
                totalAmount: totalValue,
                lotNumber: lotNumber.trim(),
                reason: reason.trim() || undefined,
                performedBy: currentUser.name,
                createdAt: timestamp,
            });
            product.currentStock += quantityNumber;
            setSaving(false);
            nav.toast(
                `Đã nhập lô ${lotNumber.trim()} · ${num(quantityNumber)} ${unitLabel[product.unit]}.`,
            );
            nav.back();
        }, 800);
    };

    return (
        <div className="flex flex-col">
            <ScreenHeader title="Nhập kho" subtitle={product.name} />
            <div className="px-4 pt-4 pb-10 space-y-4">
                <Field label="Mã lô hàng *" error={errors.lotNumber}>
                    <input
                        className={`${inputClass} ${errors.lotNumber ? 'border-rose-400' : ''}`}
                        placeholder="VD: L-260901"
                        value={lotNumber}
                        autoFocus
                        onChange={(e) => {
                            setLotNumber(e.target.value);
                            setErrors((p) => ({ ...p, lotNumber: undefined! }));
                        }}
                    />
                </Field>

                <Field label={`Số lượng (${unitLabel[product.unit]}) *`} error={errors.quantity}>
                    <input
                        className={`${inputClass} ${errors.quantity ? 'border-rose-400' : ''}`}
                        inputMode="decimal"
                        placeholder="VD: 500"
                        value={quantity}
                        onChange={(e) => {
                            setQuantity(e.target.value);
                            setErrors((p) => ({ ...p, quantity: undefined! }));
                        }}
                    />
                </Field>

                <Field label={`Đơn giá (₫/${unitLabel[product.unit]}) *`} error={errors.unitPrice}>
                    <input
                        className={`${inputClass} ${errors.unitPrice ? 'border-rose-400' : ''}`}
                        inputMode="numeric"
                        placeholder="VD: 35000"
                        value={unitPrice}
                        onChange={(e) => {
                            setUnitPrice(e.target.value);
                            setErrors((p) => ({ ...p, unitPrice: undefined! }));
                        }}
                    />
                </Field>

                <Field label="Thời điểm nhập kho *" error={errors.receivedAt}>
                    <input
                        type="datetime-local"
                        className={`${inputClass} ${errors.receivedAt ? 'border-rose-400' : ''}`}
                        value={receivedAt}
                        onChange={(e) => setReceivedAt(e.target.value)}
                    />
                </Field>

                <Field label="Nhà cung cấp *" error={errors.supplierName}>
                    <input
                        className={`${inputClass} ${errors.supplierName ? 'border-rose-400' : ''}`}
                        placeholder="Tên đơn vị bán"
                        value={supplierName}
                        onChange={(event) => {
                            setSupplierName(event.target.value);
                            setErrors((current) => ({ ...current, supplierName: undefined! }));
                        }}
                    />
                </Field>

                {(quantityNumber > 0 || unitPriceNumber > 0 || lotNumber.trim()) && (
                    <div className="card overflow-hidden">
                        <div className="border-b border-line-soft bg-slate-50 px-4 py-2.5 text-[11px] font-bold uppercase tracking-wide text-ink-soft">
                            Kiểm tra lô nhập
                        </div>
                        <div className="space-y-2.5 p-4">
                            <div className="flex items-center justify-between text-[12px]">
                                <span className="text-ink-muted">Mã lô</span>
                                <span className="font-mono font-bold text-ink">
                                    {lotNumber.trim() || '—'}
                                </span>
                            </div>
                            <div className="flex items-center justify-between text-[12px]">
                                <span className="text-ink-muted">Số lượng nhập</span>
                                <span className="font-bold text-ink">
                                    {quantityNumber
                                        ? `${num(quantityNumber)} ${unitLabel[product.unit]}`
                                        : '—'}
                                </span>
                            </div>
                            <div className="flex items-center justify-between text-[12px]">
                                <span className="text-ink-muted">Đơn giá</span>
                                <span className="font-bold text-ink">
                                    {unitPrice
                                        ? `${fmtMoney(unitPriceNumber)}/${unitLabel[product.unit]}`
                                        : '—'}
                                </span>
                            </div>
                            <div className="flex items-center justify-between text-[12px]">
                                <span className="text-ink-muted">Nhà cung cấp</span>
                                <span className="max-w-[62%] text-right font-bold text-ink">
                                    {supplierName.trim() || '—'}
                                </span>
                            </div>
                            <div className="flex items-center justify-between border-t border-line-soft pt-2.5">
                                <span className="text-[12px] font-semibold text-ink-soft">
                                    Tổng giá trị nhập
                                </span>
                                <span className="font-display text-[17px] font-extrabold text-ocean-600">
                                    {fmtMoney(totalValue)}
                                </span>
                            </div>
                            <div className="rounded-lg bg-teal-50 px-3 py-2 text-[10px] text-teal-700">
                                Tồn sau nhập dự kiến:{' '}
                                <b>
                                    {num(product.currentStock + quantityNumber)}{' '}
                                    {unitLabel[product.unit]}
                                </b>
                            </div>
                        </div>
                    </div>
                )}

                <Field label="Lý do nhập / ghi chú">
                    <input
                        className={inputClass}
                        placeholder="VD: Nhập kho theo hóa đơn 09/2026"
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                    />
                </Field>

                <div className="pt-2">
                    <PrimaryButton full icon={saving ? undefined : Icons.box} onClick={submit}>
                        {saving ? 'Đang ghi nhận…' : 'Xác nhận nhập kho'}
                    </PrimaryButton>
                </div>
            </div>
        </div>
    );
}

// Manual stock-out is deliberately separate from KTV operation consumption.
// Owner selects one physical lot so cost and responsibility remain traceable.
export function StockOut({ productId }: { productId: string }) {
    const nav = useNav();
    const product = ownerProducts.find((item) => item.id === productId);
    const parentFarm = product ? ownerFarms.find((farm) => farm.id === product.farmId) : undefined;
    const lots = product ? balancesForProduct(product.id) : [];
    const [lotId, setLotId] = useState(lots[0]?.id ?? '');
    const [reasonType, setReasonType] = useState<
        'expired' | 'supplier_return' | 'damaged' | 'quality_issue' | 'other'
    >('expired');
    const [quantity, setQuantity] = useState('');
    const [note, setNote] = useState('');
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [showConfirm, setShowConfirm] = useState(false);

    if (!product || product.isDeleted || !parentFarm || parentFarm.isDeleted) {
        return (
            <div className="pb-8">
                <ScreenHeader title="Xuất kho" />
                <div className="px-4">
                    <EmptyState icon={Icons.box} title="Không tìm thấy vật tư" />
                </div>
            </div>
        );
    }

    const selectedLot = lots.find((lot) => lot.id === lotId);
    const quantityNumber = Number(quantity) || 0;
    const plannedCount = plannedUseCountForProduct(product.id);
    const reasonLabels = {
        expired: 'Hàng hết hạn',
        supplier_return: 'Trả nhà cung cấp',
        damaged: 'Bao bì hư hỏng',
        quality_issue: 'Không đạt chất lượng',
        other: 'Lý do khác',
    } as const;

    const validate = () => {
        const next: Record<string, string> = {};
        if (!selectedLot) next.lotId = 'Vui lòng chọn lô còn tồn.';
        if (!quantity || !Number.isFinite(Number(quantity)) || quantityNumber <= 0)
            next.quantity = 'Số lượng xuất phải lớn hơn 0.';
        else if (selectedLot && quantityNumber > selectedLot.quantity)
            next.quantity = `Không được vượt tồn lô ${num(selectedLot.quantity)} ${unitLabel[product.unit]}.`;
        if (!note.trim()) next.note = 'Lý do là bắt buộc để truy vết.';
        return next;
    };

    const requestConfirm = () => {
        const next = validate();
        setErrors(next);
        if (Object.keys(next).length === 0) setShowConfirm(true);
    };

    const submit = () => {
        if (!selectedLot) return;
        const timestamp = new Date().toISOString();
        selectedLot.quantity -= quantityNumber;
        selectedLot.updatedAt = timestamp;
        product.currentStock -= quantityNumber;
        inventoryTransactions.push({
            id: `IT-${Date.now().toString(36)}`,
            productId: product.id,
            transactionType: 'stock_out',
            quantity: quantityNumber,
            totalAmount: quantityNumber * selectedLot.unitPrice,
            lotNumber: selectedLot.lotNumber,
            reason: `${reasonLabels[reasonType]}: ${note.trim()}`,
            performedBy: currentUser.name,
            createdAt: timestamp,
        });
        setShowConfirm(false);
        nav.toast(
            `Đã xuất ${num(quantityNumber)} ${unitLabel[product.unit]} từ lô ${selectedLot.lotNumber}.`,
            'success',
        );
        nav.back();
    };

    return (
        <div className="pb-8">
            <ScreenHeader title="Xuất kho" subtitle={product.name} />
            <div className="space-y-4 px-4">
                {plannedCount > 0 && (
                    <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-[11px] leading-relaxed text-rose-700">
                        Có {plannedCount} lịch vận hành đang dự kiến dùng vật tư này. Sau khi xuất,
                        hãy kiểm tra tồn khả dụng để tránh thiếu hàng khi KTV thực hiện.
                    </div>
                )}

                {lots.length === 0 ? (
                    <EmptyState
                        icon={Icons.box}
                        title="Không có lô còn tồn"
                        hint="Không thể tạo giao dịch xuất kho."
                    />
                ) : (
                    <>
                        <Field label="Lô xuất *" error={errors.lotId}>
                            <select
                                className={`${inputClass} ${errors.lotId ? 'border-rose-400' : ''}`}
                                value={lotId}
                                onChange={(event) => setLotId(event.target.value)}
                            >
                                {lots.map((lot) => (
                                    <option key={lot.id} value={lot.id}>
                                        {lot.lotNumber} · còn {num(lot.quantity)}{' '}
                                        {unitLabel[product.unit]}
                                    </option>
                                ))}
                            </select>
                        </Field>

                        <Field
                            label={`Số lượng xuất (${unitLabel[product.unit]}) *`}
                            error={errors.quantity}
                        >
                            <input
                                className={`${inputClass} ${errors.quantity ? 'border-rose-400' : ''}`}
                                inputMode="decimal"
                                placeholder="0"
                                value={quantity}
                                onChange={(event) => setQuantity(event.target.value)}
                            />
                        </Field>

                        <Field label="Lý do xuất *" error={errors.note}>
                            <textarea
                                className={`${inputClass} min-h-[74px] resize-none ${errors.note ? 'border-rose-400' : ''}`}
                                value={note}
                                onChange={(event) => setNote(event.target.value)}
                                placeholder="Mô tả tình trạng lô hoặc trả hàng…"
                            />
                        </Field>

                        <PrimaryButton full tone="rose" icon={Icons.x} onClick={requestConfirm}>
                            Kiểm tra và xuất kho
                        </PrimaryButton>
                    </>
                )}
            </div>

            <AppDialog
                open={showConfirm}
                onClose={() => setShowConfirm(false)}
                tone="danger"
                title="Xác nhận xuất khỏi kho?"
                description="Giao dịch kho là nhật ký bất biến; sau khi xác nhận không được sửa hoặc xóa."
                footer={
                    <div className="grid grid-cols-2 gap-2">
                        <GhostButton onClick={() => setShowConfirm(false)}>Quay lại</GhostButton>
                        <PrimaryButton tone="rose" onClick={submit}>
                            Xác nhận xuất
                        </PrimaryButton>
                    </div>
                }
            >
                {selectedLot && (
                    <div className="space-y-2 rounded-xl bg-slate-50 p-3 text-[11px]">
                        <div className="flex justify-between">
                            <span>Lô</span>
                            <b>{selectedLot.lotNumber}</b>
                        </div>
                        <div className="flex justify-between">
                            <span>Số lượng</span>
                            <b>
                                {num(quantityNumber)} {unitLabel[product.unit]}
                            </b>
                        </div>
                        <div className="flex justify-between">
                            <span>Lý do</span>
                            <b>{reasonLabels[reasonType]}</b>
                        </div>
                    </div>
                )}
            </AppDialog>
        </div>
    );
}

export function FarmStockHistory({
    farmId,
    referenceType,
    referenceId,
}: {
    farmId: string;
    referenceType?: string;
    referenceId?: string;
}) {
    const farm = ownerFarms.find((item) => item.id === farmId && !item.isDeleted);
    const farmProducts = ownerProducts.filter((item) => item.farmId === farmId);
    const farmProductIds = new Set(farmProducts.map((item) => item.id));
    const farmSeasons = ownerSeasons.filter((item) => item.farmId === farmId);
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');
    const [typeFilter, setTypeFilter] = useState<'all' | 'stock_in' | 'stock_out'>('all');
    const [productFilter, setProductFilter] = useState('all');
    const [seasonFilter, setSeasonFilter] = useState('all');
    const [filtersOpen, setFiltersOpen] = useState(false);

    if (!farm) {
        return (
            <div className="pb-8">
                <ScreenHeader title="Lịch sử giao dịch kho" />
                <div className="px-4">
                    <EmptyState icon={Icons.box} title="Không tìm thấy trang trại" />
                </div>
            </div>
        );
    }

    const visible = inventoryTransactions
        .filter((transaction) => farmProductIds.has(transaction.productId))
        .filter(
            (transaction) =>
                !referenceId ||
                (transaction.referenceType === referenceType &&
                    transaction.referenceId === referenceId),
        )
        .filter((transaction) => typeFilter === 'all' || transaction.transactionType === typeFilter)
        .filter((transaction) => productFilter === 'all' || transaction.productId === productFilter)
        .filter((transaction) => seasonFilter === 'all' || transaction.seasonId === seasonFilter)
        .filter((transaction) => !fromDate || transaction.createdAt.slice(0, 10) >= fromDate)
        .filter((transaction) => !toDate || transaction.createdAt.slice(0, 10) <= toDate)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    const totalInValue = visible
        .filter((item) => item.transactionType === 'stock_in')
        .reduce((sum, item) => sum + item.totalAmount, 0);
    const totalOutValue = visible
        .filter((item) => item.transactionType === 'stock_out')
        .reduce((sum, item) => sum + item.totalAmount, 0);
    const activeFilterCount = [
        !!fromDate,
        !!toDate,
        typeFilter !== 'all',
        productFilter !== 'all',
        seasonFilter !== 'all',
    ].filter(Boolean).length;
    const resetFilters = () => {
        setFromDate('');
        setToDate('');
        setTypeFilter('all');
        setProductFilter('all');
        setSeasonFilter('all');
    };

    return (
        <div className="pb-8">
            <ScreenHeader title="Lịch sử giao dịch kho" subtitle={farm.name} />
            <div className="space-y-4 px-4">
                <div>
                    <button
                        type="button"
                        onClick={() => setFiltersOpen((current) => !current)}
                        aria-expanded={filtersOpen}
                        className={`flex min-h-14 w-full items-center gap-3 rounded-2xl border px-4 text-left shadow-[0_2px_10px_rgba(0,0,0,.04)] transition ${filtersOpen ? 'border-ocean-300 bg-ocean-50' : 'border-line bg-white'}`}
                    >
                        <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-ocean-100 text-ocean-700">
                            <Icons.filter size={17} />
                        </span>
                        <span className="min-w-0 flex-1">
                            <span className="block text-[12px] font-bold text-ink">
                                Bộ lọc truy vết
                            </span>
                            <span className="block truncate text-[10px] text-ink-muted">
                                {activeFilterCount > 0
                                    ? `${activeFilterCount} điều kiện đang áp dụng`
                                    : 'Thời gian · hình thức · vật tư · vụ nuôi'}
                            </span>
                        </span>
                        {activeFilterCount > 0 && (
                            <span className="grid size-6 place-items-center rounded-full bg-ocean-500 text-[10px] font-bold text-white">
                                {activeFilterCount}
                            </span>
                        )}
                        <Icons.chevronD
                            size={16}
                            className={`shrink-0 text-ink-muted transition-transform ${filtersOpen ? 'rotate-180' : ''}`}
                        />
                    </button>

                    {filtersOpen && (
                        <div className="mt-2 space-y-3 rounded-2xl border border-ocean-100 bg-white p-3.5 shadow-[0_8px_24px_rgba(15,71,109,.08)]">
                            <div className="grid grid-cols-2 gap-2">
                                <Field label="Từ ngày">
                                    <input
                                        type="date"
                                        className={inputClass}
                                        value={fromDate}
                                        max={toDate || undefined}
                                        onChange={(event) => setFromDate(event.target.value)}
                                    />
                                </Field>
                                <Field label="Đến ngày">
                                    <input
                                        type="date"
                                        className={inputClass}
                                        value={toDate}
                                        min={fromDate || undefined}
                                        onChange={(event) => setToDate(event.target.value)}
                                    />
                                </Field>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <Field label="Hình thức">
                                    <select
                                        className={inputClass}
                                        value={typeFilter}
                                        onChange={(event) =>
                                            setTypeFilter(event.target.value as typeof typeFilter)
                                        }
                                    >
                                        <option value="all">Tất cả</option>
                                        <option value="stock_in">Nhập kho</option>
                                        <option value="stock_out">Xuất kho</option>
                                    </select>
                                </Field>
                                <Field label="Vật tư">
                                    <select
                                        className={inputClass}
                                        value={productFilter}
                                        onChange={(event) => setProductFilter(event.target.value)}
                                    >
                                        <option value="all">Tất cả vật tư</option>
                                        {farmProducts.map((product) => (
                                            <option key={product.id} value={product.id}>
                                                {product.name}
                                            </option>
                                        ))}
                                    </select>
                                </Field>
                            </div>
                            <Field label="Vụ nuôi liên quan">
                                <select
                                    className={inputClass}
                                    value={seasonFilter}
                                    onChange={(event) => setSeasonFilter(event.target.value)}
                                >
                                    <option value="all">Tất cả, kể cả không gắn vụ</option>
                                    {farmSeasons.map((season) => (
                                        <option key={season.id} value={season.id}>
                                            {season.name} · {season.pondName}
                                        </option>
                                    ))}
                                </select>
                            </Field>
                            <div className="grid grid-cols-2 gap-2 border-t border-line-soft pt-3">
                                <GhostButton full onClick={resetFilters}>
                                    Đặt lại
                                </GhostButton>
                                <PrimaryButton full onClick={() => setFiltersOpen(false)}>
                                    Xem kết quả
                                </PrimaryButton>
                            </div>
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-3 gap-2">
                    <InventoryStat label="Giao dịch" value={visible.length.toString()} />
                    <InventoryStat label="Giá trị nhập" value={compactMoney(totalInValue)} />
                    <InventoryStat label="Giá trị xuất" value={compactMoney(totalOutValue)} />
                </div>

                {visible.length === 0 ? (
                    <EmptyState
                        icon={Icons.search}
                        title="Không có giao dịch phù hợp"
                        hint="Thử thay đổi khoảng ngày hoặc bộ lọc."
                    />
                ) : (
                    <div className="space-y-2.5">
                        {visible.map((transaction) => {
                            const product = ownerProducts.find(
                                (item) => item.id === transaction.productId,
                            )!;
                            const season = transaction.seasonId
                                ? ownerSeasons.find((item) => item.id === transaction.seasonId)
                                : undefined;
                            const isIn = transaction.transactionType === 'stock_in';
                            return (
                                <div key={transaction.id} className="card p-3.5">
                                    <div className="flex items-start gap-3">
                                        <span
                                            className={`grid size-9 shrink-0 place-items-center rounded-xl ${isIn ? 'bg-teal-50 text-teal-600' : 'bg-rose-50 text-rose-600'}`}
                                        >
                                            {isIn ? (
                                                <Icons.plus size={15} />
                                            ) : (
                                                <Icons.x size={15} />
                                            )}
                                        </span>
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="min-w-0">
                                                    <div className="truncate text-[12px] font-bold text-ink">
                                                        {product.name}
                                                    </div>
                                                    <div className="mt-0.5 text-[10px] text-ink-muted">
                                                        {transactionContextLabel(transaction) ===
                                                        'Nhập kho' ? (
                                                            <Badge tone="ocean">
                                                                {' '}
                                                                {transactionContextLabel(
                                                                    transaction,
                                                                )}{' '}
                                                            </Badge>
                                                        ) : (
                                                            <Badge tone="amber">
                                                                {' '}
                                                                {transactionContextLabel(
                                                                    transaction,
                                                                )}
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </div>
                                                <div
                                                    className={`shrink-0 text-right text-[13px] font-extrabold ${isIn ? 'text-teal-600' : 'text-rose-600'}`}
                                                >
                                                    {isIn ? '+' : '-'}
                                                    {num(transaction.quantity)}{' '}
                                                    {unitLabel[product.unit]}
                                                </div>
                                            </div>
                                            <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 rounded-xl text-[10px] text-ink-muted">
                                                <span>
                                                    Lô:{' '}
                                                    <b className="text-ink">
                                                        {transaction.lotNumber}
                                                    </b>
                                                </span>
                                                <span className="text-right">
                                                    {fmtDate(transaction.createdAt)}
                                                </span>
                                                <span>Người thực hiện</span>
                                                <b className="text-right text-ink">
                                                    {transaction.performedBy}
                                                </b>
                                                <span>Giá trị</span>
                                                <b className="text-right text-ink">
                                                    {fmtMoney(transaction.totalAmount)}
                                                </b>
                                                {season && (
                                                    <>
                                                        <span>Vụ nuôi</span>
                                                        <b className="text-right text-ink">
                                                            {season.name}
                                                        </b>
                                                    </>
                                                )}
                                                {transaction.referenceId && (
                                                    <>
                                                        <span>Tham chiếu</span>
                                                        <b className="break-all text-right font-mono text-ink">
                                                            {transaction.referenceId}
                                                        </b>
                                                    </>
                                                )}
                                            </div>
                                            {transaction.reason && (
                                                <div className="mt-2 text-[10px] italic leading-relaxed text-ink-muted">
                                                    Lý do: {transaction.reason}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
