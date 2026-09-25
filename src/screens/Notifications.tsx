import { useState } from "react"
import { useNav } from "../app/store"
import { currentUser, notifications } from "../app/data"
import { isOwnerNotificationVisible, ownerNotifications } from "../app/ownerData"
import {
  Badge,
  fmtDateTime,
  Icons,
  PrimaryButton,
  CompactFilterTabs,
  Sheet,
  type Tone,
} from "../app/ui"
import { TopBar } from "./common"

type NoticeCategory = "warning" | "operation" | "case" | "task" | "protocol" | "season" | "inventory" | "personnel"
type NoticeAction = { label: string; nav: string; id?: string }
type Notice = {
  id: string
  category: NoticeCategory
  title: string
  content: string
  createdAt: string
  read: boolean
  action?: NoticeAction
}

const catMeta: Record<NoticeCategory, {
  label: string
  tone: Tone
  icon: keyof typeof Icons
}> = {
  warning: { label: "Cảnh báo sớm", tone: "amber", icon: "warn" },
  operation: { label: "Vận hành", tone: "teal", icon: "ops" },
  case: { label: "Ca bệnh", tone: "rose", icon: "heart" },
  task: { label: "Nhiệm vụ", tone: "ocean", icon: "checkList" },
  protocol: { label: "Phác đồ", tone: "violet", icon: "shield" },
  season: { label: "Vụ nuôi", tone: "slate", icon: "layers" },
  inventory: { label: "Kho vật tư", tone: "slate", icon: "box" },
  personnel: { label: "Nhân sự", tone: "ocean", icon: "users" },
}

export function NotificationsList() {
  const nav = useNav()
  const isOwner = currentUser.roleKey === "farm_owner"
  const source: Notice[] = isOwner
    ? ownerNotifications.filter(isOwnerNotificationVisible)
    : notifications.map((item) => ({
        ...item,
        action: item.action ? { ...item.action } : undefined,
      }))
  const [read, setRead] = useState<Set<string>>(
    new Set(source.filter((item) => item.read).map((item) => item.id)),
  )
  const [filter, setFilter] = useState<"all" | "unread" | "action" | "warning">("all")
  const [selected, setSelected] = useState<Notice | null>(null)
  const list = source.filter((item) =>
    filter === "unread"
      ? !read.has(item.id)
      : filter === "warning"
      ? item.category === "warning"
      : filter === "action"
        ? !!item.action && !read.has(item.id)
        : true,
  )
  const unread = source.filter((item) => !read.has(item.id)).length

  const markAll = () => {
    source.forEach((item) => {
      item.read = true
    })
    setRead(new Set(source.map((item) => item.id)))
  }

  const followAction = (notice: Notice) => {
    if (!notice.action) return
    if (isOwner) {
      if (notice.action.nav === "protocol" && notice.action.id)
        nav.go("owner-protocol-detail", { protocolId: notice.action.id })
      else if (notice.action.nav === "season" && notice.action.id)
        nav.go("owner-season-detail", { seasonId: notice.action.id })
      else if (notice.action.nav === "inventory" && notice.action.id)
        nav.go("owner-inventory", { farmId: notice.action.id })
      else if (notice.action.nav === "case" && notice.action.id)
        nav.go("owner-case-detail", { caseId: notice.action.id })
      else if (notice.action.nav === "tasks" && notice.action.id)
        nav.go("owner-task-detail", { taskId: notice.action.id })
      else if (notice.action.nav === "tasks") nav.setTab("owner-tasks")
      return
    }

    if (notice.action.nav.startsWith("pond:"))
      nav.go("pond", { seasonId: notice.action.nav.slice(5) })
    else if (notice.action.nav.startsWith("case:"))
      nav.go("case", { id: notice.action.nav.slice(5) })
    else if (notice.action.nav === "tasks") nav.setTab("tasks")
  }

  const open = (notice: Notice) => {
    notice.read = true
    setRead((current) => new Set(current).add(notice.id))
    setSelected(notice)
  }

  return (
    <div className="pb-6">
      <TopBar
        title="Thông báo"
        subtitle={
          unread > 0 ? `${unread} thông báo chưa đọc` : "Bạn đã đọc hết"
        }
        right={
          <button
            onClick={markAll}
            className="rounded-full bg-white/70 px-3 py-1.5 text-[12px] font-semibold text-ocean-600"
          >
            Đọc tất cả
          </button>
        }
      />
      <div className="px-4 pb-3">
        <CompactFilterTabs
          value={filter}
          onChange={setFilter}
          options={[
            { value: "all", label: "Tất cả" },
            { value: "unread", label: "Chưa đọc" },
            { value: "action", label: "Cần xử lý" },
            { value: "warning", label: "Cảnh báo" },
          ]}
        />
      </div>
      <div className="space-y-2.5 px-4">
        {list.map((notice) => {
          const meta = catMeta[notice.category]
          const Icon = Icons[meta.icon]
          const isRead = read.has(notice.id)
          return (
            <button
              key={notice.id}
              onClick={() => open(notice)}
              className={`card w-full p-3.5 text-left transition active:scale-[0.99] ${
                notice.category === "warning" && !isRead
                  ? "border-amber-500/40 bg-amber-50/50"
                  : ""
              }`}
            >
              <div className="flex items-start gap-3">
                <span
                  className={`grid size-9 shrink-0 place-items-center rounded-xl ${
                    meta.tone === "amber"
                      ? "bg-amber-50 text-amber-500"
                      : meta.tone === "teal"
                        ? "bg-teal-50 text-teal-500"
                        : meta.tone === "rose"
                          ? "bg-rose-50 text-rose-500"
                          : meta.tone === "violet"
                            ? "bg-violet-50 text-violet-500"
                            : meta.tone === "ocean"
                              ? "bg-ocean-50 text-ocean-600"
                              : "bg-slate-50 text-slate-500"
                  }`}
                >
                  <Icon size={17} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <Badge tone={meta.tone}>{meta.label}</Badge>
                    {!isRead && (
                      <span className="size-2 rounded-full bg-ocean-500" />
                    )}
                  </div>
                  <div
                    className={`mt-1 text-[13px] leading-snug ${
                      isRead
                        ? "font-semibold text-ink-soft"
                        : "font-bold text-ink"
                    }`}
                  >
                    {notice.title}
                  </div>
                  <p className="mt-0.5 line-clamp-2 text-[12px] text-ink-soft">
                    {notice.content}
                  </p>
                  <div className="mt-1.5 flex items-center justify-between">
                    <span className="text-[10px] text-ink-muted">
                      {fmtDateTime(notice.createdAt)}
                    </span>
                    {notice.action && (
                      <span className="flex items-center gap-0.5 text-[11px] font-bold text-ocean-600">
                        {notice.action.label}
                        <Icons.chevronR size={12} />
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </button>
          )
        })}
        {list.length === 0 && (
          <div className="rounded-2xl border border-dashed border-line py-10 text-center text-[12px] text-ink-muted">
            Không có thông báo trong nhóm này.
          </div>
        )}
      </div>
      <Sheet
        open={!!selected}
        onClose={() => setSelected(null)}
        title="Chi tiết thông báo"
        footer={selected?.action ? (
          <PrimaryButton
            full
            onClick={() => {
              const notice = selected
              setSelected(null)
              followAction(notice)
            }}
          >
            {selected.action.label}
          </PrimaryButton>
        ) : undefined}
      >
        {selected && (() => {
          const meta = catMeta[selected.category]
          const Icon = Icons[meta.icon]
          return (
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <span className={`grid size-11 shrink-0 place-items-center rounded-2xl ${meta.tone === "amber" ? "bg-amber-50 text-amber-500" : meta.tone === "teal" ? "bg-teal-50 text-teal-500" : meta.tone === "rose" ? "bg-rose-50 text-rose-500" : meta.tone === "violet" ? "bg-violet-50 text-violet-500" : meta.tone === "ocean" ? "bg-ocean-50 text-ocean-600" : "bg-slate-50 text-slate-500"}`}>
                  <Icon size={20} />
                </span>
                <div className="min-w-0 flex-1">
                  <Badge tone={meta.tone}>{meta.label}</Badge>
                  <h3 className="mt-2 text-[15px] font-bold leading-snug text-ink">{selected.title}</h3>
                </div>
              </div>
              <p className="rounded-2xl bg-slate-50 px-4 py-3 text-[13px] leading-relaxed text-ink-soft">{selected.content}</p>
              <div className="flex items-center justify-between border-t border-line-soft pt-3 text-[11px] text-ink-muted">
                <span>Thời điểm gửi</span>
                <span className="font-semibold text-ink-soft">{fmtDateTime(selected.createdAt)}</span>
              </div>
            </div>
          )
        })()}
      </Sheet>
    </div>
  )
}
