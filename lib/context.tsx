"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from "react";
import { 
  Trailer, 
  Client, 
  Reservation, 
  ReservationHistoryEntry, 
  UserProfile, 
  BackupSnapshot,
  initialTrailers, 
  initialClients, 
  initialReservations, 
  initialProfiles 
} from "./store";
import { ColorOption } from "./colors";
import { toast } from "sonner";
import { translations } from "./translations";
import { 
  collection, 
  doc, 
  onSnapshot, 
  setDoc, 
  deleteDoc, 
  writeBatch 
} from "firebase/firestore";
import { 
  db, 
  handleFirestoreError, 
  OperationType, 
  testFirestoreConnection 
} from "./firebase";

export type StatusColors = Record<Reservation["status"], ColorOption>;

const defaultStatusColors: StatusColors = {
  paid: "green",
  invoiced: "amber",
  defect: "red",
  completed: "slate",
  active: "blue",
  cancelled: "red"
};

// Helper to remove any undefined fields before writing to Firestore
function cleanForFirestore<T>(data: T): T {
  return JSON.parse(JSON.stringify(data));
}

interface AppState {
  trailers: Trailer[];
  clients: Client[];
  reservations: Reservation[];
  profiles: UserProfile[];
  currentUserId: string | null;
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
  deleteTrailer: (id: string) => void;
  resetTrailers: () => void;
  updateClientBalance: (id: string, amount: number) => void;
  addClient: (client: Client) => void;
  updateClient: (client: Client) => void;
  deleteClient: (id: string) => void;
  setLanguage: (lang: string) => void;
  updateStatusColor: (status: Reservation["status"], color: ColorOption) => void;
  loginUser: (id: string) => void;
  logoutUser: () => void;
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
}

const AppContext = createContext<AppState | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [trailers, setTrailers] = useState<Trailer[]>(initialTrailers);
  const [clients, setClients] = useState<Client[]>(initialClients);
  const [reservations, setReservations] = useState<Reservation[]>(initialReservations);
  const [profiles, setProfiles] = useState<UserProfile[]>(initialProfiles);
  const [backups, setBackups] = useState<BackupSnapshot[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [language, setLanguage] = useState<string>("pl");
  const [statusColors, setStatusColors] = useState<StatusColors>(defaultStatusColors);
  const [isHydrated, setIsHydrated] = useState(false);
  const [isCloudConnected, setIsCloudConnected] = useState(false);
  const [cloudSyncStatus, setCloudSyncStatus] = useState<"connected" | "syncing" | "offline">("syncing");

  const seededRef = useRef({
    trailers: false,
    clients: false,
    reservations: false,
    profiles: false,
  });

  // Client hydration check & local storage restoration
  useEffect(() => {
    let isSubscribed = true;

    setTimeout(() => {
      if (!isSubscribed) return;
      const savedUserId = localStorage.getItem("currentUserId");
      const savedLang = localStorage.getItem("language");
      const savedColors = localStorage.getItem("statusColors");

      if (savedUserId) setCurrentUserId(savedUserId);
      if (savedLang) setLanguage(savedLang);
      if (savedColors) {
        try {
          setStatusColors(JSON.parse(savedColors));
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

  // Real-time Firestore Cloud Database listeners
  useEffect(() => {
    if (!isHydrated) return;

    let isSubscribed = true;

    // Test Firestore connection on boot
    testFirestoreConnection().then((ok) => {
      if (isSubscribed && ok) {
        setIsCloudConnected(true);
        setCloudSyncStatus("connected");
      }
    });

    // 1. Listen to 'trailers' collection in real-time
    const unsubTrailers = onSnapshot(
      collection(db, "trailers"),
      (snapshot) => {
        if (!isSubscribed) return;
        if (snapshot.empty && !seededRef.current.trailers) {
          seededRef.current.trailers = true;
          // Seed initial trailers to Firestore
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

    // 2. Listen to 'clients' collection in real-time
    const unsubClients = onSnapshot(
      collection(db, "clients"),
      (snapshot) => {
        if (!isSubscribed) return;
        if (snapshot.empty && !seededRef.current.clients) {
          seededRef.current.clients = true;
          // Seed initial clients to Firestore
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

    // 3. Listen to 'reservations' collection in real-time
    const unsubReservations = onSnapshot(
      collection(db, "reservations"),
      (snapshot) => {
        if (!isSubscribed) return;
        if (snapshot.empty && !seededRef.current.reservations) {
          seededRef.current.reservations = true;
          // Seed initial reservations to Firestore
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

    // 4. Listen to 'userProfiles' collection in real-time
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
          const items: UserProfile[] = [];
          snapshot.forEach((d) => items.push(d.data() as UserProfile));
          setProfiles(items);
        }
      },
      (error) => {
        console.warn("Firestore profiles listener error", error);
      }
    );

    // 5. Listen to 'backups' collection in real-time
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

    return () => {
      isSubscribed = false;
      unsubTrailers();
      unsubClients();
      unsubReservations();
      unsubProfiles();
      unsubBackups();
    };
  }, [isHydrated]);

  // Secondary local API sync dispatch as resilient backup
  const dispatchAction = async (action: string, payload: any) => {
    try {
      await fetch('/api/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, payload })
      });
    } catch (e) {
      // Local sync silent fallback
    }
  };

  // Save local preferences
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
    const updatedProfiles = profiles.map(p => p.id === id ? { ...p, isOnline: true } : p);
    setProfiles(updatedProfiles);
    const user = profiles.find(p => p.id === id);
    if (user) {
      setDoc(doc(db, "userProfiles", id), cleanForFirestore({ ...user, isOnline: true })).catch(console.error);
    }
    dispatchAction('UPDATE_PROFILE', { id, isOnline: true, name: user?.name });
  };

  const logoutUser = () => {
    if (currentUserId) {
      const user = profiles.find(p => p.id === currentUserId);
      if (user) {
        setDoc(doc(db, "userProfiles", currentUserId), cleanForFirestore({ ...user, isOnline: false })).catch(console.error);
      }
      setProfiles(prev => prev.map(p => p.id === currentUserId ? { ...p, isOnline: false } : p));
      dispatchAction('UPDATE_PROFILE', { id: currentUserId, isOnline: false, name: user?.name });
    }
    setCurrentUserId(null);
  };

  const getHistoryEntry = (action: ReservationHistoryEntry["action"]): ReservationHistoryEntry => {
    const currentUser = profiles.find(p => p.id === currentUserId);
    return {
      id: Math.random().toString(36).substring(7),
      action,
      timestamp: new Date().toISOString(),
      profileId: currentUser?.id,
      profileName: currentUser?.name || "System"
    };
  };

  const addReservation = (res: Reservation) => {
    const historyEntry = getHistoryEntry("created");
    const newRes = { ...res, history: [historyEntry] };
    setReservations((prev) => [...prev, newRes]);

    // Live Online Firestore write
    setDoc(doc(db, "reservations", newRes.id), cleanForFirestore(newRes)).catch((err) =>
      handleFirestoreError(err, OperationType.CREATE, `reservations/${newRes.id}`)
    );
    dispatchAction('ADD_RESERVATION', newRes);
  };

  const updateReservation = (res: Reservation, action?: ReservationHistoryEntry["action"]) => {
    let finalRes = { ...res };
    if (action) {
      const existing = reservations.find(r => r.id === res.id);
      const historyEntry = getHistoryEntry(action);
      finalRes.history = [...(existing?.history || []), historyEntry];
    }
    setReservations((prev) => prev.map((r) => r.id === finalRes.id ? finalRes : r));

    // Live Online Firestore write
    setDoc(doc(db, "reservations", finalRes.id), cleanForFirestore(finalRes)).catch((err) =>
      handleFirestoreError(err, OperationType.UPDATE, `reservations/${finalRes.id}`)
    );
    dispatchAction('UPDATE_RESERVATION', finalRes);
  };

  const logReservationAction = (reservationId: string, action: ReservationHistoryEntry["action"]) => {
    const existing = reservations.find(r => r.id === reservationId);
    if (existing) {
      const historyEntry = getHistoryEntry(action);
      const updated = { ...existing, history: [...(existing.history || []), historyEntry] };
      setReservations((prev) => prev.map((r) => r.id === reservationId ? updated : r));

      setDoc(doc(db, "reservations", reservationId), cleanForFirestore(updated)).catch((err) =>
        handleFirestoreError(err, OperationType.UPDATE, `reservations/${reservationId}`)
      );
      dispatchAction('UPDATE_RESERVATION', updated);
    }
  };

  const deleteReservation = (id: string) => {
    setReservations((prev) => prev.filter((r) => r.id !== id));
    deleteDoc(doc(db, "reservations", id)).catch((err) =>
      handleFirestoreError(err, OperationType.DELETE, `reservations/${id}`)
    );
    dispatchAction('DELETE_RESERVATION', { id });
  };

  const updateTrailerStatus = (id: string, status: Trailer["status"]) => {
    const existing = trailers.find(t => t.id === id);
    if (existing) {
      const updated = { ...existing, status };
      setTrailers((prev) => prev.map((t) => (t.id === id ? updated : t)));

      setDoc(doc(db, "trailers", id), cleanForFirestore(updated)).catch((err) =>
        handleFirestoreError(err, OperationType.UPDATE, `trailers/${id}`)
      );
      dispatchAction('UPDATE_TRAILER', updated);
    }
  };

  const addTrailer = (trailer: Trailer) => {
    setTrailers((prev) => [...prev, trailer]);
    setDoc(doc(db, "trailers", trailer.id), cleanForFirestore(trailer)).catch((err) =>
      handleFirestoreError(err, OperationType.CREATE, `trailers/${trailer.id}`)
    );
    dispatchAction('ADD_TRAILER', trailer);
  };

  const updateTrailer = (trailer: Trailer) => {
    setTrailers((prev) => prev.map((t) => (t.id === trailer.id ? trailer : t)));
    setDoc(doc(db, "trailers", trailer.id), cleanForFirestore(trailer)).catch((err) =>
      handleFirestoreError(err, OperationType.UPDATE, `trailers/${trailer.id}`)
    );
    dispatchAction('UPDATE_TRAILER', trailer);
  };

  const deleteTrailer = (id: string) => {
    setTrailers((prev) => prev.filter((t) => t.id !== id));
    deleteDoc(doc(db, "trailers", id)).catch((err) =>
      handleFirestoreError(err, OperationType.DELETE, `trailers/${id}`)
    );
    dispatchAction('DELETE_TRAILER', { id });
  };

  const resetTrailers = () => {
    setTrailers([...initialTrailers]);
    const batch = writeBatch(db);
    initialTrailers.forEach((t) => {
      batch.set(doc(db, "trailers", t.id), cleanForFirestore(t));
    });
    batch.commit().catch(console.error);

    dispatchAction('RESET_TRAILERS', {});
    const t = translations[language as keyof typeof translations];
    toast.success(t.trailersSynced);
  };

  const updateClientBalance = (id: string, amount: number) => {
    const existing = clients.find(c => c.id === id);
    if (existing) {
      const updated = { ...existing, balance: existing.balance + amount };
      setClients((prev) => prev.map((c) => (c.id === id ? updated : c)));

      setDoc(doc(db, "clients", id), cleanForFirestore(updated)).catch((err) =>
        handleFirestoreError(err, OperationType.UPDATE, `clients/${id}`)
      );
      dispatchAction('UPDATE_CLIENT', updated);
    }
  };

  const addClient = (client: Client) => {
    setClients((prev) => [...prev, client]);
    setDoc(doc(db, "clients", client.id), cleanForFirestore(client)).catch((err) =>
      handleFirestoreError(err, OperationType.CREATE, `clients/${client.id}`)
    );
    dispatchAction('ADD_CLIENT', client);
  };

  const updateClient = (client: Client) => {
    setClients((prev) => prev.map((c) => (c.id === client.id ? client : c)));
    setDoc(doc(db, "clients", client.id), cleanForFirestore(client)).catch((err) =>
      handleFirestoreError(err, OperationType.UPDATE, `clients/${client.id}`)
    );
    dispatchAction('UPDATE_CLIENT', client);
  };

  const deleteClient = (id: string) => {
    setClients((prev) => prev.filter((c) => c.id !== id));
    deleteDoc(doc(db, "clients", id)).catch((err) =>
      handleFirestoreError(err, OperationType.DELETE, `clients/${id}`)
    );
    dispatchAction('DELETE_CLIENT', { id });
  };

  const updateStatusColor = (status: Reservation["status"], color: ColorOption) => {
    setStatusColors((prev) => ({ ...prev, [status]: color }));
  };

  const checkTrailerAvailability = (trailerId: string, start: Date, end: Date, excludeReservationId?: string) => {
    return !reservations.some(res => {
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
    const currentUser = profiles.find((p) => p.id === currentUserId);
    const now = new Date();
    const formattedDate = now.toLocaleString(language === "de" ? "de-DE" : language === "en" ? "en-GB" : "pl-PL", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    const snapshot: BackupSnapshot = {
      id: `bkp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: customName?.trim() || `Backup ${formattedDate}`,
      createdAt: now.toISOString(),
      createdBy: currentUser?.name || "Operator",
      type,
      reservationsCount: reservations.length,
      clientsCount: clients.length,
      trailersCount: trailers.length,
      reservations: cleanForFirestore(reservations),
      clients: cleanForFirestore(clients),
      trailers: cleanForFirestore(trailers),
    };

    // Update local state & localStorage immediately
    setBackups((prev) => {
      const next = [snapshot, ...prev];
      try {
        localStorage.setItem("localBackups", JSON.stringify(next.slice(0, 15)));
      } catch {}
      return next;
    });

    // Save to SQLite server DB (unlimited payload size)
    await dispatchAction("SAVE_BACKUP", snapshot);

    // Save to Firestore (strip large base64 photos only if total document exceeds 800KB to respect 1MB Firestore doc limit)
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
    const mode = options?.mode || "overwrite";
    const includeReservations = options?.includeReservations ?? true;
    const includeClients = options?.includeClients ?? true;
    const includeTrailers = options?.includeTrailers ?? true;
    const createSafetyBackup = options?.createSafetyBackup ?? true;

    // 1. Create automatic safety checkpoint before restoring
    if (createSafetyBackup) {
      const safetyTitle =
        language === "de"
          ? "Auto-Sicherung vor Wiederherstellung"
          : language === "en"
          ? "Auto-Backup before restore"
          : "Auto-zapis przed przywróceniem";
      await createBackupSnapshot(safetyTitle, "auto");
    }

    // 2. Compute new states
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

    // 3. Sync with SQLite backend
    await dispatchAction("RESTORE_BACKUP", {
      mode,
      reservations: includeReservations ? snapshot.reservations : undefined,
      clients: includeClients ? snapshot.clients : undefined,
      trailers: includeTrailers ? snapshot.trailers : undefined,
    });

    // 4. Sync with Cloud Firestore in batches (max 400 ops per batch)
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
          operations.push({ type: "set", col: "reservations", id: r.id, data: cleanForFirestore(r) });
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
          operations.push({ type: "set", col: "clients", id: c.id, data: cleanForFirestore(c) });
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
          operations.push({ type: "set", col: "trailers", id: t.id, data: cleanForFirestore(t) });
        }
      });
    }

    // Commit in chunks of 400 to respect Firestore 500 operation batch limit
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
    <AppContext.Provider value={{ 
      trailers, 
      clients, 
      reservations, 
      profiles,
      currentUserId,
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
      deleteTrailer,
      resetTrailers,
      updateClientBalance, 
      addClient, 
      updateClient,
      deleteClient,
      setLanguage,
      updateStatusColor,
      loginUser,
      logoutUser,
      checkTrailerAvailability,
      logReservationAction,
      backups,
      createBackupSnapshot,
      deleteBackupSnapshot,
      restoreFromBackup
    }}>
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
