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
} from '../../app/ui';
import {
    ownerPersonnel,
    ownerSeasons,
    seasonAssignments,
    assignmentsForSeason,
    personnelCurrentAssignments,
    ownerTasks,
    ownerDiseaseCases,
    isSeasonVisibleToOwner,
    type Personnel,
    type SeasonAssignment,
} from '../../app/ownerData';
import { ScreenHeader } from '../common';

// ── helpers ───────────────────────────────────────────────────────────────────

const roleMeta = {
    technician: { label: 'Kỹ thuật viên', abbr: 'KTV', tone: 'ocean' as const },
    expert: { label: 'Chuyên gia thủy sản', abbr: 'Expert', tone: 'teal' as const },
};

const statusMeta = {
    pending_activation: { label: 'Chờ kích hoạt', tone: 'amber' as const },
    active: { label: 'Đang hoạt động', tone: 'teal' as const },
    inactive: { label: 'Không hoạt động', tone: 'slate' as const },
    blocked: { label: 'Đã khóa', tone: 'rose' as const },
};

const fmtDate = (iso?: string) =>
    iso
        ? new Date(iso).toLocaleDateString('vi-VN', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
          })
        : '—';

// ── UC 20: Personnel List ─────────────────────────────────────────────────────

export function PersonnelList() {
    const nav = useNav();
    const [roleFilter, setRoleFilter] = useState<'all' | 'technician' | 'expert'>('all');
    const [statusFilter, setStatusFilter] = useState<'all' | Personnel['status']>('all');
    const [search, setSearch] = useState('');
    const visible = ownerPersonnel.filter(
        (person) =>
            (roleFilter === 'all' || person.role === roleFilter) &&
            (statusFilter === 'all' || person.status === statusFilter) &&
            (!search.trim() ||
                person.fullName.toLowerCase().includes(search.trim().toLowerCase()) ||
                person.phone?.includes(search.trim())),
    );

    return (
        <div className="pb-8">
            <ScreenHeader title="Nhân sự" />
            <div className="px-4 space-y-3">
                <div className="flex items-center gap-2 rounded-xl border border-line bg-white px-3 py-2.5">
                    <Icons.users size={15} className="shrink-0 text-ink-muted" />
                    <input
                        className="min-w-0 flex-1 bg-transparent text-[13px] outline-none placeholder:text-ink-muted"
                        placeholder="Tìm kiếm theo tên"
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                    />
                </div>
                <div className="flex items-stretch gap-0.2">
                    <div className="min-w-0 flex-1">
                        <Segmented
                            fill
                            value={roleFilter}
                            onChange={setRoleFilter}
                            options={[
                                { value: 'all', label: 'Tất cả' },
                                { value: 'technician', label: 'KTV' },
                                { value: 'expert', label: 'Chuyên gia' },
                            ]}
                        />
                    </div>
                    <label className="relative w-[124px] shrink-0 flex">
                        <span className="sr-only">Lọc theo trạng thái nhân sự</span>
                        <select
                            aria-label="Lọc theo trạng thái nhân sự"
                            value={statusFilter}
                            onChange={(event) =>
                                setStatusFilter(event.target.value as 'all' | Personnel['status'])
                            }
                            className="h-[47px]! m-auto w-full appearance-none rounded-2xl border border-line bg-white p-1 pl-3 pr-8 text-[10px] font-semibold text-ink-soft outline-none transition focus:border-ocean-400 focus:ring-2 focus:ring-ocean-100"
                        >
                            <option value="all">Mọi trạng thái</option>
                            <option value="active">Hoạt động</option>
                            <option value="pending_activation">Chờ kích hoạt</option>
                            <option value="inactive">Không hoạt động</option>
                            <option value="blocked">Đã khóa</option>
                        </select>
                        <Icons.chevronD
                            size={14}
                            className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-muted"
                        />
                    </label>
                </div>

                {visible.length === 0 ? (
                    <EmptyState icon={Icons.users} title="Không có nhân sự" />
                ) : (
                    <div className="space-y-2.5">
                        {visible.map((p) => {
                            const assignments = personnelCurrentAssignments(p.id);
                            const rm = roleMeta[p.role];
                            const sm = statusMeta[p.status];
                            return (
                                <button
                                    key={p.id}
                                    onClick={() =>
                                        nav.go('owner-personnel-detail', { personId: p.id })
                                    }
                                    className="flex w-full items-center gap-3 rounded-2xl bg-white px-4 py-3.5 text-left shadow-[0_2px_12px_rgba(0,0,0,.06)] transition active:scale-[0.99]"
                                >
                                    <div
                                        className={`grid size-11 shrink-0 place-items-center rounded-full font-display text-[16px] font-bold text-white ${p.role === 'technician' ? 'bg-ocean-500' : 'bg-teal-600'}`}
                                    >
                                        {p.fullName.split(' ').slice(-1)[0][0]}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="truncate text-[14px] font-bold text-ink">
                                            {p.fullName}
                                        </div>
                                        <div className="mt-0.5 flex items-center gap-1.5">
                                            <Badge tone={rm.tone}>{rm.abbr}</Badge>
                                            <Badge tone={sm.tone}>{sm.label}</Badge>
                                        </div>
                                        {assignments.length > 0 && (
                                            <div className="mt-1 truncate text-[11px] text-ink-muted">
                                                {assignments.length === 1
                                                    ? `Đang phụ trách: ${assignments[0]?.pondName}`
                                                    : `Đang phụ trách ${assignments.length} vụ nuôi`}
                                            </div>
                                        )}
                                    </div>
                                    <Icons.chevronR size={16} className="shrink-0 text-ink-muted" />
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}

// ── UC 21: Personnel Detail ───────────────────────────────────────────────────

export function PersonnelDetail({ personId }: { personId: string }) {
    const nav = useNav();
    const person = ownerPersonnel.find((p) => p.id === personId);
    if (!person) return null;

    const rm = roleMeta[person.role];
    const sm = statusMeta[person.status];
    const currentAssignments = personnelCurrentAssignments(person.id);
    const allAssignments = seasonAssignments.filter(
        (a) => a.accountId === personId && isSeasonVisibleToOwner(a.seasonId),
    );
    const seasonsParticipated = new Set(
        seasonAssignments
            .filter(
                (assignment) =>
                    assignment.accountId === personId && assignment.role === person.role,
            )
            .map((assignment) => assignment.seasonId),
    ).size;
    const technicianTasks = ownerTasks.filter((task) => task.assignedTo === personId);
    const completedTasks = technicianTasks.filter((task) => task.status === 'completed');
    const onTimeCompletedTasks = completedTasks.filter(
        (task) => !task.dueAt || (!!task.completedAt && task.completedAt <= task.dueAt),
    );
    const onTimeRate = completedTasks.length
        ? Math.round((onTimeCompletedTasks.length / completedTasks.length) * 10_000) / 100
        : null;
    const expertCases = ownerDiseaseCases.filter((caseItem) => caseItem.expertId === person.id);
    const resolvedCases = expertCases.filter((caseItem) => caseItem.status === 'resolved');
    const resolutionDurations = resolvedCases
        .filter((caseItem) => !!caseItem.resolvedAt)
        .map(
            (caseItem) =>
                (new Date(caseItem.resolvedAt!).getTime() -
                    new Date(caseItem.createdAt).getTime()) /
                3_600_000,
        );
    const avgResolutionHours = resolutionDurations.length
        ? Math.round(
              (resolutionDurations.reduce((sum, value) => sum + value, 0) /
                  resolutionDurations.length) *
                  100,
          ) / 100
        : null;

    return (
        <div className="pb-8">
            <ScreenHeader title={person.fullName} />
            <div className="px-4 space-y-4">
                {/* Profile card */}
                <div className="rounded-2xl bg-white p-4 shadow-[0_2px_12px_rgba(0,0,0,.06)]">
                    <div className="flex items-center gap-4 pb-3">
                        <div
                            className={`grid size-14 shrink-0 place-items-center rounded-full font-display text-[22px] font-bold text-white ${person.role === 'technician' ? 'bg-ocean-500' : 'bg-teal-600'}`}
                        >
                            {person.fullName.split(' ').slice(-1)[0][0]}
                        </div>
                        <div>
                            <div className="text-[16px] font-bold text-ink">{person.fullName}</div>
                            <div className="mt-1 flex gap-1.5">
                                <Badge tone={rm.tone}>{rm.label}</Badge>
                                <Badge tone={sm.tone}>{sm.label}</Badge>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2.5 border-t border-slate-100 pt-3">
                        <InfoRow
                            icon={<Icons.mail size={15} className="text-ocean-500" />}
                            label="Email"
                            value={person.email}
                        />
                        {person.phone && (
                            <InfoRow
                                icon={<Icons.phone size={15} className="text-ocean-500" />}
                                label="Điện thoại"
                                value={person.phone}
                            />
                        )}
                        {person.activatedAt && (
                            <InfoRow
                                icon={<Icons.calendar size={15} className="text-ocean-500" />}
                                label="Tham gia hệ thống từ"
                                value={fmtDate(person.activatedAt)}
                            />
                        )}
                    </div>
                </div>

                {/* KPI projections map exactly to v_technician_kpi / v_expert_kpi. */}
                <div className="overflow-hidden rounded-2xl border border-line bg-white shadow-[0_2px_12px_rgba(0,0,0,.05)]">
                    <div className="flex items-start justify-between gap-3 border-b border-line-soft bg-slate-50 px-4 py-3">
                        <div>
                            <div className="font-display text-[14px] font-bold text-ink">
                                KPI vận hành
                            </div>
                            <p className="mt-0.5 text-[10px] leading-relaxed text-ink-muted">
                                Tổng hợp từ dữ liệu đã ghi nhận trong hệ thống
                            </p>
                        </div>
                        <Badge tone={person.role === 'technician' ? 'ocean' : 'teal'}>
                            {person.role === 'technician' ? 'Theo nhiệm vụ' : 'Theo ca bệnh'}
                        </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-2 p-3">
                        <PersonnelKpiCard
                            icon={Icons.layers}
                            label="Vụ đã tham gia"
                            value={seasonsParticipated.toLocaleString('vi-VN')}
                            hint="Bao gồm lịch sử phân công"
                            tone="ocean"
                        />
                        {person.role === 'technician' ? (
                            <>
                                <PersonnelKpiCard
                                    icon={Icons.checkList}
                                    label="Nhiệm vụ hoàn thành"
                                    value={completedTasks.length.toLocaleString('vi-VN')}
                                    hint="Trạng thái đã hoàn thành"
                                    tone="teal"
                                />
                                <PersonnelKpiCard
                                    icon={Icons.clock}
                                    label="Hoàn thành đúng hạn"
                                    value={onTimeCompletedTasks.length.toLocaleString('vi-VN')}
                                    hint="Không trễ hạn giao"
                                    tone="teal"
                                />
                                <PersonnelKpiCard
                                    icon={Icons.approve}
                                    label="Tỷ lệ đúng hạn"
                                    value={
                                        onTimeRate == null
                                            ? '—'
                                            : `${onTimeRate.toLocaleString('vi-VN')}%`
                                    }
                                    hint={
                                        onTimeRate == null
                                            ? 'Chưa có nhiệm vụ hoàn thành'
                                            : 'Đúng hạn / đã hoàn thành'
                                    }
                                    tone="amber"
                                />
                            </>
                        ) : (
                            <>
                                <PersonnelKpiCard
                                    icon={Icons.heart}
                                    label="Ca bệnh xử lý"
                                    value={expertCases.length.toLocaleString('vi-VN')}
                                    hint="Tất cả ca được phân công"
                                    tone="rose"
                                />
                                <PersonnelKpiCard
                                    icon={Icons.check}
                                    label="Ca đã giải quyết"
                                    value={resolvedCases.length.toLocaleString('vi-VN')}
                                    hint="Trạng thái đã giải quyết"
                                    tone="teal"
                                />
                                <PersonnelKpiCard
                                    icon={Icons.clock}
                                    label="Thời gian xử lý TB"
                                    value={
                                        avgResolutionHours == null
                                            ? '—'
                                            : `${avgResolutionHours.toLocaleString('vi-VN')} giờ`
                                    }
                                    hint={
                                        avgResolutionHours == null
                                            ? 'Chưa có ca đã giải quyết'
                                            : 'Từ lúc mở đến khi giải quyết'
                                    }
                                    tone="amber"
                                />
                            </>
                        )}
                    </div>
                </div>

                {/* Current assignments */}
                <div>
                    <div className="mb-2 px-1 font-display text-[14px] font-bold text-ink">
                        Phân công hiện tại
                    </div>
                    {currentAssignments.length === 0 ? (
                        <div className="rounded-xl border border-dashed border-line px-4 py-3 text-center text-[12px] text-ink-muted">
                            Chưa được phân công vào vụ nuôi nào.
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {currentAssignments.map(
                                (a, i) =>
                                    a && (
                                        <button
                                            key={i}
                                            onClick={() =>
                                                nav.go('owner-season-detail', {
                                                    seasonId: a.seasonId,
                                                })
                                            }
                                            className="flex w-full items-center gap-3 rounded-xl bg-white px-4 py-3 text-left shadow-[0_1px_6px_rgba(0,0,0,.05)]"
                                        >
                                            <div className="min-w-0 flex-1">
                                                <div className="text-[13px] font-semibold text-ink">
                                                    {a.pondName}
                                                </div>
                                                <div className="text-[11px] text-ink-muted">
                                                    {a.farmName} · {a.seasonName}
                                                </div>
                                            </div>
                                            <Icons.chevronR size={16} className="text-ink-muted" />
                                        </button>
                                    ),
                            )}
                        </div>
                    )}
                </div>

                {/* Assignment history */}
                {allAssignments.filter((a) => a.unassignedAt).length > 0 && (
                    <div>
                        <div className="mb-2 px-1 font-display text-[14px] font-bold text-ink">
                            Lịch sử phân công
                        </div>
                        <div className="space-y-2">
                            {allAssignments
                                .filter((a) => a.unassignedAt)
                                .map((a) => (
                                    <div
                                        key={a.id}
                                        className="rounded-xl bg-white px-4 py-3 shadow-[0_1px_6px_rgba(0,0,0,.05)] opacity-70"
                                    >
                                        <div className="text-[12px] font-semibold text-ink">
                                            {ownerSeasons.find((s) => s.id === a.seasonId)
                                                ?.pondName ?? a.seasonId}
                                        </div>
                                        <div className="text-[11px] text-ink-muted">
                                            {fmtDate(a.assignedAt)} → {fmtDate(a.unassignedAt)}
                                        </div>
                                        {a.replacementReason && (
                                            <div className="mt-1 text-[11px] text-ink-muted italic">
                                                {a.replacementReason}
                                            </div>
                                        )}
                                    </div>
                                ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
    return (
        <div className="flex items-center gap-3">
            <span className="shrink-0">{icon}</span>
            <div className="min-w-0">
                <div className="text-[10px] text-ink-muted">{label}</div>
                <div className="text-[13px] font-semibold text-ink">{value}</div>
            </div>
        </div>
    );
}

function PersonnelKpiCard({
    icon: Icon,
    label,
    value,
    hint,
    tone,
}: {
    icon: (props: { size?: number; className?: string }) => React.JSX.Element;
    label: string;
    value: string;
    hint: string;
    tone: 'ocean' | 'teal' | 'amber' | 'rose';
}) {
    const style = {
        ocean: 'bg-ocean-50 text-ocean-700',
        teal: 'bg-teal-50 text-teal-700',
        amber: 'bg-amber-50 text-amber-700',
        rose: 'bg-rose-50 text-rose-700',
    }[tone];
    return (
        <div className={`min-w-0 rounded-xl p-3 ${style}`}>
            <div className="flex items-center gap-1.5 text-[10px] font-semibold">
                <Icon size={13} />
                <span className="truncate">{label}</span>
            </div>
            <div className="mt-1.5 font-display text-[20px] font-extrabold">{value}</div>
            <div className="mt-0.5 text-[9px] leading-snug opacity-75">{hint}</div>
        </div>
    );
}

// ── UC 22/23: Assign / Replace Personnel ──────────────────────────────────────

export function AssignPersonnel({ seasonId }: { seasonId: string }) {
    const nav = useNav();
    const s = ownerSeasons.find((s) => s.id === seasonId);
    if (
        !s ||
        !isSeasonVisibleToOwner(seasonId) ||
        s.status === 'completed' ||
        s.status === 'cancelled'
    ) {
        return (
            <div className="pb-8">
                <ScreenHeader title="Phân công nhân sự" />
                <div className="px-4">
                    <EmptyState
                        icon={Icons.users}
                        title="Không thể phân công"
                        hint="Chỉ vụ đang chuẩn bị hoặc đang nuôi mới được thay đổi nhân sự."
                    />
                </div>
            </div>
        );
    }

    const currentAssignments = assignmentsForSeason(seasonId);
    const currentKtv = currentAssignments.find((a) => a.role === 'technician');
    const currentExpert = currentAssignments.find((a) => a.role === 'expert');

    const [role, setRole] = useState<'technician' | 'expert'>('technician');
    const [selectedId, setSelectedId] = useState('');
    const [replacementReason, setReplacementReason] = useState('');
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [saving, setSaving] = useState(false);

    const currentForRole = role === 'technician' ? currentKtv : currentExpert;
    const isReplace = !!currentForRole;
    const affectedTasks =
        currentForRole && role === 'technician'
            ? ownerTasks.filter(
                  (task) =>
                      task.seasonId === seasonId &&
                      task.assignedTo === currentForRole.accountId &&
                      (task.status === 'pending' || task.status === 'in_progress'),
              )
            : [];
    const affectedCases =
        currentForRole && role === 'expert'
            ? ownerDiseaseCases.filter(
                  (caseItem) => caseItem.seasonId === seasonId && caseItem.status !== 'resolved',
              )
            : [];

    // Filter eligible personnel: active + correct role + not already in this season
    const eligible = ownerPersonnel.filter((p) => {
        if (p.role !== role) return false;
        if (p.status !== 'active') return false;
        // Can't assign same person twice in same season
        const alreadyInSeason = currentAssignments.some((a) => a.accountId === p.id);
        if (alreadyInSeason) return false;
        return true;
    });

    const validate = () => {
        const e: Record<string, string> = {};
        if (!selectedId) e.selectedId = 'Vui lòng chọn nhân sự.';
        if (isReplace && !replacementReason.trim())
            e.replacementReason = 'Vui lòng nhập lý do thay nhân sự.';
        return e;
    };

    const submit = () => {
        const e = validate();
        setErrors(e);
        if (Object.keys(e).length) return;
        setSaving(true);
        window.setTimeout(() => {
            const person = ownerPersonnel.find((p) => p.id === selectedId);
            if (!person) {
                setSaving(false);
                return;
            }
            const now = new Date().toISOString();
            if (currentForRole) {
                currentForRole.unassignedAt = now;
                currentForRole.replacementReason = replacementReason.trim();
            }
            const newAssignment: SeasonAssignment = {
                id: `SA-${Date.now().toString(36).slice(-7)}`,
                seasonId,
                role,
                accountId: person.id,
                accountName: person.fullName,
                assignedAt: now,
            };
            seasonAssignments.push(newAssignment);
            if (role === 'technician') {
                s.ktvName = person.fullName;
                affectedTasks.forEach((task) => {
                    task.assignedTo = person.id;
                    task.assignedToName = person.fullName;
                    task.updatedAt = now;
                });
            } else {
                s.expertName = person.fullName;
                affectedCases.forEach((caseItem) => {
                    caseItem.expertName = person.fullName;
                    caseItem.updatedAt = now;
                });
            }
            setSaving(false);
            nav.toast(
                isReplace
                    ? `Đã thay nhân sự: ${person?.fullName}`
                    : `Đã phân công: ${person?.fullName}`,
            );
            nav.back();
        }, 700);
    };

    return (
        <div className="flex flex-col">
            <ScreenHeader
                title={isReplace ? 'Thay nhân sự' : 'Phân công nhân sự'}
                subtitle={`${s.pondName} · ${s.farmName}`}
            />
            <div className="px-4 pt-4 pb-10 space-y-4">
                {/* Role selector */}
                <Field label="Vai trò cần phân công">
                    <div className="flex gap-2 mt-1">
                        {(['technician', 'expert'] as const).map((r) => {
                            const current = r === 'technician' ? currentKtv : currentExpert;
                            return (
                                <button
                                    key={r}
                                    onClick={() => {
                                        setRole(r);
                                        setSelectedId('');
                                        setErrors({});
                                    }}
                                    className={`flex-1 rounded-xl border py-2.5 text-center transition ${role === r ? 'border-ocean-400 bg-ocean-50' : 'border-line bg-white'}`}
                                >
                                    <div
                                        className={`text-[12px] font-bold ${role === r ? 'text-ocean-700' : 'text-ink-muted'}`}
                                    >
                                        {roleMeta[r].abbr}
                                    </div>
                                    {current && (
                                        <div className="mt-0.5 truncate px-1 text-[10px] text-ink-muted">
                                            Hiện: {current.accountName.split(' ').slice(-1)[0]}
                                        </div>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </Field>

                {/* Current assignment info */}
                {currentForRole && (
                    <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
                        <div className="text-[12px] font-semibold text-amber-700">
                            Đang phân công: {currentForRole.accountName}
                        </div>
                        <div className="text-[11px] text-amber-600">
                            Chọn nhân sự mới để thực hiện thay thế.
                        </div>
                    </div>
                )}

                {isReplace && (affectedTasks.length > 0 || affectedCases.length > 0) && (
                    <div className="rounded-xl border border-ocean-200 bg-ocean-50 px-4 py-3">
                        <div className="text-[12px] font-bold text-ocean-700">
                            Phạm vi bàn giao tự động
                        </div>
                        <p className="mt-1 text-[11px] leading-relaxed text-ocean-700">
                            {role === 'technician'
                                ? `${affectedTasks.length} nhiệm vụ chưa kết thúc sẽ chuyển sang KTV mới; lịch sử người đã làm vẫn được giữ nguyên.`
                                : `${affectedCases.length} ca bệnh đang mở sẽ chuyển trách nhiệm theo dõi sang Chuyên gia mới; phản hồi cũ không thay đổi.`}
                        </p>
                    </div>
                )}

                {/* Personnel picker */}
                <div>
                    <div className="mb-2 text-[12px] font-semibold text-ink-soft">
                        Chọn nhân sự {roleMeta[role].label} *
                    </div>
                    {eligible.length === 0 ? (
                        <div className="rounded-xl border border-dashed border-line px-4 py-4 text-center text-[12px] text-ink-muted">
                            Không có {roleMeta[role].label} đang hoạt động khả dụng.
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {eligible.map((p) => {
                                const currentOtherAssignments = personnelCurrentAssignments(p.id);
                                return (
                                    <button
                                        key={p.id}
                                        onClick={() => {
                                            setSelectedId(p.id);
                                            setErrors((prev) => ({
                                                ...prev,
                                                selectedId: undefined!,
                                            }));
                                        }}
                                        className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left transition ${selectedId === p.id ? 'border-ocean-400 bg-ocean-50' : 'border-line bg-white'}`}
                                    >
                                        <div className="grid size-9 shrink-0 place-items-center rounded-full bg-ocean-100 font-display text-[14px] font-bold text-ocean-700">
                                            {p.fullName.split(' ').slice(-1)[0][0]}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className="text-[13px] font-bold text-ink">
                                                {p.fullName}
                                            </div>
                                            <div className="text-[11px] text-ink-muted">
                                                {currentOtherAssignments.length === 0
                                                    ? 'Chưa có vụ nào'
                                                    : `${currentOtherAssignments.length} vụ đang phụ trách`}
                                            </div>
                                        </div>
                                        {selectedId === p.id && (
                                            <Icons.check size={18} className="text-ocean-600" />
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    )}
                    {errors.selectedId && (
                        <p className="mt-1 text-[11px] font-semibold text-rose-500">
                            {errors.selectedId}
                        </p>
                    )}
                </div>

                {/* Replacement reason (only when replacing) */}
                {isReplace && (
                    <Field label="Lý do thay nhân sự *" error={errors.replacementReason}>
                        <textarea
                            className={`${inputClass} min-h-[72px] resize-none ${errors.replacementReason ? 'border-rose-400' : ''}`}
                            placeholder="Nhập lý do thay nhân sự phụ trách…"
                            value={replacementReason}
                            onChange={(e) => {
                                setReplacementReason(e.target.value);
                                setErrors((p) => ({ ...p, replacementReason: undefined! }));
                            }}
                        />
                    </Field>
                )}

                <div className="pt-2">
                    <PrimaryButton full icon={saving ? undefined : Icons.check} onClick={submit}>
                        {saving
                            ? 'Đang lưu…'
                            : isReplace
                              ? 'Xác nhận thay nhân sự'
                              : 'Xác nhận phân công'}
                    </PrimaryButton>
                </div>
            </div>
        </div>
    );
}
