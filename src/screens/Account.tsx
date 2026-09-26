import type React from 'react';
import { useNav } from '../app/store';
import { currentUser } from '../app/data';
import { Icons } from '../app/ui';
import {
    isSeasonVisibleToOwner,
    ownerFarms,
    ownerPersonnel,
    pendingProtocols,
} from '../app/ownerData';
import profileBg from '@/imports/profile_background.png';

/* ------------------------------------------------------------------ KPI card */
function KpiCard({
    topLabel,
    subLabel,
    value,
    signal,
}: {
    topLabel: string;
    subLabel: string;
    value: string | number;
    signal?: 'positive' | 'attention';
}) {
    return (
        <div className="flex-1 rounded-2xl bg-white px-3 py-3 shadow-[0_2px_12px_rgba(0,0,0,0.07)]">
            <div className="text-[10px] font-bold uppercase tracking-wide text-ink-muted">
                {topLabel}
            </div>
            <div className="text-[10px] text-ink-muted mt-0.5">{subLabel}</div>
            <div className="mt-2 flex items-center gap-1.5">
                <span className="font-display text-[22px] font-extrabold leading-none text-ink">
                    {value}
                </span>
                {signal === 'positive' && (
                    <span className="grid size-5 place-items-center rounded-full bg-emerald-100 text-emerald-600">
                        <Icons.check size={11} />
                    </span>
                )}
                {signal === 'attention' && (
                    <span className="grid size-5 place-items-center rounded-full bg-amber-100 text-amber-600">
                        <Icons.clock size={11} />
                    </span>
                )}
            </div>
        </div>
    );
}

/* ----------------------------------------------------------------- row button */
function ActionRow({
    icon: Icon,
    label,
    onClick,
}: {
    icon: (p: { size?: number; className?: string }) => React.ReactElement;
    label: string;
    onClick: () => void;
}) {
    return (
        <button
            onClick={onClick}
            className="flex w-full items-center gap-3 bg-white px-4 py-3.5 text-left transition active:bg-slate-50"
        >
            <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-ocean-50 text-ocean-600">
                <Icon size={17} />
            </span>
            <span className="flex-1 text-[14px] font-semibold text-ink">{label}</span>
            <Icons.chevronR size={18} className="text-ink-muted" />
        </button>
    );
}

/* --------------------------------------------------------------------- main */
export function Account() {
    const nav = useNav();
    const isOwner = nav.accountRole === 'farm_owner';
    const initials = currentUser.name.split(' ').slice(-1)[0][0];
    const joined = new Date(currentUser.memberSince + '-01').toLocaleDateString('vi-VN', {
        month: 'long',
        year: 'numeric',
    });

    const infoRows: {
        icon: keyof typeof Icons;
        label: string;
        value?: string;
        accent?: boolean;
    }[] = [
        { icon: 'mail', label: 'Email', value: currentUser.email },
        { icon: 'phone', label: 'Số điện thoại', value: currentUser.phone },
        { icon: 'ops', label: 'Vai trò hệ thống', value: currentUser.role },
        ...(!isOwner && currentUser.ownerName
            ? [
                  {
                      icon: 'building' as const,
                      label: 'Chủ trang trại phụ trách',
                      value: currentUser.ownerName,
                      accent: true,
                  },
              ]
            : []),
        { icon: 'clock', label: 'Tham gia hệ thống từ', value: joined },
    ];

    return (
        <div className="pb-8">
            {/* AppBar — pt-[52px] clears Dynamic Island / notch on iOS */}
            <div className="flex items-center justify-between px-4 pb-2 pt-[52px]">
                <h1 className="font-display text-[22px] font-extrabold leading-tight tracking-tight text-ink">
                    Tài khoản
                </h1>
            </div>

            <div className="px-4 space-y-3">
                {/* Hero */}
                <div className="relative overflow-hidden rounded-3xl shadow-[0_16px_48px_-12px_rgba(15,80,140,.25)]">
                    <img
                        src={profileBg}
                        alt="Nền hồ sơ"
                        className="absolute inset-0 h-full w-full object-cover"
                    />
                    <div
                        className="absolute inset-0"
                        style={{
                            background:
                                'linear-gradient(135deg,rgba(14,100,180,.62) 0%,rgba(0,180,200,.28) 60%,transparent 100%)',
                        }}
                    />
                    <div className="relative flex items-center gap-4 px-5 py-5">
                        <div className="grid size-[62px] shrink-0 place-items-center rounded-full bg-white shadow-[0_4px_16px_rgba(0,0,0,.18)] ring-[3px] ring-white/70">
                            <span
                                className="font-display text-[26px] font-extrabold"
                                style={{ color: '#1E8CC8' }}
                            >
                                {initials}
                            </span>
                        </div>
                        <div className="min-w-0 flex-1">
                            <div className="font-display text-[20px] font-extrabold leading-snug text-white drop-shadow-[0_1px_2px_rgba(0,0,0,.3)]">
                                {currentUser.name}
                            </div>
                            <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-white/90 px-2.5 py-1 shadow-sm backdrop-blur-sm">
                                <span
                                    className="grid size-5 shrink-0 place-items-center rounded-full"
                                    style={{
                                        background: 'linear-gradient(135deg,#56B8F5,#29C8D6)',
                                    }}
                                >
                                    <Icons.user size={11} className="text-white" />
                                </span>
                                <span
                                    className="text-[12px] font-bold"
                                    style={{ color: '#1E8CC8' }}
                                >
                                    {currentUser.role}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Account role switcher */}
                <div>
                    <div className="mb-2 flex items-center justify-between px-1">
                        <span className="font-display text-[14px] font-bold text-ink">
                            Chuyển tài khoản
                        </span>
                        <span className="text-[10px] font-medium text-ink-muted">
                            Dữ liệu theo đúng vai trò
                        </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 rounded-2xl bg-white p-1.5 shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
                        {[
                            {
                                role: 'farm_owner' as const,
                                label: 'Chủ trại',
                                email: 'owner@smartshrimp.vn',
                                icon: Icons.building,
                            },
                            {
                                role: 'technician' as const,
                                label: 'KTV',
                                email: 'technician@smartshrimp.vn',
                                icon: Icons.user,
                            },
                        ].map((account) => {
                            const active = nav.accountRole === account.role;
                            const AccountIcon = account.icon;
                            return (
                                <button
                                    key={account.role}
                                    type="button"
                                    onClick={() => nav.switchAccount(account.role)}
                                    aria-pressed={active}
                                    className={`min-w-0 rounded-xl px-2 py-3 text-left transition active:scale-[0.98] ${
                                        active
                                            ? 'bg-ocean-600 text-white shadow-[0_5px_14px_rgba(2,132,199,.25)]'
                                            : 'bg-slate-50 text-ink'
                                    }`}
                                >
                                    <div className="flex items-center gap-2">
                                        <span
                                            className={`grid size-7 shrink-0 place-items-center rounded-lg ${
                                                active
                                                    ? 'bg-white/20 text-white'
                                                    : 'bg-ocean-50 text-ocean-600'
                                            }`}
                                        >
                                            <AccountIcon size={15} />
                                        </span>
                                        <span className="truncate text-[12px] font-bold">
                                            {account.label}
                                        </span>
                                        {active && (
                                            <Icons.check className="ml-auto shrink-0" size={15} />
                                        )}
                                    </div>
                                    <div
                                        className={`mt-1.5 truncate text-[9px] ${
                                            active ? 'text-white/75' : 'text-ink-muted'
                                        }`}
                                    >
                                        {account.email}
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* KPI row */}
                <div className="flex gap-2.5">
                    {isOwner ? (
                        <>
                            <KpiCard
                                topLabel="Trang trại"
                                subLabel="Đang sở hữu"
                                value={ownerFarms.filter((farm) => !farm.isDeleted).length}
                                signal="positive"
                            />
                            <KpiCard
                                topLabel="Ao nuôi"
                                subLabel="Đang quản lý"
                                value={
                                    ownerPersonnel.filter((person) => person.status === 'active')
                                        .length
                                }
                                signal="positive"
                            />
                            <KpiCard
                                topLabel="Vụ nuôi"
                                subLabel="Đang hoạt động"
                                value={
                                    pendingProtocols.filter(
                                        (protocol) =>
                                            protocol.status === 'pending_approval' &&
                                            isSeasonVisibleToOwner(protocol.seasonId),
                                    ).length
                                }
                                signal="positive"
                            />
                        </>
                    ) : (
                        <>
                            <KpiCard
                                topLabel="Vụ tham gia"
                                subLabel="Tích lũy"
                                value={currentUser.seasonsParticipated}
                            />
                            <KpiCard
                                topLabel="Nhiệm vụ"
                                subLabel="Đã hoàn tất"
                                value={currentUser.completedTasks}
                            />
                            <KpiCard
                                topLabel="Đúng hạn"
                                subLabel="Chỉ tiêu KPI"
                                value={`${currentUser.onTimeRatePct}%`}
                                signal="positive"
                            />
                        </>
                    )}
                </div>

                {/* Staff management */}
                {isOwner ? (
                    <div>
                        <div className="mb-2 px-1 font-display text-[14px] font-bold text-ink">
                            Nhân sự
                        </div>{' '}
                        <button
                            onClick={() => nav.go('owner-personnel-list')}
                            className="flex w-full items-center gap-3 rounded-2xl bg-white px-4 py-3 text-left shadow-[0_2px_12px_rgba(0,0,0,.06)]"
                        >
                            <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-teal-50 text-teal-600">
                                <Icons.users size={16} />
                            </span>
                            <div className="flex-1">
                                <div className="text-[13px] font-bold text-ink">
                                    {ownerPersonnel.filter((p) => p.role === 'technician').length}{' '}
                                    KTV &middot;{' '}
                                    {ownerPersonnel.filter((p) => p.role === 'expert').length}{' '}
                                    Chuyên gia
                                </div>
                                <div className="text-[11px] text-ink-muted">
                                    {ownerPersonnel.filter((p) => p.status === 'active').length}{' '}
                                    đang hoạt động
                                </div>
                            </div>
                            <Icons.chevronR size={18} className="text-ink-muted" />
                        </button>
                    </div>
                ) : (
                    ''
                )}

                {/* Account info */}
                <div>
                    <div className="mb-2 px-1 font-display text-[14px] font-bold text-ink">
                        Thông tin tài khoản
                    </div>
                    <div className="overflow-hidden rounded-2xl bg-white shadow-[0_2px_12px_rgba(0,0,0,0.06)] divide-y divide-slate-100">
                        {infoRows.map((r) => {
                            const Icon = Icons[r.icon];
                            return (
                                <div key={r.label} className="flex items-center gap-3 px-4 py-3">
                                    <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-ocean-50 text-ocean-600">
                                        <Icon size={16} />
                                    </span>
                                    <div className="min-w-0 flex-1">
                                        <div className="text-[11px] text-ink-muted">{r.label}</div>
                                        <div
                                            className={`truncate text-[13px] font-semibold ${
                                                r.accent ? 'text-ocean-600' : 'text-ink'
                                            }`}
                                        >
                                            {r.value}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Action buttons */}
                <div className="overflow-hidden rounded-2xl bg-white shadow-[0_2px_12px_rgba(0,0,0,0.06)] divide-y divide-slate-100">
                    <ActionRow
                        icon={Icons.edit}
                        label="Cập nhật thông tin cá nhân"
                        onClick={() => nav.go('profile-edit')}
                    />
                    <ActionRow
                        icon={Icons.shield}
                        label="Đổi mật khẩu"
                        onClick={() => nav.go('change-password')}
                    />
                </div>

                {/* Logout */}
                <button
                    onClick={nav.logout}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3.5 text-[14px] font-semibold text-rose-500 transition active:scale-[0.98] active:bg-rose-100"
                >
                    <Icons.logout size={18} />
                    Đăng xuất
                </button>

                <p className="text-center text-[11px] text-ink-muted">
                    SmartShrimp Platform · v1.0.0
                </p>
            </div>
        </div>
    );
}
