import { useState } from 'react';
import type React from 'react';
import { useNav } from '../../app/store';
import {
    Icons,
    Badge,
    Field,
    inputClass,
    PrimaryButton,
    GhostButton,
    DeleteConfirmDialog,
    EmptyState,
    num,
    seasonMeta,
} from '../../app/ui';
import {
    ownerFarms,
    ownerPonds,
    ownerSeasons,
    pendingProtocols,
    ownerProducts,
    ownerTasks,
    pondsForFarm,
    type OwnerFarm,
    type OwnerPond,
} from '../../app/ownerData';
import { ScreenHeader } from '../common';

// ── helpers ──────────────────────────────────────────────────────────────────

const pondStatusMeta: Record<
    OwnerPond['status'],
    {
        label: string;
        tone: 'teal' | 'amber' | 'slate';
    }
> = {
    available: { label: 'Sẵn sàng', tone: 'teal' },
    maintenance: { label: 'Đang bảo trì', tone: 'amber' },
    inactive: { label: 'Không hoạt động', tone: 'slate' },
};

const pondTypeMeta: Record<OwnerPond['type'], string> = {
    aquaculture: 'Ao nuôi',
    water_treatment: 'Ao xử lý nước',
};

// ── UC 1: Farm List ───────────────────────────────────────────────────────────

export function FarmList() {
    const nav = useNav();
    const [search, setSearch] = useState('');

    // Soft-deleted records stay in the audit trail but never return to the UI.
    const visible = ownerFarms.filter((f) => {
        const matchSearch = !search || f.name.toLowerCase().includes(search.toLowerCase());
        return !f.isDeleted && matchSearch;
    });

    return (
        <div className="pb-8">
            {/* AppBar */}
            <div className="flex items-start justify-between px-4 pb-2 pt-[52px]">
                <div className="min-w-0 flex-1">
                    <h1 className="font-display text-[22px] font-extrabold leading-tight tracking-tight text-ink">
                        Trang trại
                    </h1>
                    <p className="mt-0.5 text-[13px] text-ink-soft">Quản lý trại, ao và vụ nuôi</p>
                </div>
            </div>

            {/* Search */}
            <div className="px-4 pb-3 flex gap-2">
                <div className="flex flex-1 items-center gap-2 rounded-xl bg-white border border-line px-3 py-2">
                    <Icons.pin size={15} className="text-ink-muted shrink-0" />
                    <input
                        className="flex-1 text-[13px] bg-transparent outline-none placeholder:text-ink-muted"
                        placeholder="Tìm tên trang trại..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <button
                    onClick={() => nav.go('owner-farm-edit')}
                    className="grid size-10 shrink-0 place-items-center rounded-xl bg-ocean-500 text-white shadow-sm"
                    aria-label="Tạo trang trại"
                >
                    <Icons.plus size={20} />
                </button>
            </div>

            {/* List */}
            <div className="px-4 space-y-3">
                {visible.length === 0 ? (
                    <EmptyState
                        icon={Icons.building}
                        title={search ? 'Không tìm thấy trang trại' : 'Chưa có trang trại'}
                        hint={search ? 'Thử lại với tên khác.' : 'Nhấn + để tạo trang trại mới.'}
                    />
                ) : (
                    visible.map((farm) => {
                        const ponds = pondsForFarm(farm.id);
                        const active = ownerSeasons.filter(
                            (s) => s.farmId === farm.id && s.status === 'active',
                        ).length;
                        return (
                            <button
                                key={farm.id}
                                onClick={() => nav.go('owner-farm-detail', { farmId: farm.id })}
                                className="flex w-full items-center gap-3 rounded-2xl bg-white px-4 py-4 text-left shadow-[0_2px_12px_rgba(0,0,0,.06)] transition active:scale-[0.99]"
                            >
                                <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-ocean-50 text-ocean-600">
                                    <Icons.building size={20} />
                                </span>
                                <div className="min-w-0 flex-1">
                                    <div className="truncate text-[15px] font-bold text-ink">
                                        {farm.name}
                                    </div>
                                    {farm.address && (
                                        <div className="mt-0.5 truncate text-[12px] text-ink-muted">
                                            {farm.address}
                                        </div>
                                    )}
                                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                                        <Badge tone="ocean">{ponds.length} ao</Badge>
                                        <Badge tone="teal" dot>
                                            {active} vụ nuôi
                                        </Badge>
                                        {farm.totalAreaHectares && (
                                            <Badge tone="slate">{farm.totalAreaHectares} ha</Badge>
                                        )}
                                    </div>
                                </div>
                                <Icons.chevronR size={18} className="shrink-0 text-ink-muted" />
                            </button>
                        );
                    })
                )}
            </div>
        </div>
    );
}

// ── UC 2: Farm Detail ─────────────────────────────────────────────────────────

export function FarmDetail({ farmId }: { farmId: string }) {
    const nav = useNav();
    const farm = ownerFarms.find((f) => f.id === farmId);
    if (!farm || farm.isDeleted) {
        return (
            <div className="pb-8">
                <ScreenHeader title="Trang trại" />
                <div className="px-4">
                    <EmptyState
                        icon={Icons.building}
                        title="Không tìm thấy trang trại"
                        hint="Trang trại không còn trong danh sách quản lý."
                    />
                </div>
            </div>
        );
    }

    const ponds = ownerPonds.filter((p) => p.farmId === farmId && !p.isDeleted);
    const openSeasons = ownerSeasons.filter(
        (s) => s.farmId === farmId && (s.status === 'active' || s.status === 'planning'),
    );
    const pendingForFarm = pendingProtocols.filter(
        (p) => p.farmName === farm.name && p.status === 'pending_approval',
    );
    const activeProducts = ownerProducts.filter(
        (product) => product.farmId === farmId && !product.isDeleted,
    );
    const openTasks = ownerTasks.filter(
        (task) =>
            task.farmId === farmId && (task.status === 'pending' || task.status === 'in_progress'),
    );
    const activeSeasons = openSeasons.filter((season) => season.status === 'active');
    const deleteBlockers = [
        openSeasons.length > 0 ? `${openSeasons.length} vụ nuôi đang mở` : '',
        ponds.length > 0 ? `${ponds.length} ao còn trong danh sách` : '',
        activeProducts.length > 0 ? `${activeProducts.length} vật tư đang sử dụng trong kho` : '',
        openTasks.length > 0 ? `${openTasks.length} nhiệm vụ chưa kết thúc` : '',
        pendingForFarm.length > 0 ? `${pendingForFarm.length} phác đồ đang chờ duyệt` : '',
    ].filter(Boolean);
    const canDelete = deleteBlockers.length === 0;
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [pondSearch, setPondSearch] = useState('');
    const [pondStatusFilter, setPondStatusFilter] = useState<'all' | OwnerPond['status']>('all');
    const [pondTypeFilter, setPondTypeFilter] = useState<'all' | OwnerPond['type']>('all');
    const filteredPonds = ponds.filter(
        (pond) =>
            (!pondSearch.trim() ||
                pond.name.toLowerCase().includes(pondSearch.trim().toLowerCase())) &&
            (pondStatusFilter === 'all' || pond.status === pondStatusFilter) &&
            (pondTypeFilter === 'all' || pond.type === pondTypeFilter),
    );

    return (
        <div className="pb-8">
            <ScreenHeader
                title={farm.name}
                subtitle={farm.address}
                right={
                    <button
                        onClick={() => nav.go('owner-farm-edit', { farmId: farm.id })}
                        className="grid size-9 place-items-center rounded-full bg-slate-50 text-ink-soft active:bg-slate-100"
                        aria-label="Chỉnh sửa trang trại"
                    >
                        <Icons.edit size={17} />
                    </button>
                }
            />

            <div className="space-y-4 px-4">
                {/* Stats */}
                <div className="grid grid-cols-3 gap-2">
                    <div className="rounded-2xl border border-line bg-white/80 p-3">
                        <div className="text-[10px] font-semibold uppercase tracking-wide text-ink-muted">
                            Diện tích
                        </div>
                        <div className="mt-1 font-display text-[18px] font-bold text-ink">
                            {farm.totalAreaHectares ?? '—'}
                            {farm.totalAreaHectares && (
                                <span className="text-[11px] font-normal text-ink-muted"> ha</span>
                            )}
                        </div>
                    </div>
                    <div className="rounded-2xl border border-line bg-white/80 p-3">
                        <div className="text-[10px] font-semibold uppercase tracking-wide text-ink-muted">
                            Số ao
                        </div>
                        <div className="mt-1 font-display text-[18px] font-bold text-ink">
                            {ponds.length}
                        </div>
                    </div>
                    <div className="rounded-2xl border border-line bg-white/80 p-3">
                        <div className="text-[10px] font-semibold uppercase tracking-wide text-ink-muted">
                            Đang nuôi
                        </div>
                        <div className="mt-1 font-display text-[18px] font-bold text-teal-500">
                            {activeSeasons.length}
                        </div>
                    </div>
                </div>

                {(farm.address || (farm.latitude != null && farm.longitude != null)) && (
                    <div className="card space-y-3 p-4">
                        <div className="font-display text-[14px] font-bold text-ink">
                            Vị trí trang trại
                        </div>
                        {farm.address && (
                            <InfoRow
                                icon={<Icons.pin size={15} className="text-ocean-500" />}
                                label="Địa chỉ"
                                value={farm.address}
                            />
                        )}
                        {farm.latitude != null && farm.longitude != null && (
                            <div className="flex items-center gap-3">
                                <span className="shrink-0">
                                    <Icons.pin size={15} className="text-teal-500" />
                                </span>
                                <div className="min-w-0 flex-1">
                                    <div className="text-[11px] text-ink-muted">Tọa độ GPS</div>
                                    <div className="font-mono text-[12px] font-semibold text-ink">
                                        {farm.latitude}, {farm.longitude}
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() =>
                                        window.open(
                                            `https://www.google.com/maps?q=${farm.latitude},${farm.longitude}`,
                                            '_blank',
                                            'noopener,noreferrer',
                                        )
                                    }
                                    className="min-h-10 rounded-xl bg-ocean-50 px-3 text-[11px] font-bold text-ocean-600"
                                >
                                    Mở bản đồ
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* Inventory */}

                <div>
                    <div className="mb-2 flex items-center justify-between px-1">
                        <span className="font-display text-[15px] font-bold text-ink">Kho</span>
                    </div>
                    {/* Inventory shortcut */}
                    <button
                        onClick={() => nav.go('owner-inventory', { farmId })}
                        className="flex w-full items-center gap-3 rounded-2xl bg-white px-4 py-3.5 text-left shadow-[0_2px_12px_rgba(0,0,0,.06)]"
                    >
                        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-violet-50 text-violet-600">
                            <Icons.box size={18} />
                        </span>
                        <span className="flex-1 text-[14px] font-semibold text-ink">
                            Kho vật tư
                        </span>
                        <Icons.chevronR size={18} className="text-ink-muted" />
                    </button>
                </div>

                {/* Ponds list */}
                <div>
                    <div className="mb-2 flex items-center justify-between px-1">
                        <span className="font-display text-[15px] font-bold text-ink">
                            Danh sách ao
                        </span>
                        <button
                            onClick={() => nav.go('owner-pond-edit', { farmId })}
                            className="flex items-center gap-1 text-[12px] font-semibold text-ocean-600"
                        >
                            <Icons.plus size={14} /> Thêm ao
                        </button>
                    </div>
                    {ponds.length > 0 && (
                        <div className="mb-3 flex items-center gap-1.5">
                            <label className="flex min-w-0 flex-1 items-center gap-1.5 rounded-xl border border-line bg-white px-2.5 py-2">
                                <Icons.search size={13} className="shrink-0 text-ink-muted" />
                                <input
                                    value={pondSearch}
                                    onChange={(event) => setPondSearch(event.target.value)}
                                    placeholder="Tìm ao…"
                                    className="min-w-0 flex-1 bg-transparent text-[11px] outline-none placeholder:text-ink-muted"
                                />
                            </label>
                            <select
                                aria-label="Lọc trạng thái ao"
                                value={pondStatusFilter}
                                onChange={(event) =>
                                    setPondStatusFilter(
                                        event.target.value as 'all' | OwnerPond['status'],
                                    )
                                }
                                className="min-h-9 min-w-0 max-w-[104px] rounded-xl border border-line bg-white px-2 text-[10px] font-semibold text-ink-soft outline-none"
                            >
                                <option value="all">Trạng thái</option>
                                <option value="available">Sẵn sàng</option>
                                <option value="maintenance">Bảo trì</option>
                                <option value="inactive">Ngừng hoạt động</option>
                            </select>
                            <select
                                aria-label="Lọc loại ao"
                                value={pondTypeFilter}
                                onChange={(event) =>
                                    setPondTypeFilter(
                                        event.target.value as 'all' | OwnerPond['type'],
                                    )
                                }
                                className="min-h-9 min-w-0 max-w-[88px] rounded-xl border border-line bg-white px-2 text-[10px] font-semibold text-ink-soft outline-none"
                            >
                                <option value="all">Loại ao</option>
                                <option value="aquaculture">Ao nuôi</option>
                                <option value="water_treatment">Xử lý nước</option>
                            </select>
                        </div>
                    )}
                    {ponds.length === 0 ? (
                        <EmptyState
                            icon={Icons.drop}
                            title="Chưa có ao"
                            hint="Thêm ao để bắt đầu quản lý."
                        />
                    ) : filteredPonds.length === 0 ? (
                        <EmptyState
                            icon={Icons.search}
                            title="Không tìm thấy ao phù hợp"
                            hint="Thử đổi từ khóa hoặc bộ lọc."
                        />
                    ) : (
                        <div className="space-y-2">
                            {filteredPonds.map((pond) => {
                                const meta = pondStatusMeta[pond.status];
                                const currentSeason = pond.currentSeasonId
                                    ? ownerSeasons.find((s) => s.id === pond.currentSeasonId)
                                    : undefined;
                                return (
                                    <button
                                        key={pond.id}
                                        onClick={() =>
                                            nav.go('owner-pond-detail', { pondId: pond.id })
                                        }
                                        className="flex w-full items-center gap-3 rounded-2xl bg-white px-4 py-3 text-left shadow-[0_1px_8px_rgba(0,0,0,.05)] transition active:scale-[0.99]"
                                    >
                                        <span
                                            className={`grid size-9 shrink-0 place-items-center rounded-xl ${
                                                pond.type === 'aquaculture'
                                                    ? 'bg-ocean-50 text-ocean-600'
                                                    : 'bg-teal-50 text-teal-600'
                                            }`}
                                        >
                                            <Icons.drop size={16} />
                                        </span>
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-2">
                                                <span className="text-[13px] font-bold text-ink">
                                                    {pond.name}
                                                </span>
                                                <Badge tone={meta.tone}>{meta.label}</Badge>
                                            </div>
                                            <div className="mt-0.5 text-[11px] text-ink-muted">
                                                {pondTypeMeta[pond.type]}
                                                {pond.areaM2 ? ` · ${num(pond.areaM2)} m²` : ''}
                                                {currentSeason
                                                    ? ` · DOC ${currentSeason.dayOfCulture}`
                                                    : ''}
                                            </div>
                                        </div>
                                        <Icons.chevronR
                                            size={16}
                                            className="shrink-0 text-ink-muted"
                                        />
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>

                <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className={`flex w-full items-center justify-center gap-2 rounded-2xl border px-4 py-3 text-[14px] font-semibold transition ${canDelete ? 'border-rose-200 bg-rose-50 text-rose-600 active:bg-rose-100' : 'border-amber-200 bg-amber-50 text-amber-700'}`}
                >
                    <Icons.trash size={16} />
                    {'Xóa trang trại'}
                </button>
            </div>
            <DeleteConfirmDialog
                open={showDeleteConfirm}
                onClose={() => setShowDeleteConfirm(false)}
                entityLabel="trang trại"
                entityName={farm.name}
                blockers={deleteBlockers}
                retentionMessage="Trang trại sẽ biến mất khỏi danh sách vận hành. Dữ liệu lịch sử vẫn được giữ lại để truy vết."
                onConfirm={() => {
                    farm.isDeleted = true;
                    farm.deletedAt = new Date().toISOString();
                    nav.toast('Đã xóa trang trại.', 'success');
                    nav.back();
                }}
            />
        </div>
    );
}

// ── UC 3/4: Farm Edit (Create + Update) ───────────────────────────────────────
// DB constraints:
//   - name: required, ≥2 chars, unique per owner among non-deleted farms (case-insensitive)
//   - address: optional free text
//   - totalAreaHectares: optional, must be > 0 if provided
//   - On create: generated id, pondCount=0, activeSeasonsCount=0

export function FarmEdit({ farmId }: { farmId?: string }) {
    const nav = useNav();
    const existing = farmId ? ownerFarms.find((f) => f.id === farmId) : undefined;
    const isCreate = !existing;

    if (existing?.isDeleted) {
        return (
            <div className="pb-8">
                <ScreenHeader title="Chỉnh sửa trang trại" />
                <div className="px-4">
                    <EmptyState
                        icon={Icons.building}
                        title="Không tìm thấy trang trại"
                        hint="Trang trại không còn trong danh sách quản lý."
                    />
                </div>
            </div>
        );
    }

    const [name, setName] = useState(existing?.name ?? '');
    const [address, setAddress] = useState(existing?.address ?? '');
    const [area, setArea] = useState(existing?.totalAreaHectares?.toString() ?? '');
    const [latitude, setLatitude] = useState(existing?.latitude?.toString() ?? '');
    const [longitude, setLongitude] = useState(existing?.longitude?.toString() ?? '');
    const [locating, setLocating] = useState(false);
    const [locationAccuracy, setLocationAccuracy] = useState<number>();
    const [locationError, setLocationError] = useState('');
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [saving, setSaving] = useState(false);

    const latitudeValue = Number(latitude);
    const longitudeValue = Number(longitude);
    const hasMapLocation =
        latitude.trim() !== '' &&
        longitude.trim() !== '' &&
        Number.isFinite(latitudeValue) &&
        Number.isFinite(longitudeValue) &&
        latitudeValue >= -90 &&
        latitudeValue <= 90 &&
        longitudeValue >= -180 &&
        longitudeValue <= 180;
    const mapSpan = 0.012;
    const mapUrl = hasMapLocation
        ? `https://www.openstreetmap.org/export/embed.html?bbox=${longitudeValue - mapSpan}%2C${latitudeValue - mapSpan}%2C${longitudeValue + mapSpan}%2C${latitudeValue + mapSpan}&layer=mapnik&marker=${latitudeValue}%2C${longitudeValue}`
        : '';

    const useCurrentLocation = () => {
        setLocationError('');
        if (!navigator.geolocation) {
            setLocationError('Thiết bị này không hỗ trợ xác định vị trí.');
            return;
        }
        setLocating(true);
        navigator.geolocation.getCurrentPosition(
            ({ coords }) => {
                setLatitude(coords.latitude.toFixed(6));
                setLongitude(coords.longitude.toFixed(6));
                setLocationAccuracy(Math.round(coords.accuracy));
                setErrors((previous) => ({ ...previous, coordinates: '' }));
                setLocationError('');
                setLocating(false);
            },
            (error) => {
                const message =
                    error.code === error.PERMISSION_DENIED
                        ? 'Bạn chưa cho phép ứng dụng truy cập vị trí. Hãy cấp quyền rồi thử lại.'
                        : 'Chưa xác định được vị trí hiện tại. Hãy thử ở nơi có tín hiệu GPS tốt hơn.';
                setLocationError(message);
                setLocating(false);
            },
            { enableHighAccuracy: true, timeout: 12_000, maximumAge: 60_000 },
        );
    };

    const validate = () => {
        const e: Record<string, string> = {};

        const trimmedName = name.trim();
        if (!trimmedName) {
            e.name = 'Tên trang trại không được để trống.';
        } else if (trimmedName.length < 2) {
            e.name = 'Tên cần ít nhất 2 ký tự.';
        } else {
            // Unique per owner among non-deleted farms (DB partial unique index).
            const dup = ownerFarms.find(
                (f) =>
                    !f.isDeleted &&
                    f.name.trim().toLowerCase() === trimmedName.toLowerCase() &&
                    f.id !== farmId,
            );
            if (dup) e.name = 'Đã có trang trại tên này. Vui lòng dùng tên khác.';
        }

        if (area.trim()) {
            const areaNum = Number(area);
            if (isNaN(areaNum) || areaNum <= 0) e.area = 'Diện tích phải là số dương (VD: 3.5).';
        }
        if (!!latitude.trim() !== !!longitude.trim()) {
            e.coordinates = 'Vui lòng nhập đủ cả vĩ độ và kinh độ.';
        } else if (
            latitude.trim() &&
            (isNaN(Number(latitude)) || Number(latitude) < -90 || Number(latitude) > 90)
        ) {
            e.coordinates = 'Vĩ độ phải nằm trong khoảng -90 đến 90.';
        } else if (
            longitude.trim() &&
            (isNaN(Number(longitude)) || Number(longitude) < -180 || Number(longitude) > 180)
        ) {
            e.coordinates = 'Kinh độ phải nằm trong khoảng -180 đến 180.';
        }

        return e;
    };

    const submit = () => {
        const e = validate();
        setErrors(e);
        if (Object.keys(e).length) return;

        setSaving(true);
        window.setTimeout(() => {
            const trimmedName = name.trim();
            const areaNum = area.trim() ? Number(area) : undefined;
            const latitudeNum = latitude.trim() ? Number(latitude) : undefined;
            const longitudeNum = longitude.trim() ? Number(longitude) : undefined;

            if (existing) {
                // Update existing farm in-place
                existing.name = trimmedName;
                existing.address = address.trim() || undefined;
                existing.totalAreaHectares = areaNum ?? existing.totalAreaHectares;
                existing.latitude = latitudeNum;
                existing.longitude = longitudeNum;
            } else {
                // Create new farm — generate unique ID and push to array
                const newId = `F${ownerFarms.length + 1}-${Date.now().toString(36).slice(-4)}`;
                const newFarm: OwnerFarm = {
                    id: newId,
                    isDeleted: false,
                    name: trimmedName,
                    address: address.trim() || undefined,
                    totalAreaHectares: areaNum,
                    latitude: latitudeNum,
                    longitude: longitudeNum,
                    pondCount: 0,
                    activeSeasonsCount: 0,
                };
                ownerFarms.push(newFarm);
            }

            setSaving(false);
            nav.toast(
                isCreate ? 'Trang trại đã được tạo thành công.' : 'Cập nhật trang trại thành công.',
            );
            nav.back();
        }, 700);
    };

    return (
        <div className="flex flex-col">
            <ScreenHeader title={isCreate ? 'Tạo trang trại' : 'Chỉnh sửa trang trại'} />

            <div className="space-y-4 px-4 pt-4 pb-10">
                {/* Name — required, unique */}
                <Field label="Tên trang trại *" error={errors.name}>
                    <input
                        className={`${inputClass} ${errors.name ? 'border-rose-400' : ''}`}
                        placeholder="VD: Trang trại Cửa Lấp"
                        value={name}
                        autoFocus
                        onChange={(e) => {
                            setName(e.target.value);
                            if (errors.name) setErrors((p) => ({ ...p, name: '' }));
                        }}
                    />
                </Field>

                {/* Address — optional */}
                <Field label="Địa chỉ">
                    <input
                        className={inputClass}
                        placeholder="Xã, huyện, tỉnh…"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                    />
                </Field>

                {/* Area — optional, must be > 0 */}
                <Field label="Diện tích tổng (ha)" error={errors.area}>
                    <input
                        className={`${inputClass} ${errors.area ? 'border-rose-400' : ''}`}
                        inputMode="decimal"
                        placeholder="VD: 3.5"
                        value={area}
                        onChange={(e) => {
                            setArea(e.target.value);
                            if (errors.area) setErrors((p) => ({ ...p, area: '' }));
                        }}
                    />
                </Field>

                <div className="overflow-hidden rounded-2xl border border-line bg-white">
                    <div className="flex items-start justify-between gap-3 p-4 pb-3">
                        <div>
                            <div className="text-[13px] font-bold text-ink">Vị trí trang trại</div>
                            <p className="mt-0.5 text-[10px] leading-relaxed text-ink-muted">
                                Chọn vị trí hiện tại để điền GPS tự động, hoặc điều chỉnh tọa độ bên
                                dưới nếu cần.
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={useCurrentLocation}
                            disabled={locating}
                            className="inline-flex min-h-10 shrink-0 items-center gap-1.5 rounded-xl bg-ocean-50 px-3 text-[11px] font-bold text-ocean-700 transition active:scale-[0.98] disabled:opacity-60"
                        >
                            <Icons.pin size={14} />
                            {locating ? 'Đang lấy GPS…' : 'Vị trí hiện tại'}
                        </button>
                    </div>

                    <div className="mx-4 mb-3 overflow-hidden rounded-xl border border-line-soft bg-slate-50">
                        {hasMapLocation ? (
                            <iframe
                                key={mapUrl}
                                title="Bản đồ vị trí trang trại"
                                src={mapUrl}
                                loading="lazy"
                                referrerPolicy="no-referrer-when-downgrade"
                                className="h-44 w-full border-0"
                            />
                        ) : (
                            <div className="grid h-36 place-items-center px-6 text-center">
                                <div>
                                    <span className="mx-auto grid size-10 place-items-center rounded-full bg-ocean-100 text-ocean-600">
                                        <Icons.pin size={18} />
                                    </span>
                                    <p className="mt-2 text-[11px] font-semibold text-ink-soft">
                                        Chọn vị trí hiện tại để xem bản đồ
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="px-4 pb-4">
                        <div className="grid grid-cols-2 gap-2">
                            <Field label="Vĩ độ">
                                <input
                                    className={`${inputClass} ${errors.coordinates ? 'border-rose-400' : ''}`}
                                    inputMode="decimal"
                                    placeholder="10.3462"
                                    value={latitude}
                                    onChange={(event) => {
                                        setLatitude(event.target.value);
                                        setLocationAccuracy(undefined);
                                        setLocationError('');
                                        setErrors((previous) => ({ ...previous, coordinates: '' }));
                                    }}
                                />
                            </Field>
                            <Field label="Kinh độ">
                                <input
                                    className={`${inputClass} ${errors.coordinates ? 'border-rose-400' : ''}`}
                                    inputMode="decimal"
                                    placeholder="107.0843"
                                    value={longitude}
                                    onChange={(event) => {
                                        setLongitude(event.target.value);
                                        setLocationAccuracy(undefined);
                                        setLocationError('');
                                        setErrors((previous) => ({ ...previous, coordinates: '' }));
                                    }}
                                />
                            </Field>
                        </div>
                        {errors.coordinates && (
                            <p className="mt-1 text-[11px] font-semibold text-rose-500">
                                {errors.coordinates}
                            </p>
                        )}
                        {locationError && (
                            <p className="mt-2 text-[11px] font-semibold leading-relaxed text-rose-500">
                                {locationError}
                            </p>
                        )}
                        {locationAccuracy != null && (
                            <div className="mt-2 flex items-center justify-between gap-2 rounded-lg bg-teal-50 px-3 py-2 text-[10px] text-teal-700">
                                <span className="font-semibold">Đã chọn vị trí hiện tại</span>
                                <span>Độ chính xác khoảng {locationAccuracy} m</span>
                            </div>
                        )}
                        {hasMapLocation && (
                            <a
                                href={`https://www.openstreetmap.org/?mlat=${latitudeValue}&mlon=${longitudeValue}#map=16/${latitudeValue}/${longitudeValue}`}
                                target="_blank"
                                rel="noreferrer"
                                className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-ocean-600"
                            >
                                Mở bản đồ lớn <Icons.chevronR size={12} />
                            </a>
                        )}
                        <p className="mt-2 text-[10px] leading-relaxed text-ink-muted">
                            Tọa độ giúp đối chiếu đúng vị trí khi trang trại có nhiều khu ao hoặc
                            địa chỉ khó tìm.
                        </p>
                    </div>
                </div>

                {/* Info note for create */}
                {isCreate && (
                    <div className="flex gap-2 rounded-xl border border-ocean-100 bg-ocean-50 px-4 py-3">
                        <div>
                            <Icons.info className="text-ocean-700" />
                        </div>
                        <p className="text-[12px] leading-relaxed text-ocean-700">
                            Sau khi tạo trang trại, bạn có thể thêm ao nuôi và bắt đầu quản lý vụ
                            nuôi.
                        </p>
                    </div>
                )}

                <div className="pt-2 space-y-2">
                    <PrimaryButton full icon={saving ? undefined : Icons.check} onClick={submit}>
                        {saving ? 'Đang lưu…' : isCreate ? 'Tạo trang trại' : 'Lưu thay đổi'}
                    </PrimaryButton>
                </div>
            </div>
        </div>
    );
}

// ── UC 7: Pond Detail ─────────────────────────────────────────────────────────

export function PondDetail({ pondId }: { pondId: string }) {
    const nav = useNav();
    const pond = ownerPonds.find((p) => p.id === pondId);
    const farm = pond ? ownerFarms.find((f) => f.id === pond.farmId) : undefined;
    if (!pond || pond.isDeleted || farm?.isDeleted) {
        return (
            <div className="pb-8">
                <ScreenHeader title="Ao nuôi" />
                <div className="px-4">
                    <EmptyState
                        icon={Icons.drop}
                        title="Không tìm thấy ao"
                        hint="Ao không còn trong danh sách quản lý."
                    />
                </div>
            </div>
        );
    }

    const seasons = ownerSeasons.filter((s) => s.pondId === pondId);
    const currentSeason = seasons.find((s) => s.status === 'active' || s.status === 'planning');
    const hasOpenSeason = !!currentSeason;
    const seasonIds = new Set(seasons.map((season) => season.id));
    const relatedOpenTasks = ownerTasks.filter(
        (task) =>
            !!task.seasonId &&
            seasonIds.has(task.seasonId) &&
            (task.status === 'pending' || task.status === 'in_progress'),
    );
    const relatedPendingProtocols = pendingProtocols.filter(
        (protocol) => seasonIds.has(protocol.seasonId) && protocol.status === 'pending_approval',
    );
    const pondDeleteBlockers = [
        hasOpenSeason ? 'Ao đang có vụ nuôi mở' : '',
        relatedOpenTasks.length > 0 ? `${relatedOpenTasks.length} nhiệm vụ chưa kết thúc` : '',
        relatedPendingProtocols.length > 0
            ? `${relatedPendingProtocols.length} phác đồ đang chờ duyệt`
            : '',
    ].filter(Boolean);
    const canDelete = pondDeleteBlockers.length === 0;
    const meta = pondStatusMeta[pond.status];
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [seasonSearch, setSeasonSearch] = useState('');
    const [seasonStatusFilter, setSeasonStatusFilter] = useState<
        'all' | 'planning' | 'active' | 'completed' | 'cancelled'
    >('all');
    const filteredSeasons = seasons.filter(
        (season) =>
            (!seasonSearch.trim() ||
                season.name.toLowerCase().includes(seasonSearch.trim().toLowerCase())) &&
            (seasonStatusFilter === 'all' || season.status === seasonStatusFilter),
    );
    const canCreateSeason =
        pond.type === 'aquaculture' && pond.status === 'available' && !hasOpenSeason;
    return (
        <div className="pb-8">
            <ScreenHeader
                title={pond.name}
                subtitle={farm?.name}
                right={
                    <button
                        onClick={() => nav.go('owner-pond-edit', { pondId, farmId: pond.farmId })}
                        className="grid size-9 place-items-center rounded-full bg-slate-50 text-ink-soft active:bg-slate-100"
                        aria-label="Chỉnh sửa ao"
                    >
                        <Icons.edit size={17} />
                    </button>
                }
            />

            <div className="px-4 space-y-4">
                {/* Pond info card */}
                <div className="rounded-2xl bg-white p-4 shadow-[0_2px_12px_rgba(0,0,0,.06)] space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                        <Badge tone={meta.tone}>{meta.label}</Badge>
                        <Badge tone="slate">{pondTypeMeta[pond.type]}</Badge>
                    </div>
                    {pond.areaM2 && (
                        <InfoRow
                            icon={<Icons.layers size={15} className="text-ocean-500" />}
                            label="Diện tích mặt nước"
                            value={`${num(pond.areaM2)} m²`}
                        />
                    )}
                    {pond.depthM && (
                        <InfoRow
                            icon={<Icons.drop size={15} className="text-ocean-500" />}
                            label="Độ sâu trung bình"
                            value={`${pond.depthM} m`}
                        />
                    )}
                    {pond.volumeM3 && (
                        <InfoRow
                            icon={<Icons.drop size={15} className="text-teal-500" />}
                            label="Thể tích nước"
                            value={`${num(pond.volumeM3)} m³`}
                        />
                    )}
                </div>

                {/* Season list and BR-FARM-02 creation entry. */}
                <div>
                    <div className="mb-2 flex items-center justify-between px-1">
                        <span className="font-display text-[15px] font-bold text-ink">Vụ nuôi</span>
                        {canCreateSeason && (
                            <button
                                type="button"
                                onClick={() => nav.go('owner-season-create', { pondId })}
                                className="inline-flex min-h-9 items-center gap-1 rounded-xl bg-ocean-50 px-3 text-[11px] font-bold text-ocean-700"
                            >
                                <Icons.plus size={13} /> Thêm vụ nuôi
                            </button>
                        )}
                    </div>

                    {seasons.length > 0 && (
                        <div className="mb-3 flex items-center gap-1.5">
                            <label className="flex min-w-0 flex-1 items-center gap-1.5 rounded-xl border border-line bg-white px-2.5 py-2">
                                <Icons.search size={13} className="shrink-0 text-ink-muted" />
                                <input
                                    value={seasonSearch}
                                    onChange={(event) => setSeasonSearch(event.target.value)}
                                    placeholder="Tìm vụ…"
                                    className="min-w-0 flex-1 bg-transparent text-[11px] outline-none placeholder:text-ink-muted"
                                />
                            </label>
                            <select
                                aria-label="Lọc trạng thái vụ nuôi"
                                value={seasonStatusFilter}
                                onChange={(event) =>
                                    setSeasonStatusFilter(
                                        event.target.value as typeof seasonStatusFilter,
                                    )
                                }
                                className="min-h-9 max-w-[132px] rounded-xl border border-line bg-white px-2 text-[10px] font-semibold text-ink-soft outline-none"
                            >
                                <option value="all">Trạng thái</option>
                                <option value="planning">Chuẩn bị</option>
                                <option value="active">Đang nuôi</option>
                                <option value="completed">Hoàn tất</option>
                                <option value="cancelled">Đã hủy</option>
                            </select>
                        </div>
                    )}

                    {seasons.length === 0 ? (
                        <div className="rounded-xl border border-dashed border-line px-4 py-4 text-center">
                            <div className="text-[12px] font-semibold text-ink-soft">
                                Chưa có vụ nuôi
                            </div>
                        </div>
                    ) : filteredSeasons.length === 0 ? (
                        <EmptyState
                            icon={Icons.search}
                            title="Không tìm thấy vụ phù hợp"
                            hint="Thử đổi từ khóa hoặc trạng thái."
                        />
                    ) : (
                        <div className="space-y-2">
                            {filteredSeasons.map((season) => (
                                <button
                                    key={season.id}
                                    onClick={() =>
                                        nav.go('owner-season-detail', { seasonId: season.id })
                                    }
                                    className="flex w-full items-center gap-3 rounded-2xl bg-white px-4 py-3 text-left shadow-[0_1px_8px_rgba(0,0,0,.05)] transition active:scale-[0.99]"
                                >
                                    <span
                                        className={`grid size-9 shrink-0 place-items-center rounded-xl ${season.status === 'active' ? 'bg-teal-50 text-teal-600' : 'bg-slate-50 text-slate-500'}`}
                                    >
                                        <Icons.layers size={16} />
                                    </span>
                                    <div className="min-w-0 flex-1">
                                        <div className="truncate text-[13px] font-bold text-ink">
                                            {season.name}
                                        </div>
                                        <div className="mt-0.5 text-[10px] text-ink-muted">
                                            {season.shrimpType === 'whiteleg'
                                                ? 'Tôm thẻ chân trắng'
                                                : 'Tôm sú'}
                                            {season.status === 'active'
                                                ? ` · DOC ${season.dayOfCulture}`
                                                : ''}
                                        </div>
                                    </div>
                                    <Badge
                                        tone={seasonMeta[season.status].tone}
                                        dot={season.status === 'active'}
                                    >
                                        {seasonMeta[season.status].label}
                                    </Badge>
                                    <Icons.chevronR size={15} className="shrink-0 text-ink-muted" />
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className={`flex w-full items-center justify-center gap-2 rounded-2xl border px-4 py-3 text-[14px] font-semibold transition ${canDelete ? 'border-rose-200 bg-rose-50 text-rose-600 active:bg-rose-100' : 'border-amber-200 bg-amber-50 text-amber-700'}`}
                >
                    <Icons.trash size={16} />
                    {'Xóa ao'}
                </button>
            </div>
            <DeleteConfirmDialog
                open={showDeleteConfirm}
                onClose={() => setShowDeleteConfirm(false)}
                entityLabel="ao"
                entityName={pond.name}
                blockers={pondDeleteBlockers}
                retentionMessage="Ao sẽ không còn xuất hiện trong vận hành. Các vụ nuôi cũ vẫn được giữ nguyên để đối soát."
                onConfirm={() => {
                    pond.isDeleted = true;
                    pond.deletedAt = new Date().toISOString();
                    const parentFarm = ownerFarms.find((item) => item.id === pond.farmId);
                    if (parentFarm) parentFarm.pondCount = pondsForFarm(pond.farmId).length;
                    nav.toast('Đã xóa ao.', 'success');
                    nav.back();
                }}
            />
        </div>
    );
}

// ── UC 8/9: Pond Edit (Create + Update) ───────────────────────────────────────
// DB constraints:
//   - name: required, unique per farm among non-deleted ponds (case-insensitive)
//   - type: aquaculture | water_treatment
//   - status: available | maintenance | inactive (cannot change if has open season)
//   - areaM2, depthM, volumeM3: optional, all must be > 0 if provided

export function PondEdit({ pondId, farmId }: { pondId?: string; farmId: string }) {
    const nav = useNav();
    const existing = pondId ? ownerPonds.find((p) => p.id === pondId) : undefined;
    const isCreate = !existing;
    const farm = ownerFarms.find((f) => f.id === farmId);

    if (existing?.isDeleted || farm?.isDeleted) {
        return (
            <div className="pb-8">
                <ScreenHeader title="Chỉnh sửa ao" />
                <div className="px-4">
                    <EmptyState
                        icon={Icons.drop}
                        title="Không tìm thấy ao"
                        hint="Ao không còn trong danh sách quản lý."
                    />
                </div>
            </div>
        );
    }

    // Check if pond has an open season (disables status change)
    const hasOpenSeason = existing
        ? ownerSeasons.some(
              (s) => s.pondId === existing.id && (s.status === 'active' || s.status === 'planning'),
          )
        : false;

    const [name, setName] = useState(existing?.name ?? '');
    const [type, setType] = useState<OwnerPond['type']>(existing?.type ?? 'aquaculture');
    const [status, setStatus] = useState<OwnerPond['status']>(existing?.status ?? 'available');
    const [area, setArea] = useState(existing?.areaM2?.toString() ?? '');
    const [depth, setDepth] = useState(existing?.depthM?.toString() ?? '');
    const [volume, setVolume] = useState(existing?.volumeM3?.toString() ?? '');
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [saving, setSaving] = useState(false);
    const calculatedVolume =
        Number(area) > 0 && Number(depth) > 0 ? Number(area) * Number(depth) : 0;
    const volumeVariancePct =
        calculatedVolume > 0 && Number(volume) > 0
            ? Math.abs(Number(volume) - calculatedVolume) / calculatedVolume
            : 0;

    const validate = () => {
        const e: Record<string, string> = {};
        const trimmedName = name.trim();

        if (!trimmedName) {
            e.name = 'Tên ao không được để trống.';
        } else {
            // Unique per farm among non-deleted ponds (DB partial unique index)
            const pondsInFarm = ownerPonds.filter((p) => p.farmId === farmId && !p.isDeleted);
            const dup = pondsInFarm.find(
                (p) => p.name.toLowerCase() === trimmedName.toLowerCase() && p.id !== pondId,
            );
            if (dup) e.name = 'Tên ao đã tồn tại trong trang trại này.';
        }

        if (area.trim() && (isNaN(Number(area)) || Number(area) <= 0))
            e.area = 'Diện tích phải là số dương.';
        if (depth.trim() && (isNaN(Number(depth)) || Number(depth) <= 0))
            e.depth = 'Độ sâu phải là số dương.';
        if (volume.trim() && (isNaN(Number(volume)) || Number(volume) <= 0))
            e.volume = 'Thể tích phải là số dương.';

        return e;
    };

    const submit = () => {
        const e = validate();
        setErrors(e);
        if (Object.keys(e).length) return;

        setSaving(true);
        window.setTimeout(() => {
            const trimmedName = name.trim();
            const areaNum = area.trim() ? Number(area) : undefined;
            const depthNum = depth.trim() ? Number(depth) : undefined;
            const volNum = volume.trim() ? Number(volume) : undefined;

            if (existing) {
                existing.name = trimmedName;
                existing.type = type;
                if (!hasOpenSeason) existing.status = status;
                if (areaNum !== undefined) existing.areaM2 = areaNum;
                if (depthNum !== undefined) existing.depthM = depthNum;
                if (volNum !== undefined) existing.volumeM3 = volNum;
            } else {
                const newId = `P-${farmId}-${Date.now().toString(36).slice(-4)}`;
                const newPond: OwnerPond = {
                    id: newId,
                    isDeleted: false,
                    farmId,
                    name: trimmedName,
                    type,
                    status,
                    areaM2: areaNum,
                    depthM: depthNum,
                    volumeM3: volNum,
                };
                ownerPonds.push(newPond);
                // Update farm's pondCount
                const f = ownerFarms.find((f) => f.id === farmId);
                if (f)
                    f.pondCount = ownerPonds.filter(
                        (p) => p.farmId === farmId && !p.isDeleted,
                    ).length;
            }

            setSaving(false);
            nav.toast(isCreate ? 'Ao đã được tạo thành công.' : 'Cập nhật ao thành công.');
            nav.back();
        }, 700);
    };

    return (
        <div className="flex flex-col">
            <ScreenHeader title={isCreate ? 'Thêm ao mới' : 'Chỉnh sửa ao'} subtitle={farm?.name} />

            <div className="space-y-4 px-4 pt-4 pb-10">
                {/* Name */}
                <Field label="Tên ao *" error={errors.name}>
                    <input
                        className={`${inputClass} ${errors.name ? 'border-rose-400' : ''}`}
                        placeholder="VD: Ao A3"
                        value={name}
                        autoFocus
                        onChange={(e) => {
                            setName(e.target.value);
                            if (errors.name) setErrors((p) => ({ ...p, name: '' }));
                        }}
                    />
                </Field>

                {/* Type */}
                <Field label="Loại ao">
                    <div className="mt-1 flex gap-2">
                        {(['aquaculture', 'water_treatment'] as const).map((t) => (
                            <button
                                key={t}
                                onClick={() => setType(t)}
                                className={`flex-1 rounded-xl border py-2.5 text-[13px] font-semibold transition ${
                                    type === t
                                        ? 'border-ocean-400 bg-ocean-50 text-ocean-700'
                                        : 'border-line bg-white text-ink-muted'
                                }`}
                            >
                                {pondTypeMeta[t]}
                            </button>
                        ))}
                    </div>
                </Field>

                {/* Status — disabled if has open season */}
                <Field
                    label="Trạng thái"
                    hint={hasOpenSeason ? 'Không thể thay đổi khi đang có vụ nuôi mở.' : undefined}
                >
                    <div className="mt-1 flex gap-2">
                        {(['available', 'maintenance', 'inactive'] as const).map((s) => (
                            <button
                                key={s}
                                onClick={() => !hasOpenSeason && setStatus(s)}
                                disabled={hasOpenSeason}
                                className={`flex-1 rounded-xl border py-2.5 text-[12px] font-semibold transition ${
                                    status === s
                                        ? 'border-ocean-400 bg-ocean-50 text-ocean-700'
                                        : 'border-line bg-white text-ink-muted'
                                } ${hasOpenSeason ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                {pondStatusMeta[s].label}
                            </button>
                        ))}
                    </div>
                </Field>

                {/* Optional dimensions */}
                <div className="rounded-2xl border border-line bg-white/60 p-4 space-y-3">
                    <p className="text-[12px] font-semibold text-ink-muted">Thông số ao</p>
                    <Field label="Diện tích mặt nước (m²) *" error={errors.area}>
                        <input
                            className={`${inputClass} ${errors.area ? 'border-rose-400' : ''}`}
                            inputMode="decimal"
                            placeholder="VD: 3200"
                            value={area}
                            onChange={(e) => {
                                setArea(e.target.value);
                                if (errors.area) setErrors((p) => ({ ...p, area: '' }));
                            }}
                        />
                    </Field>
                    <Field label="Độ sâu trung bình (m) *" error={errors.depth}>
                        <input
                            className={`${inputClass} ${errors.depth ? 'border-rose-400' : ''}`}
                            inputMode="decimal"
                            placeholder="VD: 1.4"
                            value={depth}
                            onChange={(e) => {
                                setDepth(e.target.value);
                                if (errors.depth) setErrors((p) => ({ ...p, depth: '' }));
                            }}
                        />
                    </Field>
                    <Field label="Thể tích nước (m³)" error={errors.volume}>
                        <input
                            className={`${inputClass} ${errors.volume ? 'border-rose-400' : ''}`}
                            inputMode="decimal"
                            placeholder="VD: 4480"
                            value={volume}
                            onChange={(e) => {
                                setVolume(e.target.value);
                                if (errors.volume) setErrors((p) => ({ ...p, volume: '' }));
                            }}
                        />
                    </Field>
                    {calculatedVolume > 0 && (
                        <div
                            className={`rounded-xl border px-3 py-2.5 ${volumeVariancePct > 0.1 ? 'border-amber-200 bg-amber-50' : 'border-teal-200 bg-teal-50'}`}
                        >
                            <div className="flex items-center justify-between gap-3">
                                <div>
                                    <div
                                        className={`text-[10px] font-semibold uppercase tracking-wide ${volumeVariancePct > 0.1 ? 'text-amber-600' : 'text-teal-600'}`}
                                    >
                                        Thể tích ước tính
                                    </div>
                                    <div
                                        className={`mt-0.5 text-[14px] font-bold ${volumeVariancePct > 0.1 ? 'text-amber-700' : 'text-teal-700'}`}
                                    >
                                        {num(calculatedVolume)} m³
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setVolume(calculatedVolume.toFixed(2).replace(/\.00$/, ''));
                                        setErrors((previous) => ({ ...previous, volume: '' }));
                                    }}
                                    className="min-h-10 rounded-xl bg-white px-3 text-[11px] font-bold text-ocean-600 shadow-sm"
                                >
                                    Dùng số này
                                </button>
                            </div>
                            <p
                                className={`mt-1 text-[10px] leading-relaxed ${volumeVariancePct > 0.1 ? 'text-amber-700' : 'text-teal-700'}`}
                            >
                                Diện tích × độ sâu.{' '}
                                {volumeVariancePct > 0.1
                                    ? 'Số đang nhập lệch trên 10%; hãy kiểm tra vì thể tích ảnh hưởng trực tiếp đến liều xử lý nước.'
                                    : 'Dùng làm cơ sở kiểm tra liều theo m³ nước.'}
                            </p>
                        </div>
                    )}
                </div>

                <div className="pt-2 space-y-2">
                    <PrimaryButton full icon={saving ? undefined : Icons.check} onClick={submit}>
                        {saving ? 'Đang lưu…' : isCreate ? 'Tạo ao' : 'Lưu thay đổi'}
                    </PrimaryButton>
                    {!saving && (
                        <GhostButton full onClick={nav.back}>
                            Hủy
                        </GhostButton>
                    )}
                </div>
            </div>
        </div>
    );
}

// ── shared sub-component ──────────────────────────────────────────────────────

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
    return (
        <div className="flex items-start gap-3">
            <span className="mt-0.5 shrink-0">{icon}</span>
            <div className="min-w-0 flex-1">
                <div className="text-[11px] text-ink-muted">{label}</div>
                <div className="text-[13px] font-semibold text-ink">{value}</div>
            </div>
        </div>
    );
}
