import {
  localizeVehicleType,
  translateWorkshopStatic,
} from "./workshop-text-localizer";

export type WorkshopAssetCategory = "trailer" | "equipment";

export type WorkshopScopeType =
  | "TUV"
  | "Nachprufung"
  | "Gasprufung"
  | "Kundendienst"
  | "UVV"
  | "wheels"
  | "electrics"
  | "brakes"
  | "other";

export type WorkshopOrderStatus =
  | "unassigned"
  | "new"
  | "in_progress"
  | "report_sent"
  | "waiting_client"
  | "approved"
  | "rejected"
  | "completed";

export interface WorkshopChecklist {
  beweglicheTeile: boolean; // Bewegliche Teile abschmieren
  luftdruck: boolean; // Luftdruck kontrollieren
  bremsen: boolean; // Bremsen prüfen ggf. einstellen
  raederFestgezogen: boolean; // Räder festgezogen
  elektrikGeprueft: boolean; // Elektrik / Beleuchtung prüfen
}

export interface WorkshopTimeLog {
  id: string;
  mechanicId: string;
  mechanicName: string;
  startedAt: string; // ISO
  endedAt?: string; // ISO (undefined while running)
  durationMinutes: number;
  note?: string;
}

export interface WorkshopPartItem {
  id: string;
  name: string;
  code?: string;
  quantity: number;
  unit?: string; // szt., m, kpl.
  addedByMechanicId: string;
  addedByMechanicName: string;
  addedAt: string;
}

export interface WorkshopMediaItem {
  id: string;
  url: string;
  type: "photo" | "video";
  stage: "before" | "defect" | "after";
  caption?: string;
  uploadedByMechanicId: string;
  uploadedByMechanicName: string;
  uploadedAt: string;
}

export interface WorkshopDefectReport {
  submittedAt: string;
  submittedByMechanicId: string;
  submittedByMechanicName: string;
  defects: string[];
  requiredParts: string[];
  estimatedHours: number;
  notes?: string;
}

export interface WorkshopTransferEntry {
  id: string;
  timestamp: string;
  fromUnit: string;
  toUnit: string;
  fromMechanicIds: string[];
  toMechanicIds: string[];
  transferredBy: string;
  reason?: string;
}

export interface WorkshopFinalProtocol {
  completedAt: string;
  totalMinutes: number;
  wheelTorqueNm?: string;
  mechanicSignatureDataUrl?: string;
  signedByMechanicName: string;
  finalSummary: string;
}

/**
 * STRICT RODO / GDPR TECHNICAL RECORD:
 * Stored in `workshopOrders`. Contains ZERO customer personal data (no name, phone, email, address, or NIP).
 * Safe for both Office and Mechanics.
 */
export interface WorkshopOrder {
  id: string;
  orderNumber: string; // e.g. "WA-2026/041"
  createdAt: string;
  updatedAt: string;
  status: WorkshopOrderStatus;

  // Asset identification (visible to Mechanic)
  assetCategory: WorkshopAssetCategory;
  trailerId?: string;
  vehicleType?: string; // e.g. "Planen_Hochlader", "Kipper_Trójstronny", "Naczepa"
  vehicleSubtype?: string; // Rodzaj / Model
  plate?: string; // Nr rej. przyczepy
  vin?: string;
  equipmentName?: string; // e.g. "Wyciągarka budowlana na gąsienicach"
  machineNumber?: string; // Nr maszyny e.g. "WB-99"
  equipmentDescription?: string; // Opis sprzętu / identyfikacja

  // Scope of work
  scopeTypes: WorkshopScopeType[];
  taskInstructions: string[]; // Lista zadań / instrukcji dla mechanika (zanonimizowana)
  wheelTorqueNm?: string; // Räder festgezogen -> wieviel Nm

  // Team & Unit Assignment (supports 1 or 2+ mechanics + unit transfers)
  unitName: string; // e.g. "Hala 1 - Przyczepy / TÜV", "Hala 2 - Maszyny & Elektryka"
  assignedMechanicIds: string[];

  // Execution & Documentation
  checklist: WorkshopChecklist;
  timeLogs: WorkshopTimeLog[];
  partsUsed: WorkshopPartItem[];
  mediaItems: WorkshopMediaItem[];
  defectReport?: WorkshopDefectReport;
  transferHistory: WorkshopTransferEntry[];
  finalProtocol?: WorkshopFinalProtocol;
}

/**
 * STRICT OFFICE-ONLY PII RECORD:
 * Stored in separate collection `workshopOrderClientDetails` AND NEVER subscribed/fetched for `mechanic` role.
 */
export interface WorkshopOrderClientDetails {
  orderId: string;
  clientId?: string;
  clientName: string;
  street?: string;
  city?: string;
  phone?: string;
  mobile?: string;
  email?: string;
  auftragScanUrl?: string; // Scanned Auftrag document (contains customer signature/PII -> Office only!)
  estimatedCostEur?: number;
  costCommunicatedAt?: string;
  clientDecision?: "pending" | "approved" | "rejected";
  clientDecisionAt?: string;
  clientDecisionNote?: string;
  officeInternalNotes?: string;
}

export interface WorkshopNotification {
  id: string;
  createdAt: string;
  targetRole: "office" | "mechanic";
  targetMechanicIds?: string[]; // If empty/undefined and targetRole === "mechanic", broadcast to all mechanics
  orderId: string;
  orderNumber: string;
  assetLabel: string; // RODO-safe label e.g. "N-DC 210 • Planen_Hochlader"
  type:
    | "order_assigned"
    | "order_transferred"
    | "defect_report_submitted"
    | "client_approved"
    | "client_rejected"
    | "order_completed";
  title: string;
  message: string;
  readByUserIds: string[];
}

export const UNASSIGNED_UNIT = "Kolejka – Nieprzydzielone";

export const WORKSHOP_UNITS = [
  "Hala 1 – Serwis Przyczep & TÜV",
  "Hala 2 – Maszyny Budowlane & Hydraulika",
  "Stanowisko 3 – Elektryka & Hamulce",
  "Mobilny Serwis Terenowy",
] as const;

export const DEFAULT_WORKSHOP_CHECKLIST: WorkshopChecklist = {
  beweglicheTeile: false,
  luftdruck: false,
  bremsen: false,
  raederFestgezogen: false,
  elektrikGeprueft: false,
};

export function normalizeWorkshopOrder(
  raw: Partial<WorkshopOrder> & Record<string, unknown>,
  fallbackId?: string
): WorkshopOrder {
  const scopeTypes = Array.isArray(raw?.scopeTypes)
    ? (raw.scopeTypes.filter((s): s is WorkshopScopeType => typeof s === "string") as WorkshopScopeType[])
    : [];
  const taskInstructions = Array.isArray(raw?.taskInstructions)
    ? raw.taskInstructions.filter((s): s is string => typeof s === "string")
    : [];
  const assignedMechanicIds = Array.isArray(raw?.assignedMechanicIds)
    ? raw.assignedMechanicIds.filter((s): s is string => typeof s === "string")
    : [];
  const timeLogs = Array.isArray(raw?.timeLogs)
    ? (raw.timeLogs.filter((l) => Boolean(l && typeof l === "object")) as WorkshopTimeLog[])
    : [];
  const partsUsed = Array.isArray(raw?.partsUsed)
    ? (raw.partsUsed.filter((p) => Boolean(p && typeof p === "object")) as WorkshopPartItem[])
    : [];
  const mediaItems = Array.isArray(raw?.mediaItems)
    ? (raw.mediaItems.filter((m) => Boolean(m && typeof m === "object")) as WorkshopMediaItem[])
    : [];
  const transferHistory = Array.isArray(raw?.transferHistory)
    ? (raw.transferHistory
        .filter((tr) => Boolean(tr && typeof tr === "object"))
        .map((tr) => {
          const rec = tr as Partial<WorkshopTransferEntry>;
          return {
            ...rec,
            id: typeof rec.id === "string" && rec.id ? rec.id : `tr_${Date.now()}`,
            timestamp:
              typeof rec.timestamp === "string" && rec.timestamp
                ? rec.timestamp
                : new Date().toISOString(),
            fromUnit: typeof rec.fromUnit === "string" ? rec.fromUnit : "",
            toUnit: typeof rec.toUnit === "string" ? rec.toUnit : "",
            fromMechanicIds: Array.isArray(rec.fromMechanicIds)
              ? rec.fromMechanicIds.filter((s): s is string => typeof s === "string")
              : [],
            toMechanicIds: Array.isArray(rec.toMechanicIds)
              ? rec.toMechanicIds.filter((s): s is string => typeof s === "string")
              : [],
            transferredBy: typeof rec.transferredBy === "string" ? rec.transferredBy : "",
          } as WorkshopTransferEntry;
        }))
    : [];

  const rawChecklist =
    raw?.checklist && typeof raw.checklist === "object"
      ? (raw.checklist as Partial<WorkshopChecklist>)
      : {};
  const checklist: WorkshopChecklist = {
    beweglicheTeile: Boolean(rawChecklist.beweglicheTeile),
    luftdruck: Boolean(rawChecklist.luftdruck),
    bremsen: Boolean(rawChecklist.bremsen),
    raederFestgezogen: Boolean(rawChecklist.raederFestgezogen),
    elektrikGeprueft: Boolean(rawChecklist.elektrikGeprueft),
  };

  const rawReport =
    raw?.defectReport && typeof raw.defectReport === "object"
      ? (raw.defectReport as Partial<WorkshopDefectReport>)
      : undefined;
  const defectReport: WorkshopDefectReport | undefined = rawReport
    ? {
        submittedAt:
          typeof rawReport.submittedAt === "string" && rawReport.submittedAt
            ? rawReport.submittedAt
            : new Date().toISOString(),
        submittedByMechanicId:
          typeof rawReport.submittedByMechanicId === "string"
            ? rawReport.submittedByMechanicId
            : "",
        submittedByMechanicName:
          typeof rawReport.submittedByMechanicName === "string" && rawReport.submittedByMechanicName
            ? rawReport.submittedByMechanicName
            : "Mechanik",
        defects: Array.isArray(rawReport.defects)
          ? rawReport.defects.filter((d): d is string => typeof d === "string")
          : [],
        requiredParts: Array.isArray(rawReport.requiredParts)
          ? rawReport.requiredParts.filter((p): p is string => typeof p === "string")
          : [],
        estimatedHours:
          typeof rawReport.estimatedHours === "number" ? rawReport.estimatedHours : 0,
        notes: typeof rawReport.notes === "string" ? rawReport.notes : undefined,
      }
    : undefined;

  const nowIso = new Date().toISOString();
  const status: WorkshopOrderStatus =
    typeof raw?.status === "string" && raw.status
      ? (raw.status as WorkshopOrderStatus)
      : assignedMechanicIds.length === 0
      ? "unassigned"
      : "new";

  return {
    ...(raw as unknown as WorkshopOrder),
    id: typeof raw?.id === "string" && raw.id ? raw.id : fallbackId || `wo_${Date.now()}`,
    orderNumber:
      typeof raw?.orderNumber === "string" && raw.orderNumber ? raw.orderNumber : "WA-2026/000",
    createdAt: typeof raw?.createdAt === "string" && raw.createdAt ? raw.createdAt : nowIso,
    updatedAt: typeof raw?.updatedAt === "string" && raw.updatedAt ? raw.updatedAt : nowIso,
    status,
    assetCategory: raw?.assetCategory === "equipment" ? "equipment" : "trailer",
    scopeTypes,
    taskInstructions,
    unitName:
      typeof raw?.unitName === "string" && raw.unitName
        ? raw.unitName
        : assignedMechanicIds.length === 0
        ? UNASSIGNED_UNIT
        : "Hala 1 – Serwis Przyczep & TÜV",
    assignedMechanicIds,
    checklist,
    timeLogs,
    partsUsed,
    mediaItems,
    defectReport,
    transferHistory,
  };
}

export function normalizeWorkshopNotification(
  raw: Partial<WorkshopNotification> & Record<string, unknown>,
  fallbackId?: string
): WorkshopNotification {
  const nowIso = new Date().toISOString();
  return {
    ...(raw as unknown as WorkshopNotification),
    id: typeof raw?.id === "string" && raw.id ? raw.id : fallbackId || `wn_${Date.now()}`,
    createdAt: typeof raw?.createdAt === "string" && raw.createdAt ? raw.createdAt : nowIso,
    targetRole: raw?.targetRole === "mechanic" ? "mechanic" : "office",
    targetMechanicIds: Array.isArray(raw?.targetMechanicIds)
      ? raw.targetMechanicIds.filter((s): s is string => typeof s === "string")
      : undefined,
    orderId: typeof raw?.orderId === "string" ? raw.orderId : "",
    orderNumber: typeof raw?.orderNumber === "string" ? raw.orderNumber : "",
    assetLabel: typeof raw?.assetLabel === "string" ? raw.assetLabel : "",
    type: (typeof raw?.type === "string"
      ? raw.type
      : "order_assigned") as WorkshopNotification["type"],
    title: typeof raw?.title === "string" ? raw.title : "",
    message: typeof raw?.message === "string" ? raw.message : "",
    readByUserIds: Array.isArray(raw?.readByUserIds)
      ? raw.readByUserIds.filter((s): s is string => typeof s === "string")
      : [],
  };
}

export function isOrderUnassigned(order: WorkshopOrder): boolean {
  if (!order || order.status === "completed" || order.status === "rejected") return false;
  return (
    order.status === "unassigned" ||
    !Array.isArray(order.assignedMechanicIds) ||
    order.assignedMechanicIds.length === 0
  );
}

export function formatOrderAssetSummary(
  order: WorkshopOrder,
  lang: string = "pl",
  trFn?: (text?: string) => string
): string {
  const translate = (val?: string) => {
    if (!val) return "";
    if (trFn) return trFn(val);
    return translateWorkshopStatic(val, lang) ?? val;
  };

  if (order.assetCategory === "equipment") {
    const num = order.machineNumber ? `#${order.machineNumber}` : "";
    const fallbackEq =
      lang === "de" ? "Baumaschine" : lang === "en" ? "Equipment" : "Maszyna";
    const eqName = order.equipmentName ? translate(order.equipmentName) : fallbackEq;
    return [eqName, num].filter(Boolean).join(" · ");
  }

  const fallbackPlate =
    lang === "de" ? "Ohne Kennz." : lang === "en" ? "No Plate" : "Bez nr rej.";
  const fallbackTrailer =
    lang === "de" ? "Anhänger" : lang === "en" ? "Trailer" : "Przyczepa";
  const localizedType = order.vehicleType
    ? localizeVehicleType(order.vehicleType, lang)
    : fallbackTrailer;

  return [order.plate || fallbackPlate, localizedType].filter(Boolean).join(" · ");
}

export const initialWorkshopOrders: WorkshopOrder[] = [
  {
    id: "wo_doll_01",
    orderNumber: "WA-2026/041",
    createdAt: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
    status: "report_sent",
    assetCategory: "equipment",
    equipmentName: "Wyciągarka budowlana na gąsienicach",
    machineNumber: "WB-99",
    equipmentDescription:
      "Podwozie gąsienicowe gumowe, napęd elektrohydrauliczny 24V, bęben linowy 12 mm",
    scopeTypes: ["UVV", "electrics", "brakes"],
    taskInstructions: [
      "Diagnostyka wiązki zasilającej 24V i sterowania pilotem",
      "Kontrola szczęk i linki hamulca bezpieczeństwa bębna",
      "Przegląd okresowy UVV oraz smarowanie punktów ruchomych",
    ],
    wheelTorqueNm: "120",
    unitName: "Hala 2 – Maszyny Budowlane & Hydraulika",
    assignedMechanicIds: ["m_andy", "m_michal"],
    checklist: {
      beweglicheTeile: true,
      luftdruck: true,
      bremsen: true,
      raederFestgezogen: false,
      elektrikGeprueft: true,
    },
    timeLogs: [
      {
        id: "tl_01",
        mechanicId: "m_andy",
        mechanicName: "Andy",
        startedAt: new Date(Date.now() - 1000 * 60 * 150).toISOString(),
        endedAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
        durationMinutes: 90,
        note: "Demontaż osłony, test instalacji elektrycznej i szczęk",
      },
      {
        id: "tl_02",
        mechanicId: "m_michal",
        mechanicName: "Michal",
        startedAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
        endedAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
        durationMinutes: 60,
        note: "Pomiary akumulatora rozruchowego i weryfikacja linek",
      },
    ],
    partsUsed: [
      {
        id: "pt_01",
        name: "Bremsbacken kpl. (Szczęki hamulcowe)",
        code: "ALKO-2051-BB",
        quantity: 1,
        unit: "kpl.",
        addedByMechanicId: "m_andy",
        addedByMechanicName: "Andy",
        addedAt: new Date(Date.now() - 1000 * 60 * 50).toISOString(),
      },
      {
        id: "pt_02",
        name: "Bremsseile (Linki hamulcowe nierdzewne)",
        code: "KNOTT-BS-1130",
        quantity: 2,
        unit: "szt.",
        addedByMechanicId: "m_michal",
        addedByMechanicName: "Michal",
        addedAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
      },
    ],
    mediaItems: [],
    defectReport: {
      submittedAt: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
      submittedByMechanicId: "m_andy",
      submittedByMechanicName: "Andy",
      defects: [
        "Przetarty przewód sterowniczy 7-żyłowy przy wejściu do skrzynki rozdzielczej",
        "Zużyte szczęki hamulcowe oraz zapieczone 2 linki hamulcowe (Bremsseile)",
        "Spadek pojemności akumulatora 12V/74Ah poniżej 40% — wymagana wymiana (Batterie neu)",
      ],
      requiredParts: [
        "Batterie 12V 74Ah Heavy Duty (1 szt.)",
        "Przewód olejoodporny 7x1.5 mm² (4 m) + dławik PG16",
        "Szczęki hamulcowe kpl. + 2x linka hamulcowa",
      ],
      estimatedHours: 3.5,
      notes: "Maszyna zabezpieczona na stanowisku nr 2. Po zatwierdzeniu kosztów przez klienta dokończymy montaż w zespole 2-osobowym.",
    },
    transferHistory: [],
  },
  {
    id: "wo_doll_02",
    orderNumber: "WA-2026/042",
    createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    status: "new",
    assetCategory: "trailer",
    trailerId: "t_ndc210",
    vehicleType: "Planen_Hochlader",
    vehicleSubtype: "Hochlader 3500 kg (517 x 200 x 220 cm)",
    plate: "N-DC 210",
    vin: "W090002357ND20677",
    scopeTypes: ["TUV", "Kundendienst", "wheels"],
    taskInstructions: [
      "Przygotowanie przyczepy do badania głównego TÜV",
      "Smarowanie najazdu i kontrola ciśnienia w ogumieniu",
      "Dokręcenie kół kluczem dynamometrycznym z wpisem Nm do protokołu",
    ],
    unitName: "Hala 1 – Serwis Przyczep & TÜV",
    assignedMechanicIds: ["m_andy"],
    checklist: { ...DEFAULT_WORKSHOP_CHECKLIST },
    timeLogs: [],
    partsUsed: [],
    mediaItems: [],
    transferHistory: [],
  },
  {
    id: "wo_doll_03",
    orderNumber: "WA-2026/043",
    createdAt: new Date(Date.now() - 1000 * 60 * 18).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 18).toISOString(),
    status: "unassigned",
    assetCategory: "trailer",
    trailerId: "t_nsd523",
    vehicleType: "Planen_Hochlader",
    vehicleSubtype: "Hochlader 2000 kg — diagnostyka osi i hamulców przed TÜV",
    plate: "N-SD 523",
    scopeTypes: ["TUV", "brakes", "electrics"],
    taskInstructions: [
      "Weryfikacja luzów łożysk osi oraz stanu bębnów hamulcowych",
      "Sprawdzenie geometrii zaczepu kulowego i amortyzatora najazdu",
      "Pełny test oświetlenia 13-pin i przygotowanie kosztorysu dla biura",
    ],
    unitName: "Kolejka – Nieprzydzielone",
    assignedMechanicIds: [],
    checklist: { ...DEFAULT_WORKSHOP_CHECKLIST },
    timeLogs: [],
    partsUsed: [],
    mediaItems: [],
    transferHistory: [],
  },
];

export const initialWorkshopClientDetails: WorkshopOrderClientDetails[] = [
  {
    orderId: "wo_doll_01",
    clientName: "Tiefbau & Kabelmontage Franke GmbH",
    street: "Sigmundstraße 142",
    city: "90431 Nürnberg",
    phone: "+49 911 4809210",
    mobile: "+49 171 5529310",
    email: "disposition@franke-tiefbau.de",
    estimatedCostEur: 640,
    clientDecision: "pending",
    officeInternalNotes: "Stały klient B2B — prosi o telefon przed wymianą akumulatora powyżej 500 EUR netto.",
  },
  {
    orderId: "wo_doll_02",
    clientName: "Marek Kowalski Transport",
    street: "Fürther Str. 88",
    city: "90429 Nürnberg",
    phone: "+49 152 3391820",
    email: "m.kowalski@mk-trans.de",
    estimatedCostEur: 185,
    costCommunicatedAt: new Date(Date.now() - 1000 * 60 * 40).toISOString(),
    clientDecision: "approved",
    clientDecisionAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    clientDecisionNote: "Klient zaakceptował standardowy koszt przeglądu TÜV + Kundendienst przy oddaniu przyczepy.",
  },
  {
    orderId: "wo_doll_03",
    clientName: "Baulogistik Müller & Söhne KG",
    street: "Rothenburger Str. 215",
    city: "90439 Nürnberg",
    phone: "+49 911 6120440",
    mobile: "+49 160 8841209",
    email: "fuhrpark@mueller-baulogistik.de",
    estimatedCostEur: 390,
    clientDecision: "pending",
    officeInternalNotes: "Przyczepa przyjęta na plac — oczekuje na przydzielenie wolnego mechanika.",
  },
];

export const initialWorkshopNotifications: WorkshopNotification[] = [
  {
    id: "wn_init_1",
    createdAt: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
    targetRole: "office",
    orderId: "wo_doll_01",
    orderNumber: "WA-2026/041",
    assetLabel: "Wyciągarka budowlana na gąsienicach · #WB-99",
    type: "defect_report_submitted",
    title: "Nowy raport usterek od mechanika (Andy)",
    message: "Wykryto 3 usterki (wiązka 24V, szczęki/linki, akumulator). Szacowany czas: 3.5h. Wymagany kontakt z klientem.",
    readByUserIds: [],
  },
  {
    id: "wn_init_2",
    createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    targetRole: "mechanic",
    targetMechanicIds: ["m_andy"],
    orderId: "wo_doll_02",
    orderNumber: "WA-2026/042",
    assetLabel: "N-DC 210 · Planen_Hochlader",
    type: "order_assigned",
    title: "Nowe zlecenie serwisowe: TÜV + Kundendienst",
    message: "Przypisano przyczepę N-DC 210 (Hala 1 – Serwis Przyczep & TÜV).",
    readByUserIds: [],
  },
];
