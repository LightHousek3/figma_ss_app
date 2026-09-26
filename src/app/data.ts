// SmartShrimp — mock domain data for the KTV (technician) mobile app.
// Modeled on the Aquaculture Management System schema (V7). Only fields the
// KTV needs on screen are surfaced. IDs are short & human-readable for demo.

export type SeasonStatus = "planning" | "active" | "completed" | "cancelled"
export type OperationStatus = "planned" | "completed" | "cancelled"
export type OperationType = "feeding" | "medicine" | "mineral" | "chemical" | "other"
export type HealthStatus = "excellent" | "good" | "warning" | "critical"
export type TaskStatus = "pending" | "in_progress" | "completed" | "cancelled"
export type TaskPriority = "low" | "normal" | "high" | "urgent"
export type CaseStatus = "open" | "waiting_for_info" | "monitoring" | "in_treatment" | "resolved"
export type CaseSeverity = "low" | "medium" | "high" | "critical"

export interface Farm {
  id: string
  name: string
}

export interface Pond {
  id: string
  farmId: string
  name: string
  areaM2: number
  volumeM3: number
}

export interface Season {
  id: string
  pondId: string
  name: string
  shrimpType: "whiteleg" | "black_tiger"
  status: SeasonStatus
  stockingDate: string // ISO date
  dayOfCulture: number
  initialQuantity: number
  latestBiomassKg: number | null
  latestAvgWeightG: number | null
  estimatedPopulation: number | null
  survivalPct: number | null
  healthStatus: HealthStatus
  expertName: string
}

export interface WaterLog {
  id: string
  seasonId: string
  recordedAt: string
  temperatureC?: number
  ph?: number
  doMgL?: number
  salinityPpt?: number
  nh3MgL?: number
  no2MgL?: number
  alkalinity?: number
  h2sMgL?: number
  note?: string
  voided?: { at: string; by: string; reason: string }
}

export interface HealthLog {
  id: string
  seasonId: string
  recordedAt: string
  sampleSize?: number
  avgWeightG?: number
  avgLengthCm?: number
  mortalityCount: number
  estimatedPopulation?: number
  estimatedBiomassKg?: number
  healthStatus: HealthStatus
  note?: string
  voided?: { at: string; by: string; reason: string }
}

export interface OperationSchedule {
  id: string
  seasonId: string
  operationType: OperationType
  productName: string
  scheduledAt: string
  plannedQuantity: number
  unit: string
  doseBasis: "fixed_quantity" | "per_kg_biomass" | "percent_biomass" | "per_m3_water"
  basisQuantity?: number
  basisUnit?: "kg_biomass" | "m3_water"
  calculationVersion?: string
  mealNumber?: number
  instructions?: string
  status: OperationStatus
  // feeding may bundle a medicine per protocol
  withMedicine?: { productName: string; quantity: number; unit: string }
  execution?: {
    actualQuantity: number
    executedAt: string
    note?: string
    varianceReason?: string
  }
  cancellation?: { type: string; reason: string }
  blocked?: string // early-warning reason a future occurrence cannot generate
}

export interface Task {
  id: string
  title: string
  description: string
  priority: TaskPriority
  status: TaskStatus
  dueAt: string
  seasonId?: string
  assignedBy: string
  startedAt?: string
  completedAt?: string
  cancellationReason?: string
}

export interface CaseResponse {
  id: string
  authorName: string
  authorRole: "KTV" | "Expert"
  type: "request_info" | "provide_info" | "monitoring_result" | "treatment_result" | "emergency_alert" | "expert_assessment" | "expert_instruction" | "resolution"
  message: string
  createdAt: string
}

export interface DiseaseCase {
  id: string
  seasonId: string
  title: string
  description: string
  severity: CaseSeverity
  status: CaseStatus
  expertName: string
  createdAt: string
  aiLabel?: string
  caseSnapshot?: {
    healthStatus?: HealthStatus
    avgWeightG?: number
    mortalityCount?: number
    estimatedBiomassKg?: number
    ph?: number
    doMgL?: number
    nh3MgL?: number
    no2MgL?: number
  }
  responses: CaseResponse[]
}

export interface AiDiagnosis {
  id: string
  seasonId: string
  createdAt: string
  runStatus: "success" | "error"
  predictedLabel?: string
  confidence?: number
  recommendation?: string
  imageCount: number
  modelVersion?: string
  processingTimeMs?: number
  errorCode?: string
  errorMessage?: string
}

export interface ChatQuery {
  id: string
  question: string
  answer?: string
  status: "answered" | "no_source" | "low_match" | "error"
  createdAt: string
  rating?: number
  feedbackComment?: string
}

export interface Notification {
  id: string
  type: string
  category: "warning" | "operation" | "case" | "task" | "protocol" | "season" | "inventory"
  title: string
  content: string
  seasonId?: string
  createdAt: string
  read: boolean
  action?: { label: string; nav: string }
}

// ---------------------------------------------------------------------------

export type AppAccountRole = "farm_owner" | "technician"

interface CurrentUser {
  name: string
  role: string
  roleKey: AppAccountRole
  email: string
  phone: string
  ownerName?: string
  memberSince: string
  totalFarms: number
  totalPersonnel: number
  pendingApprovals: number
  seasonsParticipated: number
  completedTasks: number
  onTimeRatePct: number
}

export const accountProfiles: Record<AppAccountRole, CurrentUser> = {
  farm_owner: {
    name: "Nguyễn Văn Đạt",
    role: "Chủ trang trại",
    roleKey: "farm_owner",
    email: "owner@smartshrimp.vn",
    phone: "0901 234 567",
    memberSince: "2023-06",
    totalFarms: 2,
    totalPersonnel: 4,
    pendingApprovals: 2,
    seasonsParticipated: 0,
    completedTasks: 0,
    onTimeRatePct: 0,
  },
  technician: {
    name: "Cô Thái Bảo",
    role: "Kỹ thuật viên",
    roleKey: "technician",
    email: "technician@smartshrimp.vn",
    phone: "0908 246 810",
    ownerName: "Nông trại Minh Phú",
    memberSince: "2024-02",
    totalFarms: 0,
    totalPersonnel: 0,
    pendingApprovals: 0,
    seasonsParticipated: 3,
    completedTasks: 28,
    onTimeRatePct: 92,
  },
}

export const currentUser: CurrentUser = { ...accountProfiles.technician }

export function applyCurrentUserRole(role: AppAccountRole) {
  Object.assign(currentUser, accountProfiles[role])
  if (role === "farm_owner") delete currentUser.ownerName
}

export const farms: Farm[] = [
  { id: "F1", name: "Trại Cửa Lấp" },
  { id: "F2", name: "Trại Đông Hải" },
]

export const ponds: Pond[] = [
  { id: "P-A3", farmId: "F1", name: "Ao A3", areaM2: 3200, volumeM3: 4480 },
  { id: "P-A5", farmId: "F1", name: "Ao A5", areaM2: 2800, volumeM3: 3920 },
  { id: "P-B1", farmId: "F1", name: "Ao B1", areaM2: 3500, volumeM3: 5250 },
  { id: "P-D2", farmId: "F2", name: "Ao D2", areaM2: 4000, volumeM3: 6000 },
]

export const seasons: Season[] = [
  {
    id: "S-A3",
    pondId: "P-A3",
    name: "Vụ Đông Xuân 2025",
    shrimpType: "whiteleg",
    status: "active",
    stockingDate: "2026-06-28",
    dayOfCulture: 72,
    initialQuantity: 480000,
    latestBiomassKg: 4851,
    latestAvgWeightG: 12.4,
    estimatedPopulation: 391200,
    survivalPct: 81.5,
    healthStatus: "warning",
    expertName: "TS. Phạm Hải Đăng",
  },
  {
    id: "S-A5",
    pondId: "P-A5",
    name: "Vụ Đông Xuân 2025",
    shrimpType: "whiteleg",
    status: "active",
    stockingDate: "2026-07-20",
    dayOfCulture: 50,
    initialQuantity: 420000,
    latestBiomassKg: 690,
    latestAvgWeightG: 8.1,
    estimatedPopulation: 390000,
    survivalPct: 92.9,
    healthStatus: "good",
    expertName: "TS. Phạm Hải Đăng",
  },
  {
    id: "S-B1",
    pondId: "P-B1",
    name: "Vụ Thu 2025",
    shrimpType: "black_tiger",
    status: "active",
    stockingDate: "2026-08-25",
    dayOfCulture: 14,
    initialQuantity: 350000,
    latestBiomassKg: null,
    latestAvgWeightG: null,
    estimatedPopulation: null,
    survivalPct: null,
    healthStatus: "good",
    expertName: "TS. Phạm Thu Hà",
  },
  {
    id: "S-D2",
    pondId: "P-D2",
    name: "Vụ Đông 2025",
    shrimpType: "whiteleg",
    status: "planning",
    stockingDate: "2026-09-15",
    dayOfCulture: 0,
    initialQuantity: 520000,
    latestBiomassKg: null,
    latestAvgWeightG: null,
    estimatedPopulation: null,
    survivalPct: null,
    healthStatus: "good",
    expertName: "TS. Phạm Thu Hà",
  },
]

export const waterLogs: WaterLog[] = [
  {
    id: "W-1042",
    seasonId: "S-A3",
    recordedAt: "2026-09-18T06:15:00",
    temperatureC: 28.5,
    ph: 7.8,
    doMgL: 5.2,
    salinityPpt: 15.3,
    nh3MgL: 0.012,
    no2MgL: 0.08,
    alkalinity: 142,
    h2sMgL: 0,
    note: "Các chỉ số đã về ngưỡng theo dõi sau xử lý.",
  },
  {
    id: "W-1038",
    seasonId: "S-A3",
    recordedAt: "2026-09-07T06:05:00",
    temperatureC: 29.1,
    ph: 8.2,
    doMgL: 4.6,
    salinityPpt: 18,
    nh3MgL: 0.18,
    no2MgL: 0.9,
    alkalinity: 138,
    h2sMgL: 0.012,
  },
  {
    id: "W-1031",
    seasonId: "S-A3",
    recordedAt: "2026-09-06T06:20:00",
    temperatureC: 28.8,
    ph: 8.1,
    doMgL: 5.0,
    salinityPpt: 17,
    nh3MgL: 0.12,
    no2MgL: 0.6,
    alkalinity: 140,
    h2sMgL: 0,
    voided: {
      at: "2026-09-06T09:00:00",
      by: "Cô Thái Bảo",
      reason: "Nhầm đầu đo DO chưa hiệu chuẩn.",
    },
  },
  {
    id: "W-0902",
    seasonId: "S-A5",
    recordedAt: "2026-09-08T06:30:00",
    temperatureC: 28.5,
    ph: 7.9,
    doMgL: 5.4,
    salinityPpt: 20,
    nh3MgL: 0.08,
    no2MgL: 0.4,
    alkalinity: 132,
    h2sMgL: 0,
  },
]

export const healthLogs: HealthLog[] = [
  {
    id: "H-512",
    seasonId: "S-A3",
    recordedAt: "2026-09-18T07:00:00",
    sampleSize: 120,
    avgWeightG: 12.4,
    avgLengthCm: 11.2,
    mortalityCount: 340,
    estimatedPopulation: 391200,
    estimatedBiomassKg: 4851,
    healthStatus: "warning",
    note: "Một số cá thể mềm vỏ, quan sát phân trắng rải rác ở nhá.",
  },
  {
    id: "H-498",
    seasonId: "S-A3",
    recordedAt: "2026-09-04T16:30:00",
    sampleSize: 120,
    avgWeightG: 11.6,
    avgLengthCm: 10.8,
    mortalityCount: 180,
    estimatedPopulation: 418000,
    estimatedBiomassKg: 1090,
    healthStatus: "good",
  },
  {
    id: "H-455",
    seasonId: "S-A5",
    recordedAt: "2026-09-06T16:50:00",
    sampleSize: 100,
    avgWeightG: 8.1,
    avgLengthCm: 9.4,
    mortalityCount: 90,
    estimatedPopulation: 390000,
    estimatedBiomassKg: 690,
    healthStatus: "good",
  },
]

const today = "2026-09-08"
export const operations: OperationSchedule[] = [
  {
    id: "OP-8801",
    seasonId: "S-A3",
    operationType: "feeding",
    productName: "Thức ăn CP 9004 (40% đạm)",
    scheduledAt: `${today}T06:00:00`,
    plannedQuantity: 47.2,
    unit: "kg",
    doseBasis: "percent_biomass",
    basisQuantity: 4851,
    basisUnit: "kg_biomass",
    calculationVersion: "dose-v1",
    mealNumber: 1,
    instructions: "Rải đều quanh ao, kiểm tra nhá sau 2 giờ.",
    status: "completed",
    withMedicine: {
      productName: "Men vi sinh Bio-Gut",
      quantity: 0.5,
      unit: "kg",
    },
    execution: {
      actualQuantity: 47.2,
      executedAt: `${today}T06:12:00`,
      note: "Tôm bắt mồi tốt.",
    },
  },
  {
    id: "OP-8802",
    seasonId: "S-A3",
    operationType: "feeding",
    productName: "Thức ăn CP 9004 (40% đạm)",
    scheduledAt: `${today}T10:30:00`,
    plannedQuantity: 47.2,
    unit: "kg",
    doseBasis: "percent_biomass",
    basisQuantity: 4851,
    basisUnit: "kg_biomass",
    calculationVersion: "dose-v1",
    mealNumber: 2,
    instructions: "Giảm 10% nếu trời âm u, DO thấp.",
    status: "planned",
    withMedicine: { productName: "Vitamin C tạt", quantity: 0.3, unit: "kg" },
  },
  {
    id: "OP-8803",
    seasonId: "S-A3",
    operationType: "chemical",
    productName: "Yucca khử khí độc",
    scheduledAt: `${today}T11:00:00`,
    plannedQuantity: 4.48,
    unit: "l",
    doseBasis: "per_m3_water",
    basisQuantity: 4480,
    basisUnit: "m3_water",
    calculationVersion: "dose-v1",
    instructions: "Tạt lúc trời nắng, chạy quạt. Xử lý NO2 cao.",
    status: "planned",
  },
  {
    id: "OP-8804",
    seasonId: "S-A3",
    operationType: "mineral",
    productName: "Khoáng tạt Dolomite",
    scheduledAt: `${today}T18:00:00`,
    plannedQuantity: 22.4,
    unit: "kg",
    doseBasis: "per_m3_water",
    basisQuantity: 4480,
    basisUnit: "m3_water",
    calculationVersion: "dose-v1",
    instructions: "Tạt chiều mát, ổn định độ kiềm & hỗ trợ lột xác.",
    status: "planned",
  },
  {
    id: "OP-8805",
    seasonId: "S-A3",
    operationType: "feeding",
    productName: "Thức ăn CP 9004 (40% đạm)",
    scheduledAt: `${today}T15:00:00`,
    plannedQuantity: 47.2,
    unit: "kg",
    doseBasis: "percent_biomass",
    mealNumber: 3,
    status: "planned",
  },
  {
    id: "OP-8790",
    seasonId: "S-A3",
    operationType: "medicine",
    productName: "Kháng sinh Doxy (phác đồ điều trị)",
    scheduledAt: "2026-09-07T07:00:00",
    plannedQuantity: 1.2,
    unit: "kg",
    doseBasis: "per_kg_biomass",
    status: "completed",
    execution: {
      actualQuantity: 1.35,
      executedAt: "2026-09-07T07:20:00",
      varianceReason: "Trộn thêm do một phần thức ăn dính thành nhá.",
    },
  },
  {
    id: "OP-8810",
    seasonId: "S-A3",
    operationType: "feeding",
    productName: "Thức ăn CP 9004 (40% đạm)",
    scheduledAt: "2026-09-09T06:00:00",
    plannedQuantity: 0,
    unit: "kg",
    doseBasis: "percent_biomass",
    mealNumber: 1,
    status: "planned",
    blocked:
      "Chưa có bản ghi sinh khối hợp lệ trong 3 ngày — không thể tính liều theo % sinh khối.",
  },
  {
    id: "OP-7702",
    seasonId: "S-A5",
    operationType: "feeding",
    productName: "Thức ăn Grobest G8",
    scheduledAt: `${today}T06:30:00`,
    plannedQuantity: 27.6,
    unit: "kg",
    doseBasis: "percent_biomass",
    mealNumber: 1,
    status: "planned",
  },
  {
    id: "OP-7650",
    seasonId: "S-A5",
    operationType: "feeding",
    productName: "Thức ăn Grobest G8",
    scheduledAt: "2026-09-05T06:30:00",
    plannedQuantity: 26.0,
    unit: "kg",
    doseBasis: "percent_biomass",
    mealNumber: 1,
    status: "cancelled",
    cancellation: {
      type: "protocol_superseded",
      reason: "Phác đồ nuôi được thay thế bằng phiên bản v2.",
    },
  },
]

export const tasks: Task[] = [
  {
    id: "T-301",
    title: "Kiểm tra & xử lý NO2 cao tại Ao A3",
    description:
      "NO2 sáng nay đạt 1.9 mg/L vượt ngưỡng. Tạt Yucca theo lịch, tăng cường quạt nước và theo dõi lại sau 6 giờ.",
    priority: "urgent",
    status: "in_progress",
    dueAt: `${today}T12:00:00`,
    seasonId: "S-A3",
    assignedBy: "Nông trại Minh Phú",
    startedAt: "2026-09-07T14:55:00",
    completedAt: "2026-09-07T15:20:00",
  },
  {
    id: "T-302",
    title: "Chài kiểm tra sinh khối Ao A5",
    description:
      "Đã đến kỳ lấy mẫu tính sinh khối để cập nhật liều cho ăn tuần tới.",
    priority: "high",
    status: "pending",
    dueAt: `${today}T17:00:00`,
    seasonId: "S-A5",
    assignedBy: "Nông trại Minh Phú",
  },
  {
    id: "T-298",
    title: "Vệ sinh, hiệu chuẩn máy đo DO",
    description: "Hiệu chuẩn đầu đo oxy hòa tan trước ca đo sáng.",
    priority: "normal",
    status: "pending",
    dueAt: `${today}T20:00:00`,
    assignedBy: "Nông trại Minh Phú",
  },
  {
    id: "T-290",
    title: "Ghi nhận cho ăn cữ chiều Ao A3",
    description: "Hoàn tất và ghi nhận cữ ăn số 3 trong ngày.",
    priority: "normal",
    status: "completed",
    dueAt: "2026-09-07T15:30:00",
    seasonId: "S-A3",
    assignedBy: "Nông trại Minh Phú",
  },
]

export const diseaseCases: DiseaseCase[] = [
  {
    id: "DC-77",
    seasonId: "S-A3",
    title: "Nghi phân trắng & mềm vỏ — Ao A3",
    description:
      "Quan sát phân trắng rải rác ở nhá, một số tôm mềm vỏ, giảm bắt mồi nhẹ ở cữ chiều. Kèm ảnh nhá và mẫu tôm.",
    severity: "high",
    status: "in_treatment",
    expertName: "TS. Phạm Hải Đăng",
    createdAt: "2026-09-05T17:20:00",
    aiLabel: "White Feces Syndrome (nghi ngờ)",
    caseSnapshot: {
      healthStatus: "warning",
      avgWeightG: 12.4,
      mortalityCount: 340,
      estimatedBiomassKg: 4851,
      ph: 8.6,
      doMgL: 4.1,
      nh3MgL: 0.32,
      no2MgL: 1.9,
    },
    responses: [
      {
        id: "r1",
        authorName: "Cô Thái Bảo",
        authorRole: "KTV",
        type: "provide_info",
        message:
          "Gửi ảnh nhá và 5 mẫu tôm. DOC 69, NO2 đang tăng dần mấy ngày qua.",
        createdAt: "2026-09-05T17:22:00",
      },
      {
        id: "r2",
        authorName: "TS. Phạm Hải Đăng",
        authorRole: "Expert",
        type: "expert_assessment",
        message:
          "Dấu hiệu phù hợp phân trắng giai đoạn sớm. Cần giảm 20% lượng ăn, bổ sung men tiêu hóa và ổn định NO2 trước khi vào phác đồ điều trị.",
        createdAt: "2026-09-05T19:40:00",
      },
      {
        id: "r3",
        authorName: "TS. Phạm Hải Đăng",
        authorRole: "Expert",
        type: "expert_instruction",
        message:
          "Đã tạo phác đồ điều trị v1 (Doxy 5 ngày) và gửi chủ trại duyệt. Bắt đầu khi được duyệt.",
        createdAt: "2026-09-06T08:10:00",
      },
      {
        id: "r4",
        authorName: "Cô Thái Bảo",
        authorRole: "KTV",
        type: "treatment_result",
        message:
          "Đã cho ăn kháng sinh cữ đầu sáng nay, tôm bắt mồi lại khá hơn.",
        createdAt: "2026-09-07T07:30:00",
      },
    ],
  },
  {
    id: "DC-71",
    seasonId: "S-A5",
    title: "Đốm đen trên vỏ — theo dõi",
    description: "Vài cá thể xuất hiện đốm đen nhỏ trên vỏ, chưa lan rộng.",
    severity: "low",
    status: "monitoring",
    expertName: "TS. Phạm Hải Đăng",
    createdAt: "2026-09-02T10:00:00",
    caseSnapshot: {
      healthStatus: "good",
      avgWeightG: 8.1,
      mortalityCount: 90,
      estimatedBiomassKg: 690,
      ph: 7.9,
      doMgL: 5.4,
      nh3MgL: 0.08,
      no2MgL: 0.4,
    },
    responses: [
      {
        id: "r1",
        authorName: "TS. Phạm Hải Đăng",
        authorRole: "Expert",
        type: "expert_instruction",
        message:
          "Theo dõi 3 ngày, chụp ảnh lại nếu lan rộng. Duy trì khoáng và độ kiềm.",
        createdAt: "2026-09-02T11:20:00",
      },
    ],
  },
]

export const aiDiagnoses: AiDiagnosis[] = [
  {
    id: "AI-231",
    seasonId: "S-A3",
    createdAt: "2026-09-05T17:05:00",
    runStatus: "success",
    predictedLabel: "White Feces Syndrome",
    confidence: 0.78,
    recommendation:
      "Dấu hiệu phù hợp hội chứng phân trắng. Nên giảm khẩu phần ăn, bổ sung men vi sinh và tạo Disease Case để chuyên gia đánh giá.",
    imageCount: 4,
    modelVersion: "shrimp-vision-v2.4",
    processingTimeMs: 1840,
  },
  {
    id: "AI-225",
    seasonId: "S-A3",
    createdAt: "2026-09-01T16:00:00",
    runStatus: "success",
    predictedLabel: "Healthy",
    confidence: 0.91,
    recommendation:
      "Không phát hiện dấu hiệu bệnh rõ ràng. Tiếp tục theo dõi định kỳ.",
    imageCount: 3,
    modelVersion: "shrimp-vision-v2.4",
    processingTimeMs: 1520,
  },
]

export const chatQueries: ChatQuery[] = [
  {
    id: "Q-1",
    question:
      "NO2 trong ao 1.9 mg/L ở DOC 70 có nguy hiểm không và xử lý thế nào?",
    answer:
      "Ở giai đoạn DOC 70, NO2 ở mức 1.9 mg/L là cao và gây stress cho tôm. Nên: (1) thay 10–15% nước nếu nguồn nước tốt, (2) tăng cường quạt/oxy, (3) tạt Yucca và bổ sung men vi sinh xử lý đáy, (4) giảm 10–20% lượng ăn để giảm tải hữu cơ, (5) duy trì độ kiềm 120–150 mg/L. Theo dõi lại NO2 sau 6–12 giờ.",
    status: "answered",
    createdAt: "2026-09-08T06:40:00",
    rating: 5,
  },
  {
    id: "Q-2",
    question: "Bao lâu nên chài kiểm tra sinh khối một lần?",
    answer:
      "Thông thường nên chài kiểm tra sinh khối định kỳ 7–10 ngày/lần sau khi tôm đạt ~30 ngày tuổi, và tăng tần suất khi điều chỉnh khẩu phần hoặc trước khi thu tỉa.",
    status: "answered",
    createdAt: "2026-09-06T09:15:00",
  },
]

export const notifications: Notification[] = [
  {
    id: "N-1",
    type: "water_threshold_exceeded",
    category: "warning",
    title: "NO2 vượt ngưỡng — Ao A3",
    content:
      "Nhật ký đo nước W-1042 ghi nhận NO2 = 1.9 mg/L (ngưỡng 1.0). Vụ Đông Xuân 2025 · Ao A3. Cần xử lý khí độc và theo dõi lại.",
    seasonId: "S-A3",
    createdAt: `${today}T06:12:00`,
    read: false,
    action: { label: "Mở Ao A3", nav: "pond:S-A3" },
  },
  {
    id: "N-2",
    type: "schedule_generation_failed",
    category: "warning",
    title: "Không thể tạo lịch cho ăn 09/09 — Ao A3",
    content:
      "Thiếu bản ghi sinh khối hợp lệ trong 3 ngày nên không tính được liều theo % sinh khối cho cữ ăn ngày mai. Hãy chài kiểm tra & ghi nhận sức khỏe.",
    seasonId: "S-A3",
    createdAt: `${today}T05:00:00`,
    read: false,
    action: { label: "Ghi nhận sức khỏe", nav: "health:S-A3" },
  },
  {
    id: "N-3",
    type: "operation_due",
    category: "operation",
    title: "Đến giờ tạt Yucca — Ao A3",
    content:
      "Hoạt động xử lý hóa chất OP-8803 dự kiến 11:00 hôm nay. Vụ Đông Xuân 2025 · Ao A3.",
    seasonId: "S-A3",
    createdAt: `${today}T10:45:00`,
    read: false,
    action: { label: "Xem hoạt động", nav: "op:OP-8803" },
  },
  {
    id: "N-4",
    type: "disease_case_response",
    category: "case",
    title: "Chuyên gia phản hồi ca bệnh DC-77",
    content:
      "TS. Phạm Hải Đăng đã gửi hướng dẫn điều trị cho ca phân trắng tại Ao A3.",
    seasonId: "S-A3",
    createdAt: "2026-09-06T08:12:00",
    read: true,
    action: { label: "Mở ca bệnh", nav: "case:DC-77" },
  },
  {
    id: "N-5",
    type: "task_assigned",
    category: "task",
    title: "Nhiệm vụ mới: Chài kiểm tra sinh khối Ao A5",
    content: "Chủ trại giao nhiệm vụ T-302, hạn 17:00 hôm nay.",
    createdAt: `${today}T05:30:00`,
    read: true,
    action: { label: "Xem nhiệm vụ", nav: "tasks" },
  },
  {
    id: "N-6",
    type: "treatment_protocol_reviewed",
    category: "protocol",
    title: "Phác đồ điều trị được duyệt — DC-77",
    content:
      "Chủ trại đã duyệt phác đồ điều trị v1. Lịch dùng thuốc đã sẵn sàng tại Ao A3.",
    seasonId: "S-A3",
    createdAt: "2026-09-06T09:00:00",
    read: true,
  },
]

// ---- helpers ----
export const pondById = (id: string) => ponds.find((p) => p.id === id)!
export const farmById = (id: string) => farms.find((f) => f.id === id)!
export const seasonById = (id: string) => seasons.find((s) => s.id === id)!
export const pondForSeason = (seasonId: string) =>
  pondById(seasonById(seasonId).pondId)
export const farmForSeason = (seasonId: string) =>
  farmById(pondForSeason(seasonId).farmId)

export const contextLabel = (seasonId: string) => {
  const s = seasonById(seasonId)
  const p = pondForSeason(seasonId)
  const f = farmForSeason(seasonId)
  return { farm: f.name, season: s.name, pond: p.name }
}
