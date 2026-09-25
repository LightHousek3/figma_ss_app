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
    CompactFilterTabs,
    taskStatusMeta,
    priorityMeta,
    AppDialog,
} from '../../app/ui';
import {
    ownerTasks,
    ownerPersonnel,
    ownerFarms,
    ownerSeasons,
    assignmentsForSeason,
    isSeasonVisibleToOwner,
    type OwnerTask,
} from '../../app/ownerData';
import { currentUser } from '../../app/data';
import { ScreenHeader, TopBar } from '../common';

const fmtDateTime = (iso?: string) => {
    if (!iso) return '—';
    return new Date(iso).toLocaleString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
    });
};

const isOverdue = (dueAt?: string, status?: string) => {
    if (!dueAt || status === 'completed' || status === 'cancelled') return false;
    return new Date(dueAt) < new Date();
};

const taskIsVisible = (task: OwnerTask) => {
    const farm = ownerFarms.find((item) => item.id === task.farmId);
    return !!farm && !farm.isDeleted && (!task.seasonId || isSeasonVisibleToOwner(task.seasonId));
};

// Owner may stop work that has not reached a terminal state. The service must
// re-check this transition to protect against stale mobile screens.
const canOwnerCancelTask = (task: OwnerTask) =>
    task.status === 'pending' || task.status === 'in_progress';

const selectedPriorityClass: Record<OwnerTask['priority'], string> = {
    low: 'border-slate-400 bg-slate-50 text-slate-700',
    normal: 'border-ocean-400 bg-ocean-50 text-ocean-700',
    high: 'border-amber-400 bg-amber-50 text-amber-700',
    urgent: 'border-rose-400 bg-rose-50 text-rose-700',
};

// ── UC 24: Task List ──────────────────────────────────────────────────────────

export function OwnerTasksList() {
    const nav = useNav();
    type Filter = 'active' | 'overdue' | 'completed' | 'cancelled';
    const [filter, setFilter] = useState<Filter>('active');

    const operationalTasks = ownerTasks.filter(taskIsVisible);
    const activeCount = operationalTasks.filter(canOwnerCancelTask).length;
    const overdueCount = operationalTasks.filter((task) =>
        isOverdue(task.dueAt, task.status),
    ).length;
    const visible = operationalTasks.filter((task) => {
        if (filter === 'active') return canOwnerCancelTask(task);
        if (filter === 'overdue') return isOverdue(task.dueAt, task.status);
        return task.status === filter;
    });

    return (
        <div className="pb-6">
            <TopBar
                title="Nhiệm vụ"
                subtitle="Phân công nhiệm vụ cho Kỹ thuật viên"
                right={
                    <button
                        onClick={() => nav.go('owner-task-create')}
                        className="grid size-10 shrink-0 place-items-center rounded-xl bg-ocean-500 text-white shadow-sm"
                    >
                        <Icons.plus size={20} />
                    </button>
                }
            />

            <div className="px-4 space-y-3">
                <CompactFilterTabs
                    value={filter}
                    onChange={setFilter}
                    options={[
                        { value: 'active', label: `Cần làm (${activeCount})` },
                        { value: 'overdue', label: `Quá hạn (${overdueCount})` },
                        { value: 'completed', label: 'Hoàn thành' },
                        { value: 'cancelled', label: 'Đã hủy' },
                    ]}
                />

                {visible.length === 0 ? (
                    <EmptyState
                        icon={Icons.checkList}
                        title="Không có nhiệm vụ"
                        hint="Nhấn 'Giao việc' để tạo nhiệm vụ mới."
                    />
                ) : (
                    <div className="space-y-2.5">
                        {visible.map((task) => (
                            <TaskCard
                                key={task.id}
                                task={task}
                                onClick={() => nav.go('owner-task-detail', { taskId: task.id })}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

function TaskCard({ task, onClick }: { task: OwnerTask; onClick: () => void }) {
    const sm = taskStatusMeta[task.status];
    const pm = priorityMeta[task.priority];
    const overdue = isOverdue(task.dueAt, task.status);

    return (
        <button
            onClick={onClick}
            className="flex w-full items-start gap-3 rounded-2xl bg-white px-4 py-3.5 text-left shadow-[0_2px_12px_rgba(0,0,0,.06)] transition active:scale-[0.99]"
        >
            <span
                className={`mt-0.5 grid size-9 shrink-0 place-items-center rounded-xl ${pm.tone === 'rose' ? 'bg-rose-50 text-rose-500' : pm.tone === 'amber' ? 'bg-amber-50 text-amber-500' : 'bg-ocean-50 text-ocean-500'}`}
            >
                <Icons.checkList size={16} />
            </span>
            <div className="min-w-0 flex-1">
                <div className="truncate text-[13px] font-bold text-ink">{task.title}</div>
                <div className="mt-0.5 flex items-center gap-1.5">
                    <Badge tone={pm.tone}>{pm.label}</Badge>
                    <Badge tone={sm.tone}>{sm.label}</Badge>
                    {overdue && <Badge tone="rose">Quá hạn</Badge>}
                </div>
                <div className="mt-1 text-[11px] text-ink-muted">
                    {task.assignedToName}
                    {task.dueAt && ` · Hạn ${fmtDateTime(task.dueAt)}`}
                </div>
            </div>
            <Icons.chevronR size={16} className="mt-1 shrink-0 text-ink-muted" />
        </button>
    );
}

// ── UC 25: Task Detail ────────────────────────────────────────────────────────

export function OwnerTaskDetail({ taskId }: { taskId: string }) {
    const nav = useNav();
    const task = ownerTasks.find((t) => t.id === taskId);
    if (!task || !taskIsVisible(task)) {
        return (
            <div className="pb-8">
                <ScreenHeader title="Chi tiết nhiệm vụ" />
                <div className="px-4">
                    <EmptyState
                        icon={Icons.checkList}
                        title="Không tìm thấy nhiệm vụ"
                        hint="Trang trại hoặc vụ nuôi liên quan không còn trong danh sách quản lý."
                    />
                </div>
            </div>
        );
    }

    const sm = taskStatusMeta[task.status];
    const pm = priorityMeta[task.priority];
    const overdue = isOverdue(task.dueAt, task.status);
    const isTerminal = task.status === 'completed' || task.status === 'cancelled';
    const canCancel = canOwnerCancelTask(task);

    const [showCancelConfirm, setShowCancelConfirm] = useState(false);
    const [cancelReason, setCancelReason] = useState('');
    const [cancelError, setCancelError] = useState('');

    const handleCancel = () => {
        if (!canOwnerCancelTask(task)) {
            setShowCancelConfirm(false);
            nav.toast('Nhiệm vụ đã kết thúc nên không thể hủy.', 'warning');
            return;
        }
        if (!cancelReason.trim()) {
            setCancelError('Vui lòng nhập lý do hủy nhiệm vụ.');
            return;
        }
        task.status = 'cancelled';
        task.cancellationReason = cancelReason.trim();
        task.cancelledByName = currentUser.name;
        task.cancelledAt = new Date().toISOString();
        task.updatedAt = task.cancelledAt;
        nav.toast('Nhiệm vụ đã được hủy.');
        nav.back();
    };

    return (
        <div className="pb-8">
            <ScreenHeader
                title="Chi tiết nhiệm vụ"
                right={
                    !isTerminal ? (
                        <button
                            onClick={() => nav.go('owner-task-edit', { taskId })}
                            className="grid size-9 place-items-center rounded-full bg-slate-50 text-ink-soft"
                        >
                            <Icons.edit size={17} />
                        </button>
                    ) : undefined
                }
            />
            <div className="px-4 space-y-4">
                {/* Task header */}
                <div className="rounded-2xl bg-white p-4 shadow-[0_2px_12px_rgba(0,0,0,.06)] space-y-3">
                    <div className="text-[16px] font-bold text-ink">{task.title}</div>
                    <div className="flex flex-wrap gap-1.5">
                        <Badge tone={pm.tone}>{pm.label}</Badge>
                        <Badge tone={sm.tone} dot>
                            {sm.label}
                        </Badge>
                        {overdue && <Badge tone="rose">Quá hạn</Badge>}
                    </div>
                    {task.description && (
                        <p className="text-[13px] leading-relaxed text-ink-soft">
                            {task.description}
                        </p>
                    )}
                </div>

                {/* Assignment info */}
                <div className="rounded-2xl bg-white p-4 shadow-[0_2px_12px_rgba(0,0,0,.06)] space-y-2.5">
                    <div className="flex items-center gap-3">
                        <span className="grid size-8 shrink-0 place-items-center rounded-full bg-ocean-50 text-ocean-500">
                            <Icons.user size={15} />
                        </span>
                        <div>
                            <div className="text-[10px] text-ink-muted">Giao cho</div>
                            <div className="text-[13px] font-bold text-ink">
                                {task.assignedToName}
                            </div>
                        </div>
                    </div>

                    {task.dueAt && (
                        <div className="flex items-center gap-3">
                            <span className="grid size-8 shrink-0 place-items-center rounded-full bg-amber-50 text-amber-500">
                                <Icons.clock size={15} />
                            </span>
                            <div>
                                <div className="text-[10px] text-ink-muted">Hạn hoàn thành</div>
                                <div
                                    className={`text-[13px] font-bold ${overdue ? 'text-rose-600' : 'text-ink'}`}
                                >
                                    {fmtDateTime(task.dueAt)}
                                </div>
                            </div>
                        </div>
                    )}

                    {task.seasonName && (
                        <div className="flex items-center gap-3">
                            <span className="grid size-8 shrink-0 place-items-center rounded-full bg-teal-50 text-teal-500">
                                <Icons.layers size={15} />
                            </span>
                            <div>
                                <div className="text-[10px] text-ink-muted">Vụ nuôi liên quan</div>
                                <div className="text-[13px] font-semibold text-ink">
                                    {task.seasonName}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {task.cancellationReason && (
                    <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3">
                        <div className="text-[11px] font-semibold text-rose-600">
                            Lý do hủy: {task.cancellationReason}
                        </div>
                        <div className="mt-1 text-[10px] text-rose-500">
                            {task.cancelledByName ?? task.assignedByName} ·{' '}
                            {fmtDateTime(task.cancelledAt ?? task.updatedAt)}
                        </div>
                    </div>
                )}

                {/* Actions */}
                {canCancel && (
                    <GhostButton full icon={Icons.x} onClick={() => setShowCancelConfirm(true)}>
                        Hủy nhiệm vụ
                    </GhostButton>
                )}
            </div>

            <AppDialog
                open={showCancelConfirm}
                tone="danger"
                title="Xác nhận hủy nhiệm vụ"
                description={
                    task.status === 'in_progress'
                        ? 'KTV đã bắt đầu thực hiện. Hủy lúc này sẽ dừng công việc nhưng vẫn giữ thời điểm bắt đầu và lý do để đối soát.'
                        : 'Nhiệm vụ chưa bắt đầu. Sau khi hủy, nhiệm vụ được giữ lại trong lịch sử để đối soát.'
                }
                onClose={() => setShowCancelConfirm(false)}
                footer={
                    <div className="grid grid-cols-2 gap-2">
                        <GhostButton onClick={() => setShowCancelConfirm(false)}>
                            Quay lại
                        </GhostButton>
                        <PrimaryButton tone="rose" onClick={handleCancel}>
                            Xác nhận hủy
                        </PrimaryButton>
                    </div>
                }
            >
                <Field label="Lý do hủy *" error={cancelError}>
                    <textarea
                        className={`${inputClass} min-h-[76px] resize-none ${cancelError ? 'border-rose-400' : ''}`}
                        placeholder="Nhập lý do hủy…"
                        value={cancelReason}
                        onChange={(e) => {
                            setCancelReason(e.target.value);
                            setCancelError('');
                        }}
                    />
                </Field>
            </AppDialog>
        </div>
    );
}

// ── UC 26/27: Task Create / Edit ──────────────────────────────────────────────

export function TaskCreateEdit({ taskId }: { taskId?: string }) {
    const nav = useNav();
    const existing = taskId ? ownerTasks.find((t) => t.id === taskId) : undefined;
    const isCreate = !existing;

    if (
        (taskId && !existing) ||
        (existing && !taskIsVisible(existing)) ||
        (!taskId && ownerFarms.every((farm) => farm.isDeleted))
    ) {
        return (
            <div className="pb-8">
                <ScreenHeader title={isCreate ? 'Tạo nhiệm vụ' : 'Chỉnh sửa nhiệm vụ'} />
                <div className="px-4">
                    <EmptyState
                        icon={Icons.checkList}
                        title="Không có dữ liệu vận hành"
                        hint="Cần ít nhất một trang trại đang hoạt động."
                    />
                </div>
            </div>
        );
    }

    if (existing && (existing.status === 'completed' || existing.status === 'cancelled')) {
        return (
            <div className="flex flex-col">
                <ScreenHeader title="Chỉnh sửa nhiệm vụ" />
                <div className="px-4 pt-6">
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-center">
                        <Icons.ban size={24} className="mx-auto mb-2 text-slate-400" />
                        <div className="text-[13px] text-ink-muted">
                            Nhiệm vụ đã ở trạng thái kết thúc. Không thể chỉnh sửa.
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    const activeFarms = ownerFarms.filter((farm) => !farm.isDeleted);
    const allActiveKtv = ownerPersonnel.filter(
        (p) => p.role === 'technician' && p.status === 'active',
    );

    const [title, setTitle] = useState(existing?.title ?? '');
    const [description, setDescription] = useState(existing?.description ?? '');
    const [priority, setPriority] = useState<OwnerTask['priority']>(existing?.priority ?? 'normal');
    const [dueAt, setDueAt] = useState(() => {
        if (existing?.dueAt) return existing.dueAt.slice(0, 16);
        return '';
    });
    const [assignedTo, setAssignedTo] = useState(existing?.assignedTo ?? '');
    const [farmId, setFarmId] = useState(existing?.farmId ?? activeFarms[0]?.id ?? '');
    const [seasonId, setSeasonId] = useState(existing?.seasonId ?? '');
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [saving, setSaving] = useState(false);

    const seasonsForFarm = ownerSeasons.filter(
        (s) =>
            s.farmId === farmId &&
            isSeasonVisibleToOwner(s.id) &&
            (s.status === 'active' || s.status === 'planning'),
    );
    const assignedTechnicianId = seasonId
        ? assignmentsForSeason(seasonId).find((assignment) => assignment.role === 'technician')
              ?.accountId
        : undefined;
    const ktvList = seasonId
        ? allActiveKtv.filter((person) => person.id === assignedTechnicianId)
        : allActiveKtv;

    const validate = () => {
        const e: Record<string, string> = {};
        if (!title.trim()) e.title = 'Tiêu đề nhiệm vụ không được để trống.';
        if (!assignedTo) e.assignedTo = 'Vui lòng chọn nhân sự.';
        const assignedPerson = ownerPersonnel.find((p) => p.id === assignedTo);
        if (assignedPerson && assignedPerson.status !== 'active')
            e.assignedTo = 'Chỉ có thể giao việc cho KTV đang hoạt động.';
        if (seasonId && assignedTo !== assignedTechnicianId)
            e.assignedTo = 'Nhiệm vụ của vụ nuôi phải giao cho KTV đang phụ trách vụ.';
        return e;
    };

    const submit = () => {
        const e = validate();
        setErrors(e);
        if (Object.keys(e).length) return;
        setSaving(true);
        window.setTimeout(() => {
            const person = ownerPersonnel.find((p) => p.id === assignedTo);
            if (existing) {
                existing.title = title.trim();
                existing.description = description.trim();
                existing.priority = priority;
                existing.dueAt = dueAt ? new Date(dueAt).toISOString() : existing.dueAt;
                existing.assignedTo = assignedTo;
                existing.assignedToName = person?.fullName ?? existing.assignedToName;
                existing.farmId = farmId;
                existing.seasonId = seasonId || undefined;
                existing.seasonName = seasonId
                    ? ownerSeasons.find((s) => s.id === seasonId)?.name
                    : undefined;
                existing.updatedAt = new Date().toISOString();
            } else {
                const now = new Date().toISOString();
                ownerTasks.unshift({
                    id: `T-${Date.now().toString(36).slice(-6)}`,
                    farmId,
                    seasonId: seasonId || undefined,
                    title: title.trim(),
                    description: description.trim() || undefined,
                    priority,
                    status: 'pending',
                    dueAt: dueAt ? new Date(dueAt).toISOString() : undefined,
                    assignedTo,
                    assignedToName: person?.fullName ?? 'KTV',
                    assignedByName: currentUser.name,
                    seasonName: seasonId
                        ? ownerSeasons.find((season) => season.id === seasonId)?.name
                        : undefined,
                    createdAt: now,
                    updatedAt: now,
                });
            }
            setSaving(false);
            nav.toast(
                isCreate
                    ? 'Nhiệm vụ đã được tạo và giao thành công.'
                    : 'Cập nhật nhiệm vụ thành công.',
            );
            nav.back();
        }, 700);
    };

    return (
        <div className="flex flex-col">
            <ScreenHeader title={isCreate ? 'Tạo & giao nhiệm vụ' : 'Chỉnh sửa nhiệm vụ'} />
            <div className="px-4 pt-4 pb-10 space-y-4">
                <Field label="Tiêu đề nhiệm vụ *" error={errors.title}>
                    <input
                        className={`${inputClass} ${errors.title ? 'border-rose-400' : ''}`}
                        placeholder="VD: Kiểm tra & xử lý NO2 cao tại Ao A3"
                        value={title}
                        autoFocus
                        onChange={(e) => {
                            setTitle(e.target.value);
                            setErrors((p) => ({ ...p, title: undefined! }));
                        }}
                    />
                </Field>

                <Field label="Mô tả">
                    <textarea
                        className={`${inputClass} min-h-[80px] resize-none`}
                        placeholder="Mô tả chi tiết nhiệm vụ…"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                    />
                </Field>

                <Field label="Mức độ ưu tiên *">
                    <div className="grid grid-cols-4 gap-1.5 mt-1">
                        {(['low', 'normal', 'high', 'urgent'] as const).map((p) => {
                            const pm = priorityMeta[p];
                            return (
                                <button
                                    key={p}
                                    onClick={() => setPriority(p)}
                                    className={`rounded-xl border py-2 text-[11px] font-bold transition ${priority === p ? selectedPriorityClass[p] : 'border-line bg-white text-ink-muted'}`}
                                >
                                    {pm.label}
                                </button>
                            );
                        })}
                    </div>
                </Field>

                <Field label="Hạn hoàn thành">
                    <input
                        type="datetime-local"
                        className={inputClass}
                        value={dueAt}
                        onChange={(e) => setDueAt(e.target.value)}
                    />
                </Field>

                <Field label="Trang trại *">
                    <select
                        className={inputClass}
                        value={farmId}
                        onChange={(e) => {
                            setFarmId(e.target.value);
                            setSeasonId('');
                        }}
                    >
                        {activeFarms.map((f) => (
                            <option key={f.id} value={f.id}>
                                {f.name}
                            </option>
                        ))}
                    </select>
                </Field>

                <Field label="Vụ nuôi liên quan">
                    <select
                        className={inputClass}
                        value={seasonId}
                        onChange={(e) => {
                            const value = e.target.value;
                            setSeasonId(value);
                            if (value) {
                                const technicianId = assignmentsForSeason(value).find(
                                    (assignment) => assignment.role === 'technician',
                                )?.accountId;
                                setAssignedTo(technicianId ?? '');
                            }
                        }}
                    >
                        <option value="">— Không gắn với vụ nuôi —</option>
                        {seasonsForFarm.map((s) => (
                            <option key={s.id} value={s.id}>
                                {s.pondName} · {s.name}
                            </option>
                        ))}
                    </select>
                </Field>

                <div>
                    <div className="mb-2 text-[12px] font-semibold text-ink-soft">
                        Giao cho Kỹ thuật viên *
                    </div>
                    {seasonId && (
                        <div className="mb-2 rounded-xl bg-ocean-50 px-3 py-2 text-[11px] leading-relaxed text-ocean-700">
                            Nhiệm vụ gắn với vụ nuôi được giao tự động cho KTV đang phụ trách để
                            đúng trách nhiệm vận hành.
                        </div>
                    )}
                    {ktvList.length === 0 ? (
                        <div className="rounded-xl border border-dashed border-line px-4 py-3 text-center text-[12px] text-ink-muted">
                            Không có KTV đang hoạt động.
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {ktvList.map((p) => (
                                <button
                                    key={p.id}
                                    onClick={() => {
                                        setAssignedTo(p.id);
                                        setErrors((prev) => ({ ...prev, assignedTo: undefined! }));
                                    }}
                                    className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left transition ${assignedTo === p.id ? 'border-ocean-400 bg-ocean-50' : 'border-line bg-white'}`}
                                >
                                    <div className="grid size-9 shrink-0 place-items-center rounded-full bg-ocean-100 font-display text-[14px] font-bold text-ocean-700">
                                        {p.fullName.split(' ').slice(-1)[0][0]}
                                    </div>
                                    <div className="flex-1 text-[13px] font-semibold text-ink">
                                        {p.fullName}
                                    </div>
                                    {assignedTo === p.id && (
                                        <Icons.check size={18} className="text-ocean-600" />
                                    )}
                                </button>
                            ))}
                        </div>
                    )}
                    {errors.assignedTo && (
                        <p className="mt-1 text-[11px] font-semibold text-rose-500">
                            {errors.assignedTo}
                        </p>
                    )}
                </div>

                <div className="pt-2">
                    <PrimaryButton full icon={saving ? undefined : Icons.check} onClick={submit}>
                        {saving ? 'Đang lưu…' : isCreate ? 'Tạo & giao nhiệm vụ' : 'Lưu thay đổi'}
                    </PrimaryButton>
                </div>
            </div>
        </div>
    );
}

function TaskAuditRow({ label, value, time }: { label: string; value: string; time: string }) {
    return (
        <div className="flex items-center gap-3 px-4 py-3">
            <span className="grid size-8 shrink-0 place-items-center rounded-full bg-ocean-50 text-ocean-600">
                <Icons.user size={14} />
            </span>
            <div className="min-w-0 flex-1">
                <div className="text-[10px] uppercase tracking-wide text-ink-muted">{label}</div>
                <div className="mt-0.5 text-[12px] font-semibold text-ink">{value}</div>
            </div>
            <span className="shrink-0 text-right text-[10px] text-ink-muted">
                {fmtDateTime(time)}
            </span>
        </div>
    );
}
