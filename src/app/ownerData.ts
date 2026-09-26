// SmartShrimp — mock domain data for the Chủ trang trại (Farm Owner) mobile app.
// Modeled on the V7 schema. Covers all 40 Owner UCs.

// ── Types ──────────────────────────────────────────────────────────────────────

export type PondStatus = "available" | "maintenance" | "inactive"
export type PondType = "aquaculture" | "water_treatment"
export type SeasonStatus = "planning" | "active" | "completed" | "cancelled"
export type ShrimpType = "whiteleg" | "black_tiger"
export type PersonnelRole = "technician" | "expert"
export type AccountStatus = "pending_activation" | "active" | "inactive" | "blocked"
export type HarvestType = "partial" | "final"
export type ProtocolType = "production" | "treatment"
export type ProtocolStatus = "draft" | "pending_approval" | "approved" | "rejected" | "superseded" | "cancelled" | "aborted"
export type OperationType = "feeding" | "medicine" | "mineral" | "chemical" | "other"
export type DoseBasis = "fixed_quantity" | "per_kg_biomass" | "percent_biomass" | "per_m3_water"
export type ProductCategory = "feed" | "medicine" | "mineral" | "chemical" | "other"
export type ProductUnit = "kg" | "g" | "l" | "ml" | "pack" | "bottle"
export type InventoryTxType = "stock_in" | "stock_out"
export type ConversionUnit = "mg" | "g" | "kg" | "ml" | "l"
export type CaseSeverity = "low" | "medium" | "high" | "critical"
export type CaseStatus = "open" | "waiting_for_info" | "monitoring" | "in_treatment" | "resolved"
export type TaskPriority = "low" | "normal" | "high" | "urgent"
export type TaskStatus = "pending" | "in_progress" | "completed" | "cancelled"

export interface OwnerFarm {
  id: string
  name: string
  address?: string
  latitude?: number
  longitude?: number
  totalAreaHectares?: number
  isDeleted: boolean
  deletedAt?: string
  // derived
  pondCount: number
  activeSeasonsCount: number
}

export interface OwnerPond {
  id: string
  farmId: string
  name: string
  areaM2?: number
  depthM?: number
  volumeM3?: number
  type: PondType
  status: PondStatus
  isDeleted: boolean
  deletedAt?: string
  currentSeasonId?: string
}

export interface Personnel {
  id: string
  fullName: string
  email: string
  phone?: string
  role: PersonnelRole
  status: AccountStatus
  activatedAt?: string
}

export interface SeasonAssignment {
  id: string
  seasonId: string
  role: PersonnelRole
  accountId: string
  accountName: string
  assignedAt: string
  unassignedAt?: string
  replacementReason?: string
}

export interface OwnerSeason {
  id: string
  pondId: string
  name: string
  shrimpType: ShrimpType
  status: SeasonStatus
  stockingDate?: string
  expectedEndDate?: string
  actualEndDate?: string
  initialQuantity?: number
  initialAvgWeightG?: number
  initialBiomassKg?: number
  initialDensityPerM2?: number
  cancellationReason?: string
  // denormalized for display
  pondName: string
  farmId: string
  farmName: string
  ktvName?: string
  expertName?: string
  protocolStatus?: ProtocolStatus | null
  hasApprovedProtocol: boolean
  dayOfCulture?: number
}

export interface HarvestEvent {
  id: string
  seasonId: string
  harvestType: HarvestType
  harvestedAt: string
  totalWeightKg: number
  quantityCount?: number
  avgSizePerKg?: number
  pricePerKg?: number
  totalRevenue?: number
  estimatedRemainingCount?: number
  buyerName?: string
  buyerContact?: string
  note?: string
  recordedByName: string
  createdAt: string
}

export interface ProtocolItem {
  id: string
  operationType: OperationType
  productId?: string
  productName?: string
  startDayOffset: number
  endDayOffset: number
  repeatIntervalDays: number
  doseBasis: DoseBasis
  doseValue: number
  doseUnit: string
  instructions?: string
  sequenceOrder: number
  mealNumber?: number
  plannedTime?: string
}

export interface PendingProtocol {
  id: string
  protocolType: ProtocolType
  seasonId: string
  seasonName: string
  pondName: string
  farmName: string
  diseaseCaseId?: string
  diseaseCaseTitle?: string
  title: string
  versionNo: number
  status: ProtocolStatus
  createdBy: string
  submittedAt: string
  summary?: string
  allowedVariancePct?: number
  rollingWindowDays?: number
  reviewedAt?: string
  reviewedBy?: string
  rejectionReason?: string
  supersedesProtocolId?: string
  supersededAt?: string
  abortReason?: string
  abortedBy?: string
  abortedAt?: string
  statusHistory?: {
    id: string
    fromStatus?: ProtocolStatus
    toStatus: ProtocolStatus
    changedBy: string
    reason?: string
    changedAt: string
  }[]
  items: ProtocolItem[]
}

export type OwnerOperationStatus = "planned" | "completed" | "cancelled" | "generation_failed"

export interface OwnerOperationOccurrence {
  id: string
  protocolId: string
  protocolItemId: string
  seasonId: string
  operationType: OperationType
  productName: string
  scheduledAt: string
  plannedQuantity?: number
  unit: string
  doseBasis: DoseBasis
  doseValue: number
  basisQuantity?: number
  basisUnit?: "kg_biomass" | "m3_water"
  sourceHealthLogId?: string
  calculatedAt?: string
  calculationVersion?: string
  mealNumber?: number
  instructions?: string
  status: OwnerOperationStatus
  execution?: {
    id: string
    actualProductName?: string
    actualQuantity: number
    executedAt: string
    executedBy: string
    note?: string
    varianceReason?: string
  }
  cancellation?: {
    type: "protocol_superseded" | "treatment_aborted" | "season_cancelled" | "manual_correction"
    reason: string
    cancelledAt: string
    cancelledBy: string
  }
  generationError?: string
}

export interface OwnerDiseaseCase {
  id: string
  seasonId: string
  seasonName: string
  pondName: string
  farmName: string
  title: string
  description: string
  severity: CaseSeverity
  status: CaseStatus
  expertId: string
  expertName: string
  reportedByName: string
  createdAt: string
  updatedAt: string
  aiLabel?: string
  responsesCount: number
  relatedCaseId?: string
  caseSnapshot: {
    recordedAt: string
    healthStatus: OwnerHealthStatus
    avgWeightG?: number
    mortalityCount: number
    ph?: number
    no2MgL?: number
    nh3MgL?: number
    note?: string
  }
  attachments: {
    id: string
    mediaType?: string
    caption?: string
    uploadedByName: string
    createdAt: string
  }[]
  responses: {
    id: string
    authorName: string
    authorRole: "KTV" | "Chuyên gia"
    responseType:
      | "request_info"
      | "provide_info"
      | "monitoring_result"
      | "treatment_result"
      | "emergency_alert"
      | "expert_assessment"
      | "expert_instruction"
      | "resolution"
    message: string
    attachmentsCount?: number
    createdAt: string
  }[]
  statusHistory: {
    id: string
    fromStatus?: CaseStatus
    toStatus: CaseStatus
    changedByName: string
    reason?: string
    changedAt: string
  }[]
  resolutionSummary?: string
  resolvedByName?: string
  resolvedAt?: string
}

export interface OwnerProduct {
  id: string
  farmId: string
  name: string
  category: ProductCategory
  unit: ProductUnit
  conversionQuantity?: number
  conversionUnit?: ConversionUnit
  imageUrls: string[]
  minAlertQuantity: number
  description?: string
  isDeleted: boolean
  deletedAt?: string
  currentStock: number
}

export interface InventoryBalance {
  id: string
  productId: string
  lotNumber: string
  receivedAt: string
  quantity: number
  unitPrice: number
  supplierName: string
  createdAt: string
  updatedAt: string
}

export interface InventoryTransaction {
  id: string
  productId: string
  transactionType: InventoryTxType
  quantity: number
  totalAmount: number
  lotNumber: string
  seasonId?: string
  referenceType?: string
  referenceId?: string
  reason?: string
  performedBy: string
  createdAt: string
}

export interface OwnerTask {
  id: string
  farmId: string
  seasonId?: string
  title: string
  description?: string
  priority: TaskPriority
  status: TaskStatus
  dueAt?: string
  assignedTo: string
  assignedToName: string
  assignedByName: string
  seasonName?: string
  createdAt: string
  updatedAt: string
  startedAt?: string
  completedAt?: string
  cancellationReason?: string
  cancelledByName?: string
  cancelledAt?: string
}

export interface OwnerNotification {
  id: string
  type: string
  category: "protocol" | "inventory" | "warning" | "task" | "season" | "personnel"
  title: string
  content: string
  createdAt: string
  read: boolean
  action?: {
    label: string
    nav: "protocol" | "season" | "inventory" | "tasks" | "case"
    id?: string
  }
}

// ── Data ───────────────────────────────────────────────────────────────────────

export const ownerFarms: OwnerFarm[] = [
  {
    id: "F1",
    isDeleted: false,
    name: "Trang trại Cửa Lấp",
    address: "Thị xã Bà Rịa, tỉnh Bà Rịa – Vũng Tàu",
    latitude: 10.4892,
    longitude: 107.1647,
    totalAreaHectares: 3.5,
    pondCount: 4,
    activeSeasonsCount: 3,
  },
  {
    id: "F2",
    isDeleted: false,
    name: "Trang trại Đông Hải",
    address: "Huyện Long Điền, tỉnh Bà Rịa – Vũng Tàu",
    totalAreaHectares: 2.2,
    pondCount: 1,
    activeSeasonsCount: 1,
  },
]

export const ownerPonds: OwnerPond[] = [
  {
    id: "P-A3",
    isDeleted: false,
    farmId: "F1",
    name: "Ao A3",
    areaM2: 3200,
    depthM: 1.4,
    volumeM3: 4480,
    type: "aquaculture",
    status: "available",
    currentSeasonId: "S-A3",
  },
  {
    id: "P-A5",
    isDeleted: false,
    farmId: "F1",
    name: "Ao A5",
    areaM2: 2800,
    depthM: 1.4,
    volumeM3: 3920,
    type: "aquaculture",
    status: "available",
    currentSeasonId: "S-A5",
  },
  {
    id: "P-B1",
    isDeleted: false,
    farmId: "F1",
    name: "Ao B1",
    areaM2: 3500,
    depthM: 1.5,
    volumeM3: 5250,
    type: "aquaculture",
    status: "available",
    currentSeasonId: "S-B1",
  },
  {
    id: "P-C2",
    isDeleted: false,
    farmId: "F1",
    name: "Ao C2 (xử lý nước)",
    areaM2: 2000,
    depthM: 1.2,
    volumeM3: 2400,
    type: "water_treatment",
    status: "maintenance",
  },
  {
    id: "P-D2",
    isDeleted: false,
    farmId: "F2",
    name: "Ao D2",
    areaM2: 4000,
    depthM: 1.5,
    volumeM3: 6000,
    type: "aquaculture",
    status: "available",
    currentSeasonId: "S-D2",
  },
]

export const ownerPersonnel: Personnel[] = [
  {
    id: "KTV-1",
    fullName: "Cô Thái Bảo",
    email: "bao.co@smartshrimp.vn",
    phone: "0912 345 678",
    role: "technician",
    status: "active",
    activatedAt: "2024-11-15",
  },
  {
    id: "KTV-2",
    fullName: "Trần Minh Khoa",
    email: "khoa.tran@smartshrimp.vn",
    phone: "0934 567 890",
    role: "technician",
    status: "active",
    activatedAt: "2025-02-01",
  },
  {
    id: "EXP-1",
    fullName: "TS. Phạm Hải Đăng",
    email: "dang.pham@smartshrimp.vn",
    phone: "0987 654 321",
    role: "expert",
    status: "active",
    activatedAt: "2024-11-15",
  },
  {
    id: "EXP-2",
    fullName: "TS. Phạm Thu Hà",
    email: "ha.pham@smartshrimp.vn",
    phone: "0976 543 210",
    role: "expert",
    status: "active",
    activatedAt: "2025-01-10",
  },
]

export const seasonAssignments: SeasonAssignment[] = [
  {
    id: "SA-1",
    seasonId: "S-A3",
    role: "technician",
    accountId: "KTV-1",
    accountName: "Cô Thái Bảo",
    assignedAt: "2026-06-25",
  },
  {
    id: "SA-2",
    seasonId: "S-A3",
    role: "expert",
    accountId: "EXP-1",
    accountName: "TS. Phạm Hải Đăng",
    assignedAt: "2026-06-25",
  },
  {
    id: "SA-3",
    seasonId: "S-A5",
    role: "technician",
    accountId: "KTV-1",
    accountName: "Cô Thái Bảo",
    assignedAt: "2026-07-18",
  },
  {
    id: "SA-4",
    seasonId: "S-A5",
    role: "expert",
    accountId: "EXP-1",
    accountName: "TS. Phạm Hải Đăng",
    assignedAt: "2026-07-18",
  },
  {
    id: "SA-5",
    seasonId: "S-B1",
    role: "technician",
    accountId: "KTV-2",
    accountName: "Trần Minh Khoa",
    assignedAt: "2026-08-22",
  },
  {
    id: "SA-6",
    seasonId: "S-B1",
    role: "expert",
    accountId: "EXP-2",
    accountName: "TS. Phạm Thu Hà",
    assignedAt: "2026-08-22",
  },
]

export const ownerSeasons: OwnerSeason[] = [
  {
    id: "S-A3",
    pondId: "P-A3",
    name: "Vụ Đông Xuân 2025",
    shrimpType: "whiteleg",
    status: "active",
    stockingDate: "2026-06-28",
    expectedEndDate: "2026-10-15",
    initialQuantity: 480000,
    initialAvgWeightG: 0.02,
    initialBiomassKg: 9.6,
    initialDensityPerM2: 150,
    pondName: "Ao A3",
    farmId: "F1",
    farmName: "Trang trại Cửa Lấp",
    ktvName: "Cô Thái Bảo",
    expertName: "TS. Phạm Hải Đăng",
    protocolStatus: "approved",
    hasApprovedProtocol: true,
    dayOfCulture: 72,
  },
  {
    id: "S-A5",
    pondId: "P-A5",
    name: "Vụ Đông Xuân 2025",
    shrimpType: "whiteleg",
    status: "active",
    stockingDate: "2026-07-20",
    expectedEndDate: "2026-11-10",
    initialQuantity: 420000,
    initialAvgWeightG: 0.02,
    initialBiomassKg: 8.4,
    initialDensityPerM2: 150,
    pondName: "Ao A5",
    farmId: "F1",
    farmName: "Trang trại Cửa Lấp",
    ktvName: "Cô Thái Bảo",
    expertName: "TS. Phạm Hải Đăng",
    protocolStatus: "approved",
    hasApprovedProtocol: true,
    dayOfCulture: 50,
  },
  {
    id: "S-B1",
    pondId: "P-B1",
    name: "Vụ Thu 2025",
    shrimpType: "black_tiger",
    status: "active",
    stockingDate: "2026-08-25",
    expectedEndDate: "2027-01-20",
    initialQuantity: 350000,
    initialAvgWeightG: 0.03,
    initialBiomassKg: 10.5,
    initialDensityPerM2: 100,
    pondName: "Ao B1",
    farmId: "F1",
    farmName: "Trang trại Cửa Lấp",
    ktvName: "Trần Minh Khoa",
    expertName: "TS. Phạm Thu Hà",
    protocolStatus: "approved",
    hasApprovedProtocol: true,
    dayOfCulture: 14,
  },
  {
    id: "S-D2",
    pondId: "P-D2",
    name: "Vụ Đông 2025",
    shrimpType: "whiteleg",
    status: "planning",
    stockingDate: "2026-09-20",
    expectedEndDate: "2027-01-15",
    initialQuantity: 520000,
    initialAvgWeightG: 0.02,
    initialBiomassKg: 10.4,
    initialDensityPerM2: 130,
    pondName: "Ao D2",
    farmId: "F2",
    farmName: "Trang trại Đông Hải",
    // no ktv/expert assigned yet
    protocolStatus: "pending_approval",
    hasApprovedProtocol: false,
    dayOfCulture: 0,
  },
]

export const harvestEvents: HarvestEvent[] = [
  {
    id: "HV-1",
    seasonId: "S-A3",
    harvestType: "partial",
    harvestedAt: "2026-08-15T06:00:00",
    totalWeightKg: 480,
    quantityCount: 38400,
    avgSizePerKg: 80,
    pricePerKg: 180000,
    totalRevenue: 86400000,
    estimatedRemainingCount: 380000,
    buyerName: "Thủy sản Hoàng Hải",
    buyerContact: "0901 222 333",
    note: "Thu tỉa lần đầu, cỡ tôm đạt 80 con/kg.",
    recordedByName: "Nguyễn Văn Đạt",
    createdAt: "2026-08-15T06:05:00",
  },
]

export const pendingProtocols: PendingProtocol[] = [
  {
    id: "PR-1",
    protocolType: "treatment",
    seasonId: "S-A3",
    seasonName: "Vụ Đông Xuân 2025",
    pondName: "Ao A3",
    farmName: "Trang trại Cửa Lấp",
    diseaseCaseId: "DC-77",
    diseaseCaseTitle: "Nghi phân trắng & mềm vỏ — Ao A3",
    title: "Phác đồ điều trị Phân trắng — Ao A3 v2",
    versionNo: 2,
    status: "pending_approval",
    supersedesProtocolId: "PR-4",
    createdBy: "TS. Phạm Hải Đăng",
    submittedAt: "2026-09-08T10:30:00",
    summary:
      "Điều chỉnh liều Doxycycline và bổ sung Probiotic sau khi v1 cho hiệu quả chậm. Duy trì 5 ngày điều trị.",
    statusHistory: [
      { id: "PHS-1-1", toStatus: "draft", changedBy: "TS. Phạm Hải Đăng", changedAt: "2026-09-08T09:20:00" },
      { id: "PHS-1-2", fromStatus: "draft", toStatus: "pending_approval", changedBy: "TS. Phạm Hải Đăng", reason: "Điều chỉnh phiên bản sau đánh giá đáp ứng điều trị", changedAt: "2026-09-08T10:30:00" },
    ],
    items: [
      {
        id: "PI-1",
        sequenceOrder: 1,
        operationType: "medicine",
        productName: "Doxycycline 98% (trộn thức ăn)",
        startDayOffset: 0,
        endDayOffset: 4,
        repeatIntervalDays: 1,
        doseBasis: "per_kg_biomass",
        doseValue: 0.05,
        doseUnit: "g",
        mealNumber: 1,
        plannedTime: "06:00",
        instructions: "Trộn đều với thức ăn buổi sáng, cho ăn chậm.",
      },
      {
        id: "PI-2",
        productId: "PRD-5",
        sequenceOrder: 2,
        operationType: "medicine",
        productName: "Men tiêu hóa Bio-Gut Pro",
        startDayOffset: 0,
        endDayOffset: 6,
        repeatIntervalDays: 1,
        doseBasis: "fixed_quantity",
        doseValue: 0.5,
        doseUnit: "kg",
        mealNumber: 1,
        plannedTime: "06:00",
        instructions:
          "Trộn cùng cữ sáng nhưng chuẩn bị riêng, không trộn trực tiếp với kháng sinh.",
      },
      {
        id: "PI-3",
        productId: "PRD-3",
        sequenceOrder: 3,
        operationType: "chemical",
        productName: "Yucca liquid (khử khí độc)",
        startDayOffset: 0,
        endDayOffset: 6,
        repeatIntervalDays: 2,
        doseBasis: "per_m3_water",
        doseValue: 0.001,
        doseUnit: "l",
        plannedTime: "08:00",
        instructions: "Tạt buổi sáng khi trời nắng, chạy quạt 2h sau khi tạt.",
      },
    ],
  },
  {
    id: "PR-2",
    protocolType: "production",
    seasonId: "S-D2",
    seasonName: "Vụ Đông 2025",
    pondName: "Ao D2",
    farmName: "Trang trại Đông Hải",
    title: "Phác đồ nuôi Tôm thẻ — Vụ Đông 2025 — Ao D2 v1",
    versionNo: 1,
    status: "pending_approval",
    createdBy: "TS. Phạm Thu Hà",
    submittedAt: "2026-09-07T14:00:00",
    summary:
      "Phác đồ nuôi tôm thẻ chân trắng DOC 1–90 cho ao D2 (4.000 m², 6.000 m³). Giai đoạn sớm dùng liều cố định; từ DOC 30 chuyển sang liều theo sinh khối.",
    allowedVariancePct: 10,
    rollingWindowDays: 7,
    statusHistory: [
      { id: "PHS-2-1", toStatus: "draft", changedBy: "TS. Phạm Thu Hà", changedAt: "2026-09-07T10:00:00" },
      { id: "PHS-2-2", fromStatus: "draft", toStatus: "pending_approval", changedBy: "TS. Phạm Thu Hà", reason: "Hoàn tất phác đồ 90 ngày cho ao D2", changedAt: "2026-09-07T14:00:00" },
    ],
    items: [
      ...["06:00", "10:00", "14:00", "18:00"].map((plannedTime, index) => ({
        id: `PI-4-${index + 1}`,
        productId: "PRD-6",
        sequenceOrder: index + 1,
        operationType: "feeding" as const,
        productName: "Thức ăn Grobest G5 (cỡ 0)",
        startDayOffset: 0,
        endDayOffset: 29,
        repeatIntervalDays: 1,
        doseBasis: "fixed_quantity" as const,
        doseValue: 3.75,
        doseUnit: "kg",
        mealNumber: index + 1,
        plannedTime,
        instructions: "Rải đều quanh ao, kiểm tra nhá sau 2 giờ.",
      })),
      ...["06:00", "10:00", "14:00", "18:00"].map((plannedTime, index) => ({
        id: `PI-5-${index + 1}`,
        sequenceOrder: index + 5,
        operationType: "feeding" as const,
        productName: "Thức ăn Grobest G8 (cỡ 2)",
        startDayOffset: 30,
        endDayOffset: 89,
        repeatIntervalDays: 1,
        doseBasis: "percent_biomass" as const,
        doseValue: 1,
        doseUnit: "kg",
        mealNumber: index + 1,
        plannedTime,
        instructions: "Giảm 10–15% khi thời tiết xấu hoặc DO < 4 mg/L.",
      })),
      {
        id: "PI-6",
        productId: "PRD-7",
        sequenceOrder: 9,
        operationType: "mineral",
        productName: "Khoáng tổng hợp Sea-Min",
        startDayOffset: 0,
        endDayOffset: 89,
        repeatIntervalDays: 3,
        doseBasis: "per_m3_water",
        doseValue: 0.002,
        doseUnit: "kg",
        plannedTime: "17:00",
        instructions:
          "Tạt chiều mát (16h–18h) để hỗ trợ lột xác. Duy trì độ kiềm 120–150 mg/L.",
      },
    ],
  },
]

export const ownerDiseaseCases: OwnerDiseaseCase[] = [
  {
    id: "DC-77",
    seasonId: "S-A3",
    seasonName: "Vụ Đông Xuân 2025",
    pondName: "Ao A3",
    farmName: "Trang trại Cửa Lấp",
    title: "Nghi phân trắng & mềm vỏ — Ao A3",
    description:
      "Quan sát phân trắng rải rác ở nhá, một số tôm mềm vỏ, giảm bắt mồi nhẹ ở cữ chiều. Kèm ảnh nhá và mẫu tôm.",
    severity: "high",
    status: "in_treatment",
    expertId: "EXP-1",
    expertName: "TS. Phạm Hải Đăng",
    reportedByName: "Cô Thái Bảo",
    createdAt: "2026-09-05T17:20:00",
    updatedAt: "2026-09-07T07:30:00",
    aiLabel: "White Feces Syndrome (nghi ngờ)",
    responsesCount: 4,
    caseSnapshot: {
      recordedAt: "2026-09-05T17:10:00",
      healthStatus: "warning",
      avgWeightG: 11.9,
      mortalityCount: 38,
      ph: 8.4,
      no2MgL: 1.7,
      nh3MgL: 0.24,
      note: "Giảm bắt mồi cữ chiều, phân trắng xuất hiện rải rác trong nhá.",
    },
    attachments: [
      { id: "DCA-77-1", mediaType: "image/jpeg", caption: "Ảnh nhá có phân trắng", uploadedByName: "Cô Thái Bảo", createdAt: "2026-09-05T17:21:00" },
      { id: "DCA-77-2", mediaType: "image/jpeg", caption: "Mẫu tôm mềm vỏ", uploadedByName: "Cô Thái Bảo", createdAt: "2026-09-05T17:22:00" },
    ],
    responses: [
      { id: "DCR-77-1", authorName: "Cô Thái Bảo", authorRole: "KTV", responseType: "provide_info", message: "Đã gửi ảnh nhá và 5 mẫu tôm. NO₂ tăng dần trong ba ngày gần đây.", attachmentsCount: 2, createdAt: "2026-09-05T17:22:00" },
      { id: "DCR-77-2", authorName: "TS. Phạm Hải Đăng", authorRole: "Chuyên gia", responseType: "expert_assessment", message: "Dấu hiệu phù hợp phân trắng giai đoạn sớm. Cần giảm 20% lượng ăn và ổn định NO₂ trước khi điều trị.", createdAt: "2026-09-05T19:40:00" },
      { id: "DCR-77-3", authorName: "TS. Phạm Hải Đăng", authorRole: "Chuyên gia", responseType: "expert_instruction", message: "Đã tạo phác đồ điều trị v1 và gửi Chủ trại duyệt. Chỉ bắt đầu sau khi được duyệt.", createdAt: "2026-09-06T08:10:00" },
      { id: "DCR-77-4", authorName: "Cô Thái Bảo", authorRole: "KTV", responseType: "treatment_result", message: "Đã hoàn thành cữ điều trị đầu tiên; tôm bắt mồi khá hơn, chưa ghi nhận hao hụt tăng.", createdAt: "2026-09-07T07:30:00" },
    ],
    statusHistory: [
      { id: "DCH-77-1", toStatus: "open", changedByName: "Cô Thái Bảo", reason: "Phát hiện dấu hiệu bất thường tại nhá", changedAt: "2026-09-05T17:20:00" },
      { id: "DCH-77-2", fromStatus: "open", toStatus: "waiting_for_info", changedByName: "TS. Phạm Hải Đăng", reason: "Yêu cầu thêm ảnh và mẫu tôm", changedAt: "2026-09-05T17:35:00" },
      { id: "DCH-77-3", fromStatus: "waiting_for_info", toStatus: "monitoring", changedByName: "TS. Phạm Hải Đăng", reason: "Theo dõi đáp ứng sau điều chỉnh khẩu phần", changedAt: "2026-09-05T19:40:00" },
      { id: "DCH-77-4", fromStatus: "monitoring", toStatus: "in_treatment", changedByName: "TS. Phạm Hải Đăng", reason: "Phác đồ điều trị đã được duyệt", changedAt: "2026-09-07T06:30:00" },
    ],
  },
  {
    id: "DC-71",
    seasonId: "S-A5",
    seasonName: "Vụ Đông Xuân 2025",
    pondName: "Ao A5",
    farmName: "Trang trại Cửa Lấp",
    title: "Đốm đen trên vỏ — theo dõi",
    description: "Vài cá thể xuất hiện đốm đen nhỏ trên vỏ, chưa lan rộng.",
    severity: "low",
    status: "monitoring",
    expertId: "EXP-1",
    expertName: "TS. Phạm Hải Đăng",
    reportedByName: "Cô Thái Bảo",
    createdAt: "2026-09-02T10:00:00",
    updatedAt: "2026-09-02T11:20:00",
    responsesCount: 1,
    caseSnapshot: {
      recordedAt: "2026-09-02T09:45:00",
      healthStatus: "good",
      avgWeightG: 8,
      mortalityCount: 4,
      ph: 8.1,
      no2MgL: 0.5,
      note: "Đốm đen nhỏ trên 2/30 mẫu, chưa thấy lan rộng.",
    },
    attachments: [
      { id: "DCA-71-1", mediaType: "image/jpeg", caption: "Đốm đen trên vỏ mẫu tôm", uploadedByName: "Cô Thái Bảo", createdAt: "2026-09-02T10:01:00" },
    ],
    responses: [
      { id: "DCR-71-1", authorName: "TS. Phạm Hải Đăng", authorRole: "Chuyên gia", responseType: "expert_instruction", message: "Theo dõi 3 ngày, chụp ảnh lại nếu lan rộng; duy trì khoáng và độ kiềm.", createdAt: "2026-09-02T11:20:00" },
    ],
    statusHistory: [
      { id: "DCH-71-1", toStatus: "open", changedByName: "Cô Thái Bảo", changedAt: "2026-09-02T10:00:00" },
      { id: "DCH-71-2", fromStatus: "open", toStatus: "monitoring", changedByName: "TS. Phạm Hải Đăng", reason: "Dấu hiệu nhẹ, tiếp tục theo dõi 3 ngày", changedAt: "2026-09-02T11:20:00" },
    ],
  },
  {
    id: "DC-62",
    seasonId: "S-B1",
    seasonName: "Vụ Thu 2025",
    pondName: "Ao B1",
    farmName: "Trang trại Cửa Lấp",
    title: "Đường ruột đứt khúc — đã ổn định",
    description: "Tôm giảm ăn nhẹ, kiểm tra mẫu thấy đường ruột không liên tục ở một số cá thể.",
    severity: "medium",
    status: "resolved",
    expertId: "EXP-2",
    expertName: "TS. Phạm Thu Hà",
    reportedByName: "Trần Minh Khoa",
    createdAt: "2026-08-28T08:10:00",
    updatedAt: "2026-09-01T16:20:00",
    responsesCount: 2,
    caseSnapshot: {
      recordedAt: "2026-08-28T08:00:00",
      healthStatus: "warning",
      avgWeightG: 4.2,
      mortalityCount: 12,
      ph: 8,
      no2MgL: 0.6,
      nh3MgL: 0.12,
      note: "6/30 mẫu có đường ruột đứt khúc, sức ăn giảm khoảng 10%.",
    },
    attachments: [],
    responses: [
      { id: "DCR-62-1", authorName: "TS. Phạm Thu Hà", authorRole: "Chuyên gia", responseType: "expert_instruction", message: "Giảm 10% khẩu phần, bổ sung men tiêu hóa và theo dõi nhá trong 72 giờ.", createdAt: "2026-08-28T09:00:00" },
      { id: "DCR-62-2", authorName: "Trần Minh Khoa", authorRole: "KTV", responseType: "monitoring_result", message: "Sau 72 giờ, đường ruột đầy trở lại ở 29/30 mẫu và sức ăn bình thường.", createdAt: "2026-09-01T15:50:00" },
    ],
    statusHistory: [
      { id: "DCH-62-1", toStatus: "open", changedByName: "Trần Minh Khoa", changedAt: "2026-08-28T08:10:00" },
      { id: "DCH-62-2", fromStatus: "open", toStatus: "monitoring", changedByName: "TS. Phạm Thu Hà", reason: "Theo dõi đáp ứng men tiêu hóa", changedAt: "2026-08-28T09:00:00" },
      { id: "DCH-62-3", fromStatus: "monitoring", toStatus: "resolved", changedByName: "TS. Phạm Thu Hà", reason: "Mẫu kiểm tra và sức ăn đã trở lại bình thường", changedAt: "2026-09-01T16:20:00" },
    ],
    resolutionSummary: "Đàn tôm đáp ứng tốt sau điều chỉnh khẩu phần và bổ sung men tiêu hóa; không cần phác đồ thuốc.",
    resolvedByName: "TS. Phạm Thu Hà",
    resolvedAt: "2026-09-01T16:20:00",
  },
]

const mockProductImage = (label: string, accent: string) =>
  `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="640" height="440" viewBox="0 0 640 440"><rect width="640" height="440" rx="32" fill="#f8fafc"/><rect x="80" y="55" width="480" height="330" rx="28" fill="${accent}" opacity=".12"/><path d="M235 120h170l40 55v165H195V175z" fill="white" stroke="${accent}" stroke-width="12"/><path d="M195 175h250M235 120l-40 55M405 120l40 55" fill="none" stroke="${accent}" stroke-width="12"/><text x="320" y="240" text-anchor="middle" font-family="Arial,sans-serif" font-size="30" font-weight="700" fill="${accent}">${label}</text><text x="320" y="282" text-anchor="middle" font-family="Arial,sans-serif" font-size="18" fill="#64748b">Ảnh minh họa sản phẩm</text></svg>`)}`;

export const ownerProducts: OwnerProduct[] = [
  {
    id: "PRD-1",
    isDeleted: false,
    farmId: "F1",
    name: "Thức ăn CP 9004 (40% đạm)",
    category: "feed",
    unit: "kg",
    imageUrls: [mockProductImage("Mặt trước", "#0284c7"), mockProductImage("Nhãn sản phẩm", "#0f766e")],
    minAlertQuantity: 200,
    description: "Thức ăn tôm giai đoạn lớn (cỡ 2–3).",
    currentStock: 580,
  },
  {
    id: "PRD-2",
    isDeleted: false,
    farmId: "F1",
    name: "Khoáng tạt Dolomite",
    category: "mineral",
    unit: "kg",
    imageUrls: [mockProductImage("Bao bì", "#0284c7"), mockProductImage("Thông tin nhãn", "#7c3aed")],
    minAlertQuantity: 300,
    currentStock: 1240,
  },
  {
    id: "PRD-3",
    isDeleted: false,
    farmId: "F1",
    name: "Chế phẩm xử lý nước Nitrosomonas/Nitrobacter",
    category: "chemical",
    unit: "l",
    imageUrls: [mockProductImage("Can sản phẩm", "#0f766e")],
    minAlertQuantity: 30,
    currentStock: 45,
  },
  {
    id: "PRD-4",
    isDeleted: false,
    farmId: "F1",
    name: "Doxycycline 98% (trộn thức ăn)",
    category: "medicine",
    unit: "kg",
    imageUrls: [mockProductImage("Mặt trước", "#e11d48"), mockProductImage("Mặt sau", "#f59e0b")],
    minAlertQuantity: 10,
    currentStock: 8,
  },
  {
    id: "PRD-5",
    isDeleted: false,
    farmId: "F1",
    name: "Men vi sinh Bio-Gut",
    category: "medicine",
    unit: "pack",
    conversionQuantity: 1,
    conversionUnit: "kg",
    imageUrls: [mockProductImage("Gói sản phẩm", "#7c3aed")],
    minAlertQuantity: 10,
    currentStock: 15,
  },
  {
    id: "PRD-6",
    isDeleted: false,
    farmId: "F2",
    name: "Thức ăn Grobest G5 (cỡ 0)",
    category: "feed",
    unit: "kg",
    imageUrls: [mockProductImage("Mặt trước", "#0284c7"), mockProductImage("Nhãn sản phẩm", "#0f766e")],
    minAlertQuantity: 150,
    currentStock: 320,
  },
  {
    id: "PRD-7",
    isDeleted: false,
    farmId: "F2",
    name: "Khoáng tổng hợp Sea-Min",
    category: "mineral",
    unit: "kg",
    imageUrls: [mockProductImage("Bao bì", "#0284c7")],
    minAlertQuantity: 100,
    currentStock: 210,
  },
]

// inventory_balances — current FIFO layers. Quantity is the remaining amount
// in each lot; original received quantity is retained by the append-only ledger.
export const inventoryBalances: InventoryBalance[] = [
  {
    id: "IB-101",
    productId: "PRD-1",
    lotNumber: "L-240901",
    receivedAt: "2026-06-20T08:00:00",
    quantity: 405.6,
    unitPrice: 35000,
    supplierName: "Đại lý thủy sản Minh Phát",
    createdAt: "2026-06-20T08:00:00",
    updatedAt: "2026-09-08T06:12:00",
  },
  {
    id: "IB-111",
    productId: "PRD-1",
    lotNumber: "L-260815",
    receivedAt: "2026-08-15T09:20:00",
    quantity: 174.4,
    unitPrice: 36500,
    supplierName: "Đại lý thủy sản Minh Phát",
    createdAt: "2026-08-15T09:20:00",
    updatedAt: "2026-08-15T09:20:00",
  },
  {
    id: "IB-102",
    productId: "PRD-2",
    lotNumber: "L-240902",
    receivedAt: "2026-06-18T07:30:00",
    quantity: 1240,
    unitPrice: 10000,
    supplierName: "Vật tư nông nghiệp Hòa Bình",
    createdAt: "2026-06-18T07:30:00",
    updatedAt: "2026-09-08T18:05:00",
  },
  {
    id: "IB-103",
    productId: "PRD-3",
    lotNumber: "L-240903",
    receivedAt: "2026-06-22T10:00:00",
    quantity: 45,
    unitPrice: 70000,
    supplierName: "Công ty Aqua Việt",
    createdAt: "2026-06-22T10:00:00",
    updatedAt: "2026-09-08T11:05:00",
  },
  {
    id: "IB-104",
    productId: "PRD-4",
    lotNumber: "L-240904",
    receivedAt: "2026-07-01T09:00:00",
    quantity: 8,
    unitPrice: 120000,
    supplierName: "Công ty Aqua Việt",
    createdAt: "2026-07-01T09:00:00",
    updatedAt: "2026-09-08T06:12:00",
  },
  {
    id: "IB-105",
    productId: "PRD-5",
    lotNumber: "L-240905",
    receivedAt: "2026-07-05T08:10:00",
    quantity: 15,
    unitPrice: 80000,
    supplierName: "Đại lý thủy sản Minh Phát",
    createdAt: "2026-07-05T08:10:00",
    updatedAt: "2026-07-05T08:10:00",
  },
  {
    id: "IB-106",
    productId: "PRD-6",
    lotNumber: "L-260820",
    receivedAt: "2026-08-20T08:00:00",
    quantity: 320,
    unitPrice: 32000,
    supplierName: "Đại lý Hoàng Gia",
    createdAt: "2026-08-20T08:00:00",
    updatedAt: "2026-08-20T08:00:00",
  },
  {
    id: "IB-107",
    productId: "PRD-7",
    lotNumber: "L-260822",
    receivedAt: "2026-08-22T08:00:00",
    quantity: 210,
    unitPrice: 15000,
    supplierName: "Đại lý Hoàng Gia",
    createdAt: "2026-08-22T08:00:00",
    updatedAt: "2026-08-22T08:00:00",
  },
]

export const inventoryTransactions: InventoryTransaction[] = [
  {
    id: "IT-101",
    productId: "PRD-1",
    transactionType: "stock_in",
    quantity: 800,
    totalAmount: 28000000,
    lotNumber: "L-240901",
    reason: "Nhập kho đầu vụ tháng 6/2026",
    performedBy: "Nguyễn Văn Đạt",
    createdAt: "2026-06-20T08:00:00",
  },
  {
    id: "IT-102",
    productId: "PRD-1",
    transactionType: "stock_out",
    referenceType: "operation_execution",
    referenceId: "OE-A3-1806-F",
    seasonId: "S-A3",
    quantity: 36,
    totalAmount: 1260000,
    lotNumber: "L-240901",
    performedBy: "Cô Thái Bảo",
    createdAt: "2026-09-18T06:38:00",
  },
  {
    id: "IT-103",
    productId: "PRD-1",
    transactionType: "stock_out",
    referenceType: "operation_execution",
    referenceId: "OE-A3-1810-F",
    seasonId: "S-A3",
    quantity: 31,
    totalAmount: 1085000,
    lotNumber: "L-240901",
    performedBy: "Cô Thái Bảo",
    createdAt: "2026-09-18T10:44:00",
  },
  {
    id: "IT-104",
    productId: "PRD-4",
    transactionType: "stock_in",
    quantity: 20,
    totalAmount: 2400000,
    lotNumber: "L-240904",
    reason: "Nhập bổ sung theo đơn 07/2026",
    performedBy: "Nguyễn Văn Đạt",
    createdAt: "2026-07-01T09:00:00",
  },
  {
    id: "IT-105",
    productId: "PRD-4",
    transactionType: "stock_out",
    referenceType: "operation_execution",
    referenceId: "OE-A3-0607-T",
    seasonId: "S-A3",
    quantity: 1.35,
    totalAmount: 162000,
    lotNumber: "L-240904",
    performedBy: "Cô Thái Bảo",
    createdAt: "2026-09-06T07:20:00",
  },
  {
    id: "IT-106",
    productId: "PRD-4",
    transactionType: "stock_out",
    quantity: 0.3,
    totalAmount: 36000,
    lotNumber: "L-240904",
    reason: "Bao bì hư hỏng: lập biên bản xử lý tại kho",
    performedBy: "Nguyễn Văn Đạt",
    createdAt: "2026-09-07T06:08:00",
  },
  {
    id: "IT-107",
    productId: "PRD-2",
    transactionType: "stock_in",
    quantity: 1500,
    totalAmount: 15000000,
    lotNumber: "L-240902",
    reason: "Nhập kho đầu vụ",
    performedBy: "Nguyễn Văn Đạt",
    createdAt: "2026-06-18T07:30:00",
  },
  {
    id: "IT-108",
    productId: "PRD-2",
    transactionType: "stock_out",
    quantity: 22.4,
    totalAmount: 224000,
    lotNumber: "L-240902",
    reason: "Không đạt chất lượng: vón cục do bảo quản",
    performedBy: "Nguyễn Văn Đạt",
    createdAt: "2026-09-08T18:05:00",
  },
  {
    id: "IT-109",
    productId: "PRD-3",
    transactionType: "stock_in",
    quantity: 60,
    totalAmount: 4200000,
    lotNumber: "L-240903",
    reason: "Nhập theo kế hoạch xử lý nước",
    performedBy: "Nguyễn Văn Đạt",
    createdAt: "2026-06-22T10:00:00",
  },
  {
    id: "IT-110",
    productId: "PRD-3",
    transactionType: "stock_out",
    referenceType: "operation_execution",
    referenceId: "OE-A3-D5-WATER",
    seasonId: "S-A3",
    quantity: 4.48,
    totalAmount: 313600,
    lotNumber: "L-240903",
    performedBy: "Cô Thái Bảo",
    createdAt: "2026-09-08T11:05:00",
  },
  {
    id: "IT-111",
    productId: "PRD-1",
    transactionType: "stock_in",
    quantity: 300,
    totalAmount: 10950000,
    lotNumber: "L-260815",
    reason: "Nhập bổ sung giai đoạn tăng trưởng",
    performedBy: "Nguyễn Văn Đạt",
    createdAt: "2026-08-15T09:20:00",
  },
  {
    id: "IT-112",
    productId: "PRD-5",
    transactionType: "stock_in",
    quantity: 15,
    totalAmount: 1200000,
    lotNumber: "L-240905",
    reason: "Nhập cho phác đồ chăm sóc đường ruột",
    performedBy: "Nguyễn Văn Đạt",
    createdAt: "2026-07-05T08:10:00",
  },
  {
    id: "IT-113",
    productId: "PRD-6",
    transactionType: "stock_in",
    quantity: 320,
    totalAmount: 10240000,
    lotNumber: "L-260820",
    reason: "Nhập kho đầu vụ Ao D2",
    performedBy: "Nguyễn Văn Đạt",
    createdAt: "2026-08-20T08:00:00",
  },
  {
    id: "IT-114",
    productId: "PRD-7",
    transactionType: "stock_in",
    quantity: 210,
    totalAmount: 3150000,
    lotNumber: "L-260822",
    reason: "Nhập kho đầu vụ Ao D2",
    performedBy: "Nguyễn Văn Đạt",
    createdAt: "2026-08-22T08:00:00",
  },
]

export const ownerTasks: OwnerTask[] = [
  {
    id: "T-301",
    farmId: "F1",
    seasonId: "S-A3",
    title: "Kiểm tra & xử lý NO2 cao tại Ao A3",
    description:
      "NO2 sáng nay đạt 1.9 mg/L vượt ngưỡng. Tạt Yucca theo lịch, tăng cường quạt nước và theo dõi lại sau 6 giờ.",
    priority: "urgent",
    status: "in_progress",
    dueAt: "2026-09-08T12:00:00",
    assignedTo: "KTV-1",
    assignedToName: "Cô Thái Bảo",
    assignedByName: "Nguyễn Văn Đạt",
    seasonName: "Vụ Đông Xuân 2025",
    createdAt: "2026-09-08T06:25:00",
    updatedAt: "2026-09-08T06:40:00",
    startedAt: "2026-09-08T06:40:00",
  },
  {
    id: "T-302",
    farmId: "F1",
    seasonId: "S-A5",
    title: "Chài kiểm tra sinh khối Ao A5",
    description:
      "Đã đến kỳ lấy mẫu tính sinh khối để cập nhật liều cho ăn tuần tới.",
    priority: "high",
    status: "pending",
    dueAt: "2026-09-08T17:00:00",
    assignedTo: "KTV-1",
    assignedToName: "Cô Thái Bảo",
    assignedByName: "Nguyễn Văn Đạt",
    seasonName: "Vụ Đông Xuân 2025",
    createdAt: "2026-09-08T07:10:00",
    updatedAt: "2026-09-08T07:10:00",
  },
  {
    id: "T-298",
    farmId: "F1",
    title: "Vệ sinh, hiệu chuẩn máy đo DO",
    description: "Hiệu chuẩn đầu đo oxy hòa tan trước ca đo sáng.",
    priority: "normal",
    status: "pending",
    dueAt: "2026-09-08T20:00:00",
    assignedTo: "KTV-2",
    assignedToName: "Trần Minh Khoa",
    assignedByName: "Nguyễn Văn Đạt",
    createdAt: "2026-09-07T16:00:00",
    updatedAt: "2026-09-07T16:00:00",
  },
  {
    id: "T-290",
    farmId: "F1",
    seasonId: "S-A3",
    title: "Ghi nhận cho ăn cữ chiều Ao A3",
    description: "Hoàn tất và ghi nhận cữ ăn số 3 trong ngày.",
    priority: "normal",
    status: "completed",
    dueAt: "2026-09-07T15:30:00",
    assignedTo: "KTV-1",
    assignedToName: "Cô Thái Bảo",
    assignedByName: "Nguyễn Văn Đạt",
    seasonName: "Vụ Đông Xuân 2025",
    createdAt: "2026-09-07T08:00:00",
    updatedAt: "2026-09-07T15:40:00",
    startedAt: "2026-09-07T15:20:00",
    completedAt: "2026-09-07T15:40:00",
  },
  {
    id: "T-285",
    farmId: "F2",
    title: "Kiểm tra hệ thống quạt nước ao D2",
    description:
      "Kiểm tra và vệ sinh toàn bộ hệ thống quạt trước khi thả giống.",
    priority: "high",
    status: "pending",
    dueAt: "2026-09-15T08:00:00",
    assignedTo: "KTV-2",
    assignedToName: "Trần Minh Khoa",
    assignedByName: "Nguyễn Văn Đạt",
    createdAt: "2026-09-06T10:00:00",
    updatedAt: "2026-09-06T10:00:00",
  },
]

export const ownerNotifications: OwnerNotification[] = [
  {
    id: "ON-1",
    type: "treatment_protocol_pending",
    category: "protocol",
    title: "Phác đồ điều trị chờ duyệt — DC-77",
    content:
      "TS. Phạm Hải Đăng gửi phác đồ điều trị v2 (Phân trắng Ao A3). Cần duyệt sớm để bắt đầu điều trị.",
    createdAt: "2026-09-08T10:32:00",
    read: false,
    action: { label: "Xem và duyệt", nav: "protocol", id: "PR-1" },
  },
  {
    id: "ON-2",
    type: "production_protocol_pending",
    category: "protocol",
    title: "Phác đồ nuôi chờ duyệt — Ao D2",
    content:
      "TS. Phạm Thu Hà gửi phác đồ nuôi cho Vụ Đông 2025 (Ao D2). Cần duyệt để có thể kích hoạt vụ nuôi.",
    createdAt: "2026-09-07T14:05:00",
    read: false,
    action: { label: "Xem và duyệt", nav: "protocol", id: "PR-2" },
  },
  {
    id: "ON-3",
    type: "inventory_low",
    category: "inventory",
    title: "Tồn kho thấp — Vitamin C tạt",
    content:
      "Tồn kho Vitamin C tạt còn 8 kg (< mức cảnh báo 10 kg). Trang trại Cửa Lấp.",
    createdAt: "2026-09-08T07:00:00",
    read: false,
    action: { label: "Xem kho", nav: "inventory", id: "F1" },
  },
  {
    id: "ON-4",
    type: "water_threshold_exceeded",
    category: "warning",
    title: "Cảnh báo: NO2 vượt ngưỡng — Ao A3",
    content:
      "Cô Thái Bảo ghi nhận NO2 = 1.9 mg/L (ngưỡng 1.0) tại Ao A3. Đã giao nhiệm vụ xử lý.",
    createdAt: "2026-09-08T06:15:00",
    read: true,
    action: { label: "Xem vụ nuôi", nav: "season", id: "S-A3" },
  },
  {
    id: "ON-5",
    type: "task_completed",
    category: "task",
    title: "Nhiệm vụ hoàn thành",
    content:
      "Cô Thái Bảo hoàn thành nhiệm vụ 'Ghi nhận cho ăn cữ chiều Ao A3' — đúng hạn.",
    createdAt: "2026-09-07T15:40:00",
    read: true,
    action: { label: "Xem nhiệm vụ", nav: "tasks", id: "T-290" },
  },
  {
    id: "ON-6",
    type: "season_status_changed",
    category: "season",
    title: "Vụ nuôi Ao B1 đã kích hoạt",
    content:
      "Vụ Thu 2025 tại Ao B1 chuyển sang trạng thái Đang nuôi sau khi thả giống 350.000 con.",
    createdAt: "2026-08-25T08:00:00",
    read: true,
    action: { label: "Xem vụ nuôi", nav: "season", id: "S-B1" },
  },
]

// ── Helpers ────────────────────────────────────────────────────────────────────

export const farmById = (id: string) => ownerFarms.find((f) => f.id === id)!
export const pondById = (id: string) => ownerPonds.find((p) => p.id === id)!
export const seasonById = (id: string) => ownerSeasons.find((s) => s.id === id)!
export const isSeasonVisibleToOwner = (seasonId: string) => {
  const season = ownerSeasons.find((item) => item.id === seasonId)
  if (!season) return false
  const pond = ownerPonds.find((item) => item.id === season.pondId)
  const farm = ownerFarms.find((item) => item.id === season.farmId)
  return !!pond && !pond.isDeleted && !!farm && !farm.isDeleted
}
export const isOwnerNotificationVisible = (notification: OwnerNotification) => {
  const action = notification.action
  if (!action) return true
  if (action.nav === "season" && action.id)
    return isSeasonVisibleToOwner(action.id)
  if (action.nav === "inventory" && action.id)
    return ownerFarms.some((farm) => farm.id === action.id && !farm.isDeleted)
  if (action.nav === "case" && action.id) {
    const caseItem = ownerDiseaseCases.find((item) => item.id === action.id)
    return !!caseItem && isSeasonVisibleToOwner(caseItem.seasonId)
  }
  if (action.nav === "protocol" && action.id) {
    const protocol = allSeasonProtocols.find((item) => item.id === action.id)
    return !!protocol && isSeasonVisibleToOwner(protocol.seasonId)
  }
  if (action.nav === "tasks" && action.id) {
    const task = ownerTasks.find((item) => item.id === action.id)
    const farm = task
      ? ownerFarms.find((item) => item.id === task.farmId)
      : undefined
    return !!task && !!farm && !farm.isDeleted && (!task.seasonId || isSeasonVisibleToOwner(task.seasonId))
  }
  return true
}
export const personnelById = (id: string) =>
  ownerPersonnel.find((p) => p.id === id)!
export const productById = (id: string) =>
  ownerProducts.find((p) => p.id === id)!

export const pondsForFarm = (farmId: string) =>
  ownerPonds.filter((p) => p.farmId === farmId && !p.isDeleted)
export const seasonsForPond = (pondId: string) =>
  ownerSeasons.filter((s) => s.pondId === pondId)
export const assignmentsForSeason = (seasonId: string) =>
  seasonAssignments.filter((a) => a.seasonId === seasonId && !a.unassignedAt)
export const productsForFarm = (farmId: string) =>
  ownerProducts.filter((p) => p.farmId === farmId && !p.isDeleted)
export const balancesForProduct = (productId: string) =>
  inventoryBalances
    .filter((balance) => balance.productId === productId && balance.quantity > 0)
    .sort((a, b) => a.receivedAt.localeCompare(b.receivedAt))
export const plannedUseCountForProduct = (productId: string) => {
  const product = ownerProducts.find((item) => item.id === productId)
  const itemIds = new Set(
    allSeasonProtocols.flatMap((protocol) =>
      protocol.items
        .filter(
          (item) =>
            item.productId === productId ||
            (!!product && item.productName === product.name),
        )
        .map((item) => item.id),
    ),
  )
  return ownerOperationOccurrences.filter(
    (occurrence) =>
      occurrence.status === "planned" && itemIds.has(occurrence.protocolItemId),
  ).length
}
export const transactionsForProduct = (productId: string) =>
  inventoryTransactions
    .filter((t) => t.productId === productId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
export const harvestsForSeason = (seasonId: string) =>
  harvestEvents
    .filter((h) => h.seasonId === seasonId)
    .sort((a, b) => b.harvestedAt.localeCompare(a.harvestedAt))
export const tasksForSeason = (seasonId: string) =>
  ownerTasks.filter((t) => t.seasonId === seasonId)

export const personnelCurrentAssignments = (accountId: string) =>
  seasonAssignments
    .filter(
      (a) =>
        a.accountId === accountId &&
        !a.unassignedAt &&
        isSeasonVisibleToOwner(a.seasonId),
    )
    .map((a) => {
      const s = ownerSeasons.find((s) => s.id === a.seasonId)
      return s
        ? {
            seasonId: s.id,
            seasonName: s.name,
            pondName: s.pondName,
            farmName: s.farmName,
          }
        : null
    })
    .filter(Boolean)

export const unreadOwnerNotifCount = () =>
  ownerNotifications.filter((n) => !n.read).length
export const pendingProtocolCount = () =>
  pendingProtocols.filter((p) => p.status === "pending_approval").length

// ── water_quality_logs — mirrors DB schema exactly ────────────────────────────
// Columns: temperature_c, ph, dissolved_oxygen_mg_l, salinity_ppt,
//          nh3_mg_l, no2_mg_l, alkalinity_mg_l_caco3, h2s_mg_l,
//          note, is_voided (immutable record, void instead of delete — BR-WATER-01)

export interface OwnerWaterLog {
  id: string
  seasonId: string
  recordedAt: string
  recordedByName: string
  // measured fields (all nullable per DB — sensor may be absent)
  temperatureC?: number
  ph?: number
  dissolvedOxygenMgL?: number
  salinityPpt?: number
  nh3MgL?: number
  no2MgL?: number
  alkalinityMgLCaCO3?: number
  h2sMgL?: number
  note?: string
  isVoided: boolean
  voidedByName?: string
  voidedAt?: string
  voidReason?: string
}

export const ownerWaterLogs: OwnerWaterLog[] = [
  {
    id: "WL-A3-1",
    seasonId: "S-A3",
    recordedAt: "2026-09-18T06:15:00",
    recordedByName: "Cô Thái Bảo",
    temperatureC: 28.5,
    ph: 7.8,
    dissolvedOxygenMgL: 5.2,
    salinityPpt: 15.3,
    nh3MgL: 0.012,
    no2MgL: 0.08,
    alkalinityMgLCaCO3: 142,
    h2sMgL: 0.0,
    isVoided: false,
  },
  {
    id: "WL-A3-2",
    seasonId: "S-A3",
    recordedAt: "2026-09-17T16:10:00",
    recordedByName: "Cô Thái Bảo",
    temperatureC: 29.4,
    ph: 8.6,
    dissolvedOxygenMgL: 4.1,
    salinityPpt: 18,
    nh3MgL: 0.32,
    no2MgL: 1.9,
    alkalinityMgLCaCO3: 142,
    h2sMgL: 0.02,
    note: "Sau mưa, tôm giảm bắt mồi. Đã tăng quạt nước và báo Chuyên gia.",
    isVoided: false,
  },
  {
    id: "WL-A3-VOID",
    seasonId: "S-A3",
    recordedAt: "2026-09-17T06:05:00",
    recordedByName: "Cô Thái Bảo",
    temperatureC: 39.5,
    ph: 7.7,
    dissolvedOxygenMgL: 5.1,
    salinityPpt: 15.1,
    isVoided: true,
    voidedByName: "Cô Thái Bảo",
    voidedAt: "2026-09-17T06:12:00",
    voidReason: "Đầu dò nhiệt chưa ổn định; KTV đo lại sau khi hiệu chuẩn.",
  },
  {
    id: "WL-A3-3",
    seasonId: "S-A3",
    recordedAt: "2026-09-16T06:10:00",
    recordedByName: "Cô Thái Bảo",
    temperatureC: 28.2,
    ph: 7.9,
    dissolvedOxygenMgL: 5.4,
    salinityPpt: 15.0,
    nh3MgL: 0.01,
    no2MgL: 0.06,
    alkalinityMgLCaCO3: 140,
    h2sMgL: 0,
    note: "Nước ổn định, màu tảo phù hợp.",
    isVoided: false,
  },
  {
    id: "WL-A5-1",
    seasonId: "S-A5",
    recordedAt: "2026-09-18T06:30:00",
    recordedByName: "Cô Thái Bảo",
    temperatureC: 29.0,
    ph: 7.9,
    dissolvedOxygenMgL: 4.8,
    salinityPpt: 14.7,
    nh3MgL: 0.008,
    no2MgL: 0.05,
    alkalinityMgLCaCO3: 138,
    h2sMgL: 0.0,
    isVoided: false,
  },
  {
    id: "WL-B1-1",
    seasonId: "S-B1",
    recordedAt: "2026-09-18T06:00:00",
    recordedByName: "Trần Minh Khoa",
    temperatureC: 27.5,
    ph: 8.0,
    dissolvedOxygenMgL: 5.5,
    salinityPpt: 18.0,
    nh3MgL: 0.005,
    no2MgL: 0.02,
    alkalinityMgLCaCO3: 155,
    h2sMgL: 0.0,
    isVoided: false,
  },
]

// Kept as a compatibility read model for protocol source lookups.
export const latestWaterLogs = ownerWaterLogs
export const waterLogsForSeason = (seasonId: string) =>
  ownerWaterLogs
    .filter((log) => log.seasonId === seasonId)
    .sort((a, b) => b.recordedAt.localeCompare(a.recordedAt))
export const latestWaterForSeason = (seasonId: string): OwnerWaterLog | null =>
  waterLogsForSeason(seasonId).find((log) => !log.isVoided) ?? null

// ── shrimp_health_logs — mirrors DB schema exactly ────────────────────────────
// health_status enum: "excellent" | "good" | "warning" | "critical"
// is_voided: immutable record, void instead of delete (BR-HEALTH-01)

export type OwnerHealthStatus = "excellent" | "good" | "warning" | "critical"

export interface OwnerHealthLog {
  id: string
  seasonId: string
  recordedAt: string
  recordedByName: string
  sampleSize?: number // số tôm lấy mẫu
  avgWeightG?: number // avg_weight_g — trọng lượng TB (g)
  avgLengthCm?: number // avg_length_cm — chiều dài TB (cm)
  mortalityCount: number // số tôm hao hụt
  estimatedPopulation?: number // estimated_population — ước tính tổng đàn
  estimatedBiomassKg?: number // estimated_biomass_kg — sinh khối ước tính (kg)
  healthStatus: OwnerHealthStatus
  note?: string
  isVoided: boolean
  voidedByName?: string
  voidedAt?: string
  voidReason?: string
}

// Previous-sample data for growth delta calculation (second-to-last records)
export const prevHealthLogs: Pick<OwnerHealthLog, "seasonId" | "avgWeightG" | "recordedAt">[] =
  [
    { seasonId: "S-A3", avgWeightG: 9.3, recordedAt: "2026-09-11T07:00:00" },
    { seasonId: "S-A5", avgWeightG: 4.9, recordedAt: "2026-09-11T07:15:00" },
    { seasonId: "S-B1", avgWeightG: 1.2, recordedAt: "2026-09-11T06:45:00" },
  ]

export const ownerHealthLogs: OwnerHealthLog[] = [
  {
    id: "HL-A3-1",
    seasonId: "S-A3",
    recordedAt: "2026-09-18T07:00:00",
    recordedByName: "Cô Thái Bảo",
    sampleSize: 120,
    avgWeightG: 12.4,
    avgLengthCm: 11.2,
    mortalityCount: 340,
    estimatedPopulation: 391200,
    estimatedBiomassKg: 4851,
    healthStatus: "warning",
    note: "Tôm vẫn còn dấu hiệu phân trắng, giảm bắt mồi cữ chiều, đang điều trị.",
    isVoided: false,
  },
  {
    id: "HL-A3-2",
    seasonId: "S-A3",
    recordedAt: "2026-09-11T07:00:00",
    recordedByName: "Cô Thái Bảo",
    sampleSize: 110,
    avgWeightG: 9.3,
    avgLengthCm: 9.8,
    mortalityCount: 120,
    estimatedPopulation: 398500,
    estimatedBiomassKg: 3706,
    healthStatus: "good",
    note: "Tôm bắt mồi tốt, đường ruột đầy, vỏ cứng.",
    isVoided: false,
  },
  {
    id: "HL-A3-VOID",
    seasonId: "S-A3",
    recordedAt: "2026-09-14T07:10:00",
    recordedByName: "Cô Thái Bảo",
    sampleSize: 20,
    avgWeightG: 18.2,
    avgLengthCm: 12.1,
    mortalityCount: 0,
    estimatedPopulation: 398000,
    estimatedBiomassKg: 7244,
    healthStatus: "excellent",
    note: "Mẫu thử ban đầu.",
    isVoided: true,
    voidedByName: "Cô Thái Bảo",
    voidedAt: "2026-09-14T07:25:00",
    voidReason: "Cỡ mẫu không đủ đại diện, số liệu sinh khối sai lệch.",
  },
  {
    id: "HL-A5-1",
    seasonId: "S-A5",
    recordedAt: "2026-09-18T07:15:00",
    recordedByName: "Cô Thái Bảo",
    sampleSize: 100,
    avgWeightG: 6.7,
    avgLengthCm: 7.8,
    mortalityCount: 180,
    estimatedPopulation: 370800,
    estimatedBiomassKg: 2484,
    healthStatus: "good",
    note: "Xuất hiện vài cá thể đốm đen, đang theo dõi.",
    isVoided: false,
  },
  {
    id: "HL-B1-1",
    seasonId: "S-B1",
    recordedAt: "2026-09-18T06:45:00",
    recordedByName: "Trần Minh Khoa",
    sampleSize: 80,
    avgWeightG: 2.1,
    avgLengthCm: 4.0,
    mortalityCount: 50,
    estimatedPopulation: 322450,
    estimatedBiomassKg: 677,
    healthStatus: "excellent",
    note: "Tôm khỏe mạnh, hoạt động bình thường.",
    isVoided: false,
  },
]

// Kept as a compatibility read model for protocol source-health references.
export const latestHealthLogs = ownerHealthLogs
export const healthLogsForSeason = (seasonId: string) =>
  ownerHealthLogs
    .filter((log) => log.seasonId === seasonId)
    .sort((a, b) => b.recordedAt.localeCompare(a.recordedAt))
export const latestHealthForSeason = (
  seasonId: string,
): OwnerHealthLog | null =>
  healthLogsForSeason(seasonId).find((log) => !log.isVoided) ?? null

// ── Derived KPI metrics (computed from health log + season data) ──────────────
// survivalRatePct = estimatedPopulation / season.initialQuantity * 100
// growthG = latest avgWeightG − previous avgWeightG
// fcr = total_feed_used_kg / (current_biomass_kg − initial_biomass_kg)  [mocked]

export interface SeasonKpi {
  survivalRatePct: number
  growthG: number
  fcr: number // mocked — real = ΣfeedUsed / ΔbiomassKg
}

// FCR mock per season (real value comes from ops aggregation)
const mockFcr: Record<string, number> = {
  "S-A3": 1.42,
  "S-A5": 1.31,
  "S-B1": 1.08,
}

export const seasonKpiFor = (seasonId: string): SeasonKpi | null => {
  const season = ownerSeasons.find((s) => s.id === seasonId)
  const health = latestHealthForSeason(seasonId)
  if (!season || !health || !season.initialQuantity) return null

  const survived = health.estimatedPopulation ?? 0
  const survivalRatePct =
    Math.round((survived / season.initialQuantity) * 1000) / 10

  const prev = prevHealthLogs.find((p) => p.seasonId === seasonId)
  const growthG =
    health.avgWeightG != null && prev?.avgWeightG != null
      ? Math.round((health.avgWeightG - prev.avgWeightG) * 10) / 10
      : 0

  return { survivalRatePct, growthG, fcr: mockFcr[seasonId] ?? 0 }
}

// Legacy alias kept for backward compat with OwnerSeasons.tsx
export const metricsForSeason = seasonKpiFor

// ── Season Protocols (all protocols linked to a season) ───────────────────────

export const allSeasonProtocols: PendingProtocol[] = [
  ...pendingProtocols,
  {
    id: "PR-3",
    protocolType: "production",
    seasonId: "S-A3",
    seasonName: "Vụ Đông Xuân 2025",
    pondName: "Ao A3",
    farmName: "Trang trại Cửa Lấp",
    title: "Mô hình nuôi tôm thẻ 90 ngày — tham chiếu Khuyến nông",
    versionNo: 1,
    status: "approved",
    createdBy: "TS. Phạm Hải Đăng",
    submittedAt: "2026-06-20T09:00:00",
    reviewedAt: "2026-06-20T15:10:00",
    reviewedBy: "Nguyễn Văn Đạt",
    statusHistory: [
      { id: "PHS-3-1", toStatus: "draft", changedBy: "TS. Phạm Hải Đăng", changedAt: "2026-06-18T08:00:00" },
      { id: "PHS-3-2", fromStatus: "draft", toStatus: "pending_approval", changedBy: "TS. Phạm Hải Đăng", changedAt: "2026-06-20T09:00:00" },
      { id: "PHS-3-3", fromStatus: "pending_approval", toStatus: "approved", changedBy: "Nguyễn Văn Đạt", changedAt: "2026-06-20T15:10:00" },
    ],
    allowedVariancePct: 10,
    rollingWindowDays: 7,
    summary:
      "Mô hình kỹ thuật tham chiếu phù hợp nguyên tắc VietGAP, không phải một công thức VietGAP bắt buộc. DOC 1–30 chia 6 cữ/ngày; DOC 31–90 chia 4 cữ/ngày với tổng khẩu phần tham chiếu 3% sinh khối. Chế phẩm xử lý nước dùng định kỳ 4 ngày/lần.",
    items: [
      ...[
        { start: 0, end: 5, dose: 1.6 },
        { start: 6, end: 11, dose: 2.6 },
        { start: 12, end: 17, dose: 3.5 },
        { start: 18, end: 23, dose: 4.5 },
        { start: 24, end: 29, dose: 6.6 },
      ].flatMap((phase, phaseIndex) =>
        ["06:30", "09:30", "12:30", "15:30", "18:30", "21:30"].map(
          (plannedTime, mealIndex) => ({
            id: `PI-10-B${phaseIndex + 1}-M${mealIndex + 1}`,
            sequenceOrder: phaseIndex * 6 + mealIndex + 1,
            operationType: "feeding" as const,
            productName: "Thức ăn công nghiệp 40% đạm — cỡ 0",
            startDayOffset: phase.start,
            endDayOffset: phase.end,
            repeatIntervalDays: 1,
            doseBasis: "fixed_quantity" as const,
            doseValue: phase.dose,
            doseUnit: "kg",
            mealNumber: mealIndex + 1,
            plannedTime,
            instructions:
              "Rải đều quanh ao. Lượng thực tế phải điều chỉnh theo bắt mồi, thời tiết và chất lượng nước.",
          }),
        ),
      ),
      ...["06:30", "10:30", "14:30", "17:30"].map((plannedTime, index) => ({
        id: `PI-11-${index + 1}`,
        productId: "PRD-1",
        sequenceOrder: index + 31,
        operationType: "feeding" as const,
        productName: "Thức ăn CP 9004 (cỡ 2, 40% đạm)",
        startDayOffset: 30,
        endDayOffset: 59,
        repeatIntervalDays: 1,
        doseBasis: "percent_biomass" as const,
        doseValue: 0.75,
        doseUnit: "kg",
        mealNumber: index + 1,
        plannedTime,
        instructions: "Giảm 20% khi DO < 4 mg/L hoặc trời mưa.",
      })),
      ...["06:30", "10:30", "14:30", "17:30"].map((plannedTime, index) => ({
        id: `PI-12-${index + 1}`,
        sequenceOrder: index + 35,
        operationType: "feeding" as const,
        productName: "Thức ăn CP 9006 (cỡ 3, 38% đạm)",
        startDayOffset: 60,
        endDayOffset: 89,
        repeatIntervalDays: 1,
        doseBasis: "percent_biomass" as const,
        doseValue: 0.75,
        doseUnit: "kg",
        mealNumber: index + 1,
        plannedTime,
        instructions:
          "Theo dõi nhá chặt chẽ; tăng 5–10% nếu ăn hết trước 2 giờ.",
      })),
      {
        id: "PI-13",
        sequenceOrder: 39,
        operationType: "chemical",
        productName: "Chế phẩm xử lý nước Nitrosomonas/Nitrobacter",
        startDayOffset: 0,
        endDayOffset: 89,
        repeatIntervalDays: 4,
        doseBasis: "per_m3_water",
        doseValue: 0.001,
        doseUnit: "kg",
        plannedTime: "17:30",
        instructions:
          "Hòa tan và tạt trực tiếp xuống ao; dùng định kỳ 4 ngày/lần vào 17–18 giờ.",
      },
    ],
  },
  {
    id: "PR-4",
    protocolType: "treatment",
    seasonId: "S-A3",
    seasonName: "Vụ Đông Xuân 2025",
    pondName: "Ao A3",
    farmName: "Trang trại Cửa Lấp",
    diseaseCaseId: "DC-77",
    diseaseCaseTitle: "Nghi phân trắng & mềm vỏ — Ao A3",
    title: "Phác đồ điều trị Phân trắng — Ao A3 v1",
    versionNo: 1,
    status: "superseded",
    createdBy: "TS. Phạm Hải Đăng",
    submittedAt: "2026-09-05T20:00:00",
    reviewedAt: "2026-09-05T21:10:00",
    reviewedBy: "Nguyễn Văn Đạt",
    supersededAt: "2026-09-07T06:10:00",
    statusHistory: [
      { id: "PHS-4-1", toStatus: "draft", changedBy: "TS. Phạm Hải Đăng", changedAt: "2026-09-05T19:30:00" },
      { id: "PHS-4-2", fromStatus: "draft", toStatus: "pending_approval", changedBy: "TS. Phạm Hải Đăng", changedAt: "2026-09-05T20:00:00" },
      { id: "PHS-4-3", fromStatus: "pending_approval", toStatus: "approved", changedBy: "Nguyễn Văn Đạt", changedAt: "2026-09-05T21:10:00" },
      { id: "PHS-4-4", fromStatus: "approved", toStatus: "superseded", changedBy: "Hệ thống", reason: "Chuyển sang phác đồ điều trị phiên bản 2", changedAt: "2026-09-07T06:10:00" },
    ],
    summary: "Phiên bản 1 — đã được thay thế bởi v2 do hiệu quả chậm.",
    items: [
      {
        id: "PI-15",
        sequenceOrder: 1,
        operationType: "medicine",
        productName: "Doxycycline 98% (trộn thức ăn)",
        startDayOffset: 0,
        endDayOffset: 4,
        repeatIntervalDays: 1,
        doseBasis: "per_kg_biomass",
        doseValue: 0.03,
        doseUnit: "g",
        mealNumber: 1,
        plannedTime: "07:00",
        instructions: "Trộn đều với thức ăn buổi sáng.",
      },
    ],
  },
  {
    id: "PR-5",
    protocolType: "production",
    seasonId: "S-A5",
    seasonName: "Vụ Đông Xuân 2025",
    pondName: "Ao A5",
    farmName: "Trang trại Cửa Lấp",
    title: "Phác đồ nuôi Tôm thẻ — Ao A5 v1",
    versionNo: 1,
    status: "approved",
    createdBy: "TS. Phạm Hải Đăng",
    submittedAt: "2026-07-15T09:00:00",
    summary: "Phác đồ nuôi DOC 1–90 ao A5.",
    items: [
      {
        id: "PI-20",
        sequenceOrder: 1,
        operationType: "feeding",
        productName: "Thức ăn Grobest G5 (cỡ 0)",
        startDayOffset: 0,
        endDayOffset: 29,
        repeatIntervalDays: 1,
        doseBasis: "fixed_quantity",
        doseValue: 10,
        doseUnit: "kg",
        instructions: "Chia 4 cữ/ngày. Kiểm tra nhá sau 2h.",
      },
      {
        id: "PI-21",
        sequenceOrder: 2,
        operationType: "feeding",
        productName: "Thức ăn Grobest G8 (cỡ 2)",
        startDayOffset: 30,
        endDayOffset: 89,
        repeatIntervalDays: 1,
        doseBasis: "percent_biomass",
        doseValue: 4.5,
        doseUnit: "kg",
        instructions: "Chia 4 cữ/ngày.",
      },
    ],
  },
]

const referenceFirstSixDayOccurrences: OwnerOperationOccurrence[] = Array.from(
  { length: 6 },
  (_, dayIndex) => {
    const date = new Date("2026-06-28T00:00:00")
    date.setDate(date.getDate() + dayIndex)
    const datePart = date.toISOString().slice(0, 10)
    return ["06:30", "09:30", "12:30", "15:30", "18:30", "21:30"].map(
      (time, mealIndex): OwnerOperationOccurrence => {
        const plannedQuantity = 1.6
        const actualQuantity =
          dayIndex === 2 && mealIndex === 3
            ? 1.35
            : Math.round((plannedQuantity - ((dayIndex + mealIndex) % 3) * 0.05) * 100) / 100
        return {
          id: `OS-A3-D${dayIndex + 1}-M${mealIndex + 1}`,
          protocolId: "PR-3",
          protocolItemId: `PI-10-B1-M${mealIndex + 1}`,
          seasonId: "S-A3",
          operationType: "feeding",
          productName: "Thức ăn công nghiệp 40% đạm — cỡ 0",
          scheduledAt: `${datePart}T${time}:00`,
          plannedQuantity,
          unit: "kg",
          doseBasis: "fixed_quantity",
          doseValue: plannedQuantity,
          calculatedAt: `${datePart}T00:05:00`,
          calculationVersion: "dose-calc-v2.1",
          mealNumber: mealIndex + 1,
          status: "completed",
          execution: {
            id: `OE-A3-D${dayIndex + 1}-M${mealIndex + 1}`,
            actualProductName:
              dayIndex === 0 && mealIndex === 0
                ? "Thức ăn 40% đạm — lô TA0628-A"
                : undefined,
            actualQuantity,
            executedAt: `${datePart}T${time.slice(0, 3)}${String(Number(time.slice(3)) + 8).padStart(2, "0")}:00`,
            executedBy: "Cô Thái Bảo",
            note:
              dayIndex === 0 && mealIndex === 0
                ? "Tôm giống bắt mồi đồng đều, không có tôm yếu quanh bờ."
                : dayIndex === 4 && mealIndex === 5
                  ? "Kiểm tra cuối ngày: đường ruột đầy, phản xạ tốt."
                  : undefined,
            varianceReason:
              dayIndex === 2 && mealIndex === 3
                ? "Giảm 0,25 kg (15,6%) vì mưa rào, tôm giảm bắt mồi; đã báo Chuyên gia qua ca theo dõi."
                : undefined,
          },
        }
      },
    )
  },
).flat()

const referenceWaterOccurrences: OwnerOperationOccurrence[] = [
  { day: 1, date: "2026-06-28" },
  { day: 5, date: "2026-07-02" },
].map(({ day, date }) => ({
  id: `OS-A3-D${day}-WATER`,
  protocolId: "PR-3",
  protocolItemId: "PI-13",
  seasonId: "S-A3",
  operationType: "chemical",
  productName: "Chế phẩm xử lý nước Nitrosomonas/Nitrobacter",
  scheduledAt: `${date}T17:30:00`,
  plannedQuantity: 4.48,
  unit: "kg",
  doseBasis: "per_m3_water",
  doseValue: 0.001,
  basisQuantity: 4480,
  basisUnit: "m3_water",
  calculatedAt: `${date}T00:05:00`,
  calculationVersion: "dose-calc-v2.1",
  status: "completed",
  execution: {
    id: `OE-A3-D${day}-WATER`,
    actualQuantity: day === 1 ? 4.5 : 4.48,
    executedAt: `${date}T17:42:00`,
    executedBy: "Cô Thái Bảo",
    note: "Đã hòa tan hoàn toàn, tạt đều quanh ao và duy trì quạt nước.",
  },
}))

// Read model for the Owner timeline. Each row still mirrors one DB
// operation_schedule; the UI groups rows that share scheduledAt into one real-world shift.
export const ownerOperationOccurrences: OwnerOperationOccurrence[] = [
  ...referenceFirstSixDayOccurrences,
  ...referenceWaterOccurrences,
  {
    id: "OS-A3-1806-F",
    protocolId: "PR-3",
    protocolItemId: "PI-12-1",
    seasonId: "S-A3",
    operationType: "feeding",
    productName: "Thức ăn CP 9006 (cỡ 3, 38% đạm)",
    scheduledAt: "2026-09-18T06:30:00",
    plannedQuantity: 36.38,
    unit: "kg",
    doseBasis: "percent_biomass",
    doseValue: 0.75,
    basisQuantity: 4851,
    basisUnit: "kg_biomass",
    sourceHealthLogId: "HL-A3-1",
    calculatedAt: "2026-09-17T23:05:00",
    calculationVersion: "dose-calc-v2.1",
    mealNumber: 1,
    instructions: "Rải đều quanh ao, kiểm tra nhá sau 2 giờ.",
    status: "completed",
    execution: {
      id: "OE-A3-1806-F",
      actualProductName: "Thức ăn CP 9004 (40% đạm)",
      actualQuantity: 36,
      executedAt: "2026-09-18T06:38:00",
      executedBy: "Cô Thái Bảo",
      note: "Tôm bắt mồi tốt, nhá sạch sau 1 giờ 50 phút.",
    },
  },
  {
    id: "OS-A3-1810-F",
    protocolId: "PR-3",
    protocolItemId: "PI-12-2",
    seasonId: "S-A3",
    operationType: "feeding",
    productName: "Thức ăn CP 9006 (cỡ 3, 38% đạm)",
    scheduledAt: "2026-09-18T10:30:00",
    plannedQuantity: 36.38,
    unit: "kg",
    doseBasis: "percent_biomass",
    doseValue: 0.75,
    basisQuantity: 4851,
    basisUnit: "kg_biomass",
    sourceHealthLogId: "HL-A3-1",
    calculatedAt: "2026-09-17T23:05:00",
    calculationVersion: "dose-calc-v2.1",
    mealNumber: 2,
    status: "completed",
    execution: {
      id: "OE-A3-1810-F",
      actualProductName: "Thức ăn CP 9004 (40% đạm)",
      actualQuantity: 31,
      executedAt: "2026-09-18T10:44:00",
      executedBy: "Cô Thái Bảo",
      varianceReason:
        "Giảm 5,38 kg (14,8%) vì mưa lớn, DO đo nhanh còn 3,8 mg/L và tôm bắt mồi chậm.",
    },
  },
  {
    id: "OS-A3-1814-F",
    protocolId: "PR-3",
    protocolItemId: "PI-12-3",
    seasonId: "S-A3",
    operationType: "feeding",
    productName: "Thức ăn CP 9006 (cỡ 3, 38% đạm)",
    scheduledAt: "2026-09-18T14:30:00",
    plannedQuantity: 36.38,
    unit: "kg",
    doseBasis: "percent_biomass",
    doseValue: 0.75,
    basisQuantity: 4851,
    basisUnit: "kg_biomass",
    sourceHealthLogId: "HL-A3-1",
    calculatedAt: "2026-09-17T23:05:00",
    calculationVersion: "dose-calc-v2.1",
    mealNumber: 3,
    status: "completed",
    execution: {
      id: "OE-A3-1814-F",
      actualProductName: "Thức ăn CP 9004 (40% đạm)",
      actualQuantity: 35,
      executedAt: "2026-09-18T14:39:00",
      executedBy: "Cô Thái Bảo",
      note: "Nhá sạch sau 1 giờ 55 phút, tôm bắt mồi bình thường.",
    },
  },
  {
    id: "OS-A3-1817-K",
    protocolId: "PR-3",
    protocolItemId: "PI-13",
    seasonId: "S-A3",
    operationType: "chemical",
    productName: "Chế phẩm xử lý nước Nitrosomonas/Nitrobacter",
    scheduledAt: "2026-09-20T17:30:00",
    plannedQuantity: 4.48,
    unit: "kg",
    doseBasis: "per_m3_water",
    doseValue: 0.001,
    basisQuantity: 4480,
    basisUnit: "m3_water",
    calculatedAt: "2026-09-19T23:05:00",
    calculationVersion: "dose-calc-v2.1",
    instructions: "Hòa tan, tạt đều xuống ao và duy trì quạt nước.",
    status: "planned",
  },
  {
    id: "OS-A3-1818-F",
    protocolId: "PR-3",
    protocolItemId: "PI-12-4",
    seasonId: "S-A3",
    operationType: "feeding",
    productName: "Thức ăn CP 9006 (cỡ 3, 38% đạm)",
    scheduledAt: "2026-09-20T17:30:00",
    plannedQuantity: 36.38,
    unit: "kg",
    doseBasis: "percent_biomass",
    doseValue: 0.75,
    basisQuantity: 4851,
    basisUnit: "kg_biomass",
    sourceHealthLogId: "HL-A3-1",
    calculatedAt: "2026-09-19T23:05:00",
    calculationVersion: "dose-calc-v2.1",
    mealNumber: 4,
    status: "planned",
  },
  {
    id: "OS-A3-1906-ERR",
    protocolId: "PR-3",
    protocolItemId: "PI-12-1",
    seasonId: "S-A3",
    operationType: "feeding",
    productName: "Thức ăn CP 9006 (cỡ 3, 38% đạm)",
    scheduledAt: "2026-09-19T06:30:00",
    unit: "kg",
    doseBasis: "percent_biomass",
    doseValue: 0.75,
    mealNumber: 1,
    status: "generation_failed",
    generationError:
      "Bản ghi sinh khối gần nhất đã quá hạn 24 giờ. Hệ thống không tự đoán liều và sẽ thử lại sau khi KTV cập nhật sức khỏe tôm.",
  },
  {
    id: "OS-A3-0607-T",
    protocolId: "PR-4",
    protocolItemId: "PI-15",
    seasonId: "S-A3",
    operationType: "medicine",
    productName: "Doxycycline 98% (trộn thức ăn)",
    scheduledAt: "2026-09-06T07:00:00",
    plannedQuantity: 1.2,
    unit: "kg",
    doseBasis: "per_kg_biomass",
    doseValue: 0.03,
    basisQuantity: 4000,
    basisUnit: "kg_biomass",
    calculatedAt: "2026-09-05T21:15:00",
    calculationVersion: "dose-calc-v2.1",
    mealNumber: 1,
    status: "completed",
    execution: {
      id: "OE-A3-0607-T",
      actualQuantity: 1.35,
      executedAt: "2026-09-06T07:20:00",
      executedBy: "Cô Thái Bảo",
      varianceReason:
        "Tăng 0,15 kg (12,5%) để bù phần thuốc bám lại trong dụng cụ trộn.",
    },
  },
  {
    id: "OS-A3-0707-T",
    protocolId: "PR-4",
    protocolItemId: "PI-15",
    seasonId: "S-A3",
    operationType: "medicine",
    productName: "Doxycycline 98% (trộn thức ăn)",
    scheduledAt: "2026-09-07T07:00:00",
    plannedQuantity: 1.22,
    unit: "kg",
    doseBasis: "per_kg_biomass",
    doseValue: 0.03,
    basisQuantity: 4067,
    basisUnit: "kg_biomass",
    calculatedAt: "2026-09-06T22:05:00",
    calculationVersion: "dose-calc-v2.1",
    mealNumber: 1,
    status: "cancelled",
    cancellation: {
      type: "protocol_superseded",
      reason:
        "Phác đồ điều trị v1 được thay thế; giữ nguyên cữ đã hoàn thành và hủy các cữ tương lai.",
      cancelledAt: "2026-09-07T06:10:00",
      cancelledBy: "Hệ thống theo quyết định duyệt v2",
    },
  },
]

export const operationsForSeason = (seasonId: string) =>
  ownerOperationOccurrences
    .filter((o) => o.seasonId === seasonId)
    .sort((a, b) => b.scheduledAt.localeCompare(a.scheduledAt))

export const operationsForProtocol = (protocolId: string) =>
  ownerOperationOccurrences
    .filter((o) => o.protocolId === protocolId)
    .sort((a, b) => b.scheduledAt.localeCompare(a.scheduledAt))

export const protocolsForSeason = (seasonId: string) =>
  allSeasonProtocols.filter((p) => p.seasonId === seasonId)

export const casesForSeason = (seasonId: string) =>
  ownerDiseaseCases.filter((c) => c.seasonId === seasonId)
