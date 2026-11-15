"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from "react";
import {
  Trailer,
  Client,
  Reservation,
  ReservationHistoryEntry,
  UserProfile,
  UserRole,
  BackupSnapshot,
  TuvHistoryEntry,
  initialTrailers,
  initialClients,
  initialReservations,
  initialProfiles,
  getProfileLogin,
  getExpectedPassword,
} from "./store";
import {
  WorkshopOrder,
  WorkshopOrderClientDetails,
  WorkshopNotification,
  WorkshopDefectReport,
  WorkshopFinalProtocol,
  UNASSIGNED_UNIT,
  isOrderUnassigned,
  normalizeWorkshopOrder,
  normalizeWorkshopNotification,
  initialWorkshopOrders,
  initialWorkshopClientDetails,
  initialWorkshopNotifications,
  formatOrderAssetSummary,
} from "./workshop-types";
import {
  localizeUnitName,
  translateWorkshopStatic,
} from "./workshop-text-localizer";
import { getWorkshopI18n } from "./workshop-i18n";
import {
  OFFICE_MANAGEABLE_ACTIONS,
  type OfficeAction,
} from "./permissions";
import { ColorOption } from "./colors";
import { toast } from "sonner";
import { translations } from "./translations";
import {
  collection,
  doc,
  onSnapshot,
  setDoc,
  deleteDoc,
  writeBatch,
} from "firebase/firestore";
import {
  db,
  handleFirestoreError,
  OperationType,
  testFirestoreConnection,
} from "./firebase";

export type StatusColors = Record<Reservation["status"], ColorOption>;

/** Office permission matrix (single source of truth lives in lib/permissions.ts). */
export type ManageableAction = OfficeAction;

const defaultStatusColors: StatusColors = {
  paid: "green",
  invoiced: "amber",
  defect: "red",
  completed: "slate",
  active: "blue",
  cancelled: "red",
};

function cleanForFirestore<T>(data: T): T {
  return JSON.parse(JSON.stringify(data));
}

/**
 * Maps a stored profile document to a role.
 * An explicit "employee" role always wins — otherwise a display name such as "Admin"
 * would silently escalate someone into administrator rights.
 */
export function resolveProfileRole(p: {
  id?: string;
  role?: string;
  username?: string;
}): UserRole {
  const explicitRole = p.role === "admin" || p.role === "employee" || p.role === "mechanic"
    ? p.role
    : undefined;
  if (explicitRole) return explicitRole;

  const isAdminAccount =
    p.id === "admin" || String(p.username || "").toLowerCase() === "admin";
  if (isAdminAccount) return "admin";
  if (p.id?.startsWith("m_")) return "mechanic";
  return "employee";
}

function normalizeProfiles(raw: any[]): UserProfile[] {
  const map = new Map<string, UserProfile>();
  initialProfiles.forEach((p) => map.set(p.id, { ...p }));
  raw.forEach((p) => {
    if (!p || !p.id) return;
    const resolvedRole = resolveProfileRole(p);
    const isAdminAccount = resolvedRole === "admin";
    const isMechanicAccount = resolvedRole === "mechanic";
    const name = isAdminAccount
      ? p.name || "Administrator"
      : p.name || p.displayName || p.username || "Pracownik";
    const username = isAdminAccount ? "admin" : p.username || name;
    const seedMatch = initialProfiles.find((sp) => sp.id === p.id);
    map.set(p.id, {
      id: p.id,
      name,
      username,
      role: resolvedRole,
      unitName: p.unitName || seedMatch?.unitName,
      specialty: p.specialty ?? seedMatch?.specialty,
      isOnline: Boolean(p.isOnline),
    });
  });

  return Array.from(map.values()).sort((a, b) => {
    const order = { admin: 0, employee: 1, mechanic: 2 };
    if (order[a.role] !== order[b.role]) return order[a.role] - order[b.role];
    return a.id.localeCompare(b.id);
  });
}

interface AuthResult {
  success: boolean;
  error?: string;
  user?: UserProfile;
}

interface AppState {
  trailers: Trailer[];
  clients: Client[];
  reservations: Reservation[];
  profiles: UserProfile[];
  currentUserId: string | null;
  currentUser: UserProfile | null;
  userRole: UserRole | null;
  isAdmin: boolean;
  isMechanic: boolean;
  isOffice: boolean;
  /**
   * Action-level permission gate for office work (admin + employee, never mechanics).
   * Use `canManage(action)` instead of comparing roles inline.
   */
  canManage: (action: ManageableAction) => boolean;
  language: string;
  statusColors: StatusColors;
  isHydrated: boolean;
  isCloudConnected: boolean;
  cloudSyncStatus: "connected" | "syncing" | "offline";
  addReservation: (res: Reservation) => void;
  updateReservation: (res: Reservation, action?: ReservationHistoryEntry["action"]) => void;
  deleteReservation: (id: string) => void;
  updateTrailerStatus: (id: string, status: Trailer["status"]) => void;
  addTrailer: (trailer: Trailer) => void;
  updateTrailer: (trailer: Trailer) => void;
  /**
   * Narrowly scoped permission: OFFICE users (admin + employee) may edit the TÜV expiry date
   * without receiving full fleet/trailer editing rights. Every change is written to
   * `tuvHistory` with the profile that made it.
   */
  updateTrailerTuv: (id: string, newExpiry?: string, note?: string) => boolean;
  deleteTrailer: (id: string) => void;
  resetTrailers: () => void;
  updateClientBalance: (id: string, amount: number) => void;
  addClient: (client: Client) => void;
  updateClient: (client: Client) => void;
  deleteClient: (id: string) => void;
  setLanguage: (lang: string) => void;
  updateStatusColor: (status: Reservation["status"], color: ColorOption) => void;
  loginUser: (id: string) => void;
  authenticateUser: (username: string, password: string) => AuthResult;
  logoutUser: () => void;
  addEmployeeProfile: (
    name: string,
    role?: "employee" | "mechanic",
    unitName?: string,
    specialty?: string
  ) => boolean;
  updateMechanicProfile: (
    id: string,
    updates: { name?: string; unitName?: string; specialty?: string }
  ) => boolean;
  deleteEmployeeProfile: (id: string) => boolean;
  checkTrailerAvailability: (trailerId: string, start: Date, end: Date, excludeReservationId?: string) => boolean;
  logReservationAction: (reservationId: string, action: ReservationHistoryEntry["action"]) => void;
  backups: BackupSnapshot[];
  createBackupSnapshot: (customName?: string, type?: BackupSnapshot["type"]) => Promise<BackupSnapshot>;
  deleteBackupSnapshot: (id: string) => Promise<void>;
  restoreFromBackup: (
    snapshot: { reservations?: Reservation[]; clients?: Client[]; trailers?: Trailer[] },
    options?: {
      mode?: "overwrite" | "merge";
      includeReservations?: boolean;
      includeClients?: boolean;
      includeTrailers?: boolean;
      createSafetyBackup?: boolean;
    }
  ) => Promise<void>;

  // Workshop Module State & Actions
  workshopOrders: WorkshopOrder[];
  workshopClientDetailsMap: Record<string, WorkshopOrderClientDetails>;
  workshopNotifications: WorkshopNotification[];
  unreadWorkshopNotificationsCount: number;
  trText: (text?: string) => string;
  isTranslatingDescriptions: boolean;
  createWorkshopOrder: (order: WorkshopOrder, clientDetails: WorkshopOrderClientDetails) => void;
  assignWorkshopOrder: (orderId: string, mechanicIds: string[], unitName?: string) => void;
  unassignWorkshopOrder: (orderId: string) => void;
  updateWorkshopOrder: (order: WorkshopOrder) => void;
  deleteWorkshopOrder: (orderId: string) => void;
  updateWorkshopClientDetails: (details: WorkshopOrderClientDetails) => void;
  submitMechanicDefectReport: (orderId: string, report: WorkshopDefectReport) => void;
  submitClientApprovalDecision: (
    orderId: string,
    decision: "approved" | "rejected",
    estimatedCostEur?: number,
    note?: string
  ) => void;
  transferWorkshopOrder: (
    orderId: string,
    toUnit: string,
    toMechanicIds: string[],
    reason?: string
  ) => void;
  completeWorkshopProtocol: (orderId: string, protocol: WorkshopFinalProtocol) => void;
  markWorkshopNotificationRead: (notificationId: string) => void;
  markAllWorkshopNotificationsRead: () => void;
}

const AppContext = createContext<AppState | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [trailers, setTrailers] = useState<Trailer[]>(initialTrailers);
  const [clients, setClients] = useState<Client[]>(initialClients);
  const [reservations, setReservations] = useState<Reservation[]>(initialReservations);
  const [profiles, setProfiles] = useState<UserProfile[]>(initialProfiles);
  const [backups, setBackups] = useState<BackupSnapshot[]>([]);
  const [workshopOrders, setWorkshopOrders] = useState<WorkshopOrder[]>(initialWorkshopOrders);
  const [workshopClientDetailsMap, setWorkshopClientDetailsMap] = useState<
    Record<string, WorkshopOrderClientDetails>
  >(() => {
    const map: Record<string, WorkshopOrderClientDetails> = {};
    initialWorkshopClientDetails.forEach((d) => {
      map[d.orderId] = d;
    });
    return map;
  });
  const [allWorkshopNotifications, setAllWorkshopNotifications] = useState<WorkshopNotification[]>(
    initialWorkshopNotifications
  );

  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [language, setLanguage] = useState<string>("pl");
  const [statusColors, setStatusColors] = useState<StatusColors>(defaultStatusColors);
  const [isHydrated, setIsHydrated] = useState(false);
  const [isCloudConnected, setIsCloudConnected] = useState(false);
  const [cloudSyncStatus, setCloudSyncStatus] = useState<"connected" | "syncing" | "offline">("syncing");
  const [i18nCache, setI18nCache] = useState<Record<string, Record<string, string>>>({});
  const [isTranslatingDescriptions, setIsTranslatingDescriptions] = useState(false);
  const inFlightI18nRef = useRef<Set<string>>(new Set());

  const seededRef = useRef({
    trailers: false,
    clients: false,
    reservations: false,
    profiles: false,
    workshopOrders: false,
    workshopClientDetails: false,
    workshopNotifications: false,
  });

  const seenNotificationIdsRef = useRef<Set<string>>(
    new Set(initialWorkshopNotifications.map((n) => n.id))
  );
  const initialNotifLoadDoneRef = useRef(false);

  const currentUser = profiles.find((p) => p.id === currentUserId) || null;
  const userRole: UserRole | null = currentUser?.role || null;
  const isAdmin = userRole === "admin";
  const isMechanic = userRole === "mechanic";
  const isOffice = userRole === "admin" || userRole === "employee";

  // Office staff (admin + employees) may run every office operation; mechanics never may.
  const canManage = (action: ManageableAction): boolean =>
    isOffice && OFFICE_MANAGEABLE_ACTIONS.includes(action);

  useEffect(() => {
    let isSubscribed = true;

    setTimeout(() => {
      if (!isSubscribed) return;
      const savedUserId = localStorage.getItem("currentUserId");
      const savedLang = localStorage.getItem("language");
      const savedColors = localStorage.getItem("statusColors");
      const savedTrCache = localStorage.getItem("doll_workshop_tr_cache_v1");

      if (savedUserId) setCurrentUserId(savedUserId);
      if (savedLang) setLanguage(savedLang);
      if (savedColors) {
        try {
          setStatusColors(JSON.parse(savedColors));
        } catch {}
      }
      if (savedTrCache) {
        try {
          setI18nCache(JSON.parse(savedTrCache));
        } catch {}
      }
      const savedBackups = localStorage.getItem("localBackups");
      if (savedBackups) {
        try {
          setBackups(JSON.parse(savedBackups));
        } catch {}
      }
      setIsHydrated(true);
    }, 0);

    return () => {
      isSubscribed = false;
    };
  }, []);

  // Core shared Firestore listeners (Trailers, Profiles, WorkshopOrders, WorkshopNotifications)
  useEffect(() => {
    if (!isHydrated) return;
    let isSubscribed = true;

    testFirestoreConnection().then((ok) => {
      if (isSubscribed && ok) {
        setIsCloudConnected(true);
        setCloudSyncStatus("connected");
      }
    });

    const unsubTrailers = onSnapshot(
      collection(db, "trailers"),
      (snapshot) => {
        if (!isSubscribed) return;
        if (snapshot.empty && !seededRef.current.trailers) {
          seededRef.current.trailers = true;
          const batch = writeBatch(db);
          initialTrailers.forEach((t) => {
            batch.set(doc(db, "trailers", t.id), cleanForFirestore(t));
          });
          batch.commit().catch(console.error);
          setTrailers(initialTrailers);
        } else if (!snapshot.empty) {
          const items: Trailer[] = [];
          snapshot.forEach((d) => items.push(d.data() as Trailer));
          setTrailers(items);
        }
        setIsCloudConnected(true);
        setCloudSyncStatus("connected");
      },
      (error) => {
        console.warn("Firestore trailers listener error, using local fallback", error);
        setCloudSyncStatus("offline");
      }
    );

    const unsubProfiles = onSnapshot(
      collection(db, "userProfiles"),
      (snapshot) => {
        if (!isSubscribed) return;
        if (snapshot.empty && !seededRef.current.profiles) {
          seededRef.current.profiles = true;
          const batch = writeBatch(db);
          initialProfiles.forEach((p) => {
            batch.set(doc(db, "userProfiles", p.id), cleanForFirestore(p));
          });
          batch.commit().catch(console.error);
          setProfiles(initialProfiles);
        } else if (!snapshot.empty) {
          const rawItems: any[] = [];
          const docIds = new Set<string>();
          snapshot.forEach((d) => {
            docIds.add(d.id);
            rawItems.push(d.data());
          });
          const normalized = normalizeProfiles(rawItems);
          if (!seededRef.current.profiles) {
            seededRef.current.profiles = true;
            initialProfiles.forEach((sp) => {
              if (!docIds.has(sp.id)) {
                setDoc(doc(db, "userProfiles", sp.id), cleanForFirestore(sp)).catch(console.error);
              }
            });
          }
          setProfiles(normalized);
        }
      },
      (error) => {
        console.warn("Firestore profiles listener error", error);
      }
    );

    const unsubWorkshopOrders = onSnapshot(
      collection(db, "workshopOrders"),
      (snapshot) => {
        if (!isSubscribed) return;
        if (snapshot.empty && !seededRef.current.workshopOrders) {
          seededRef.current.workshopOrders = true;
          const batch = writeBatch(db);
          initialWorkshopOrders.forEach((wo) => {
            batch.set(doc(db, "workshopOrders", wo.id), cleanForFirestore(wo));
          });
          batch.commit().catch(console.error);
          setWorkshopOrders(initialWorkshopOrders);
        } else if (!snapshot.empty) {
          const items: WorkshopOrder[] = [];
          const existingIds = new Set<string>();
          snapshot.forEach((d) => {
            existingIds.add(d.id);
            items.push(
              normalizeWorkshopOrder(
                (d.data() || {}) as Partial<WorkshopOrder> & Record<string, unknown>,
                d.id
              )
            );
          });
          // Ensure sample unassigned order wo_doll_03 is seeded once into pre-existing databases
          if (typeof window !== "undefined" && !localStorage.getItem("doll_seeded_wo03_v1")) {
            localStorage.setItem("doll_seeded_wo03_v1", "1");
            const wo3 = initialWorkshopOrders.find((o) => o.id === "wo_doll_03");
            if (wo3 && !existingIds.has("wo_doll_03")) {
              setDoc(doc(db, "workshopOrders", wo3.id), cleanForFirestore(wo3)).catch(console.error);
              items.push(wo3);
            }
          }
          items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          setWorkshopOrders(items);
        }
      },
      (error) => {
        console.warn("Firestore workshopOrders listener error", error);
      }
    );

    const unsubWorkshopNotifications = onSnapshot(
      collection(db, "workshopNotifications"),
      (snapshot) => {
        if (!isSubscribed) return;
        if (snapshot.empty && !seededRef.current.workshopNotifications) {
          seededRef.current.workshopNotifications = true;
          const batch = writeBatch(db);
          initialWorkshopNotifications.forEach((wn) => {
            batch.set(doc(db, "workshopNotifications", wn.id), cleanForFirestore(wn));
          });
          batch.commit().catch(console.error);
          setAllWorkshopNotifications(initialWorkshopNotifications);
          initialNotifLoadDoneRef.current = true;
        } else if (!snapshot.empty) {
          const items: WorkshopNotification[] = [];
          snapshot.forEach((d) =>
            items.push(
              normalizeWorkshopNotification(
                (d.data() || {}) as Partial<WorkshopNotification> & Record<string, unknown>,
                d.id
              )
            )
          );
          items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

          if (initialNotifLoadDoneRef.current) {
            items.forEach((n) => {
              if (!seenNotificationIdsRef.current.has(n.id)) {
                seenNotificationIdsRef.current.add(n.id);
              }
            });
          } else {
            items.forEach((n) => seenNotificationIdsRef.current.add(n.id));
            initialNotifLoadDoneRef.current = true;
          }

          setAllWorkshopNotifications(items);
        }
      },
      (error) => {
        console.warn("Firestore workshopNotifications listener error", error);
      }
    );

    return () => {
      isSubscribed = false;
      unsubTrailers();
      unsubProfiles();
      unsubWorkshopOrders();
      unsubWorkshopNotifications();
    };
  }, [isHydrated]);

  // STRICT RODO / GDPR ISOLATION:
  // Clients, Reservations, Backups, and WorkshopOrderClientDetails are ONLY subscribed when user is Office (admin / employee).
  useEffect(() => {
    if (!isHydrated || !isOffice) return;

    let isSubscribed = true;

    const unsubClients = onSnapshot(
      collection(db, "clients"),
      (snapshot) => {
        if (!isSubscribed) return;
        if (snapshot.empty && !seededRef.current.clients) {
          seededRef.current.clients = true;
          const batch = writeBatch(db);
          initialClients.forEach((c) => {
            batch.set(doc(db, "clients", c.id), cleanForFirestore(c));
          });
          batch.commit().catch(console.error);
          setClients(initialClients);
        } else if (!snapshot.empty) {
          const items: Client[] = [];
          snapshot.forEach((d) => items.push(d.data() as Client));
          setClients(items);
        }
      },
      (error) => {
        console.warn("Firestore clients listener error", error);
      }
    );

    const unsubReservations = onSnapshot(
      collection(db, "reservations"),
      (snapshot) => {
        if (!isSubscribed) return;
        if (snapshot.empty && !seededRef.current.reservations) {
          seededRef.current.reservations = true;
          const batch = writeBatch(db);
          initialReservations.forEach((r) => {
            batch.set(doc(db, "reservations", r.id), cleanForFirestore(r));
          });
          batch.commit().catch(console.error);
          setReservations(initialReservations);
        } else if (!snapshot.empty) {
          const items: Reservation[] = [];
          snapshot.forEach((d) => items.push(d.data() as Reservation));
          setReservations(items);
        }
      },
      (error) => {
        console.warn("Firestore reservations listener error", error);
      }
    );

    const unsubBackups = onSnapshot(
      collection(db, "backups"),
      (snapshot) => {
        if (!isSubscribed) return;
        const items: BackupSnapshot[] = [];
        snapshot.forEach((d) => items.push(d.data() as BackupSnapshot));
        items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        if (items.length > 0) {
          setBackups(items);
          try {
            localStorage.setItem("localBackups", JSON.stringify(items.slice(0, 15)));
          } catch {}
        }
      },
      (error) => {
        console.warn("Firestore backups listener error", error);
      }
    );

    const unsubWorkshopClientDetails = onSnapshot(
      collection(db, "workshopOrderClientDetails"),
      (snapshot) => {
        if (!isSubscribed) return;
        if (snapshot.empty && !seededRef.current.workshopClientDetails) {
          seededRef.current.workshopClientDetails = true;
          const batch = writeBatch(db);
          initialWorkshopClientDetails.forEach((d) => {
            batch.set(doc(db, "workshopOrderClientDetails", d.orderId), cleanForFirestore(d));
          });
          batch.commit().catch(console.error);
          const initMap: Record<string, WorkshopOrderClientDetails> = {};
          initialWorkshopClientDetails.forEach((d) => {
            initMap[d.orderId] = d;
          });
          setWorkshopClientDetailsMap(initMap);
        } else if (!snapshot.empty) {
          const nextMap: Record<string, WorkshopOrderClientDetails> = {};
          snapshot.forEach((d) => {
            const item = d.data() as WorkshopOrderClientDetails;
            nextMap[item.orderId || d.id] = item;
          });
          if (typeof window !== "undefined" && !localStorage.getItem("doll_seeded_wo03_cd_v1")) {
            localStorage.setItem("doll_seeded_wo03_cd_v1", "1");
            const cd3 = initialWorkshopClientDetails.find((c) => c.orderId === "wo_doll_03");
            if (cd3 && !nextMap.wo_doll_03) {
              setDoc(doc(db, "workshopOrderClientDetails", cd3.orderId), cleanForFirestore(cd3)).catch(
                console.error
              );
              nextMap[cd3.orderId] = cd3;
            }
          }
          setWorkshopClientDetailsMap(nextMap);
        }
      },
      (error) => {
        console.warn("Firestore workshopOrderClientDetails listener error", error);
      }
    );

    return () => {
      isSubscribed = false;
      unsubClients();
      unsubReservations();
      unsubBackups();
      unsubWorkshopClientDetails();
    };
  }, [isHydrated, isOffice]);

  const dispatchAction = async (action: string, payload: any) => {
    try {
      await fetch("/api/data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, payload }),
      });
    } catch {
      // Silent local fallback
    }
  };

  useEffect(() => {
    if (isHydrated) {
      if (currentUserId) {
        localStorage.setItem("currentUserId", currentUserId);
      } else {
        localStorage.removeItem("currentUserId");
      }
      localStorage.setItem("language", language);
      localStorage.setItem("statusColors", JSON.stringify(statusColors));
    }
  }, [currentUserId, language, statusColors, isHydrated]);

  const loginUser = (id: string) => {
    setCurrentUserId(id);
    const updatedProfiles = profiles.map((p) => (p.id === id ? { ...p, isOnline: true } : p));
    setProfiles(updatedProfiles);
    const user = updatedProfiles.find((p) => p.id === id);
    if (user) {
      if (user.role === "mechanic") {
        setClients([]);
        setReservations([]);
        setBackups([]);
        setWorkshopClientDetailsMap({});
      }
      setDoc(doc(db, "userProfiles", id), cleanForFirestore(user)).catch(console.error);
      dispatchAction("UPDATE_PROFILE", user);
    }
  };

  const authenticateUser = (username: string, password: string): AuthResult => {
    const cleanUsername = username.trim();
    const matched = profiles.find(
      (p) =>
        getProfileLogin(p).toLowerCase() === cleanUsername.toLowerCase() ||
        p.name.toLowerCase() === cleanUsername.toLowerCase()
    );
    const t = translations[language as keyof typeof translations] || translations.pl;
    if (!matched) {
      return { success: false, error: t.invalidCredentials || "Invalid credentials" };
    }
    const expected = getExpectedPassword(matched);
    if (password !== expected) {
      return { success: false, error: t.invalidCredentials || "Invalid credentials" };
    }
    loginUser(matched.id);
    return { success: true, user: matched };
  };

  const logoutUser = () => {
    if (currentUserId) {
      const user = profiles.find((p) => p.id === currentUserId);
      if (user) {
        const offlineUser = { ...user, isOnline: false };
        setDoc(doc(db, "userProfiles", currentUserId), cleanForFirestore(offlineUser)).catch(
          console.error
        );
        dispatchAction("UPDATE_PROFILE", offlineUser);
      }
      setProfiles((prev) =>
        prev.map((p) => (p.id === currentUserId ? { ...p, isOnline: false } : p))
      );
    }
    setClients([]);
    setReservations([]);
    setBackups([]);
    setWorkshopClientDetailsMap({});
    setCurrentUserId(null);
  };

  const addEmployeeProfile = (
    name: string,
    role: "employee" | "mechanic" = "employee",
    unitName?: string,
    specialty?: string
  ): boolean => {
    const t = translations[language as keyof typeof translations] || translations.pl;
    // Any office user (admin or employee) may register new staff accounts
    if (!canManage("profile.manage")) {
      toast.error(t.adminOnlyAction);
      return false;
    }
    const trimmed = name.trim();
    if (!trimmed) return false;
    const duplicate = profiles.some(
      (p) =>
        p.name.toLowerCase() === trimmed.toLowerCase() ||
        getProfileLogin(p).toLowerCase() === trimmed.toLowerCase()
    );
    if (duplicate) {
      toast.error(t.employeeExists);
      return false;
    }
    const prefix = role === "mechanic" ? "m_" : "emp_";
    const newProfile: UserProfile = {
      id: `${prefix}${Date.now().toString(36)}`,
      name: trimmed,
      username: trimmed,
      role,
      unitName: role === "mechanic" ? unitName : undefined,
      specialty: role === "mechanic" && specialty?.trim() ? specialty.trim() : undefined,
      isOnline: false,
    };
    setProfiles((prev) => [...prev, newProfile]);
    setDoc(doc(db, "userProfiles", newProfile.id), cleanForFirestore(newProfile)).catch(
      console.error
    );
    dispatchAction("ADD_PROFILE", newProfile);
    toast.success(`${t.employeeAdded}: ${trimmed}`);
    return true;
  };

  const updateMechanicProfile = (
    id: string,
    updates: { name?: string; unitName?: string; specialty?: string }
  ): boolean => {
    const t = translations[language as keyof typeof translations] || translations.pl;
    const w = getWorkshopI18n(language);
    if (!isOffice) {
      toast.error(t.adminOnlyAction);
      return false;
    }
    const existing = profiles.find((p) => p.id === id && p.role === "mechanic");
    if (!existing) return false;

    const nextName = updates.name !== undefined ? updates.name.trim() : existing.name;
    if (!nextName) return false;

    if (nextName.toLowerCase() !== existing.name.toLowerCase()) {
      const duplicate = profiles.some(
        (p) =>
          p.id !== id &&
          (p.name.toLowerCase() === nextName.toLowerCase() ||
            getProfileLogin(p).toLowerCase() === nextName.toLowerCase())
      );
      if (duplicate) {
        toast.error(t.employeeExists);
        return false;
      }
    }

    const updated: UserProfile = {
      ...existing,
      name: nextName,
      username: nextName,
      unitName: updates.unitName !== undefined ? updates.unitName : existing.unitName,
      specialty:
        updates.specialty !== undefined
          ? updates.specialty.trim() || undefined
          : existing.specialty,
    };

    setProfiles((prev) => prev.map((p) => (p.id === id ? updated : p)));
    setDoc(doc(db, "userProfiles", id), cleanForFirestore(updated)).catch(console.error);
    dispatchAction("UPDATE_PROFILE", updated);
    toast.success(w.mechanicUpdatedToast(nextName));
    return true;
  };

  const deleteEmployeeProfile = (id: string): boolean => {
    const t = translations[language as keyof typeof translations] || translations.pl;
    const target = profiles.find((p) => p.id === id);
    if (!target || id === "admin" || id === currentUserId) {
      toast.error(t.adminOnlyAction);
      return false;
    }
    if (!canManage("profile.manage")) {
      toast.error(t.adminOnlyAction);
      return false;
    }
    setProfiles((prev) => prev.filter((p) => p.id !== id));
    deleteDoc(doc(db, "userProfiles", id)).catch(console.error);
    dispatchAction("DELETE_PROFILE", { id });

    // Cleanly remove deleted mechanic from any active workshop orders (move to unassigned if sole assignee)
    if (target.role === "mechanic") {
      workshopOrders.forEach((o) => {
        const currentAssignees = o.assignedMechanicIds ?? [];
        if (
          currentAssignees.includes(id) &&
          o.status !== "completed" &&
          o.status !== "rejected"
        ) {
          const remaining = currentAssignees.filter((mid) => mid !== id);
          const cleanedOrder: WorkshopOrder = cleanForFirestore(
            normalizeWorkshopOrder({
              ...o,
              assignedMechanicIds: remaining,
              status: remaining.length === 0 ? "unassigned" : o.status,
              unitName: remaining.length === 0 ? UNASSIGNED_UNIT : o.unitName,
              updatedAt: new Date().toISOString(),
            })
          );
          setWorkshopOrders((prev) =>
            prev.map((item) => (item.id === cleanedOrder.id ? cleanedOrder : item))
          );
          setDoc(doc(db, "workshopOrders", cleanedOrder.id), cleanedOrder).catch(console.error);
          dispatchAction("SAVE_WORKSHOP_ORDER", cleanedOrder);
        }
      });
    }

    toast.success(t.employeeDeleted);
    return true;
  };

  // =========================================================================
  // MULTILINGUAL DESCRIPTION TRANSLATOR (PL / DE / EN — STATIC + GEMINI CACHE)
  // =========================================================================
  const activeLangCode = language === "de" ? "de" : language === "en" ? "en" : "pl";

  const trText = (text?: string): string => {
    if (!text) return "";
    const trimmed = text.trim();
    if (!trimmed) return "";

    const staticHit = translateWorkshopStatic(trimmed, activeLangCode);
    if (staticHit !== null) return staticHit;

    const cachedHit = i18nCache[activeLangCode]?.[trimmed];
    if (cachedHit) return cachedHit;

    return text;
  };

  // Collect any non-PII custom descriptions that are not yet translated for the active language
  const uncachedCandidates = new Set<string>();
  const maybeQueueText = (val?: string) => {
    if (!val) return;
    const trimmed = val.trim();
    if (trimmed.length < 3 || trimmed.length > 500) return;
    if (/^[\d\s.,:/+\-#()A-Z0-9]+$/.test(trimmed)) return; // pure numbers/plates/codes
    if (translateWorkshopStatic(trimmed, activeLangCode) !== null) return;
    if (i18nCache[activeLangCode]?.[trimmed]) return;
    if (inFlightI18nRef.current.has(`${activeLangCode}::${trimmed}`)) return;
    if (uncachedCandidates.size < 35) {
      uncachedCandidates.add(trimmed);
    }
  };

  workshopOrders.forEach((o) => {
    if (!o) return;
    maybeQueueText(o.equipmentName);
    maybeQueueText(o.equipmentDescription);
    maybeQueueText(o.vehicleSubtype);
    (o.taskInstructions ?? []).forEach(maybeQueueText);
    (o.timeLogs ?? []).forEach((l) => maybeQueueText(l?.note));
    (o.partsUsed ?? []).forEach((p) => maybeQueueText(p?.name));
    (o.mediaItems ?? []).forEach((m) => maybeQueueText(m?.caption));
    if (o.defectReport) {
      (o.defectReport.defects ?? []).forEach(maybeQueueText);
      (o.defectReport.requiredParts ?? []).forEach(maybeQueueText);
      maybeQueueText(o.defectReport.notes);
    }
    (o.transferHistory ?? []).forEach((tr) => maybeQueueText(tr?.reason));
    if (o.finalProtocol) {
      maybeQueueText(o.finalProtocol.finalSummary);
    }
  });

  allWorkshopNotifications.slice(0, 15).forEach((n) => {
    maybeQueueText(n.title);
    maybeQueueText(n.message);
  });

  profiles.forEach((p) => {
    if (p.role === "mechanic") maybeQueueText(p.specialty);
  });

  if (isOffice) {
    Object.values(workshopClientDetailsMap).forEach((cd) => {
      maybeQueueText(cd.clientDecisionNote);
      maybeQueueText(cd.officeInternalNotes);
    });
  }

  const uncachedBatchKey = Array.from(uncachedCandidates).join("\n||\n");

  useEffect(() => {
    if (!isHydrated || !uncachedBatchKey) return;
    let cancelled = false;
    const textsToTranslate = uncachedBatchKey.split("\n||\n").filter(Boolean);
    if (textsToTranslate.length === 0) return;

    textsToTranslate.forEach((s) => inFlightI18nRef.current.add(`${activeLangCode}::${s}`));

    const timer = setTimeout(async () => {
      if (cancelled) return;
      setIsTranslatingDescriptions(true);
      try {
        const res = await fetch("/api/workshop/translate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ texts: textsToTranslate, targetLang: activeLangCode }),
        });
        const json = await res.json();
        if (!cancelled && json?.translations && typeof json.translations === "object") {
          setI18nCache((prev) => {
            const nextLangMap = { ...(prev[activeLangCode] || {}), ...json.translations };
            const nextCache = { ...prev, [activeLangCode]: nextLangMap };
            try {
              localStorage.setItem("doll_workshop_tr_cache_v1", JSON.stringify(nextCache));
            } catch {}
            return nextCache;
          });
        }
      } catch {
        // Keep original text on transient network error
      } finally {
        if (!cancelled) setIsTranslatingDescriptions(false);
      }
    }, 120);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [isHydrated, activeLangCode, uncachedBatchKey]);

  // =========================================================================
  // WORKSHOP MODULE REAL-TIME ACTIONS & NOTIFICATIONS
  // =========================================================================
  const pushWorkshopNotification = (notif: Omit<WorkshopNotification, "id" | "createdAt" | "readByUserIds">) => {
    const fullNotif: WorkshopNotification = {
      ...notif,
      id: `wn_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toISOString(),
      readByUserIds: currentUserId ? [currentUserId] : [],
    };
    seenNotificationIdsRef.current.add(fullNotif.id);
    setAllWorkshopNotifications((prev) => [fullNotif, ...prev]);
    setDoc(doc(db, "workshopNotifications", fullNotif.id), cleanForFirestore(fullNotif)).catch(
      console.error
    );
    dispatchAction("SAVE_WORKSHOP_NOTIFICATION", fullNotif);

    if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
      try {
        new Notification(fullNotif.title, { body: `${fullNotif.assetLabel} — ${fullNotif.message}` });
      } catch {}
    }
  };

  const workshopNotifications = allWorkshopNotifications.filter((n) => {
    if (!currentUser || !n) return false;
    if (isMechanic) {
      if (n.targetRole !== "mechanic") return false;
      if (!n.targetMechanicIds || n.targetMechanicIds.length === 0) return true;
      return n.targetMechanicIds.includes(currentUser.id);
    }
    return n.targetRole === "office";
  });

  const unreadWorkshopNotificationsCount = currentUserId
    ? workshopNotifications.filter((n) => !(n.readByUserIds ?? []).includes(currentUserId)).length
    : 0;

  const createWorkshopOrder = (
    order: WorkshopOrder,
    clientDetails: WorkshopOrderClientDetails
  ) => {
    if (!isOffice) return;
    const unassigned = isOrderUnassigned(order);
    const normalizedOrder: WorkshopOrder = normalizeWorkshopOrder({
      ...order,
      status: unassigned ? "unassigned" : order.status === "unassigned" ? "new" : order.status,
      unitName: unassigned ? UNASSIGNED_UNIT : order.unitName,
      assignedMechanicIds: unassigned ? [] : order.assignedMechanicIds,
    });
    const cleanOrder = cleanForFirestore(normalizedOrder);
    const cleanDetails = cleanForFirestore(clientDetails);

    setWorkshopOrders((prev) => [cleanOrder, ...prev]);
    setWorkshopClientDetailsMap((prev) => ({ ...prev, [cleanOrder.id]: cleanDetails }));

    setDoc(doc(db, "workshopOrders", cleanOrder.id), cleanOrder).catch(console.error);
    setDoc(doc(db, "workshopOrderClientDetails", cleanOrder.id), cleanDetails).catch(console.error);

    dispatchAction("SAVE_WORKSHOP_ORDER", cleanOrder);
    dispatchAction("SAVE_WORKSHOP_CLIENT_DETAILS", cleanDetails);

    if (!unassigned) {
      const unitLocalized = localizeUnitName(cleanOrder.unitName, language);
      const scopesJoined = (cleanOrder.scopeTypes ?? []).join(", ");
      pushWorkshopNotification({
        targetRole: "mechanic",
        targetMechanicIds: cleanOrder.assignedMechanicIds,
        orderId: cleanOrder.id,
        orderNumber: cleanOrder.orderNumber,
        assetLabel: formatOrderAssetSummary(cleanOrder, language, trText),
        type: "order_assigned",
        title:
          language === "de"
            ? `Neuer Auftrag ${cleanOrder.orderNumber}`
            : language === "en"
            ? `New Work Order ${cleanOrder.orderNumber}`
            : `Nowe zlecenie ${cleanOrder.orderNumber}`,
        message:
          language === "de"
            ? `Zugewiesener Umfang: ${scopesJoined} (${unitLocalized}).`
            : language === "en"
            ? `Assigned scope: ${scopesJoined} (${unitLocalized}).`
            : `Przypisano zakres: ${scopesJoined} (${unitLocalized}).`,
      });
    }
  };

  const assignWorkshopOrder = (
    orderId: string,
    mechanicIds: string[],
    unitName?: string
  ) => {
    const existing = workshopOrders.find((o) => o.id === orderId);
    if (!existing || mechanicIds.length === 0) return;

    const firstMech = profiles.find((p) => p.id === mechanicIds[0]);
    const resolvedUnit =
      unitName && unitName !== UNASSIGNED_UNIT
        ? unitName
        : existing.unitName && existing.unitName !== UNASSIGNED_UNIT
        ? existing.unitName
        : firstMech?.unitName || "Hala 1 – Serwis Przyczep & TÜV";

    const updated: WorkshopOrder = cleanForFirestore(
      normalizeWorkshopOrder({
        ...existing,
        status: existing.status === "unassigned" ? "new" : existing.status,
        assignedMechanicIds: mechanicIds,
        unitName: resolvedUnit,
        updatedAt: new Date().toISOString(),
      })
    );

    setWorkshopOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
    setDoc(doc(db, "workshopOrders", updated.id), updated).catch(console.error);
    dispatchAction("SAVE_WORKSHOP_ORDER", updated);

    const unitLocalized = localizeUnitName(updated.unitName, language);
    const scopesJoined = (updated.scopeTypes ?? []).join(", ");
    pushWorkshopNotification({
      targetRole: "mechanic",
      targetMechanicIds: mechanicIds,
      orderId: updated.id,
      orderNumber: updated.orderNumber,
      assetLabel: formatOrderAssetSummary(updated, language, trText),
      type: "order_assigned",
      title:
        language === "de"
          ? `Neuer Auftrag ${updated.orderNumber}`
          : language === "en"
          ? `New Work Order ${updated.orderNumber}`
          : `Nowe zlecenie ${updated.orderNumber}`,
      message:
        language === "de"
          ? `Zugewiesener Umfang: ${scopesJoined} (${unitLocalized}).`
          : language === "en"
          ? `Assigned scope: ${scopesJoined} (${unitLocalized}).`
          : `Przypisano zakres: ${scopesJoined} (${unitLocalized}).`,
    });
  };

  const unassignWorkshopOrder = (orderId: string) => {
    if (!isOffice) return;
    const existing = workshopOrders.find((o) => o.id === orderId);
    if (!existing) return;

    const updated: WorkshopOrder = cleanForFirestore(
      normalizeWorkshopOrder({
        ...existing,
        status: "unassigned",
        assignedMechanicIds: [],
        unitName: UNASSIGNED_UNIT,
        updatedAt: new Date().toISOString(),
      })
    );

    setWorkshopOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
    setDoc(doc(db, "workshopOrders", updated.id), updated).catch(console.error);
    dispatchAction("SAVE_WORKSHOP_ORDER", updated);
  };

  const updateWorkshopOrder = (order: WorkshopOrder) => {
    const updated: WorkshopOrder = cleanForFirestore(
      normalizeWorkshopOrder({
        ...order,
        updatedAt: new Date().toISOString(),
      })
    );
    setWorkshopOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
    setDoc(doc(db, "workshopOrders", updated.id), updated).catch(console.error);
    dispatchAction("SAVE_WORKSHOP_ORDER", updated);
  };

  const deleteWorkshopOrder = (orderId: string) => {
    if (!canManage("workshop.delete")) {
      const t = translations[language as keyof typeof translations] || translations.pl;
      toast.error(t.adminOnlyAction);
      return;
    }
    setWorkshopOrders((prev) => prev.filter((o) => o.id !== orderId));
    setWorkshopClientDetailsMap((prev) => {
      const copy = { ...prev };
      delete copy[orderId];
      return copy;
    });
    deleteDoc(doc(db, "workshopOrders", orderId)).catch(console.error);
    deleteDoc(doc(db, "workshopOrderClientDetails", orderId)).catch(console.error);
    dispatchAction("DELETE_WORKSHOP_ORDER", { id: orderId });
  };

  const updateWorkshopClientDetails = (details: WorkshopOrderClientDetails) => {
    if (!isOffice) return;
    const cleanDetails = cleanForFirestore(details);
    setWorkshopClientDetailsMap((prev) => ({ ...prev, [cleanDetails.orderId]: cleanDetails }));
    setDoc(doc(db, "workshopOrderClientDetails", cleanDetails.orderId), cleanDetails).catch(
      console.error
    );
    dispatchAction("SAVE_WORKSHOP_CLIENT_DETAILS", cleanDetails);
  };

  const submitMechanicDefectReport = (orderId: string, report: WorkshopDefectReport) => {
    const existing = workshopOrders.find((o) => o.id === orderId);
    if (!existing) return;
    const updated: WorkshopOrder = {
      ...existing,
      status: "report_sent",
      defectReport: report,
      updatedAt: new Date().toISOString(),
    };
    updateWorkshopOrder(updated);

    pushWorkshopNotification({
      targetRole: "office",
      orderId: updated.id,
      orderNumber: updated.orderNumber,
      assetLabel: formatOrderAssetSummary(updated, language, trText),
      type: "defect_report_submitted",
      title:
        language === "de"
          ? `DRINGEND: Kunde informieren — Mängelbericht (${report.submittedByMechanicName})`
          : language === "en"
          ? `URGENT: Notify customer — Defect report (${report.submittedByMechanicName})`
          : `PILNE: Poinformuj klienta — Raport usterek (${report.submittedByMechanicName})`,
      message:
        language === "de"
          ? `Erkannte Mängel: ${report.defects.length}, geschätzte Zeit: ${report.estimatedHours}h. Bitte Kunden informieren und Entscheidung (Freigabe / Ablehnung) an Mechaniker melden.`
          : language === "en"
          ? `Detected defects: ${report.defects.length}, est. time: ${report.estimatedHours}h. Inform customer and send approval/rejection decision back to mechanic.`
          : `Wykryto usterek: ${report.defects.length}, szacowany czas: ${report.estimatedHours}h. Poinformuj klienta i przekaż mechanikowi zgodę lub odmowę naprawy.`,
    });
  };

  const submitClientApprovalDecision = (
    orderId: string,
    decision: "approved" | "rejected",
    estimatedCostEur?: number,
    note?: string
  ) => {
    if (!isOffice) return;
    const existing = workshopOrders.find((o) => o.id === orderId);
    if (!existing) return;

    const nowIso = new Date().toISOString();
    const updatedOrder: WorkshopOrder = {
      ...existing,
      status: decision === "approved" ? "approved" : "rejected",
      updatedAt: nowIso,
    };
    updateWorkshopOrder(updatedOrder);

    const existingDetails = workshopClientDetailsMap[orderId] || {
      orderId,
      clientName: language === "de" ? "Kunde" : language === "en" ? "Customer" : "Klient",
    };
    updateWorkshopClientDetails({
      ...existingDetails,
      estimatedCostEur: estimatedCostEur ?? existingDetails.estimatedCostEur,
      costCommunicatedAt: existingDetails.costCommunicatedAt || nowIso,
      clientDecision: decision,
      clientDecisionAt: nowIso,
      clientDecisionNote: note ?? existingDetails.clientDecisionNote,
    });

    pushWorkshopNotification({
      targetRole: "mechanic",
      targetMechanicIds: updatedOrder.assignedMechanicIds,
      orderId: updatedOrder.id,
      orderNumber: updatedOrder.orderNumber,
      assetLabel: formatOrderAssetSummary(updatedOrder),
      type: decision === "approved" ? "client_approved" : "client_rejected",
      title:
        decision === "approved"
          ? language === "de"
            ? `Kunde hat Reparatur FREIGEGEBEN (${updatedOrder.orderNumber})`
            : language === "en"
            ? `Customer APPROVED repair (${updatedOrder.orderNumber})`
            : `Klient ZATWIERDZIŁ naprawę (${updatedOrder.orderNumber})`
          : language === "de"
          ? `Kunde hat Reparatur ABGELEHNT (${updatedOrder.orderNumber})`
          : language === "en"
          ? `Customer REJECTED repair (${updatedOrder.orderNumber})`
          : `Klient ODRZUCIŁ naprawę (${updatedOrder.orderNumber})`,
      message:
        decision === "approved"
          ? language === "de"
            ? "Reparatur kann fortgesetzt und Endprotokoll abgeschlossen werden."
            : language === "en"
            ? "You may proceed with the repair and finalize the protocol."
            : "Można kontynuować naprawę i finalizować protokół końcowy."
          : language === "de"
          ? "Reparatur auf Wunsch des Kunden gestoppt."
          : language === "en"
          ? "Repair stopped at customer's request."
          : "Wstrzymano naprawę na życzenie klienta.",
    });
  };

  const transferWorkshopOrder = (
    orderId: string,
    toUnit: string,
    toMechanicIds: string[],
    reason?: string
  ) => {
    const existing = workshopOrders.find((o) => o.id === orderId);
    if (!existing) return;

    const entry = {
      id: `tr_${Date.now().toString(36)}`,
      timestamp: new Date().toISOString(),
      fromUnit: existing.unitName,
      toUnit,
      fromMechanicIds: existing.assignedMechanicIds,
      toMechanicIds,
      transferredBy: currentUser?.name || "Operator",
      reason,
    };

    const updated: WorkshopOrder = {
      ...existing,
      unitName: toUnit,
      assignedMechanicIds: toMechanicIds,
      transferHistory: [...(existing.transferHistory || []), entry],
      updatedAt: new Date().toISOString(),
    };
    updateWorkshopOrder(updated);

    pushWorkshopNotification({
      targetRole: "mechanic",
      targetMechanicIds: toMechanicIds,
      orderId: updated.id,
      orderNumber: updated.orderNumber,
      assetLabel: formatOrderAssetSummary(updated),
      type: "order_transferred",
      title:
        language === "de"
          ? `Auftrag ${updated.orderNumber} an ${toUnit} übergeben`
          : language === "en"
          ? `Order ${updated.orderNumber} transferred to ${toUnit}`
          : `Przekazano zlecenie ${updated.orderNumber} do ${toUnit}`,
      message:
        reason ||
        (language === "de"
          ? `Übergeben von ${existing.unitName} unter Beibehaltung des Fortschritts.`
          : language === "en"
          ? `Transferred from ${existing.unitName} preserving existing progress.`
          : `Przeniesiono z ${existing.unitName} z zachowaniem dotychczasowego postępu.`),
    });
  };

  const completeWorkshopProtocol = (orderId: string, protocol: WorkshopFinalProtocol) => {
    const existing = workshopOrders.find((o) => o.id === orderId);
    if (!existing) return;

    // Stop any running timers cleanly
    const nowIso = new Date().toISOString();
    const closedLogs = (existing.timeLogs ?? []).map((l) => {
      if (!l.endedAt) {
        const mins = Math.max(
          1,
          Math.round((Date.now() - new Date(l.startedAt).getTime()) / 60000)
        );
        return { ...l, endedAt: nowIso, durationMinutes: mins };
      }
      return l;
    });

    const updated: WorkshopOrder = {
      ...existing,
      status: "completed",
      timeLogs: closedLogs,
      wheelTorqueNm: protocol.wheelTorqueNm || existing.wheelTorqueNm,
      finalProtocol: protocol,
      updatedAt: nowIso,
    };
    updateWorkshopOrder(updated);

    const totalHoursRounded = Math.round((protocol.totalMinutes / 60) * 10) / 10;
    pushWorkshopNotification({
      targetRole: "office",
      orderId: updated.id,
      orderNumber: updated.orderNumber,
      assetLabel: formatOrderAssetSummary(updated),
      type: "order_completed",
      title:
        language === "de"
          ? `Auftrag ${updated.orderNumber} ABGESCHLOSSEN`
          : language === "en"
          ? `Order ${updated.orderNumber} COMPLETED`
          : `Zlecenie ${updated.orderNumber} UKOŃCZONE`,
      message:
        language === "de"
          ? `Protokoll unterschrieben von: ${protocol.signedByMechanicName}. Gesamtzeit: ${totalHoursRounded}h.`
          : language === "en"
          ? `Protocol signed by: ${protocol.signedByMechanicName}. Total time: ${totalHoursRounded}h.`
          : `Protokół podpisany przez: ${protocol.signedByMechanicName}. Łączny czas: ${totalHoursRounded}h.`,
    });
  };

  const markWorkshopNotificationRead = (notificationId: string) => {
    if (!currentUserId) return;
    const target = allWorkshopNotifications.find((n) => n.id === notificationId);
    const readIds = target?.readByUserIds ?? [];
    if (!target || readIds.includes(currentUserId)) return;
    const updated: WorkshopNotification = {
      ...target,
      readByUserIds: [...readIds, currentUserId],
    };
    setAllWorkshopNotifications((prev) =>
      prev.map((n) => (n.id === notificationId ? updated : n))
    );
    setDoc(doc(db, "workshopNotifications", notificationId), cleanForFirestore(updated)).catch(
      console.error
    );
    dispatchAction("SAVE_WORKSHOP_NOTIFICATION", updated);
  };

  const markAllWorkshopNotificationsRead = () => {
    if (!currentUserId) return;
    workshopNotifications.forEach((n) => {
      if (!(n.readByUserIds ?? []).includes(currentUserId)) {
        markWorkshopNotificationRead(n.id);
      }
    });
  };

  // =========================================================================
  // EXISTING RENTAL FLEET & CRM ACTIONS
  // =========================================================================
  const getHistoryEntry = (action: ReservationHistoryEntry["action"]): ReservationHistoryEntry => {
    const activeUser = profiles.find((p) => p.id === currentUserId);
    return {
      id: Math.random().toString(36).substring(7),
      action,
      timestamp: new Date().toISOString(),
      profileId: activeUser?.id,
      profileName: activeUser?.name || "System",
    };
  };

  const addReservation = (res: Reservation) => {
    if (!isOffice) return;
    const historyEntry = getHistoryEntry("created");
    const newRes = { ...res, history: [historyEntry] };
    setReservations((prev) => [...prev, newRes]);
    setDoc(doc(db, "reservations", newRes.id), cleanForFirestore(newRes)).catch((err) =>
      handleFirestoreError(err, OperationType.CREATE, `reservations/${newRes.id}`)
    );
    dispatchAction("ADD_RESERVATION", newRes);
  };

  const updateReservation = (res: Reservation, action?: ReservationHistoryEntry["action"]) => {
    if (!isOffice) return;
    const finalRes = { ...res };
    if (action) {
      const existing = reservations.find((r) => r.id === res.id);
      const historyEntry = getHistoryEntry(action);
      finalRes.history = [...(existing?.history || []), historyEntry];
    }
    setReservations((prev) => prev.map((r) => (r.id === finalRes.id ? finalRes : r)));
    setDoc(doc(db, "reservations", finalRes.id), cleanForFirestore(finalRes)).catch((err) =>
      handleFirestoreError(err, OperationType.UPDATE, `reservations/${finalRes.id}`)
    );
    dispatchAction("UPDATE_RESERVATION", finalRes);
  };

  const logReservationAction = (
    reservationId: string,
    action: ReservationHistoryEntry["action"]
  ) => {
    if (!isOffice) return;
    const existing = reservations.find((r) => r.id === reservationId);
    if (existing) {
      const historyEntry = getHistoryEntry(action);
      const updated = { ...existing, history: [...(existing.history || []), historyEntry] };
      setReservations((prev) => prev.map((r) => (r.id === reservationId ? updated : r)));
      setDoc(doc(db, "reservations", reservationId), cleanForFirestore(updated)).catch((err) =>
        handleFirestoreError(err, OperationType.UPDATE, `reservations/${reservationId}`)
      );
      dispatchAction("UPDATE_RESERVATION", updated);
    }
  };

  const deleteReservation = (id: string) => {
    if (!canManage("reservation.edit")) {
      const t = translations[language as keyof typeof translations] || translations.pl;
      toast.error(t.adminOnlyAction);
      return;
    }
    setReservations((prev) => prev.filter((r) => r.id !== id));
    deleteDoc(doc(db, "reservations", id)).catch((err) =>
      handleFirestoreError(err, OperationType.DELETE, `reservations/${id}`)
    );
    dispatchAction("DELETE_RESERVATION", { id });
  };

  const updateTrailerStatus = (id: string, status: Trailer["status"]) => {
    const existing = trailers.find((t) => t.id === id);
    if (existing) {
      const updated = { ...existing, status };
      setTrailers((prev) => prev.map((t) => (t.id === id ? updated : t)));
      setDoc(doc(db, "trailers", id), cleanForFirestore(updated)).catch((err) =>
        handleFirestoreError(err, OperationType.UPDATE, `trailers/${id}`)
      );
      dispatchAction("UPDATE_TRAILER", updated);
    }
  };

  const addTrailer = (trailer: Trailer) => {
    if (!canManage("fleet.edit")) {
      const t = translations[language as keyof typeof translations] || translations.pl;
      toast.error(t.adminOnlyAction);
      return;
    }
    setTrailers((prev) => [...prev, trailer]);
    setDoc(doc(db, "trailers", trailer.id), cleanForFirestore(trailer)).catch((err) =>
      handleFirestoreError(err, OperationType.CREATE, `trailers/${trailer.id}`)
    );
    dispatchAction("ADD_TRAILER", trailer);
  };

  const updateTrailer = (trailer: Trailer) => {
    if (!canManage("fleet.edit")) {
      const t = translations[language as keyof typeof translations] || translations.pl;
      toast.error(t.adminOnlyAction);
      return;
    }
    setTrailers((prev) => prev.map((t) => (t.id === trailer.id ? trailer : t)));
    setDoc(doc(db, "trailers", trailer.id), cleanForFirestore(trailer)).catch((err) =>
      handleFirestoreError(err, OperationType.UPDATE, `trailers/${trailer.id}`)
    );
    dispatchAction("UPDATE_TRAILER", trailer);
  };

  // =========================================================================
  // TÜV EXPIRY MANAGEMENT — office-level permission (admin + employee)
  // Deliberately narrow: it only touches `tuvExpiry` + audit fields, so office
  // staff can maintain inspection deadlines without full vehicle master-data rights.
  // =========================================================================
  const updateTrailerTuv = (id: string, newExpiry?: string, note?: string): boolean => {
    const t = translations[language as keyof typeof translations] || translations.pl;
    if (!isOffice) {
      toast.error(t.adminOnlyAction);
      return false;
    }
    const existing = trailers.find((tr) => tr.id === id);
    if (!existing) return false;

    let normalizedExpiry: string | undefined = undefined;
    if (newExpiry) {
      const parsed = new Date(newExpiry);
      if (Number.isNaN(parsed.getTime())) {
        toast.error(t.tuvInvalidDate || "Invalid date");
        return false;
      }
      normalizedExpiry = parsed.toISOString();
    }

    const previousExpiry = existing.tuvExpiry;
    if ((previousExpiry || "") === (normalizedExpiry || "")) {
      return false;
    }

    const actorName = currentUser?.name || "—";
    const actorId = currentUser?.id || "unknown";
    const nowIso = new Date().toISOString();
    const entry: TuvHistoryEntry = {
      id: `tuv_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: nowIso,
      previousExpiry,
      newExpiry: normalizedExpiry || "",
      changedById: actorId,
      changedByName: actorName,
      note: note?.trim() ? note.trim() : undefined,
    };

    const updated: Trailer = {
      ...existing,
      tuvExpiry: normalizedExpiry,
      tuvLastUpdatedAt: nowIso,
      tuvLastUpdatedBy: actorName,
      tuvHistory: [entry, ...(existing.tuvHistory || [])].slice(0, 60),
    };

    setTrailers((prev) => prev.map((tr) => (tr.id === id ? updated : tr)));
    setDoc(doc(db, "trailers", id), cleanForFirestore(updated)).catch((err) =>
      handleFirestoreError(err, OperationType.UPDATE, `trailers/${id}`)
    );
    dispatchAction("UPDATE_TRAILER", updated);
    return true;
  };

  const deleteTrailer = (id: string) => {
    if (!canManage("fleet.edit")) {
      const t = translations[language as keyof typeof translations] || translations.pl;
      toast.error(t.adminOnlyAction);
      return;
    }
    setTrailers((prev) => prev.filter((t) => t.id !== id));
    deleteDoc(doc(db, "trailers", id)).catch((err) =>
      handleFirestoreError(err, OperationType.DELETE, `trailers/${id}`)
    );
    dispatchAction("DELETE_TRAILER", { id });
  };

  const resetTrailers = () => {
    const t = translations[language as keyof typeof translations] || translations.pl;
    if (!canManage("fleet.edit")) {
      toast.error(t.adminOnlyAction);
      return;
    }
    setTrailers([...initialTrailers]);
    const batch = writeBatch(db);
    initialTrailers.forEach((tr) => {
      batch.set(doc(db, "trailers", tr.id), cleanForFirestore(tr));
    });
    batch.commit().catch(console.error);
    dispatchAction("RESET_TRAILERS", {});
    toast.success(t.trailersSynced);
  };

  const updateClientBalance = (id: string, amount: number) => {
    if (!canManage("client.balance")) {
      const t = translations[language as keyof typeof translations] || translations.pl;
      toast.error(t.adminOnlyAction);
      return;
    }
    const existing = clients.find((c) => c.id === id);
    if (existing) {
      const updated = { ...existing, balance: existing.balance + amount };
      setClients((prev) => prev.map((c) => (c.id === id ? updated : c)));
      setDoc(doc(db, "clients", id), cleanForFirestore(updated)).catch((err) =>
        handleFirestoreError(err, OperationType.UPDATE, `clients/${id}`)
      );
      dispatchAction("UPDATE_CLIENT", updated);
    }
  };

  const addClient = (client: Client) => {
    if (!isOffice) return;
    setClients((prev) => [...prev, client]);
    setDoc(doc(db, "clients", client.id), cleanForFirestore(client)).catch((err) =>
      handleFirestoreError(err, OperationType.CREATE, `clients/${client.id}`)
    );
    dispatchAction("ADD_CLIENT", client);
  };

  const updateClient = (client: Client) => {
    if (!isOffice) return;
    setClients((prev) => prev.map((c) => (c.id === client.id ? client : c)));
    setDoc(doc(db, "clients", client.id), cleanForFirestore(client)).catch((err) =>
      handleFirestoreError(err, OperationType.UPDATE, `clients/${client.id}`)
    );
    dispatchAction("UPDATE_CLIENT", client);
  };

  const deleteClient = (id: string) => {
    if (!canManage("client.edit")) {
      const t = translations[language as keyof typeof translations] || translations.pl;
      toast.error(t.adminOnlyAction);
      return;
    }
    setClients((prev) => prev.filter((c) => c.id !== id));
    deleteDoc(doc(db, "clients", id)).catch((err) =>
      handleFirestoreError(err, OperationType.DELETE, `clients/${id}`)
    );
    dispatchAction("DELETE_CLIENT", { id });
  };

  const updateStatusColor = (status: Reservation["status"], color: ColorOption) => {
    if (!canManage("settings.edit")) {
      const t = translations[language as keyof typeof translations] || translations.pl;
      toast.error(t.adminOnlyAction);
      return;
    }
    setStatusColors((prev) => ({ ...prev, [status]: color }));
  };

  const checkTrailerAvailability = (
    trailerId: string,
    start: Date,
    end: Date,
    excludeReservationId?: string
  ) => {
    return !reservations.some((res) => {
      if (res.status === "cancelled") return false;
      if (res.trailerId !== trailerId) return false;
      if (excludeReservationId && res.id === excludeReservationId) return false;

      const resStart = new Date(res.startDate);
      const resEnd = new Date(res.endDate);
      const resEndWithBuffer = new Date(resEnd.getTime() + 60 * 60 * 1000);

      return start < resEndWithBuffer && end > resStart;
    });
  };

  const createBackupSnapshot = async (
    customName?: string,
    type: BackupSnapshot["type"] = "manual"
  ): Promise<BackupSnapshot> => {
    const activeUser = profiles.find((p) => p.id === currentUserId);
    const now = new Date();
    const formattedDate = now.toLocaleString(
      language === "de" ? "de-DE" : language === "en" ? "en-GB" : "pl-PL",
      {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }
    );

    const snapshot: BackupSnapshot = {
      id: `bkp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: customName?.trim() || `Backup ${formattedDate}`,
      createdAt: now.toISOString(),
      createdBy: activeUser?.name || "Operator",
      type,
      reservationsCount: reservations.length,
      clientsCount: clients.length,
      trailersCount: trailers.length,
      reservations: cleanForFirestore(reservations),
      clients: cleanForFirestore(clients),
      trailers: cleanForFirestore(trailers),
    };

    setBackups((prev) => {
      const next = [snapshot, ...prev];
      try {
        localStorage.setItem("localBackups", JSON.stringify(next.slice(0, 15)));
      } catch {}
      return next;
    });

    await dispatchAction("SAVE_BACKUP", snapshot);

    let firestoreSnapshot = cleanForFirestore(snapshot);
    if (JSON.stringify(firestoreSnapshot).length > 800000) {
      firestoreSnapshot = {
        ...firestoreSnapshot,
        reservations: firestoreSnapshot.reservations.map((r) => ({
          ...r,
          pickupPhotos: [],
          returnPhotos: [],
        })),
      };
    }

    try {
      await setDoc(doc(db, "backups", snapshot.id), firestoreSnapshot);
    } catch (err) {
      console.warn("Could not save backup to Firestore, stored in SQLite and LocalStorage:", err);
    }

    return snapshot;
  };

  const deleteBackupSnapshot = async (id: string): Promise<void> => {
    if (!canManage("data.restore")) {
      const t = translations[language as keyof typeof translations] || translations.pl;
      toast.error(t.adminOnlyAction);
      return;
    }
    setBackups((prev) => {
      const next = prev.filter((b) => b.id !== id);
      try {
        localStorage.setItem("localBackups", JSON.stringify(next.slice(0, 15)));
      } catch {}
      return next;
    });

    await dispatchAction("DELETE_BACKUP", { id });

    try {
      await deleteDoc(doc(db, "backups", id));
    } catch (err) {
      console.warn("Could not delete backup from Firestore:", err);
    }
  };

  const restoreFromBackup = async (
    snapshot: { reservations?: Reservation[]; clients?: Client[]; trailers?: Trailer[] },
    options?: {
      mode?: "overwrite" | "merge";
      includeReservations?: boolean;
      includeClients?: boolean;
      includeTrailers?: boolean;
      createSafetyBackup?: boolean;
    }
  ): Promise<void> => {
    if (!canManage("data.restore")) {
      const t = translations[language as keyof typeof translations] || translations.pl;
      toast.error(t.adminOnlyAction);
      return;
    }
    const mode = options?.mode || "overwrite";
    const includeReservations = options?.includeReservations ?? true;
    const includeClients = options?.includeClients ?? true;
    const includeTrailers = options?.includeTrailers ?? true;
    const createSafetyBackup = options?.createSafetyBackup ?? true;

    if (createSafetyBackup) {
      const safetyTitle =
        language === "de"
          ? "Auto-Sicherung vor Wiederherstellung"
          : language === "en"
          ? "Auto-Backup before restore"
          : "Auto-zapis przed przywróceniem";
      await createBackupSnapshot(safetyTitle, "auto");
    }

    let nextReservations = [...reservations];
    let nextClients = [...clients];
    let nextTrailers = [...trailers];

    if (includeReservations && Array.isArray(snapshot.reservations)) {
      if (mode === "overwrite") {
        nextReservations = cleanForFirestore(snapshot.reservations);
      } else {
        const map = new Map(reservations.map((r) => [r.id, r]));
        snapshot.reservations.forEach((r) => map.set(r.id, cleanForFirestore(r)));
        nextReservations = Array.from(map.values());
      }
      setReservations(nextReservations);
    }

    if (includeClients && Array.isArray(snapshot.clients)) {
      if (mode === "overwrite") {
        nextClients = cleanForFirestore(snapshot.clients);
      } else {
        const map = new Map(clients.map((c) => [c.id, c]));
        snapshot.clients.forEach((c) => map.set(c.id, cleanForFirestore(c)));
        nextClients = Array.from(map.values());
      }
      setClients(nextClients);
    }

    if (includeTrailers && Array.isArray(snapshot.trailers)) {
      if (mode === "overwrite") {
        nextTrailers = cleanForFirestore(snapshot.trailers);
      } else {
        const map = new Map(trailers.map((t) => [t.id, t]));
        snapshot.trailers.forEach((t) => map.set(t.id, cleanForFirestore(t)));
        nextTrailers = Array.from(map.values());
      }
      setTrailers(nextTrailers);
    }

    await dispatchAction("RESTORE_BACKUP", {
      mode,
      reservations: includeReservations ? snapshot.reservations : undefined,
      clients: includeClients ? snapshot.clients : undefined,
      trailers: includeTrailers ? snapshot.trailers : undefined,
    });

    const operations: Array<{ type: "set" | "delete"; col: string; id: string; data?: any }> = [];

    if (includeReservations && Array.isArray(snapshot.reservations)) {
      if (mode === "overwrite") {
        const incomingIds = new Set(snapshot.reservations.map((r) => r.id));
        reservations.forEach((oldR) => {
          if (!incomingIds.has(oldR.id)) {
            operations.push({ type: "delete", col: "reservations", id: oldR.id });
          }
        });
      }
      snapshot.reservations.forEach((r) => {
        if (r && r.id) {
          operations.push({
            type: "set",
            col: "reservations",
            id: r.id,
            data: cleanForFirestore(r),
          });
        }
      });
    }

    if (includeClients && Array.isArray(snapshot.clients)) {
      if (mode === "overwrite") {
        const incomingIds = new Set(snapshot.clients.map((c) => c.id));
        clients.forEach((oldC) => {
          if (!incomingIds.has(oldC.id)) {
            operations.push({ type: "delete", col: "clients", id: oldC.id });
          }
        });
      }
      snapshot.clients.forEach((c) => {
        if (c && c.id) {
          operations.push({
            type: "set",
            col: "clients",
            id: c.id,
            data: cleanForFirestore(c),
          });
        }
      });
    }

    if (includeTrailers && Array.isArray(snapshot.trailers)) {
      if (mode === "overwrite") {
        const incomingIds = new Set(snapshot.trailers.map((t) => t.id));
        trailers.forEach((oldT) => {
          if (!incomingIds.has(oldT.id)) {
            operations.push({ type: "delete", col: "trailers", id: oldT.id });
          }
        });
      }
      snapshot.trailers.forEach((t) => {
        if (t && t.id) {
          operations.push({
            type: "set",
            col: "trailers",
            id: t.id,
            data: cleanForFirestore(t),
          });
        }
      });
    }

    for (let i = 0; i < operations.length; i += 400) {
      const chunk = operations.slice(i, i + 400);
      const batch = writeBatch(db);
      chunk.forEach((op) => {
        const ref = doc(db, op.col, op.id);
        if (op.type === "delete") {
          batch.delete(ref);
        } else {
          batch.set(ref, op.data);
        }
      });
      await batch.commit();
    }
  };

  return (
    <AppContext.Provider
      value={{
        trailers,
        clients: isOffice ? clients : [],
        reservations: isOffice ? reservations : [],
        profiles,
        currentUserId,
        currentUser,
        userRole,
        isAdmin,
        isMechanic,
        isOffice,
        canManage,
        language,
        statusColors,
        isHydrated,
        isCloudConnected,
        cloudSyncStatus,
        addReservation,
        updateReservation,
        deleteReservation,
        updateTrailerStatus,
        addTrailer,
        updateTrailer,
        updateTrailerTuv,
        deleteTrailer,
        resetTrailers,
        updateClientBalance,
        addClient,
        updateClient,
        deleteClient,
        setLanguage,
        updateStatusColor,
        loginUser,
        authenticateUser,
        logoutUser,
        addEmployeeProfile,
        updateMechanicProfile,
        deleteEmployeeProfile,
        checkTrailerAvailability,
        logReservationAction,
        backups: isOffice ? backups : [],
        createBackupSnapshot,
        deleteBackupSnapshot,
        restoreFromBackup,
        workshopOrders,
        workshopClientDetailsMap: isOffice ? workshopClientDetailsMap : {},
        workshopNotifications,
        unreadWorkshopNotificationsCount,
        trText,
        isTranslatingDescriptions,
        createWorkshopOrder,
        assignWorkshopOrder,
        unassignWorkshopOrder,
        updateWorkshopOrder,
        deleteWorkshopOrder,
        updateWorkshopClientDetails,
        submitMechanicDefectReport,
        submitClientApprovalDecision,
        transferWorkshopOrder,
        completeWorkshopProtocol,
        markWorkshopNotificationRead,
        markAllWorkshopNotificationsRead,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
}
