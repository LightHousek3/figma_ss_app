import { useNav } from "../../app/store"
import { Icons, Badge, EmptyState } from "../../app/ui"
import {
  pendingProtocols,
  isSeasonVisibleToOwner,
  type PendingProtocol,
} from "../../app/ownerData"
import { ScreenHeader } from "../common"
import { SeasonProtocolDetail } from "./SeasonProtocols"

const fmtDateTime = (iso: string) =>
  new Date(iso).toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  })

// Approval remains a valid Owner use case, but is entered from Notifications,
// Home, or the season context instead of occupying a permanent bottom tab.
export function ApprovalList() {
  const nav = useNav()
  const pending = pendingProtocols.filter(
    (item) =>
      item.status === "pending_approval" &&
      isSeasonVisibleToOwner(item.seasonId),
  )
  return (
    <div className="pb-8">
      <ScreenHeader
        title="Phác đồ chờ duyệt"
        subtitle={
          pending.length
            ? `${pending.length} phác đồ cần quyết định`
            : "Không có yêu cầu mới"
        }
      />
      <div className="space-y-3 px-4">
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-3.5 text-[11px] leading-relaxed text-amber-700">
          Mở từng phác đồ để xem toàn cảnh, lịch chính xác theo ngày và từng cữ.
          Nút duyệt hoặc từ chối nằm ở cuối màn hình chi tiết.
        </div>
        {pending.length === 0 ? (
          <EmptyState
            icon={Icons.shield}
            title="Không có phác đồ chờ duyệt"
            hint="Yêu cầu mới sẽ xuất hiện trong Thông báo."
          />
        ) : (
          pending.map((protocol) => (
            <ApprovalCard
              key={protocol.id}
              protocol={protocol}
              onOpen={() =>
                nav.go("owner-protocol-detail", { protocolId: protocol.id })
              }
            />
          ))
        )}
      </div>
    </div>
  )
}

function ApprovalCard({
  protocol,
  onOpen,
}: {
  protocol: PendingProtocol
  onOpen: () => void
}) {
  const treatment = protocol.protocolType === "treatment"
  return (
    <button
      onClick={onOpen}
      className="card w-full p-3.5 text-left transition active:scale-[0.99]"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 text-[14px] font-bold leading-snug text-ink">
          {protocol.title}
        </div>
        <Badge tone="amber" dot>Chờ duyệt</Badge>
      </div>
      {protocol.summary && <p className="mt-1 line-clamp-2 text-[12px] leading-relaxed text-ink-soft">{protocol.summary}</p>}
      <div className="mt-2.5 flex items-center justify-between gap-2 border-t border-line-soft pt-2.5">
        <div className="flex gap-1.5">
          <Badge tone={treatment ? "rose" : "ocean"}>{treatment ? "Điều trị" : "Nuôi"}</Badge>
          <Badge tone="slate">v{protocol.versionNo}</Badge>
        </div>
        <div className="flex items-center gap-1 text-[10px] text-ink-muted">
          {protocol.pondName} · {fmtDateTime(protocol.submittedAt)}
          <Icons.chevronR size={13} />
        </div>
      </div>
    </button>
  )
}

export function ProtocolDetail({ protocolId }: { protocolId: string }) {
  return <SeasonProtocolDetail protocolId={protocolId} />
}
