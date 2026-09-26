import { useNav } from '../../app/store';
import { Icons, Badge, num } from '../../app/ui';
import {
    ownerFarms,
    ownerSeasons,
    ownerPersonnel,
    pendingProtocols,
    ownerNotifications,
    ownerProducts,
    ownerTasks,
    ownerPonds,
    ownerDiseaseCases,
    isSeasonVisibleToOwner,
    isOwnerNotificationVisible,
} from '../../app/ownerData';
import { currentUser } from '../../app/data';

function StatCard({
    value,
    label,
    sub,
    color,
}: {
    value: string | number;
    label: string;
    sub?: string;
    color?: string;
}) {
    return (
        <div className="flex-1 rounded-2xl bg-white px-3 py-3 shadow-[0_2px_12px_rgba(0,0,0,.07)]">
            <div
                className={`font-display text-[22px] font-extrabold leading-none ${color ?? 'text-ink'}`}
            >
                {value}
            </div>
            <div className="mt-1 text-[11px] font-bold uppercase tracking-wide text-ink-muted">
                {label}
            </div>
            {sub && <div className="mt-0.5 text-[10px] text-ink-muted">{sub}</div>}
        </div>
    );
}

export default function OwnerHome() {
    const nav = useNav();
    const activeFarms = ownerFarms.filter((farm) => !farm.isDeleted);
    const activeFarmIds = new Set(activeFarms.map((farm) => farm.id));
    const activePondIds = new Set(
        ownerPonds
            .filter((pond) => !pond.isDeleted && activeFarmIds.has(pond.farmId))
            .map((pond) => pond.id),
    );
    const operationalSeasons = ownerSeasons.filter(
        (season) => activeFarmIds.has(season.farmId) && activePondIds.has(season.pondId),
    );
    const activeSeasons = operationalSeasons.filter((season) => season.status === 'active');
    const activeSeasonsCount = activeSeasons.length;
    const pendingItems = pendingProtocols.filter(
        (item) => item.status === 'pending_approval' && isSeasonVisibleToOwner(item.seasonId),
    );
    const pendingCount = pendingItems.length;
    const urgentTasks = ownerTasks.filter(
        (t) =>
            t.priority === 'urgent' &&
            t.status !== 'completed' &&
            t.status !== 'cancelled' &&
            activeFarmIds.has(t.farmId) &&
            (!t.seasonId || isSeasonVisibleToOwner(t.seasonId)),
    );
    const lowStockProducts = ownerProducts.filter(
        (product) =>
            !product.isDeleted &&
            activeFarmIds.has(product.farmId) &&
            product.currentStock < product.minAlertQuantity,
    );
    const openCases = ownerDiseaseCases.filter(
        (caseItem) => caseItem.status !== 'resolved' && isSeasonVisibleToOwner(caseItem.seasonId),
    );
    const unreadCount = ownerNotifications.filter(
        (notification) => !notification.read && isOwnerNotificationVisible(notification),
    ).length;

    const today = new Date().toLocaleDateString('vi-VN', {
        weekday: 'long',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    });

    return (
        <div className="pb-8">
            {/* AppBar */}
            <div className="flex items-start justify-between px-4 pb-3 pt-[52px]">
                <div>
                    <p className="text-[12px] text-ink-muted">{today}</p>
                    <h1 className="font-display text-[22px] font-extrabold leading-tight tracking-tight text-ink">
                        Xin chào, {currentUser.name.split(' ').slice(-1)[0]}
                    </h1>
                </div>
            </div>

            <div className="px-4 space-y-4">
                {/* KPI row */}
                <div className="flex gap-2.5">
                    <StatCard value={activeFarms.length} label="Trang trại" sub="Đang sỡ hữu" />
                    <StatCard
                        value={activeSeasonsCount}
                        label="Ao nuôi"
                        sub="Đang quản lý"
                        color="text-teal-600"
                    />
                    <StatCard
                        value={pendingCount}
                        label="Vụ nuôi"
                        sub="Đang hoạt động"
                        color={pendingCount > 0 ? 'text-amber-600' : 'text-ink'}
                    />
                </div>

                <div className="mb-2 flex items-center justify-between px-1">
                    <span className="font-display text-[15px] font-bold text-ink">
                        Cảnh báo quan trọng
                    </span>
                </div>

                {/* Alert banners */}
                {urgentTasks.length > 0 && (
                    <button
                        onClick={() => nav.setTab('owner-tasks')}
                        className="flex w-full items-center gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-left"
                    >
                        <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-rose-100 text-rose-500">
                            <Icons.warn size={18} />
                        </span>
                        <div className="flex-1">
                            <div className="text-[13px] font-bold text-rose-700">
                                {urgentTasks.length} nhiệm vụ khẩn cần xử lý
                            </div>
                            <div className="truncate text-[11px] text-rose-500">
                                {urgentTasks[0].title}
                            </div>
                        </div>
                        <Icons.chevronR size={16} className="text-rose-400" />
                    </button>
                )}

                {pendingCount > 0 && (
                    <button
                        onClick={() => nav.go('owner-protocol-approvals')}
                        className="flex w-full items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-left"
                    >
                        <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-amber-100 text-amber-600">
                            <Icons.protocol size={18} />
                        </span>
                        <div className="flex-1">
                            <div className="text-[13px] font-bold text-amber-700">
                                {pendingCount} phác đồ chờ phê duyệt
                            </div>
                            <div className="truncate text-[11px] text-amber-600">
                                {pendingItems[0].title}
                            </div>
                        </div>
                        <Icons.chevronR size={16} className="text-amber-400" />
                    </button>
                )}

                {lowStockProducts.length > 0 && (
                    <button
                        onClick={() =>
                            nav.go('owner-inventory', { farmId: lowStockProducts[0].farmId })
                        }
                        className="flex w-full items-center gap-3 rounded-2xl border border-violet-200 bg-violet-50 px-4 py-3 text-left"
                    >
                        <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-violet-100 text-violet-600">
                            <Icons.box size={18} />
                        </span>
                        <div className="flex-1">
                            <div className="text-[13px] font-bold text-violet-700">
                                {lowStockProducts.length} sản phẩm tồn kho thấp
                            </div>
                            <div className="truncate text-[11px] text-violet-600">
                                {lowStockProducts.map((p) => p.name).join(', ')}
                            </div>
                        </div>
                        <Icons.chevronR size={16} className="text-violet-400" />
                    </button>
                )}

                {openCases.length > 0 && (
                    <button
                        onClick={() => nav.go('owner-case-list')}
                        className="flex w-full items-center gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-left"
                    >
                        <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-rose-100 text-rose-500">
                            <Icons.diseaseCase size={18} />
                        </span>
                        <div className="min-w-0 flex-1">
                            <div className="text-[13px] font-bold text-rose-700">
                                {openCases.length} ca bệnh đang theo dõi
                            </div>
                            <div className="truncate text-[11px] text-rose-500">
                                {openCases[0].pondName} · {openCases[0].title}
                            </div>
                        </div>
                        <Icons.chevronR size={16} className="text-rose-400" />
                    </button>
                )}

                {/* My farms */}
                <div>
                    <div className="mb-2 flex items-center justify-between px-1">
                        <span className="font-display text-[15px] font-bold text-ink">
                            Trang trại của tôi
                        </span>
                        <button
                            onClick={() => nav.setTab('farm')}
                            className="text-[12px] font-semibold text-ocean-600"
                        >
                            Xem tất cả
                        </button>
                    </div>
                    <div className="space-y-2.5">
                        {activeFarms.map((farm) => {
                            const farmSeasons = operationalSeasons.filter(
                                (s) => s.farmId === farm.id,
                            );
                            const activeS = farmSeasons.filter((s) => s.status === 'active');
                            return (
                                <button
                                    key={farm.id}
                                    onClick={() => nav.go('owner-farm-detail', { farmId: farm.id })}
                                    className="flex w-full items-center gap-3 rounded-2xl bg-white px-4 py-3.5 text-left shadow-[0_2px_12px_rgba(0,0,0,.06)] transition active:scale-[0.99]"
                                >
                                    <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-ocean-50 text-ocean-600">
                                        <Icons.building size={19} />
                                    </span>
                                    <div className="min-w-0 flex-1">
                                        <div className="truncate text-[14px] font-bold text-ink">
                                            {farm.name}
                                        </div>
                                        <div className="text-[12px] text-ink-muted">
                                            {
                                                ownerPonds.filter(
                                                    (pond) =>
                                                        pond.farmId === farm.id && !pond.isDeleted,
                                                ).length
                                            }{' '}
                                            ao · {activeS.length} vụ đang nuôi
                                        </div>
                                    </div>
                                    <Icons.chevronR size={18} className="text-ink-muted" />
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Active seasons quick view */}
                <div>
                    <div className="mb-2 flex items-center justify-between px-1">
                        <span className="font-display text-[15px] font-bold text-ink">
                            Vụ đang nuôi
                        </span>
                    </div>
                    <div className="space-y-2">
                        {activeSeasons.map((s) => (
                            <button
                                key={s.id}
                                onClick={() => nav.go('owner-season-detail', { seasonId: s.id })}
                                className="flex w-full items-center gap-3 rounded-2xl bg-white px-4 py-3 text-left shadow-[0_1px_8px_rgba(0,0,0,.05)] transition active:scale-[0.99]"
                            >
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2">
                                        <span className="truncate text-[13px] font-bold text-ink">
                                            {s.pondName}
                                        </span>
                                        <Badge tone="teal" dot>
                                            DOC {s.dayOfCulture}
                                        </Badge>
                                    </div>
                                    <div className="truncate text-[11px] text-ink-muted">
                                        {s.farmName} ·{' '}
                                        {s.shrimpType === 'whiteleg' ? 'Tôm thẻ' : 'Tôm sú'}
                                    </div>
                                </div>
                                <Icons.chevronR size={16} className="text-ink-muted" />
                            </button>
                        ))}
                    </div>
                </div>

                {/* Personnel quick overview */}
                <div>
                    <div className="mb-2 px-1 font-display text-[15px] font-bold text-ink">
                        Nhân sự
                    </div>
                    <button
                        onClick={() => nav.go('owner-personnel-list')}
                        className="flex w-full items-center gap-3 rounded-2xl bg-white px-4 py-3.5 text-left shadow-[0_2px_12px_rgba(0,0,0,.06)]"
                    >
                        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-teal-50 text-teal-600">
                            <Icons.users size={19} />
                        </span>
                        <div className="flex-1">
                            <div className="text-[14px] font-bold text-ink">
                                {ownerPersonnel.filter((p) => p.role === 'technician').length} KTV
                                &middot; {ownerPersonnel.filter((p) => p.role === 'expert').length}{' '}
                                Chuyên gia
                            </div>
                            <div className="text-[12px] text-ink-muted">
                                {ownerPersonnel.filter((p) => p.status === 'active').length} đang
                                hoạt động
                            </div>
                        </div>
                        <Icons.chevronR size={18} className="text-ink-muted" />
                    </button>
                </div>
            </div>
        </div>
    );
}
