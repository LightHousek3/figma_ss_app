import { NavProvider, useNav, type TabKey } from "./app/store"
import { AppToast, Icons } from "./app/ui"
import { notifications } from "./app/data"
import { currentUser } from "./app/data"
import { isOwnerNotificationVisible, ownerNotifications } from "./app/ownerData"
import Auth from "./screens/Auth"
import Home from "./screens/Home"
import { SeasonsList } from "./screens/Seasons"
import PondHub, {
  WaterScreen,
  HealthScreen,
  OpsScreen,
  CasesScreen,
} from "./screens/Pond"
import OperationDetail from "./screens/Operation"
import { CaseDetail, CaseNew } from "./screens/Cases"
import { AIDiagnosis, Chat } from "./screens/AI"
import { TasksList, TaskDetail } from "./screens/Tasks"
import { NotificationsList } from "./screens/Notifications"
import { Account } from "./screens/Account"
import { ProfileEdit } from "./screens/ProfileEdit"
import { ChangePassword } from "./screens/ChangePassword"
// Owner screens
import OwnerHome from "./screens/owner/OwnerHome"
import {
  FarmList,
  FarmDetail,
  FarmEdit,
  PondDetail,
  PondEdit,
} from "./screens/owner/Farms"
import {
  OwnerSeasonList,
  SeasonDetail,
  SeasonCreate,
  SeasonEdit,
  HarvestRecord,
  HarvestDetail,
} from "./screens/owner/OwnerSeasons"
import {
  PersonnelList,
  PersonnelDetail,
  AssignPersonnel,
} from "./screens/owner/Personnel"
import {
  OwnerTasksList,
  OwnerTaskDetail,
  TaskCreateEdit,
} from "./screens/owner/OwnerTasks"
import { ApprovalList, ProtocolDetail } from "./screens/owner/ProtocolApproval"
import { OwnerCaseList, OwnerCaseDetail } from "./screens/owner/DiseaseCases"
import {
  SeasonProtocolList,
  SeasonProtocolDetail,
  SeasonCaseList,
} from "./screens/owner/SeasonProtocols"
import {
  ProductList,
  ProductDetail,
  ProductEdit,
  StockIn,
  StockOut,
  FarmStockHistory,
} from "./screens/owner/Inventory"

const isOwner = currentUser.roleKey === "farm_owner"

// ── KTV Tabs ──────────────────────────────────────────────────────────────────
const ktvTabs: { key: TabKey; label: string; icon: keyof typeof Icons }[] = [
  { key: "home", label: "Trang chủ", icon: "home" },
  { key: "seasons", label: "Vụ nuôi", icon: "layers" },
  { key: "tasks", label: "Nhiệm vụ", icon: "checkList" },
  { key: "notifications", label: "Thông báo", icon: "bell" },
  { key: "account", label: "Tài khoản", icon: "user" },
]

// ── Owner Tabs ────────────────────────────────────────────────────────────────
const ownerTabs: { key: TabKey; label: string; icon: keyof typeof Icons }[] = [
  { key: "home", label: "Trang chủ", icon: "home" },
  { key: "farm", label: "Trang trại", icon: "building" },
  { key: "owner-tasks", label: "Nhiệm vụ", icon: "checkList" },
  { key: "notifications", label: "Thông báo", icon: "bell" },
  { key: "account", label: "Tài khoản", icon: "user" },
]

const activeTabs = isOwner ? ownerTabs : ktvTabs

// ── Tab roots ─────────────────────────────────────────────────────────────────
function TabRoot({ tab }: { tab: TabKey }) {
  if (isOwner) {
    switch (tab) {
      case "home":
        return <OwnerHome />
      case "farm":
        return <FarmList />
      case "owner-tasks":
        return <OwnerTasksList />
      case "owner-protocols":
        return <ApprovalList />
      case "notifications":
        return <NotificationsList />
      case "account":
        return <Account />
    }
  }
  switch (tab) {
    case "home":
      return <Home />
    case "seasons":
      return <SeasonsList />
    case "tasks":
      return <TasksList />
    case "notifications":
      return <NotificationsList />
    case "account":
      return <Account />
  }
  return null
}

// ── Stack routes ──────────────────────────────────────────────────────────────
function StackRoute({
  name,
  params,
}: {
  name: string
  params?: Record<string, string>
}) {
  const p = params ?? {}
  // Shared routes
  switch (name) {
    case "profile-edit":
      return <ProfileEdit />
    case "change-password":
      return <ChangePassword />
  }

  if (isOwner) {
    switch (name) {
      // Farm & Pond (UC 1-10)
      case "owner-farm-detail":
        return <FarmDetail farmId={p.farmId} />
      case "owner-farm-edit":
        return <FarmEdit farmId={p.farmId} />
      case "owner-pond-detail":
        return <PondDetail pondId={p.pondId} />
      case "owner-pond-edit":
        return <PondEdit pondId={p.pondId} farmId={p.farmId} />
      // Seasons & Harvest (UC 11-19)
      case "owner-seasons":
        return <OwnerSeasonList />
      case "owner-season-detail":
        return <SeasonDetail seasonId={p.seasonId} />
      case "owner-season-create":
        return <SeasonCreate pondId={p.pondId} />
      case "owner-season-edit":
        return <SeasonEdit seasonId={p.seasonId} />
      case "owner-harvest-record":
        return <HarvestRecord seasonId={p.seasonId} />
      case "owner-harvest-detail":
        return <HarvestDetail harvestId={p.harvestId} />
      // Personnel (UC 20-23)
      case "owner-personnel-list":
        return <PersonnelList />
      case "owner-personnel-detail":
        return <PersonnelDetail personId={p.personId} />
      case "owner-assign-personnel":
        return <AssignPersonnel seasonId={p.seasonId} />
      // Tasks (UC 24-28)
      case "owner-task-detail":
        return <OwnerTaskDetail taskId={p.taskId} />
      case "owner-task-create":
        return <TaskCreateEdit />
      case "owner-task-edit":
        return <TaskCreateEdit taskId={p.taskId} />
      // Protocol approval (UC 29-31)
      case "owner-protocol-detail":
        return <ProtocolDetail protocolId={p.protocolId} />
      // Season protocol list & detail (from season context)
      case "owner-season-protocols":
        return <SeasonProtocolList seasonId={p.seasonId} />
      case "owner-season-protocol-detail":
        return <SeasonProtocolDetail protocolId={p.protocolId} />
      case "owner-protocol-approvals":
        return <ApprovalList />
      // Disease cases (UC 32-33)
      case "owner-case-list":
        return <OwnerCaseList />
      case "owner-case-detail":
        return <OwnerCaseDetail caseId={p.caseId} />
      case "owner-season-cases":
        return <SeasonCaseList seasonId={p.seasonId} />
      // Inventory (UC 34-40)
      case "owner-inventory":
        return <ProductList farmId={p.farmId} />
      case "owner-product-detail":
        return <ProductDetail productId={p.productId} />
      case "owner-product-edit":
        return (
          <ProductEdit
            productId={p.productId}
            farmId={p.farmId}
            protocolId={p.protocolId}
            protocolItemId={p.protocolItemId}
          />
        )
      case "owner-stock-in":
        return <StockIn productId={p.productId} />
      case "owner-stock-out":
        return <StockOut productId={p.productId} />
      case "owner-stock-history":
        return (
          <FarmStockHistory
            farmId={p.farmId}
            referenceType={p.referenceType}
            referenceId={p.referenceId}
          />
        )
    }
  } else {
    // KTV routes
    switch (name) {
      case "pond":
        return <PondHub seasonId={p.seasonId} />
      case "water":
        return <WaterScreen seasonId={p.seasonId} />
      case "health":
        return <HealthScreen seasonId={p.seasonId} />
      case "ops":
        return <OpsScreen seasonId={p.seasonId} />
      case "cases":
        return <CasesScreen seasonId={p.seasonId} />
      case "op":
        return <OperationDetail id={p.id} />
      case "case":
        return <CaseDetail id={p.id} />
      case "case-new":
        return <CaseNew seasonId={p.seasonId} />
      case "ai":
        return <AIDiagnosis seasonId={p.seasonId} />
      case "chat":
        return <Chat seasonId={p.seasonId} />
      case "task":
        return <TaskDetail id={p.id} />
    }
  }
  return null
}

// ── Shell ─────────────────────────────────────────────────────────────────────
function Shell() {
  const nav = useNav()
  const top = nav.stack[nav.stack.length - 1]
  const fullHeightRoute = top && ["case", "chat"].includes(top.name)

  const unread = isOwner
    ? ownerNotifications.filter((n) => !n.read && isOwnerNotificationVisible(n)).length
    : notifications.filter((n) => !n.read).length

  return (
    <div className="relative flex h-full flex-col overflow-hidden">
      {/* content */}
      <div
        className={`min-h-0 flex-1 ${
          fullHeightRoute ? "overflow-hidden" : "overflow-y-auto scroll-clean"
        }`}
      >
        {top ? (
          <StackRoute
            key={nav.stack.length}
            name={top.name}
            params={top.params}
          />
        ) : (
          <TabRoot tab={nav.tab} />
        )}
      </div>

      {/* bottom nav */}
      {!fullHeightRoute && (
        <nav className="grid shrink-0 grid-cols-5 border-t border-line/70 bg-white/90 px-1 pb-1 pt-1.5 backdrop-blur-lg">
          {activeTabs.map((t) => {
            const Icon = Icons[t.icon]
            const active = nav.tab === t.key && nav.stack.length === 0
            const badge = t.key === "notifications" && unread > 0 ? unread : 0
            return (
              <button
                key={t.key}
                onClick={() => nav.setTab(t.key)}
                className={`relative flex flex-col items-center gap-1 rounded-xl py-1.5 transition ${
                  active ? "text-ocean-600" : "text-ink-muted"
                }`}
              >
                <span className="relative">
                  <Icon size={22} />
                  {badge > 0 && (
                    <span className="absolute -right-1.5 -top-1 grid size-4 place-items-center rounded-full bg-rose-500 text-[9px] font-bold text-white">
                      {badge}
                    </span>
                  )}
                </span>
                <span className="text-[10px] font-semibold">{t.label}</span>
                {active && (
                  <span className="absolute -top-[7px] h-1 w-8 rounded-full bg-ocean-500" />
                )}
              </button>
            )
          })}
        </nav>
      )}

      {/* toast */}
      {nav.toastNotice && (
        <div className="pointer-events-none absolute inset-x-0 bottom-24 z-50 flex justify-center px-6">
          <div className="w-full animate-[toast_.25s_ease]">
            <AppToast notice={nav.toastNotice} />
          </div>
        </div>
      )}
      <style>{`@keyframes toast{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}`}</style>
    </div>
  )
}

function Gate() {
  const nav = useNav()
  return nav.loggedIn ? <Shell /> : <Auth />
}

export default function App() {
  return (
    <NavProvider>
      <div className="flex h-full w-full items-center justify-center p-0 sm:p-6">
        <div className="relative h-full w-full overflow-hidden bg-white/40 sm:h-[956px] sm:max-h-full sm:w-[440px] sm:rounded-[55px] sm:border-[14px] sm:border-ink/90 sm:shadow-[0_40px_120px_-30px_rgba(15,28,46,.6)]">
          <div
            className="absolute inset-0"
            style={{
              background: "linear-gradient(to top, #fff1eb 0%, #ace0f9 100%)",
            }}
          />
          <div className="relative h-full">
            <Gate />
          </div>
        </div>
      </div>
    </NavProvider>
  )
}
